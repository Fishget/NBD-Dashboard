'use server';

import { google } from 'googleapis';
import type { sheets_v4 } from 'googleapis';
import type { SheetRow } from './types'; // Import SheetRow from the new types.ts

// Environment variables
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const RAW_PRIVATE_KEY_FROM_ENV = process.env.GOOGLE_PRIVATE_KEY;
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:E'; // Default range if not specified

function processPrivateKey(rawKeyInput: string | undefined): string | null {
  if (typeof rawKeyInput !== 'string' || rawKeyInput.trim() === '') {
    console.error('[SheetLib:PK_Process] CRITICAL: GOOGLE_PRIVATE_KEY environment variable is undefined, empty, or only whitespace. This is a required credential.');
    return null;
  }

  let key = rawKeyInput.trim();

  if (key.startsWith('{') && key.endsWith('}')) {
    try {
      const parsedJson = JSON.parse(key);
      if (typeof parsedJson.private_key === 'string' && parsedJson.private_key.trim() !== '') {
        console.warn('[SheetLib:PK_Process] Detected and extracted "private_key" field from what appears to be a full JSON object pasted into GOOGLE_PRIVATE_KEY. Using extracted key.');
        key = parsedJson.private_key.trim();
      } else if (parsedJson.private_key && typeof parsedJson.private_key !== 'string') {
        console.error('[SheetLib:PK_Process] ERROR: Input looks like JSON, but "private_key" field is not a string. This will likely lead to auth failure. Proceeding with original input for further checks.');
      } else if (!parsedJson.private_key) {
         console.error('[SheetLib:PK_Process] ERROR: Input looks like JSON, but "private_key" field is missing. This will likely lead to auth failure. Proceeding with original input for further checks.');
      }
    } catch (e) {
      // Not valid JSON. This is fine if the key itself happens to start/end with {}.
      // console.log('[SheetLib:PK_Process] Input started/ended with {} but was not valid JSON or "private_key" was problematic. Processing as raw key string.');
    }
  }
  
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.substring(1, key.length - 1);
  }

  key = key.replace(/\\\\r\\\\n/g, '\r\n').replace(/\\\\n/g, '\n');
  key = key.replace(/\r\n/g, '\n').replace(/\r/g, '\n');


  if (!key.startsWith('-----BEGIN PRIVATE KEY-----')) {
    console.error('[SheetLib:PK_Process] ERROR: Processed GOOGLE_PRIVATE_KEY does NOT START with "-----BEGIN PRIVATE KEY-----". Key is malformed or incomplete. Ensure the entire key, including this header, is correctly copied.');
    return null;
  }
  if (!key.endsWith('-----END PRIVATE KEY-----')) {
    console.error('[SheetLib:PK_Process] ERROR: Processed GOOGLE_PRIVATE_KEY does NOT END with "-----END PRIVATE KEY-----". Key is malformed or incomplete. Ensure the entire key, including this footer, is correctly copied.');
    return null;
  }
  if (!key.includes('\n')) {
    console.error('[SheetLib:PK_Process] ERROR: Processed GOOGLE_PRIVATE_KEY does NOT contain any newline characters. PEM private keys are multi-line. Ensure newlines were preserved or correctly represented (e.g., as actual newlines or literal \\n in the .env string that get unescaped).');
    return null;
  }
  
  const coreKeyContent = key
    .substring('-----BEGIN PRIVATE KEY-----'.length, key.length - '-----END PRIVATE KEY-----'.length)
    .trim();

  if (coreKeyContent.length === 0) {
    console.error('[SheetLib:PK_Process] ERROR: Processed GOOGLE_PRIVATE_KEY has PEM markers but NO content in between. This key is invalid.');
    return null;
  }
  
  // console.log('[SheetLib:PK_Process] SUCCESS: GOOGLE_PRIVATE_KEY appears structurally valid after processing.');
  return key;
}

