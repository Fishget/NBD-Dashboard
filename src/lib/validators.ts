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
        .transform(keyInput => {
            let key = keyInput.trim(); // Trim outer whitespace first

            // If the entire pasted content is enclosed in quotes (single or double), remove them
            if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
                key = key.substring(1, key.length - 1);
            }
            
            // Now key should be the raw content, possibly with \n escapes from JSON string
            // Unescape literal "\\n" to actual newline characters.
            key = key.replace(/\\n/g, '\n');
            // Normalize Windows-style newlines (\r\n) to Unix-style newlines (\n).
            key = key.replace(/\r\n/g, '\n');
            // It's important NOT to trim() here again if the PEM block itself has leading/trailing newlines within its structure,
            // but the startsWith/endsWith checks in the pipe will handle the structural integrity.
            // However, a final trim of the (now unescaped) block can be safe if PEM content itself doesn't rely on outer blank lines.
            // For safety and to match typical PEM format, we'll trim one last time.
            return key.trim();
        })
        .pipe(
            z.string()
            .min(100, 'Private key is too short. Ensure you have copied the full key from the JSON file.')
            .startsWith('-----BEGIN PRIVATE KEY-----', 'Private key must start with "-----BEGIN PRIVATE KEY-----". Check for missing parts or extra characters at the beginning.')
            .endsWith('-----END PRIVATE KEY-----', 'Private key must end with "-----END PRIVATE KEY-----". Check for missing parts or extra characters at the end.')
            .refine(key => key.includes('\n'), { message: "Private key must be a multi-line string. Ensure newlines are preserved when copying or that '\\n' sequences were correctly unescaped." })
            .refine(key => {
                // Check for common errors like pasting the entire JSON key-value pair.
                // These checks are against the transformed key (outer quotes and \n should be handled).
                if (key.includes('"private_key":') || key.includes("'private_key':")) {
                    return false;
                }
                // Ensure there's content between the header and footer
                const coreKey = key.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').trim();
                return coreKey.length > 0;
            }, {message: "It looks like you might have pasted more than just the private key string, or the key content between PEM markers is empty."})
        ),
});

export type SheetConfigFormData = z.infer<typeof sheetConfigSchema>;
