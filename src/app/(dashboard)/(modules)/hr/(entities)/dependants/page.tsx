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
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { exportToCSV } from '@/lib/csv-export';
import { employeesService } from '@/services/hr/employees.service';
import type { EmployeeDependant, DependantRelationship } from '@/types/hr';
import {
  Calendar,
  Download,
  ExternalLink,
  Heart,
  Loader2,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { dependantsService } from '@/services/hr/dependants.service';
import {
  dependantsConfig,
  useListDependants,
  useDeleteDependant,
  formatDate,
  formatCpf,
  getRelationshipLabel,
  getDependantBadges,
  calculateAge,
  type DependantFilters,
} from './src';
import type { CreateDependantMutationData } from './src/api/mutations';

import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';

const RELATIONSHIP_OPTIONS = [
  { value: 'SPOUSE', label: 'Cônjuge' },
  { value: 'CHILD', label: 'Filho(a)' },
  { value: 'STEPCHILD', label: 'Enteado(a)' },
  { value: 'PARENT', label: 'Pai/Mãe' },
  { value: 'OTHER', label: 'Outro' },
];

export default function DependantsPage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  // Permissions
  const canView = hasPermission(HR_PERMISSIONS.DEPENDANTS.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.DEPENDANTS.CREATE);
  const canDelete = hasPermission(HR_PERMISSIONS.DEPENDANTS.DELETE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterRelationship, setFilterRelationship] = useState('');

  const queryParams = useMemo<DependantFilters>(() => {
    const params: DependantFilters = {};
    if (filterEmployeeId) params.employeeId = filterEmployeeId;
    return params;
  }, [filterEmployeeId]);

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
  } = useListDependants(queryParams);
  const deleteMutation = useDeleteDependant();

  const dependants = data?.pages.flatMap(p => p.dependants) ?? [];

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

  const employeeIds = useMemo(
    () => dependants.map(d => d.employeeId),
    [dependants]
  );
  const { getName } = useEmployeeMap(employeeIds);

  // Employee options for filter dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'filter-options'],
    queryFn: () =>
      employeesService.listEmployees({ perPage: 100, status: 'ACTIVE' }),
    staleTime: 60_000,
  });

  const employeeOptions = useMemo(
    () =>
      (employeesData?.employees ?? []).map(e => ({
        id: e.id,
        label: e.fullName,
      })),
    [employeesData]
  );

  // ============================================================================
  // STATE
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeDependant | null>(
    null
  );
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const filteredItems = useMemo(() => {
    let items = dependants;

    // Client-side relationship filter
    if (filterRelationship) {
      items = items.filter(d => d.relationship === filterRelationship);
    }

    // Client-side search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(d => {
        const name = d.name?.toLowerCase() ?? '';
        const cpf = d.cpf?.toLowerCase() ?? '';
        return name.includes(q) || cpf.includes(q);
      });
    }

    return items;
  }, [dependants, searchQuery, filterRelationship]);

  const initialIds = useMemo(
    () => filteredItems.map(i => i.id),
    [filteredItems]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreate = useCallback(
    async (data: CreateDependantMutationData) => {
      const { employeeId, ...dependantData } = data;
      await dependantsService.create(employeeId, dependantData);
      toast.success('Dependente cadastrado com sucesso!');
      setIsCreateOpen(false);
      refetch();
    },
    [refetch]
  );

  const handleDeleteRequest = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        const item = dependants.find(d => d.id === ids[0]);
        if (item) {
          setDeleteTarget(item);
          setIsDeleteOpen(true);
        }
      }
    },
    [dependants]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({
        employeeId: deleteTarget.employeeId,
        dependantId: deleteTarget.id,
      });
      setDeleteTarget(null);
      setIsDeleteOpen(false);
    } catch {
      // Toast handled by mutation
    }
  }, [deleteTarget, deleteMutation]);

  const handleBulkDelete = useCallback(
    async (ids: string[]) => {
      for (const id of ids) {
        const item = dependants.find(d => d.id === id);
        if (item) {
          await deleteMutation.mutateAsync({
            employeeId: item.employeeId,
            dependantId: item.id,
          });
        }
      }
    },
    [deleteMutation, dependants]
  );

  const handleExport = useCallback(
    (ids: string[]) => {
      const items =
        ids.length > 0
          ? dependants.filter(d => ids.includes(d.id))
          : dependants;
      exportToCSV(
        items,
        [
          { header: 'Nome', accessor: d => d.name },
          { header: 'Funcionário', accessor: d => getName(d.employeeId) },
          { header: 'CPF', accessor: d => formatCpf(d.cpf) },
          {
            header: 'Data de Nascimento',
            accessor: d => formatDate(d.birthDate),
          },
          {
            header: 'Parentesco',
            accessor: d =>
              getRelationshipLabel(d.relationship as DependantRelationship),
          },
          {
            header: 'IRRF',
            accessor: d => (d.isIrrfDependant ? 'Sim' : 'Não'),
          },
          {
            header: 'Salário Família',
            accessor: d => (d.isSalarioFamilia ? 'Sim' : 'Não'),
          },
          {
            header: 'PcD',
            accessor: d => (d.hasDisability ? 'Sim' : 'Não'),
          },
        ],
        'dependentes'
      );
    },
    [dependants, getName]
  );

  // ============================================================================
  // CONTEXT MENU ACTIONS
  // ============================================================================

  const getContextActions = useCallback(
    (item: EmployeeDependant): ContextMenuAction[] => {
      const actions: ContextMenuAction[] = [];

      if (canView) {
        actions.push({
          id: 'open',
          label: 'Abrir',
          icon: ExternalLink,
          onClick: (ids: string[]) => {
            if (ids.length > 0) router.push(`/hr/dependants/${ids[0]}`);
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

  const renderGridCard = (item: EmployeeDependant, isSelected: boolean) => {
    const badges = getDependantBadges(item);
    const age = calculateAge(item.birthDate);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={
          canView
            ? (ids: string[]) => {
                if (ids.length > 0) router.push(`/hr/dependants/${ids[0]}`);
              }
            : undefined
        }
        actions={getContextActions(item)}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={getRelationshipLabel(item.relationship)}
          icon={Heart}
          iconBgColor="bg-linear-to-br from-pink-500 to-pink-600"
          badges={badges}
          metadata={
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {getName(item.employeeId)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(item.birthDate)}
                {age !== null && ` (${age} anos)`}
              </span>
              {item.cpf && (
                <span className="text-xs">{formatCpf(item.cpf)}</span>
              )}
            </div>
          }
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => {
            if (canView) router.push(`/hr/dependants/${item.id}`);
          }}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: EmployeeDependant, isSelected: boolean) => {
    const badges = getDependantBadges(item);
    const age = calculateAge(item.birthDate);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={
          canView
            ? (ids: string[]) => {
                if (ids.length > 0) router.push(`/hr/dependants/${ids[0]}`);
              }
            : undefined
        }
        actions={getContextActions(item)}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.name}
          subtitle={getRelationshipLabel(item.relationship)}
          icon={Heart}
          iconBgColor="bg-linear-to-br from-pink-500 to-pink-600"
          badges={badges}
          metadata={
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {getName(item.employeeId)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(item.birthDate)}
                {age !== null && ` (${age} anos)`}
              </span>
              {item.cpf && (
                <span className="text-xs">{formatCpf(item.cpf)}</span>
              )}
            </div>
          }
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => {
            if (canView) router.push(`/hr/dependants/${item.id}`);
          }}
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
    buttons.push({
      id: 'export-dependants',
      title: 'Exportar',
      icon: Download,
      onClick: () => handleExport([]),
      variant: 'outline',
    });
    if (canCreate) {
      buttons.push({
        id: 'create-dependant',
        title: 'Novo Dependente',
        icon: Plus,
        onClick: handleOpenCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate, handleOpenCreate, handleExport]);

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
        namespace: 'dependants',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Dependentes', href: '/hr/dependants' },
            ]}
            buttons={actionButtons}
          />

          <Header
            title="Dependentes"
            description="Gerencie os dependentes dos funcionários"
          />
        </PageHeader>

        <PageBody>
          <div data-testid="dependants-page" className="contents" />
          {/* Search Bar */}
          <div data-testid="dependants-search">
            <SearchBar
              value={searchQuery}
              placeholder={dependantsConfig.display.labels.searchPlaceholder}
              onSearch={value => setSearchQuery(value)}
              onClear={() => setSearchQuery('')}
              showClear={true}
              size="md"
            />
          </div>

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar dependentes"
              message="Ocorreu um erro ao tentar carregar os dependentes. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={dependantsConfig}
              items={filteredItems}
              toolbarStart={
                <>
                  <div data-testid="dependants-filter-employee">
                    <FilterDropdown
                      label="Funcionário"
                      icon={User}
                      options={employeeOptions}
                      value={filterEmployeeId}
                      onChange={v => setFilterEmployeeId(v)}
                      activeColor="violet"
                      searchPlaceholder="Buscar funcionário..."
                      emptyText="Nenhum funcionário encontrado."
                    />
                  </div>
                  <div data-testid="dependants-filter-relationship">
                    <FilterDropdown
                      label="Parentesco"
                      icon={Heart}
                      options={RELATIONSHIP_OPTIONS}
                      value={filterRelationship}
                      onChange={v => setFilterRelationship(v)}
                      activeColor="cyan"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-nowrap" data-testid="dependants-count">
                    {filteredItems.length}{' '}
                    {filteredItems.length === 1 ? 'dependente' : 'dependentes'}
                  </p>
                </>
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemDoubleClick={item => {
                if (canView) {
                  router.push(`/hr/dependants/${item.id}`);
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
            preselectedEmployeeId={filterEmployeeId || undefined}
          />

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={isDeleteOpen}
            onClose={() => {
              setIsDeleteOpen(false);
              setDeleteTarget(null);
            }}
            onSuccess={handleDeleteConfirm}
            title="Excluir Dependente"
            description="Digite seu PIN de ação para excluir este dependente. Esta ação não pode ser desfeita."
          />

          <HRSelectionToolbar
            totalItems={filteredItems.length}
            defaultActions={{
              delete: canDelete,
              export: true,
            }}
            handlers={{
              onDelete: handleBulkDelete,
              onExport: handleExport,
            }}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
