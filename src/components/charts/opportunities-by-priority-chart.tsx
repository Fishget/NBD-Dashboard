
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { SheetRow } from '@/lib/types'; // Import SheetRow from the new types.ts
import type { ChartFilterType } from '@/components/dashboard-table';

interface OpportunitiesByPriorityChartProps {
  data: SheetRow[];
  onFilter: (filter: ChartFilterType) => void;
  currentFilter: ChartFilterType;
}

const priorityOrder: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];

const chartConfig = {
  count: {
    label: 'Opportunities',
  },
  High: { label: 'High', color: 'hsl(var(--chart-color-high))' },
  Medium: { label: 'Medium', color: 'hsl(var(--chart-color-medium))' },
  Low: { label: 'Low', color: 'hsl(var(--chart-color-low))' },
} satisfies ChartConfig;

export function OpportunitiesByPriorityChart({ data, onFilter, currentFilter }: OpportunitiesByPriorityChartProps) {
  const priorityCounts = React.useMemo(() => {
    if (!Array.isArray(data)) return priorityOrder.map(priority => ({ name: priority, count: 0 }));
    const counts: { High: number; Medium: number; Low: number } = { High: 0, Medium: 0, Low: 0 };
    data.forEach(row => {
      if (row.Priority && counts[row.Priority] !== undefined) {
        counts[row.Priority]++;
      }
    });
    return priorityOrder.map(priority => ({ name: priority, count: counts[priority] }));
  }, [data]);

  const activePriority = currentFilter && 'priority' in currentFilter ? currentFilter.priority : null;

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={priorityCounts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
          <YAxis 
            dataKey="name" 
            type="category" 
            tickLine={false} 
            axisLine={false} 
            tick={{ fontSize: 12 }} 
            width={80}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar 
            dataKey="count" 
            layout="vertical" 
            radius={3}
            onClick={(barData) => onFilter({ priority: barData.name as string })}
          >
            {priorityCounts.map((entry) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={activePriority === entry.name ? 'hsl(var(--ring))' : chartConfig[entry.name as keyof typeof chartConfig].color}
                className="cursor-pointer transition-opacity hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
