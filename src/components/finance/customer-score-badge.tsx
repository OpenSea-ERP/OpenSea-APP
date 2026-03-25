/**
 * CustomerScoreBadge
 * Badge/tooltip que mostra a confiabilidade de pagamento de um cliente.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCustomerScore } from '@/hooks/finance/use-customer-score';
import {
  CUSTOMER_SCORE_COLORS,
  CUSTOMER_SCORE_LABELS,
} from '@/types/finance';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface CustomerScoreBadgeProps {
  customerName: string;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CustomerScoreBadge({
  customerName,
  className,
}: CustomerScoreBadgeProps) {
  const { data, isLoading } = useCustomerScore(customerName);

  if (!customerName) return null;
  if (isLoading) {
    return (
      <Badge variant="outline" className={cn('text-xs gap-1', className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
        Score
      </Badge>
    );
  }
  if (!data?.score) return null;

  const { score } = data;
  const colors = CUSTOMER_SCORE_COLORS[score.level];
  const label = CUSTOMER_SCORE_LABELS[score.level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-medium cursor-help',
              colors.bg,
              colors.text,
              className
            )}
          >
            {label} ({score.score})
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px]">
          <div className="space-y-1.5 text-xs">
            <p className="font-semibold">{score.customerName}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <span className="text-muted-foreground">Média de dias:</span>
              <span className="font-mono">
                {score.avgDaysToPay.toFixed(1)} dias
              </span>
              <span className="text-muted-foreground">Taxa em dia:</span>
              <span className="font-mono">
                {(score.onTimeRate * 100).toFixed(0)}%
              </span>
              <span className="text-muted-foreground">Total de títulos:</span>
              <span className="font-mono">{score.totalEntries}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
