'use client';

/**
 * Webhooks listing — Phase 11 Plan 11-03 Task 3.
 *
 * Infinite scroll + 2 filtros (Status + Search) + counter chip N/50 (D-34) +
 * card grid pattern espelhando /devices/pos-terminals.
 *
 * Permission gating: HIDDEN (não disabled) — golden-rule.
 */

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { WebhookCard } from '@/components/devices/webhooks/webhook-card';
import { WebhookCounterChip } from '@/components/devices/webhooks/counter-chip';
import { SYSTEM_WEBHOOKS_PERMISSIONS } from '@/constants/permissions';
import { useWebhooks } from '@/hooks/system';
import { usePermissions } from '@/hooks/use-permissions';
import { WEBHOOK_TENANT_LIMIT } from '@/types/system';
import type { WebhookEndpointDTO, WebhookEndpointStatus } from '@/types/system';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ChevronDown,
  Plus,
  Search,
  Webhook as WebhookIcon,
} from 'lucide-react';

const STATUS_OPTIONS: Array<{
  value: 'all' | WebhookEndpointStatus;
  label: string;
}> = [
  { value: 'all', label: 'Todos' },
  { value: 'ACTIVE', label: 'Ativos' },
  { value: 'PAUSED', label: 'Pausados' },
  { value: 'AUTO_DISABLED', label: 'Auto-desativados' },
];

export default function WebhooksListingPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canAccess = hasPermission(SYSTEM_WEBHOOKS_PERMISSIONS.ACCESS);
  const canRegister = hasPermission(SYSTEM_WEBHOOKS_PERMISSIONS.REGISTER);

  const [statusFilter, setStatusFilter] = useState<
    'all' | WebhookEndpointStatus
  >('all');
  const [search, setSearch] = useState('');

  const { isLoading, isError, refetch, items, total } = useWebhooks({
    status: statusFilter,
    search: search || undefined,
  });

  // Auto-disabled webhooks first — destaque no topo da grid (D-25 visibility).
  const sortedItems = useMemo<WebhookEndpointDTO[] | undefined>(() => {
    if (!items) return items;
    return [...items].sort((a, b) => {
      if (a.status === 'AUTO_DISABLED' && b.status !== 'AUTO_DISABLED')
        return -1;
      if (b.status === 'AUTO_DISABLED' && a.status !== 'AUTO_DISABLED')
        return 1;
      return 0;
    });
  }, [items]);

  if (!canAccess) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Dispositivos', href: '/devices' },
              { label: 'Webhooks' },
            ]}
            hasPermission={hasPermission}
          />
        </PageHeader>
        <PageBody>
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Acesso restrito</h2>
            <p className="text-sm text-muted-foreground">
              Você não tem permissão para visualizar webhooks.
            </p>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const limitReached =
    typeof total === 'number' && total >= WEBHOOK_TENANT_LIMIT;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Dispositivos', href: '/devices' },
            { label: 'Webhooks' },
          ]}
          hasPermission={hasPermission}
          actions={
            <div className="flex items-center gap-2">
              {typeof total === 'number' && (
                <WebhookCounterChip count={total} max={WEBHOOK_TENANT_LIMIT} />
              )}
              {canRegister && !limitReached && (
                <Button
                  size="sm"
                  onClick={() => router.push('/devices/webhooks/new')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo webhook
                </Button>
              )}
              {canRegister && limitReached && (
                <Badge className="border-0 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                  Limite atingido
                </Badge>
              )}
            </div>
          }
        />
      </PageHeader>

      <PageBody spacing="gap-6">
        <PageHeroBanner
          title="Webhooks de saída"
          description="Envie eventos do sistema (batidas de ponto, aprovações, dispositivos) em tempo real para sistemas externos com assinatura HMAC-SHA256."
          icon={WebhookIcon}
          iconGradient="from-amber-500 to-orange-600"
          buttons={[]}
          hasPermission={hasPermission}
        />

        {/* Filtros */}
        <section className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Status:{' '}
                {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
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

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por URL ou descrição"
              className="pl-8"
            />
          </div>
        </section>

        {limitReached && (
          <Card className="border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 p-4">
            <h3 className="font-semibold text-sm text-rose-900 dark:text-rose-200">
              Limite de {WEBHOOK_TENANT_LIMIT} webhooks atingido
            </h3>
            <p className="text-sm text-rose-800 dark:text-rose-200/90 mt-1">
              Cada empresa pode ter no máximo {WEBHOOK_TENANT_LIMIT} webhooks
              ativos. Pause ou exclua um existente para liberar espaço.
            </p>
          </Card>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Endpoints cadastrados</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cada webhook recebe eventos assinados com HMAC-SHA256 e mantém um
              log de entregas com retry automático.
            </p>
          </div>

          {isLoading ? (
            <GridLoading count={9} layout="grid" />
          ) : isError ? (
            <GridError
              type="server"
              message="Não conseguimos carregar os webhooks. Verifique sua conexão e tente novamente."
              action={{
                label: 'Tentar novamente',
                onClick: () => {
                  void refetch();
                },
              }}
            />
          ) : sortedItems && sortedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedItems.map(webhook => (
                <WebhookCard
                  key={webhook.id}
                  webhook={webhook}
                  onClick={() => router.push(`/devices/webhooks/${webhook.id}`)}
                />
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-12 border-dashed">
              <WebhookIcon
                className="h-12 w-12 text-muted-foreground/50 mb-4"
                aria-hidden
              />
              <h3 className="font-semibold text-lg mb-1">
                Nenhum webhook configurado
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                Crie um webhook para enviar eventos do sistema (batidas de
                ponto, aprovações) em tempo real para um sistema externo com
                assinatura HMAC-SHA256.
              </p>
              {canRegister && (
                <Button onClick={() => router.push('/devices/webhooks/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeiro webhook
                </Button>
              )}
            </Card>
          )}
        </section>
      </PageBody>
    </PageLayout>
  );
}
