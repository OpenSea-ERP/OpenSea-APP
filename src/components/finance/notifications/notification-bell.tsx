'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useOverdueSummary, useNotificationPreferences } from '@/hooks/finance';
import { IoNotificationsOutline, IoSettingsOutline } from 'react-icons/io5';
import Link from 'next/link';
import { useState } from 'react';
import { NotificationPreferences } from './notification-preferences';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function FinanceNotificationBell() {
  const { data } = useOverdueSummary();
  const { prefs } = useNotificationPreferences();
  const [prefsOpen, setPrefsOpen] = useState(false);

  const dashboard = data?.dashboard;
  const overduePayableCount = dashboard?.overduePayableCount ?? 0;
  const overdueReceivableCount = dashboard?.overdueReceivableCount ?? 0;
  const overduePayable = dashboard?.overduePayable ?? 0;
  const overdueReceivable = dashboard?.overdueReceivable ?? 0;
  const upcomingPayable = dashboard?.upcomingPayable7Days ?? 0;
  const upcomingReceivable = dashboard?.upcomingReceivable7Days ?? 0;

  const totalOverdueCount = overduePayableCount + overdueReceivableCount;

  // Only show badge if user wants overdue notifications
  const showBadge = prefs.notifOverdue && totalOverdueCount > 0;

  const hasContent =
    (prefs.notifOverdue && totalOverdueCount > 0) ||
    (prefs.notifDueSoon && (upcomingPayable > 0 || upcomingReceivable > 0));

  if (prefsOpen) {
    return (
      <NotificationPreferences
        open={prefsOpen}
        onOpenChange={setPrefsOpen}
      />
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl relative"
          aria-label="Notificacoes financeiras"
        >
          <IoNotificationsOutline className="w-5 h-5" />
          {showBadge && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
              {totalOverdueCount > 99 ? '99+' : totalOverdueCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h4 className="font-medium text-sm">Notificacoes Financeiras</h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPrefsOpen(true)}
            aria-label="Configuracoes de notificacao"
          >
            <IoSettingsOutline className="w-4 h-4" />
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {!hasContent ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma notificacao pendente
            </div>
          ) : (
            <div className="divide-y">
              {/* Overdue section */}
              {prefs.notifOverdue && totalOverdueCount > 0 && (
                <div className="p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contas Vencidas
                  </p>
                  {overduePayableCount > 0 && (
                    <Link
                      href="/finance/payable?status=OVERDUE"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          {overduePayableCount} conta{overduePayableCount > 1 ? 's' : ''} a pagar vencida{overduePayableCount > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total: {formatCurrency(overduePayable)}
                        </p>
                      </div>
                    </Link>
                  )}
                  {overdueReceivableCount > 0 && (
                    <Link
                      href="/finance/receivable?status=OVERDUE"
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-amber-600">
                          {overdueReceivableCount} conta{overdueReceivableCount > 1 ? 's' : ''} a receber vencida{overdueReceivableCount > 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total: {formatCurrency(overdueReceivable)}
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              )}

              {/* Due soon section */}
              {prefs.notifDueSoon && (upcomingPayable > 0 || upcomingReceivable > 0) && (
                <div className="p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Vencendo em Breve (7 dias)
                  </p>
                  {upcomingPayable > 0 && (
                    <div className="flex items-center justify-between p-2">
                      <p className="text-sm">A pagar</p>
                      <p className="text-sm font-medium">
                        {formatCurrency(upcomingPayable)}
                      </p>
                    </div>
                  )}
                  {upcomingReceivable > 0 && (
                    <div className="flex items-center justify-between p-2">
                      <p className="text-sm">A receber</p>
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(upcomingReceivable)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t">
          <Link href="/finance/overdue">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              Ver todas
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
