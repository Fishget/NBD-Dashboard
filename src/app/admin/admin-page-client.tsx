'use client';

import { useState, useEffect, Suspense } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminForm } from '@/components/admin-form';
import { SheetConfigForm } from '@/components/sheet-config-form';
import { LogoutButton } from '@/components/logout-button';
import { ConnectionTester } from '@/components/connection-tester';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TestTubeDiagonal, Eye, EyeOff, LayoutGrid, Settings, Table as TableIcon, InfoIcon, RefreshCw, LogOut } from 'lucide-react';
import { LoginForm } from '@/components/login-form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/lib/actions';


interface AdminPageClientProps {
  initialLoggedIn: boolean;
  dashboardDisplaySlot: ReactNode;
}

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


export default function AdminPageClient({ initialLoggedIn, dashboardDisplaySlot }: AdminPageClientProps) {
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);
  const [isConnectionVerified, setIsConnectionVerified] = useState(false);
  const [showConfigFormOverride, setShowConfigFormOverride] = useState(false);
  const [isDashboardRefreshing, setIsDashboardRefreshing] = useState(false);
  const router = useRouter();

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
    router.refresh(); // Refresh to potentially hide config form if connection becomes verified
  };

  const toggleShowConfigForm = () => {
    setShowConfigFormOverride(prev => !prev);
  }

  const handleRefreshDashboard = async () => {
    if (isDashboardRefreshing) return;
    setIsDashboardRefreshing(true);
    router.refresh();
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsDashboardRefreshing(false);
  };

  const handleClientLogout = () => {
    setLoggedIn(false);
    // Additional client-side cleanup if necessary
  };


  const displayConfigForm = !isConnectionVerified || showConfigFormOverride;

  if (!loggedIn) {
    return <LoginForm />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Login</h1>
        <form action={async () => {
          await logoutAction(); // Server action
          handleClientLogout(); // Update client state
          // router.refresh(); // Let Next.js handle redirection/refresh based on auth state
        }}>
          <Button type="submit" variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </form>
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
            {/* Removed CardHeader and CardDescription for "Add New Entry" */}
            <CardContent className="pt-6"> {/* Added pt-6 since header is removed */}
              <AdminForm onSuccessfulSubmit={handleRefreshDashboard} />
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
                        <div className="flex justify-between items-center">
                           <CardTitle>Live Dashboard Preview</CardTitle>
                           <Button variant="outline" size="sm" onClick={handleRefreshDashboard} disabled={isDashboardRefreshing}>
                               <RefreshCw className={cn("mr-2 h-4 w-4", isDashboardRefreshing && "animate-spin-slow")} />
                               {isDashboardRefreshing ? 'Refreshing...' : 'Refresh'}
                           </Button>
                        </div>
                        {/* Removed the CardDescription for dashboard preview
                        <CardDescription className="flex items-start gap-2 pt-2">
                           <InfoIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                           <span>
                             This is a read-only preview of the current data. Configuration errors might affect display.
                           </span>
                        </CardDescription>
                        */}
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<AdminTableSkeleton />}>
                            {dashboardDisplaySlot}
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