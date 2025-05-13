
'use client';

import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { testSheetConnectionAction, type FormState } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConnectionTesterProps {
  onConnectionSuccess?: () => void;
}

export function ConnectionTester({ onConnectionSuccess }: ConnectionTesterProps) {
  const [state, formAction, pending] = useActionState<FormState | null, null>(
    (prevState, _formData: null) => testSheetConnectionAction(prevState),
    null
  );
  
  const { toast } = useToast();

  useEffect(() => {
    if (state) {
      toast({
        title: state.success ? 'Connection Test Result' : 'Connection Test Failed',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
        duration: state.success ? 5000 : 10000,
      });
      if (state.success && onConnectionSuccess) {
        onConnectionSuccess();
      }
    }
  }, [state, toast, onConnectionSuccess]);

  return (
    <div className="space-y-4">
      <form
        action={() => {
          formAction(null); 
        }}
      >
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            'Test Live Google Sheet Connection'
          )}
        </Button>
      </form>

      {state && (
        <Alert variant={state.success ? 'default' : 'destructive'} className="mt-4">
          {state.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertTitle>{state.success ? 'Success!' : 'Failed!'}</AlertTitle>
          <AlertDescription>
            {state.message}
            {state.details && (
                <p className="text-xs mt-2 text-muted-foreground bg-secondary p-2 rounded-md">
                    <strong>Details:</strong> {state.details}
                </p>
            )}
          </AlertDescription>
        </Alert>
      )}
       <Alert variant="default" className="mt-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Important Note</AlertTitle>
          <AlertDescription>
            This test uses the environment variables currently active on the **server**.
            If you've recently updated your <code className="font-mono bg-muted px-1 py-0.5 rounded">.env.local</code> file, ensure you have **restarted your Next.js development server** for the changes to apply.
            For deployed environments, ensure variables are set in your hosting provider's settings and the application has been redeployed/restarted.
          </AlertDescription>
        </Alert>
    </div>
  );
}
