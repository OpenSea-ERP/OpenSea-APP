'use client';

import { useDeviceTerminal } from '@/hooks/sales';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { Monitor, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

const MODE_LABELS: Record<string, string> = {
  SALES_ONLY: 'Só Vendas',
  SALES_WITH_CHECKOUT: 'Venda + Cobrança',
  CASHIER: 'Caixa',
  TOTEM: 'Autoatendimento',
};

export function PosStatusBadge() {
  const router = useRouter();
  const { isPaired, terminal, currentSession } = useDeviceTerminal();

  if (!isPaired || !terminal) return null;

  const hasSession = !!currentSession;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white dark:bg-slate-800/60 px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium hidden sm:inline">
            {terminal.terminalName}
          </span>
          <Badge
            className={cn(
              'border-0 text-xs',
              hasSession
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
            )}
          >
            {hasSession ? 'Sessão aberta' : 'Sem sessão'}
          </Badge>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="space-y-1">
            <p className="font-semibold">{terminal.terminalName}</p>
            <p className="text-xs font-normal text-muted-foreground font-mono">
              {terminal.terminalCode}
            </p>
            <p className="text-xs font-normal text-muted-foreground">
              {MODE_LABELS[terminal.mode] ?? terminal.mode}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hasSession ? (
          <DropdownMenuItem
            onClick={() => router.push('/sales/pos/session/close')}
          >
            <Lock className="mr-2 h-4 w-4" />
            Fechar caixa
          </DropdownMenuItem>
        ) : (
          terminal.requiresSession && (
            <DropdownMenuItem
              onClick={() => router.push('/sales/pos/session/open')}
            >
              <Unlock className="mr-2 h-4 w-4" />
              Abrir caixa
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
