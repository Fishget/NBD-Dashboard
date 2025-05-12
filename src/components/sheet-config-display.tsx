import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Settings, EyeOff } from "lucide-react";

export function SheetConfigDisplay() {
  // Read environment variables on the server
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetRange = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:E'; // Use default if not set
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Do not display the private key for security reasons

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Google Sheet Configuration (Read-Only)
        </CardTitle>
        <CardDescription>
          These are the current connection settings read from the application's environment variables. They cannot be changed here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Sheet ID (`GOOGLE_SHEET_ID`)</p>
          <div className="font-mono text-sm bg-muted p-2 rounded-md overflow-x-auto break-all mt-1">
            {sheetId ? (
                sheetId
            ) : (
                 <span className="text-destructive italic">Not Set in environment variables</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Data Range (`GOOGLE_SHEET_RANGE`)</p>
          <div className="font-mono text-sm bg-muted p-2 rounded-md mt-1">
            {sheetRange}
          </div>
        </div>
         <div>
          <p className="text-sm font-medium text-muted-foreground">Service Account Email (`GOOGLE_SERVICE_ACCOUNT_EMAIL`)</p>
          <div className="font-mono text-sm bg-muted p-2 rounded-md overflow-x-auto break-all mt-1">
            {serviceAccountEmail ? (
                serviceAccountEmail
            ) : (
                 <span className="text-destructive italic">Not Set in environment variables</span>
            )}
          </div>
        </div>
         <div>
          <p className="text-sm font-medium text-muted-foreground">Private Key (`GOOGLE_PRIVATE_KEY`)</p>
          <div className="font-mono text-sm bg-muted p-2 rounded-md mt-1 flex items-center gap-2 text-muted-foreground italic">
            <EyeOff className="h-4 w-4 shrink-0"/> Value is configured via environment variables but not displayed for security.
          </div>
        </div>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Important: Configuration Method</AlertTitle>
          <AlertDescription>
            The values displayed above are **read-only** and reflect the current server configuration.
            <br /><br />
            To **change** the Google Sheet connection settings, you must update the `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_RANGE`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_PRIVATE_KEY` environment variables where this application is hosted (e.g., in your `.env.local` file for local development or in your cloud hosting provider's settings).
            <br /><br />
            After updating the environment variables, you need to **restart or redeploy** the application for the changes to take effect. These settings cannot be modified through this web interface.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
