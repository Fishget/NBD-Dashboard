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
import { getSheetData } from '@/lib/sheets'; // Server action
import type { SheetRow } from '@/lib/types'; // Import SheetRow from the new types.ts
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


async function AdminDashboardDisplayWrapper() {
  let data: SheetRow[] = [];
  let errorFetchingData = false;
  let errorMessage = "Could not fetch data from Google Sheets. Please check server logs and connection settings.";

  try {
    // getSheetData should return [] if config is bad or API call fails.
    // It should not throw an error that crashes this Server Component.
    data = await getSheetData(); 
    if (data === null || data.length === 0) {
        // This case means getSheetData executed but returned no data.
        // This could be due to an empty sheet OR a configuration issue silently handled in getSheetData.
        // We want to provide a more specific message if possible.
        // Checking if env vars are set as a proxy for "is config likely an issue?"
        const envVarsLikelyMissing = !(process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
        if (envVarsLikelyMissing) {
            errorMessage = "Dashboard preview is empty. This is likely due to missing or incorrect Google Sheets API credentials on the server (e.g., in .env.local). Please configure and test the connection in the 'Sheet Configuration' tab and restart the server.";
            errorFetchingData = true; // Treat as an error for display purposes
        } else {
            // Config seems to be there, so maybe the sheet is just empty or getSheetData filtered everything.
            // DashboardTable will show "No data available..." in this case if data is indeed [].
            // No explicit error message here unless data is explicitly null from a severe failure.
        }
    }
  } catch (e: any) {
    // This catch block is a fallback, ideally getSheetData handles its own errors and returns [].
    console.error("AdminDashboardDisplayWrapper: Critical error during getSheetData call:", e.message, e.stack);
    errorMessage = `A critical error occurred while trying to fetch sheet data: ${e.message}. Check server logs for more details.`;
    errorFetchingData = true; 
    data = []; // Ensure data is an empty array on error
  }

  if (errorFetchingData) {
    return (
      <div className="my-4 p-4 border border-destructive rounded-md bg-destructive/10">
        <div className="flex items-center gap-3 text-destructive">
          <ServerCrash className="h-8 w-8" />
          <div>
            <p className="font-semibold">Error Loading Dashboard Preview</p>
            <p className="text-sm">
              {errorMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }
  // If data is empty due to an empty sheet (and config is okay), DashboardTable will show "No data available..."
  // Pass empty array if data is null for any reason to prevent DashboardTable errors.
  return <DashboardTable initialData={data || []} />;
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
                             If data is not shown or an error appears, it may indicate issues with the Google Sheets API configuration (e.g., in <code className="font-mono text-xs bg-muted p-0.5 rounded">.env.local</code>) or that the sheet is empty. 
                             Use the 'Sheet Configuration' tab to verify settings.
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