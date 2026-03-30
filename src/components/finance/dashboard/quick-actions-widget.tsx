'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuickActions } from '@/hooks/finance';
import type {
  QuickAction,
  QuickActionType,
  QuickActionUrgency,
} from '@/types/finance';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

const TYPE_ICONS: Record<QuickActionType, React.ElementType> = {
  OVERDUE_PAYMENT: AlertTriangle,
  UPCOMING_DUE: Clock,
  PENDING_APPROVAL: CheckCircle,
  UNRECONCILED: RefreshCw,
};

const URGENCY_CONFIG: Record<
  QuickActionUrgency,
  {
    bgLight: string;
    bgDark: string;
    textLight: string;
    textDark: string;
    borderLight: string;
    borderDark: string;
    iconColor: string;
    label: string;
  }
> = {
  HIGH: {
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-500/8',
    textLight: 'text-rose-700',
    textDark: 'dark:text-rose-300',
    borderLight: 'border-rose-200',
    borderDark: 'dark:border-rose-800/50',
    iconColor: 'text-rose-500',
    label: 'Urgente',
  },
  MEDIUM: {
    bgLight: 'bg-amber-50',
    bgDark: 'dark:bg-amber-500/8',
    textLight: 'text-amber-700',
    textDark: 'dark:text-amber-300',
    borderLight: 'border-amber-200',
    borderDark: 'dark:border-amber-800/50',
    iconColor: 'text-amber-500',
    label: 'Moderado',
  },
  LOW: {
    bgLight: 'bg-sky-50',
    bgDark: 'dark:bg-sky-500/8',
    textLight: 'text-sky-700',
    textDark: 'dark:text-sky-300',
    borderLight: 'border-sky-200',
    borderDark: 'dark:border-sky-800/50',
    iconColor: 'text-sky-500',
    label: 'Baixo',
  },
};

const URGENCY_ORDER: Record<QuickActionUrgency, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

// =============================================================================
// ACTION ROW
// =============================================================================

function ActionRow({ action }: { action: QuickAction }) {
  const router = useRouter();
  const Icon = TYPE_ICONS[action.type] ?? Zap;
  const config = URGENCY_CONFIG[action.urgency];

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer
        ${config.borderLight} ${config.borderDark}`}
      onClick={() => router.push(action.actionUrl)}
    >
      <div
        className={`p-2 rounded-lg shrink-0 ${config.bgLight} ${config.bgDark}`}
      >
        <Icon className={`h-4 w-4 ${config.iconColor}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{action.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 border-0 ${config.bgLight} ${config.bgDark} ${config.textLight} ${config.textDark}`}
          >
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {action.count} {action.count === 1 ? 'item' : 'itens'}
          </span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p
          className={`text-sm font-semibold ${config.textLight} ${config.textDark}`}
        >
          {formatCurrency(action.totalAmount)}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs mt-0.5"
          onClick={e => {
            e.stopPropagation();
            router.push(action.actionUrl);
          }}
        >
          Ver
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// LOADING
// =============================================================================

function LoadingSkeleton() {
  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN WIDGET
// =============================================================================

export function QuickActionsWidget() {
  const { data, isLoading, error } = useQuickActions();

  if (isLoading) return <LoadingSkeleton />;
  if (error || !data) return null;

  const actions = [...data.actions].sort(
    (a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]
  );

  if (actions.length === 0) return null;

  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Zap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            Acoes Rapidas
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {actions.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map(action => (
          <ActionRow key={action.type} action={action} />
        ))}
      </CardContent>
    </Card>
  );
}
