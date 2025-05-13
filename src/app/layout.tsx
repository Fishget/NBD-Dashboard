
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { LayoutDashboard, UserCog } from 'lucide-react'; // Import icons

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NBD Dashboard',
  description: 'Dashboard synced with Google Sheets',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          'antialiased font-sans'
        )}
      >
        <div className="flex flex-col min-h-screen">
          <header className="bg-primary text-primary-foreground p-4 shadow-md">
            <nav className="container mx-auto flex justify-between items-center">
              <Link href="/" className="text-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
                <LayoutDashboard className="h-6 w-6" /> 
                NBD Dashboard
              </Link>
              <Link href="/admin" className="text-sm font-medium hover:underline hover:opacity-90 transition-opacity flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Admin
              </Link>
            </nav>
          </header>
          <main className="flex-grow container mx-auto p-4 md:p-6">
            {children}
          </main>
          <footer className="text-center p-4 text-muted-foreground text-sm">
            © {new Date().getFullYear()} NBD Dashboard
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}

