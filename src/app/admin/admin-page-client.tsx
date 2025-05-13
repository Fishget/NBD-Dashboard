'use client';

import { useState, useEffect, Suspense } from 'react';
import { AdminForm } from '@/components/admin-form';
import { SheetConfigForm } from '@/components/sheet-config-form';
import { LogoutButton } from '@/components/logout-button';
import { ConnectionTester } from '@/components/connection-tester';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TestTubeDiagonal, Eye, EyeOff, LayoutGrid, Settings, Table as TableIcon, ServerCrash, InfoIcon } from 'lucide-react';
import { LoginForm } from '@/components/login-form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { DashboardTable } from '@/components/dashboard-table';
import { Skeleton } from '@/components/ui/skeleton';
import { getSheetData } from '@/lib/sheets'; // Restored import
import type { SheetRow } from '../../lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


interface AdminPageClientProps {
  initialLoggedIn: boolean;
}

// Helper component for loading skeleton
function AdminTableSkeleton() {
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

// This component now attempts to fetch data again.
// It is an async component. If called directly from AdminPageClient (a 'use client' component),
// it will cause an "async Client Component" error.
// This should ideally be refactored or used in a Server Component context.
async function AdminDashboardDisplayWrapper() {
  // console.log("[AdminPageClient:AdminDashboardDisplayWrapper SC] Attempting to fetch data for admin dashboard.");
  let data: SheetRow[] = [];
  let errorOccurred = false;
  try {
    const fetchedData = await getSheetData();
    data = Array.isArray(fetchedData) ? fetchedData : [];
  } catch (error) {
    console.error("[AdminPageClient:AdminDashboardDisplayWrapper SC] Failed to fetch data for admin dashboard:", error);
    data = []; // Ensure data is an array on error
    errorOccurred = true;
  }

  if (errorOccurred) {
    return (
        <div className="my-4 p-4 border border-destructive/20 rounded-md bg-destructive/10">
            <div className="flex items-center gap-3 text-destructive">
                <ServerCrash className="h-8 w-8" />
                <div>
                    <p className="font-semibold">Error Fetching Dashboard Preview Data</p>
                    <p className="text-sm">
                        Could not load data from Google Sheets for the preview. Please verify your API configuration and connection. Check server logs.
                    </p>
                </div>
            </div>
        </div>
    );
  }
  
  if (data.length === 0 && !errorOccurred) {
    return (
         <div className="my-4 p-4 border border-dashed border-border rounded-md bg-muted/50">
            <div className="flex items-center gap-3 text-muted-foreground">
                <InfoIcon className="h-8 w-8 text-blue-500" />
                <div>
                    <p className="font-semibold text-card-foreground">No Data for Preview</p>
                    <p className="text-sm">
                        The Google Sheet appears to be empty or no data was returned for the preview.
                        If this is unexpected, please check the sheet and your API configuration.
                    </p>
                </div>
            </div>
        </div>
    );
  }

  return <DashboardTable initialData={data} />;
}


export default function AdminPageClient({ initialLoggedIn }: AdminPageClientProps) {
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);
  const [isConnectionVerified, setIsConnectionVerified] = useState(false);
  const [showConfigFormOverride, setShowConfigFormOverride] = useState(false);

  useEffect(() => {
    setLoggedIn(initialLoggedIn);
    if (!initialLoggedIn) {
        setIsConnectionVerified(false);
        setShowConfigFormOverride(false);
    }
  }, [initialLoggedIn]);

  const handleConnectionSuccess = () => {
    setIsConnectionVerified(true);
    setShowConfigFormOverride(false); 
  };

  const toggleShowConfigForm = () => {
    setShowConfigFormOverride(prev => !prev);
  }

  const displayConfigForm = !isConnectionVerified || showConfigFormOverride;

  if (!loggedIn) {
    return <LoginForm />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Login</h1>
        <LogoutButton />
      </div>

      <Tabs defaultValue="data-entry" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="data-entry">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Data Entry &amp; View
          </TabsTrigger>
          <TabsTrigger value="configuration">
            <Settings className="mr-2 h-4 w-4" />
            Sheet Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data-entry" className="mt-6 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Add New Entry</CardTitle>
              <CardDescription>Add new entries to the Google Sheet.</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminForm />
            </CardContent>
          </Card>
          
          <Accordion type="single" collapsible className="w-full" defaultValue="dashboard-preview">
            <AccordionItem value="dashboard-preview">
              <AccordionTrigger>
                <div className="flex items-center gap-2 text-lg font-semibold">
                    <TableIcon className="h-5 w-5" />
                    <span>Dashboard Preview</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                    <CardHeader>
                        <CardTitle>Live Dashboard Preview</CardTitle>
                        <CardDescription className="flex items-start gap-2">
                           <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                           <span>
                             View the current data from the Google Sheet. This is a read-only preview.
                             If data fetching fails, an error message will be displayed. Ensure Google Sheets API configuration is correct.
                           </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<AdminTableSkeleton />}>
                            <AdminDashboardDisplayWrapper />
                        </Suspense>
                    </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

        </TabsContent>

        <TabsContent value="configuration" className="mt-6 space-y-8">
          {displayConfigForm ? (
            <SheetConfigForm />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Google Sheet Configuration</CardTitle>
                <CardDescription>
                  Connection to Google Sheets has been successfully verified. The configuration form is hidden.
                </CardDescription>
              </CardHeader>
              <CardContent>
                 <Button onClick={toggleShowConfigForm} variant="outline">
                    <Eye className="mr-2 h-4 w-4" /> Show Configuration Form
                </Button>
              </CardContent>
            </Card>
          )}
          
          {isConnectionVerified && !displayConfigForm && <Separator />}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <TestTubeDiagonal className="h-5 w-5" />
                  Google Sheet Connection Test
              </CardTitle>
              <CardDescription>
                Test the live connection to Google Sheets using current server environment variables.
                {isConnectionVerified && (
                    <span className="block mt-2 text-sm text-green-600 dark:text-green-400">
                        Successfully connected.
                        {!displayConfigForm && " Configuration form is currently hidden."}
                    </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectionTester onConnectionSuccess={handleConnectionSuccess} />
              {isConnectionVerified && displayConfigForm && (
                 <Button onClick={toggleShowConfigForm} variant="outline" className="mt-4">
                    <EyeOff className="mr-2 h-4 w-4" /> Hide Configuration Form
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
