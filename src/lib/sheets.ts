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

if (typeof RAW_PRIVATE_KEY_FROM_ENV === 'string' && RAW_PRIVATE_KEY_FROM_ENV.trim() !== '') {
    console.log('[SheetLib] Raw GOOGLE_PRIVATE_KEY from env (first 60 chars):', RAW_PRIVATE_KEY_FROM_ENV.substring(0, 60));
    let key = RAW_PRIVATE_KEY_FROM_ENV; // Start with the raw key

    // Step 1: Remove surrounding quotes if they encapsulate the entire string
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.substring(1, key.length - 1);
        console.log('[SheetLib] GOOGLE_PRIVATE_KEY after removing outer quotes (first 60 chars):', key.substring(0, 60));
    }
    
    // Step 2: Unescape literal "\\n" to actual newline characters. This is crucial for .env formatted keys.
    const unescapedKey = key.replace(/\\n/g, '\n');
    if (key !== unescapedKey) {
        console.log('[SheetLib] GOOGLE_PRIVATE_KEY after unescaping \\n (first 60 chars, newlines should be actual):', unescapedKey.substring(0, 60).replace(/\n/g, '[NL]'));
    } else {
        console.log('[SheetLib] GOOGLE_PRIVATE_KEY did not require \\n unescaping (first 60 chars, newlines should be actual):', unescapedKey.substring(0, 60).replace(/\n/g, '[NL]'));
    }

    // Step 3: A final trim on the unescaped key is usually safe for PEM blocks.
    const finalKeyCandidate = unescapedKey.trim();
    if (finalKeyCandidate !== unescapedKey) {
      console.log('[SheetLib] GOOGLE_PRIVATE_KEY after final trim (first 60 chars):', finalKeyCandidate.substring(0,60).replace(/\n/g, '[NL]'));
    }


    // Step 4: Perform PEM structural checks on the finalKeyCandidate
    if (
        finalKeyCandidate.startsWith('-----BEGIN PRIVATE KEY-----') &&
        finalKeyCandidate.endsWith('-----END PRIVATE KEY-----') &&
        finalKeyCandidate.includes('\n') // Ensure it's multi-line after processing
    ) {
        const coreKeyContent = finalKeyCandidate
            .substring('-----BEGIN PRIVATE KEY-----'.length, finalKeyCandidate.length - '-----END PRIVATE KEY-----'.length)
            .trim(); // Content between markers should not be empty
        
        if (coreKeyContent.length > 0) {
            PROCESSED_PRIVATE_KEY = finalKeyCandidate;
            console.log('[SheetLib] Successfully processed GOOGLE_PRIVATE_KEY. Length:', PROCESSED_PRIVATE_KEY.length);
        } else {
            console.warn(
                '[SheetLib] GOOGLE_PRIVATE_KEY processing warning: Key has PEM markers but no content in between. ' +
                `Original GOOGLE_PRIVATE_KEY (first 30 chars, trimmed): "${(RAW_PRIVATE_KEY_FROM_ENV || "").trim().substring(0, 30)}...". ` +
                'Sheet operations will likely fail.'
            );
            PROCESSED_PRIVATE_KEY = undefined;
        }
    } else {
        console.warn(
            '[SheetLib] GOOGLE_PRIVATE_KEY processing warning: Malformed structure after all processing steps. ' +
            `Final key candidate starts with: "${finalKeyCandidate.substring(0, 30).replace(/\n/g, '[NL]')}". ` +
            `Final key candidate ends with: "...${finalKeyCandidate.substring(Math.max(0, finalKeyCandidate.length - 30)).replace(/\n/g, '[NL]')}". ` +
            `Final key candidate includes newlines: ${finalKeyCandidate.includes('\n')}. ` +
            'Ensure it is a valid PEM key. If pasted from .env.local preview, it should have \\n sequences. If pasted manually, it should have actual newlines and correct PEM markers.'
        );
        PROCESSED_PRIVATE_KEY = undefined;
    }
} else {
    if (RAW_PRIVATE_KEY_FROM_ENV === undefined) {
        console.log('[SheetLib] GOOGLE_PRIVATE_KEY environment variable is not set.');
    } else { 
        console.warn('[SheetLib] GOOGLE_PRIVATE_KEY environment variable is set but is empty or only whitespace.');
    }
    PROCESSED_PRIVATE_KEY = undefined;
}

