
import { Suspense } from 'react';
import { getSheetData, type SheetRow } from '@/lib/sheets';
import { DashboardTable } from '@/components/dashboard-table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, InfoIcon, ServerCrash } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


// Helper component for loading skeleton
function TableSkeleton() {
  return (
    <div className="space-y-4">
       <div className="flex justify-end">
            <Skeleton className="h-10 w-[250px]" />
       </div>
      <div className="rounded-md border">
        <div className="overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"><Skeleton className="h-4 w-[150px]" /></th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"><Skeleton className="h-4 w-[200px]" /></th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"><Skeleton className="h-4 w-[100px]" /></th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"><Skeleton className="h-4 w-[80px]" /></th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"><Skeleton className="h-4 w-[100px]" /></th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle"><Skeleton className="h-4 w-full" /></td>
                  <td className="p-4 align-middle"><Skeleton className="h-4 w-full" /></td>
                  <td className="p-4 align-middle"><Skeleton className="h-4 w-full" /></td>
                  <td className="p-4 align-middle"><Skeleton className="h-4 w-full" /></td>
                  <td className="p-4 align-middle"><Skeleton className="h-4 w-full" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Data fetching component wrapped for Suspense
async function DashboardData() {
  let data: SheetRow[] | null = null; 
  let errorObject: { message: string; details?: string } | null = null;

  console.log("[Page:DashboardData] Component rendering started.");

  const isConfigSufficient = 
    process.env.GOOGLE_SHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_PRIVATE_KEY.trim() !== '' && 
    process.env.GOOGLE_PRIVATE_KEY.trim() !== '""' && 
    process.env.GOOGLE_PRIVATE_KEY.trim() !== "''";

  if (!isConfigSufficient) {
    console.error("[Page:DashboardData] Initial config check FAILED. Missing or invalid essential env vars.");
    errorObject = {
      message: "Google Sheets API is not configured correctly on the server.",
      details: "One or more essential environment variables (GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY) are missing or invalid. Please ensure these are set correctly (e.g., in your .env.local file or hosting provider settings) and the server has been restarted. The private key, if set, must not be an empty or placeholder string."
    };
  } else {
    try {
      console.log("[Page:DashboardData] Config sufficient. Attempting to fetch dashboard data via getSheetData()...");
      data = await getSheetData(); 
      console.log(`[Page:DashboardData] Successfully fetched ${data?.length ?? 'N/A'} rows.`);
      if (!Array.isArray(data)) {
        console.error("[Page:DashboardData] CRITICAL: getSheetData() did not return an array and did not throw. This is unexpected. Data received:", data);
        throw new Error("Received invalid data format (non-array) from the data source without a prior error being thrown.");
      }
    } catch (error: any) {
      console.error("[Page:DashboardData] CRITICAL error during getSheetData() call or subsequent processing:", error);
      errorObject = {
        message: error.message || 'An unexpected error occurred while fetching data from Google Sheets.',
        details: error.stack || (typeof error === 'string' ? error : 'No stack trace available.')
      };
      if (error.message?.includes("ConfigurationError")) {
         errorObject.details = `${error.message}. This usually means GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, or GOOGLE_PRIVATE_KEY is missing, malformed, or the service account doesn't have permissions. Check server logs for more specific messages starting with '[SheetLib]' or '[SheetLib:getSheetsClient]'.`;
      } else if (error.message?.includes("Failed to initialize Google Sheets client")) {
         errorObject.details = `${error.message}. This indicates a problem during the Google Auth library initialization, often due to a malformed private key or incorrect service account email. Check server logs for '[SheetLib:getSheetsClient]' errors.`;
      } else if (error.message?.includes("APIError")) {
         errorObject.details = error.message;
      }
    }
  }

  if (errorObject) {
    console.log("[Page:DashboardData] Rendering error state UI.");
    // Using basic HTML for robust error display
    return (
      <div style={{ padding: '20px', margin: '20px auto', maxWidth: '800px', border: '2px solid #e74c3c', borderRadius: '8px', backgroundColor: '#fceded', color: '#c0392b', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <h2 style={{ margin: '0', fontSize: '1.5em', fontWeight: 'bold' }}>Dashboard Unavailable</h2>
        </div>
        <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0 0 10px 0' }}>{errorObject.message}</p>
        {errorObject.details && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9ebea', border: '1px dashed #e57373', borderRadius: '4px' }}>
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '0.9em' }}>Technical Details:</p>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.85em', color: '#7f8c8d', margin: '0', maxHeight: '200px', overflowY: 'auto' }}>
              {errorObject.details}
            </pre>
          </div>
        )}
        <p style={{ marginTop: '15px', fontSize: '0.9em', color: '#34495e' }}>
          <strong>Troubleshooting Steps:</strong>
          <ul style={{ margin: '5px 0 0 20px', padding: '0', listStyleType: 'disc' }}>
            <li>Verify that `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_PRIVATE_KEY` are correctly set in your server environment (e.g., `.env.local` file for development).</li>
            <li>Ensure the `GOOGLE_PRIVATE_KEY` is the complete, correctly formatted PEM key string.</li>
            <li>Confirm the service account has appropriate permissions (at least 'Viewer') for the Google Sheet.</li>
            <li>If you recently updated environment variables, <strong>restart your server</strong>.</li>
            <li>Check your server's console logs for more specific error messages, especially those prefixed with `[SheetLib]`, `[Page:DashboardData]`, or relating to Google API calls.</li>
          </ul>
        </p>
      </div>
    );
  }
  
  if (data === null) {
    console.log("[Page:DashboardData] Data is null and no errorObject was set. Rendering unexpected state UI.");
    return (
      <div style={{ padding: '20px', margin: '20px auto', maxWidth: '800px', border: '1px solid #f39c12', borderRadius: '8px', backgroundColor: '#fffaf0', color: '#e67e22' }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Unexpected State</h2>
        <p>The dashboard data could not be prepared, and no specific error was reported. This is an unexpected situation. Please check server logs for messages prefixed with `[Page:DashboardData]` or `[SheetLib]`.</p>
      </div>
    );
  }
  
  if (data.length === 0 && isConfigSufficient) { 
     console.log("[Page:DashboardData] Data array is empty. Rendering 'No Data Found' UI.");
     return (
        <Card className="my-8 shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <InfoIcon className="h-6 w-6" />
                    No Data Found
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-lg">The Google Sheet appears to be empty or no data matches the expected format in the specified range.</p>
                <p className="text-sm text-muted-foreground mt-3">
                    Please ensure your sheet (ID: <code className="font-mono bg-muted px-1 py-0.5 rounded">{process.env.GOOGLE_SHEET_ID}</code>, 
                    Range: <code className="font-mono bg-muted px-1 py-0.5 rounded">{process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:E'}</code>) 
                    contains data with the required headers: <code className="font-mono bg-muted px-1 py-0.5 rounded">Donor/Opp</code>, <code className="font-mono bg-muted px-1 py-0.5 rounded">Action/Next Step</code>, <code className="font-mono bg-muted px-1 py-0.5 rounded">Lead</code>, <code className="font-mono bg-muted px-1 py-0.5 rounded">Priority</code>, <code className="font-mono bg-muted px-1 py-0.5 rounded">Probability</code>.
                </p>
                 <p className="text-sm text-muted-foreground mt-2">If you have data, ensure it starts from the second row (assuming the first row is headers) and that the sheet name in your `GOOGLE_SHEET_RANGE` environment variable is correct.</p>
            </CardContent>
        </Card>
     );
  }
  
  console.log("[Page:DashboardData] Data fetched successfully. Rendering DashboardTable.");
  return <DashboardTable initialData={data} />;
}

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">NBD Dashboard</h1>
      <p className="text-muted-foreground">
        Live Data
      </p>
      <Suspense fallback={<TableSkeleton />}>
        <DashboardData />
      </Suspense>
    </div>
  );
}

// Ensure dynamic rendering as data comes from an external source.
export const dynamic = 'force-dynamic';

    
