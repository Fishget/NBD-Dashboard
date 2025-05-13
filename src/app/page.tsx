import { Suspense } from 'react';
import { getSheetData, type SheetRow } from '@/lib/sheets';
import { DashboardTable } from '@/components/dashboard-table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, InfoIcon } from 'lucide-react'; // Added InfoIcon
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


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
  let data: SheetRow[] = [];
  let errorOccurred = false;
  let errorMessage = 'An unknown error occurred while fetching data.';
  let errorDetails = ''; // To store more specific details for display

  // Check for essential env variables for a more specific initial error message
  const isConfigSufficient = 
    process.env.GOOGLE_SHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_PRIVATE_KEY.trim() !== '' &&
    process.env.GOOGLE_PRIVATE_KEY.trim() !== '""' && // handle empty string in quotes
    process.env.GOOGLE_PRIVATE_KEY.trim() !== "''";


  if (!isConfigSufficient) {
    errorOccurred = true;
    errorMessage = "Google Sheets API is not configured.";
    errorDetails = "The application is missing necessary Google Sheets API credentials (Sheet ID, Service Account Email, Private Key) in its server environment. Please ensure these are set, for example, in your .env.local file and that the server has been restarted. Check server logs for more specific details on which variable is missing or malformed (look for '[SheetLib:getSheetsClient]' logs).";
  } else {
    try {
      // console.log("Home page: Attempting to fetch dashboard data...");
      data = await getSheetData(); // This will now throw on critical errors
      // console.log(`Home page: Successfully fetched ${data.length} rows.`);
    } catch (error: any) {
      errorOccurred = true;
      errorMessage = error.message || 'An unexpected error occurred while fetching data from Google Sheets.';
      // errorDetails = error.stack || 'No stack trace available.';
      // The error.message from getSheetData is now more specific.
      errorDetails = `Error details from getSheetData: ${error.message}${error.stack ? `\nStack: ${error.stack}` : ''}`;
      console.error("Home page: CRITICAL error during getSheetData call:", error);
    }
  }


  if (errorOccurred) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle />
            Error Loading Dashboard Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold">{errorMessage}</p>
          {errorDetails && (
            <div className="mt-2 p-3 bg-muted rounded-md border border-destructive/30">
              <p className="text-sm text-card-foreground font-medium mb-1">Technical Details:</p>
              <pre className="text-xs whitespace-pre-wrap break-all text-muted-foreground">{errorDetails}</pre>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            Please check the server logs for more specific error messages related to Google Sheets API connectivity or authentication (look for "[SheetLib]" logs).
            Common issues include incorrect API credentials (GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY format), or the service account not having permissions for the sheet.
             If you've recently updated environment variables, ensure you've restarted the server.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // If config is present, but data is empty, it might be an empty sheet
  if (data.length === 0 && isConfigSufficient) {
     return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <InfoIcon className="h-5 w-5" />
                    No Data Found
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>The Google Sheet appears to be empty or no data matches the expected format in the specified range.</p>
                <p className="text-sm text-muted-foreground mt-2">
                    Please ensure your sheet (ID: <code className="font-mono bg-muted px-1 py-0.5 rounded">{process.env.GOOGLE_SHEET_ID}</code>, 
                    Range: <code className="font-mono bg-muted px-1 py-0.5 rounded">{process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:E'}</code>) 
                    contains data with the required headers: Donor/Opp, Action/Next Step, Lead, Priority, Probability.
                </p>
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

// Ensure dynamic rendering as data comes from an external source and to reflect any auth changes.
export const dynamic = 'force-dynamic';
// Optional: Revalidate cache periodically if data changes frequently and force-dynamic isn't sufficient.
// export const revalidate = 60; 