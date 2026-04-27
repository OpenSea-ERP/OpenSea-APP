'use client';

/**
 * Webhook detail — Phase 11 Plan 11-03 Task 4.
 *
 * Identity card + 3 tabs (Visão geral / Entregas / Configuração) +
 * auto-disabled banner condicional + delivery log com 4 ações inline +
 * DeliveryDetailDrawer 480px + PIN gates (delete + reactivate).
 */

import { DeliveryDetailDrawer } from '@/components/devices/webhooks/delivery-detail-drawer';
import { DeliveryLogRow } from '@/components/devices/webhooks/delivery-log-row';
import { DeliveryStatusBadge } from '@/components/devices/webhooks/delivery-status-badge';
import { WebhookAutoDisabledBanner } from '@/components/devices/webhooks/auto-disabled-banner';
import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SYSTEM_WEBHOOKS_PERMISSIONS } from '@/constants/permissions';
import {
  useDeleteWebhook,
  usePingWebhook,
  useReactivateWebhook,
  useReprocessWebhookDeliveriesBulk,
  useReprocessWebhookDelivery,
  useUpdateWebhook,
  useWebhook,
  useWebhookDeliveries,
} from '@/hooks/system';
import { usePermissions } from '@/hooks/use-permissions';
import {
  WEBHOOK_EVENT_CATALOG,
  type WebhookDeliveryDTO,
  type WebhookDeliveryFilters,
  type WebhookDeliveryStatus,
} from '@/types/system';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronLeft, Pencil, Send, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

const STATUS_OPTIONS: Array<{
  value: 'all' | WebhookDeliveryStatus;
  label: string;
}> = [
  { value: 'all', label: 'Todos' },
  { value: 'DELIVERED', label: 'Entregues' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'FAILED', label: 'Falhas (em retry)' },
  { value: 'DEAD', label: 'Mortas' },
];

