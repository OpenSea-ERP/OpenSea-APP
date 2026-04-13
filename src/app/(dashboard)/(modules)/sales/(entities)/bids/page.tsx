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
import type { HeaderButton } from '@/components/layout/types/header.types';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { useBidsInfinite, useDeleteBid } from '@/hooks/sales/use-bids';
import { bidsConfig } from '@/config/entities/bids.config';
import type { Bid, BidStatus, BidModality } from '@/types/sales';
import { BID_STATUS_LABELS, BID_MODALITY_LABELS } from '@/types/sales';
import { Badge } from '@/components/ui/badge';
import { CreateBidWizard } from './src/components/create-bid-wizard';
import {
  Building2,
  Calendar,
  DollarSign,
  Gavel,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const STATUS_COLOR: Record<string, string> = {
  DISCOVERED: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  ANALYZING: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  VIABLE:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  NOT_VIABLE:
    'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  PREPARING:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  PROPOSAL_SENT:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
  WON: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300',
  LOST: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  CONTRACTED:
    'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
  ARCHIVED:
    'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300',
};

function BidsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [statusFilter, setStatusFilter] = useState<BidStatus | ''>('');
  const [modalityFilter, setModalityFilter] = useState<BidModality | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<Bid | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('sales.bids.register');
  const canEdit = hasPermission('sales.bids.modify');
  const canDelete = hasPermission('sales.bids.remove');

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBidsInfinite({
    search: search || undefined,
    status: statusFilter || undefined,
    modality: modalityFilter || undefined,
    limit: 20,
  });

  const deleteMutation = useDeleteBid();

  const bids = useMemo(
    () => data?.pages.flatMap(page => page.bids) ?? [],
    [data]
  );

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleView = useCallback(
    (bid: Bid) => {
      router.push(`/sales/bids/${bid.id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (bid: Bid) => {
      router.push(`/sales/bids/${bid.id}/edit`);
    },
    [router]
  );

  const handleContextView = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        router.push(`/sales/bids/${ids[0]}`);
      }
    },
    [router]
  );

  const handleContextEdit = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        router.push(`/sales/bids/${ids[0]}/edit`);
      }
    },
    [router]
  );

  const handleContextDelete = useCallback(
    (ids: string[]) => {
      const bid = bids.find(b => b.id === ids[0]);
      if (bid) setDeleteTarget(bid);
    },
    [bids]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Licitação excluída com sucesso');
      setDeleteTarget(null);
    } catch {
      toast.error('Erro ao excluir licitação');
    }
  }, [deleteTarget, deleteMutation]);

  const headerButtons: HeaderButton[] = canCreate
    ? [
        {
          title: 'Nova Licitação',
          icon: Plus,
          onClick: () => setWizardOpen(true),
          variant: 'default',
        },
      ]
    : [];

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const statusOptions = Object.entries(BID_STATUS_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const modalityOptions = Object.entries(BID_MODALITY_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    })
  );

  const renderGridItem = (bid: Bid, _isSelected: boolean) => (
    <EntityContextMenu
      itemId={bid.id}
      onView={handleContextView}
      onEdit={canEdit ? handleContextEdit : undefined}
      actions={[
        ...(canDelete
          ? [
              {
                id: 'delete',
                label: 'Excluir',
                icon: Trash2,
                onClick: handleContextDelete,
                variant: 'destructive' as const,
                separator: 'before' as const,
              },
            ]
          : []),
      ]}
    >
      <EntityCard
        id={bid.id}
        variant="grid"
        title={bid.editalNumber}
        subtitle={bid.organName}
        icon={Gavel}
        iconBgColor="bg-linear-to-br from-indigo-500 to-purple-600"
        badges={[
          {
            label: BID_STATUS_LABELS[bid.status] ?? bid.status,
            variant: 'default',
          },
        ]}
        footer={{
          type: 'single' as const,
          button: {
            icon: DollarSign,
            label: formatCurrency(bid.estimatedValue),
            onClick: () => {},
            color: 'secondary' as const,
          },
        }}
        isSelected={_isSelected}
        showSelection={false}
        clickable={false}
        createdAt={bid.createdAt}
        updatedAt={bid.updatedAt ?? undefined}
      />
    </EntityContextMenu>
  );

  const renderListItem = (bid: Bid, _isSelected: boolean) => (
    <EntityContextMenu
      itemId={bid.id}
      onView={handleContextView}
      onEdit={canEdit ? handleContextEdit : undefined}
      actions={[
        ...(canDelete
          ? [
              {
                id: 'delete',
                label: 'Excluir',
                icon: Trash2,
                onClick: handleContextDelete,
                variant: 'destructive' as const,
                separator: 'before' as const,
              },
            ]
          : []),
      ]}
    >
      <EntityCard
        id={bid.id}
        variant="list"
        title={bid.editalNumber}
        subtitle={bid.organName}
        icon={Gavel}
        iconBgColor="bg-linear-to-br from-indigo-500 to-purple-600"
        metadata={
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Badge
              className={cn(
                'shrink-0 text-xs',
                STATUS_COLOR[bid.status] ?? 'bg-slate-100 text-slate-700'
              )}
            >
              {BID_STATUS_LABELS[bid.status] ?? bid.status}
            </Badge>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {formatCurrency(bid.estimatedValue)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(bid.openingDate)}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {bid.organState ?? '-'}
            </span>
          </div>
        }
        isSelected={_isSelected}
        showSelection={false}
        clickable={false}
        createdAt={bid.createdAt}
        updatedAt={bid.updatedAt ?? undefined}
      />
    </EntityContextMenu>
  );

  return (
    <PageLayout data-testid="bids-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[{ label: 'Vendas' }, { label: 'Licitações' }]}
          buttons={headerButtons}
        />

        <Header
          title="Licitações"
          description="Gerenciamento de licitações e pregoes"
        />
      </PageHeader>
      <PageBody>
        <SearchBar
          value={search}
          onSearch={handleSearch}
          onClear={() => setSearch('')}
          placeholder="Buscar por número, orgao ou objeto..."
        />

        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError message="Erro ao carregar licitações" />
        ) : (
          <EntityGrid
            config={bidsConfig}
            items={bids}
            toolbarStart={
              <>
                <FilterDropdown
                  label="Status"
                  value={statusFilter}
                  options={statusOptions}
                  onChange={(v: string) => setStatusFilter(v as BidStatus | '')}
                />
                <FilterDropdown
                  label="Modalidade"
                  value={modalityFilter}
                  options={modalityOptions}
                  onChange={(v: string) =>
                    setModalityFilter(v as BidModality | '')
                  }
                />
              </>
            }
            renderGridItem={renderGridItem}
            renderListItem={renderListItem}
            onItemDoubleClick={bid => handleView(bid)}
          />
        )}

        {hasNextPage && (
          <div ref={observerRef} className="flex justify-center py-4">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
            </button>
          </div>
        )}

        <VerifyActionPinModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description={`Digite seu PIN de ação para excluir a licitação ${deleteTarget?.editalNumber ?? ''}.`}
        />

        {canCreate && (
          <CreateBidWizard open={wizardOpen} onOpenChange={setWizardOpen} />
        )}
      </PageBody>
    </PageLayout>
  );
}

export default function BidsPage() {
  return (
    <Suspense fallback={<GridLoading />}>
      <CoreProvider>
        <BidsPageContent />
      </CoreProvider>
    </Suspense>
  );
}
