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

// Environment variables check
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Handle newline characters
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:E'; // Default range if not specified

// Initial check for logging purposes, actual guard is in getSheetsClient
if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  console.warn(
    'One or more Google Sheets API credentials (SHEET_ID, SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY) are missing or incomplete in environment variables. Sheet operations may fail.'
  );
}

function getSheetsClient(): sheets_v4.Sheets | null {
  if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    console.error('Cannot initialize Sheets client: Essential Google Sheets API credentials are not fully set in environment variables.');
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

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Error initializing Google Auth client:', error);
    if (error instanceof Error && (error.message.includes('DECODER routines') || error.message.includes('PEM routines') || error.message.includes('private key'))) {
        console.error(
          'This error often indicates an issue with the GOOGLE_PRIVATE_KEY format or value in your environment variables. Ensure it is a valid PEM-formatted private key.'
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

    // Assuming the first row is headers
    const headers = rows[0].map(header => String(header).trim()); // Ensure header is a string
    const dataRows = rows.slice(1);

    const expectedHeaders = ['Donor/Opp', 'Action/Next Step', 'Lead', 'Priority', 'Probability'];
    // Flexible header check: ensure all expected headers are present
    const missingHeaders = expectedHeaders.filter(eh => !headers.includes(eh));
    if (missingHeaders.length > 0) {
       console.warn(`Sheet is missing expected headers: [${missingHeaders.join(', ')}]. Current headers: [${headers.join(', ')}]. Data mapping might be incorrect or incomplete.`);
    }


    return dataRows.map((row) => {
      const rowData: Partial<SheetRow> = {};
      headers.forEach((header, index) => {
        const cellValue = row[index] !== undefined && row[index] !== null ? String(row[index]) : ''; // Ensure cellValue is a string

        if (expectedHeaders.includes(header)) { // Only process expected headers
            if ((header === 'Priority' || header === 'Probability')) {
               const value = cellValue.trim();
               if (['High', 'Medium', 'Low'].includes(value)) {
                  rowData[header as keyof SheetRow] = value as 'High' | 'Medium' | 'Low';
               } else {
                  // Log if value is not empty and not one of the allowed values
                  if (value !== '') {
                    console.warn(`Invalid value "${value}" for ${header} in row. Defaulting to Medium.`);
                  }
                  rowData[header as keyof SheetRow] = 'Medium'; // Default for invalid or empty
               }
            } else {
               rowData[header as keyof SheetRow] = cellValue;
            }
        }
      });
      // Ensure all expected properties exist, even if corresponding header was missing or cell was empty
      expectedHeaders.forEach(eh => {
        const key = eh as keyof SheetRow;
        if (!(key in rowData)) {
          if (key === 'Priority' || key === 'Probability') {
            rowData[key] = 'Medium'; // Default for missing enum types
          } else {
            rowData[key] = ''; // Default for missing string types
          }
        }
      });
      return rowData as SheetRow;
    }).filter(row => Object.values(row).some(val => typeof val === 'string' && val.trim() !== '')); // Filter out rows that appear completely empty after processing


  } catch (error) {
    console.error('Error fetching sheet data from Google Sheets API:', error);
    if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
        console.error(`Permission denied. Ensure the service account (${SERVICE_ACCOUNT_EMAIL}) has at least read access to the Google Sheet (${SHEET_ID}).`);
    } else if (error instanceof Error && error.message.includes('Requested entity was not found')) {
        console.error(`Sheet or range not found. Verify GOOGLE_SHEET_ID (${SHEET_ID}) and GOOGLE_SHEET_RANGE (${SHEET_RANGE}).`);
    } else if (error instanceof Error && (error.message.includes('UNAUTHENTICATED') || error.message.includes('invalid_grant'))) {
        console.error('Authentication failed. This could be due to an invalid service account email, private key, or incorrect project setup.');
    }
    return []; // Return empty array on error
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


  // Ensure the order matches the sheet columns A:E as per expectedHeaders
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
      range: SHEET_RANGE, // Append to the specified range
      valueInputOption: 'USER_ENTERED', // Interpret data as if user typed it
      insertDataOption: 'INSERT_ROWS', // Recommended for appending
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

// Placeholder for editing/updating existing rows if needed in the future
// export async function updateSheetRow(rowIndex: number, rowData: SheetRow): Promise<boolean> {
//   const sheets = getSheetsClient();
//   if (!sheets || !SHEET_ID) return false;
//   // Implementation would involve finding the correct row index (potentially +2 if header exists and 0-indexed)
//   // and using sheets.spreadsheets.values.update
//   console.log(`Updating row ${rowIndex} - Not implemented yet`);
//   return false;
// }