export async function getSheetsClient(): Promise<sheets_v4.Sheets | null> {
  const errorParts: string[] = [];
  if (!SHEET_ID) errorParts.push('CRITICAL: GOOGLE_SHEET_ID environment variable is not set.');
  if (!SERVICE_ACCOUNT_EMAIL) errorParts.push('CRITICAL: GOOGLE_SERVICE_ACCOUNT_EMAIL environment variable is not set.');

  const processedPrivateKey = processPrivateKey(RAW_PRIVATE_KEY_FROM_ENV);

  if (!processedPrivateKey) {
    // processPrivateKey already logged specific details.
    errorParts.push('CRITICAL: GOOGLE_PRIVATE_KEY is missing, empty, or critically malformed after processing. Check server logs above for "[SheetLib:PK_Process]" for specific details on the private key issue. Authentication will fail.');
  }

  if (errorParts.length > 0) {
    const fullMessage = '[SheetLib:getSheetsClient] CRITICAL: Cannot initialize Google Sheets client due to missing or invalid core credentials:\n- ' + errorParts.join('\n- ');
    console.error(fullMessage);
    return null;
  }

  try {
    // console.log('[SheetLib:getSheetsClient] Attempting to create GoogleAuth client with processed credentials...');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: SERVICE_ACCOUNT_EMAIL!, 
        private_key: processedPrivateKey!, 
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    // console.log('[SheetLib:getSheetsClient] GoogleAuth client instance created successfully.');
    return google.sheets({ version: 'v4', auth });
  } catch (error: any) {
    console.error('[SheetLib:getSheetsClient] CRITICAL: Error during GoogleAuth instantiation (the step before calling google.sheets API):');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.stack) console.error('Error Stack (partial):', error.stack.substring(0, 500));

    if (error.message?.includes('DECODER routines') || error.message?.includes('PEM routines') || error.message?.includes('private key') || error.message?.includes('asn1 encoding')) {
      console.error(
        '[SheetLib:getSheetsClient] Auth Init Error Detail: This error (' + error.message + ') STRONGLY indicates an issue with the PROCESSED_PRIVATE_KEY format or value. ' +
        'The key might have passed initial structural checks by `processPrivateKey` but is still not parsable by the underlying crypto library. ' +
        'Verify the original key source and ensure it is correctly copied into the GOOGLE_PRIVATE_KEY environment variable. Double-check for hidden characters or incorrect newline representations if copying from complex sources.'
      );
    }
    return null;
  }
}


