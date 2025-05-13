module.exports = {

"[project]/src/lib/auth.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "checkCredentials": (()=>checkCredentials),
    "clearAuthCookie": (()=>clearAuthCookie),
    "isAuthenticated": (()=>isAuthenticated),
    "setAuthCookie": (()=>setAuthCookie)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
;
const AUTH_COOKIE_NAME = 'sheetsync_auth';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.warn('Admin credentials are not set in environment variables. Admin login will not work.');
}
function checkCredentials(username, password) {
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
        return false; // Cannot authenticate if credentials aren't set
    }
    return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}
async function setAuthCookie() {
    const cookieStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.set(AUTH_COOKIE_NAME, 'true', {
        httpOnly: true,
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        path: '/admin',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24
    });
}
async function clearAuthCookie() {
    const cookieStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    cookieStore.delete(AUTH_COOKIE_NAME);
}
function isAuthenticated(cookieStore) {
    const store = cookieStore || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    const authCookie = store.get(AUTH_COOKIE_NAME);
    return authCookie?.value === 'true';
}
}}),
"[project]/src/lib/validators.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "loginSchema": (()=>loginSchema),
    "sheetConfigSchema": (()=>sheetConfigSchema),
    "sheetRowSchema": (()=>sheetRowSchema)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zod/lib/index.mjs [app-rsc] (ecmascript)");
;
const loginSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].object({
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].string().min(1, 'Username is required'),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].string().min(1, 'Password is required')
});
const sheetRowSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].object({
    'Donor/Opp': __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].string().min(1, 'Donor/Opportunity is required'),
    'Action/Next Step': __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].string().min(1, 'Action/Next Step is required'),
    Lead: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].string().min(1, 'Lead is required'),
    Priority: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].enum([
        'High',
        'Medium',
        'Low'
    ], {
        errorMap: ()=>({
                message: 'Please select a valid priority'
            })
    }),
    Probability: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].enum([
        'High',
        'Medium',
        'Low'
    ], {
        errorMap: ()=>({
                message: 'Please select a valid probability'
            })
    })
});
const sheetConfigSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].object({
    sheetId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].string().min(10, 'Sheet ID seems too short. Please check the copied ID.').trim(),
    sheetRange: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].string().min(3, 'Sheet range is required (e.g., Sheet1!A:E)').regex(/^[a-zA-Z0-9\s]+!([A-Z]+):([A-Z]+)$/, 'Invalid range format. Expected format like "Sheet1!A:E" with uppercase column letters.'),
    serviceAccountEmail: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].string().email('Invalid service account email format. Please enter a valid email address.'),
    privateKey: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].string().transform((key)=>{
        // 1. Replace literal "\\n" (escaped newlines common in JSON strings) with actual newline characters.
        let processedKey = key.replace(/\\n/g, '\n');
        // 2. Normalize Windows-style newlines (\r\n) to Unix-style newlines (\n).
        processedKey = processedKey.replace(/\r\n/g, '\n');
        // 3. Trim any leading/trailing whitespace from the entire key block.
        processedKey = processedKey.trim();
        return processedKey;
    }).pipe(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$lib$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["z"].string().min(100, 'Private key is too short. Ensure you have copied the full key from the JSON file.').startsWith('-----BEGIN PRIVATE KEY-----', 'Private key must start with "-----BEGIN PRIVATE KEY-----". Check for missing parts or extra characters at the beginning.').endsWith('-----END PRIVATE KEY-----', 'Private key must end with "-----END PRIVATE KEY-----". Check for missing parts or extra characters at the end.').refine((key)=>key.includes('\n'), {
        message: "Private key must be a multi-line string. Ensure newlines are preserved when copying."
    }).refine((key)=>{
        // Check for common errors like pasting the entire JSON key-value pair or including quotes
        // These checks are against the already transformed key (e.g. outer quotes should be removed by .trim())
        if (key.startsWith('"-----BEGIN PRIVATE KEY-----') || key.startsWith("'-----BEGIN PRIVATE KEY-----")) {
            return false;
        }
        if (key.includes('"private_key":') || key.includes("'private_key':")) {
            return false;
        }
        // Ensure there's content between the header and footer
        const coreKey = key.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').trim();
        return coreKey.length > 0;
    }, {
        message: "It looks like you might have pasted more than just the private key string, or the key content is empty. Please paste only the characters starting with -----BEGIN PRIVATE KEY----- and ending with -----END PRIVATE KEY-----."
    }))
});
}}),
"[externals]/child_process [external] (child_process, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("child_process", () => require("child_process"));

