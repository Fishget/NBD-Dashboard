
import { cookies } from 'next/headers';
import { isAuthenticated } from '@/lib/auth';
import AdminPageClient from './admin-page-client';

export default async function AdminPage() {
  const cookieStore = cookies();
  const loggedIn = isAuthenticated(cookieStore);

  return <AdminPageClient initialLoggedIn={loggedIn} />;
}

// Ensure dynamic rendering because authentication depends on cookies
// and page content can change based on auth state.
export const dynamic = 'force-dynamic';
