'use client';

import { useActionState } from 'react'; // Correct import for useActionState
import { useFormStatus } from 'react-dom'; // Correct import for useFormStatus
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginAction, type FormState } from '@/lib/actions';
import { loginSchema, type LoginFormData } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Logging in...' : 'Login'}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<FormState | null, FormData>(loginAction, null);
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

   // Display toast message on state change
   useEffect(() => {
    if (state?.message) {
      toast({
        title: state.success ? 'Success' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      // Reset form on successful login if needed, though page reload might handle this
      // if (state.success) form.reset();
    }
  }, [state, toast, form]);


  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
        <CardDescription>Enter your credentials to access the admin panel</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
           {/* Display general error message */}
          {!state?.success && state?.message && !state.errors && (
             <Alert variant="destructive">
               <Terminal className="h-4 w-4" />
               <AlertTitle>Login Failed</AlertTitle>
               <AlertDescription>{state.message}</AlertDescription>
             </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              {...form.register('username')}
              aria-invalid={!!form.formState.errors.username || !!state?.errors?.username}
            />
            {form.formState.errors.username && (
              <p className="text-sm text-destructive">{form.formState.errors.username.message}</p>
            )}
             {state?.errors?.username && (
                <p className="text-sm text-destructive">{state.errors.username.join(', ')}</p>
             )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...form.register('password')}
              aria-invalid={!!form.formState.errors.password || !!state?.errors?.password}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
             {state?.errors?.password && (
                 <p className="text-sm text-destructive">{state.errors.password.join(', ')}</p>
             )}
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
