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
    console.error('[SheetLib:PK_Process] Raw GOOGLE_PRIVATE_KEY is undefined, empty, or whitespace.');
    return null;
  }

  let key = rawKeyInput.trim();

  // Attempt to detect if the entire JSON was pasted
  if (key.startsWith('{') && key.endsWith('}')) {
    try {
      const parsedJson = JSON.parse(key);
      if (typeof parsedJson.private_key === 'string' && parsedJson.private_key.trim() !== '') {
        console.warn('[SheetLib:PK_Process] Detected and extracted private_key from what appears to be a full JSON object pasted into GOOGLE_PRIVATE_KEY.');
        key = parsedJson.private_key.trim();
      } else if (parsedJson.private_key && typeof parsedJson.private_key !== 'string') {
        console.error('[SheetLib:PK_Process] Input looks like JSON, but "private_key" field is not a string.');
        // Continue with the original key, it might be a very unusual key format
      } else if (!parsedJson.private_key){
         console.error('[SheetLib:PK_Process] Input looks like JSON, but "private_key" field is missing.');
         // Continue with the original key
      }
    } catch (e) {
      // Not valid JSON. Proceed assuming it's not JSON and the key itself might start/end with {}.
      // console.log('[SheetLib:PK_Process] Input started/ended with {} but was not valid JSON or "private_key" was problematic. Processing as raw key string.');
    }
  }
  
  // Remove surrounding quotes if they encapsulate the ENTIRE string.
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.substring(1, key.length - 1);
  }

  // Unescape literal "\\n" and "\\r\\n" to actual newline characters "\n".
  key = key.replace(/\\\\r\\\\n/g, '\r\n').replace(/\\\\n/g, '\n');
  // Normalize all newlines (CRLF, CR) to LF.
  key = key.replace(/\r\n/g, '\n').replace(/\r/g, '\n');


  // Perform PEM structural checks.
  if (
    key.startsWith('-----BEGIN PRIVATE KEY-----') &&
    key.endsWith('-----END PRIVATE KEY-----') &&
    key.includes('\n') // Essential for multi-line PEM keys
  ) {
    const coreKeyContent = key
      .substring('-----BEGIN PRIVATE KEY-----'.length, key.length - '-----END PRIVATE KEY-----'.length)
      .trim();

    if (coreKeyContent.length > 0) {
      // console.log('[SheetLib:PK_Process] SUCCESS: GOOGLE_PRIVATE_KEY processed and structurally validated.');
      return key;
    } else {
      console.error('[SheetLib:PK_Process] ERROR: GOOGLE_PRIVATE_KEY has PEM markers but NO content in between. This key is invalid.');
      return null;
    }
  } else {
    console.error(
      '[SheetLib:PK_Process] ERROR: GOOGLE_PRIVATE_KEY is malformed. It does NOT meet PEM structural requirements (missing markers, missing newlines, or other issues). ' +
      `Ensure it is a valid PEM key. Starts with: "${key.substring(0,30).replace(/\n/g,'[NL]')}", Ends with: "...${key.substring(key.length-30).replace(/\n/g,'[NL]')}", Includes newlines: ${key.includes('\n')}`
    );
    return null;
  }
}

export async function getSheetsClient(): Promise<sheets_v4.Sheets | null> {
  const errorParts: string[] = [];
  if (!SHEET_ID) errorParts.push('GOOGLE_SHEET_ID is not set.');
  if (!SERVICE_ACCOUNT_EMAIL) errorParts.push('GOOGLE_SERVICE_ACCOUNT_EMAIL is not set.');

  const processedPrivateKey = processPrivateKey(RAW_PRIVATE_KEY_FROM_ENV);

  if (!processedPrivateKey) {
    // processPrivateKey already logged the detailed reason.
    errorParts.push('GOOGLE_PRIVATE_KEY is missing, malformed, or failed processing (see server logs for "[SheetLib:PK_Process]" details).');
  }

  if (errorParts.length > 0) {
    const fullMessage = '[SheetLib:getSheetsClient] Cannot initialize Sheets client due to configuration issues:\n- ' + errorParts.join('\n- ');
    console.error(fullMessage);
    return null;
  }

  try {
    // console.log('[SheetLib:getSheetsClient] Attempting to create GoogleAuth client with processed credentials.');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: SERVICE_ACCOUNT_EMAIL!, // Known to be non-null from checks above
        private_key: processedPrivateKey!, // Known to be non-null from checks above
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    // console.log('[SheetLib:getSheetsClient] GoogleAuth client instance created successfully.');
    return google.sheets({ version: 'v4', auth });
  } catch (error: any) {
    // This is CRITICAL for catching the DECODER error from google.auth.GoogleAuth
    console.error('[SheetLib:getSheetsClient] CRITICAL: Error during GoogleAuth instantiation or google.sheets call:');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message); // This will include "DECODER routines" if it's that specific error
    if (error.stack) console.error('Error Stack:', error.stack);

    if (error.message?.includes('DECODER routines') || error.message?.includes('PEM routines') || error.message?.includes('private key') || error.message?.includes('asn1 encoding')) {
      console.error(
        '[SheetLib:getSheetsClient] Auth Init Error Detail: This error (' + error.message + ') strongly indicates an issue with the PROCESSED_PRIVATE_KEY format or value. ' +
        'The key might have passed initial structural checks by `processPrivateKey` but is still not parsable by the underlying crypto library. ' +
        'Verify the original key source and ensure it is correctly copied into the GOOGLE_PRIVATE_KEY environment variable.'
      );
    }
    return null; // Explicitly return null on auth error
  }
}

