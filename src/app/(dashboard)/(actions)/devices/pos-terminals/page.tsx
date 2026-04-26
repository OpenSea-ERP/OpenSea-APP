'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { GridLoading } from '@/components/handlers/grid-loading';
import { GridError } from '@/components/handlers/grid-error';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import {
  usePosTerminals,
  useCreatePosTerminal,
  useUpdatePosTerminal,
  useDeletePosTerminal,
  usePairThisDevice,
  useUnpairDevice,
} from '@/hooks/sales';
import { useWarehouses } from '@/hooks/stock/use-warehouses';
import type {
  PosTerminal,
  PosTerminalMode,
  CreatePosTerminalRequest,
} from '@/types/sales';
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Power,
  PowerOff,
  Smartphone,
  Link2,
  Link2Off,
  Monitor,
  ShoppingBag,
  Banknote,
  ScanLine,
  Check,
  Download,
  ShoppingCart,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react';
import { PairingCodeDisplay } from './_components/pairing-code-display';

const DEVICE_TOKEN_KEY = 'pos_device_token';

const MODE_CONFIG: Record<
  PosTerminalMode,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    badgeBg: string;
    badgeText: string;
    border: string;
  }
> = {
  SALES_ONLY: {
    label: 'Só Vendas',
    description: 'Vendedor lança o pedido e envia para o caixa cobrar.',
    icon: ShoppingBag,
    color: 'text-violet-600 dark:text-violet-300',
    badgeBg: 'bg-violet-50 dark:bg-violet-500/10',
    badgeText: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-500/30',
  },
  SALES_WITH_CHECKOUT: {
    label: 'Venda + Cobrança',
    description: 'Vendedor lança o pedido e também recebe o pagamento.',
    icon: Monitor,
    color: 'text-sky-600 dark:text-sky-300',
    badgeBg: 'bg-sky-50 dark:bg-sky-500/10',
    badgeText: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-500/30',
  },
  CASHIER: {
    label: 'Caixa',
    description: 'Caixa dedicado que recebe pedidos e cobra clientes.',
    icon: Banknote,
    color: 'text-emerald-600 dark:text-emerald-300',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-500/30',
  },
  TOTEM: {
    label: 'Autoatendimento',
    description: 'Quiosque de autoatendimento operado pelo cliente final.',
    icon: ScanLine,
    color: 'text-teal-600 dark:text-teal-300',
    badgeBg: 'bg-teal-50 dark:bg-teal-500/10',
    badgeText: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200 dark:border-teal-500/30',
  },
};

const MODE_OPTIONS: PosTerminalMode[] = [
  'SALES_ONLY',
  'SALES_WITH_CHECKOUT',
  'CASHIER',
  'TOTEM',
];

interface CreateState {
  terminalName: string;
  mode: PosTerminalMode;
  warehouseIds: string[];
  acceptsPendingOrders: boolean;
}

const INITIAL_CREATE_STATE: CreateState = {
  terminalName: '',
  mode: 'SALES_WITH_CHECKOUT',
  warehouseIds: [],
  acceptsPendingOrders: true,
};

function detectDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Dispositivo PDV';
  const ua = navigator.userAgent;
  if (/iPad/i.test(ua)) return 'iPad';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac/i.test(ua)) return 'Mac';
  return 'Dispositivo PDV';
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return 'Nunca conectou';
  try {
    return formatDistanceToNow(new Date(iso), {
      addSuffix: true,
      locale: ptBR,
    });
  } catch {
    return 'Há instantes';
  }
}

