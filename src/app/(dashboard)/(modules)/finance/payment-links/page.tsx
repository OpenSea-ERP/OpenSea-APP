'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { CreatePaymentLinkModal } from '@/components/finance/create-payment-link-modal';
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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { paymentLinksService } from '@/services/finance';
import type { PaymentLink, PaymentLinkStatus } from '@/types/finance';
import {
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  Plus,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<
  PaymentLinkStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  ACTIVE: {
    label: 'Ativo',
    color:
      'bg-violet-50 text-violet-700 dark:bg-violet-500/8 dark:text-violet-300',
    icon: Clock,
  },
  PAID: {
    label: 'Pago',
    color:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
    icon: CheckCircle,
  },
  EXPIRED: {
    label: 'Expirado',
    color: 'bg-slate-50 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300',
    icon: Clock,
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300',
    icon: XCircle,
  },
};

const STATUS_OPTIONS = [
  { id: 'ACTIVE', label: 'Ativo' },
  { id: 'PAID', label: 'Pago' },
  { id: 'EXPIRED', label: 'Expirado' },
  { id: 'CANCELLED', label: 'Cancelado' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

// ============================================================================
// PAGE
// ============================================================================

export default function PaymentLinksPage() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(FINANCE_PERMISSIONS.PAYMENT_LINKS.REGISTER);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  );

  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['payment-links', statusFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await paymentLinksService.list({
        page: pageParam,
        limit: 20,
        status: statusFilter,
      });
      return response;
    },
    getNextPageParam: lastPage => {
      if (lastPage.meta.page < lastPage.meta.totalPages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const links = useMemo(
    () => data?.pages.flatMap(page => page.paymentLinks) ?? [],
    [data]
  );

  // Infinite scroll observer — observe sentinel as soon as it mounts
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, links.length]);

  const copyLink = useCallback((slug: string) => {
    const baseUrl = window.location.origin;
    navigator.clipboard.writeText(`${baseUrl}/pay/${slug}`);
    toast.success('Link copiado para a área de transferência');
  }, []);

  return (
    <PageLayout data-testid="payment-links-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Links de Pagamento' },
          ]}
          actions={
            canCreate ? (
              <Button
                size="sm"
                className="gap-1.5 h-9 px-2.5"
                onClick={() => setShowCreateModal(true)}
                data-testid="payment-links-create"
              >
                <Plus className="h-4 w-4" />
                Novo Link
              </Button>
            ) : undefined
          }
        />

        <Header
          title="Links de Pagamento"
          description="Crie e gerencie links de pagamento para compartilhar com seus clientes"
        />
      </PageHeader>

      <PageBody>
        <div className="mb-4" data-testid="payment-links-filters">
          <FilterDropdown
            label="Status"
            options={STATUS_OPTIONS}
            selected={statusFilter ? [statusFilter] : []}
            onSelectionChange={ids => setStatusFilter(ids[0] ?? undefined)}
            searchPlaceholder="Buscar status..."
            emptyText="Nenhum status encontrado."
          />
        </div>

        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError message="Erro ao carregar links de pagamento" />
        ) : links.length === 0 ? (
          <Card className="p-12 text-center">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Nenhum link de pagamento
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Crie links de pagamento para compartilhar via WhatsApp, e-mail ou
              qualquer outro canal. Seus clientes podem pagar via PIX ou boleto.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {links.map(link => {
              const status = statusConfig[link.status];
              const StatusIcon = status.icon;

              return (
                <Card key={link.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-500/8">
                        <Link2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {link.description}
                          </p>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {link.customerName && (
                            <span>{link.customerName}</span>
                          )}
                          <span>{formatDate(link.createdAt)}</span>
                          {link.paidAt && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Pago em {formatDate(link.paidAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <span className="font-semibold text-sm whitespace-nowrap">
                        {formatCurrency(link.amount)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyLink(link.slug)}
                          title="Copiar link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            window.open(`/pay/${link.slug}`, '_blank')
                          }
                          title="Abrir link"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </PageBody>

      {showCreateModal && (
        <CreatePaymentLinkModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </PageLayout>
  );
}
