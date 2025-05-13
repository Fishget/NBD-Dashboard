
import { Suspense } from 'react';
import type { SheetRow } from '../lib/types';
import { getSheetData } from '@/lib/sheets';
import { DashboardTable } from '@/components/dashboard-table';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoIcon, ServerCrash, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshButton } from '@/components/refresh-button'; // Added import

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
  let isConfigError = false; 
  let userFriendlyMessage = "Live Data";

  try {
    const dataResult = await getSheetData(); 

    if (dataResult === null) {
      isConfigError = true;
      userFriendlyMessage = "CRITICAL CONFIGURATION ERROR: Could not connect to Google Sheets. Please ensure GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and a valid GOOGLE_PRIVATE_KEY are correctly set in your environment variables and the server has been restarted. Check server logs for '[SheetLib:]' messages for details.";
      tableData = []; 
    } else {
      tableData = Array.isArray(dataResult) ? dataResult : [];
      if (tableData.length === 0) {
        userFriendlyMessage = "No data available in the Google Sheet, or the sheet is empty. If this is unexpected, please verify the sheet contents and the API configuration (Sheet ID, Range, Permissions) in the admin panel or server logs if an API error was logged by [SheetLib:getSheetData].";
      }
    }
  } catch (error: any) { 
    console.error("[Page:DashboardData SC] Unexpected error during data fetching:", error);
    errorOccurred = true; 
    userFriendlyMessage = `An unexpected error occurred while fetching data: ${error.message || 'Unknown error'}. Please check server logs.`;
    tableData = []; 
  }

  const isSuccessWithData = !isConfigError && !errorOccurred && tableData.length > 0;

  return (
    <Card className="my-8 shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-primary">
            <InfoIcon className="h-6 w-6" />
            Dashboard View
          </CardTitle>
          <RefreshButton /> {/* Added RefreshButton */}
        </div>
         <CardDescription className={isSuccessWithData ? "text-primary" : ""}>
          {userFriendlyMessage}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConfigError && (
             <div className="my-4 p-4 border border-destructive/50 rounded-md bg-destructive/10">
                <div className="flex items-center gap-3 text-destructive">
                    <AlertTriangle className="h-8 w-8" />
                    <div>
                        <p className="font-semibold">Configuration Error</p>
                        <p className="text-sm">
                           {userFriendlyMessage}
                        </p>
                    </div>
                </div>
            </div>
        )}
        {errorOccurred && !isConfigError && ( 
             <div className="my-4 p-4 border border-destructive/20 rounded-md bg-destructive/10">
                <div className="flex items-center gap-3 text-destructive">
                    <ServerCrash className="h-8 w-8" />
                    <div>
                        <p className="font-semibold">Error Fetching Data</p>
                        <p className="text-sm">
                            {userFriendlyMessage}
                        </p>
                    </div>
                </div>
            </div>
        )}
        {tableData.length === 0 && !isConfigError && !errorOccurred && (
             <div className="my-4 p-4 border border-dashed border-border rounded-md bg-muted/50">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <InfoIcon className="h-8 w-8 text-primary" />
                    <div>
                        <p className="font-semibold text-card-foreground">No Data to Display</p>
                        <p className="text-sm">
                           {userFriendlyMessage}
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
