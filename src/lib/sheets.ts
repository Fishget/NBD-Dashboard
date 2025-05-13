
'use server';

import { google } from 'googleapis';
import type { sheets_v4 } from 'googleapis';

// Define the structure of a row in your sheet
export interface SheetRow {
  'Donor/Opp': string;
  'Action/Next Step': string;
  Lead: string;
  Priority: 'High' | 'Medium' | 'Low';
  Probability: 'High' | 'Medium' | 'Low';
}

// Environment variables
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const RAW_PRIVATE_KEY_FROM_ENV = process.env.GOOGLE_PRIVATE_KEY;
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:E'; // Default range if not specified

let PROCESSED_PRIVATE_KEY: string | undefined;

// --- Private Key Processing ---
if (typeof RAW_PRIVATE_KEY_FROM_ENV === 'string' && RAW_PRIVATE_KEY_FROM_ENV.trim() !== '') {
    console.log('[SheetLib:PK_Process] Raw GOOGLE_PRIVATE_KEY received (type: string, not empty/whitespace). Length:', RAW_PRIVATE_KEY_FROM_ENV.length);
    // console.log('[SheetLib:PK_Process] Raw GOOGLE_PRIVATE_KEY (first 60 chars, newlines as is):', RAW_PRIVATE_KEY_FROM_ENV.substring(0, 60));
    
    let key = RAW_PRIVATE_KEY_FROM_ENV;

    // Step 1: Remove surrounding quotes IF they encapsulate the ENTIRE string.
    // This handles cases like GOOGLE_PRIVATE_KEY="-----BEGIN...\n...END-----" in .env
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.substring(1, key.length - 1);
        // console.log('[SheetLib:PK_Process] After stripping outer quotes (if any). Length:', key.length, '(first 60 chars):', key.substring(0, 60));
    }
    
    // Step 2: Unescape literal "\\n" sequences to actual newline characters "\n".
    // This is crucial if the key was stored as a JSON-escaped string.
    const unescapedKey = key.replace(/\\n/g, '\n');
    if (unescapedKey !== key) {
      // console.log('[SheetLib:PK_Process] After unescaping \\n to actual newlines. Length:', unescapedKey.length, '(first 60 chars, newlines as [NL]):', unescapedKey.substring(0, 60).replace(/\n/g, '[NL]'));
    } else {
      // console.log('[SheetLib:PK_Process] No \\n sequences found to unescape. Length:', unescapedKey.length, '(first 60 chars, newlines as [NL]):', unescapedKey.substring(0, 60).replace(/\n/g, '[NL]'));
    }

    // Step 3: Trim whitespace from the (potentially) unescaped key.
    // PEM keys are generally tolerant of this, but it helps clean up.
    const finalKeyCandidate = unescapedKey.trim();
    if (finalKeyCandidate !== unescapedKey) {
        // console.log('[SheetLib:PK_Process] After final trim. Length:', finalKeyCandidate.length, '(first 60 chars, newlines as [NL]):', finalKeyCandidate.substring(0, 60).replace(/\n/g, '[NL]'));
    }

    // Step 4: Perform PEM structural checks.
    if (
        finalKeyCandidate.startsWith('-----BEGIN PRIVATE KEY-----') &&
        finalKeyCandidate.endsWith('-----END PRIVATE KEY-----') &&
        finalKeyCandidate.includes('\n') // Essential for multi-line PEM keys
    ) {
        const coreKeyContent = finalKeyCandidate
            .substring('-----BEGIN PRIVATE KEY-----'.length, finalKeyCandidate.length - '-----END PRIVATE KEY-----'.length)
            .trim(); // Content between markers should not be empty
        
        if (coreKeyContent.length > 0) {
            PROCESSED_PRIVATE_KEY = finalKeyCandidate;
            console.log('[SheetLib:PK_Process] SUCCESS: GOOGLE_PRIVATE_KEY processed and structurally validated. Ready for use. Length:', PROCESSED_PRIVATE_KEY.length);
        } else {
            console.warn(
                '[SheetLib:PK_Process] WARNING: GOOGLE_PRIVATE_KEY has PEM markers but NO content in between. This key is invalid. ' +
                `Original RAW_PRIVATE_KEY (first 30 chars, trimmed): "${(RAW_PRIVATE_KEY_FROM_ENV || "").trim().substring(0, 30)}...". ` +
                'Sheet operations will fail.'
            );
            PROCESSED_PRIVATE_KEY = undefined;
        }
    } else {
        console.warn(
            '[SheetLib:PK_Process] WARNING: GOOGLE_PRIVATE_KEY is malformed after processing. It does NOT meet PEM structural requirements (missing markers or newlines). ' +
            `Final candidate started with: "${finalKeyCandidate.substring(0, 30).replace(/\n/g, '[NL]')}". ` +
            `Ended with: "...${finalKeyCandidate.substring(Math.max(0, finalKeyCandidate.length - 30)).replace(/\n/g, '[NL]')}". ` +
            `Contained newlines: ${finalKeyCandidate.includes('\n')}. ` +
            'Ensure it is a valid PEM key. Sheet operations will fail.'
        );
        PROCESSED_PRIVATE_KEY = undefined;
    }
} else {
    if (RAW_PRIVATE_KEY_FROM_ENV === undefined) {
        console.warn('[SheetLib:PK_Process] GOOGLE_PRIVATE_KEY environment variable is NOT SET.');
    } else { 
        console.warn('[SheetLib:PK_Process] GOOGLE_PRIVATE_KEY environment variable IS SET but is EMPTY or only WHITESPACE. This is invalid.');
    }
    PROCESSED_PRIVATE_KEY = undefined;
}
// --- End Private Key Processing ---