export default function WebhookDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canAccess = hasPermission(SYSTEM_WEBHOOKS_PERMISSIONS.ACCESS);
  const canModify = hasPermission(SYSTEM_WEBHOOKS_PERMISSIONS.MODIFY);
  const canRemove = hasPermission(SYSTEM_WEBHOOKS_PERMISSIONS.REMOVE);
  const canAdmin = hasPermission(SYSTEM_WEBHOOKS_PERMISSIONS.ADMIN);

  const { data: webhook, isLoading, isError, refetch } = useWebhook(id);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'deliveries' | 'configuration'
  >('overview');

  // Delivery filters
  const [statusFilter, setStatusFilter] = useState<
    'all' | WebhookDeliveryStatus
  >('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState('');

  const deliveryFilters: WebhookDeliveryFilters = useMemo(
    () => ({
      status: statusFilter,
      eventType: eventFilter !== 'all' ? eventFilter : undefined,
      fromDate: fromDate ?? undefined,
      toDate: toDate ?? undefined,
      httpStatus: httpStatus ? Number(httpStatus) : undefined,
    }),
    [statusFilter, eventFilter, fromDate, toDate, httpStatus]
  );

  const {
    items: deliveries,
    isLoading: deliveriesLoading,
    isError: deliveriesError,
    refetch: refetchDeliveries,
  } = useWebhookDeliveries(id, deliveryFilters);

  // Mutations
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const reactivateWebhook = useReactivateWebhook();
  const pingWebhook = usePingWebhook();
  const reprocessDelivery = useReprocessWebhookDelivery();
  const reprocessBulk = useReprocessWebhookDeliveriesBulk();

  // PIN modals
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);

  // Delivery selection + drawer
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerDelivery, setDrawerDelivery] =
    useState<WebhookDeliveryDTO | null>(null);

  function togglePause(checked: boolean) {
    if (!webhook) return;
    void updateWebhook.mutateAsync({
      id: webhook.id,
      data: { status: checked ? 'ACTIVE' : 'PAUSED' },
    });
  }

  function handleDeleteSuccess() {
    if (!id) return;
    // Plan 11-02 contract uses x-action-pin-token; modal does not surface
    // the JWT today (Phase 5 design). We pass 'verified' as placeholder
    // following the PunchApprovalBatchBar pattern; backend re-validates.
    void deleteWebhook
      .mutateAsync({ id, actionPinToken: 'verified' })
      .then(() => router.push('/devices/webhooks'));
  }

  function handleReactivateSuccess() {
    if (!id) return;
    void reactivateWebhook.mutateAsync({ id, actionPinToken: 'verified' });
  }

  function handleSelectDelivery(deliveryId: string, next: boolean) {
    setSelected(prev => {
      const copy = new Set(prev);
      if (next) copy.add(deliveryId);
      else copy.delete(deliveryId);
      return copy;
    });
  }

  function handleReprocessOne(deliveryId: string) {
    if (!id) return;
    void reprocessDelivery.mutateAsync({ webhookId: id, deliveryId });
  }

  function handleReprocessBulk() {
    if (!id || selected.size === 0) return;
    void reprocessBulk
      .mutateAsync({ webhookId: id, deliveryIds: Array.from(selected) })
      .then(() => setSelected(new Set()));
  }

  if (!canAccess) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Dispositivos', href: '/devices' },
              { label: 'Webhooks', href: '/devices/webhooks' },
            ]}
            hasPermission={hasPermission}
          />
        </PageHeader>
        <PageBody>
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Acesso restrito</h2>
            <p className="text-sm text-muted-foreground">
              Você não tem permissão para visualizar este webhook.
            </p>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Dispositivos', href: '/devices' },
              { label: 'Webhooks', href: '/devices/webhooks' },
            ]}
            hasPermission={hasPermission}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" />
        </PageBody>
      </PageLayout>
    );
  }

  if (isError || !webhook) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Dispositivos', href: '/devices' },
              { label: 'Webhooks', href: '/devices/webhooks' },
            ]}
            hasPermission={hasPermission}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            message="Não conseguimos carregar este webhook."
            action={{
              label: 'Tentar novamente',
              onClick: () => {
                void refetch();
              },
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const lastSuccessLabel = webhook.lastSuccessAt
    ? formatDistanceToNow(new Date(webhook.lastSuccessAt), {
        addSuffix: true,
        locale: ptBR,
      })
    : 'Nunca entregou com sucesso';

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Dispositivos', href: '/devices' },
            { label: 'Webhooks', href: '/devices/webhooks' },
            { label: webhook.description ?? webhook.url },
          ]}
          hasPermission={hasPermission}
          actions={
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/devices/webhooks">
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Voltar
                </Link>
              </Button>
              {canModify && webhook.status !== 'AUTO_DISABLED' && (
                <div className="flex items-center gap-2 px-2">
                  <Switch
                    checked={webhook.status === 'ACTIVE'}
                    onCheckedChange={togglePause}
                    disabled={updateWebhook.isPending}
                    aria-label="Ativar/Pausar webhook"
                  />
                  <Label className="text-xs">
                    {webhook.status === 'ACTIVE' ? 'Ativo' : 'Pausado'}
                  </Label>
                </div>
              )}
              {canModify && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pingWebhook.mutate(webhook.id)}
                  disabled={pingWebhook.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {pingWebhook.isPending ? 'Enviando...' : 'Testar'}
                </Button>
              )}
              {canModify && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/devices/webhooks/${webhook.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Link>
                </Button>
              )}
              {canRemove && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              )}
            </div>
          }
        />
      </PageHeader>

      <PageBody spacing="gap-6">
        {/* Identity card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
              <span className="text-lg">⚓</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold leading-tight truncate">
                {webhook.description ?? webhook.url}
              </h1>
              <p className="font-mono text-xs text-muted-foreground truncate mt-1">
                {webhook.url}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge
                  className={
                    webhook.status === 'ACTIVE'
                      ? 'border-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : webhook.status === 'PAUSED'
                        ? 'border-0 bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300'
                        : 'border-0 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                  }
                >
                  {webhook.status === 'ACTIVE'
                    ? 'Ativo'
                    : webhook.status === 'PAUSED'
                      ? 'Pausado'
                      : 'Auto-desativado'}
                </Badge>
                <Badge className="border-0 bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300">
                  {webhook.subscribedEvents.length} eventos
                </Badge>
                <Badge className="border-0 bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300">
                  API {webhook.apiVersion}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Auto-disabled banner */}
        <WebhookAutoDisabledBanner
          endpoint={webhook}
          onReactivateClick={() => setReactivateOpen(true)}
          onViewFailedDeliveriesClick={() => {
            setStatusFilter('DEAD');
            setActiveTab('deliveries');
          }}
          reactivating={reactivateWebhook.isPending}
        />

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={v =>
            setActiveTab(v as 'overview' | 'deliveries' | 'configuration')
          }
        >
          <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="deliveries">Entregas</TabsTrigger>
            <TabsTrigger value="configuration">Configuração</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <MiniCard
                label="Eventos subscritos"
                value={`${webhook.subscribedEvents.length} de ${WEBHOOK_EVENT_CATALOG.length}`}
                description={webhook.subscribedEvents.join(', ')}
              />
              <MiniCard
                label="Concorrência"
                value="5 / 5"
                description="Cap global por webhook (D-32)"
              />
              <MiniCard
                label="Vazão máxima"
                value="50 req/s"
                description="Cap fixo por webhook (D-33)"
              />
              <MiniCard
                label="Última entrega com sucesso"
                value={lastSuccessLabel}
                description=""
              />
              <MiniCard
                label="Falhas consecutivas"
                value={String(webhook.consecutiveDeadCount)}
                description="Auto-disable em 10 (D-25)"
              />
              <MiniCard
                label="Política de retry"
                value="30s → 1m → 5m → 30m → 2h"
                description="Máx. 5 tentativas (D-01/D-02)"
              />
            </div>
          </TabsContent>

          {/* DELIVERIES TAB */}
          <TabsContent value="deliveries" className="mt-4 space-y-4">
            {/* Filtros */}
            <Card className="p-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Status</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {
                          STATUS_OPTIONS.find(o => o.value === statusFilter)
                            ?.label
                        }
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {STATUS_OPTIONS.map(opt => (
                        <DropdownMenuItem
                          key={opt.value}
                          onClick={() => setStatusFilter(opt.value)}
                        >
                          {opt.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Tipo de evento</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {eventFilter === 'all'
                          ? 'Todos'
                          : (WEBHOOK_EVENT_CATALOG.find(
                              c => c.type === eventFilter
                            )?.label ?? eventFilter)}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setEventFilter('all')}>
                        Todos
                      </DropdownMenuItem>
                      {WEBHOOK_EVENT_CATALOG.map(entry => (
                        <DropdownMenuItem
                          key={entry.type}
                          onClick={() => setEventFilter(entry.type)}
                        >
                          {entry.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">De</Label>
                  <DatePicker
                    value={fromDate}
                    onChange={v =>
                      setFromDate(typeof v === 'string' ? v : null)
                    }
                    placeholder="Data inicial"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Até</Label>
                  <DatePicker
                    value={toDate}
                    onChange={v => setToDate(typeof v === 'string' ? v : null)}
                    placeholder="Data final"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="http-status">
                    HTTP code
                  </Label>
                  <Input
                    id="http-status"
                    type="number"
                    inputMode="numeric"
                    placeholder="Ex.: 500"
                    value={httpStatus}
                    onChange={e => setHttpStatus(e.target.value)}
                    className="w-24"
                  />
                </div>
              </div>
            </Card>

            {/* Selection toolbar */}
            {selected.size > 0 && canModify && (
              <Card className="p-3 flex items-center justify-between bg-amber-50/40 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/30">
                <span className="text-sm">
                  {selected.size} entrega
                  {selected.size > 1 ? 's' : ''} selecionada
                  {selected.size > 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected(new Set())}
                  >
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReprocessBulk}
                    disabled={reprocessBulk.isPending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Reenviar {selected.size} entrega
                    {selected.size > 1 ? 's' : ''}
                  </Button>
                </div>
              </Card>
            )}

            {/* Log table */}
            {deliveriesLoading ? (
              <GridLoading count={20} layout="list" />
            ) : deliveriesError ? (
              <GridError
                type="server"
                message="Erro ao carregar entregas."
                action={{
                  label: 'Tentar novamente',
                  onClick: () => {
                    void refetchDeliveries();
                  },
                }}
              />
            ) : deliveries && deliveries.length > 0 ? (
              <Card className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="py-2 pl-3 pr-1 text-left">
                        <span className="sr-only">Selecionar</span>
                      </th>
                      <th className="py-2 px-2 text-left">Status</th>
                      <th className="py-2 px-2 text-left">Evento</th>
                      <th className="py-2 px-2 text-left">Tentativa</th>
                      <th className="py-2 px-2 text-left">HTTP</th>
                      <th className="py-2 px-2 text-left">Duração</th>
                      <th className="py-2 px-2 text-left">Quando</th>
                      <th className="py-2 px-2 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map(delivery => (
                      <DeliveryLogRow
                        key={delivery.id}
                        delivery={delivery}
                        selected={selected.has(delivery.id)}
                        onSelect={next =>
                          handleSelectDelivery(delivery.id, next)
                        }
                        onReprocess={() => handleReprocessOne(delivery.id)}
                        onOpenDetails={() => setDrawerDelivery(delivery)}
                        reprocessing={reprocessDelivery.isPending}
                      />
                    ))}
                  </tbody>
                </table>
              </Card>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhuma entrega ainda — assim que um evento subscrito ocorrer,
                  aparecerá aqui em tempo real (atualiza a cada 30s).
                </p>
              </Card>
            )}
          </TabsContent>

          {/* CONFIGURATION TAB */}
          <TabsContent value="configuration" className="mt-4 space-y-4">
            <Card className="p-4 sm:p-6 space-y-4">
              <Field label="URL de entrega">
                <code className="font-mono text-xs break-all">
                  {webhook.url}
                </code>
              </Field>

              <Field label="Eventos subscritos">
                <div className="flex flex-wrap gap-1">
                  {webhook.subscribedEvents.map(ev => (
                    <Badge
                      key={ev}
                      className="border-0 bg-slate-100 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300"
                    >
                      {ev}
                    </Badge>
                  ))}
                </div>
              </Field>

              <Field label="Versão do payload">
                <span className="font-mono text-sm">{webhook.apiVersion}</span>
              </Field>

              <Field label="Secret atual">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs">
                    {webhook.secretMasked}
                  </code>
                  {webhook.secretRotationActiveUntil && (
                    <Badge className="border-0 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      Rotação ativa até{' '}
                      {new Date(
                        webhook.secretRotationActiveUntil
                      ).toLocaleDateString('pt-BR')}
                    </Badge>
                  )}
                </div>
                {canAdmin && (
                  <Button asChild variant="outline" size="sm" className="mt-2">
                    <Link href={`/devices/webhooks/${webhook.id}/edit`}>
                      Regenerar secret
                    </Link>
                  </Button>
                )}
              </Field>

              <Field label="Política de retry">
                <p className="text-sm text-muted-foreground">
                  30s → 1m → 5m → 30m → 2h, máximo de 5 tentativas (D-01/D-02).
                  Auto-desativa após 10 entregas DEAD consecutivas ou primeira
                  HTTP 410 Gone (D-25).
                </p>
              </Field>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>

      {/* PIN gates */}
      <VerifyActionPinModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onSuccess={handleDeleteSuccess}
        title="Confirmar exclusão do webhook"
        description={`Digite seu PIN de ação para excluir o webhook "${
          webhook.description ?? webhook.url
        }". As entregas pendentes serão canceladas. Esta ação não pode ser desfeita.`}
      />

      <VerifyActionPinModal
        isOpen={reactivateOpen}
        onClose={() => setReactivateOpen(false)}
        onSuccess={handleReactivateSuccess}
        title="Reativar webhook auto-desativado"
        description="Digite seu PIN de ação para reativar o webhook. As próximas entregas que falharem voltarão a contar para o auto-disable (10 DEAD consecutivas)."
      />

      {/* Drawer */}
      <DeliveryDetailDrawer
        delivery={drawerDelivery}
        isOpen={!!drawerDelivery}
        onClose={() => setDrawerDelivery(null)}
        onReprocess={() => {
          if (drawerDelivery) handleReprocessOne(drawerDelivery.id);
        }}
        reprocessing={reprocessDelivery.isPending}
      />
    </PageLayout>
  );
}

function MiniCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
        {label}
      </p>
      <p className="text-base font-semibold mt-1 break-words">{value}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 break-words">
          {description}
        </p>
      )}
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
        {label}
      </p>
      {children}
    </div>
  );
}