// Initial check for logging purposes; actual guard is in getSheetsClient
(() => {
  const missingVarsWarn = [];
  if (!SHEET_ID) missingVarsWarn.push('GOOGLE_SHEET_ID');
  if (!SERVICE_ACCOUNT_EMAIL) missingVarsWarn.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  
  if (!PROCESSED_PRIVATE_KEY) { 
    if (!RAW_PRIVATE_KEY_FROM_ENV || RAW_PRIVATE_KEY_FROM_ENV.trim() === '') {
       missingVarsWarn.push('GOOGLE_PRIVATE_KEY (not set or empty)');
    } else {
       missingVarsWarn.push('GOOGLE_PRIVATE_KEY (set but failed processing - see detailed logs above)');
    }
  }
  // Don't warn for SHEET_RANGE if it's using default
  // if (!SHEET_RANGE) missingVarsWarn.push('GOOGLE_SHEET_RANGE (using default, but recommend setting explicitly)');


  if (missingVarsWarn.length > 0) {
    console.warn(
      `[SheetLib] SheetSync Initialization Warning: One or more Google Sheets API configurations are problematic or missing. Sheet operations are likely to fail or use defaults. Problematic items: [${missingVarsWarn.join(', ')}]`
    );
  } else {
    console.log('[SheetLib] Initial configuration check: All essential Google Sheets API variables (ID, Email, Processed Key) appear to be present.');
  }
})();


export async function getSheetsClient(): Promise<sheets_v4.Sheets | null> {
  const errorMessages: string[] = [];
  if (!SHEET_ID) {
    errorMessages.push('GOOGLE_SHEET_ID is not set.');
  }
  if (!SERVICE_ACCOUNT_EMAIL) {
    errorMessages.push('GOOGLE_SERVICE_ACCOUNT_EMAIL is not set.');
  }
  if (!PROCESSED_PRIVATE_KEY) {
    let pkIssue = 'GOOGLE_PRIVATE_KEY is not usable: ';
    if (RAW_PRIVATE_KEY_FROM_ENV === undefined) {
      pkIssue += 'It is not set in the environment.';
    } else if (RAW_PRIVATE_KEY_FROM_ENV.trim() === '' || RAW_PRIVATE_KEY_FROM_ENV.trim() === '""' || RAW_PRIVATE_KEY_FROM_ENV.trim() === "''") {
      pkIssue += 'It is set but is empty or only whitespace.';
    } else {
      pkIssue += 'It is set but was malformed or failed processing steps (check server startup logs for "[SheetLib] GOOGLE_PRIVATE_KEY processing warning...").';
    }
    errorMessages.push(pkIssue);
  }

  if (errorMessages.length > 0) {
    console.error('[SheetLib:getSheetsClient] Cannot initialize Sheets client due to configuration issues:\n- ' + errorMessages.join('\n- '));
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: SERVICE_ACCOUNT_EMAIL!, // Non-null asserted due to checks above
        private_key: PROCESSED_PRIVATE_KEY!,  // Non-null asserted
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    // console.log('[SheetLib:getSheetsClient] GoogleAuth client instance created successfully.');
    return google.sheets({ version: 'v4', auth });
  } catch (error: any) {
    console.error('[SheetLib:getSheetsClient] CRITICAL: Error initializing Google Auth client (e.g., during GoogleAuth constructor or google.sheets call):');
    console.error('Error Message:', error.message);
    if (error.stack) console.error('Error Stack:', error.stack);
    
    const pkPreview = PROCESSED_PRIVATE_KEY 
        ? `${PROCESSED_PRIVATE_KEY.substring(0, Math.min(30, PROCESSED_PRIVATE_KEY.length)).replace(/\n/g, '[NL]')}...${PROCESSED_PRIVATE_KEY.substring(Math.max(0, PROCESSED_PRIVATE_KEY.length - Math.min(30, PROCESSED_PRIVATE_KEY.length))).replace(/\n/g, '[NL]')}` 
        : "PROCESSED_PRIVATE_KEY_IS_UNDEFINED_AT_AUTH_INIT_CATCH";
    console.error(`[SheetLib:getSheetsClient] Private key passed to GoogleAuth (preview): ${pkPreview}`);
    
    if (error.message?.includes('DECODER routines') || error.message?.includes('PEM routines') || error.message?.includes('private key') || error.message?.includes('asn1 encoding')) {
        console.error(
          '[SheetLib:getSheetsClient] Auth Init Error Detail: This specific error points to an issue with the PROCESSED_PRIVATE_KEY format or value that the underlying crypto library cannot parse. ' +
          'Ensure it is a valid PEM-formatted private key. The key might have passed initial structural checks in this file but is still not parsable by the auth library. '+
          'Check for hidden characters, ensure correct newline representation (no literal \\n, but actual newlines), and verify the key is not corrupted.'
        );
    }
    return null;
  }
}

