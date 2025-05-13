'use client'; 

import { Suspense, useState, useEffect } from 'react';
import type { SheetRow } from '@/lib/types'; // Import SheetRow from the new types.ts
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

// DashboardDataWrapper is a Client Component to manage client-side rendering of DashboardTable
function DashboardDataWrapper() {
  const [isMounted, setIsMounted] = useState(false);
  // Initialize with empty array. Data fetching from server is currently disabled here
  // to ensure the basic UI renders without relying on external data calls that might fail.
  const [tableData, setTableData] = useState<SheetRow[]>([]); 

  useEffect(() => {
    // console.log("[Page:DashboardDataWrapper CC] Component did mount. Data fetching is currently DISABLED.");
    setIsMounted(true);
    // To enable actual data fetching from Google Sheets (via a Server Action),
    // you would uncomment and implement the following:
    // import { getSheetData } from '@/lib/sheets'; 
    // async function fetchData() {
    //   try {
    //     // const data = await getSheetData(); // Call the Server Action
    //     // setTableData(data || []); // Ensure data is an array
    //     // console.log("[Page:DashboardDataWrapper CC] Data fetched (or attempted).");
    //   } catch (error) {
    //     // console.error("[Page:DashboardDataWrapper CC] Failed to fetch data client-side:", error);
    //     // setTableData([]); // Set empty on error
    //   }
    // }
    // fetchData(); 
  }, []);

  if (!isMounted) {
    // console.log("[Page:DashboardDataWrapper CC] Not mounted yet, returning TableSkeleton.");
    return <TableSkeleton />;
  }

  // console.log("[Page:DashboardDataWrapper CC] Mounted, rendering content with DashboardTable.");
  return (
    <Card className="my-8 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <InfoIcon className="h-6 w-6" />
          Dashboard View
        </CardTitle>
         <CardDescription>
          The dashboard is currently displaying with no live data. Data fetching from Google Sheets is disabled to ensure the application loads.
          To enable live data, please ensure correct Google Sheets API configuration and re-enable data fetching logic in the application code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(tableData === null || tableData.length === 0) && ( 
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
            {/* Pass an empty array if tableData is null/undefined to prevent errors in DashboardTable */}
            <DashboardTable initialData={tableData || []} /> 
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
        <DashboardDataWrapper />
      </Suspense>
    </div>
  );
}

// Using force-dynamic can be helpful if underlying data changes frequently.
// However, for diagnosing blank screen issues, client-side error handling and
// robust server-side data fetching (to avoid SSR crashes) are more critical.
export const dynamic = 'force-dynamic';
