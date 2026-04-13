/**
 * Remote Prints Management Page
 * Gerenciamento de impressoras remotas e agentes de impressão
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { useRemotePrinters } from '@/core/print-queue/hooks/use-remote-printers';
import { printAgentsService } from '@/services/sales/print-agents.service';
import type { PrintAgent, AgentStatus, PrinterStatus } from '@/types/sales';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { RemotePrinter } from '@/types/sales';
import {
  AlertTriangle,
  ChevronDown,
  CircleDot,
  Copy,
  Download,
  Eye,
  EyeOff,
  Link2Off,
  MonitorSmartphone,
  MoreVertical,
  Plus,
  Printer,
  QrCode,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

const MAX_AGENT_NAME_LENGTH = 30;

const AGENT_STATUS_CONFIG: Record<
  AgentStatus,
  { color: string; dotColor: string; label: string; icon: React.ElementType }
> = {
  ONLINE: {
    color:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20',
    dotColor: 'bg-green-500',
    label: 'Online',
    icon: Wifi,
  },
  OFFLINE: {
    color:
      'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20',
    dotColor: 'bg-gray-400',
    label: 'Offline',
    icon: WifiOff,
  },
  ERROR: {
    color:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20',
    dotColor: 'bg-rose-500',
    label: 'Erro',
    icon: AlertTriangle,
  },
};

const PRINTER_STATUS_DOT: Record<PrinterStatus | 'SERVER_OFFLINE', string> = {
  ONLINE: 'bg-green-500',
  OFFLINE: 'bg-gray-400',
  BUSY: 'bg-amber-500',
  ERROR: 'bg-rose-500',
  UNKNOWN: 'bg-gray-300',
  SERVER_OFFLINE: 'bg-orange-400',
};

type PrinterFilterMode =
  | 'show_all'
  | 'hide_all'
  | 'hide_offline'
  | 'show_online'
  | 'show_hidden';

const FILTER_OPTIONS: { value: PrinterFilterMode; label: string }[] = [
  { value: 'show_all', label: 'Exibir todas' },
  { value: 'show_online', label: 'Exibir todas online' },
  { value: 'hide_offline', label: 'Ocultar as que estão offline' },
  { value: 'hide_all', label: 'Ocultar todas' },
  { value: 'show_hidden', label: 'Ver ocultas' },
];

function getPrinterEffectiveStatus(
  printer: RemotePrinter,
  agents: PrintAgent[]
): PrinterStatus | 'SERVER_OFFLINE' {
  if (printer.status === 'ONLINE') return 'ONLINE';
  if (printer.agentId) {
    const agent = agents.find(a => a.id === printer.agentId);
    if (agent && agent.status === 'OFFLINE') return 'SERVER_OFFLINE';
  }
  return printer.status;
}

function getPrinterStatusLabel(
  status: PrinterStatus | 'SERVER_OFFLINE'
): string {
  switch (status) {
    case 'ONLINE':
      return 'Online';
    case 'SERVER_OFFLINE':
      return 'Servidor Offline';
    case 'BUSY':
      return 'Ocupada';
    case 'ERROR':
      return 'Erro';
    default:
      return 'Offline';
  }
}

function getPrinterStatusStyle(
  status: PrinterStatus | 'SERVER_OFFLINE'
): string {
  switch (status) {
    case 'ONLINE':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20';
    case 'SERVER_OFFLINE':
      return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/20';
    case 'BUSY':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20';
    case 'ERROR':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20';
    default:
      return 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20';
  }
}

export default function RemotePrintsPage() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const canAdmin = hasPermission('sales.printing.admin');

  const [registerOpen, setRegisterOpen] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [agentName, setAgentName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [newAgentId, setNewAgentId] = useState<string | null>(null);

  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [unpairAgentId, setUnpairAgentId] = useState<string | null>(null);
  const [pairingAgentId, setPairingAgentId] = useState<string | null>(null);

  const [filterMode, setFilterMode] = useState<PrinterFilterMode>('show_all');

  const {
    data: agentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['print-agents'],
    queryFn: async () => {
      const response = await printAgentsService.list();
      return response.agents;
    },
    refetchInterval: 30000,
  });

  const agents = agentsData ?? [];

  const { printers: allPrinters, isLoading: printersLoading } =
    useRemotePrinters();

  const filteredPrinters = useMemo(() => {
    switch (filterMode) {
      case 'show_all':
        return allPrinters.filter(p => !p.isHidden);
      case 'show_online':
        return allPrinters.filter(p => !p.isHidden && p.status === 'ONLINE');
      case 'hide_offline':
        return allPrinters.filter(p => !p.isHidden && p.status !== 'OFFLINE');
      case 'hide_all':
        return [];
      case 'show_hidden':
        return allPrinters.filter(p => p.isHidden);
      default:
        return allPrinters.filter(p => !p.isHidden);
    }
  }, [allPrinters, filterMode]);

  const totalCount = allPrinters.length;

  const handleToggleHidden = useCallback(
    async (printer: RemotePrinter) => {
      try {
        await printAgentsService.togglePrinterHidden(
          printer.id,
          !printer.isHidden
        );
        queryClient.invalidateQueries({ queryKey: ['remote-printers'] });
        toast.success(
          printer.isHidden
            ? `"${printer.name}" agora está visível`
            : `"${printer.name}" foi ocultada`
        );
      } catch {
        toast.error('Erro ao alterar visibilidade');
      }
    },
    [queryClient]
  );

  const handleSetDefault = useCallback(
    async (printer: RemotePrinter) => {
      try {
        await printAgentsService.setDefaultPrinter(printer.id);
        queryClient.invalidateQueries({ queryKey: ['remote-printers'] });
        toast.success(`"${printer.name}" definida como padrão`);
      } catch {
        toast.error('Erro ao definir impressora padrão');
      }
    },
    [queryClient]
  );

  const handleRegister = useCallback(async () => {
    if (!agentName.trim()) return;
    setIsRegistering(true);
    try {
      const result = await printAgentsService.register(
        agentName.trim().slice(0, MAX_AGENT_NAME_LENGTH)
      );
      setNewAgentId(result.agentId);
      setRegisterStep(2);
      queryClient.invalidateQueries({ queryKey: ['print-agents'] });
    } catch {
      toast.error('Erro ao registrar agente');
    } finally {
      setIsRegistering(false);
    }
  }, [agentName, queryClient]);

  const handleDelete = useCallback(
    async (agentId: string) => {
      try {
        await printAgentsService.delete(agentId);
        queryClient.invalidateQueries({ queryKey: ['print-agents'] });
        queryClient.invalidateQueries({ queryKey: ['remote-printers'] });
        toast.success('Agente removido');
      } catch {
        toast.error('Erro ao remover agente');
      } finally {
        setDeleteAgentId(null);
      }
    },
    [queryClient]
  );

  const handleUnpair = useCallback(
    async (agentId: string) => {
      try {
        await printAgentsService.unpair(agentId);
        queryClient.invalidateQueries({ queryKey: ['print-agents'] });
        queryClient.invalidateQueries({ queryKey: ['remote-printers'] });
        toast.success('Agente desvinculado');
      } catch {
        toast.error('Erro ao desvincular agente');
      } finally {
        setUnpairAgentId(null);
      }
    },
    [queryClient]
  );

  const closeRegisterDialog = () => {
    setRegisterOpen(false);
    setRegisterStep(1);
    setAgentName('');
    setNewAgentId(null);
    setIsRegistering(false);
  };

  const registerSteps: WizardStep[] = [
    {
      title: 'Nome do Computador',
      description: 'Identifique o computador que executará o Print Server',
      icon: (
        <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
          <MonitorSmartphone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
      ),
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Nome do computador</Label>
            <Input
              id="agent-name"
              placeholder="Ex: Computador do Estoque"
              value={agentName}
              onChange={e =>
                setAgentName(e.target.value.slice(0, MAX_AGENT_NAME_LENGTH))
              }
              maxLength={MAX_AGENT_NAME_LENGTH}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Um nome descritivo para identificar o computador.
              </p>
              <span className="text-xs text-muted-foreground tabular-nums">
                {agentName.length}/{MAX_AGENT_NAME_LENGTH}
              </span>
            </div>
          </div>
        </div>
      ),
      isValid: agentName.trim().length > 0 && !isRegistering,
      footer: (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={closeRegisterDialog}>
            Cancelar
          </Button>
          <Button
            onClick={handleRegister}
            disabled={!agentName.trim() || isRegistering}
          >
            {isRegistering ? 'Registrando...' : 'Registrar'}
          </Button>
        </div>
      ),
    },
    {
      title: 'Código de Pareamento',
      description: 'Use o código abaixo para parear o Print Server',
      icon: (
        <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
          <QrCode className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
      ),
      content: newAgentId ? (
        <PairingCodeDisplay agentId={newAgentId} />
      ) : (
        <div className="text-center text-muted-foreground py-4">
          Registrando agente...
        </div>
      ),
      isValid: true,
      footer: (
        <div className="flex justify-end">
          <Button onClick={closeRegisterDialog}>Concluir</Button>
        </div>
      ),
    },
  ];

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Dispositivos', href: '/devices' },
            { label: 'Impressoras Remotas' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Link href="/print/studio">
                <Button variant="outline" size="sm" className="h-9 px-2.5">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Studio
                </Button>
              </Link>
              {canAdmin && (
                <Button
                  size="sm"
                  className="h-9 px-2.5"
                  onClick={() => setRegisterOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Criar Computador
                </Button>
              )}
            </div>
          }
        />
      </PageHeader>

      <PageBody spacing="gap-6">
        {/* Hero Banner */}
        <PageHeroBanner
          title="Impressoras Remotas"
          description="Gerencie impressoras conectadas e envie impressões de qualquer dispositivo"
          icon={Printer}
          iconGradient="from-blue-500 to-indigo-600"
          buttons={[
            {
              id: 'download-print-server',
              label: 'Download Print Server',
              icon: Download,
              href: '/downloads/print-server',
              gradient: 'from-blue-500 to-indigo-600',
            },
          ]}
          hasPermission={hasPermission}
        />

        {/* Connected Printers Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Impressoras Conectadas
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Impressoras disponíveis nos computadores pareados
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs shrink-0"
                >
                  <span>
                    Exibindo {filteredPrinters.length}/{totalCount} impressoras
                  </span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {FILTER_OPTIONS.map(option => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setFilterMode(option.value)}
                    className={cn(filterMode === option.value && 'bg-accent')}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {printersLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={i}
                  className="bg-white dark:bg-slate-800/60 border border-border p-4 animate-pulse"
                >
                  <div className="h-10" />
                </Card>
              ))}
            </div>
          ) : filteredPrinters.length === 0 ? (
            <Card className="bg-white dark:bg-slate-800/60 border border-border p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                <Printer className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {filterMode === 'show_hidden'
                  ? 'Nenhuma impressora oculta'
                  : filterMode === 'hide_all'
                    ? 'Todas as impressoras estão ocultas'
                    : 'Nenhuma impressora detectada'}
              </p>
              <p className="text-xs text-muted-foreground">
                {filterMode === 'show_hidden' || filterMode === 'hide_all'
                  ? 'Altere o filtro para ver as impressoras disponíveis.'
                  : 'Conecte um computador com Print Server pareado para ver as impressoras.'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPrinters.map(printer => {
                const effectiveStatus = getPrinterEffectiveStatus(
                  printer,
                  agents
                );
                return (
                  <Card
                    key={printer.id}
                    className={cn(
                      'bg-white dark:bg-slate-800/60 border border-border p-4',
                      printer.isHidden && 'opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'w-3 h-3 rounded-full shrink-0',
                          PRINTER_STATUS_DOT[effectiveStatus] ?? 'bg-gray-300'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {printer.name}
                          </p>
                          {printer.isDefault && (
                            <Badge
                              variant="outline"
                              className="text-[10px] shrink-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20"
                            >
                              Padrão
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {printer.agentName ?? 'Computador desconhecido'}
                          {printer.osName ? ` · ${printer.osName}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-medium border',
                            getPrinterStatusStyle(effectiveStatus)
                          )}
                        >
                          {getPrinterStatusLabel(effectiveStatus)}
                        </Badge>
                        {canAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-400" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleSetDefault(printer)}
                                disabled={printer.isDefault}
                                className={cn(
                                  printer.isDefault && 'opacity-50'
                                )}
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Tornar Padrão
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleToggleHidden(printer)}
                              >
                                {printer.isHidden ? (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Reexibir
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Ocultar
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Agents Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Computadores (Agentes)
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Computadores registrados para receber comandos de impressão
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={i}
                  className="p-5 bg-white dark:bg-slate-800/60 border border-border animate-pulse"
                >
                  <div className="h-16" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="p-8 bg-white dark:bg-slate-800/60 border border-border text-center">
              <p className="text-sm text-muted-foreground">
                Erro ao carregar agentes
              </p>
            </Card>
          ) : agents.length === 0 ? (
            <Card className="p-12 bg-white dark:bg-slate-800/60 border border-border text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                <MonitorSmartphone className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Nenhum agente registrado
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Registre um computador para começar a imprimir remotamente.
              </p>
              {canAdmin && (
                <Button onClick={() => setRegisterOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Criar Computador
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-4">
              {agents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  canAdmin={canAdmin}
                  onDelete={() => setDeleteAgentId(agent.id)}
                  onUnpair={() => setUnpairAgentId(agent.id)}
                  onShowCode={() => setPairingAgentId(agent.id)}
                />
              ))}
            </div>
          )}
        </section>
      </PageBody>

      {/* Register Agent Dialog */}
      <StepWizardDialog
        open={registerOpen}
        onOpenChange={open => {
          if (!open) closeRegisterDialog();
        }}
        steps={registerSteps}
        currentStep={registerStep}
        onStepChange={setRegisterStep}
        onClose={closeRegisterDialog}
      />

      {/* Delete Confirmation */}
      {deleteAgentId && (
        <VerifyActionPinModal
          isOpen={!!deleteAgentId}
          onClose={() => setDeleteAgentId(null)}
          onSuccess={() => handleDelete(deleteAgentId)}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir este agente de impressão."
        />
      )}

      {/* Unpair Confirmation */}
      {unpairAgentId && (
        <VerifyActionPinModal
          isOpen={!!unpairAgentId}
          onClose={() => setUnpairAgentId(null)}
          onSuccess={() => handleUnpair(unpairAgentId)}
          title="Confirmar Desvinculação"
          description="Digite seu PIN de ação para desvincular este dispositivo. O agente precisará ser pareado novamente."
        />
      )}

      {/* Pairing Code Dialog */}
      {pairingAgentId && (
        <PairingCodeDialog
          agentId={pairingAgentId}
          open={!!pairingAgentId}
          onOpenChange={open => {
            if (!open) setPairingAgentId(null);
          }}
        />
      )}
    </PageLayout>
  );
}

