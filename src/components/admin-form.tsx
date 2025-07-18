
'use client';

import { useActionState } from 'react'; 
import { useFormStatus } from 'react-dom'; 
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { upsertDataAction, type FormState } from '@/lib/actions';
import { sheetRowSchema, type SheetRowFormData } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit Data'}
    </Button>
  );
}

interface AdminFormProps {
  onSuccessfulSubmit?: () => void;
}

export function AdminForm({ onSuccessfulSubmit }: AdminFormProps) {
  const [state, formAction] = useActionState<FormState | null, FormData>(upsertDataAction, null);
  const { toast } = useToast();

  const form = useForm<SheetRowFormData>({
    resolver: zodResolver(sheetRowSchema),
    defaultValues: {
      'Donor/Opp': '',
      'Action/Next Step': '',
      Lead: '',
      Priority: undefined, 
      Probability: undefined,
    },
  });

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.success ? 'Success' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        form.reset(); 
        onSuccessfulSubmit?.(); // Call the success callback
      }
    }
  }, [state, toast, form, onSuccessfulSubmit]);

  return (
    <Card className="w-full max-w-2xl border-0 shadow-none">
        {!state?.success && state?.message && !state.errors && (
             <CardContent className="pt-0"> 
                 <Alert variant="destructive">
                   <Terminal className="h-4 w-4" />
                   <AlertTitle>Submission Failed</AlertTitle>
                   <AlertDescription>{state.message}</AlertDescription>
                 </Alert>
            </CardContent>
        )}
      <Form {...form}>
        <form action={formAction}>
          <CardContent className="space-y-4 pt-0"> 
             <FormField
                control={form.control}
                name="Donor/Opp"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Donor/Opportunity</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., SIDA Grant" {...field} />
                    </FormControl>
                    <FormMessage />
                     {state?.errors?.['Donor/Opp'] && (
                       <p className="text-sm font-medium text-destructive">{state.errors['Donor/Opp'].join(', ')}</p>
                    )}
                    </FormItem>
                )}
                />

            <FormField
              control={form.control}
              name="Action/Next Step"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action/Next Step</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the next steps..." {...field} />
                  </FormControl>
                  <FormMessage />
                  {state?.errors?.['Action/Next Step'] && (
                    <p className="text-sm font-medium text-destructive">{state.errors['Action/Next Step'].join(', ')}</p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="Lead"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Katie" {...field} />
                  </FormControl>
                  <FormMessage />
                   {state?.errors?.Lead && (
                    <p className="text-sm font-medium text-destructive">{state.errors.Lead.join(', ')}</p>
                  )}
                </FormItem>
              )}
            />

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="Priority"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        name={field.name} 
                    >
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Priority" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                     {state?.errors?.Priority && (
                        <p className="text-sm font-medium text-destructive">{state.errors.Priority.join(', ')}</p>
                    )}
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="Probability"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Probability</FormLabel>
                     <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        name={field.name} 
                    >
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Probability" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                     {state?.errors?.Probability && (
                       <p className="text-sm font-medium text-destructive">{state.errors.Probability.join(', ')}</p>
                    )}
                    </FormItem>
                )}
                />
             </div>

          </CardContent>
          <CardFooter className="flex justify-end pt-0"> 
            <SubmitButton />
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
