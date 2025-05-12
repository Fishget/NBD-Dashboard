import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const sheetRowSchema = z.object({
  'Donor/Opp': z.string().min(1, 'Donor/Opportunity is required'),
  'Action/Next Step': z.string().min(1, 'Action/Next Step is required'),
  Lead: z.string().min(1, 'Lead is required'),
  Priority: z.enum(['High', 'Medium', 'Low'], {
    errorMap: () => ({ message: 'Please select a valid priority' }),
  }),
  Probability: z.enum(['High', 'Medium', 'Low'], {
    errorMap: () => ({ message: 'Please select a valid probability' }),
  }),
});

export type SheetRowFormData = z.infer<typeof sheetRowSchema>;
