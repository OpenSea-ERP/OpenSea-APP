/**
 * OpenSea OS - Cost Centers Page
 * Listagem de centros de custo seguindo o padrao do projeto
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
import type { HeaderButton } from '@/components/layout/types/header.types';
import { LinkCompanyModal } from '@/components/modals/link-company-modal';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import type { EntityConfig } from '@/core/types';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useCostCenters,
  useCreateCostCenter,
  useDeleteCostCenter,
  useUpdateCostCenter,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import type { CostCenter } from '@/types/finance';
import {
  Building2,
  Calendar,
  Landmark,
  Link2Off,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CreateCostCenterWizard } from './src';

// =============================================================================
// ENTITY CONFIG (minimal, for EntityGrid)
// =============================================================================

const costCentersConfig: EntityConfig<CostCenter> = {
  name: 'cost-center',
  namePlural: 'cost-centers',
  api: {
    baseUrl: '/api/v1/finance/cost-centers',
  },
  routes: {
    list: '/finance/cost-centers',
    detail: '/finance/cost-centers/:id',
  },
  display: {
    titleField: 'name',
    subtitleField: 'code',
    labels: {
      singular: 'centro de custo',
      plural: 'centros de custo',
      createButton: 'Novo Centro de Custo',
      searchPlaceholder: 'Buscar centros de custo por nome ou código...',
      emptyState: 'Nenhum centro de custo encontrado',
    },
  },
  permissions: {
    view: FINANCE_PERMISSIONS.COST_CENTERS.ACCESS,
    create: FINANCE_PERMISSIONS.COST_CENTERS.REGISTER,
    edit: FINANCE_PERMISSIONS.COST_CENTERS.MODIFY,
    delete: FINANCE_PERMISSIONS.COST_CENTERS.REMOVE,
  },
};

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Compute next auto-generated code from existing cost centers
 * Format: CC + 5-digit zero-padded number
 */
