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
    let key = RAW_PRIVATE_KEY_FROM_ENV.trim();
    
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.substring(1, key.length - 1);
    }

    const unescapedKeyRaw = key.replace(/\\n/g, '\n');
    const unescapedKey = unescapedKeyRaw.trim(); 

    if (
        unescapedKey.startsWith('-----BEGIN PRIVATE KEY-----') &&
        unescapedKey.endsWith('-----END PRIVATE KEY-----') &&
        unescapedKey.includes('\n') 
    ) {
        const coreKeyContent = unescapedKey
            .substring('-----BEGIN PRIVATE KEY-----'.length, unescapedKey.length - '-----END PRIVATE KEY-----'.length)
            .trim();
        if (coreKeyContent.length > 0) {
            PROCESSED_PRIVATE_KEY = unescapedKey;
            // console.log('Successfully processed GOOGLE_PRIVATE_KEY.');
        } else {
            console.warn(
                'GOOGLE_PRIVATE_KEY processing warning: Key has PEM markers but no content in between. ' +
                `Original GOOGLE_PRIVATE_KEY (first 30 chars, trimmed): "${(RAW_PRIVATE_KEY_FROM_ENV || "").trim().substring(0, 30)}...". ` +
                'Sheet operations will likely fail.'
            );
            PROCESSED_PRIVATE_KEY = undefined;
        }
    } else {
        console.warn(
            'GOOGLE_PRIVATE_KEY processing warning: Malformed structure. ' +
            `Key starts with (after processing): "${unescapedKey.substring(0, 30)}...". ` +
            `Key ends with (after processing): "...${unescapedKey.substring(Math.max(0, unescapedKey.length - 30))}". ` +
            `Includes newlines after processing: ${unescapedKey.includes('\n')}. ` +
            `Original GOOGLE_PRIVATE_KEY (first 30 chars, trimmed): "${(RAW_PRIVATE_KEY_FROM_ENV || "").trim().substring(0, 30)}...". ` +
            'Ensure it is a valid PEM key with actual newlines between markers or correctly escaped \\n sequences.'
        );
        PROCESSED_PRIVATE_KEY = undefined;
    }
} else {
    if (RAW_PRIVATE_KEY_FROM_ENV === undefined) {
        // This is expected if not set. getSheetsClient will handle logging the final "not set" error.
    } else { // It's set but empty or whitespace
        console.warn('GOOGLE_PRIVATE_KEY environment variable is set but is empty or only whitespace. Sheet operations requiring auth will fail.');
    }
    PROCESSED_PRIVATE_KEY = undefined;
}

// Initial check for logging purposes; actual guard is in getSheetsClient
(() => {
  const missingVarsWarn = [];
  if (!SHEET_ID) missingVarsWarn.push('GOOGLE_SHEET_ID');
  if (!SERVICE_ACCOUNT_EMAIL) missingVarsWarn.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  
  if (!PROCESSED_PRIVATE_KEY) { // Check the processed key status
    if (!RAW_PRIVATE_KEY_FROM_ENV || RAW_PRIVATE_KEY_FROM_ENV.trim() === '') {
       missingVarsWarn.push('GOOGLE_PRIVATE_KEY (not set or empty)');
    } else {
       missingVarsWarn.push('GOOGLE_PRIVATE_KEY (set but failed processing - see detailed warning above)');
    }
  }
  if (!SHEET_RANGE) missingVarsWarn.push('GOOGLE_SHEET_RANGE (using default, but recommend setting explicitly)');


  if (missingVarsWarn.length > 0) {
    console.warn(
      `SheetSync Initialization Warning: One or more Google Sheets API configurations are problematic or missing. Sheet operations are likely to fail or use defaults. Problematic items: [${missingVarsWarn.join(', ')}]`
    );
  }
})();


