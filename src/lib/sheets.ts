
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

if (rawPrivateKeyFromEnv && rawPrivateKeyFromEnv.trim() !== '') {
    // Standard processing: replace escaped newlines with actual newlines, then trim.
    let key = rawPrivateKeyFromEnv.replace(/\\n/g, '\n').trim();

    // Validate basic PEM structure.
    if (key.startsWith('-----BEGIN PRIVATE KEY-----') && key.endsWith('-----END PRIVATE KEY-----')) {
        PRIVATE_KEY = key;
    } else {
        console.warn(
            'GOOGLE_PRIVATE_KEY environment variable appears malformed after processing. It will not be used. Sheet operations may fail.' +
            `\n  Problem: Did not pass startsWith/endsWith "-----BEGIN/END PRIVATE KEY-----" check.` +
            `\n  Processed key starts with: "${key.substring(0, Math.min(30, key.length))}"` +
            `\n  Processed key ends with: "${key.substring(Math.max(0, key.length - 30))}"` +
            `\n  Length of processed key: ${key.length}` +
            `\n  Original GOOGLE_PRIVATE_KEY (first 30 chars, if set): "${rawPrivateKeyFromEnv?.substring(0, Math.min(30, rawPrivateKeyFromEnv.length)) ?? 'NOT SET'}"` +
            `\n  Hint: Check for extra quotes, missing PEM markers, or incorrect newline escaping in your .env.local file for GOOGLE_PRIVATE_KEY.` +
            ` The key in .env.local should typically be a single long string enclosed in double quotes, with literal \\n for newlines.`
        );
        PRIVATE_KEY = undefined; // Ensure it's undefined if structural check fails
    }
} else {
    console.warn('GOOGLE_PRIVATE_KEY is not set, empty, or only whitespace in environment variables. PRIVATE_KEY will be undefined.');
    PRIVATE_KEY = undefined;
}

// Initial check for logging purposes; actual guard is in getSheetsClient
(() => {
  const missingVarsWarn = [];
  if (!SHEET_ID) missingVarsWarn.push('GOOGLE_SHEET_ID');
  if (!SERVICE_ACCOUNT_EMAIL) missingVarsWarn.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  
  if (!PRIVATE_KEY) { 
    if (!rawPrivateKeyFromEnv) {
      missingVarsWarn.push('GOOGLE_PRIVATE_KEY (not set)');
    } else if (rawPrivateKeyFromEnv.trim() === '') {
      missingVarsWarn.push('GOOGLE_PRIVATE_KEY (set but empty/whitespace)');
    }
    else {
      // This case means rawPrivateKeyFromEnv was set, but PRIVATE_KEY is still undefined,
      // implying the startsWith/endsWith check failed. The more detailed warning above already covered this.
      missingVarsWarn.push('GOOGLE_PRIVATE_KEY (set but failed formatting checks - see detailed warning above)');
    }
  }
  if (missingVarsWarn.length > 0) {
    console.warn(
      `SheetSync Initialization Warning: One or more Google Sheets API credentials are problematic. Sheet operations are likely to fail. Problematic variables: [${missingVarsWarn.join(', ')}]`
    );
  }
})();


export function getSheetsClient(): sheets_v4.Sheets | null {
  if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    console.error('Cannot initialize Sheets client: Essential Google Sheets API credentials (SHEET_ID, SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY) are not fully set or the private key is malformed/missing.');
    const missing = [];
    if (!SHEET_ID) missing.push('GOOGLE_SHEET_ID');
    if (!SERVICE_ACCOUNT_EMAIL) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    if (!PRIVATE_KEY) { // This is true if rawPrivateKeyFromEnv was empty, malformed, or not set
        if (!rawPrivateKeyFromEnv) {
            missing.push('GOOGLE_PRIVATE_KEY (is not set)');
        } else if (rawPrivateKeyFromEnv.trim() === '') {
            missing.push('GOOGLE_PRIVATE_KEY (is set but empty/whitespace)');
        } else {
            // This means rawPrivateKeyFromEnv was set, but the processing failed (e.g. PEM markers)
            missing.push('GOOGLE_PRIVATE_KEY (is set but was malformed or failed structural checks - see warnings above)');
        }
    }
    if (missing.length > 0) console.error(`Detailed missing/problematic environment variables: ${missing.join(', ')}`);
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: SERVICE_ACCOUNT_EMAIL,
        private_key: PRIVATE_KEY, // Use the processed and validated PRIVATE_KEY
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Error initializing Google Auth client:', error);
    if (error instanceof Error && (error.message.includes('DECODER routines') || error.message.includes('PEM routines') || error.message.includes('private key') || error.message.includes('asn1 encoding'))) {
        console.error(
          'This error during auth initialization often indicates an issue with the GOOGLE_PRIVATE_KEY format or value even after initial checks. Ensure it is a valid PEM-formatted private key. The key might have passed basic structural checks but is still not parsable by the crypto library.'
        );
    }
    return null;
  }
}

export async function getSheetData(): Promise<SheetRow[]> {
  const sheets = getSheetsClient();
  if (!sheets) {
     console.warn('Google Sheets client is not available (possibly due to configuration issues). Returning empty data for dashboard.');
     return [];
  }
  if (!SHEET_ID){ 
    console.warn('GOOGLE_SHEET_ID is not configured. Returning empty data for dashboard.');
    return [];
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in the specified sheet range or sheet is empty.');
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


  } catch (error) {
    console.error('Error fetching sheet data from Google Sheets API:', error);
    if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
        console.error(`Permission denied. Ensure the service account (${SERVICE_ACCOUNT_EMAIL}) has at least read access to the Google Sheet (${SHEET_ID}).`);
    } else if (error instanceof Error && error.message.includes('Requested entity was not found')) {
        console.error(`Sheet or range not found. Verify GOOGLE_SHEET_ID (${SHEET_ID}) and GOOGLE_SHEET_RANGE (${SHEET_RANGE}).`);
    } else if (error instanceof Error && (error.message.includes('UNAUTHENTICATED') || error.message.includes('invalid_grant'))) {
        console.error('Authentication failed. This could be due to an invalid service account email, private key, or incorrect project setup.');
    } else if (error instanceof Error && (error.message.includes('DECODER routines') || error.message.includes('PEM routines'))) {
        console.error('A cryptographic error occurred, often related to a malformed private key. Ensure GOOGLE_PRIVATE_KEY is correctly formatted in your environment.');
    }
    return []; 
  }
}

export async function appendSheetRow(rowData: Omit<SheetRow, ''>): Promise<boolean> {
  const sheets = getSheetsClient();
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
    console.log('Row appended successfully to Google Sheet.');
    return true;
  } catch (error) {
    console.error('Error appending sheet row to Google Sheets API:', error);
     if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
        console.error(`Permission denied. Ensure the service account (${SERVICE_ACCOUNT_EMAIL}) has write access to the Google Sheet (${SHEET_ID}).`);
    } else if (error instanceof Error && (error.message.includes('UNAUTHENTICATED') || error.message.includes('invalid_grant'))) {
        console.error('Authentication failed while appending. Check service account credentials and permissions.');
    }
    return false;
  }
}