function computeNextCode(costCenters: CostCenter[]): string {
  let maxNum = 0;
  for (const cc of costCenters) {
    const match = cc.code.match(/^CC(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `CC${(maxNum + 1).toString().padStart(5, '0')}`;
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function CostCentersPage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  // Permissions
  const canView = hasPermission(FINANCE_PERMISSIONS.COST_CENTERS.ACCESS);
  const canCreate = hasPermission(FINANCE_PERMISSIONS.COST_CENTERS.REGISTER);
  const canEdit = hasPermission(FINANCE_PERMISSIONS.COST_CENTERS.MODIFY);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.COST_CENTERS.REMOVE);

  // ============================================================================
  // DATA
  // ============================================================================

  const { data, isLoading, error, refetch } = useCostCenters();
  const createMutation = useCreateCostCenter();
  const updateMutation = useUpdateCostCenter();
  const deleteMutation = useDeleteCostCenter();

  const costCenters = data?.costCenters ?? [];

  // ============================================================================
  // STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeletePinOpen, setIsDeletePinOpen] = useState(false);

  // Link company modal state
  const [linkTarget, setLinkTarget] = useState<CostCenter | null>(null);
  const [linkMode, setLinkMode] = useState<'link' | 'unlink'>('link');
  const [isLinkOpen, setIsLinkOpen] = useState(false);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const nextCode = useMemo(() => computeNextCode(costCenters), [costCenters]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return costCenters;
    const q = searchQuery.toLowerCase();
    return costCenters.filter(cc => {
      const name = cc.name?.toLowerCase() ?? '';
      const code = cc.code?.toLowerCase() ?? '';
      const companyName = cc.companyName?.toLowerCase() ?? '';
      return name.includes(q) || code.includes(q) || companyName.includes(q);
    });
  }, [costCenters, searchQuery]);

  const initialIds = useMemo(
    () => filteredItems.map(i => i.id),
    [filteredItems]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreate = useCallback(
    async (data: Parameters<typeof createMutation.mutateAsync>[0]) => {
      try {
        await createMutation.mutateAsync(data);
        toast.success('Centro de custo criado com sucesso!');
        setIsCreateOpen(false);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao criar centro de custo';
        toast.error(message);
      }
    },
    [createMutation]
  );

  const handleView = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        router.push(`/finance/cost-centers/${ids[0]}`);
      }
    },
    [router]
  );

  const handleEdit = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        router.push(`/finance/cost-centers/${ids[0]}`);
      }
    },
    [router]
  );

  const handleDeleteRequest = useCallback((ids: string[]) => {
    if (ids.length > 0) {
      setDeleteTarget(ids[0]);
      setIsDeletePinOpen(true);
    }
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      toast.success('Centro de custo excluído com sucesso!');
      setDeleteTarget(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao excluir centro de custo';
      toast.error(message);
    }
  }, [deleteTarget, deleteMutation]);

  const handleLinkCompany = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const cc = costCenters.find(c => c.id === ids[0]);
      if (cc) {
        setLinkTarget(cc);
        setLinkMode('link');
        setIsLinkOpen(true);
      }
    },
    [costCenters]
  );

  const handleUnlinkCompany = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const cc = costCenters.find(c => c.id === ids[0]);
      if (cc) {
        setLinkTarget(cc);
        setLinkMode('unlink');
        setIsLinkOpen(true);
      }
    },
    [costCenters]
  );

  const handleLinkConfirm = useCallback(
    async (companyId: string | null) => {
      if (!linkTarget) return;
      try {
        await updateMutation.mutateAsync({
          id: linkTarget.id,
          data: { companyId: companyId ?? undefined },
        });
        toast.success(
          companyId
            ? 'Empresa vinculada com sucesso!'
            : 'Empresa desvinculada com sucesso!'
        );
        setIsLinkOpen(false);
        setLinkTarget(null);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erro ao atualizar centro de custo';
        toast.error(message);
      }
    },
    [linkTarget, updateMutation]
  );

  // ============================================================================
  // CONTEXT MENU ACTIONS
  // ============================================================================

  const contextActions: ContextMenuAction[] = useMemo(() => {
    const actions: ContextMenuAction[] = [];

    // Custom group: Link/Unlink company
    if (canEdit) {
      actions.push({
        id: 'link-company',
        label: 'Vincular Empresa',
        icon: Building2,
        onClick: handleLinkCompany,
        separator: 'before',
        hidden: ids => {
          const cc = costCenters.find(c => c.id === ids[0]);
          return !!cc?.companyId;
        },
      });

      actions.push({
        id: 'unlink-company',
        label: 'Desvincular Empresa',
        icon: Link2Off,
        onClick: handleUnlinkCompany,
        separator: 'before',
        hidden: ids => {
          const cc = costCenters.find(c => c.id === ids[0]);
          return !cc?.companyId;
        },
      });
    }

    // Destructive group: Delete
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, canDelete, costCenters]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: CostCenter, isSelected: boolean) => {
    const monthly = formatCurrency(item.monthlyBudget);
    const annual = formatCurrency(item.annualBudget);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleView : undefined}
        onEdit={canEdit ? handleEdit : undefined}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={item.code}
          icon={Landmark}
          iconBgColor="bg-linear-to-br from-teal-500 to-emerald-600"
          badges={[
            {
              label: item.isActive ? 'Ativo' : 'Inativo',
              variant: item.isActive ? 'default' : 'secondary',
            },
            ...(item.companyName
              ? [
                  {
                    label: item.companyName,
                    variant: 'outline' as const,
                    icon: Building2,
                  },
                ]
              : []),
          ]}
          metadata={
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {(monthly || annual) && (
                <div className="flex items-center gap-3">
                  {monthly && <span>Mensal: {monthly}</span>}
                  {annual && <span>Anual: {annual}</span>}
                </div>
              )}
              {item.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Criado em{' '}
                  {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          }
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: CostCenter, isSelected: boolean) => {
    const monthly = formatCurrency(item.monthlyBudget);
    const annual = formatCurrency(item.annualBudget);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleView : undefined}
        onEdit={canEdit ? handleEdit : undefined}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.name}
          subtitle={item.code}
          icon={Landmark}
          iconBgColor="bg-linear-to-br from-teal-500 to-emerald-600"
          badges={[
            {
              label: item.isActive ? 'Ativo' : 'Inativo',
              variant: item.isActive ? 'default' : 'secondary',
            },
            ...(item.companyName
              ? [
                  {
                    label: item.companyName,
                    variant: 'outline' as const,
                    icon: Building2,
                  },
                ]
              : []),
          ]}
          metadata={
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {monthly && <span>Mensal: {monthly}</span>}
              {annual && <span>Anual: {annual}</span>}
              {item.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          }
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
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

  const actionButtons: HeaderButton[] = useMemo(
    () =>
      canCreate
        ? [
            {
              id: 'create-cost-center',
              title: 'Novo Centro de Custo',
              icon: Plus,
              onClick: handleOpenCreate,
              variant: 'default',
            },
          ]
        : [],
    [canCreate, handleOpenCreate]
  );

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
        namespace: 'cost-centers',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Centros de Custo', href: '/finance/cost-centers' },
            ]}
            buttons={actionButtons}
          />

          <Header
            title="Centros de Custo"
            description="Gerencie os centros de custo da empresa"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            placeholder={costCentersConfig.display.labels.searchPlaceholder}
            onSearch={value => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar centros de custo"
              message="Ocorreu um erro ao tentar carregar os centros de custo. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={costCentersConfig}
              items={filteredItems}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemDoubleClick={item =>
                canView && router.push(`/finance/cost-centers/${item.id}`)
              }
              showSorting={true}
              defaultSortField="name"
              defaultSortDirection="asc"
            />
          )}

          {/* Create Wizard */}
          <CreateCostCenterWizard
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
            nextCode={nextCode}
            costCenters={costCenters}
          />

          {/* Link Company Modal */}
          <LinkCompanyModal
            isOpen={isLinkOpen}
            onClose={() => {
              setIsLinkOpen(false);
              setLinkTarget(null);
            }}
            onConfirm={handleLinkConfirm}
            currentCompanyId={linkTarget?.companyId}
            currentCompanyName={linkTarget?.companyName}
            mode={linkMode}
            isLoading={updateMutation.isPending}
          />

          {/* Delete PIN Verification */}
          <VerifyActionPinModal
            isOpen={isDeletePinOpen}
            onClose={() => {
              setIsDeletePinOpen(false);
              setDeleteTarget(null);
            }}
            onSuccess={handleDeleteConfirm}
            title={'Confirmar Exclus\u00E3o'}
            description={
              'Digite seu PIN de a\u00E7\u00E3o para excluir este centro de custo. Esta a\u00E7\u00E3o n\u00E3o pode ser desfeita.'
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
