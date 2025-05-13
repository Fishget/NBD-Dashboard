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
    sheetId: z.string().min(10, 'Sheet ID seems too short. Please check the copied ID.').trim(),
    sheetRange: z.string()
                .min(3, 'Sheet range is required (e.g., Sheet1!A:E)')
                .regex(/^[a-zA-Z0-9\s]+!([A-Z]+):([A-Z]+)$/, 'Invalid range format. Expected format like "Sheet1!A:E" with uppercase column letters.'),
    serviceAccountEmail: z.string().email('Invalid service account email format. Please enter a valid email address.'),
    privateKey: z.string()
        .transform(key => {
            // 1. Replace literal "\\n" (escaped newlines common in JSON strings) with actual newline characters.
            let processedKey = key.replace(/\\n/g, '\n');
            // 2. Normalize Windows-style newlines (\r\n) to Unix-style newlines (\n).
            processedKey = processedKey.replace(/\r\n/g, '\n');
            // 3. Trim any leading/trailing whitespace from the entire key block.
            processedKey = processedKey.trim();
            return processedKey;
        })
        .pipe(
            z.string()
            .min(100, 'Private key is too short. Ensure you have copied the full key from the JSON file.')
            .startsWith('-----BEGIN PRIVATE KEY-----', 'Private key must start with "-----BEGIN PRIVATE KEY-----". Check for missing parts or extra characters at the beginning.')
            .endsWith('-----END PRIVATE KEY-----', 'Private key must end with "-----END PRIVATE KEY-----". Check for missing parts or extra characters at the end.')
            .refine(key => key.includes('\n'), { message: "Private key must be a multi-line string. Ensure newlines are preserved when copying." })
            .refine(key => {
                // Check for common errors like pasting the entire JSON key-value pair or including quotes
                // These checks are against the already transformed key (e.g. outer quotes should be removed by .trim())
                if (key.startsWith('"-----BEGIN PRIVATE KEY-----') || key.startsWith("'-----BEGIN PRIVATE KEY-----")) {
                    return false;
                }
                if (key.includes('"private_key":') || key.includes("'private_key':")) {
                    return false;
                }
                // Ensure there's content between the header and footer
                const coreKey = key.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').trim();
                return coreKey.length > 0;
            }, {message: "It looks like you might have pasted more than just the private key string, or the key content is empty. Please paste only the characters starting with -----BEGIN PRIVATE KEY----- and ending with -----END PRIVATE KEY-----."})
        ),
});

export type SheetConfigFormData = z.infer<typeof sheetConfigSchema>;