module.exports = mod;
}}),
"[externals]/fs [external] (fs, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}}),
"[externals]/os [external] (os, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("os", () => require("os"));

module.exports = mod;
}}),
"[externals]/net [external] (net, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}}),
"[externals]/tls [external] (tls, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}}),
"[externals]/assert [external] (assert, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("assert", () => require("assert"));

module.exports = mod;
}}),
"[externals]/tty [external] (tty, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("tty", () => require("tty"));

module.exports = mod;
}}),
"[externals]/util [external] (util, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}}),
"[externals]/http [external] (http, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}}),
"[externals]/https [external] (https, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}}),
"[externals]/stream [external] (stream, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}}),
"[externals]/punycode [external] (punycode, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("punycode", () => require("punycode"));

module.exports = mod;
}}),
"[externals]/zlib [external] (zlib, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}}),
"[externals]/querystring [external] (querystring, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("querystring", () => require("querystring"));

module.exports = mod;
}}),
"[externals]/crypto [external] (crypto, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}}),
"[externals]/node:events [external] (node:events, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:events", () => require("node:events"));

module.exports = mod;
}}),
"[externals]/node:process [external] (node:process, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:process", () => require("node:process"));

module.exports = mod;
}}),
"[externals]/node:util [external] (node:util, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("node:util", () => require("node:util"));

module.exports = mod;
}}),
"[externals]/buffer [external] (buffer, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}}),
"[externals]/events [external] (events, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}}),
"[externals]/http2 [external] (http2, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("http2", () => require("http2"));

module.exports = mod;
}}),
"[externals]/process [external] (process, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("process", () => require("process"));

module.exports = mod;
}}),
"[project]/src/lib/sheets.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "appendSheetRow": (()=>appendSheetRow),
    "getSheetData": (()=>getSheetData)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/googleapis/build/src/index.js [app-rsc] (ecmascript)");