export async function getSheetData(): Promise<SheetRow[] | null> {
  let sheets: sheets_v4.Sheets | null = null;
  try {
      sheets = await getSheetsClient();
  } catch (clientError: any) {
      // This catch is for truly unexpected errors *within* getSheetsClient itself,
      // though getSheetsClient is designed to return null for known config/auth issues.
      console.error('[SheetLib:getSheetData] CRITICAL: Unexpected fatal error from getSheetsClient() call itself:', clientError.message);
      if (clientError.stack) console.error(clientError.stack);
      return null; // Signifies critical config/init error
  }

  if (!sheets) {
     // getSheetsClient returning null means a configuration issue was detected and logged by it.
     console.error('[SheetLib:getSheetData] Google Sheets client is null (client initialization failed due to credential/config issues detailed above). Cannot fetch data. Returning null to indicate configuration error.');
     return null; // Signifies critical config/init error
  }

  if (!SHEET_ID){ // Should have been caught by getSheetsClient, but as a safeguard for direct calls.
    console.error('[SheetLib:getSheetData] ConfigurationError: GOOGLE_SHEET_ID is not configured on the server. Cannot fetch data. Returning null.');
    return null;
  }
  if (!SHEET_RANGE){
    // Default is used if not set, so this might be less critical unless default is also bad.
    console.warn('[SheetLib:getSheetData] Warning: GOOGLE_SHEET_RANGE is not configured on the server. Using default: ' + SHEET_RANGE); 
  }

  try {
    // console.log(`[SheetLib:getSheetData] Fetching data from SHEET_ID: ${SHEET_ID}, RANGE: ${SHEET_RANGE}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      // console.log('[SheetLib:getSheetData] No data found in the specified sheet range or sheet is empty. Returning empty array.');
      return []; // Success, but no data
    }

    const headers = rows[0].map(header => String(header).trim());
    const dataRows = rows.slice(1);

    const expectedHeaders = ['Donor/Opp', 'Action/Next Step', 'Lead', 'Priority', 'Probability'];
    const missingHeaders = expectedHeaders.filter(eh => !headers.includes(eh));
    if (missingHeaders.length > 0) {
       console.warn(`[SheetLib:getSheetData] Sheet is missing expected headers: [${missingHeaders.join(', ')}]. Current headers: [${headers.join(', ')}]. Data mapping might be incorrect or incomplete.`);
    }

    const mappedData = dataRows.map((rowArray: any[]) => {
      const rowData: Partial<SheetRow> = {};
      headers.forEach((header, index) => {
        const cellValue = rowArray[index] !== undefined && rowArray[index] !== null ? String(rowArray[index]) : '';
        const key = header as keyof SheetRow; 

        if (expectedHeaders.includes(header)) { 
            if ((key === 'Priority' || key === 'Probability')) {
               const value = cellValue.trim();
               if (['High', 'Medium', 'Low'].includes(value)) {
                  rowData[key] = value as 'High' | 'Medium' | 'Low';
               } else {
                  rowData[key] = 'Medium'; 
               }
            } else {
               rowData[key] = cellValue;
            }
        }
      });
      expectedHeaders.forEach(eh => {
        const key = eh as keyof SheetRow;
        if (!(key in rowData)) {
          if (key === 'Priority' || key === 'Probability') {
            rowData[key] = 'Medium'; 
          } else {
            rowData[key] = ''; 
          }
        }
      });
      return rowData as SheetRow;
    }).filter(row => { 
      const opp = row['Donor/Opp']?.trim();
      const action = row['Action/Next Step']?.trim();
      const lead = row.Lead?.trim();
      return !!(opp || action || lead);
    });
    return mappedData;

  } catch (error: any) {
    console.error('[SheetLib:getSheetData] CRITICAL ERROR during sheets.spreadsheets.values.get API call:');
    
    let details = 'Unknown API error during data fetch.';
    if (error.message) {
      details = error.message;
    }
    
    // Check for common Google API error structures
    if (error.response?.data?.error?.message) {
        details = `Google API Error: ${error.response.data.error.message} (Status: ${error.response.data.error.code})`;
    } else if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        details = `Google API Error: ${error.errors[0].message} (Reason: ${error.errors[0].reason})`;
    } else if (error.code) { // e.g., Node.js system errors like ENOTFOUND
        details = `System Error Code: ${error.code}, Message: ${error.message}`;
    }

    let specificHint = details; // Start with the most specific detail we found

    const gErrorCode = error.response?.data?.error?.code || (typeof error.code === 'number' ? error.code : null);


    if (details.includes('PERMISSION_DENIED') || gErrorCode === 403) {
        specificHint = `Permission Denied. Ensure the service account (${SERVICE_ACCOUNT_EMAIL || 'SERVICE_ACCOUNT_EMAIL_not_set_in_env'}) has at least 'Viewer' access to the Google Sheet (ID: ${SHEET_ID || 'SHEET_ID_not_set_in_env'}). You need to share the sheet with the service account email.`;
    } else if (details.includes('Requested entity was not found') || gErrorCode === 404) {
        specificHint = `Sheet Not Found. Verify that the GOOGLE_SHEET_ID ('${SHEET_ID || 'SHEET_ID_not_set_in_env'}') is correct and the sheet exists. Also check if the GOOGLE_SHEET_RANGE ('${SHEET_RANGE || 'Using default range'}') is valid for this sheet (e.g., the sheet name in the range exists).`;
    } else if (details.includes('INVALID_ARGUMENT') || details.includes('Unable to parse range') || gErrorCode === 400) {
        specificHint = `Invalid Argument or Range. The GOOGLE_SHEET_RANGE ('${SHEET_RANGE || 'Using default range'}') is likely invalid or does not exist in the sheet. Ensure it's in 'SheetName!A1:E' format. The error might also indicate a malformed Sheet ID.`;
    } else if (details.includes('UNAUTHENTICATED') || gErrorCode === 401) {
        specificHint = `Authentication Failed. The service account credentials may be invalid or expired. This is less likely if client initialization succeeded but could indicate a permissions revocation or token issue. Check the validity of your service account key.`;
    } else if (details.includes('ENOTFOUND') || details.includes('EAI_AGAIN')) {
        specificHint = `Network Error: Could not resolve hostname (e.g., www.googleapis.com). Check server's internet connectivity and DNS resolution. Error: ${error.message}`;
    } else if (gErrorCode === 500 || gErrorCode === 503) {
        specificHint = `Google API Server Error (Status: ${gErrorCode}). This is likely a temporary issue on Google's side. Try again later. Error: ${details}`;
    }


    console.error(`[SheetLib:getSheetData] Full Error Object Structure (if available from Google API):`, JSON.stringify(error.response?.data || error.errors || error, null, 2));
    console.error(`[SheetLib:getSheetData] Processed Error Details from API call: ${details}`);
    console.error(`[SheetLib:getSheetData] Specific User Hint for API call failure: ${specificHint}. Returning empty array to prevent UI crash, but data fetch failed.`);
    return []; // API call failed, return empty array. Config was likely okay if client initialized.
  }
}

