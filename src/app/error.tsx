
'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary Caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background text-foreground">
          <h1 className="text-3xl font-bold text-destructive mb-6">Application Error</h1>
          <p className="mb-4 text-lg">We're sorry, but something went wrong.</p>
          {error?.message && (
            <div className="mb-6 p-4 rounded-md bg-muted border border-destructive/50 max-w-md w-full">
              <h2 className="text-lg font-semibold text-destructive mb-2">Error Details:</h2>
              <p className="text-sm text-destructive-foreground bg-destructive p-2 rounded-md whitespace-pre-wrap">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">Digest: {error.digest}</p>
              )}
            </div>
          )}
          <div className="flex gap-4">
            <Button
              onClick={() => reset()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Try again
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Go to Homepage</Link>
            </Button>
          </div>
          <footer className="absolute bottom-4 text-sm text-muted-foreground">
             NBD Dashboard - Error Page
          </footer>
        </div>
      </body>
    </html>
  );
}
