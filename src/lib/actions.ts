
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { checkCredentials, setAuthCookie, clearAuthCookie } from './auth';
import { loginSchema, sheetRowSchema, sheetConfigSchema } from './validators'; // Added sheetConfigSchema
import { appendSheetRow, getSheetsClient } from './sheets'; // Added getSheetsClient
import type { SheetRowFormData, SheetConfigFormData } from './validators'; // Added SheetConfigFormData

export type FormState = {
  message: string;
  success: boolean;
  errors?: Record<string, string[] | undefined>;
  details?: string; // Optional details field for test connection
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
      return { message: 'Failed to submit data to Google Sheet. Please check the server console logs for more specific error details from the Google Sheets API.', success: false };
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
        message: 'Configuration validated successfully. Remember to update environment variables and restart/redeploy the server for these changes to be used by the application backend.',
        success: true
    };

  } catch (error) {
    console.error('Save sheet config error:', error);
    return { message: 'An unexpected error occurred while validating the configuration.', success: false };
  }
}

export async function testSheetConnectionAction(
  prevState: FormState | null
): Promise<FormState> {
  const missingEnvVars = [];
  if (!process.env.GOOGLE_SHEET_ID) missingEnvVars.push('GOOGLE_SHEET_ID');
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) missingEnvVars.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!process.env.GOOGLE_PRIVATE_KEY) missingEnvVars.push('GOOGLE_PRIVATE_KEY');
  if (!process.env.GOOGLE_SHEET_RANGE) missingEnvVars.push('GOOGLE_SHEET_RANGE'); // Though not strictly for client init, it's part of config

  if (missingEnvVars.length > 0) {
    return {
      success: false,
      message: 'Connection test failed: Server is missing required environment variables.',
      details: `Missing: ${missingEnvVars.join(', ')}. Please ensure these are set in your .env.local file or hosting environment and the server is restarted.`,
    };
  }

  const sheets = getSheetsClient();
  if (!sheets) {
    return {
      success: false,
      message: 'Connection test failed: Could not initialize Google Sheets client.',
      details: 'This usually indicates an issue with the service account credentials (email or private key format/value) or their parsing. Check server logs for more specific errors related to Google Auth initialization.',
    };
  }

  try {
    // Perform a benign read operation to test the connection and permissions
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      fields: 'properties.title', // Requesting only the title is a lightweight check
    });

    if (response.status === 200 && response.data.properties?.title) {
      return {
        success: true,
        message: 'Connection test successful!',
        details: `Successfully connected to sheet titled: "${response.data.properties.title}". The application should be able to read from and write to this sheet if permissions are correctly set.`,
      };
    } else {
      return {
        success: false,
        message: 'Connection test partially successful: Client initialized, but could not retrieve sheet properties.',
        details: `Received status ${response.status}. This might indicate issues with the Sheet ID or permissions for the service account.`,
      };
    }
  } catch (error: any) {
    console.error('Google Sheets connection test error:', error);
    let details = 'An unexpected error occurred during the connection test.';
    if (error.message) {
      details = error.message;
    }
    if (error.response?.data?.error?.message) {
        details = error.response.data.error.message;
    }

    if (details.includes('PERMISSION_DENIED')) {
        details = `Permission Denied. Ensure the service account (${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}) has at least 'Viewer' (for reading) and 'Editor' (for writing) access to the Google Sheet (ID: ${process.env.GOOGLE_SHEET_ID}).`;
    } else if (details.includes('Requested entity was not found')) {
        details = `Sheet Not Found. Verify that the GOOGLE_SHEET_ID ('${process.env.GOOGLE_SHEET_ID}') is correct and the sheet exists.`;
    } else if (details.includes('invalid_grant') || details.includes('Could not load the default credentials')) {
        details = `Authentication Failed. This can be due to an invalid service account email, an incorrectly formatted or expired private key, or issues with the Google Cloud project setup.`;
    }


    return {
      success: false,
      message: 'Connection test failed during API call.',
      details: details,
    };
  }
}
