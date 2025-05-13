import { Suspense } from 'react';
import { getSheetData, type SheetRow } from '@/lib/sheets';
import { DashboardTable } from '@/components/dashboard-table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
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
  let errorMessage = '';

  try {
    // console.log("Home page: Attempting to fetch dashboard data...");
    data = await getSheetData();
    // console.log(`Home page: Successfully fetched ${data.length} rows.`);
    if (data.length === 0) {
      // This could be due to an empty sheet or an error handled in getSheetData returning []
      // console.log("Home page: getSheetData returned 0 rows. This might indicate an issue with sheet access or an empty sheet.");
    }
  } catch (error: any) {
    errorOccurred = true;
    errorMessage = error.message || 'An unknown error occurred while fetching data.';
    console.error("Home page: CRITICAL error during getSheetData call:", error);
    // `getSheetData` is designed to catch its internal errors and return [],
    // so this catch block here is for unexpected errors if `getSheetData` itself throws.
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
          <p>There was a problem fetching data from Google Sheets.</p>
          <p className="text-sm text-muted-foreground mt-2">Details: {errorMessage}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please check the server logs for more specific error messages related to Google Sheets API connectivity or authentication.
            Common issues include incorrect API credentials in <code className="font-mono bg-muted px-1 py-0.5 rounded">.env.local</code> (GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY), or the service account not having permissions for the sheet.
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
