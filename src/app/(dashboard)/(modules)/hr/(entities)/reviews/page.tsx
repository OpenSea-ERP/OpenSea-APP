/**
 * OpenSea OS - Review Cycles Listing Page
 * Página de listagem de ciclos de avaliação de desempenho
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '../../_shared/constants/hr-permissions';
import { reviewsService } from '@/services/hr/reviews.service';
import type {
  ReviewCycle,
  ReviewCycleType,
  ReviewCycleStatus,
} from '@/types/hr';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  CalendarDays,
  ClipboardCheck,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import {
  REVIEW_CYCLE_STATUS_COLORS,
  REVIEW_CYCLE_STATUS_LABELS,
  REVIEW_CYCLE_STATUS_OPTIONS,
  REVIEW_CYCLE_TYPE_COLORS,
  REVIEW_CYCLE_TYPE_LABELS,
  REVIEW_CYCLE_TYPE_OPTIONS,
} from './src';
import { CreateCycleModal } from './src/modals/create-cycle-modal';

export default function ReviewsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="grid" size="md" gap="gap-4" />}
    >
      <ReviewsPageContent />
    </Suspense>
  );
}

function ReviewsPageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [cycleToDelete, setCycleToDelete] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const canCreate = hasPermission(HR_PERMISSIONS.REVIEWS.CREATE);
  const canDelete = hasPermission(HR_PERMISSIONS.REVIEWS.DELETE);

  // ============================================================================
  // INFINITE SCROLL DATA FETCHING
  // ============================================================================

  const PAGE_SIZE = 20;

  const {
    data: infiniteData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['review-cycles', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      return reviewsService.listCycles({
        page: pageParam,
        perPage: PAGE_SIZE,
      });
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.page ?? 1;
      const totalPages = lastPage.totalPages ?? 1;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });

  const allCycles = useMemo(
    () => infiniteData?.pages.flatMap(p => p.reviewCycles ?? []) ?? [],
    [infiniteData]
  );

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const createMutation = useMutation({
    mutationFn: reviewsService.createCycle.bind(reviewsService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-cycles'] });
      toast.success('Ciclo de avaliação criado com sucesso');
      setIsCreateOpen(false);
    },
    onError: () => {
      toast.error('Erro ao criar ciclo de avaliação');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: reviewsService.deleteCycle.bind(reviewsService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-cycles'] });
      toast.success('Ciclo de avaliação excluído com sucesso');
      setCycleToDelete(null);
    },
    onError: () => {
      toast.error('Erro ao excluir ciclo de avaliação');
    },
  });

  // ============================================================================
  // CLIENT-SIDE FILTERS
  // ============================================================================

  const displayedCycles = useMemo(() => {
    let items = allCycles;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    if (typeFilter.length > 0) {
      const set = new Set(typeFilter);
      items = items.filter(c => set.has(c.type));
    }

    if (statusFilter.length > 0) {
      const set = new Set(statusFilter);
      items = items.filter(c => set.has(c.status));
    }

    return items;
  }, [allCycles, searchQuery, typeFilter, statusFilter]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDeleteRequest = useCallback((cycleId: string) => {
    setCycleToDelete(cycleId);
    setIsDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (cycleToDelete) {
      deleteMutation.mutate(cycleToDelete);
    }
    setIsDeleteOpen(false);
  }, [cycleToDelete, deleteMutation]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Avaliações de Desempenho' },
          ]}
          actions={
            canCreate ? (
              <Button
                size="sm"
                className="h-9 px-2.5 rounded-lg text-sm shadow-sm"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Novo Ciclo
              </Button>
            ) : undefined
          }
        />

        <Header
          title="Avaliações de Desempenho"
          description="Gerencie ciclos de avaliação e desempenho dos colaboradores"
        />
      </PageHeader>

      <PageBody>
        <div data-testid="reviews-page" className="contents" />
        <div className="flex items-center gap-3 mb-4">
          <div data-testid="reviews-search" className="flex-1">
            <SearchBar
              placeholder="Buscar ciclos de avaliação..."
              value={searchQuery}
              onSearch={setSearchQuery}
            />
          </div>
          <div data-testid="reviews-filter-type">
            <FilterDropdown
              label="Tipo"
              options={REVIEW_CYCLE_TYPE_OPTIONS}
              selected={typeFilter}
              onSelectionChange={setTypeFilter}
            />
          </div>
          <div data-testid="reviews-filter-status">
            <FilterDropdown
              label="Status"
              options={REVIEW_CYCLE_STATUS_OPTIONS}
              selected={statusFilter}
              onSelectionChange={setStatusFilter}
            />
          </div>
        </div>

        {isLoading ? (
          <GridLoading count={6} layout="grid" size="md" gap="gap-4" />
        ) : error ? (
          <GridError message="Erro ao carregar ciclos de avaliação" />
        ) : displayedCycles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">
              Nenhum ciclo de avaliação encontrado
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedCycles.map(cycle => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                onView={() => router.push(`/hr/reviews/${cycle.id}`)}
                onDelete={
                  canDelete ? () => handleDeleteRequest(cycle.id) : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </PageBody>

      {/* Create Modal */}
      <CreateCycleModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={data => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {/* Delete Confirmation */}
      <VerifyActionPinModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Confirmar Exclusão"
        description="Digite seu PIN de ação para excluir este ciclo de avaliação."
      />
    </PageLayout>
  );
}

// ============================================================================
// CYCLE CARD COMPONENT
// ============================================================================

function CycleCard({
  cycle,
  onView,
  onDelete,
}: {
  cycle: ReviewCycle;
  onView: () => void;
  onDelete?: () => void;
}) {
  const typeColors = REVIEW_CYCLE_TYPE_COLORS[cycle.type as ReviewCycleType];
  const statusColors =
    REVIEW_CYCLE_STATUS_COLORS[cycle.status as ReviewCycleStatus];

  return (
    <Card
      className="bg-white dark:bg-slate-800/60 border border-border p-4 cursor-pointer hover:shadow-md transition-shadow group relative"
      onClick={onView}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500"
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`h-10 w-10 rounded-lg bg-gradient-to-br ${typeColors?.gradient ?? 'from-slate-500 to-slate-600'} flex items-center justify-center shrink-0`}
        >
          <ClipboardCheck className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm truncate">{cycle.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {REVIEW_CYCLE_TYPE_LABELS[cycle.type as ReviewCycleType] ??
              cycle.type}
          </p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3">
        <Badge
          variant="secondary"
          className={`text-xs ${statusColors?.bg ?? ''} ${statusColors?.text ?? ''} border-0`}
        >
          {REVIEW_CYCLE_STATUS_LABELS[cycle.status as ReviewCycleStatus] ??
            cycle.status}
        </Badge>
        {!cycle.isActive && (
          <Badge
            variant="secondary"
            className="text-xs bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300 border-0"
          >
            Inativo
          </Badge>
        )}
      </div>

      {/* Dates */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" />
        <span>
          {new Date(cycle.startDate).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
          })}{' '}
          -{' '}
          {new Date(cycle.endDate).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Description */}
      {cycle.description && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {cycle.description}
        </p>
      )}
    </Card>
  );
}
