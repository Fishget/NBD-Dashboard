'use client'; // Make this file a client component module for DashboardData

import { Suspense, useState, useEffect } from 'react';
// import { getSheetData } from '@/lib/sheets'; // Data fetching still commented out
import type { SheetRow } from '@/lib/sheets'; // Type import is fine
import { DashboardTable } from '@/components/dashboard-table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, InfoIcon, ServerCrash } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';


// Helper component for loading skeleton (remains the same)
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

// DashboardData is now a Client Component to manage client-side rendering of DashboardTable
function DashboardDataWrapper() {
  const [isMounted, setIsMounted] = useState(false);
  // This state would hold fetched data in a real scenario
  const [tableData, setTableData] = useState<SheetRow[]>([]); 

  useEffect(() => {
    console.log("[Page:DashboardDataWrapper CC] Component did mount.");
    setIsMounted(true);
    // Simulate data presence for DashboardTable, or fetch data client-side here
    // For now, using empty array as per previous debug state
    setTableData([]); 
    // Example: if you wanted to fetch data client-side (not recommended for initial load usually):
    // async function fetchData() {
    //   try {
    //     // const data = await getSheetData(); // This would need getSheetData to be callable from client
    //     // setTableData(data || []);
    //   } catch (error) {
    //     console.error("Failed to fetch data client-side:", error);
    //     setTableData([]); // Set empty on error
    //   }
    // }
    // fetchData();
  }, []);

  if (!isMounted) {
    console.log("[Page:DashboardDataWrapper CC] Not mounted yet, returning TableSkeleton.");
    // This skeleton will be shown until the component mounts on the client.
    // The Suspense fallback in Home component might also cover the initial SSR phase.
    return <TableSkeleton />;
  }

  console.log("[Page:DashboardDataWrapper CC] Mounted, rendering actual content with DashboardTable.");
  return (
    <Card className="my-8 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <InfoIcon className="h-6 w-6" />
          Dashboard View
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg">Data fetching from Google Sheets is temporarily disabled for debugging.</p>
        <p className="text-sm text-muted-foreground mt-3">
          This panel confirms that the basic page structure and client-side table rendering are working.
          The actual dashboard table and charts will be restored once connection issues are resolved.
        </p>
         <div className="mt-6">
            <DashboardTable initialData={tableData} />
        </div>
      </CardContent>
    </Card>
  );
}

// Home component remains a Server Component by default (no 'use client' here)
export default function Home() {
  console.log("[Page:Home SC] Rendering Home page.");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">NBD Dashboard</h1>
      <p className="text-muted-foreground">
        Live Data
      </p>
      {/* Suspense will handle the case where DashboardDataWrapper is loading or not yet mounted */}
      <Suspense fallback={<TableSkeleton />}>
        <DashboardDataWrapper />
      </Suspense>
    </div>
  );
}

// Ensure dynamic rendering as data comes from an external source (eventually).
// Or, if the page becomes largely static with client-side fetching, this could be revisited.
export const dynamic = 'force-dynamic';
