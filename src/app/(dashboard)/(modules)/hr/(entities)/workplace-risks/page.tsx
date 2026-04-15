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
import { Badge } from '@/components/ui/badge';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { usePermissions } from '@/hooks/use-permissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  CreateWorkplaceRiskData,
  SafetyProgram,
  WorkplaceRisk,
} from '@/types/hr';
import { workplaceRisksService } from '@/services/hr/workplace-risks.service';
import {
  AlertTriangle,
  ExternalLink,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  workplaceRisksConfig,
  useListWorkplaceRisks,
  useDeleteWorkplaceRiskDynamic,
  getRiskCategoryLabel,
  getRiskSeverityLabel,
  getRiskSeverityVariant,
  getRiskCategoryVariant,
  RISK_CATEGORY_OPTIONS,
  RISK_SEVERITY_OPTIONS,
  type WorkplaceRiskFilters,
} from './src';

import { useListSafetyPrograms } from '../safety-programs/src';
import { toast } from 'sonner';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);

const ACTIVE_STATUS_OPTIONS = [
  { value: 'true', label: 'Ativos' },
  { value: 'false', label: 'Inativos' },
];

export default function WorkplaceRisksPage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  // Permissions
  const canView = hasPermission(HR_PERMISSIONS.SAFETY_PROGRAMS.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.SAFETY_PROGRAMS.CREATE);
  const canDelete = hasPermission(HR_PERMISSIONS.SAFETY_PROGRAMS.DELETE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterActive, setFilterActive] = useState('');

  const queryParams = useMemo<WorkplaceRiskFilters>(() => {
    const params: WorkplaceRiskFilters = {};
    if (filterProgram) params.programId = filterProgram;
    if (filterCategory) params.category = filterCategory;
    if (filterSeverity) params.severity = filterSeverity;
    if (filterActive) params.isActive = filterActive === 'true';
    return params;
  }, [filterProgram, filterCategory, filterSeverity, filterActive]);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListWorkplaceRisks(queryParams);
  const { data: programsData } = useListSafetyPrograms();
  const deleteMutation = useDeleteWorkplaceRiskDynamic();

  const risks = data?.pages.flatMap(p => p.risks) ?? [];

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

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
  const programs: SafetyProgram[] =
    programsData?.pages.flatMap(p => p.safetyPrograms) ?? [];

  // ============================================================================
  // STATE
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    riskId: string;
    programId: string;
  } | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return risks;
    const q = searchQuery.toLowerCase();
    return risks.filter(r => {
      const name = r.name?.toLowerCase() ?? '';
      const source = r.source?.toLowerCase() ?? '';
      const area = r.affectedArea?.toLowerCase() ?? '';
      return name.includes(q) || source.includes(q) || area.includes(q);
    });
  }, [risks, searchQuery]);

  const initialIds = useMemo(
    () => filteredItems.map(i => i.id),
    [filteredItems]
  );

  // Build a map from programId to program name for display
  const programMap = useMemo(() => {
    const map = new Map<string, SafetyProgram>();
    for (const p of programs) {
      map.set(p.id, p);
    }
    return map;
  }, [programs]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreate = useCallback(
    async (programId: string, data: CreateWorkplaceRiskData) => {
      await workplaceRisksService.create(programId, data);
      toast.success('Risco ocupacional criado com sucesso!');
      setIsCreateOpen(false);
      refetch();
    },
    [refetch]
  );

  const handleDeleteRequest = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        const risk = risks.find(r => r.id === ids[0]);
        if (risk) {
          setDeleteTarget({
            riskId: risk.id,
            programId: risk.safetyProgramId,
          });
          setIsDeleteOpen(true);
        }
      }
    },
    [risks]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({
        programId: deleteTarget.programId,
        riskId: deleteTarget.riskId,
      });
      setDeleteTarget(null);
      setIsDeleteOpen(false);
    } catch {
      // Toast handled by mutation
    }
  }, [deleteTarget, deleteMutation]);

  // ============================================================================
  // CONTEXT MENU ACTIONS
  // ============================================================================

  const getContextActions = useCallback(
    (item: WorkplaceRisk): ContextMenuAction[] => {
      const actions: ContextMenuAction[] = [];

      if (canView) {
        actions.push({
          id: 'open',
          label: 'Abrir',
          icon: ExternalLink,
          onClick: (ids: string[]) => {
            if (ids.length > 0) router.push(`/hr/workplace-risks/${ids[0]}`);
          },
        });
      }

      if (canDelete) {
        actions.push({
          id: 'delete',
          label: 'Excluir',
          icon: Trash2,
          onClick: handleDeleteRequest,
          variant: 'destructive',
          separator: 'before',
        });
      }

      return actions;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canView, canDelete]
  );

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: WorkplaceRisk, isSelected: boolean) => {
    const program = programMap.get(item.safetyProgramId);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={
          canView
            ? (ids: string[]) => {
                if (ids.length > 0)
                  router.push(`/hr/workplace-risks/${ids[0]}`);
              }
            : undefined
        }
        actions={getContextActions(item)}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={
            program
              ? `${program.name} (${program.type})`
              : 'Programa desconhecido'
          }
          icon={AlertTriangle}
          iconBgColor="bg-linear-to-br from-amber-500 to-orange-600"
          badges={[
            {
              label: getRiskCategoryLabel(item.category),
              variant: getRiskCategoryVariant(item.category),
            },
            {
              label: getRiskSeverityLabel(item.severity),
              variant: getRiskSeverityVariant(item.severity),
            },
            ...(item.isActive
              ? []
              : [
                  {
                    label: 'Inativo' as const,
                    variant: 'outline' as const,
                  },
                ]),
          ]}
          metadata={
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {item.source && (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {item.source}
                </span>
              )}
              {item.affectedArea && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {item.affectedArea}
                </span>
              )}
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                {program?.name ?? 'N/A'}
              </span>
            </div>
          }
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/workplace-risks/${item.id}`)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: WorkplaceRisk, isSelected: boolean) => {
    const program = programMap.get(item.safetyProgramId);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={
          canView
            ? (ids: string[]) => {
                if (ids.length > 0)
                  router.push(`/hr/workplace-risks/${ids[0]}`);
              }
            : undefined
        }
        actions={getContextActions(item)}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.name}
          subtitle={
            program
              ? `${program.name} (${program.type})`
              : 'Programa desconhecido'
          }
          icon={AlertTriangle}
          iconBgColor="bg-linear-to-br from-amber-500 to-orange-600"
          badges={[
            {
              label: getRiskCategoryLabel(item.category),
              variant: getRiskCategoryVariant(item.category),
            },
            {
              label: getRiskSeverityLabel(item.severity),
              variant: getRiskSeverityVariant(item.severity),
            },
            ...(item.isActive
              ? []
              : [
                  {
                    label: 'Inativo' as const,
                    variant: 'outline' as const,
                  },
                ]),
          ]}
          metadata={
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {item.source && (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {item.source}
                </span>
              )}
              {item.affectedArea && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {item.affectedArea}
                </span>
              )}
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                {program?.name ?? 'N/A'}
              </span>
            </div>
          }
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/workplace-risks/${item.id}`)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const handleOpenCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const actionButtons: HeaderButton[] = useMemo(() => {
    const buttons: HeaderButton[] = [];
    if (canCreate) {
      buttons.push({
        id: 'create-risk',
        title: 'Novo Risco',
        icon: Plus,
        onClick: handleOpenCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate, handleOpenCreate]);

  // ============================================================================
  // FILTERS UI
  // ============================================================================

  const hasActiveFilters =
    filterProgram || filterCategory || filterSeverity || filterActive;

  const clearFilters = useCallback(() => {
    setFilterProgram('');
    setFilterCategory('');
    setFilterSeverity('');
    setFilterActive('');
  }, []);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoadingPermissions) {
    return (
      <PageLayout>
        <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'workplace-risks',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Riscos Ocupacionais', href: '/hr/workplace-risks' },
            ]}
            buttons={actionButtons}
          />

          <Header
            title="Riscos Ocupacionais"
            description="Gerencie os riscos ocupacionais identificados nos programas de segurança do trabalho"
          />
        </PageHeader>

        <PageBody>
          <div data-testid="workplace-risks-page" className="contents" />
          {/* Search Bar */}
          <div data-testid="workplace-risks-search">
            <SearchBar
              value={searchQuery}
              placeholder={workplaceRisksConfig.display.labels.searchPlaceholder}
              onSearch={value => setSearchQuery(value)}
              onClear={() => setSearchQuery('')}
              showClear={true}
              size="md"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={filterProgram || 'ALL'}
              onValueChange={v => setFilterProgram(v === 'ALL' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Programas</SelectItem>
                {programs.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterCategory || 'ALL'}
              onValueChange={v => setFilterCategory(v === 'ALL' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Categorias</SelectItem>
                {RISK_CATEGORY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterSeverity || 'ALL'}
              onValueChange={v => setFilterSeverity(v === 'ALL' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Severidades</SelectItem>
                {RISK_SEVERITY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterActive || 'ALL'}
              onValueChange={v => setFilterActive(v === 'ALL' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {ACTIVE_STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/10"
                onClick={clearFilters}
              >
                Limpar filtros
              </Badge>
            )}
          </div>

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar riscos ocupacionais"
              message="Ocorreu um erro ao tentar carregar os riscos. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={workplaceRisksConfig}
              items={filteredItems}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemDoubleClick={item => {
                if (canView) {
                  router.push(`/hr/workplace-risks/${item.id}`);
                }
              }}
              showSorting={true}
              defaultSortField="createdAt"
              defaultSortDirection="desc"
            />
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
            onSubmit={handleCreate}
            programs={programs}
          />

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={isDeleteOpen}
            onClose={() => {
              setIsDeleteOpen(false);
              setDeleteTarget(null);
            }}
            onSuccess={handleDeleteConfirm}
            title="Excluir Risco Ocupacional"
            description="Digite seu PIN de ação para excluir este risco ocupacional. Esta ação não pode ser desfeita."
          />

          <HRSelectionToolbar
            totalItems={filteredItems.length}
            defaultActions={{
              delete: canDelete,
            }}
            handlers={{
              onDelete: async (ids: string[]) => {
                for (const id of ids) {
                  const risk = risks.find(r => r.id === id);
                  if (risk) {
                    await deleteMutation.mutateAsync({
                      programId: risk.safetyProgramId,
                      riskId: risk.id,
                    });
                  }
                }
              },
            }}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
