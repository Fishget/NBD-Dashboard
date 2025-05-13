
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
            'GOOGLE_PRIVATE_KEY environment variable appears malformed (e.g., missing PEM headers/footers or improperly escaped). It will not be used. Sheet operations may fail.'
        );
        PRIVATE_KEY = undefined; // Ensure it's undefined if structural check fails
    }
} else {
    // console.log('GOOGLE_PRIVATE_KEY is not set or is empty in environment variables.');
    PRIVATE_KEY = undefined;
}

// Initial check for logging purposes; actual guard is in getSheetsClient
(() => {
  const missingVarsWarn = [];
  if (!SHEET_ID) missingVarsWarn.push('GOOGLE_SHEET_ID');
  if (!SERVICE_ACCOUNT_EMAIL) missingVarsWarn.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  
  if (!PRIVATE_KEY) { // This condition is true if rawPrivateKeyFromEnv was empty, malformed, or not set
    if (!rawPrivateKeyFromEnv) {
      missingVarsWarn.push('GOOGLE_PRIVATE_KEY (not set)');
    } else if (rawPrivateKeyFromEnv.trim() === '') {
      missingVarsWarn.push('GOOGLE_PRIVATE_KEY (set but empty)');
    }
    else {
      missingVarsWarn.push('GOOGLE_PRIVATE_KEY (set but malformed/failed processing)');
    }
  }
  if (missingVarsWarn.length > 0) {
    console.warn(
      `SheetSync Initialization Warning: One or more Google Sheets API credentials (${missingVarsWarn.join(', ')}) are missing, empty, or malformed in environment variables. Sheet operations are likely to fail.`
    );
  }
})();


export function getSheetsClient(): sheets_v4.Sheets | null {
  if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    console.error('Cannot initialize Sheets client: Essential Google Sheets API credentials (SHEET_ID, SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY) are not fully set or the private key is malformed/missing.');
    const missing = [];
    if (!SHEET_ID) missing.push('GOOGLE_SHEET_ID');
    if (!SERVICE_ACCOUNT_EMAIL) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    if (!PRIVATE_KEY) {
        if (!rawPrivateKeyFromEnv) {
            missing.push('GOOGLE_PRIVATE_KEY (is not set)');
        } else if (rawPrivateKeyFromEnv.trim() === '') {
            missing.push('GOOGLE_PRIVATE_KEY (is set but empty)');
        } else {
            missing.push('GOOGLE_PRIVATE_KEY (is set but was malformed or failed structural checks)');
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
          'This error during auth initialization often indicates an issue with the GOOGLE_PRIVATE_KEY format or value. Ensure it is a valid PEM-formatted private key, with newline characters correctly handled (e.g., using "\\n" in .env files which are then unescaped, or actual newlines if your provider supports them for multi-line variables).'
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
  if (!SHEET_ID){ // This check is somewhat redundant if getSheetsClient handles it, but safe.
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
                    console.warn(`Invalid value "${value}" for ${header} in row. Defaulting to Medium.`);
                  }
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
    }).filter(row => Object.values(row).some(val => typeof val === 'string' && val.trim() !== ''));


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
