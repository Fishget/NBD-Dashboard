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

function processPrivateKey(rawKey: string | undefined): string | null {
  if (typeof rawKey !== 'string' || rawKey.trim() === '') {
    console.error('[SheetLib:PK_Process] Raw GOOGLE_PRIVATE_KEY is undefined, empty, or whitespace.');
    return null;
  }
  console.log('[SheetLib:PK_Process] Received GOOGLE_PRIVATE_KEY. Length:', rawKey.length);

  let key = rawKey;

  // 1. Trim whitespace from the raw input.
  key = key.trim();

  // 2. Remove surrounding quotes if they encapsulate the ENTIRE string.
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.substring(1, key.length - 1);
    // console.log('[SheetLib:PK_Process] After stripping outer quotes. Preview (first 60):', key.substring(0, 60));
  }

  // 3. Unescape literal "\\n" and "\\r\\n" to actual newline characters "\n".
  // This is crucial if the key was stored as a JSON-escaped string or .env escaped string.
  // Must handle \\r\\n first if present.
  key = key.replace(/\\\\r\\\\n/g, '\r\n').replace(/\\\\n/g, '\n');


  // 4. Normalize all newlines (CRLF, CR) to LF.
  key = key.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // console.log('[SheetLib:PK_Process] After unescaping and normalizing newlines. Preview (first 60, NL as [NL]):', key.substring(0, 60).replace(/\n/g, '[NL]'));


  // 5. Perform PEM structural checks.
  if (
    key.startsWith('-----BEGIN PRIVATE KEY-----') &&
    key.endsWith('-----END PRIVATE KEY-----') &&
    key.includes('\n') // Essential for multi-line PEM keys
  ) {
    const coreKeyContent = key
      .substring('-----BEGIN PRIVATE KEY-----'.length, key.length - '-----END PRIVATE KEY-----'.length)
      .trim();

    if (coreKeyContent.length > 0) {
      console.log('[SheetLib:PK_Process] SUCCESS: GOOGLE_PRIVATE_KEY processed and structurally validated.');
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
    // console.log(`[SheetLib:getSheetsClient] Using Service Account Email: ${SERVICE_ACCOUNT_EMAIL}`);
    // console.log(`[SheetLib:getSheetsClient] Using Processed Private Key (first 60 chars, newlines as [NL]): ${processedPrivateKey!.substring(0, 60).replace(/\n/g, '[NL]')}`);

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
    return null;
  }
}

export async function getSheetData(): Promise<SheetRow[]> {
  // console.log('[SheetLib:getSheetData] Attempting to get sheet data...');
  let sheets: sheets_v4.Sheets | null = null;
  try {
      sheets = await getSheetsClient();
  } catch (clientError: any) {
      console.error('[SheetLib:getSheetData] Unexpected error while awaiting getSheetsClient():', clientError.message);
      if (clientError.stack) console.error(clientError.stack);
      // To prevent SSR crash for config issue, log and return empty. User can test connection in admin.
      console.error("getSheetData failed to get client, returning empty array to allow UI to load. Error: " + clientError.message);
      return [];
  }

  if (!sheets) {
     const msg = `ConfigurationError: Google Sheets client failed to initialize. This is usually due to missing or invalid credentials (GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY) or a malformed private key. Please review server logs for detailed messages from '[SheetLib:getSheetsClient]' or '[SheetLib:PK_Process]' for specific issues. Returning empty data to allow UI to load.`;
     console.error('[SheetLib:getSheetData] ' + msg);
     return []; // Return empty array to prevent SSR crash
  }

  if (!SHEET_ID){
    const msg = "ConfigurationError: GOOGLE_SHEET_ID is not configured on the server. Cannot fetch data. Returning empty data.";
    console.error('[SheetLib:getSheetData] ' + msg);
    return [];
  }
  if (!SHEET_RANGE){
    const msg = "ConfigurationError: GOOGLE_SHEET_RANGE is not configured on the server (though a default exists). Cannot fetch data. Returning empty data.";
    console.error('[SheetLib:getSheetData] ' + msg);
    return [];
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
                  rowData[header as keyof SheetRow] = 'Medium'; // Default if value is unexpected
               }
            } else {
               rowData[header as keyof SheetRow] = cellValue;
            }
        }
      });
      // Ensure all expected keys exist, even if not in sheet headers
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
    throw new Error(specificHint); // Re-throw API errors to be caught by error boundaries
  }
}

export async function appendSheetRow(rowData: Omit<SheetRow, ''>): Promise<boolean> {
  let sheets: sheets_v4.Sheets | null = null;
  try {
      sheets = await getSheetsClient();
  } catch (clientError: any) {
      console.error('[SheetLib:appendSheetRow] Error obtaining Google Sheets client in appendSheetRow:', clientError.message);
      throw new Error(`ConfigurationError: Failed to obtain Google Sheets client instance for appending: ${clientError.message}. Check server logs.`);
  }

   if (!sheets) {
      const msg = `ConfigurationError: Google Sheets client not available for appendSheetRow. Check server logs for initialization errors. This usually means credentials in .env.local are missing or invalid.`;
      console.error("[SheetLib:appendSheetRow] " + msg);
      throw new Error(msg);
   }
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
    throw new Error(specificHint);
  }
}