export async function getSheetData(): Promise<SheetRow[]> {
  // console.log('[SheetLib:getSheetData] Attempting to get sheet data...');
  let sheets: sheets_v4.Sheets | null = null;
  try {
      sheets = await getSheetsClient();
  } catch (clientError: any) {
      console.error('[SheetLib:getSheetData] Error obtaining Google Sheets client in getSheetData:', clientError.message);
      if (clientError.stack) console.error(clientError.stack);
      throw new Error(`Failed to initialize Google Sheets client: ${clientError.message}`);
  }


  if (!sheets) {
     const msg = '[SheetLib:getSheetData] Google Sheets client is not available (failed to initialize or returned null). Cannot fetch data. Check server logs for client initialization errors related to credentials (SHEET_ID, SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY).';
     console.warn(msg);
     // Instead of returning [], throw an error so the UI can be more specific.
     throw new Error("Google Sheets client initialization failed. Check server logs for credential issues.");
  }
  if (!SHEET_ID){ 
    console.warn('[SheetLib:getSheetData] GOOGLE_SHEET_ID is not configured. Cannot fetch data.');
    throw new Error("GOOGLE_SHEET_ID is not configured on the server.");
  }
  if (!SHEET_RANGE){ // SHEET_RANGE has a default, so this is less likely to be the sole cause of failure
    console.warn('[SheetLib:getSheetData] GOOGLE_SHEET_RANGE is not configured (should use default). This is unexpected if it causes failure here.');
    throw new Error("GOOGLE_SHEET_RANGE is not configured on the server (though a default exists).");
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
      return []; // Empty sheet is not an error, return empty array.
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
                  // if (value !== '') { // Log only if it's non-empty and invalid
                    // console.warn(`[SheetLib:getSheetData] Invalid value "${value}" for ${header} in row. Defaulting to Medium.`);
                  // }
                  rowData[header as keyof SheetRow] = 'Medium'; // Default for invalid or empty
               }
            } else {
               rowData[header as keyof SheetRow] = cellValue;
            }
        }
      });
      // Ensure all expected headers have at least a default value if missing from sheet
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
    }).filter(row => { // Filter out rows that are effectively empty AFTER processing
      const opp = row['Donor/Opp']?.trim();
      const action = row['Action/Next Step']?.trim();
      const lead = row.Lead?.trim();
      return !!(opp || action || lead);
    });


  } catch (error: any) {
    console.error('[SheetLib:getSheetData] CRITICAL ERROR during sheets.spreadsheets.values.get API call:');
    console.error('Error Message:', error.message);
    if (error.stack) console.error('Error Stack:', error.stack);
    if (error.response?.data?.error) {
        console.error('[SheetLib:getSheetData] Google API Response Error Details:', JSON.stringify(error.response.data.error, null, 2));
    } else if (error.response?.data) {
        console.error('[SheetLib:getSheetData] Google API Response Data (if no specific error object):', JSON.stringify(error.response.data, null, 2));
    }
    
    let specificHint = `Error calling Google Sheets API: ${error.message}`;
    const commonErrorMessages: {[key: string]: string} = {
        'PERMISSION_DENIED': `Permission Denied. Ensure the service account (${SERVICE_ACCOUNT_EMAIL}) has at least 'Viewer' access to the Google Sheet (ID: ${SHEET_ID}).`,
        'Requested entity was not found': `Sheet Not Found. Verify that the GOOGLE_SHEET_ID ('${SHEET_ID}') and GOOGLE_SHEET_RANGE ('${SHEET_RANGE}') are correct and the sheet/range exists.`,
        'UNAUTHENTICATED': `Authentication Failed. This could be due to an invalid service account email, an incorrectly processed private key, or issues with the Google Cloud project setup for the service account.`,
        'invalid_grant': `Invalid Grant / Authentication Failed. Often indicates a problem with the private key (e.g., expired, revoked, malformed after processing) or system time issues.`,
        'insufficient authentication scopes': `Insufficient Authentication Scopes. The current scope is 'https://www.googleapis.com/auth/spreadsheets'. This should be sufficient for reading. Check if there are organizational policies restricting API access.`,
         'The caller does not have permission': `Permission Denied. Ensure the service account (${SERVICE_ACCOUNT_EMAIL}) has at least 'Viewer' access to the Google Sheet (ID: ${SHEET_ID}). Double check sharing settings for the sheet.`,
         'Unable to parse range': `Unable to parse range: ${SHEET_RANGE}. Check if the sheet name within the range is correct and if the range syntax (e.g., Sheet1!A:E) is valid.`
    };

    for (const key in commonErrorMessages) {
        if (error.message?.includes(key) || JSON.stringify(error.response?.data?.error)?.includes(key)) {
            specificHint = commonErrorMessages[key];
            break;
        }
    }
    console.error(`[SheetLib:getSheetData] Specific Error Hint: ${specificHint}`);
    throw new Error(specificHint); // Re-throw with a more specific message
  }
}

