
import { cookies } from 'next/headers';
import { isAuthenticated } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';
import { AdminForm } from '@/components/admin-form';
import { SheetConfigForm } from '@/components/sheet-config-form';
import { LogoutButton } from '@/components/logout-button';
import { Separator } from '@/components/ui/separator';
import { EnvConfigGuide } from '@/components/env-config-guide';
import { ConnectionTester } from '@/components/connection-tester';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileText, TestTubeDiagonal } from 'lucide-react';


export default function AdminPage() {
  const cookieStore = cookies();
  const loggedIn = isAuthenticated(cookieStore);

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    .env.local Configuration Guide
                  </CardTitle>
                  <CardDescription>
                    Instructions for setting up your local environment variables.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                <EnvConfigGuide />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TestTubeDiagonal className="h-5 w-5" />
                    Google Sheet Connection Test
                </CardTitle>
                <CardDescription>
                  Test the live connection to Google Sheets using current server environment variables.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectionTester />
              </CardContent>
            </Card>
          </div>

          <Separator className="my-10" />
          
          <SheetConfigForm />

        </>
      ) : (
        <LoginForm />
      )}
    </div>
  );
}

// Ensure dynamic rendering because authentication depends on cookies
export const dynamic = 'force-dynamic';