export async function getSheetData(): Promise<SheetRow[]> {
  // console.log('[SheetLib:getSheetData] Attempting to get sheet data...');
  let sheets: sheets_v4.Sheets | null = null;
  try {
      sheets = await getSheetsClient();
  } catch (clientError: any) {
      // This catch is mostly for unexpected errors *within* getSheetsClient itself,
      // though getSheetsClient is designed to return null, not throw for config/auth issues.
      console.error('[SheetLib:getSheetData] Unexpected error from getSheetsClient() call:', clientError.message);
      if (clientError.stack) console.error(clientError.stack);
      return []; // Graceful fallback
  }

  if (!sheets) {
     // getSheetsClient would have already logged the detailed reason for being null.
     console.error('[SheetLib:getSheetData] Google Sheets client is null, likely due to configuration or authentication issues previously logged. Returning empty data.');
     return []; 
  }

  if (!SHEET_ID){
    const msg = "ConfigurationError: GOOGLE_SHEET_ID is not configured on the server. Cannot fetch data. Returning empty data.";
    console.error('[SheetLib:getSheetData] ' + msg);
    return [];
  }
  if (!SHEET_RANGE){
    const msg = "ConfigurationError: GOOGLE_SHEET_RANGE is not configured on the server (though a default exists). Cannot fetch data. Returning empty data.";
    // Default is used if not set, so this might be less critical unless default is also bad.
    console.warn('[SheetLib:getSheetData] ' + msg); 
  }

  try {
    // console.log(`[SheetLib:getSheetData] Fetching data from SHEET_ID: ${SHEET_ID}, RANGE: ${SHEET_RANGE}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      // console.log('[SheetLib:getSheetData] No data found in the specified sheet range or sheet is empty.');
      return [];
    }

    const headers = rows[0].map(header => String(header).trim());
    const dataRows = rows.slice(1);

    const expectedHeaders = ['Donor/Opp', 'Action/Next Step', 'Lead', 'Priority', 'Probability'];
    const missingHeaders = expectedHeaders.filter(eh => !headers.includes(eh));
    if (missingHeaders.length > 0) {
       console.warn(`[SheetLib:getSheetData] Sheet is missing expected headers: [${missingHeaders.join(', ')}]. Current headers: [${headers.join(', ')}]. Data mapping might be incorrect or incomplete.`);
    }

    return dataRows.map((rowArray: any[]) => {
      const rowData: Partial<SheetRow> = {};
      headers.forEach((header, index) => {
        const cellValue = rowArray[index] !== undefined && rowArray[index] !== null ? String(rowArray[index]) : '';
        const key = header as keyof SheetRow; // Assume header matches a key for simplicity here

        if (expectedHeaders.includes(header)) { // Process only if header is expected
            if ((key === 'Priority' || key === 'Probability')) {
               const value = cellValue.trim();
               if (['High', 'Medium', 'Low'].includes(value)) {
                  rowData[key] = value as 'High' | 'Medium' | 'Low';
               } else {
                  // Default to 'Medium' if value is unexpected or empty for these specific fields
                  rowData[key] = 'Medium'; 
               }
            } else {
               rowData[key] = cellValue;
            }
        }
      });
      // Ensure all expected keys exist, default if not in sheet headers or if original header was missing
      expectedHeaders.forEach(eh => {
        const key = eh as keyof SheetRow;
        if (!(key in rowData)) {
          if (key === 'Priority' || key === 'Probability') {
            rowData[key] = 'Medium'; // Default for missing priority/probability columns
          } else {
            rowData[key] = ''; // Default for other missing columns
          }
        }
      });
      return rowData as SheetRow;
    }).filter(row => { // Filter out rows that are completely empty or have no essential data
      const opp = row['Donor/Opp']?.trim();
      const action = row['Action/Next Step']?.trim();
      const lead = row.Lead?.trim();
      // Only keep row if at least one of these key fields has content
      return !!(opp || action || lead);
    });

  } catch (error: any) {
    console.error('[SheetLib:getSheetData] CRITICAL ERROR during sheets.spreadsheets.values.get API call:');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.code) console.error('Error Code:', error.code);
    if (error.errors) console.error('Error Details (from googleapis error object):', JSON.stringify(error.errors, null, 2));
    if (error.stack) console.error('Error Stack:', error.stack);

    let specificHint = `APIError: Error calling Google Sheets API (spreadsheets.values.get): ${error.message}`;
    const apiError = error.errors?.[0];

    if (apiError) {
        if (apiError.reason === 'PERMISSION_DENIED' || apiError.message?.includes('does not have permission')) {
            specificHint = `APIError: Permission Denied. Ensure the service account (${SERVICE_ACCOUNT_EMAIL}) has at least 'Viewer' access to the Google Sheet (ID: ${SHEET_ID}). Check the sheet's sharing settings.`;
        } else if (apiError.reason === 'notFound' || apiError.message?.includes('Requested entity was not found')) {
            specificHint = `APIError: Sheet Not Found or Range Not Found. Verify that the GOOGLE_SHEET_ID ('${SHEET_ID}') is correct and the sheet exists. Also, check if the GOOGLE_SHEET_RANGE ('${SHEET_RANGE}') is valid for this sheet.`;
        } else if (apiError.message?.includes('Unable to parse range')) {
            specificHint = `APIError: Invalid Range. The range '${SHEET_RANGE}' could not be parsed. Ensure the sheet name and cell references are correct (e.g., 'Sheet1!A:E').`;
        }
    } else if (error.message?.includes('UNAUTHENTICATED')) {
        specificHint = `APIError: Authentication Failed. This usually indicates a problem with the processed service account credentials. Re-verify the private key and service account email.`;
    }

    console.error(`[SheetLib:getSheetData] Specific Error Hint: ${specificHint}`);
    return []; // Return empty array instead of throwing
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
      console.error("[SheetLib:appendSheetRow] Google Sheets client not available for appendSheetRow. Check server logs for initialization errors. This usually means credentials in .env.local are missing or invalid.");
      return false; 
   }
   if (!SHEET_ID) { 
    console.error("[SheetLib:appendSheetRow] ConfigurationError: GOOGLE_SHEET_ID is not configured for appendSheetRow.");
    return false;
   }
   if (!SHEET_RANGE) { 
    console.error("[SheetLib:appendSheetRow] ConfigurationError: GOOGLE_SHEET_RANGE is not configured for appendSheetRow.");
    return false;
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
      range: SHEET_RANGE, // Using SHEET_RANGE for appending as well, ensure it's appropriate for append (e.g. just sheet name or specific start for table)
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
    console.error('Error Message:', error.message);
    const apiError = error.errors?.[0];
    let specificHint = `APIError: Failed to append data to Google Sheet: ${error.message}`;

    if (apiError) {
        if (apiError.reason === 'PERMISSION_DENIED' || apiError.message?.includes('does not have permission')) {
            specificHint = `APIError: Permission Denied for appending. Ensure the service account (${SERVICE_ACCOUNT_EMAIL}) has 'Editor' access to the Google Sheet (ID: ${SHEET_ID}).`;
        } else if (apiError.message?.includes('Unable to parse range')) {
             specificHint = `APIError: Invalid Range for appending. The range '${SHEET_RANGE}' could not be parsed or is not suitable for appending. For appending, often just the sheet name is enough (e.g., 'Sheet1') or a range like 'Sheet1!A1'.`;
        }
    }
    console.error('[SheetLib:appendSheetRow] Specific Error Hint for append: ' + specificHint);
    return false;
  }
}