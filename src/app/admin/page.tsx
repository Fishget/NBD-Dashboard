import { cookies } from 'next/headers';
import { isAuthenticated } from '@/lib/auth';
import { LoginForm } from '@/components/login-form';
import { AdminForm } from '@/components/admin-form';
import { LogoutButton } from '@/components/logout-button';

export default function AdminPage() {
  const cookieStore = cookies();
  const loggedIn = isAuthenticated(cookieStore);

  return (
    <div className="space-y-6">
      {loggedIn ? (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <LogoutButton />
          </div>
          <p className="text-muted-foreground">Add new entries to the Google Sheet.</p>
          <AdminForm />
        </>
      ) : (
        <LoginForm />
      )}
    </div>
  );
}

// Ensure dynamic rendering because authentication depends on cookies
export const dynamic = 'force-dynamic';
