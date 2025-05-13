
'use client';

import * as React from 'react';
import type { SheetRow } from '../../../lib/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ChartFilterType } from '@/components/dashboard-table';

interface PriorityProbabilityMatrixProps {
  data: SheetRow[];
  onFilter: (filter: ChartFilterType) => void;
  currentFilter: ChartFilterType;
}

const priorities: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];
const probabilities: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];

const getPriorityColor = (priority: 'High' | 'Medium' | 'Low'): string => {
  if (priority === 'High') return 'hsl(var(--chart-color-high))';
  if (priority === 'Medium') return 'hsl(var(--chart-color-medium))';
  return 'hsl(var(--chart-color-low))';
};

export function PriorityProbabilityMatrix({ data, onFilter, currentFilter }: PriorityProbabilityMatrixProps) {
  const matrixData = React.useMemo(() => {
    const matrix: { [priority: string]: { [probability: string]: number } } = {
      High: { High: 0, Medium: 0, Low: 0 },
      Medium: { High: 0, Medium: 0, Low: 0 },
      Low: { High: 0, Medium: 0, Low: 0 },
    };
    if (!Array.isArray(data)) return matrix;
    
    data.forEach(row => {
      if (
        priorities.includes(row.Priority) &&
        probabilities.includes(row.Probability) &&
        matrix[row.Priority] &&
        matrix[row.Priority][row.Probability] !== undefined
      ) {
        matrix[row.Priority][row.Probability]++;
      }
    });
    return matrix;
  }, [data]);

  const maxCount = React.useMemo(() => {
    let max = 0;
    priorities.forEach(p => {
      probabilities.forEach(prob => {
        if (matrixData[p][prob] > max) {
          max = matrixData[p][prob];
        }
      });
    });
    return max === 0 ? 1 : max;
  }, [matrixData]);

  const activePriority = currentFilter && 'priority' in currentFilter ? currentFilter.priority : null;
  const activeProbability = currentFilter && 'probability' in currentFilter ? currentFilter.probability : null;

  return (
    <TooltipProvider>
      <div className="grid grid-cols-4 gap-0.5 w-full max-w-md mx-auto"> 
        <div className="flex items-center justify-center text-xs font-medium text-muted-foreground"></div>
        {probabilities.map(prob => (
          <div key={`label-prob-${prob}`} className="flex items-center justify-center p-0.5 text-xs font-medium text-muted-foreground">
            {prob}
          </div>
        ))}

        {priorities.map(priority => (
          <React.Fragment key={`row-${priority}`}>
            <div className="flex items-center justify-center p-0.5 text-xs font-medium text-muted-foreground">
              {priority}
            </div>
            {probabilities.map(probability => {
              const count = matrixData[priority][probability];
              const opacity = count > 0 ? Math.max(0.2, count / maxCount) : 0.1;
              const isActive = activePriority === priority && activeProbability === probability;

              return (
                <Tooltip key={`${priority}-${probability}`}>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => onFilter({ priority, probability })}
                      className={cn(
                        "flex items-center justify-center p-0.5 border rounded-md cursor-pointer transition-all aspect-square", 
                        "hover:ring-2 hover:ring-offset-2 hover:ring-primary",
                        isActive && "ring-2 ring-offset-2 ring-primary shadow-lg",
                      )}
                      style={{
                        backgroundColor: getPriorityColor(priority),
                        opacity: isActive ? 1 : opacity,
                      }}
                      data-testid={`matrix-cell-${priority}-${probability}`}
                    >
                      <span className={cn(
                        "font-bold text-xs", 
                        count > maxCount / 2 ? "text-white" : "text-black" 
                      )}>
                        {count}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Priority: {priority}</p>
                    <p>Probability: {probability}</p>
                    <p>Count: {count}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </TooltipProvider>
  );
}
