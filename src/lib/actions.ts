'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { checkCredentials, setAuthCookie, clearAuthCookie } from './auth';
import { loginSchema, sheetRowSchema, sheetConfigSchema } from './validators'; // Added sheetConfigSchema
import { appendSheetRow } from './sheets';
import type { SheetRowFormData, SheetConfigFormData } from './validators'; // Added SheetConfigFormData

export type FormState = {
  message: string;
  success: boolean;
  errors?: Record<string, string[] | undefined>;
};

export async function loginAction(
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  try {
    const parsed = loginSchema.safeParse({
      username: formData.get('username'),
      password: formData.get('password'),
    });

    if (!parsed.success) {
      return {
        message: 'Invalid form data.',
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { username, password } = parsed.data;

    if (checkCredentials(username, password)) {
      await setAuthCookie();
       // Revalidate admin path to trigger UI update after login
      revalidatePath('/admin');
      return { message: 'Login successful!', success: true };
    } else {
      return { message: 'Invalid username or password.', success: false };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { message: 'An unexpected error occurred during login.', success: false };
  }
}

export async function logoutAction(): Promise<void> {
   await clearAuthCookie();
   // Revalidate admin path to trigger UI update after logout
   revalidatePath('/admin');
}


export async function submitDataAction(
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {

  try {
    const parsed = sheetRowSchema.safeParse({
      'Donor/Opp': formData.get('Donor/Opp'),
      'Action/Next Step': formData.get('Action/Next Step'),
      Lead: formData.get('Lead'),
      Priority: formData.get('Priority'),
      Probability: formData.get('Probability'),
    });

    if (!parsed.success) {
       console.log("Validation errors:", parsed.error.flatten().fieldErrors);
      return {
        message: 'Invalid form data. Please check the fields.',
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const dataToAppend: SheetRowFormData = parsed.data;

    // Check if sheets connection is configured before attempting append
    if (!process.env.GOOGLE_SHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        return { message: 'Google Sheet connection is not configured on the server.', success: false };
    }

    const success = await appendSheetRow(dataToAppend);

    if (success) {
      // Revalidate the homepage cache to show the new data
      revalidatePath('/');
      return { message: 'Data submitted successfully!', success: true };
    } else {
      return { message: 'Failed to submit data to Google Sheet.', success: false };
    }
  } catch (error) {
    console.error('Submit data error:', error);
    return { message: 'An unexpected error occurred while submitting data.', success: false };
  }
}


export async function saveSheetConfigAction(
  prevState: FormState | null,
  formData: FormData
): Promise<FormState> {
  try {
    const parsed = sheetConfigSchema.safeParse({
      sheetId: formData.get('sheetId'),
      sheetRange: formData.get('sheetRange'),
      serviceAccountEmail: formData.get('serviceAccountEmail'),
      privateKey: formData.get('privateKey'),
    });

    if (!parsed.success) {
       console.log("Config Validation errors:", parsed.error.flatten().fieldErrors);
      return {
        message: 'Invalid configuration data. Please check the fields.',
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const configData: SheetConfigFormData = parsed.data;

    // --- IMPORTANT LIMITATION ---
    // We cannot dynamically update process.env variables for the running Node.js process.
    // Environment variables are typically loaded at application startup.
    // Modifying .env files programmatically is risky and requires app restarts.
    // Therefore, this action primarily serves to VALIDATE the input format.
    // The actual connection used by getSheetData/appendSheetRow will still rely on the
    // environment variables set when the server process started.

    console.log('Received valid sheet configuration data (validation only):', {
        sheetId: configData.sheetId,
        sheetRange: configData.sheetRange,
        serviceAccountEmail: configData.serviceAccountEmail,
        privateKey: '[REDACTED]', // Avoid logging the private key
    });

    // Simulate saving - In a real scenario, this might write to a config file or DB,
    // but that requires more infrastructure and careful handling.
    // For now, just return success after validation.

    return {
        message: 'Configuration validated successfully. Remember to update environment variables and restart the server for changes to take effect.',
        success: true
    };

  } catch (error) {
    console.error('Save sheet config error:', error);
    return { message: 'An unexpected error occurred while validating the configuration.', success: false };
  }
}
