/**
 * OpenSea OS - Campaigns Page
 * Página de gerenciamento de campanhas promocionais com infinite scroll
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useCampaignsInfinite,
  useDeleteCampaign,
} from '@/hooks/sales/use-campaigns';
import type { Campaign } from '@/types/sales';
import {
  CAMPAIGN_STATUS_COLORS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
} from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { CreateCampaignWizard } from './src/components/create-campaign-wizard';
import { Megaphone, Plus, Trash2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function CampaignsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <CampaignsPageContent />
    </Suspense>
  );
}

function CampaignsPageContent() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  const {
    campaigns,
    total,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCampaignsInfinite({
    search: debouncedSearch || undefined,
    status: statusFilter[0] as Campaign['status'] | undefined,
    type: typeFilter[0] as Campaign['type'] | undefined,
  });

  const deleteMutation = useDeleteCampaign();

  // Infinite scroll — refs prevent observer teardown/re-creation loop
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  const fetchNextPageRef = useRef(fetchNextPage);
  hasNextPageRef.current = hasNextPage;
  isFetchingNextPageRef.current = isFetchingNextPage;
  fetchNextPageRef.current = fetchNextPage;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((el: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          hasNextPageRef.current &&
          !isFetchingNextPageRef.current
        ) {
          fetchNextPageRef.current();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    observerRef.current = observer;
  }, []);

  const statusOptions = useMemo(
    () =>
      Object.entries(CAMPAIGN_STATUS_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  const typeOptions = useMemo(
    () =>
      Object.entries(CAMPAIGN_TYPE_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  const handleDelete = (ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    for (const id of itemsToDelete) {
      await deleteMutation.mutateAsync(id);
    }
    setDeleteModalOpen(false);
    setItemsToDelete([]);
    toast.success(
      itemsToDelete.length === 1
        ? 'Campanha excluída com sucesso!'
        : `${itemsToDelete.length} campanhas excluídas!`
    );
  }, [itemsToDelete, deleteMutation]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <PageLayout data-testid="campaigns-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Campanhas', href: '/sales/campaigns' },
          ]}
          buttons={
            hasPermission(SALES_PERMISSIONS.CAMPAIGNS.ACCESS)
              ? [
                  {
                    id: 'create-campaign',
                    title: 'Nova Campanha',
                    icon: Plus,
                    onClick: () => setCreateOpen(true),
                    variant: 'default',
                  },
                ]
              : []
          }
        />
        <Header
          title="Campanhas"
          description="Gerencie campanhas promocionais e descontos"
        />
      </PageHeader>

      <PageBody>
        <SearchBar
          placeholder="Buscar campanhas..."
          value={searchQuery}
          onSearch={setSearchQuery}
          onClear={() => setSearchQuery('')}
          showClear={true}
          size="md"
        />

        {isLoading ? (
          <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar campanhas"
            message="Ocorreu um erro. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4">
              <FilterDropdown
                label="Status"
                icon={Zap}
                options={statusOptions}
                selected={statusFilter}
                onSelectionChange={setStatusFilter}
                activeColor="emerald"
                searchPlaceholder="Buscar status..."
                emptyText="Nenhum status encontrado."
              />
              <FilterDropdown
                label="Tipo"
                icon={Megaphone}
                options={typeOptions}
                selected={typeFilter}
                onSelectionChange={setTypeFilter}
                activeColor="violet"
                searchPlaceholder="Buscar tipo..."
                emptyText="Nenhum tipo encontrado."
              />
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                {total} {total === 1 ? 'campanha' : 'campanhas'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign: Campaign) => (
                <div
                  key={campaign.id}
                  onClick={() => router.push(`/sales/campaigns/${campaign.id}`)}
                  className={cn(
                    'group relative rounded-xl border bg-card p-4 cursor-pointer transition-all',
                    'hover:shadow-md hover:border-primary/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-purple-600 text-white">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate text-gray-900 dark:text-white">
                        {campaign.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(campaign.startDate)} -{' '}
                        {formatDate(campaign.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                        CAMPAIGN_STATUS_COLORS[campaign.status]
                      )}
                    >
                      {CAMPAIGN_STATUS_LABELS[campaign.status]}
                    </span>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300">
                      {CAMPAIGN_TYPE_LABELS[campaign.type]}
                    </span>
                    {campaign.usageCount > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {campaign.usageCount} usos
                      </span>
                    )}
                  </div>

                  {hasPermission(SALES_PERMISSIONS.CAMPAIGNS.ADMIN) && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete([campaign.id]);
                      }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div ref={sentinelRef} className="h-1" />
          </>
        )}

        <CreateCampaignWizard open={createOpen} onOpenChange={setCreateOpen} />

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir esta campanha. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