export async function getSheetsClient(): Promise<sheets_v4.Sheets | null> {
  if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PROCESSED_PRIVATE_KEY) {
    const errorParts = ['Cannot initialize Sheets client due to missing or invalid credentials:'];
    if (!SHEET_ID) errorParts.push('- GOOGLE_SHEET_ID is not set.');
    if (!SERVICE_ACCOUNT_EMAIL) errorParts.push('- GOOGLE_SERVICE_ACCOUNT_EMAIL is not set.');
    
    if (!PROCESSED_PRIVATE_KEY) {
      if (!RAW_PRIVATE_KEY_FROM_ENV) errorParts.push('- GOOGLE_PRIVATE_KEY is not set in environment.');
      else if (RAW_PRIVATE_KEY_FROM_ENV.trim() === '' || RAW_PRIVATE_KEY_FROM_ENV.trim() === '""' || RAW_PRIVATE_KEY_FROM_ENV.trim() === "''") errorParts.push('- GOOGLE_PRIVATE_KEY is set in environment but is empty or only whitespace.');
      else errorParts.push('- GOOGLE_PRIVATE_KEY is set in environment but was malformed or failed structural/PEM checks (see previous logs for details on processing).');
    }
    console.error(errorParts.join('\n  '));
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: SERVICE_ACCOUNT_EMAIL,
        private_key: PROCESSED_PRIVATE_KEY, 
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    // console.log('GoogleAuth client instance created.');
    return google.sheets({ version: 'v4', auth });
  } catch (error: any) {
    console.error('CRITICAL: Error initializing Google Auth client (e.g., during GoogleAuth constructor or google.sheets call):');
    console.error('Error Message:', error.message);
    if (error.stack) console.error('Error Stack:', error.stack);
    
    const pkPreview = PROCESSED_PRIVATE_KEY 
        ? `${PROCESSED_PRIVATE_KEY.substring(0, Math.min(40, PROCESSED_PRIVATE_KEY.length))}...${PROCESSED_PRIVATE_KEY.substring(Math.max(0, PROCESSED_PRIVATE_KEY.length - Math.min(40, PROCESSED_PRIVATE_KEY.length)))}` 
        : "PROCESSED_PRIVATE_KEY_IS_UNDEFINED_AT_AUTH_INIT_CATCH";
    console.error(`Private key passed to GoogleAuth (preview): ${pkPreview}`);
    
    if (error.message?.includes('DECODER routines') || error.message?.includes('PEM routines') || error.message?.includes('private key') || error.message?.includes('asn1 encoding')) {
        console.error(
          'Auth Init Error Detail: This specific error points to an issue with the PROCESSED_PRIVATE_KEY format or value that the underlying crypto library cannot parse. ' +
          'Ensure it is a valid PEM-formatted private key. The key might have passed initial structural checks in this file but is still not parsable by the auth library. '+
          'Check for hidden characters, ensure correct newline representation, and verify the key is not corrupted.'
        );
    }
    return null;
  }
}

