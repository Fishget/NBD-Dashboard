
import { Suspense } from 'react';
import type { SheetRow } from '../lib/types';
import { getSheetData } from '@/lib/sheets';
import { DashboardTable } from '@/components/dashboard-table';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoIcon, ServerCrash } from 'lucide-react';
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

// DashboardData is a Server Component to fetch data
async function DashboardData() {
  let tableData: SheetRow[] = [];
  let errorOccurred = false;
  let errorMessage = "The dashboard is currently displaying with no live data. Data fetching from Google Sheets is disabled to ensure the application loads. To enable live data, please ensure correct Google Sheets API configuration and re-enable data fetching logic in the application code.";

  try {
    // console.log("[Page:DashboardData SC] Attempting to fetch data.");
    const data = await getSheetData();
    tableData = Array.isArray(data) ? data : [];
    if (tableData.length > 0) {
        errorMessage = "Live data from Google Sheet. Use the filter input to search across all columns. Click column headers to sort.";
    } else {
        errorMessage = "No data available in the Google Sheet, or the sheet is empty. Please check the sheet and API configuration if you expect data.";
    }
  } catch (error: any) {
    console.error("[Page:DashboardData SC] Failed to fetch data:", error);
    errorOccurred = true;
    tableData = []; // Ensure tableData is an array on error
    errorMessage = `Error fetching data: ${error.message || 'Unknown error'}. Please check server logs and API configuration.`;
  }

  return (
    <Card className="my-8 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <InfoIcon className="h-6 w-6" />
          Dashboard View
        </CardTitle>
         <CardDescription>
          {errorMessage}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorOccurred && (
             <div className="my-4 p-4 border border-destructive/20 rounded-md bg-destructive/10">
                <div className="flex items-center gap-3 text-destructive">
                    <ServerCrash className="h-8 w-8" />
                    <div>
                        <p className="font-semibold">Error Fetching Data</p>
                        <p className="text-sm">
                            Could not load data from Google Sheets. Please verify your API configuration in the admin panel and ensure the server can connect to Google Sheets. Check server logs for details.
                        </p>
                    </div>
                </div>
            </div>
        )}
        {/* Display this message only if no error occurred but data is empty */}
        {(!tableData || tableData.length === 0) && !errorOccurred && (
             <div className="my-4 p-4 border border-dashed border-border rounded-md bg-muted/50">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <ServerCrash className="h-8 w-8 text-destructive" />
                    <div>
                        <p className="font-semibold text-card-foreground">Data Display Notice</p>
                        <p className="text-sm">
                            The dashboard is currently displaying with no live data.
                            This may be due to missing or incorrect Google Sheets API configuration on the server (check <code className="font-mono text-xs bg-destructive/20 p-0.5 rounded">.env.local</code> and restart the server), the sheet itself might be empty, or data fetching is intentionally disabled.
                            Please ensure the Google Sheet connection is correctly set up in the Admin panel and that data fetching logic is enabled if it was previously commented out.
                        </p>
                    </div>
                </div>
            </div>
        )}
         <div className="mt-6">
            <DashboardTable initialData={tableData} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  // console.log("[Page:Home SC] Rendering Home page.");
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

export const dynamic = 'force-dynamic';