export default function PosTerminalsPage() {
  const { hasPermission } = usePermissions();
  const canRegister = hasPermission('sales.pos.terminals.register');
  const canModify = hasPermission('sales.pos.terminals.modify');
  const canRemove = hasPermission('sales.pos.terminals.remove');

  const { data, isLoading, error } = usePosTerminals();
  const { data: warehouses } = useWarehouses();

  const createTerminal = useCreatePosTerminal();
  const updateTerminal = useUpdatePosTerminal();
  const deleteTerminal = useDeletePosTerminal();
  const pairThisDevice = usePairThisDevice();
  const unpairDevice = useUnpairDevice();

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [createState, setCreateState] =
    useState<CreateState>(INITIAL_CREATE_STATE);

  // Destructive action modals
  const [deleteTarget, setDeleteTarget] = useState<PosTerminal | null>(null);
  const [unpairTarget, setUnpairTarget] = useState<PosTerminal | null>(null);

  // Device-already-paired state (to hide "Pair this device" button)
  const [hasLocalDeviceToken, setHasLocalDeviceToken] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasLocalDeviceToken(!!window.localStorage.getItem(DEVICE_TOKEN_KEY));
    }
  }, []);

  function resetWizard() {
    setWizardStep(1);
    setCreateState(INITIAL_CREATE_STATE);
  }

  function closeWizard() {
    setIsWizardOpen(false);
    resetWizard();
  }

  async function handleCreateConfirm() {
    const payload: CreatePosTerminalRequest = {
      terminalName: createState.terminalName.trim(),
      mode: createState.mode,
      acceptsPendingOrders: createState.acceptsPendingOrders,
      warehouseIds:
        createState.warehouseIds.length > 0
          ? createState.warehouseIds
          : undefined,
    };
    await createTerminal.mutateAsync(payload);
    closeWizard();
  }

  async function handleToggleActive(terminal: PosTerminal) {
    await updateTerminal.mutateAsync({
      id: terminal.id,
      data: { isActive: !terminal.isActive },
    });
  }

  async function handlePairThisDevice(terminal: PosTerminal) {
    await pairThisDevice.mutateAsync({
      terminalId: terminal.id,
      deviceLabel: detectDeviceLabel(),
    });
    setHasLocalDeviceToken(true);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    await deleteTerminal.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  async function handleConfirmUnpair() {
    if (!unpairTarget) return;
    await unpairDevice.mutateAsync({ id: unpairTarget.id });
    setUnpairTarget(null);
  }

  const wizardSteps: WizardStep[] = useMemo(() => {
    const step1Valid = createState.terminalName.trim().length > 0;

    return [
      {
        title: 'Identificação',
        description: 'Defina o nome e o modo de operação do terminal.',
        icon: <Monitor className="h-12 w-12 text-violet-500" />,
        isValid: step1Valid,
        content: (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="terminal-name">Nome do terminal</Label>
              <Input
                id="terminal-name"
                placeholder="Ex.: Caixa 01, Tablet de Vendas"
                value={createState.terminalName}
                onChange={e =>
                  setCreateState(prev => ({
                    ...prev,
                    terminalName: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Modo de operação</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MODE_OPTIONS.map(mode => {
                  const cfg = MODE_CONFIG[mode];
                  const Icon = cfg.icon;
                  const isSelected = createState.mode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        setCreateState(prev => ({ ...prev, mode }))
                      }
                      className={cn(
                        'flex items-start gap-3 rounded-xl border p-3 text-left transition-all',
                        isSelected
                          ? `${cfg.badgeBg} ${cfg.border} ring-2 ring-offset-2 ring-offset-background`
                          : 'border-border bg-white dark:bg-slate-800/40 hover:border-primary/40',
                        isSelected && 'ring-violet-400/40'
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          cfg.badgeBg
                        )}
                      >
                        <Icon className={cn('h-5 w-5', cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{cfg.label}</p>
                          {isSelected && (
                            <Check className="h-4 w-4 text-violet-600" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {cfg.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Configurações',
        description: 'Associe armazéns e ajuste comportamentos.',
        icon: <Smartphone className="h-12 w-12 text-violet-500" />,
        isValid: true,
        footer: (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setWizardStep(1)}
            >
              ← Voltar
            </Button>
            <Button
              type="button"
              onClick={handleCreateConfirm}
              disabled={createTerminal.isPending}
            >
              {createTerminal.isPending ? 'Criando...' : 'Criar Terminal'}
            </Button>
          </>
        ),
        content: (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Armazéns associados</Label>
              <p className="text-xs text-muted-foreground">
                Selecione os armazéns disponíveis neste terminal (opcional).
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
                {(warehouses ?? []).map(wh => {
                  const checked = createState.warehouseIds.includes(wh.id);
                  return (
                    <label
                      key={wh.id}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border p-2 cursor-pointer text-sm transition-colors',
                        checked
                          ? 'bg-violet-50 border-violet-300 dark:bg-violet-500/10 dark:border-violet-500/40'
                          : 'border-border hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setCreateState(prev => ({
                            ...prev,
                            warehouseIds: checked
                              ? prev.warehouseIds.filter(id => id !== wh.id)
                              : [...prev.warehouseIds, wh.id],
                          }))
                        }
                        className="h-4 w-4"
                      />
                      <span className="font-medium">{wh.name}</span>
                    </label>
                  );
                })}
                {(!warehouses || warehouses.length === 0) && (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhum armazém cadastrado.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pedidos pendentes</Label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={createState.acceptsPendingOrders}
                  onChange={e =>
                    setCreateState(prev => ({
                      ...prev,
                      acceptsPendingOrders: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                <span>Aceitar pedidos pendentes neste terminal</span>
              </label>
            </div>
          </div>
        ),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createState, warehouses, createTerminal.isPending]);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Dispositivos', href: '/devices' },
            { label: 'Terminais POS' },
          ]}
          actions={
            canRegister ? (
              <Button size="sm" onClick={() => setIsWizardOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Terminal
              </Button>
            ) : undefined
          }
        />
      </PageHeader>

      <PageBody spacing="gap-6">
        {/* Hero Banner */}
        <PageHeroBanner
          title="Terminais POS"
          description="Gerencie terminais de PDV, modos de operação e pareamento de dispositivos. Cada terminal representa uma máquina ou tablet rodando o OpenSea Emporion."
          icon={ShoppingCart}
          iconGradient="from-violet-500 to-indigo-600"
          buttons={[
            {
              id: 'download-emporion',
              label: 'Download Emporion',
              icon: Download,
              href: '/downloads/emporion',
              gradient: 'from-violet-500 to-indigo-600',
            },
          ]}
          hasPermission={hasPermission}
        />

        {/* Terminals Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Terminais cadastrados
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cada terminal precisa ser pareado com uma máquina rodando o
              Emporion antes de receber vendas.
            </p>
          </div>

          {isLoading ? (
            <GridLoading />
          ) : error ? (
            <GridError />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.data.map(terminal => {
                const cfg = MODE_CONFIG[terminal.mode];
                const ModeIcon = cfg.icon;
                const isUnpaired = !terminal.hasPairing;
                const isOnline = !!terminal.isOnline;
                const pairing = terminal.pairing ?? null;

                return (
                  <Card
                    key={terminal.id}
                    className={cn(
                      'group relative overflow-hidden border bg-white dark:bg-slate-800/60 p-5 transition-all hover:shadow-md',
                      cfg.border
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl',
                          cfg.badgeBg
                        )}
                      >
                        <ModeIcon className={cn('h-6 w-6', cfg.color)} />
                      </div>
                      {(canModify || canRemove) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            {canModify && (
                              <DropdownMenuItem disabled>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {canModify && terminal.hasPairing && (
                              <DropdownMenuItem
                                onClick={() => setUnpairTarget(terminal)}
                              >
                                <Link2Off className="mr-2 h-4 w-4" />
                                Revogar pareamento
                              </DropdownMenuItem>
                            )}
                            {canModify && (
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(terminal)}
                              >
                                {terminal.isActive ? (
                                  <>
                                    <PowerOff className="mr-2 h-4 w-4" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <Power className="mr-2 h-4 w-4" />
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            {canRemove && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-rose-600 focus:text-rose-600"
                                  onClick={() => setDeleteTarget(terminal)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg mb-1 truncate">
                      {terminal.terminalName}
                    </h3>

                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <code className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                        {terminal.terminalCode}
                      </code>
                      <Badge
                        className={cn('border-0', cfg.badgeBg, cfg.badgeText)}
                      >
                        {cfg.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {terminal.hasPairing ? (
                        <Badge className="border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          <Link2 className="mr-1 h-3 w-3" />
                          Pareado
                        </Badge>
                      ) : (
                        <Badge className="border-0 bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300">
                          <Link2Off className="mr-1 h-3 w-3" />
                          Não pareado
                        </Badge>
                      )}
                      {terminal.isActive ? (
                        <Badge className="border-0 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge className="border-0 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                          Inativo
                        </Badge>
                      )}
                      {terminal.hasPairing &&
                        (isOnline ? (
                          <Badge className="border-0 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300">
                            <Wifi className="mr-1 h-3 w-3" />
                            Online
                          </Badge>
                        ) : (
                          <Badge className="border-0 bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400">
                            <WifiOff className="mr-1 h-3 w-3" />
                            Offline
                          </Badge>
                        ))}
                    </div>

                    {pairing && (
                      <div className="space-y-1.5 mb-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Smartphone className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {pairing.deviceLabel}
                          </span>
                          {pairing.appVersion && (
                            <span className="font-mono">
                              v{pairing.appVersion}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>
                            {pairing.lastSeenAt
                              ? `Visto ${formatRelative(pairing.lastSeenAt)}`
                              : 'Nunca conectou'}
                          </span>
                        </div>
                      </div>
                    )}

                    {isUnpaired && terminal.isActive && (
                      <div className="space-y-3 pt-3 border-t border-border">
                        <PairingCodeDisplay terminalId={terminal.id} />
                        {!hasLocalDeviceToken && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => handlePairThisDevice(terminal)}
                            disabled={pairThisDevice.isPending}
                          >
                            <Smartphone className="mr-2 h-4 w-4" />
                            {pairThisDevice.isPending
                              ? 'Pareando...'
                              : 'Parear Este Dispositivo'}
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}

              {data?.data.length === 0 && (
                <Card className="col-span-full flex flex-col items-center justify-center p-12 border-dashed">
                  <Monitor className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-lg mb-1">
                    Nenhum terminal cadastrado
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie seu primeiro terminal para começar a vender com o
                    Emporion.
                  </p>
                  {canRegister && (
                    <Button onClick={() => setIsWizardOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Terminal
                    </Button>
                  )}
                </Card>
              )}
            </div>
          )}
        </section>
      </PageBody>

      {/* Wizard de criação */}
      <StepWizardDialog
        open={isWizardOpen}
        onOpenChange={open => {
          if (!open) closeWizard();
        }}
        steps={wizardSteps}
        currentStep={wizardStep}
        onStepChange={setWizardStep}
        onClose={closeWizard}
      />

      {/* PIN: Excluir terminal */}
      <VerifyActionPinModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={handleConfirmDelete}
        title="Confirmar exclusão"
        description={`Digite seu PIN de ação para excluir o terminal "${deleteTarget?.terminalName ?? ''}".`}
      />

      {/* PIN: Revogar pareamento */}
      <VerifyActionPinModal
        isOpen={!!unpairTarget}
        onClose={() => setUnpairTarget(null)}
        onSuccess={handleConfirmUnpair}
        title="Revogar pareamento"
        description={`Digite seu PIN de ação para revogar o pareamento de "${unpairTarget?.terminalName ?? ''}".`}
      />
    </PageLayout>
  );
}
