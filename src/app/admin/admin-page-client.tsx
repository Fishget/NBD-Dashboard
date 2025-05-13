
'use client';

import { useState, useEffect } from 'react';
import { AdminForm } from '@/components/admin-form';
import { SheetConfigForm } from '@/components/sheet-config-form';
import { LogoutButton } from '@/components/logout-button';
import { Separator } from '@/components/ui/separator';
import { ConnectionTester } from '@/components/connection-tester';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TestTubeDiagonal } from 'lucide-react';
import { LoginForm } from '@/components/login-form';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

interface AdminPageClientProps {
  initialLoggedIn: boolean;
}

export default function AdminPageClient({ initialLoggedIn }: AdminPageClientProps) {
  const [loggedIn, setLoggedIn] = useState(initialLoggedIn);
  const [isConnectionVerified, setIsConnectionVerified] = useState(false);
  const [showConfigFormOverride, setShowConfigFormOverride] = useState(false);

  useEffect(() => {
    setLoggedIn(initialLoggedIn);
    // Reset connection verified state if user logs out and logs back in,
    // or if the initialLoggedIn state changes for any other reason.
    // This ensures they re-verify if needed.
    if (!initialLoggedIn) {
        setIsConnectionVerified(false);
        setShowConfigFormOverride(false);
    }
  }, [initialLoggedIn]);

  const handleConnectionSuccess = () => {
    setIsConnectionVerified(true);
    setShowConfigFormOverride(false); // If they were manually showing it, hide on new success
  };

  const toggleShowConfigForm = () => {
    setShowConfigFormOverride(prev => !prev);
  }

  const displayConfigForm = !isConnectionVerified || showConfigFormOverride;

  return (
    <div className="space-y-8">
      {loggedIn ? (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <LogoutButton />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Add New Entry</CardTitle>
              <CardDescription>Add new entries to the Google Sheet.</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminForm />
            </CardContent>
          </Card>

          <Separator className="my-10" />
          
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
           {isConnectionVerified && !displayConfigForm && <Separator className="my-10" />}


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

        </>
      ) : (
        <LoginForm />
      )}
    </div>
  );
}