;
// Environment variables check
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // Handle newline characters
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:E'; // Default range if not specified
// Initial check for logging purposes, actual guard is in getSheetsClient
if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    console.warn('One or more Google Sheets API credentials (SHEET_ID, SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY) are missing or incomplete in environment variables. Sheet operations may fail.');
}
function getSheetsClient() {
    if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
        console.error('Cannot initialize Sheets client: Essential Google Sheets API credentials are not fully set in environment variables.');
        return null;
    }
    try {
        const auth = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["google"].auth.GoogleAuth({
            credentials: {
                client_email: SERVICE_ACCOUNT_EMAIL,
                private_key: PRIVATE_KEY
            },
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets'
            ]
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$googleapis$2f$build$2f$src$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["google"].sheets({
            version: 'v4',
            auth
        });
    } catch (error) {
        console.error('Error initializing Google Auth client:', error);
        if (error instanceof Error && (error.message.includes('DECODER routines') || error.message.includes('PEM routines') || error.message.includes('private key'))) {
            console.error('This error often indicates an issue with the GOOGLE_PRIVATE_KEY format or value in your environment variables. Ensure it is a valid PEM-formatted private key.');
        }
        return null;
    }
}
async function getSheetData() {
    const sheets = getSheetsClient();
    if (!sheets) {
        console.warn('Google Sheets client is not available (possibly due to configuration issues). Returning empty data for dashboard.');
        return [];
    }
    if (!SHEET_ID) {
        console.warn('GOOGLE_SHEET_ID is not configured. Returning empty data for dashboard.');
        return [];
    }
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: SHEET_RANGE
        });
        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log('No data found in the specified sheet range or sheet is empty.');
            return [];
        }
        // Assuming the first row is headers
        const headers = rows[0].map((header)=>String(header).trim()); // Ensure header is a string
        const dataRows = rows.slice(1);
        const expectedHeaders = [
            'Donor/Opp',
            'Action/Next Step',
            'Lead',
            'Priority',
            'Probability'
        ];
        // Flexible header check: ensure all expected headers are present
        const missingHeaders = expectedHeaders.filter((eh)=>!headers.includes(eh));
        if (missingHeaders.length > 0) {
            console.warn(`Sheet is missing expected headers: [${missingHeaders.join(', ')}]. Current headers: [${headers.join(', ')}]. Data mapping might be incorrect or incomplete.`);
        }
        return dataRows.map((row)=>{
            const rowData = {};
            headers.forEach((header, index)=>{
                const cellValue = row[index] !== undefined && row[index] !== null ? String(row[index]) : ''; // Ensure cellValue is a string
                if (expectedHeaders.includes(header)) {
                    if (header === 'Priority' || header === 'Probability') {
                        const value = cellValue.trim();
                        if ([
                            'High',
                            'Medium',
                            'Low'
                        ].includes(value)) {
                            rowData[header] = value;
                        } else {
                            // Log if value is not empty and not one of the allowed values
                            if (value !== '') {
                                console.warn(`Invalid value "${value}" for ${header} in row. Defaulting to Medium.`);
                            }
                            rowData[header] = 'Medium'; // Default for invalid or empty
                        }
                    } else {
                        rowData[header] = cellValue;
                    }
                }
            });
            // Ensure all expected properties exist, even if corresponding header was missing or cell was empty
            expectedHeaders.forEach((eh)=>{
                const key = eh;
                if (!(key in rowData)) {
                    if (key === 'Priority' || key === 'Probability') {
                        rowData[key] = 'Medium'; // Default for missing enum types
                    } else {
                        rowData[key] = ''; // Default for missing string types
                    }
                }
            });
            return rowData;
        }).filter((row)=>Object.values(row).some((val)=>typeof val === 'string' && val.trim() !== '')); // Filter out rows that appear completely empty after processing
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
async function appendSheetRow(rowData) {
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
            range: SHEET_RANGE,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [
                    values
                ]
            }
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
} // Placeholder for editing/updating existing rows if needed in the future
 // export async function updateSheetRow(rowIndex: number, rowData: SheetRow): Promise<boolean> {
 //   const sheets = getSheetsClient();
 //   if (!sheets || !SHEET_ID) return false;
 //   // Implementation would involve finding the correct row index (potentially +2 if header exists and 0-indexed)
 //   // and using sheets.spreadsheets.values.update
 //   console.log(`Updating row ${rowIndex} - Not implemented yet`);
 //   return false;
 // }
}}),
"[project]/src/lib/actions.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ {"00830883cc3e3d4983b359610b1873f6aa5b33c4a0":"logoutAction","6084a6390a3565620cbc23c59969a01ccc07f96681":"submitDataAction","60aa8be677b96db11da812d84f364cdfd2662320a2":"loginAction","60b5c37fd5688750901aa043ff1da817ffbb8ef2d4":"saveSheetConfigAction"} */ __turbopack_context__.s({
    "loginAction": (()=>loginAction),
    "logoutAction": (()=>logoutAction),
    "saveSheetConfigAction": (()=>saveSheetConfigAction),
    "submitDataAction": (()=>submitDataAction)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$validators$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/validators.ts [app-rsc] (ecmascript)"); // Added sheetConfigSchema
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/sheets.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
;
;
async function /*#__TURBOPACK_DISABLE_EXPORT_MERGING__*/ loginAction(prevState, formData) {
    try {
        const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$validators$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginSchema"].safeParse({
            username: formData.get('username'),
            password: formData.get('password')
        });
        if (!parsed.success) {
            return {
                message: 'Invalid form data.',
                success: false,
                errors: parsed.error.flatten().fieldErrors
            };
        }
        const { username, password } = parsed.data;
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["checkCredentials"])(username, password)) {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setAuthCookie"])();
            // Revalidate admin path to trigger UI update after login
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin');
            return {
                message: 'Login successful!',
                success: true
            };
        } else {
            return {
                message: 'Invalid username or password.',
                success: false
            };
        }
    } catch (error) {
        console.error('Login error:', error);
        return {
            message: 'An unexpected error occurred during login.',
            success: false
        };
    }
}
async function /*#__TURBOPACK_DISABLE_EXPORT_MERGING__*/ logoutAction() {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["clearAuthCookie"])();
    // Revalidate admin path to trigger UI update after logout
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/admin');
}
async function /*#__TURBOPACK_DISABLE_EXPORT_MERGING__*/ submitDataAction(prevState, formData) {
    try {
        const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$validators$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sheetRowSchema"].safeParse({
            'Donor/Opp': formData.get('Donor/Opp'),
            'Action/Next Step': formData.get('Action/Next Step'),
            Lead: formData.get('Lead'),
            Priority: formData.get('Priority'),
            Probability: formData.get('Probability')
        });
        if (!parsed.success) {
            console.log("Validation errors:", parsed.error.flatten().fieldErrors);
            return {
                message: 'Invalid form data. Please check the fields.',
                success: false,
                errors: parsed.error.flatten().fieldErrors
            };
        }
        const dataToAppend = parsed.data;
        // Check if sheets connection is configured before attempting append
        if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            return {
                message: 'Google Sheet connection is not configured on the server.',
                success: false
            };
        }
        const success = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$sheets$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["appendSheetRow"])(dataToAppend);
        if (success) {
            // Revalidate the homepage cache to show the new data
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])('/');
            return {
                message: 'Data submitted successfully!',
                success: true
            };
        } else {
            return {
                message: 'Failed to submit data to Google Sheet. Please check the server console logs for more specific error details from the Google Sheets API.',
                success: false
            };
        }
    } catch (error) {
        console.error('Submit data error:', error);
        return {
            message: 'An unexpected error occurred while submitting data.',
            success: false
        };
    }
}
async function /*#__TURBOPACK_DISABLE_EXPORT_MERGING__*/ saveSheetConfigAction(prevState, formData) {
    try {
        const parsed = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$validators$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sheetConfigSchema"].safeParse({
            sheetId: formData.get('sheetId'),
            sheetRange: formData.get('sheetRange'),
            serviceAccountEmail: formData.get('serviceAccountEmail'),
            privateKey: formData.get('privateKey')
        });
        if (!parsed.success) {
            console.log("Config Validation errors:", parsed.error.flatten().fieldErrors);
            return {
                message: 'Invalid configuration data. Please check the fields.',
                success: false,
                errors: parsed.error.flatten().fieldErrors
            };
        }
        const configData = parsed.data;
        // --- IMPORTANT LIMITATION ---
        // We cannot dynamically update process.env variables for the running Node.js process.
        // Environment variables are typically loaded at application startup.
        // Modifying .env files programmatically is risky and requires app restarts.
        // Therefore, this action primarily serves to VALIDATE the input format.
        // The actual connection used by getSheetData/appendSheetRow will still rely on the
        // environment variables set when the server process started.
        console.log('Received valid sheet configuration data (validation only):', {
            sheetId: configData.sheetId,
            sheetRange: configData.sheetRange,
            serviceAccountEmail: configData.serviceAccountEmail,
            privateKey: '[REDACTED]'
        });
        // Simulate saving - In a real scenario, this might write to a config file or DB,
        // but that requires more infrastructure and careful handling.
        // For now, just return success after validation.
        return {
            message: 'Configuration validated successfully. Remember to update environment variables and restart the server for changes to take effect.',
            success: true
        };
    } catch (error) {
        console.error('Save sheet config error:', error);
        return {
            message: 'An unexpected error occurred while validating the configuration.',
            success: false
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    loginAction,
    logoutAction,
    submitDataAction,
    saveSheetConfigAction
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(loginAction, "60aa8be677b96db11da812d84f364cdfd2662320a2", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(logoutAction, "00830883cc3e3d4983b359610b1873f6aa5b33c4a0", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(submitDataAction, "6084a6390a3565620cbc23c59969a01ccc07f96681", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(saveSheetConfigAction, "60b5c37fd5688750901aa043ff1da817ffbb8ef2d4", null);
}}),
"[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
;
;
;
}}),
"[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <exports>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "00830883cc3e3d4983b359610b1873f6aa5b33c4a0": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["logoutAction"]),
    "6084a6390a3565620cbc23c59969a01ccc07f96681": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["submitDataAction"]),
    "60aa8be677b96db11da812d84f364cdfd2662320a2": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["loginAction"]),
    "60b5c37fd5688750901aa043ff1da817ffbb8ef2d4": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["saveSheetConfigAction"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "00830883cc3e3d4983b359610b1873f6aa5b33c4a0": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["00830883cc3e3d4983b359610b1873f6aa5b33c4a0"]),
    "6084a6390a3565620cbc23c59969a01ccc07f96681": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["6084a6390a3565620cbc23c59969a01ccc07f96681"]),
    "60aa8be677b96db11da812d84f364cdfd2662320a2": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["60aa8be677b96db11da812d84f364cdfd2662320a2"]),
    "60b5c37fd5688750901aa043ff1da817ffbb8ef2d4": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["60b5c37fd5688750901aa043ff1da817ffbb8ef2d4"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <module evaluation>');
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$admin$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/admin/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <exports>');
}}),
"[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript)"));
}}),
"[project]/src/app/layout.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/layout.tsx [app-rsc] (ecmascript)"));
}}),
"[project]/src/components/login-form.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "LoginForm": (()=>LoginForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const LoginForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call LoginForm() from the server but LoginForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/login-form.tsx <module evaluation>", "LoginForm");
}}),
"[project]/src/components/login-form.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "LoginForm": (()=>LoginForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const LoginForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call LoginForm() from the server but LoginForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/login-form.tsx", "LoginForm");
}}),
"[project]/src/components/login-form.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$login$2d$form$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/login-form.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$login$2d$form$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/login-form.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$login$2d$form$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/components/admin-form.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "AdminForm": (()=>AdminForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const AdminForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call AdminForm() from the server but AdminForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/admin-form.tsx <module evaluation>", "AdminForm");
}}),
"[project]/src/components/admin-form.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "AdminForm": (()=>AdminForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const AdminForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call AdminForm() from the server but AdminForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/admin-form.tsx", "AdminForm");
}}),
"[project]/src/components/admin-form.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2d$form$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/admin-form.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2d$form$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/admin-form.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2d$form$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/components/sheet-config-form.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "SheetConfigForm": (()=>SheetConfigForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const SheetConfigForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call SheetConfigForm() from the server but SheetConfigForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/sheet-config-form.tsx <module evaluation>", "SheetConfigForm");
}}),
"[project]/src/components/sheet-config-form.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "SheetConfigForm": (()=>SheetConfigForm)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const SheetConfigForm = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call SheetConfigForm() from the server but SheetConfigForm is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/sheet-config-form.tsx", "SheetConfigForm");
}}),
"[project]/src/components/sheet-config-form.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$sheet$2d$config$2d$form$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/sheet-config-form.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$sheet$2d$config$2d$form$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/sheet-config-form.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$sheet$2d$config$2d$form$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/components/logout-button.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "LogoutButton": (()=>LogoutButton)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const LogoutButton = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call LogoutButton() from the server but LogoutButton is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/logout-button.tsx <module evaluation>", "LogoutButton");
}}),
"[project]/src/components/logout-button.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "LogoutButton": (()=>LogoutButton)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const LogoutButton = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call LogoutButton() from the server but LogoutButton is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/logout-button.tsx", "LogoutButton");
}}),
"[project]/src/components/logout-button.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$logout$2d$button$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/logout-button.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$logout$2d$button$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/logout-button.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$logout$2d$button$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/components/ui/separator.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Separator": (()=>Separator)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const Separator = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call Separator() from the server but Separator is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/ui/separator.tsx <module evaluation>", "Separator");
}}),
"[project]/src/components/ui/separator.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Separator": (()=>Separator)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const Separator = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call Separator() from the server but Separator is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/components/ui/separator.tsx", "Separator");
}}),
"[project]/src/components/ui/separator.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$separator$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/components/ui/separator.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$separator$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/components/ui/separator.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$separator$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/app/admin/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>AdminPage),
    "dynamic": (()=>dynamic)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/headers.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$login$2d$form$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/login-form.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2d$form$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin-form.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$sheet$2d$config$2d$form$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/sheet-config-form.tsx [app-rsc] (ecmascript)"); // Updated import
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$logout$2d$button$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/logout-button.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/separator.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
function AdminPage() {
    const cookieStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    const loggedIn = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["isAuthenticated"])(cookieStore);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: loggedIn ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex justify-between items-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-3xl font-bold",
                            children: "Admin Panel"
                        }, void 0, false, {
                            fileName: "[project]/src/app/admin/page.tsx",
                            lineNumber: 18,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$logout$2d$button$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["LogoutButton"], {}, void 0, false, {
                            fileName: "[project]/src/app/admin/page.tsx",
                            lineNumber: 19,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/admin/page.tsx",
                    lineNumber: 17,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-muted-foreground",
                    children: "Add new entries to the Google Sheet."
                }, void 0, false, {
                    fileName: "[project]/src/app/admin/page.tsx",
                    lineNumber: 21,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2d$form$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AdminForm"], {}, void 0, false, {
                    fileName: "[project]/src/app/admin/page.tsx",
                    lineNumber: 22,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$separator$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Separator"], {
                    className: "my-8"
                }, void 0, false, {
                    fileName: "[project]/src/app/admin/page.tsx",
                    lineNumber: 24,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$sheet$2d$config$2d$form$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["SheetConfigForm"], {}, void 0, false, {
                    fileName: "[project]/src/app/admin/page.tsx",
                    lineNumber: 27,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$login$2d$form$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["LoginForm"], {}, void 0, false, {
            fileName: "[project]/src/app/admin/page.tsx",
            lineNumber: 31,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/admin/page.tsx",
        lineNumber: 14,
        columnNumber: 5
    }, this);
}
const dynamic = 'force-dynamic';
}}),
"[project]/src/app/admin/page.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/admin/page.tsx [app-rsc] (ecmascript)"));
}}),

};

//# sourceMappingURL=%5Broot%20of%20the%20server%5D__745940cb._.js.map