export async function getSheetData(): Promise<SheetRow[]> {
  // console.log('Attempting to get sheet data...');
  let sheets: sheets_v4.Sheets | null = null;
  try {
      sheets = await getSheetsClient();
  } catch (clientError: any) {
      console.error('Error obtaining Google Sheets client in getSheetData:', clientError.message);
      if (clientError.stack) console.error(clientError.stack);
      // Fall through, sheets will be null, and handled below
  }


  if (!sheets) {
     console.warn('getSheetData: Google Sheets client is not available (failed to initialize or returned null). Returning empty data. Check previous logs for client initialization errors.');
     return [];
  }
  if (!SHEET_ID){ 
    console.warn('getSheetData: GOOGLE_SHEET_ID is not configured. Returning empty data.');
    return [];
  }
  if (!SHEET_RANGE){
    console.warn('getSheetData: GOOGLE_SHEET_RANGE is not configured. Returning empty data.');
    return [];
  }

  try {
    // console.log(`Fetching data from SHEET_ID: ${SHEET_ID}, RANGE: ${SHEET_RANGE}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      // console.log('No data found in the specified sheet range or sheet is empty.');
      return [];
    }

    const headers = rows[0].map(header => String(header).trim());
    const dataRows = rows.slice(1);

    const expectedHeaders = ['Donor/Opp', 'Action/Next Step', 'Lead', 'Priority', 'Probability'];
    const missingHeaders = expectedHeaders.filter(eh => !headers.includes(eh));
    if (missingHeaders.length > 0) {
       console.warn(`Sheet is missing expected headers: [${missingHeaders.join(', ')}]. Current headers: [${headers.join(', ')}]. Data mapping might be incorrect or incomplete.`);
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
                  // if (value !== '') {
                    // console.warn(`Invalid value "${value}" for ${header} in row. Defaulting to Medium.`);
                  // }
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
    }).filter(row => { // Filter out rows that are effectively empty AFTER processing
      const opp = row['Donor/Opp']?.trim();
      const action = row['Action/Next Step']?.trim();
      const lead = row.Lead?.trim();
      // Priority and Probability always have defaults, so check the main text fields.
      return !!(opp || action || lead);
    });


  } catch (error: any) {
    console.error('CRITICAL ERROR during sheets.spreadsheets.values.get API call in getSheetData:');
    console.error('Error Message:', error.message);
    if (error.stack) console.error('Error Stack:', error.stack);
    if (error.response?.data?.error) {
        console.error('Google API Response Error Details:', JSON.stringify(error.response.data.error, null, 2));
    } else if (error.response?.data) {
        console.error('Google API Response Data (if no specific error object):', JSON.stringify(error.response.data, null, 2));
    }
    
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
            console.error(`getSheetData Specific Error Hint: ${commonErrorMessages[key]}`);
            break;
        }
    }
    
    return []; 
  }
}

export async function appendSheetRow(rowData: Omit<SheetRow, ''>): Promise<boolean> {
  let sheets: sheets_v4.Sheets | null = null;
  try {
      sheets = await getSheetsClient();
  } catch (clientError: any) {
      console.error('Error obtaining Google Sheets client in appendSheetRow:', clientError.message);
      return false;
  }

   if (!sheets) {
      console.error("appendSheetRow Error: Google Sheets client not available (failed to initialize or returned null). Cannot append row.");
      return false;
   }
   if (!SHEET_ID) { 
     console.error("appendSheetRow Error: GOOGLE_SHEET_ID is not configured. Cannot append row.");
     return false;
   }
   if (!SHEET_RANGE) {
    console.error("appendSheetRow Error: GOOGLE_SHEET_RANGE is not configured. Cannot determine where to append row.");
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
      range: SHEET_RANGE, // Appends after the last row of this range or table.
      valueInputOption: 'USER_ENTERED', 
      insertDataOption: 'INSERT_ROWS', 
      requestBody: {
        values: [values],
      },
    });
    // console.log('Row appended successfully to Google Sheet.');
    return true;
  } catch (error: any) {
    console.error('Error appending sheet row via Google Sheets API:');
    console.error('Error Message:', error.message);
    if (error.response?.data?.error) {
        console.error('Google API Response Error Details for append:', JSON.stringify(error.response.data.error, null, 2));
        if (error.response.data.error.message?.includes('PERMISSION_DENIED')) {
             console.error(`appendSheetRow Specific Error Hint: Permission Denied. Ensure the service account (${SERVICE_ACCOUNT_EMAIL}) has 'Editor' access to the Google Sheet (ID: ${SHEET_ID}).`);
        } else if (error.response.data.error.message?.includes('Unable to parse range')) {
             console.error(`appendSheetRow Specific Error Hint: Unable to parse range: ${SHEET_RANGE}. Check if the sheet name within the range is correct for appending.`);
        }
    }
    return false;
  }
}