
'use client';

import * as React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import type { SheetRow } from '@/lib/sheets';
import { cn } from '@/lib/utils';

interface DashboardTableProps {
  initialData: SheetRow[];
}

type SortKey = keyof SheetRow | null;
type SortDirection = 'asc' | 'desc';

export function DashboardTable({ initialData }: DashboardTableProps) {
  const [data, setData] = React.useState<SheetRow[]>(initialData);
  const [filter, setFilter] = React.useState<string>('');
  const [sortKey, setSortKey] = React.useState<SortKey>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc');

  React.useEffect(() => {
    setData(initialData);
  } , [initialData]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value.toLowerCase());
  };

  const handleSort = (key: keyof SheetRow) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const filteredData = React.useMemo(() => {
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(filter)
      )
    );
  }, [data, filter]);

  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      // Treat Priority and Probability specifically for sorting if needed
      // For now, simple string comparison will work as High, Low, Medium sort alphabetically
      // If custom sort order (High > Medium > Low) is desired, implement here.

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  const columns: { key: keyof SheetRow; label: string }[] = [
    { key: 'Donor/Opp', label: 'Donor/Opportunity' },
    { key: 'Action/Next Step', label: 'Action/Next Step' },
    { key: 'Lead', label: 'Lead' },
    { key: 'Priority', label: 'Priority' },
    { key: 'Probability', label: 'Probability' },
  ];

  const getStatusColorClass = (value: string): string => {
    switch (value?.toLowerCase()) {
      case 'high':
        return 'text-green-600 dark:text-green-400 font-semibold';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 font-semibold';
      case 'low':
        return 'text-destructive font-semibold'; // Uses theme's destructive color for red
      default:
        return '';
    }
  };

  return (
    <div className="w-full space-y-4">
       <div className="flex justify-end">
         <Input
            type="text"
            placeholder="Filter data..."
            value={filter}
            onChange={handleFilterChange}
            className="max-w-sm"
          />
       </div>
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                 <TableHead key={col.key}>
                    <Button
                        variant="ghost"
                        onClick={() => handleSort(col.key)}
                        className="px-2 py-1 h-auto text-left -ml-2"
                    >
                        {col.label}
                        <ArrowUpDown className={`ml-2 h-3 w-3 ${sortKey === col.key ? 'opacity-100' : 'opacity-30'}`} />
                    </Button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length > 0 ? (
              sortedData.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((col) => (
                     <TableCell 
                        key={col.key} 
                        className={cn(
                          col.key === 'Action/Next Step' ? 'min-w-[200px]' : '',
                          (col.key === 'Priority' || col.key === 'Probability') && getStatusColorClass(String(row[col.key]))
                        )}
                      >
                      {row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {initialData.length === 0 ? "No data available in the sheet." : "No results found for your filter."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
           <TableFooter>
             <TableRow>
               <TableCell colSpan={columns.length} className="text-right text-sm text-muted-foreground">
                 Total Rows: {sortedData.length}
               </TableCell>
             </TableRow>
           </TableFooter>
        </Table>
      </div>
    </div>
  );
}
