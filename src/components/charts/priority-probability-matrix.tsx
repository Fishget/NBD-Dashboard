'use client';

import * as React from 'react';
import type { SheetRow } from '../../../lib/types'; // Changed from @/lib/types
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ChartFilterType } from '@/components/dashboard-table';

interface PriorityProbabilityMatrixProps {
  data: SheetRow[];
  onFilter: (filter: ChartFilterType) => void;
  currentFilter: ChartFilterType;
}

const priorities: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low'];
const probabilities: ('High' | 'Medium' | 'Low')[] = ['High', 'Medium', 'Low']; // Assuming these are the correct values

const getPriorityColor = (priority: 'High' | 'Medium' | 'Low'): string => {
  if (priority === 'High') return 'hsl(var(--chart-color-high))'; // Green
  if (priority === 'Medium') return 'hsl(var(--chart-color-medium))'; // Orange/Yellow
  return 'hsl(var(--chart-color-low))'; // Red
};

export function PriorityProbabilityMatrix({ data, onFilter, currentFilter }: PriorityProbabilityMatrixProps) {
  const matrixData = React.useMemo(() => {
    const matrix: { [priority: string]: { [probability: string]: number } } = {
      High: { High: 0, Medium: 0, Low: 0 },
      Medium: { High: 0, Medium: 0, Low: 0 },
      Low: { High: 0, Medium: 0, Low: 0 },
    };
    if (!Array.isArray(data)) return matrix; // Return empty matrix if data is not an array
    
    data.forEach(row => {
      // Ensure Priority and Probability are valid keys for the matrix
      if (
        priorities.includes(row.Priority) &&
        probabilities.includes(row.Probability) &&
        matrix[row.Priority] && // Check if priority exists as a key
        matrix[row.Priority][row.Probability] !== undefined // Check if probability exists for that priority
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
    return max === 0 ? 1 : max; // Avoid division by zero if all counts are 0
  }, [matrixData]);

  const activePriority = currentFilter && 'priority' in currentFilter ? currentFilter.priority : null;
  const activeProbability = currentFilter && 'probability' in currentFilter ? currentFilter.probability : null;

  return (
    <TooltipProvider>
      {/* Reduced height and cell padding/text size */}
      <div className="grid grid-cols-4 gap-1 w-full h-[180px]"> 
        {/* Corner Cell for Labels */}
        <div className="flex items-center justify-center text-xs font-medium text-muted-foreground"></div>
        {/* Probability Labels (Top Row) */}
        {probabilities.map(prob => (
          <div key={`label-prob-${prob}`} className="flex items-center justify-center p-1 text-xs font-medium text-muted-foreground">
            {prob}
          </div>
        ))}

        {priorities.map(priority => (
          <React.Fragment key={`row-${priority}`}>
            {/* Priority Label (First Column) */}
            <div className="flex items-center justify-center p-1 text-xs font-medium text-muted-foreground">
              {priority}
            </div>
            {/* Data Cells */}
            {probabilities.map(probability => {
              const count = matrixData[priority][probability];
              const opacity = count > 0 ? Math.max(0.2, count / maxCount) : 0.1; // Ensure some visibility even for 0
              const isActive = activePriority === priority && activeProbability === probability;

              return (
                <Tooltip key={`${priority}-${probability}`}>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => onFilter({ priority, probability })}
                      className={cn(
                        "flex items-center justify-center p-1 border rounded-md cursor-pointer transition-all aspect-square", // aspect-square makes cells square, reduced padding from p-1.5 to p-1
                        "hover:ring-2 hover:ring-offset-2 hover:ring-primary", // Enhanced hover effect
                        isActive && "ring-2 ring-offset-2 ring-primary shadow-lg", // Active cell styling
                      )}
                      style={{
                        backgroundColor: getPriorityColor(priority),
                        opacity: isActive ? 1 : opacity, // Full opacity if active
                      }}
                      data-testid={`matrix-cell-${priority}-${probability}`}
                    >
                      <span className={cn(
                        "font-bold text-sm", // Reduced text size from text-base to text-sm
                        // Basic contrast logic, can be refined
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

