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
import type { CipaMandate } from '@/types/hr';
import {
  Calendar,
  ExternalLink,
  Plus,
  Shield,
  Trash2,
  Vote,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import {
  cipaConfig,
  useListCipaMandates,
  useCreateCipaMandate,
  useDeleteCipaMandate,
  formatDate,
  getMandateStatusLabel,
  getMandateStatusVariant,
  type CipaMandateFilters,
} from './src';

import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';

const CreateMandateModal = dynamic(
  () =>
    import('./src/modals/create-mandate-modal').then(m => ({
      default: m.CreateMandateModal,
    })),
  { ssr: false }
);

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'EXPIRED', label: 'Encerrado' },
  { value: 'DRAFT', label: 'Rascunho' },
];

export default function CipaPage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  // Permissions
  const canView = hasPermission(HR_PERMISSIONS.CIPA.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.CIPA.CREATE);
  const canDelete = hasPermission(HR_PERMISSIONS.CIPA.DELETE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const queryParams = useMemo<CipaMandateFilters>(() => {
    const params: CipaMandateFilters = {};
    if (filterStatus) params.status = filterStatus;
    return params;
  }, [filterStatus]);

  // ============================================================================
  // DATA
  // ============================================================================

  const { data, isLoading, error, refetch } = useListCipaMandates(queryParams);
  const createMutation = useCreateCipaMandate();
  const deleteMutation = useDeleteCipaMandate();

  const mandates = data?.mandates ?? [];

  // ============================================================================
  // STATE
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return mandates;
    const q = searchQuery.toLowerCase();
    return mandates.filter(m => {
      const name = m.name?.toLowerCase() ?? '';
      return name.includes(q);
    });
  }, [mandates, searchQuery]);

  const initialIds = useMemo(
    () => filteredItems.map(i => i.id),
    [filteredItems]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreate = useCallback(
    async (data: Parameters<typeof createMutation.mutateAsync>[0]) => {
      await createMutation.mutateAsync(data);
      setIsCreateOpen(false);
    },
    [createMutation]
  );

  const handleDeleteRequest = useCallback((ids: string[]) => {
    if (ids.length > 0) {
      setDeleteTarget(ids[0]);
      setIsDeleteOpen(true);
    }
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      setDeleteTarget(null);
      setIsDeleteOpen(false);
    } catch {
      // Toast handled by mutation
    }
  }, [deleteTarget, deleteMutation]);

  // ============================================================================
  // CONTEXT MENU ACTIONS
  // ============================================================================

  const contextActions: ContextMenuAction[] = useMemo(() => {
    const actions: ContextMenuAction[] = [];

    if (canView) {
      actions.push({
        id: 'open',
        label: 'Abrir',
        icon: ExternalLink,
        onClick: (ids: string[]) => {
          if (ids.length > 0) router.push(`/hr/cipa/${ids[0]}`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, canDelete]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: CipaMandate, isSelected: boolean) => {
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={
          canView
            ? (ids: string[]) => {
                if (ids.length > 0) router.push(`/hr/cipa/${ids[0]}`);
              }
            : undefined
        }
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={`${formatDate(item.startDate)} — ${formatDate(item.endDate)}`}
          icon={Shield}
          iconBgColor="bg-linear-to-br from-amber-500 to-amber-600"
          badges={[
            {
              label: getMandateStatusLabel(item.status),
              variant: getMandateStatusVariant(item.status),
            },
          ]}
          metadata={
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(item.startDate)} — {formatDate(item.endDate)}
              </span>
              {item.electionDate && (
                <span className="flex items-center gap-1">
                  <Vote className="h-3 w-3" />
                  Eleição: {formatDate(item.electionDate)}
                </span>
              )}
            </div>
          }
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/cipa/${item.id}`)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: CipaMandate, isSelected: boolean) => {
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={
          canView
            ? (ids: string[]) => {
                if (ids.length > 0) router.push(`/hr/cipa/${ids[0]}`);
              }
            : undefined
        }
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.name}
          subtitle={`${formatDate(item.startDate)} — ${formatDate(item.endDate)}`}
          icon={Shield}
          iconBgColor="bg-linear-to-br from-amber-500 to-amber-600"
          badges={[
            {
              label: getMandateStatusLabel(item.status),
              variant: getMandateStatusVariant(item.status),
            },
          ]}
          metadata={
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(item.startDate)} — {formatDate(item.endDate)}
              </span>
              {item.electionDate && (
                <span className="flex items-center gap-1">
                  <Vote className="h-3 w-3" />
                  Eleição: {formatDate(item.electionDate)}
                </span>
              )}
            </div>
          }
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/cipa/${item.id}`)}
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
        id: 'create-mandate',
        title: 'Novo Mandato',
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

  const hasActiveFilters = !!filterStatus;

  const clearFilters = useCallback(() => {
    setFilterStatus('');
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
        namespace: 'cipa',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'CIPA', href: '/hr/cipa' },
            ]}
            buttons={actionButtons}
          />

          <Header
            title="CIPA"
            description="Comissão Interna de Prevenção de Acidentes — mandatos e membros"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            placeholder={cipaConfig.display.labels.searchPlaceholder}
            onSearch={value => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={filterStatus || 'ALL'}
              onValueChange={v => setFilterStatus(v === 'ALL' ? '' : v)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Status</SelectItem>
                {STATUS_OPTIONS.map(opt => (
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
              title="Erro ao carregar mandatos da CIPA"
              message="Ocorreu um erro ao tentar carregar os mandatos. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={cipaConfig}
              items={filteredItems}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemDoubleClick={item => {
                if (canView) {
                  router.push(`/hr/cipa/${item.id}`);
                }
              }}
              showSorting={true}
              defaultSortField="createdAt"
              defaultSortDirection="desc"
            />
          )}

          {/* Create Modal */}
          <CreateMandateModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleCreate}
          />

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={isDeleteOpen}
            onClose={() => {
              setIsDeleteOpen(false);
              setDeleteTarget(null);
            }}
            onSuccess={handleDeleteConfirm}
            title="Excluir Mandato da CIPA"
            description="Digite seu PIN de ação para excluir este mandato. Esta ação não pode ser desfeita."
          />

          <HRSelectionToolbar
            totalItems={filteredItems.length}
            defaultActions={{
              delete: canDelete,
            }}
            handlers={{
              onDelete: async (ids: string[]) => {
                for (const id of ids) {
                  await deleteMutation.mutateAsync(id);
                }
              },
            }}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
