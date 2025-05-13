
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    router.refresh();
    // Simulate refresh duration for visual feedback, adjust or remove as needed
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    setIsRefreshing(false);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
      <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin-slow")} />
      {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
    </Button>
  );
}
