/**
 * OpenSea OS - Training Programs Listing Page
 * Página de listagem de programas de treinamento
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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { trainingService } from '@/services/hr/training.service';
import type { TrainingProgram, TrainingCategory } from '@/types/hr';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  BookOpen,
  Clock,
  GraduationCap,
  Loader2,
  Plus,
  Search,
  Tag,
  Users,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  TRAINING_CATEGORY_COLORS,
  TRAINING_CATEGORY_LABELS,
  TRAINING_CATEGORY_OPTIONS,
  TRAINING_FORMAT_LABELS,
  TRAINING_FORMAT_OPTIONS,
} from './src';
import { CreateModal } from './src/modals/create-modal';

export default function TrainingsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <TrainingsPageContent />
    </Suspense>
  );
}

function TrainingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<string | null>(null);

  const canCreate = hasPermission('hr.training.register');
  const canModify = hasPermission('hr.training.modify');
  const canDelete = hasPermission('hr.training.remove');

  // ============================================================================
  // URL-BASED FILTERS
  // ============================================================================

  const categoryFilter = useMemo(() => {
    const raw = searchParams.get('category');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const formatFilter = useMemo(() => {
    const raw = searchParams.get('format');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const mandatoryFilter = useMemo(() => {
    const raw = searchParams.get('mandatory');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

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
    queryKey: ['training-programs', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      return trainingService.listPrograms({
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

  const allPrograms = useMemo(
    () => infiniteData?.pages.flatMap(p => p.trainingPrograms ?? []) ?? [],
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
    mutationFn: trainingService.createProgram.bind(trainingService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
      toast.success('Programa de treinamento criado com sucesso');
    },
    onError: () => {
      toast.error('Erro ao criar programa de treinamento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: trainingService.deleteProgram.bind(trainingService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
      toast.success('Programa de treinamento excluído com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir programa de treinamento');
    },
  });

  // ============================================================================
  // CLIENT-SIDE FILTERS
  // ============================================================================

  const displayedPrograms = useMemo(() => {
    let items = allPrograms;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          TRAINING_CATEGORY_LABELS[p.category]?.toLowerCase().includes(q) ||
          (p.instructor && p.instructor.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    if (categoryFilter.length > 0) {
      const set = new Set(categoryFilter);
      items = items.filter(p => set.has(p.category));
    }

    if (formatFilter.length > 0) {
      const set = new Set(formatFilter);
      items = items.filter(p => set.has(p.format));
    }

    if (mandatoryFilter.length > 0) {
      if (
        mandatoryFilter.includes('mandatory') &&
        !mandatoryFilter.includes('optional')
      ) {
        items = items.filter(p => p.isMandatory);
      } else if (
        mandatoryFilter.includes('optional') &&
        !mandatoryFilter.includes('mandatory')
      ) {
        items = items.filter(p => !p.isMandatory);
      }
    }

    return items;
  }, [allPrograms, searchQuery, categoryFilter, formatFilter, mandatoryFilter]);

  // ============================================================================
  // URL FILTER BUILDERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: {
      category?: string[];
      format?: string[];
      mandatory?: string[];
    }) => {
      const categories =
        params.category !== undefined ? params.category : categoryFilter;
      const formats =
        params.format !== undefined ? params.format : formatFilter;
      const mandatories =
        params.mandatory !== undefined ? params.mandatory : mandatoryFilter;
      const parts: string[] = [];
      if (categories.length > 0) parts.push(`category=${categories.join(',')}`);
      if (formats.length > 0) parts.push(`format=${formats.join(',')}`);
      if (mandatories.length > 0)
        parts.push(`mandatory=${mandatories.join(',')}`);
      return parts.length > 0
        ? `/hr/trainings?${parts.join('&')}`
        : '/hr/trainings';
    },
    [categoryFilter, formatFilter, mandatoryFilter]
  );

  const setCategoryFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ category: ids })),
    [router, buildFilterUrl]
  );

  const setFormatFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ format: ids })),
    [router, buildFilterUrl]
  );

  const setMandatoryFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ mandatory: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = (programId: string) => {
    setProgramToDelete(programId);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (programToDelete) {
      await deleteMutation.mutateAsync(programToDelete);
      setProgramToDelete(null);
      setIsDeleteOpen(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Treinamentos', href: '/hr/trainings' },
          ]}
          buttons={
            canCreate
              ? [
                  {
                    id: 'create-training',
                    title: 'Novo Programa',
                    icon: Plus,
                    onClick: () => setIsCreateOpen(true),
                    variant: 'default',
                  },
                ]
              : []
          }
        />

        <Header
          title="Programas de Treinamento"
          description="Gerencie os programas de treinamento e desenvolvimento da organização"
        />
      </PageHeader>

      <PageBody>
        {/* Search Bar */}
        <SearchBar
          placeholder="Buscar programas de treinamento..."
          value={searchQuery}
          onSearch={setSearchQuery}
          onClear={() => setSearchQuery('')}
          showClear={true}
          size="md"
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <FilterDropdown
            label="Categoria"
            icon={Tag}
            options={TRAINING_CATEGORY_OPTIONS.map(o => ({
              id: o.value,
              label: o.label,
            }))}
            selected={categoryFilter}
            onSelectionChange={setCategoryFilter}
            activeColor="violet"
            searchPlaceholder="Buscar categoria..."
            emptyText="Nenhuma categoria encontrada."
          />
          <FilterDropdown
            label="Formato"
            icon={BookOpen}
            options={TRAINING_FORMAT_OPTIONS.map(o => ({
              id: o.value,
              label: o.label,
            }))}
            selected={formatFilter}
            onSelectionChange={setFormatFilter}
            activeColor="sky"
          />
          <FilterDropdown
            label="Obrigatoriedade"
            options={[
              { id: 'mandatory', label: 'Obrigatório' },
              { id: 'optional', label: 'Opcional' },
            ]}
            selected={mandatoryFilter}
            onSelectionChange={setMandatoryFilter}
            activeColor="emerald"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar programas de treinamento"
            message="Ocorreu um erro ao tentar carregar os programas. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () =>
                queryClient.invalidateQueries({
                  queryKey: ['training-programs'],
                }),
            }}
          />
        ) : displayedPrograms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              {searchQuery
                ? 'Nenhum programa encontrado'
                : 'Nenhum programa de treinamento'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {searchQuery
                ? `Nenhum resultado para "${searchQuery}". Tente outra busca.`
                : 'Crie o primeiro programa de treinamento para começar a capacitar a equipe.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedPrograms.map(program => (
              <TrainingProgramCard
                key={program.id}
                program={program}
                onView={() => router.push(`/hr/trainings/${program.id}`)}
                onEdit={
                  canModify
                    ? () => router.push(`/hr/trainings/${program.id}/edit`)
                    : undefined
                }
                onDelete={
                  canDelete ? () => handleDelete(program.id) : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Create Modal */}
        <CreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          isSubmitting={createMutation.isPending}
          onSubmit={async data => {
            await createMutation.mutateAsync(data);
          }}
        />

        {/* Delete Confirmation */}
        <VerifyActionPinModal
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setProgramToDelete(null);
          }}
          onSuccess={handleDeleteConfirm}
          title="Excluir Programa de Treinamento"
          description="Digite seu PIN de ação para excluir este programa. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}

