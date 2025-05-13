
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { SheetRow } from '@/lib/types'; // Import SheetRow from the new types.ts
import type { ChartFilterType } from '@/components/dashboard-table';

interface OpportunitiesByLeadChartProps {
  data: SheetRow[];
  onFilter: (filter: ChartFilterType) => void;
  currentFilter: ChartFilterType;
}

const chartConfig = {
  count: {
    label: 'Opportunities',
  },
} satisfies ChartConfig;

// Predefined color palette for leads
const leadColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))', // Use primary as a fallback or additional color
];


export function OpportunitiesByLeadChart({ data, onFilter, currentFilter }: OpportunitiesByLeadChartProps) {
  const leadCounts = React.useMemo(() => {
    if (!Array.isArray(data)) return [];
    const counts: { [key: string]: number } = {};
    data.forEach(row => {
      if (row.Lead) { // Ensure lead is not empty
        counts[row.Lead] = (counts[row.Lead] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([lead, count]) => ({ name: lead, count }))
      .sort((a,b) => b.count - a.count); // Sort by count descending
  }, [data]);

  const getLeadColor = (index: number) => leadColors[index % leadColors.length];

  const activeLead = currentFilter && 'lead' in currentFilter ? currentFilter.lead : null;

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={leadCounts} margin={{ top: 5, right: 20, left: 0, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            interval={0} 
            height={80} 
            tick={{ fontSize: 12 }}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar 
            dataKey="count" 
            radius={3}
            onClick={(barData) => onFilter({ lead: barData.name as string })}
          >
            {leadCounts.map((entry, index) => (
              <Cell
                key={`cell-${entry.name}-${index}`}
                fill={activeLead === entry.name ? 'hsl(var(--ring))' : getLeadColor(index)}
                className="cursor-pointer transition-opacity hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