// Initial check for logging purposes; actual guard is in getSheetsClient
(() => {
  const missingVarsWarn = [];
  if (!SHEET_ID) missingVarsWarn.push('GOOGLE_SHEET_ID');
  if (!SERVICE_ACCOUNT_EMAIL) missingVarsWarn.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  
  if (!PROCESSED_PRIVATE_KEY) { 
     missingVarsWarn.push('PROCESSED_PRIVATE_KEY (failed processing - see detailed [SheetLib:PK_Process] logs above)');
  }
  // Not warning for SHEET_RANGE if using default.

  if (missingVarsWarn.length > 0) {
    console.warn(
      `[SheetLib:InitCheck] WARNING: One or more Google Sheets API configurations are problematic. Sheet operations are likely to fail. Problematic items: [${missingVarsWarn.join(', ')}]`
    );
  } else {
    console.log('[SheetLib:InitCheck] SUCCESS: All essential Google Sheets API variables (ID, Email, Processed Key) appear to be present and structurally valid.');
  }
})();


export async function getSheetsClient(): Promise<sheets_v4.Sheets | null> {
  const errorParts: string[] = [];
  if (!SHEET_ID) {
    errorParts.push('GOOGLE_SHEET_ID is not set.');
  }
  if (!SERVICE_ACCOUNT_EMAIL) {
    errorParts.push('GOOGLE_SERVICE_ACCOUNT_EMAIL is not set.');
  }
  if (!PROCESSED_PRIVATE_KEY) {
    // Detailed reason already logged by PK_Process block
    errorParts.push('PROCESSED_PRIVATE_KEY is unusable (not set, empty, or failed processing - check server logs for "[SheetLib:PK_Process]" details).');
  }

  if (errorParts.length > 0) {
    const fullMessage = '[SheetLib:getSheetsClient] Cannot initialize Sheets client due to configuration issues:\n- ' + errorParts.join('\n- ');
    console.error(fullMessage);
    // Do not throw here; return null so getSheetData can throw a more user-facing error.
    return null;
  }

  try {
    // console.log('[SheetLib:getSheetsClient] Attempting to create GoogleAuth client with processed credentials.');
    // console.log(`[SheetLib:getSheetsClient] Using Service Account Email: ${SERVICE_ACCOUNT_EMAIL}`);
    // console.log(`[SheetLib:getSheetsClient] Using Processed Private Key (first 60 chars, newlines as [NL]): ${PROCESSED_PRIVATE_KEY!.substring(0, 60).replace(/\n/g, '[NL]')}`);
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: SERVICE_ACCOUNT_EMAIL!, 
        private_key: PROCESSED_PRIVATE_KEY!,  
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    // console.log('[SheetLib:getSheetsClient] GoogleAuth client instance created successfully.');
    return google.sheets({ version: 'v4', auth });
  } catch (error: any) {
    console.error('[SheetLib:getSheetsClient] CRITICAL: Error initializing Google Auth client (e.g., during GoogleAuth constructor or google.sheets call):');
    console.error('Error Message:', error.message);
    if (error.stack) console.error('Error Stack:', error.stack);
        
    if (error.message?.includes('DECODER routines') || error.message?.includes('PEM routines') || error.message?.includes('private key') || error.message?.includes('asn1 encoding')) {
        console.error(
          '[SheetLib:getSheetsClient] Auth Init Error Detail: This specific error indicates an issue with the PROCESSED_PRIVATE_KEY format or value that the underlying crypto library cannot parse. ' +
          'This can happen even if it passed initial structural checks if the key content itself is corrupted or not truly PEM. ' +
          'Verify the original key source.'
        );
    }
    return null; // Return null to be handled by getSheetData
  }
}

