import { cookies } from 'next/headers';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

const AUTH_COOKIE_NAME = 'sheetsync_auth';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.warn('Admin credentials are not set in environment variables. Admin login will not work.');
}

export function checkCredentials(username?: string | null, password?: string | null): boolean {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    return false; // Cannot authenticate if credentials aren't set
  }
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export async function setAuthCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(AUTH_COOKIE_NAME, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/admin', // Restrict cookie to admin paths
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours validity
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export function isAuthenticated(cookieStore?: ReadonlyRequestCookies): boolean {
  const store = cookieStore || cookies();
  const authCookie = store.get(AUTH_COOKIE_NAME);
  return authCookie?.value === 'true';
}
