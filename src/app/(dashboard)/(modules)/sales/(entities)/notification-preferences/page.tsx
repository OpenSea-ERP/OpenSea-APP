'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Bell,
  BellRing,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Mail,
  MessageSquare,
  Package,
  RefreshCw,
  Save,
  ShoppingCart,
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  useNotificationPreferences,
  useCreateNotificationPreference,
  useUpdateNotificationPreference,
} from '@/hooks/sales/use-sales-other';
import { useAuth } from '@/contexts/auth-context';
import type { NotificationPreference } from '@/types/sales';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

interface NotificationCategory {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  types: NotificationType[];
}

interface NotificationType {
  id: string;
  label: string;
  description: string;
}

interface ChannelDef {
  id: string;
  label: string;
  icon: React.ElementType;
}

const CHANNELS: ChannelDef[] = [
  { id: 'email', label: 'E-mail', icon: Mail },
  { id: 'push', label: 'Push', icon: BellRing },
  { id: 'sms', label: 'SMS', icon: Smartphone },
];

const CATEGORIES: NotificationCategory[] = [
  {
    id: 'orders',
    title: 'Pedidos',
    subtitle:
      'Notificações sobre criação, atualização e finalização de pedidos',
    icon: ShoppingCart,
    iconColor: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    types: [
      {
        id: 'new_order',
        label: 'Novo pedido',
        description: 'Quando um novo pedido for criado',
      },
      {
        id: 'order_confirmed',
        label: 'Pedido confirmado',
        description: 'Quando um pedido for confirmado',
      },
      {
        id: 'order_cancelled',
        label: 'Pedido cancelado',
        description: 'Quando um pedido for cancelado',
      },
      {
        id: 'order_completed',
        label: 'Pedido finalizado',
        description: 'Quando um pedido for finalizado com sucesso',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Pagamentos',
    subtitle: 'Atualizações sobre recebimentos e inadimplencia',
    icon: CreditCard,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    types: [
      {
        id: 'payment_received',
        label: 'Pagamento recebido',
        description: 'Quando um pagamento for confirmado',
      },
      {
        id: 'payment_overdue',
        label: 'Pagamento em atraso',
        description: 'Quando um pagamento ultrapassar a data de vencimento',
      },
      {
        id: 'payment_refunded',
        label: 'Reembolso processado',
        description: 'Quando um reembolso for efetuado',
      },
    ],
  },
  {
    id: 'deals',
    title: 'Negócios',
    subtitle: 'Movimentações no pipeline de vendas',
    icon: TrendingUp,
    iconColor: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-50 dark:bg-sky-500/10',
    types: [
      {
        id: 'deal_stage_changed',
        label: 'Mudança de etapa',
        description: 'Quando um negócio mudar de etapa no pipeline',
      },
      {
        id: 'deal_won',
        label: 'Negócio ganho',
        description: 'Quando um negócio for marcado como ganho',
      },
      {
        id: 'deal_lost',
        label: 'Negócio perdido',
        description: 'Quando um negócio for marcado como perdido',
      },
      {
        id: 'deal_assigned',
        label: 'Negócio atribuído',
        description: 'Quando um negócio for atribuído a você',
      },
    ],
  },
  {
    id: 'stock',
    title: 'Estoque',
    subtitle: 'Alertas de estoque relacionados a vendas',
    icon: Package,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    types: [
      {
        id: 'stock_low',
        label: 'Estoque baixo',
        description:
          'Quando um produto vendido estiver com estoque abaixo do mínimo',
      },
      {
        id: 'stock_reserved',
        label: 'Reserva de estoque',
        description: 'Quando uma reserva de estoque for criada ou liberada',
      },
    ],
  },
  {
    id: 'comments',
    title: 'Comentários',
    subtitle: 'Notificações sobre comentários em pedidos e negócios',
    icon: MessageSquare,
    iconColor: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-50 dark:bg-teal-500/10',
    types: [
      {
        id: 'comment_added',
        label: 'Novo comentario',
        description: 'Quando alguem comentar em um pedido ou negócio seu',
      },
      {
        id: 'comment_reply',
        label: 'Resposta a comentario',
        description: 'Quando alguem responder a um comentario seu',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PreferenceMap = Record<string, Record<string, boolean>>;

function buildPreferenceMap(
  preferences: NotificationPreference[]
): PreferenceMap {
  const map: PreferenceMap = {};
  for (const pref of preferences) {
    if (!map[pref.notificationType]) {
      map[pref.notificationType] = {};
    }
    map[pref.notificationType][pref.channel] = pref.isEnabled;
  }
  return map;
}

function findPref(
  preferences: NotificationPreference[],
  notificationType: string,
  channel: string
): NotificationPreference | undefined {
  return preferences.find(
    p => p.notificationType === notificationType && p.channel === channel
  );
}

// ---------------------------------------------------------------------------
// Category Section Component
// ---------------------------------------------------------------------------

interface CategorySectionProps {
  category: NotificationCategory;
  preferenceMap: PreferenceMap;
  onToggle: (
    notificationType: string,
    channel: string,
    enabled: boolean
  ) => void;
  isSaving: boolean;
}

function CategorySection({
  category,
  preferenceMap,
  onToggle,
  isSaving,
}: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const Icon = category.icon;

  // Count active toggles in this category
  const activeCount = useMemo(() => {
    let count = 0;
    for (const type of category.types) {
      for (const channel of CHANNELS) {
        if (preferenceMap[type.id]?.[channel.id]) {
          count++;
        }
      }
    }
    return count;
  }, [category.types, preferenceMap]);

  const totalCount = category.types.length * CHANNELS.length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-white dark:bg-slate-800/60 border border-border overflow-hidden">
        {/* Section Header */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
          >
            <div className={`p-2.5 rounded-xl ${category.iconBg}`}>
              <Icon className={`h-5 w-5 ${category.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{category.title}</h3>
                <span className="text-[10px] font-medium tabular-nums px-1.5 py-0.5 rounded-md text-muted-foreground bg-muted/50">
                  {activeCount}/{totalCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {category.subtitle}
              </p>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>
        </CollapsibleTrigger>

        {/* Section Content */}
        <CollapsibleContent>
          <div className="border-t border-border">
            {/* Channel headers */}
            <div className="flex items-center px-5 py-2.5 bg-muted/20">
              <div className="flex-1" />
              {CHANNELS.map(channel => {
                const ChannelIcon = channel.icon;
                return (
                  <div
                    key={channel.id}
                    className="w-20 flex flex-col items-center gap-0.5"
                  >
                    <ChannelIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {channel.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Notification type rows */}
            {category.types.map((type, idx) => (
              <div
                key={type.id}
                className={`flex items-center px-5 py-3 ${
                  idx < category.types.length - 1
                    ? 'border-b border-border/50'
                    : ''
                }`}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium">{type.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {type.description}
                  </p>
                </div>

                {CHANNELS.map(channel => {
                  const isEnabled =
                    preferenceMap[type.id]?.[channel.id] ?? false;
                  return (
                    <div
                      key={channel.id}
                      className="w-20 flex items-center justify-center"
                    >
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={checked =>
                          onToggle(type.id, channel.id, checked)
                        }
                        disabled={isSaving}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function NotificationPreferencesPage() {
  const { user } = useAuth();
  const {
    data: preferencesData,
    isLoading,
    isError,
    refetch,
  } = useNotificationPreferences();
  const createPreference = useCreateNotificationPreference();
  const updatePreference = useUpdateNotificationPreference();

  const preferences = preferencesData?.preferences ?? [];

  // Local state for optimistic toggling
  const [localOverrides, setLocalOverrides] = useState<PreferenceMap>({});
  const [pendingChanges, setPendingChanges] = useState<
    Array<{
      notificationType: string;
      channel: string;
      enabled: boolean;
      existingId?: string;
    }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  // Build preference map combining server data + local overrides
  const preferenceMap = useMemo(() => {
    const serverMap = buildPreferenceMap(preferences);
    // Apply local overrides on top
    const merged = { ...serverMap };
    for (const [type, channels] of Object.entries(localOverrides)) {
      if (!merged[type]) merged[type] = {};
      for (const [channel, enabled] of Object.entries(channels)) {
        merged[type][channel] = enabled;
      }
    }
    return merged;
  }, [preferences, localOverrides]);

  // Reset local overrides when server data changes
  useEffect(() => {
    setLocalOverrides({});
    setPendingChanges([]);
  }, [preferences]);

  const handleToggle = useCallback(
    (notificationType: string, channel: string, enabled: boolean) => {
      // Update local state immediately
      setLocalOverrides(prev => ({
        ...prev,
        [notificationType]: {
          ...(prev[notificationType] ?? {}),
          [channel]: enabled,
        },
      }));

      // Track change
      const existingPref = findPref(preferences, notificationType, channel);
      setPendingChanges(prev => {
        // Remove any existing pending change for this combo
        const filtered = prev.filter(
          c =>
            !(c.notificationType === notificationType && c.channel === channel)
        );
        return [
          ...filtered,
          {
            notificationType,
            channel,
            enabled,
            existingId: existingPref?.id,
          },
        ];
      });
    },
    [preferences]
  );

  const handleSave = useCallback(async () => {
    if (pendingChanges.length === 0) {
      toast.info('Nenhuma alteração para salvar.');
      return;
    }

    setIsSaving(true);

    try {
      const results = await Promise.allSettled(
        pendingChanges.map(change => {
          if (change.existingId) {
            return updatePreference.mutateAsync({
              id: change.existingId,
              data: { isEnabled: change.enabled },
            });
          } else {
            return createPreference.mutateAsync({
              userId: user?.id ?? '',
              notificationType: change.notificationType,
              channel: change.channel,
              isEnabled: change.enabled,
            });
          }
        })
      );

      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (failedCount === 0) {
        toast.success('Preferencias de notificação salvas com sucesso.');
      } else {
        toast.error(
          `${failedCount} alteração(oes) nao puderam ser salvas. Tente novamente.`
        );
      }

      setPendingChanges([]);
      setLocalOverrides({});
      await refetch();
    } catch {
      toast.error('Erro ao salvar preferencias. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, updatePreference, createPreference, user?.id, refetch]);

  const hasPendingChanges = pendingChanges.length > 0;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Preferencias de Notificação' },
          ]}
          buttons={[
            {
              id: 'save',
              title: 'Salvar alteracoes',
              icon: Save,
              variant: 'default',
              onClick: handleSave,
              disabled: !hasPendingChanges || isSaving,
            },
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Hero card */}
        <Card className="relative overflow-hidden px-5 py-4 bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-violet-500/10 opacity-60 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-violet-500/10 opacity-60 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Preferencias de Notificação
              </h1>
              <p className="text-sm text-slate-500 dark:text-white/60">
                Configure quais notificações você deseja receber e por quais
                canais.
              </p>
            </div>

            {hasPendingChanges && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-md">
                  {pendingChanges.length} alteração(oes) nao salva(s)
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Content */}
        {isLoading ? (
          <GridLoading />
        ) : isError ? (
          <GridError
            title="Erro ao carregar preferencias"
            message="Nao foi possivel carregar suas preferencias de notificação."
            action={{
              label: 'Tentar novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        ) : (
          <div className="space-y-4">
            {CATEGORIES.map(category => (
              <CategorySection
                key={category.id}
                category={category}
                preferenceMap={preferenceMap}
                onToggle={handleToggle}
                isSaving={isSaving}
              />
            ))}

            {/* Save footer */}
            {hasPendingChanges && (
              <div className="sticky bottom-4 z-10">
                <Card className="bg-white dark:bg-slate-800 border border-border shadow-lg px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {pendingChanges.length} alteração(oes) pendente(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2.5"
                      onClick={() => {
                        setLocalOverrides({});
                        setPendingChanges([]);
                      }}
                      disabled={isSaving}
                    >
                      Descartar
                    </Button>
                    <Button
                      size="sm"
                      className="h-9 px-2.5"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1.5" />
                          Salvar alteracoes
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </PageBody>
    </PageLayout>
  );
}
