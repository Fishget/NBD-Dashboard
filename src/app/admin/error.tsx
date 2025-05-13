
'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin Page Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-150px)] p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="bg-destructive text-destructive-foreground">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Admin Section Error
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="mb-4 text-center text-lg">
            An unexpected error occurred in the admin section.
          </p>
          {error?.message && (
            <div className="mb-4 p-3 rounded-md bg-secondary border border-border">
              <h3 className="text-md font-semibold text-card-foreground mb-1">Error Details:</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-muted-foreground/70 mt-2">Digest: {error.digest}</p>
              )}
            </div>
          )}
          <p className="text-sm text-muted-foreground text-center">
            You can try to reload the page or navigate back to the homepage.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
           <Button
            onClick={() => reset()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go to Homepage</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
