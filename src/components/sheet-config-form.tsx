'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveSheetConfigAction, type FormState } from '@/lib/actions';
import { sheetConfigSchema, type SheetConfigFormData } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Settings, Info } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save Configuration'}
    </Button>
  );
}

export function SheetConfigForm() {
  // Note: We can't reliably read current env vars client-side after build.
  // Default values are empty or standard defaults.
  const defaultValues = {
    sheetId: '',
    sheetRange: 'Sheet1!A:E', // Default range
    serviceAccountEmail: '',
    privateKey: '',
  };

  // Initialize form state for the config form action
  const [state, formAction] = useFormState<FormState | null, FormData>(saveSheetConfigAction, null);
  const { toast } = useToast();

  const form = useForm<SheetConfigFormData>({
    resolver: zodResolver(sheetConfigSchema),
    defaultValues: defaultValues,
    // Fetch current values on mount if possible/needed, though generally discouraged for env vars
    // This example keeps defaults empty for security and clarity.
  });

   // Display toast message on state change
  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.success ? 'Configuration Notice' : 'Validation Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      // We don't reset the form here as users might want to see the values they entered.
    }
  }, [state, toast]);

  // Effect to load current values (if needed, for display only) - This is tricky with env vars.
  // For this example, we assume users enter fresh values or know the existing ones.
  // A server component fetching initial values and passing them as props would be needed
  // for a robust "edit existing" experience, but that reveals env vars to the client props.

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Google Sheet Configuration
        </CardTitle>
        <CardDescription>
          Enter the connection details for your Google Sheet. These settings are typically managed via environment variables. Saving here primarily validates the format.
        </CardDescription>
      </CardHeader>
      {/* Display general error message if validation fails without specific field errors */}
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
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="sheetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sheet ID (`GOOGLE_SHEET_ID`)</FormLabel>
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
                  <FormLabel>Data Range (`GOOGLE_SHEET_RANGE`)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sheet1!A:E" {...field} />
                  </FormControl>
                   <FormDescription>
                     The range where data is read and appended (e.g., Sheet1!A:E).
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
                  <FormLabel>Service Account Email (`GOOGLE_SERVICE_ACCOUNT_EMAIL`)</FormLabel>
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
                  <FormLabel>Private Key (`GOOGLE_PRIVATE_KEY`)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Paste the service account private key here (starts with -----BEGIN PRIVATE KEY-----)" {...field} rows={6} />
                  </FormControl>
                   <FormDescription>
                     Ensure the entire key, including BEGIN/END lines, is pasted correctly.
                   </FormDescription>
                  <FormMessage />
                  {state?.errors?.privateKey && (
                    <p className="text-sm font-medium text-destructive">{state.errors.privateKey.join(', ')}</p>
                  )}
                </FormItem>
              )}
            />

             <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>Configuration Persistence</AlertTitle>
                <AlertDescription>
                    Saving these settings will validate them, but the application primarily relies on **environment variables** set during deployment (e.g., in `.env.local` or hosting provider settings).
                    <br /><br />
                    For changes to take permanent effect and be used by the application backend, you usually need to update the environment variables and **restart or redeploy** the application. This form does not directly modify those underlying environment variables.
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
