'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PluggyConnect } from '@/components/finance/pluggy-connect';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { useBankAccounts } from '@/hooks/finance/use-bank-accounts';
import { usePermissions } from '@/hooks/use-permissions';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { bankConnectionsService } from '@/services/finance';
import type { BankConnectionStatus } from '@/types/finance';
import {
  Building2,
  Landmark,
  Loader2,
  RefreshCw,
  Unplug,
  Wifi,
  WifiOff,
  AlertTriangle,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================================================
// STATUS HELPERS
// ============================================================================

const statusConfig: Record<
  BankConnectionStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  ACTIVE: {
    label: 'Conectado',
    color:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
    icon: Wifi,
  },
  EXPIRED: {
    label: 'Expirado',
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
    icon: AlertTriangle,
  },
  ERROR: {
    label: 'Erro',
    color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300',
    icon: WifiOff,
  },
  REVOKED: {
    label: 'Desconectado',
    color: 'bg-slate-50 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300',
    icon: Unplug,
  },
};

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'Nunca sincronizado';
  return new Date(dateStr).toLocaleString('pt-BR');
}

// ============================================================================
// PAGE
// ============================================================================

export default function BankConnectionsPage() {
  const { hasPermission } = usePermissions();
  const canAdmin = hasPermission(FINANCE_PERMISSIONS.BANK_ACCOUNTS.ADMIN);
  const queryClient = useQueryClient();

  const [selectedBankAccountId, setSelectedBankAccountId] =
    useState<string>('');
  const [disconnectId, setDisconnectId] = useState<string | null>(null);

  // Fetch bank accounts for the selector
  const { data: bankAccountsData } = useBankAccounts();
  const bankAccounts = bankAccountsData?.bankAccounts ?? [];

  // Fetch connections from the real API
  const {
    data: connectionsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bank-connections'],
    queryFn: async () => {
      const response = await bankConnectionsService.list();
      return response.data;
    },
  });

  const connections = connectionsData ?? [];

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: (connectionId: string) =>
      bankConnectionsService.sync(connectionId),
    onSuccess: result => {
      toast.success(
        `Sincronização concluída: ${result.transactionsImported} transações importadas, ${result.matchedCount} conciliadas`
      );
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
    },
    onError: () => {
      toast.error('Erro ao sincronizar transações');
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: (connectionId: string) =>
      bankConnectionsService.disconnect(connectionId),
    onSuccess: () => {
      toast.success('Conexão bancária revogada');
      queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
    },
    onError: () => {
      toast.error('Erro ao desconectar banco');
    },
  });

  // Pluggy widget success callback
  const handlePluggySuccess = useCallback(
    async (itemId: string) => {
      if (!selectedBankAccountId) {
        toast.error('Selecione uma conta bancária primeiro');
        return;
      }

      try {
        await bankConnectionsService.connect(selectedBankAccountId, itemId);
        toast.success('Banco conectado com sucesso');
        queryClient.invalidateQueries({ queryKey: ['bank-connections'] });
      } catch {
        toast.error('Erro ao salvar conexão');
      }
    },
    [selectedBankAccountId, queryClient]
  );

  const handleDisconnectConfirm = useCallback(() => {
    if (disconnectId) {
      disconnectMutation.mutate(disconnectId);
      setDisconnectId(null);
    }
  }, [disconnectId, disconnectMutation]);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Conexões Bancárias' },
          ]}
          actions={
            canAdmin ? (
              <div className="flex items-center gap-3">
                <Select
                  value={selectedBankAccountId}
                  onValueChange={setSelectedBankAccountId}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Selecionar conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <PluggyConnect
                  onSuccess={handlePluggySuccess}
                  onError={msg => toast.error(msg)}
                />
              </div>
            ) : undefined
          }
        />
      </PageHeader>

      <PageBody>
        <Header
          title="Conexões Bancárias"
          description="Conecte suas contas bancárias via Open Finance para sincronização automática de transações"
        />

        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError message="Erro ao carregar conexões" />
        ) : connections.length === 0 ? (
          <Card className="p-12 text-center">
            <Landmark className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Nenhuma conexão bancária
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Conecte suas contas bancárias via Open Finance para importar
              transações automaticamente e facilitar a conciliação bancária.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map(connection => {
              const status = statusConfig[connection.status];
              const StatusIcon = status.icon;

              return (
                <Card key={connection.id} className="p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-500/8">
                        <Building2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {connection.provider}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {connection.bankAccountId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>
                      Última sincronização:{' '}
                      {formatDateTime(connection.lastSyncAt)}
                    </p>
                    <p>
                      Conectado em:{' '}
                      {new Date(connection.createdAt).toLocaleDateString(
                        'pt-BR'
                      )}
                    </p>
                  </div>

                  {canAdmin && connection.status === 'ACTIVE' && (
                    <div className="flex gap-2 mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => syncMutation.mutate(connection.id)}
                        disabled={syncMutation.isPending}
                      >
                        {syncMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                        Sincronizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/8"
                        onClick={() => setDisconnectId(connection.id)}
                      >
                        <Unplug className="h-3.5 w-3.5" />
                        Desconectar
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </PageBody>

      <VerifyActionPinModal
        isOpen={!!disconnectId}
        onClose={() => setDisconnectId(null)}
        onSuccess={handleDisconnectConfirm}
        title="Confirmar Desconexão"
        description="Digite seu PIN de ação para desconectar esta conta bancária. A sincronização automática será interrompida."
      />
    </PageLayout>
  );
}
