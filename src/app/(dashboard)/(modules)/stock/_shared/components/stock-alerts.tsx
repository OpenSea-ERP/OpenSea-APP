'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AlertTriangle, Package, Clock, TrendingDown } from 'lucide-react';
import type { StockSummary } from '@/types/stock';

// ============================================
// ALERT ITEM
// ============================================

type AlertType =
  | 'LOW_STOCK'
  | 'EXPIRED'
  | 'PENDING_APPROVAL'
  | 'INVENTORY_VARIANCE';
type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

interface Alert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  entityType?: string;
  entityId?: string;
}

const alertIcons: Record<AlertType, React.ElementType> = {
  LOW_STOCK: TrendingDown,
  EXPIRED: Clock,
  PENDING_APPROVAL: Package,
  INVENTORY_VARIANCE: AlertTriangle,
};

const severityStyles: Record<
  AlertSeverity,
  { bg: string; border: string; icon: string }
> = {
  INFO: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
  },
  WARNING: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-500',
  },
  CRITICAL: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500',
  },
};

interface AlertItemProps {
  alert: Alert;
  onClick?: () => void;
}

function AlertItem({ alert, onClick }: AlertItemProps) {
  const Icon = alertIcons[alert.type];
  const styles = severityStyles[alert.severity];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        styles.bg,
        styles.border,
        onClick && 'cursor-pointer hover:opacity-80'
      )}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      onClick={onClick}
    >
      <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', styles.icon)} />
      <p className="text-sm">{alert.message}</p>
    </div>
  );
}

// ============================================
// STOCK ALERTS LIST
// ============================================

interface StockAlertsListProps {
  alerts: Alert[];
  title?: string;
  maxHeight?: number;
  onAlertClick?: (alert: Alert) => void;
  className?: string;
}

export function StockAlertsList({
  alerts,
  title = 'Alertas',
  maxHeight = 300,
  onAlertClick,
  className,
}: StockAlertsListProps) {
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter(a => a.severity === 'WARNING').length;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          {title}
          {criticalCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
              {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              {warningCount} aviso{warningCount > 1 ? 's' : ''}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            Nenhum alerta no momento
          </div>
        ) : (
          <ScrollArea style={{ maxHeight }} className="pr-4">
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <AlertItem
                  key={index}
                  alert={alert}
                  onClick={() => onAlertClick?.(alert)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// LOW STOCK ALERTS
// ============================================

interface LowStockAlertsProps {
  items: StockSummary['lowStockAlerts'];
  onItemClick?: (item: StockSummary['lowStockAlerts'][0]) => void;
  className?: string;
}

export function LowStockAlerts({
  items,
  onItemClick,
  className,
}: LowStockAlertsProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-orange-500" />
          Estoque Baixo
          {items.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
              {items.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            Nenhum item com estoque baixo
          </div>
        ) : (
          <ScrollArea style={{ maxHeight: 250 }} className="pr-4">
            <div className="space-y-2">
              {items.map(item => (
                <div
                  key={item.variantId}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
                    onItemClick && 'cursor-pointer hover:opacity-80'
                  )}
                  onClick={() => onItemClick?.(item)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {item.variantName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mín: {item.minStock} • Reposição: {item.reorderPoint}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {item.currentStock}
                    </p>
                    <p className="text-xs text-muted-foreground">un.</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
