'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { aiActionsService } from '@/services/ai';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { AiActionLog, AiActionStatus } from '@/types/ai';

const STATUS_CONFIG: Record<
  AiActionStatus,
  {
    label: string;
    icon: React.ElementType;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  PROPOSED: { label: 'Proposta', icon: Clock, variant: 'outline' },
  CONFIRMED: { label: 'Confirmada', icon: CheckCircle2, variant: 'default' },
  EXECUTED: { label: 'Executada', icon: CheckCircle2, variant: 'default' },
  FAILED: { label: 'Falhou', icon: XCircle, variant: 'destructive' },
  CANCELLED: { label: 'Cancelada', icon: AlertCircle, variant: 'secondary' },
};

export default function AiActionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['ai', 'actions', statusFilter],
    queryFn: async () => {
      const response = await aiActionsService.list({
        status: statusFilter || undefined,
        limit: 50,
      });
      return response.actions;
    },
  });

  const actions = data ?? [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Ferramentas' },
          { label: 'Assistente IA', href: '/ai' },
          { label: 'Historico de Acoes' },
        ]}
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={statusFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('')}
          >
            Todas
          </Button>
          {(
            [
              'PROPOSED',
              'CONFIRMED',
              'EXECUTED',
              'FAILED',
              'CANCELLED',
            ] as AiActionStatus[]
          ).map(status => {
            const config = STATUS_CONFIG[status];
            return (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {config.label}
              </Button>
            );
          })}
        </div>

        {/* Actions list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">
              Nenhuma acao registrada
            </h3>
            <p className="text-sm text-muted-foreground">
              As acoes executadas pelo assistente IA aparecerao aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action: AiActionLog) => {
              const statusConfig = STATUS_CONFIG[action.status];
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={action.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <StatusIcon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {action.actionType}
                          </span>
                          <Badge
                            variant={statusConfig.variant}
                            className="text-xs"
                          >
                            {statusConfig.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {action.targetModule}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {action.targetEntityType}
                          {action.targetEntityId &&
                            ` (${action.targetEntityId.slice(0, 8)}...)`}
                        </p>
                        {action.error && (
                          <p className="text-xs text-rose-500 mt-1">
                            Erro: {action.error}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(action.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
