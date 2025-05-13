${'use client'}';

import { useState, useEffect, Suspense } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminForm } from '@/components/admin-form';
import { SheetConfigForm } from '@/components/sheet-config-form';
// LogoutButton component is not used directly here anymore, form action handles it.
import { ConnectionTester } from '@/components/connection-tester';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TestTubeDiagonal, Eye, EyeOff, LayoutGrid, Settings, Table as TableIcon, RefreshCw, LogOut } from 'lucide-react';
import { LoginForm } from '@/components/login-form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";


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
  const { toast } = useToast();

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
    router.refresh(); 
  };

  const toggleShowConfigForm = () => {
    setShowConfigFormOverride(prev => !prev);
  }

  const handleManualRefreshDashboard = async () => {
    if (isDashboardRefreshing) return;
    setIsDashboardRefreshing(true);
    router.refresh(); // Manually refresh the route to get fresh data
    // Simulate delay for visual feedback; in a real app, this might await data loading confirmation
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    setIsDashboardRefreshing(false);
  };

  const handleFormSubmissionSuccess = () => {
    // This is called when AdminForm successfully submits data.
    // The server action `submitDataAction` already calls `revalidatePath('/admin')`.
    // This invalidates the server-side cache for the admin page data.
    // The dashboard preview will reflect changes on the next manual refresh or navigation.
    // We are INTENTIONALLY NOT calling router.refresh() here to prevent the automatic page refresh.
    toast({
      title: "Data Submitted",
      description: "Entry added. Refresh dashboard preview to see changes.",
    });
    // The form reset is handled within AdminForm itself.
  };


  const handleClientLogout = () => {
    setLoggedIn(false);
    // Client-side state is updated immediately.
    // The server action handles cookie clearance.
    // Next.js router will handle redirection on next navigation or if page tries to access protected data.
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
          await logoutAction(); 
          handleClientLogout(); 
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
            <CardContent className="pt-6">
              <AdminForm onSuccessfulSubmit={handleFormSubmissionSuccess} />
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
                           <Button variant="outline" size="sm" onClick={handleManualRefreshDashboard} disabled={isDashboardRefreshing}>
                               <RefreshCw className={cn("mr-2 h-4 w-4", isDashboardRefreshing && "animate-spin-slow")} />
                               {isDashboardRefreshing ? 'Refreshing...' : 'Refresh'}
                           </Button>
                        </div>
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
