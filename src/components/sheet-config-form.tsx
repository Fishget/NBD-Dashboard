'use client';

import { useActionState, useEffect, useState } from 'react'; // Correct import for useActionState
import { useFormStatus } from 'react-dom'; // Correct import for useFormStatus
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveSheetConfigAction, type FormState } from '@/lib/actions';
import { sheetConfigSchema, type SheetConfigFormData } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Settings, Info, FileText, ClipboardCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Validating & Generating Preview...' : 'Generate .env.local Content Preview'}
    </Button>
  );
}

export function SheetConfigForm() {
  const defaultValues: SheetConfigFormData = {
    sheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID_DEFAULT || '',
    sheetRange: process.env.NEXT_PUBLIC_GOOGLE_SHEET_RANGE_DEFAULT || 'Sheet1!A:E',
    serviceAccountEmail: process.env.NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_EMAIL_DEFAULT || '',
    privateKey: process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY_DEFAULT || '',
  };

  const [state, formAction] = useActionState<FormState | null, FormData>(saveSheetConfigAction, null);
  const { toast } = useToast();
  const [envPreviewContent, setEnvPreviewContent] = useState('');

  const form = useForm<SheetConfigFormData>({
    resolver: zodResolver(sheetConfigSchema),
    defaultValues: defaultValues,
  });

  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    const { sheetId, sheetRange, serviceAccountEmail, privateKey: formPrivateKey } = watchedValues;

    let envFormattedPrivateKey: string;
    if (formPrivateKey && typeof formPrivateKey === 'string' && formPrivateKey.trim()) {
      const escapedKey = formPrivateKey
        .trim() 
        .replace(/\r\n/g, '\n') 
        .replace(/\n/g, '\\n'); 
      envFormattedPrivateKey = `"${escapedKey}"`;
    } else {
      envFormattedPrivateKey = '"-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_LINE_1\\nYOUR_PRIVATE_KEY_LINE_2\\n-----END PRIVATE KEY-----"';
    }

    const adminUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME_DEFAULT || 'admin';
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD_DEFAULT || 'password';

    const content = `
# Google Sheets API Credentials
GOOGLE_SHEET_ID=${sheetId || 'your_google_sheet_id_here'}
GOOGLE_SHEET_RANGE=${sheetRange || 'Sheet1!A:E'}
GOOGLE_SERVICE_ACCOUNT_EMAIL=${serviceAccountEmail || 'your-service-account-email@your-project-id.iam.gserviceaccount.com'}
# The private key below should be a single line in your .env.local file,
# with actual newline characters represented as \\n, all enclosed in double quotes.
# Example: GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_PART_1\\nYOUR_KEY_PART_2\\n-----END PRIVATE KEY-----"
GOOGLE_PRIVATE_KEY=${envFormattedPrivateKey}

# Admin Credentials for the Dashboard
ADMIN_USERNAME=${adminUsername}
ADMIN_PASSWORD=${adminPassword}
`;
    setEnvPreviewContent(content.trim());
  }, [watchedValues]);

  const handleCopyToClipboard = () => {
    if (!envPreviewContent) return;
    navigator.clipboard.writeText(envPreviewContent)
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
      });
  };

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.success ? 'Configuration Notice' : 'Validation Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
    }
  }, [state, toast]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Google Sheet Configuration
        </CardTitle>
        <CardDescription>
          Enter the connection details for your Google Sheet. Use the form below to generate the content for your <code className="font-mono bg-muted px-1 py-0.5 rounded">.env.local</code> file. After generating and copying the content, you must manually update your <code className="font-mono bg-muted px-1 py-0.5 rounded">.env.local</code> file and restart the server.
        </CardDescription>
      </CardHeader>
      {!state?.success && state?.message && !state.errors && (
        <CardContent>
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        </CardContent>
      )}
      <Form {...form}>
        <form action={formAction}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="sheetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sheet ID (<code className="font-mono text-xs">GOOGLE_SHEET_ID</code>)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Google Sheet ID" {...field} />
                  </FormControl>
                  <FormMessage />
                  {state?.errors?.sheetId && (
                    <p className="text-sm font-medium text-destructive">{state.errors.sheetId.join(', ')}</p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sheetRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Range (<code className="font-mono text-xs">GOOGLE_SHEET_RANGE</code>)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sheet1!A:E" {...field} />
                  </FormControl>
                   <FormDescription>
                     The range where data is read and appended (e.g., Sheet1!A:E). Must be uppercase columns.
                   </FormDescription>
                  <FormMessage />
                   {state?.errors?.sheetRange && (
                     <p className="text-sm font-medium text-destructive">{state.errors.sheetRange.join(', ')}</p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceAccountEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Account Email (<code className="font-mono text-xs">GOOGLE_SERVICE_ACCOUNT_EMAIL</code>)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter service account email" {...field} />
                  </FormControl>
                  <FormMessage />
                  {state?.errors?.serviceAccountEmail && (
                    <p className="text-sm font-medium text-destructive">{state.errors.serviceAccountEmail.join(', ')}</p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="privateKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Private Key (<code className="font-mono text-xs">GOOGLE_PRIVATE_KEY</code>)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste the service account private key here (starts with -----BEGIN PRIVATE KEY-----)" {...field} rows={8} />
                  </FormControl>
                   <FormDescription>
                     Paste the entire private key string from your service account JSON file.
                     It must start with <code>-----BEGIN PRIVATE KEY-----</code> and end with <code>-----END PRIVATE KEY-----</code>.
                     Include all characters and line breaks (newlines) exactly as they appear in the JSON value for the "private_key" field.
                   </FormDescription>
                  <FormMessage />
                  {state?.errors?.privateKey && (
                    <p className="text-sm font-medium text-destructive">{state.errors.privateKey.join(', ')}</p>
                  )}
                </FormItem>
              )}
            />

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Preview for <code className="font-mono bg-muted px-1.5 py-1 rounded">.env.local</code>
                </CardTitle>
                <CardDescription>
                  Based on the values entered above, copy the content below and paste it into your <code className="font-mono bg-muted px-1 py-0.5 rounded">.env.local</code> file in the project root.
                  After updating the file, you **must restart your Next.js development server**.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative rounded-md bg-muted/80 dark:bg-muted/50 p-4 border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    className="absolute top-2 right-2 text-xs"
                    aria-label="Copy .env.local content"
                    disabled={!envPreviewContent}
                  >
                    <ClipboardCopy className="h-3.5 w-3.5 mr-1.5" />
                    Copy
                  </Button>
                  <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                    {envPreviewContent || 'Enter values in the form to generate the .env.local content preview...'}
                  </pre>
                </div>
              </CardContent>
            </Card>

             <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>Configuration Persistence</AlertTitle>
                <AlertDescription>
                    Generating this preview and validating the settings confirms their format. However, the application backend primarily relies on **environment variables** set during startup (e.g., in <code className="font-mono bg-muted px-1 py-0.5 rounded">.env.local</code> or hosting provider settings).
                    <br /><br />
                    For these changes to be used by the application, you **must** manually update your <code className="font-mono bg-muted px-1 py-0.5 rounded">.env.local</code> file (using the preview above) and then **restart or redeploy** your application.
                </AlertDescription>
             </Alert>

          </CardContent>
          <CardFooter className="flex justify-end">
            <SubmitButton />
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
