import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Settings, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function SheetConfigDisplay() {
  // Read environment variables on the server
  const sheetId = process.env.GOOGLE_SHEET_ID || '';
  const sheetRange = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A:E'; // Use default if not set
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  // Do not display the private key by default for security reasons

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Google Sheet Configuration (Read-Only)
        </CardTitle>
        <CardDescription>
          These are the current connection settings read from the application's environment variables. Changes here won't affect the server configuration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sheetId" className="text-sm font-medium text-muted-foreground">Sheet ID (`GOOGLE_SHEET_ID`)</Label>
          <Input
            id="sheetId"
            readOnly
            value={sheetId}
            placeholder="Not Set in environment variables"
            className={`font-mono text-sm ${!sheetId ? 'text-destructive italic' : ''}`}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sheetRange" className="text-sm font-medium text-muted-foreground">Data Range (`GOOGLE_SHEET_RANGE`)</Label>
          <Input
            id="sheetRange"
            readOnly
            value={sheetRange}
            className="font-mono text-sm"
          />
        </div>
         <div className="space-y-2">
          <Label htmlFor="serviceAccountEmail" className="text-sm font-medium text-muted-foreground">Service Account Email (`GOOGLE_SERVICE_ACCOUNT_EMAIL`)</Label>
           <Input
            id="serviceAccountEmail"
            readOnly
            value={serviceAccountEmail}
            placeholder="Not Set in environment variables"
            className={`font-mono text-sm ${!serviceAccountEmail ? 'text-destructive italic' : ''}`}
           />
        </div>
         <div className="space-y-2">
           <Label htmlFor="privateKey" className="text-sm font-medium text-muted-foreground">Private Key (`GOOGLE_PRIVATE_KEY`)</Label>
           <Textarea
            id="privateKey"
            readOnly
            value="Value is configured via environment variables but not displayed for security."
            className="font-mono text-sm text-muted-foreground italic"
            rows={3}
           />
           <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <EyeOff className="h-3 w-3 shrink-0"/>
              <span>This value cannot be viewed or changed here.</span>
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