// ============================================
// Agent Card Component
// ============================================

interface AgentCardProps {
  agent: PrintAgent;
  canAdmin: boolean;
  onDelete: () => void;
  onUnpair: () => void;
  onShowCode: () => void;
}

function AgentCard({
  agent,
  canAdmin,
  onDelete,
  onUnpair,
  onShowCode,
}: AgentCardProps) {
  const config = AGENT_STATUS_CONFIG[agent.status];
  const StatusIcon = config.icon;

  const lastSeen = agent.lastSeenAt
    ? formatDistanceToNow(new Date(agent.lastSeenAt), {
        addSuffix: true,
        locale: ptBR,
      })
    : 'Nunca visto';

  const pairedDate = agent.pairedAt
    ? format(new Date(agent.pairedAt), "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR,
      })
    : null;

  const displayName =
    agent.name.length > MAX_AGENT_NAME_LENGTH
      ? agent.name.slice(0, MAX_AGENT_NAME_LENGTH) + '…'
      : agent.name;

  return (
    <Card className="p-4 sm:p-5 bg-white dark:bg-slate-800/60 border border-border">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0 sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          {/* Status Icon */}
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              agent.status === 'ONLINE'
                ? 'bg-green-100 dark:bg-green-500/10'
                : agent.status === 'ERROR'
                  ? 'bg-rose-100 dark:bg-rose-500/10'
                  : 'bg-gray-100 dark:bg-gray-500/10'
            )}
          >
            <StatusIcon
              className={cn(
                'w-5 h-5',
                agent.status === 'ONLINE'
                  ? 'text-green-600 dark:text-green-400'
                  : agent.status === 'ERROR'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-gray-500 dark:text-gray-400'
              )}
            />
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]"
                title={agent.name}
              >
                {displayName}
              </h3>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0',
                  config.color
                )}
              >
                <span
                  className={cn('w-1.5 h-1.5 rounded-full', config.dotColor)}
                />
                {config.label}
              </span>
              {agent.isPaired ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20 shrink-0">
                  <Shield className="w-2.5 h-2.5" />
                  Pareado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 shrink-0">
                  Aguardando pareamento
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              {agent.deviceLabel && (
                <span className="flex items-center gap-1">
                  <MonitorSmartphone className="w-3 h-3" />
                  {agent.deviceLabel}
                </span>
              )}
              {agent.hostname && !agent.deviceLabel && (
                <span className="flex items-center gap-1">
                  <MonitorSmartphone className="w-3 h-3" />
                  {agent.hostname}
                </span>
              )}
              {agent.ipAddress && (
                <span className="flex items-center gap-1">
                  <CircleDot className="w-3 h-3" />
                  {agent.ipAddress}
                </span>
              )}
              <span>
                {agent.printerCount} impressora
                {agent.printerCount !== 1 ? 's' : ''}
              </span>
              {agent.version && <span>v{agent.version}</span>}
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <span>Visto {lastSeen}</span>
              {pairedDate && <span>Pareado em {pairedDate}</span>}
            </div>
          </div>
        </div>

        {/* Actions */}
        {canAdmin && (
          <div className="flex items-center gap-1 shrink-0 self-start sm:self-auto">
            {agent.isPaired ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={onUnpair}
              >
                <Link2Off className="w-3 h-3 mr-1" />
                Desvincular
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={onShowCode}
              >
                <QrCode className="w-3 h-3 mr-1" />
                Exibir Código
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              onClick={onDelete}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Excluir
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================
// Pairing Code Dialog
// ============================================

interface PairingCodeDialogProps {
  agentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PairingCodeDialog({
  agentId,
  open,
  onOpenChange,
}: PairingCodeDialogProps) {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCode = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await printAgentsService.getPairingCode(agentId);
      setCode(result.code);
      setExpiresAt(result.expiresAt);
    } catch {
      toast.error('Erro ao obter código de pareamento');
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (!open) return;
    fetchCode();
    const refreshInterval = setInterval(fetchCode, 55000);
    return () => clearInterval(refreshInterval);
  }, [open, fetchCode]);

  useEffect(() => {
    if (!expiresAt) return;

    const updateCountdown = () => {
      const now = Date.now();
      const expires = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setSecondsLeft(diff);

      if (diff === 0) {
        fetchCode();
      }
    };

    updateCountdown();
    intervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [expiresAt, fetchCode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Código de Pareamento</DialogTitle>
          <DialogDescription>
            O operador deve digitar este código no Print Server do computador
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-6">
          {isLoading && !code ? (
            <div className="h-16 flex items-center">
              <p className="text-muted-foreground">Gerando código...</p>
            </div>
          ) : code ? (
            <>
              <button
                type="button"
                className="group px-8 py-4 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer relative"
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  toast.success('Código copiado para a área de transferência');
                }}
              >
                <span className="text-4xl font-mono font-bold tracking-[0.3em] text-gray-900 dark:text-white select-all">
                  {code}
                </span>
                <Copy className="w-4 h-4 absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    secondsLeft > 30
                      ? 'bg-green-500'
                      : secondsLeft > 10
                        ? 'bg-amber-500'
                        : 'bg-rose-500 animate-pulse'
                  )}
                />
                <span>
                  Expira em{' '}
                  <span className="font-medium tabular-nums">
                    {secondsLeft}s
                  </span>
                </span>
              </div>

              <p className="text-xs text-center text-muted-foreground max-w-xs">
                O código é renovado automaticamente. Inicie o Print Server no
                computador e digite este código quando solicitado.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Erro ao gerar código. Feche e tente novamente.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Inline Pairing Code Display (for wizard step 2)
// ============================================

function PairingCodeDisplay({ agentId }: { agentId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCode = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await printAgentsService.getPairingCode(agentId);
      setCode(result.code);
      setExpiresAt(result.expiresAt);
    } catch {
      // silently retry
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchCode();
    const refreshInterval = setInterval(fetchCode, 55000);
    return () => clearInterval(refreshInterval);
  }, [fetchCode]);

  useEffect(() => {
    if (!expiresAt) return;

    const updateCountdown = () => {
      const now = Date.now();
      const expires = new Date(expiresAt).getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setSecondsLeft(diff);

      if (diff === 0) {
        fetchCode();
      }
    };

    updateCountdown();
    intervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [expiresAt, fetchCode]);

  if (isLoading && !code) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Gerando código de pareamento...
      </div>
    );
  }

  if (!code) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Erro ao gerar código. Feche e tente novamente.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20">
        <div className="flex items-start gap-2">
          <QrCode className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
          <p className="text-sm text-violet-800 dark:text-violet-300">
            Inicie o Print Server no computador e digite este código quando
            solicitado.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 py-2">
        <button
          type="button"
          className="group px-8 py-4 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer relative"
          onClick={() => {
            navigator.clipboard.writeText(code);
            toast.success('Código copiado para a área de transferência');
          }}
        >
          <span className="text-4xl font-mono font-bold tracking-[0.3em] text-gray-900 dark:text-white select-all">
            {code}
          </span>
          <Copy className="w-4 h-4 absolute top-2 right-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              secondsLeft > 30
                ? 'bg-green-500'
                : secondsLeft > 10
                  ? 'bg-amber-500'
                  : 'bg-rose-500 animate-pulse'
            )}
          />
          <span>
            Expira em{' '}
            <span className="font-medium tabular-nums">{secondsLeft}s</span>
          </span>
        </div>
      </div>
    </div>
  );
}