export async function appendSheetRow(rowData: Omit<SheetRow, ''>): Promise<boolean> {
  let sheets: sheets_v4.Sheets | null = null;
  try {
      sheets = await getSheetsClient();
  } catch (clientError: any) {
      console.error('[SheetLib:appendSheetRow] Error obtaining Google Sheets client in appendSheetRow:', clientError.message);
      return false; 
  }

   if (!sheets) {
      console.error("[SheetLib:appendSheetRow] Google Sheets client not available for appendSheetRow (client initialization failed due to credential/config issues detailed above). Cannot append data.");
      return false; 
   }
   if (!SHEET_ID) { 
    console.error("[SheetLib:appendSheetRow] ConfigurationError: GOOGLE_SHEET_ID is not configured for appendSheetRow.");
    return false;
   }
   if (!SHEET_RANGE) { 
    console.error("[SheetLib:appendSheetRow] ConfigurationError: GOOGLE_SHEET_RANGE is not configured for appendSheetRow (though it has a default).");
    // Allow continuation if default is used, but log.
   }


  const values = [
    rowData['Donor/Opp'],
    rowData['Action/Next Step'],
    rowData.Lead,
    rowData.Priority,
    rowData.Probability
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE, 
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [values],
      },
    });
    // console.log('[SheetLib:appendSheetRow] Row appended successfully to Google Sheet.');
    return true;
  } catch (error: any) {
    console.error('[SheetLib:appendSheetRow] Error appending sheet row via Google Sheets API:');
     let details = 'Unknown API error during data append.';
    if (error.message) {
      details = error.message;
    }
     if (error.response?.data?.error?.message) {
        details = `Google API Error: ${error.response.data.error.message} (Status: ${error.response.data.error.code})`;
    } else if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        details = `Google API Error: ${error.errors[0].message} (Reason: ${error.errors[0].reason})`;
    }
    console.error(`[SheetLib:appendSheetRow] Full Error Object:`, JSON.stringify(error.response?.data || error.errors || error, null, 2));
    console.error(`[SheetLib:appendSheetRow] Processed Error Details: ${details}`);
    return false;
  }
}

