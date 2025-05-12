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

// Schema for Google Sheet Configuration Form
export const sheetConfigSchema = z.object({
    sheetId: z.string().min(10, 'Sheet ID seems too short').trim(), // Basic check
    sheetRange: z.string()
                .min(3, 'Sheet range is required (e.g., Sheet1!A:E)')
                .regex(/^[a-zA-Z0-9\s]+!([A-Z]+):([A-Z]+)$/, 'Invalid range format (e.g., Sheet1!A:E)'),
    serviceAccountEmail: z.string().email('Invalid service account email format'),
    privateKey: z.string()
                 .min(100, 'Private key seems too short') // Very basic check
                 .startsWith('-----BEGIN PRIVATE KEY-----', 'Private key must start with -----BEGIN PRIVATE KEY-----')
                 .endsWith('-----END PRIVATE KEY-----', 'Private key must end with -----END PRIVATE KEY-----')
                 .trim(), // Ensure no leading/trailing whitespace
});

export type SheetConfigFormData = z.infer<typeof sheetConfigSchema>;
