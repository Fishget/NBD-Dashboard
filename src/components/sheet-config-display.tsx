import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Settings } from "lucide-react";

export function SheetConfigDisplay() {
  // Read environment variables on the server
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetRange = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:E'; // Use default if not set

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Google Sheet Configuration
        </CardTitle>
        <CardDescription>
          Current connection settings read from environment variables.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Sheet ID (`GOOGLE_SHEET_ID`)</p>
          <p className="font-mono text-sm bg-muted p-2 rounded-md overflow-x-auto break-all">
            {sheetId ? (
                sheetId
            ) : (
                 <span className="text-destructive italic">Not Set in environment variables</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Data Range (`GOOGLE_SHEET_RANGE`)</p>
          <p className="font-mono text-sm bg-muted p-2 rounded-md">
            {sheetRange}
          </p>
        </div>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Configuration Note</AlertTitle>
          <AlertDescription>
            To change these settings, you must update the `GOOGLE_SHEET_ID` and `GOOGLE_SHEET_RANGE` environment variables where the application is hosted (e.g., in your `.env.local` file for local development or in your hosting provider's settings) and restart/redeploy the application.
            <br /><br />
            Sensitive credentials like `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY` are also managed securely via environment variables and cannot be viewed or configured through this interface.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
