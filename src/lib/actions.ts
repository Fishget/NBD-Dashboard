'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { checkCredentials, setAuthCookie, clearAuthCookie } from './auth';
import { loginSchema, sheetRowSchema } from './validators';
import { appendSheetRow } from './sheets';
import type { SheetRowFormData } from './validators';

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