export async function appendSheetRow(rowData: Omit<SheetRow, ''>): Promise<boolean> {
  let sheets: sheets_v4.Sheets | null = null;
  try {
      sheets = await getSheetsClient();
  } catch (clientError: any) {
      console.error('[SheetLib:appendSheetRow] Error obtaining Google Sheets client in appendSheetRow:', clientError.message);
      return false; // Or throw, depending on how actions.ts handles it
  }

   if (!sheets) {
      console.error("[SheetLib:appendSheetRow] Error: Google Sheets client not available (failed to initialize or returned null). Cannot append row.");
      return false;
   }
   if (!SHEET_ID) { 
     console.error("[SheetLib:appendSheetRow] Error: GOOGLE_SHEET_ID is not configured. Cannot append row.");
     return false;
   }
   if (!SHEET_RANGE) { // SHEET_RANGE has a default, less critical but good to check
    console.error("[SheetLib:appendSheetRow] Error: GOOGLE_SHEET_RANGE is not configured. Cannot determine where to append row.");
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
    if (error.response?.data?.error) {
        console.error('[SheetLib:appendSheetRow] Google API Response Error Details for append:', JSON.stringify(error.response.data.error, null, 2));
        if (error.response.data.error.message?.includes('PERMISSION_DENIED')) {
             console.error(`[SheetLib:appendSheetRow] Specific Error Hint: Permission Denied. Ensure the service account (${SERVICE_ACCOUNT_EMAIL}) has 'Editor' access to the Google Sheet (ID: ${SHEET_ID}).`);
        } else if (error.response.data.error.message?.includes('Unable to parse range')) {
             console.error(`[SheetLib:appendSheetRow] Specific Error Hint: Unable to parse range: ${SHEET_RANGE}. Check if the sheet name within the range is correct for appending.`);
        }
    }
    return false; // Consider re-throwing or returning a more detailed error object for actions.ts
  }
}