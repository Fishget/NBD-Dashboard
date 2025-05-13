
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
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SheetRow } from '@/lib/sheets';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(50);

  React.useEffect(() => {
    setData(initialData);
    setCurrentPage(1); // Reset page when initial data changes
  } , [initialData]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value.toLowerCase());
    setCurrentPage(1); // Reset page when filter changes
  };

  const handleSort = (key: keyof SheetRow) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset page when sort changes
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

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentTableData = sortedData.slice(indexOfFirstRow, indexOfLastRow);

  // Reset to page 1 if rowsPerPage changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  // Adjust current page if it becomes out of bounds due to data changes
   React.useEffect(() => {
    const newTotalPages = Math.ceil(sortedData.length / rowsPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    } else if (newTotalPages === 0 && sortedData.length === 0) {
      setCurrentPage(1);
    }
  }, [sortedData.length, rowsPerPage, currentPage]);


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
        return 'text-red-600 dark:text-red-400 font-semibold'; // Changed to red-600 for consistency
      default:
        return '';
    }
  };
  
  const displayTotalPages = totalPages > 0 ? totalPages : 1;

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
            {currentTableData.length > 0 ? (
              currentTableData.map((row, index) => (
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
               <TableCell colSpan={columns.length}>
                <div className="flex items-center justify-between w-full py-2">
                    <div className="text-sm text-muted-foreground">
                        Total Rows: {sortedData.length}
                    </div>
                    {sortedData.length > 0 && (
                        <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
                            <div className="flex items-center space-x-1 sm:space-x-2">
                                <p className="text-xs sm:text-sm font-medium">Rows per page</p>
                                <Select
                                    value={`${rowsPerPage}`}
                                    onValueChange={(value) => {
                                    setRowsPerPage(Number(value));
                                    }}
                                >
                                    <SelectTrigger className="h-7 sm:h-8 w-[60px] sm:w-[70px] text-xs sm:text-sm">
                                        <SelectValue placeholder={`${rowsPerPage}`} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                    {[50, 100, 150].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs sm:text-sm">
                                        {pageSize}
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex w-[80px] sm:w-[100px] items-center justify-center text-xs sm:text-sm font-medium">
                                Page {currentPage} of {displayTotalPages}
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                                <Button
                                    variant="outline"
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <span className="sr-only">Go to previous page</span>
                                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <span className="sr-only">Go to next page</span>
                                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
               </TableCell>
             </TableRow>
           </TableFooter>
        </Table>
      </div>
    </div>
  );
}