export async function getSheetData(): Promise<SheetRow[]> {
  // console.log('[SheetLib:getSheetData] Attempting to get sheet data...');
  let sheets: sheets_v4.Sheets | null = null;
  try {
      sheets = await getSheetsClient();
  } catch (clientError: any) {
      // This catch block is somewhat redundant if getSheetsClient itself handles its errors and returns null.
      // However, it's a safeguard for unexpected errors during the await getSheetsClient() call itself.
      console.error('[SheetLib:getSheetData] Unexpected error while awaiting getSheetsClient():', clientError.message);
      if (clientError.stack) console.error(clientError.stack);
      throw new Error(`ConfigurationError: Failed to obtain Google Sheets client instance: ${clientError.message}. Check server logs for details.`);
  }

  if (!sheets) {
     const msg = `ConfigurationError: Google Sheets client failed to initialize. This is usually due to missing or invalid credentials (GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY) or a malformed private key. Please review server logs for detailed messages from '[SheetLib:getSheetsClient]' or '[SheetLib:PK_Process]' for specific issues.`;
     console.error('[SheetLib:getSheetData] ' + msg);
     throw new Error(msg);
  }

  // These should ideally be caught by getSheetsClient returning null, but as a safeguard:
  if (!SHEET_ID){ 
    const msg = "ConfigurationError: GOOGLE_SHEET_ID is not configured on the server. Cannot fetch data.";
    console.error('[SheetLib:getSheetData] ' + msg);
    throw new Error(msg);
  }
  if (!SHEET_RANGE){ 
    const msg = "ConfigurationError: GOOGLE_SHEET_RANGE is not configured on the server (though a default exists). Cannot fetch data.";
    console.error('[SheetLib:getSheetData] ' + msg);
    throw new Error(msg);
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

    return dataRows.map((row) => {
      const rowData: Partial<SheetRow> = {};
      headers.forEach((header, index) => {
        const cellValue = row[index] !== undefined && row[index] !== null ? String(row[index]) : ''; 

        if (expectedHeaders.includes(header)) { 
            if ((header === 'Priority' || header === 'Probability')) {
               const value = cellValue.trim();
               if (['High', 'Medium', 'Low'].includes(value)) {
                  rowData[header as keyof SheetRow] = value as 'High' | 'Medium' | 'Low';
               } else {
                  rowData[header as keyof SheetRow] = 'Medium'; 
               }
            } else {
               rowData[header as keyof SheetRow] = cellValue;
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

  } catch (error: any) {
    console.error('[SheetLib:getSheetData] CRITICAL ERROR during sheets.spreadsheets.values.get API call:');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.code) console.error('Error Code:', error.code);
    if (error.errors) console.error('Error Details (from googleapis error object):', JSON.stringify(error.errors, null, 2));
    if (error.stack) console.error('Error Stack:', error.stack);
    
    let specificHint = `APIError: Error calling Google Sheets API (spreadsheets.values.get): ${error.message}`;
    const apiError = error.errors?.[0]; // Google API errors often have a structured error object

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
    throw new Error(specificHint); 
  }
}

export async function appendSheetRow(rowData: Omit<SheetRow, ''>): Promise<boolean> {
  let sheets: sheets_v4.Sheets | null = null;
  try {
      sheets = await getSheetsClient();
  } catch (clientError: any) {
      console.error('[SheetLib:appendSheetRow] Error obtaining Google Sheets client in appendSheetRow:', clientError.message);
      // For actions, it's better to throw or return a structured error.
      // For now, we'll let the next check handle the null `sheets` client.
  }

   if (!sheets) {
      const msg = `ConfigurationError: Google Sheets client not available for appendSheetRow. Check server logs for initialization errors.`;
      console.error("[SheetLib:appendSheetRow] " + msg);
      // This should be converted to a FormState error in actions.ts
      throw new Error(msg); 
   }
   // Safeguards, though getSheetsClient should handle these by returning null if misconfigured
   if (!SHEET_ID) { throw new Error("ConfigurationError: GOOGLE_SHEET_ID is not configured for appendSheetRow."); }
   if (!SHEET_RANGE) { throw new Error("ConfigurationError: GOOGLE_SHEET_RANGE is not configured for appendSheetRow."); }


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
    console.error('Error Message:', error.message);
    const apiError = error.errors?.[0];
    let specificHint = `APIError: Failed to append data to Google Sheet: ${error.message}`;

    if (apiError) {
        if (apiError.reason === 'PERMISSION_DENIED' || apiError.message?.includes('does not have permission')) {
            specificHint = `APIError: Permission Denied for appending. Ensure the service account (${SERVICE_ACCOUNT_EMAIL}) has 'Editor' access to the Google Sheet (ID: ${SHEET_ID}).`;
        } else if (apiError.message?.includes('Unable to parse range')) {
             specificHint = `APIError: Invalid Range for appending. The range '${SHEET_RANGE}' could not be parsed or is not suitable for appending.`;
        }
    }
    console.error('[SheetLib:appendSheetRow] Specific Error Hint for append: ' + specificHint);
    // For actions.ts, throwing the error is better so it can be converted to FormState
    throw new Error(specificHint);
  }
}

    