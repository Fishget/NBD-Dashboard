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

if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  console.error('Missing Google Sheets API credentials in environment variables.');
  // Throwing an error might be better in production, but console log for dev
  // throw new Error('Missing Google Sheets API credentials');
}

function getSheetsClient(): sheets_v4.Sheets | null {
  if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    console.error('Cannot initialize Sheets client due to missing credentials.');
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: SERVICE_ACCOUNT_EMAIL,
      private_key: PRIVATE_KEY,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function getSheetData(): Promise<SheetRow[]> {
  const sheets = getSheetsClient();
  if (!sheets || !SHEET_ID) return [];

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // Assuming the first row is headers
    const headers = rows[0].map(header => header.trim());
    const dataRows = rows.slice(1);

    const expectedHeaders = ['Donor/Opp', 'Action/Next Step', 'Lead', 'Priority', 'Probability'];
    if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
       console.warn(`Sheet headers [${headers.join(', ')}] do not match expected headers [${expectedHeaders.join(', ')}]. Data mapping might be incorrect.`);
    }

    return dataRows.map((row) => {
      const rowData: Partial<SheetRow> = {};
      headers.forEach((header, index) => {
        // Basic validation for Priority/Probability - adjust as needed
        if ((header === 'Priority' || header === 'Probability') && row[index]) {
           const value = row[index].trim();
           if (['High', 'Medium', 'Low'].includes(value)) {
              rowData[header as keyof SheetRow] = value as 'High' | 'Medium' | 'Low';
           } else {
              console.warn(`Invalid value "${value}" for ${header} in row. Defaulting to Medium.`);
              rowData[header as keyof SheetRow] = 'Medium'; // Default or handle error
           }
        } else {
           rowData[header as keyof SheetRow] = row[index] || ''; // Assign empty string if cell is blank
        }
      });
      // Ensure all properties exist, even if empty
      expectedHeaders.forEach(header => {
        if (!(header in rowData)) {
          rowData[header as keyof SheetRow] = '' as any; // Add missing properties as empty string or default
        }
      });
      return rowData as SheetRow;
    }).filter(row => Object.values(row).some(val => val !== '')); // Filter out completely empty rows if necessary

  } catch (error) {
    console.error('Error fetching sheet data:', error);
    // Depending on the error type, you might want to handle it differently
    if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
        console.error(`Permission denied. Ensure the service account (${SERVICE_ACCOUNT_EMAIL}) has access to the Google Sheet (${SHEET_ID}).`);
    } else if (error instanceof Error && error.message.includes('Requested entity was not found')) {
        console.error(`Sheet or range not found. Verify SHEET_ID (${SHEET_ID}) and SHEET_RANGE (${SHEET_RANGE}).`);
    }
    return []; // Return empty array on error
  }
}

export async function appendSheetRow(rowData: Omit<SheetRow, ''>): Promise<boolean> {
  const sheets = getSheetsClient();
   if (!sheets || !SHEET_ID) {
      console.error("Cannot append row: Sheets client not initialized or SHEET_ID missing.");
      return false;
   }

  // Ensure the order matches the sheet columns A:E
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
      requestBody: {
        values: [values],
      },
    });
    console.log('Row appended successfully');
    return true;
  } catch (error) {
    console.error('Error appending sheet row:', error);
     if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
        console.error(`Permission denied. Ensure the service account (${SERVICE_ACCOUNT_EMAIL}) has write access to the Google Sheet (${SHEET_ID}).`);
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
