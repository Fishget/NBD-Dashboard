
'use client';

import { useState, useEffect } from 'react';
import { AdminForm } from '@/components/admin-form';
import { SheetConfigForm } from '@/components/sheet-config-form';
import { LogoutButton } from '@/components/logout-button';
import { ConnectionTester } from '@/components/connection-tester';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TestTubeDiagonal, Eye, EyeOff, LayoutGrid, Settings } from 'lucide-react';
import { LoginForm } from '@/components/login-form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';

interface AdminPageClientProps {
  initialLoggedIn: boolean;
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
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <LogoutButton />
      </div>

      <Tabs defaultValue="data-entry" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="data-entry">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Data Entry
          </TabsTrigger>
          <TabsTrigger value="configuration">
            <Settings className="mr-2 h-4 w-4" />
            Sheet Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data-entry" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Entry</CardTitle>
              <CardDescription>Add new entries to the Google Sheet.</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminForm />
            </CardContent>
          </Card>
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
                    <span className="block mt-2 text-sm text-green-700 dark:text-green-400">
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
