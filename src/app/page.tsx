
import { Suspense } from 'react';
import { getSheetData, type SheetRow } from '@/lib/sheets';
import { DashboardTable } from '@/components/dashboard-table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, InfoIcon, ServerCrash } from 'lucide-react'; // Added ServerCrash
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
  let data: SheetRow[] | null = null; // Allow null to explicitly track fetch state
  let errorObject: { message: string; details?: string } | null = null;

  // Check for essential env variables for a more specific initial error message
  const isConfigSufficient = 
    process.env.GOOGLE_SHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_PRIVATE_KEY.trim() !== '' &&
    process.env.GOOGLE_PRIVATE_KEY.trim() !== '""' && 
    process.env.GOOGLE_PRIVATE_KEY.trim() !== "''";

  if (!isConfigSufficient) {
    errorObject = {
      message: "Google Sheets API is not configured correctly on the server.",
      details: "One or more essential environment variables (GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY) are missing or invalid. Please ensure these are set correctly (e.g., in your .env.local file or hosting provider settings) and the server has been restarted. The private key, if set, must not be an empty or placeholder string."
    };
  } else {
    try {
      console.log("Home page: Attempting to fetch dashboard data via getSheetData()...");
      data = await getSheetData(); 
      console.log(`Home page: Successfully fetched ${data?.length ?? 'N/A'} rows.`);
      if (!Array.isArray(data)) {
        console.error("Home page: getSheetData() did not return an array. This is unexpected. Data received:", data);
        throw new Error("Received invalid data format from the data source.");
      }
    } catch (error: any) {
      console.error("Home page: CRITICAL error during getSheetData() call:", error);
      errorObject = {
        message: error.message || 'An unexpected error occurred while fetching data from Google Sheets.',
        details: error.stack || 'No stack trace available.'
      };
      if (error.message?.includes("ConfigurationError")) { // Specific error from our sheets.ts
         errorObject.details = `${error.message}. This usually means GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, or GOOGLE_PRIVATE_KEY is missing, malformed, or the service account doesn't have permissions. Check server logs for more specific messages starting with '[SheetLib]' or '[SheetLib:getSheetsClient]'.`;
      } else if (error.message?.includes("Failed to initialize Google Sheets client")) {
         errorObject.details = `${error.message}. This indicates a problem during the Google Auth library initialization, often due to a malformed private key or incorrect service account email. Check server logs for '[SheetLib:getSheetsClient]' errors.`;
      }
    }
  }

  if (errorObject) {
    return (
      <Card className="border-destructive shadow-xl my-8">
        <CardHeader className="bg-destructive text-destructive-foreground">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <ServerCrash className="h-8 w-8" />
            Dashboard Unavailable
          </CardTitle>
           <CardDescription className="text-destructive-foreground/90">
            Failed to load data from Google Sheets.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          <p className="font-semibold text-lg text-card-foreground">{errorObject.message}</p>
          {errorObject.details && (
            <div className="mt-2 p-3 bg-muted rounded-md border border-destructive/30">
              <p className="text-sm text-card-foreground font-medium mb-1">Technical Details:</p>
              <pre className="text-xs whitespace-pre-wrap break-all text-muted-foreground">{errorObject.details}</pre>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            <strong>Troubleshooting Steps:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Verify that `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_PRIVATE_KEY` are correctly set in your server environment (e.g., `.env.local` file for development).</li>
              <li>Ensure the `GOOGLE_PRIVATE_KEY` is the complete, correctly formatted PEM key string.</li>
              <li>Confirm the service account has appropriate permissions (at least 'Viewer') for the Google Sheet.</li>
              <li>If you recently updated environment variables, restart your server.</li>
              <li>Check your server's console logs for more specific error messages, especially those prefixed with `[SheetLib]` or relating to Google API calls.</li>
            </ul>
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (data === null) {
    // This case should ideally be caught by the errorObject block if fetching failed.
    // If data is null but no errorObject, it's an unexpected state.
    return (
        <Card className="border-destructive shadow-xl my-8">
             <CardHeader className="bg-destructive text-destructive-foreground">
                <CardTitle className="flex items-center gap-3 text-2xl">
                    <ServerCrash className="h-8 w-8" />
                    Unexpected State
                </CardTitle>
             </CardHeader>
            <CardContent className="pt-6">
                <p>The dashboard data could not be prepared, and no specific error was reported. This is an unexpected situation. Please check server logs.</p>
            </CardContent>
        </Card>
    );
  }
  
  if (data.length === 0 && isConfigSufficient) { // data is confirmed to be an array here
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

    