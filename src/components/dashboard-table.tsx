
'use client';

import * as React from 'react';
import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ChevronLeft, ChevronRight, BarChart2, Eye, EyeOff, FilterX, Pencil, Terminal } from 'lucide-react';
import type { SheetRow } from '../../lib/types'; 
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OpportunitiesByPriorityChart } from '@/components/charts/opportunities-by-priority-chart';
import { OpportunitiesByProbabilityChart } from '@/components/charts/opportunities-by-probability-chart';
import { PriorityProbabilityMatrix } from '@/components/charts/priority-probability-matrix';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { sheetRowSchema, type SheetRowFormData } from '@/lib/validators';
import { upsertDataAction, type FormState } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface DashboardTableProps {
  initialData: SheetRow[];
  isEditable?: boolean;
}

type SortKey = keyof SheetRow | null;
type SortDirection = 'asc' | 'desc';
export type ChartFilterType = Record<string, string | number> | null;


function EditRowDialog({ row, isOpen, onClose }: { row: SheetRow; isOpen: boolean; onClose: () => void }) {
  const [state, formAction] = useActionState<FormState | null, FormData>(upsertDataAction, null);
  const { toast } = useToast();

  const form = useForm<SheetRowFormData>({
    resolver: zodResolver(sheetRowSchema),
    defaultValues: {
      'Donor/Opp': row['Donor/Opp'] || '',
      'Action/Next Step': row['Action/Next Step'] || '',
      Lead: row.Lead || '',
      Priority: row.Priority,
      Probability: row.Probability,
      rowIndex: row.rowIndex,
    },
  });

  useEffect(() => {
    if (state) {
      toast({
        title: state.success ? 'Success' : 'Error',
        description: state.message,
        variant: state.success ? 'default' : 'destructive',
      });
      if (state.success) {
        onClose(); // Close dialog on successful update
      }
    }
  }, [state, onClose, toast]);

  function SubmitButton() {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending}>
        {pending ? 'Updating...' : 'Update Entry'}
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Entry</DialogTitle>
          <DialogDescription>
            Make changes to the entry. Click Update to save.
          </DialogDescription>
        </DialogHeader>
         {!state?.success && state?.message && !state.errors && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Update Failed</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
            </Alert>
        )}
        <Form {...form}>
          <form action={formAction} className="space-y-4 py-4">
            <input type="hidden" {...form.register('rowIndex')} />
            
             <FormField
                control={form.control}
                name="Donor/Opp"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Donor/Opportunity</FormLabel>
                    <FormControl>
                        <Input {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

            <FormField
              control={form.control}
              name="Action/Next Step"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action/Next Step</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="Lead"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="Priority"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Priority" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="Probability"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Probability</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Probability" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <DialogFooter>
               <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
               </DialogClose>
               <SubmitButton />
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export function DashboardTable({ initialData, isEditable = false }: DashboardTableProps) {
  const [data, setData] = React.useState<SheetRow[]>(initialData || []); 
  const [filter, setFilter] = React.useState<string>('');
  const [sortKey, setSortKey] = React.useState<SortKey>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(50);

  const [showCharts, setShowCharts] = React.useState(false); // Charts hidden by default
  const [chartFilter, setChartFilter] = React.useState<ChartFilterType>(null);
  const [editingRow, setEditingRow] = React.useState<SheetRow | null>(null);


  React.useEffect(() => {
    setData(initialData || []); 
    setCurrentPage(1); 
  } , [initialData]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value.toLowerCase());
    setCurrentPage(1); 
  };

  const handleSort = (key: keyof SheetRow) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1); 
  };

  const toggleCharts = () => setShowCharts(prev => !prev);

  const handleChartFilter = (newFilter: ChartFilterType) => {
    setChartFilter(prevFilter => {
      // If the new filter is identical to the current one, clear the filter (toggle behavior)
      if (JSON.stringify(prevFilter) === JSON.stringify(newFilter)) {
        return null;
      }
      return newFilter;
    });
    setCurrentPage(1);
  };

  const resetChartFilters = () => {
    setChartFilter(null);
    setCurrentPage(1);
  };

  const textFilteredData = React.useMemo(() => {
    if (!Array.isArray(data)) return []; 
    if (!filter) return data;
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(filter)
      )
    );
  }, [data, filter]);

  const fullyFilteredData = React.useMemo(() => {
      if (!Array.isArray(textFilteredData)) return []; 
      if (!chartFilter) return textFilteredData;
      return textFilteredData.filter(row => {
          return Object.entries(chartFilter).every(([key, value]) => {
              const rowValue = String(row[key as keyof SheetRow]).toLowerCase();
              const filterValue = String(value).toLowerCase();
              return rowValue === filterValue;
          });
      });
  }, [textFilteredData, chartFilter]);


  const sortedData = React.useMemo(() => {
    if (!Array.isArray(fullyFilteredData)) return []; 
    if (!sortKey) return fullyFilteredData;

    return [...fullyFilteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === null || valA === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (valB === null || valB === undefined) return sortDirection === 'asc' ? 1 : -1;

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [fullyFilteredData, sortKey, sortDirection]);
  
  const currentTableData = React.useMemo(() => {
    if (!Array.isArray(sortedData)) return []; 
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    return sortedData.slice(indexOfFirstRow, indexOfLastRow);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = React.useMemo(() => {
    if (!Array.isArray(sortedData)) return 1; 
    return Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  }, [sortedData, rowsPerPage]);


  React.useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

   React.useEffect(() => {
    if (!Array.isArray(sortedData)) return; 
    const newTotalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  }, [sortedData, rowsPerPage, currentPage]);


  const columns: { key: keyof SheetRow | 'actions'; label: string }[] = [
    { key: 'Donor/Opp', label: 'Donor/Opportunity' },
    { key: 'Action/Next Step', label: 'Action/Next Step' },
    { key: 'Lead', label: 'Lead' },
    { key: 'Priority', label: 'Priority' },
    { key: 'Probability', label: 'Probability' },
  ];
  if (isEditable) {
    columns.push({ key: 'actions', label: 'Actions' });
  }


  const getStatusColorClass = (value: string): string => {
    switch (value?.toLowerCase()) {
      case 'high':
        return 'text-[hsl(var(--chart-color-high))] font-semibold';
      case 'medium':
        return 'text-[hsl(var(--chart-color-medium))] font-semibold';
      case 'low':
        return 'text-[hsl(var(--chart-color-low))] font-semibold';
      default:
        return '';
    }
  };
  
  const displayTotalPages = totalPages > 0 ? totalPages : 1;
  const SKELETON_ROWS = 5;


  if (!initialData && !data.length) { // Check if initialData is also undefined/empty
     return (
      <div className="w-full space-y-4">
        <div className="flex justify-end">
          {/* Using Skeleton component for placeholder */}
          <div className="h-10 w-[250px] bg-muted rounded animate-pulse" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => (
                  <TableHead key={col.key}>
                    <div className="h-4 w-[100px] bg-muted rounded animate-pulse" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(SKELETON_ROWS)].map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map(col => (
                    <TableCell key={`skeleton-cell-${col.key}-${i}`}>
                      <div className="h-4 w-full bg-muted rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }


  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
            <Button onClick={toggleCharts} variant="outline">
            {showCharts ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {showCharts ? 'Hide Charts' : 'Show Charts'}
            </Button>
            {chartFilter && (
            <Button onClick={resetChartFilters} variant="outline" size="sm">
                <FilterX className="mr-2 h-4 w-4" />
                Reset Chart Filter
            </Button>
            )}
        </div>
        <Input
          type="text"
          placeholder="Filter data..."
          value={filter}
          onChange={handleFilterChange}
          className="max-w-xs w-full sm:w-auto"
        />
      </div>

      {showCharts && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="mr-2 h-5 w-5 text-primary" />
              Opportunities Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6"> {/* Added space-y-6 for overall chart content padding */}
             {/* Priority x Probability Matrix - Takes full width */}
            <div className="p-4 border rounded-lg shadow-sm bg-card">
                <h3 className="text-lg font-semibold mb-3 text-center">Priority x Probability Matrix</h3>
                <div className="w-full max-w-sm mx-auto"> {/* Reduced max-w for smaller matrix */}
                    <PriorityProbabilityMatrix data={initialData || []} onFilter={handleChartFilter} currentFilter={chartFilter} />
                </div>
            </div>
            
            {/* Container for Priority and Probability charts - side by side on medium screens and up */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg shadow-sm bg-card">
                <h3 className="text-lg font-semibold mb-3 text-center">Opportunities by Priority</h3>
                <OpportunitiesByPriorityChart data={initialData || []} onFilter={handleChartFilter} currentFilter={chartFilter} />
              </div>
              <div className="p-4 border rounded-lg shadow-sm bg-card">
                <h3 className="text-lg font-semibold mb-3 text-center">Opportunities by Probability</h3>
                <OpportunitiesByProbabilityChart data={initialData || []} onFilter={handleChartFilter} currentFilter={chartFilter} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                 <TableHead key={col.key}>
                    {col.key === 'actions' ? (
                        <span>{col.label}</span>
                    ) : (
                        <Button
                            variant="ghost"
                            onClick={() => handleSort(col.key as keyof SheetRow)}
                            className="px-2 py-1 h-auto text-left -ml-2"
                        >
                            {col.label}
                            <ArrowUpDown className={`ml-2 h-3 w-3 ${sortKey === col.key ? 'opacity-100' : 'opacity-30'}`} />
                        </Button>
                    )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTableData.length > 0 ? (
              currentTableData.map((row, index) => (
                <TableRow key={index} data-testid={`table-row-${index}`}>
                  {columns.map((col) => (
                     <TableCell 
                        key={col.key} 
                        className={cn(
                          col.key === 'Action/Next Step' ? 'min-w-[200px]' : '', // Ensure Action/Next Step has enough width
                          (col.key === 'Priority' || col.key === 'Probability') && getStatusColorClass(String(row[col.key as keyof SheetRow]))
                        )}
                      >
                      {col.key === 'actions' ? (
                          <Button variant="ghost" size="icon" onClick={() => setEditingRow(row)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit Row</span>
                          </Button>
                      ) : (
                        String(row[col.key as keyof SheetRow])
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {(initialData || []).length === 0 ? "No data available in the sheet." : "No results found for your filter(s)."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
           <TableFooter>
             <TableRow>
               <TableCell colSpan={columns.length}>
                <div className="flex items-center justify-between w-full py-2">
                    <div className="text-sm text-muted-foreground">
                        Displaying {currentTableData.length} of {(sortedData || []).length} rows
                    </div>
                    {(sortedData || []).length > 0 && ( // Only show pagination if there's data
                        <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
                            {/* Rows per page selector */}
                            <div className="flex items-center space-x-1 sm:space-x-2">
                                <p className="text-xs sm:text-sm font-medium">Rows per page</p>
                                <Select
                                    value={`${rowsPerPage}`}
                                    onValueChange={(value) => {
                                    setRowsPerPage(Number(value));
                                    }}
                                >
                                    <SelectTrigger className="h-7 sm:h-8 w-[60px] sm:w-[70px] text-xs sm:text-sm"> {/* Adjusted size */}
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

                            {/* Page indicator */}
                            <div className="flex w-[80px] sm:w-[100px] items-center justify-center text-xs sm:text-sm font-medium">
                                Page {currentPage} of {displayTotalPages}
                            </div>

                            {/* Pagination buttons */}
                            <div className="flex items-center space-x-1 sm:space-x-2">
                                <Button
                                    variant="outline"
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0" // Adjusted size
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <span className="sr-only">Go to previous page</span>
                                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-7 w-7 sm:h-8 sm:w-8 p-0" // Adjusted size
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0} // Disable if on last page or no pages
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

      {editingRow && (
        <EditRowDialog
          row={editingRow}
          isOpen={!!editingRow}
          onClose={() => setEditingRow(null)}
        />
      )}
    </div>
  );
}
