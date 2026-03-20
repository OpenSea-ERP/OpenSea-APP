'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEmailAccountHealth } from '@/hooks/email/use-email';
import type {
  EmailAccountHealth,
  EmailServiceHealth,
  EmailWorkerHealth,
} from '@/types/email';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, RefreshCw, Send, Server } from 'lucide-react';

interface EmailHealthCardsProps {
  accountId: string;
}

export function EmailHealthCards({ accountId }: EmailHealthCardsProps) {
  const { data, isLoading, refetch } = useEmailAccountHealth(accountId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Status dos Serviços
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="gap-1.5 h-8 text-xs"
        >
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Testar Conexões
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ImapCard health={data ?? null} isLoading={isLoading} />
        <SmtpCard health={data ?? null} isLoading={isLoading} />
        <WorkerCard health={data ?? null} isLoading={isLoading} />
      </div>
    </div>
  );
}

// ─── IMAP Card ──────────────────────────────────────────────────────────────

function ImapCard({
  health,
  isLoading,
}: {
  health: EmailAccountHealth | null;
  isLoading: boolean;
}) {
  const imap = health?.imap ?? null;

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">IMAP</span>
        </div>
        <ServiceStatusDot status={imap?.status ?? null} isLoading={isLoading} />
      </div>
      <ServiceStatusText
        status={imap?.status ?? null}
        isLoading={isLoading}
        connectedLabel="Conectado"
        errorLabel="Falha"
      />
      <p className="text-xs text-muted-foreground mt-1 truncate">
        {isLoading
          ? '\u00A0'
          : imap
            ? imap.status === 'connected'
              ? `${imap.latencyMs}ms`
              : (imap.error ?? 'Erro desconhecido')
            : '\u00A0'}
      </p>
    </div>
  );
}

// ─── SMTP Card ──────────────────────────────────────────────────────────────

function SmtpCard({
  health,
  isLoading,
}: {
  health: EmailAccountHealth | null;
  isLoading: boolean;
}) {
  const smtp = health?.smtp ?? null;

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Send className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">SMTP</span>
        </div>
        <ServiceStatusDot status={smtp?.status ?? null} isLoading={isLoading} />
      </div>
      <ServiceStatusText
        status={smtp?.status ?? null}
        isLoading={isLoading}
        connectedLabel="Conectado"
        errorLabel="Falha"
      />
      <p className="text-xs text-muted-foreground mt-1 truncate">
        {isLoading
          ? '\u00A0'
          : smtp
            ? smtp.status === 'connected'
              ? `${smtp.latencyMs}ms`
              : (smtp.error ?? 'Erro desconhecido')
            : '\u00A0'}
      </p>
    </div>
  );
}

// ─── Worker Card ────────────────────────────────────────────────────────────

function WorkerCard({
  health,
  isLoading,
}: {
  health: EmailAccountHealth | null;
  isLoading: boolean;
}) {
  const worker = health?.worker ?? null;

  const workerStatusLabel = !worker
    ? null
    : worker.status === 'active'
      ? 'Ativo'
      : worker.status === 'stale'
        ? 'Sem sync recente'
        : 'Falha';

  const workerStatusColor = !worker
    ? null
    : worker.status === 'active'
      ? 'text-emerald-600 dark:text-emerald-400'
      : worker.status === 'stale'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400';

  const workerDotColor = !worker
    ? null
    : worker.status === 'active'
      ? 'bg-emerald-500'
      : worker.status === 'stale'
        ? 'bg-amber-500 animate-pulse'
        : 'bg-rose-500';

  function getWorkerDetail(): string {
    if (!worker) return '\u00A0';
    if (worker.status === 'error') return worker.error ?? 'Erro desconhecido';
    if (worker.lastSyncAt) {
      const distance = formatDistanceToNow(new Date(worker.lastSyncAt), {
        locale: ptBR,
      });
      return `Último sync há ${distance}`;
    }
    return 'Sem dados de sync';
  }

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Worker Sync</span>
        </div>
        {isLoading ? (
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        ) : workerDotColor ? (
          <div className={cn('h-2 w-2 rounded-full', workerDotColor)} />
        ) : null}
      </div>
      <div className="mt-2">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Verificando...</p>
        ) : workerStatusLabel ? (
          <p className={cn('text-xs font-medium', workerStatusColor)}>
            {workerStatusLabel}
          </p>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground mt-1 truncate">
        {isLoading ? '\u00A0' : getWorkerDetail()}
      </p>
    </div>
  );
}

// ─── Shared sub-components ──────────────────────────────────────────────────

function ServiceStatusDot({
  status,
  isLoading,
}: {
  status: EmailServiceHealth['status'] | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />;
  }
  if (!status) return null;

  return (
    <div
      className={cn(
        'h-2 w-2 rounded-full',
        status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
      )}
    />
  );
}

function ServiceStatusText({
  status,
  isLoading,
  connectedLabel,
  errorLabel,
}: {
  status: EmailServiceHealth['status'] | null;
  isLoading: boolean;
  connectedLabel: string;
  errorLabel: string;
}) {
  if (isLoading) {
    return <p className="text-xs text-muted-foreground mt-2">Verificando...</p>;
  }
  if (!status) return <div className="mt-2" />;

  return (
    <p
      className={cn(
        'text-xs font-medium mt-2',
        status === 'connected'
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-rose-600 dark:text-rose-400'
      )}
    >
      {status === 'connected' ? connectedLabel : errorLabel}
    </p>
  );
}
