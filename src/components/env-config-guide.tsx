
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, ClipboardCopy } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

const envContent = `
# Google Sheets API Credentials
GOOGLE_SHEET_ID=your_google_sheet_id_here
GOOGLE_SHEET_RANGE=Sheet1!A:E
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
# Ensure the private key includes actual newline characters (\n), not literal '\\n'.
# When pasting from a JSON file, the key often looks like "-----BEGIN PRIVATE KEY-----\\nABC...\\n-----END PRIVATE KEY-----"
# In the .env file, it should be:
# GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
# ABC...
# -----END PRIVATE KEY-----"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_LINE_1\\nYOUR_PRIVATE_KEY_LINE_2\\n-----END PRIVATE KEY-----"

# Admin Credentials for the Dashboard
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password
`;

export function EnvConfigGuide() {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(envContent.trim())
      .then(() => {
        toast({
          title: "Copied to clipboard!",
          description: "You can now paste this into your .env.local file.",
        });
      })
      .catch(err => {
        toast({
          title: "Copy failed",
          description: "Could not copy to clipboard. Please copy manually.",
          variant: "destructive",
        });
        console.error('Failed to copy: ', err);
      });
  };

  return (
    <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
            Create a file named <code className="font-mono bg-muted px-1 py-0.5 rounded">.env.local</code> in the root of your project and paste the following content.
            Replace placeholder values with your actual credentials.
        </p>
        <p className="text-sm text-muted-foreground">
            <Lightbulb className="inline-block h-4 w-4 mr-1 text-amber-500" />
            The <code className="font-mono bg-muted px-1 py-0.5 rounded">GOOGLE_PRIVATE_KEY</code> must be wrapped in double quotes if it spans multiple lines,
            and each newline within the key itself must be represented as <code className="font-mono bg-muted px-1 py-0.5 rounded">\n</code>.
            Alternatively, ensure your hosting provider's environment variable input handles multi-line strings correctly.
        </p>

        <div className="relative rounded-md bg-muted p-4 border">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="absolute top-2 right-2"
                aria-label="Copy .env content"
            >
                <ClipboardCopy className="h-4 w-4 mr-2" />
                Copy
            </Button>
            <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                {envContent.trim()}
            </pre>
        </div>
         <p className="text-sm text-muted-foreground">
            After creating or updating your <code className="font-mono bg-muted px-1 py-0.5 rounded">.env.local</code> file, you **must restart your Next.js development server** for the changes to take effect.
        </p>
    </div>
  );
}
