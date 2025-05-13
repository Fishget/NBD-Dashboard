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
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:E'; // Default range if not specified

let PRIVATE_KEY: string | undefined;
const rawPrivateKeyFromEnv = process.env.GOOGLE_PRIVATE_KEY;

if (typeof rawPrivateKeyFromEnv === 'string' && rawPrivateKeyFromEnv.trim() !== '') {
    let key = rawPrivateKeyFromEnv.trim();
    
    // Strip surrounding quotes if present (common for multi-line env vars copied from JSON strings)
    if ((key.startsWith('"') && key.endsWith('"')) ||
        (key.startsWith("'") && key.endsWith("'"))) {
        key = key.substring(1, key.length - 1);
    }

    // Unescape literal '\\n' to actual newline characters.
    const unescapedKeyRaw = key.replace(/\\n/g, '\n');
    // Trim whitespace around the entire unescaped block before checking markers.
    const unescapedKey = unescapedKeyRaw.trim(); 

    if (
        unescapedKey.startsWith('-----BEGIN PRIVATE KEY-----') &&
        unescapedKey.endsWith('-----END PRIVATE KEY-----') &&
        unescapedKey.includes('\n') // Ensure there are actual newlines within the key block
    ) {
        const coreKeyContent = unescapedKey
            .substring('-----BEGIN PRIVATE KEY-----'.length, unescapedKey.length - '-----END PRIVATE KEY-----'.length)
            .trim();
        if (coreKeyContent.length > 0) {
            PRIVATE_KEY = unescapedKey; // Use the trimmed, unescaped key
            // console.log('Successfully processed GOOGLE_PRIVATE_KEY.');
        } else {
            console.warn(
                'GOOGLE_PRIVATE_KEY warning: Processed key has PEM markers but no content in between. ' +
                'Original GOOGLE_PRIVATE_KEY (first 30 chars, trimmed): "' + (rawPrivateKeyFromEnv || "").trim().substring(0, 30) + '". ' +
                'Sheet operations will likely fail.'
            );
            PRIVATE_KEY = undefined;
        }
    } else {
        console.warn(
            'GOOGLE_PRIVATE_KEY warning: Malformed structure after processing. ' +
            `Key starts with (after processing and trimming): "${unescapedKey.substring(0, 30)}...". ` +
            `Key ends with (after processing and trimming): "...${unescapedKey.substring(Math.max(0, unescapedKey.length - 30))}". ` +
            `Includes newlines: ${unescapedKey.includes('\n')}. ` +
            'Original GOOGLE_PRIVATE_KEY (first 30 chars, trimmed): "' + (rawPrivateKeyFromEnv || "").trim().substring(0, 30) + '". ' +
            'Ensure it is a valid PEM key with actual newlines between markers, correctly escaped newlines (\\n) if stored as a single line string in .env, and no extraneous characters.'
        );
        PRIVATE_KEY = undefined;
    }
} else {
    if (rawPrivateKeyFromEnv === undefined) {
        // console.log('GOOGLE_PRIVATE_KEY is not set. Sheet operations requiring auth will fail.');
    } else {
        console.warn('GOOGLE_PRIVATE_KEY is set but is empty or only whitespace. Sheet operations requiring auth will fail.');
    }
    PRIVATE_KEY = undefined;
}

// Initial check for logging purposes; actual guard is in getSheetsClient
(() => {
  const missingVarsWarn = [];
  if (!SHEET_ID) missingVarsWarn.push('GOOGLE_SHEET_ID');
  if (!SERVICE_ACCOUNT_EMAIL) missingVarsWarn.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  
  if (!PRIVATE_KEY && rawPrivateKeyFromEnv && rawPrivateKeyFromEnv.trim() !== '') { 
    missingVarsWarn.push('GOOGLE_PRIVATE_KEY (set but failed processing - see detailed warning above)');
  } else if (!PRIVATE_KEY && (!rawPrivateKeyFromEnv || rawPrivateKeyFromEnv.trim() === '')) {
     missingVarsWarn.push('GOOGLE_PRIVATE_KEY (not set or empty)');
  }

  if (missingVarsWarn.length > 0) {
    console.warn(
      `SheetSync Initialization Warning: One or more Google Sheets API credentials are problematic. Sheet operations are likely to fail. Problematic variables: [${missingVarsWarn.join(', ')}]`
    );
  }
})();


