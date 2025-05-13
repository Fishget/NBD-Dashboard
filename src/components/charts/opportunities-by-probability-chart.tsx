
'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { SheetRow } from '@/lib/sheets';
import type { ChartFilterType } from '@/components/dashboard-table';

interface OpportunitiesByProbabilityChartProps {
  data: SheetRow[];
  onFilter: (filter: ChartFilterType) => void;
  currentFilter: ChartFilterType;
}

const probabilityOrder: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];

const chartConfig = {
  count: {
    label: 'Opportunities',
  },
  High: { label: 'High', color: 'hsl(var(--chart-color-high))' },
  Medium: { label: 'Medium', color: 'hsl(var(--chart-color-medium))' },
  Low: { label: 'Low', color: 'hsl(var(--chart-color-low))' },
} satisfies ChartConfig;

export function OpportunitiesByProbabilityChart({ data, onFilter, currentFilter }: OpportunitiesByProbabilityChartProps) {
  const probabilityCounts = React.useMemo(() => {
    const counts: { High: number; Medium: number; Low: number } = { High: 0, Medium: 0, Low: 0 };
    data.forEach(row => {
      if (row.Probability && counts[row.Probability] !== undefined) {
        counts[row.Probability]++;
      }
    });
    return probabilityOrder.map(probability => ({ name: probability, count: counts[probability] }));
  }, [data]);
  
  const activeProbability = currentFilter && 'probability' in currentFilter && !('priority' in currentFilter) ? currentFilter.probability : null;


  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={probabilityCounts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            onClick={(barData) => onFilter({ probability: barData.name as string })}
          >
            {probabilityCounts.map((entry) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={activeProbability === entry.name ? 'hsl(var(--ring))' : chartConfig[entry.name as keyof typeof chartConfig].color}
                className="cursor-pointer transition-opacity hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