// ============================================================================
// TRAINING PROGRAM CARD
// ============================================================================

function TrainingProgramCard({
  program,
  onView,
  onEdit,
  onDelete,
}: {
  program: TrainingProgram;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const categoryLabel =
    TRAINING_CATEGORY_LABELS[program.category] ?? program.category;
  const formatLabel = TRAINING_FORMAT_LABELS[program.format] ?? program.format;
  const colors =
    TRAINING_CATEGORY_COLORS[program.category as TrainingCategory] ??
    TRAINING_CATEGORY_COLORS.TECHNICAL;

  return (
    <div
      className="group relative rounded-xl border bg-white dark:bg-slate-800/60 p-5 transition-all hover:shadow-md cursor-pointer"
      onClick={onView}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${colors.gradient} text-white`}
        >
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm leading-tight truncate">
            {program.name}
          </h3>
          {program.instructor && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {program.instructor}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {program.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {program.description}
        </p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge
          variant="outline"
          className={`text-xs ${colors.bg} ${colors.text} border-0`}
        >
          {categoryLabel}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {formatLabel}
        </Badge>
        {program.isMandatory && (
          <Badge
            variant="outline"
            className="text-xs bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300 border-0"
          >
            Obrigatório
          </Badge>
        )}
        {!program.isActive && (
          <Badge variant="secondary" className="text-xs">
            Inativo
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{program.durationHours}h</span>
        </div>
        {program.maxParticipants && (
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>Máx. {program.maxParticipants}</span>
          </div>
        )}
        {program.validityMonths && (
          <span>Validade: {program.validityMonths} meses</span>
        )}
      </div>

      {/* Context Actions (hover) */}
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {onEdit && (
            <button
              onClick={e => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-7 w-7 rounded-md bg-background border flex items-center justify-center hover:bg-accent text-xs"
              title="Editar"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