export async function getSheetsClient(): Promise<sheets_v4.Sheets | null> {
  if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    const errorParts = ['Cannot initialize Sheets client due to missing/invalid credentials:'];
    if (!SHEET_ID) errorParts.push('- GOOGLE_SHEET_ID is not set.');
    if (!SERVICE_ACCOUNT_EMAIL) errorParts.push('- GOOGLE_SERVICE_ACCOUNT_EMAIL is not set.');
    
    if (!PRIVATE_KEY) {
      if (!rawPrivateKeyFromEnv) errorParts.push('- GOOGLE_PRIVATE_KEY is not set.');
      else if (rawPrivateKeyFromEnv.trim() === '' || rawPrivateKeyFromEnv.trim() === '""' || rawPrivateKeyFromEnv.trim() === "''") errorParts.push('- GOOGLE_PRIVATE_KEY is set but is empty or only whitespace.');
      else errorParts.push('- GOOGLE_PRIVATE_KEY is set but was malformed or failed structural/PEM checks (see previous warnings for details).');
    }
    console.error(errorParts.join('\n  '));
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: SERVICE_ACCOUNT_EMAIL,
        private_key: PRIVATE_KEY, 
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    // console.log('GoogleAuth client initialized successfully.');
    return google.sheets({ version: 'v4', auth });
  } catch (error: any) {
    console.error('CRITICAL Error initializing Google Auth client with processed PRIVATE_KEY:', error.message);
    const pkPreview = PRIVATE_KEY 
        ? `${PRIVATE_KEY.substring(0, Math.min(40, PRIVATE_KEY.length))}...${PRIVATE_KEY.substring(Math.max(0, PRIVATE_KEY.length - Math.min(40, PRIVATE_KEY.length)))}` 
        : "PRIVATE_KEY_IS_UNDEFINED_AT_AUTH_INIT_CATCH_BLOCK"; // More specific location
    console.error(`Private key passed to GoogleAuth (preview): ${pkPreview}`);
    console.error(`Type of PRIVATE_KEY at auth init: ${typeof PRIVATE_KEY}, Length: ${PRIVATE_KEY?.length}`);
    
    if (error instanceof Error && (error.message.includes('DECODER routines') || error.message.includes('PEM routines') || error.message.includes('private key') || error.message.includes('asn1 encoding'))) {
        console.error(
          'Auth Init Error Detail: This error specifically points to an issue with the GOOGLE_PRIVATE_KEY format or value that the underlying crypto library cannot parse. ' +
          'Ensure it is a valid PEM-formatted private key. The key might have passed initial structural checks but is still not parsable. ' +
          'Check for hidden characters, ensure correct newline representation, and verify the key is not corrupted.'
        );
    }
    return null;
  }
}

export async function getSheetData(): Promise<SheetRow[]> {
  const sheets = await getSheetsClient();
  if (!sheets) {
     console.warn('getSheetData: Google Sheets client is not available (possibly due to configuration issues). Returning empty data.');
     return [];
  }
  if (!SHEET_ID){ 
    console.warn('getSheetData: GOOGLE_SHEET_ID is not configured. Returning empty data.');
    return [];
  }

  try {
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
                  if (value !== '') {
                    // console.warn(`Invalid value "${value}" for ${header} in row. Defaulting to Medium.`);
                  }
                  rowData[header as keyof SheetRow] = 'Medium'; // Default if invalid or empty
               }
            } else {
               rowData[header as keyof SheetRow] = cellValue;
            }
        }
      });
      // Ensure all expected keys exist, even if not in sheet headers or row is shorter
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
    }).filter(row => Object.values(row).some(val => typeof val === 'string' && val.trim() !== '')); // Filter out completely empty effective rows


  } catch (error: any) {
    console.error('CRITICAL ERROR in getSheetData:', error); 
    console.error('Error message:', error.message);
    if (error.stack) console.error('Stack trace:', error.stack);
    if (error.response?.data) console.error('Google API response error data:', error.response.data);
    
    if (error instanceof Error) {
        if (error.message.includes('PERMISSION_DENIED')) {
            console.error(`getSheetData Error: Permission denied. Ensure the service account (${SERVICE_ACCOUNT_EMAIL}) has at least read access to the Google Sheet (${SHEET_ID}).`);
        } else if (error.message.includes('Requested entity was not found')) {
            console.error(`getSheetData Error: Sheet or range not found. Verify GOOGLE_SHEET_ID (${SHEET_ID}) and GOOGLE_SHEET_RANGE (${SHEET_RANGE}).`);
        } else if (error.message.includes('UNAUTHENTICATED') || error.message.includes('invalid_grant')) {
            console.error('getSheetData Error: Authentication failed. This could be due to an invalid service account email, private key, or incorrect project setup.');
        } else if (error.message.includes('DECODER routines') || error.message.includes('PEM routines')) {
            console.error('getSheetData Error: A cryptographic error occurred, often related to a malformed private key. Ensure GOOGLE_PRIVATE_KEY is correctly formatted in your environment.');
        }
    }
    return []; 
  }
}

export async function appendSheetRow(rowData: Omit<SheetRow, ''>): Promise<boolean> {
  const sheets = await getSheetsClient();
   if (!sheets) {
      console.error("Cannot append row: Google Sheets client not available (possibly due to configuration issues).");
      return false;
   }
   if (!SHEET_ID) { 
     console.error("Cannot append row: GOOGLE_SHEET_ID is not configured.");
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
    // console.log('Row appended successfully to Google Sheet.');
    return true;
  } catch (error: any) {
    console.error('Error appending sheet row to Google Sheets API:', error.message);
     if (error instanceof Error) {
        if (error.message.includes('PERMISSION_DENIED')) {
            console.error(`appendSheetRow Error: Permission denied. Ensure the service account (${SERVICE_ACCOUNT_EMAIL}) has write access to the Google Sheet (${SHEET_ID}).`);
        } else if (error.message.includes('UNAUTHENTICATED') || error.message.includes('invalid_grant')) {
            console.error('appendSheetRow Error: Authentication failed while appending. Check service account credentials and permissions.');
        }
     }
    return false;
  }
}

