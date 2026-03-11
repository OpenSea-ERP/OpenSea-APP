/**
 * OpenSea OS - Companies Page
 * Listagem e gerenciamento das empresas
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
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
  SelectionToolbar,
  useEntityCrud,
  useEntityPage,
} from '@/core';
import { formatCNPJ } from '@/helpers/formatters';
import { usePermissions } from '@/hooks/use-permissions';
import type { BrasilAPICompanyData } from '@/types/brasilapi';
import type { Company } from '@/types/hr';
import {
  ArrowDownAZ,
  Building2,
  Calendar,
  Clock,
  Plus,
  Upload,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  companiesApi,
  companiesConfig,
  createCompany,
  deleteCompany,
  duplicateCompany,
  updateCompany,
} from './src';

const CNPJLookupModal = dynamic(
  () =>
    import('./src/modals/cnpj-lookup-modal').then(m => ({
      default: m.CNPJLookupModal,
    })),
  { ssr: false }
);
const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);
const EditModal = dynamic(
  () => import('./src/modals/edit-modal').then(m => ({ default: m.EditModal })),
  { ssr: false }
);
const ViewModal = dynamic(
  () => import('./src/modals/view-modal').then(m => ({ default: m.ViewModal })),
  { ssr: false }
);
const DeleteConfirmModal = dynamic(
  () =>
    import('./src/modals/delete-confirm-modal').then(m => ({
      default: m.DeleteConfirmModal,
    })),
  { ssr: false }
);
const DuplicateConfirmModal = dynamic(
  () =>
    import('./src/modals/duplicate-confirm-modal').then(m => ({
      default: m.DuplicateConfirmModal,
    })),
  { ssr: false }
);
import { createCompanyFromBrasilAPI } from './src/utils/create-from-brasilapi';

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

export default function CompaniesPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [isCnpjModalOpen, setIsCnpjModalOpen] = useState(false);

  // ============================================================================
  // CRUD SETUP
  // ============================================================================

  const crud = useEntityCrud<Company>({
    entityName: 'Empresa',
    entityNamePlural: 'Empresas',
    queryKey: ['companies'],
    baseUrl: '/api/v1/admin/companies',
    listFn: async () => {
      try {
        const response = await companiesApi.list({
          perPage: 100,
          includeDeleted: false,
        });

        // A resposta pode ser um array direto ou um objeto com propriedade 'companies'
        let companies = Array.isArray(response)
          ? response
          : response.companies || [];

        // Filtrar empresas deletadas no frontend como camada extra de seguranca
        companies = companies.filter((company: Company) => !company.deletedAt);

        return companies;
      } catch (error) {
        throw error;
      }
    },
    getFn: (id: string) => companiesApi.get(id),
    createFn: createCompany,
    updateFn: updateCompany,
    deleteFn: deleteCompany,
    duplicateFn: duplicateCompany,
    onDeleteSuccess: () => {
      // Deleted successfully
    },
  });

  // ============================================================================
  // PAGE SETUP
  // ============================================================================

  const page = useEntityPage<Company>({
    entityName: 'Empresa',
    entityNamePlural: 'Empresas',
    queryKey: ['companies'],
    crud,
    viewRoute: id => `/admin/companies/${id}`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      const legal = item.legalName?.toLowerCase() || '';
      const trade = item.tradeName?.toLowerCase() || '';
      const cnpj = item.cnpj?.toLowerCase() || '';
      return [legal, trade, cnpj].some(value => value.includes(q));
    },
    duplicateConfig: {
      getNewName: item => `${item.legalName} (Cópia)`,
      getData: item => ({
        legalName: `${item.legalName} (Cópia)`,
        tradeName: item.tradeName ? `${item.tradeName} (Cópia)` : null,
        cnpj: item.cnpj,
        status: item.status,
      }),
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) =>
    page.handlers.handleItemsView(ids);
  const handleContextEdit = (ids: string[]) =>
    page.handlers.handleItemsEdit(ids);
  const handleContextDuplicate = (ids: string[]) =>
    page.handlers.handleItemsDuplicate(ids);
  const handleContextDelete = (ids: string[]) => {
    page.modals.setItemsToDelete(ids);
    page.modals.open('delete');
  };

  // Opcoes customizadas de ordenacao
  const sortOptions = useMemo(
    () => [
      {
        field: 'custom' as const,
        direction: 'asc' as const,
        label: 'Razao Social (A-Z)',
        icon: ArrowDownAZ,
      },
      {
        field: 'custom' as const,
        direction: 'desc' as const,
        label: 'Razao Social (Z-A)',
        icon: ArrowDownAZ,
      },
      {
        field: 'createdAt' as const,
        direction: 'desc' as const,
        label: 'Mais recentes',
        icon: Calendar,
      },
      {
        field: 'createdAt' as const,
        direction: 'asc' as const,
        label: 'Mais antigos',
        icon: Calendar,
      },
      {
        field: 'updatedAt' as const,
        direction: 'desc' as const,
        label: 'Ultima atualizacao',
        icon: Clock,
      },
    ],
    []
  );

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Company, isSelected: boolean) => {
    const departmentsCount = item._count?.departments ?? 0;
    const employeesCount = item._count?.employees ?? 0;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={handleContextEdit}
        onDuplicate={handleContextDuplicate}
        onDelete={handleContextDelete}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.tradeName || '—'}
          subtitle={formatCNPJ(item.cnpj)}
          icon={Building2}
          iconBgColor="bg-linear-to-br from-emerald-500 to-teal-600"
          badges={[
            ...(employeesCount > 0
              ? [
                  {
                    label: `${employeesCount} funcionario${employeesCount > 1 ? 's' : ''}`,
                    variant: 'secondary' as const,
                    icon: Users,
                  },
                ]
              : []),
            {
              label:
                item.status === 'ACTIVE'
                  ? 'Ativa'
                  : item.status === 'INACTIVE'
                    ? 'Inativa'
                    : 'Suspensa',
              variant: item.status === 'ACTIVE' ? 'default' : 'secondary',
            },
          ]}
          footer={{
            type: 'single',
            button: {
              icon: Building2,
              label: `${departmentsCount} departamento${departmentsCount !== 1 ? 's' : ''}`,
              href: `/hr/departments?company=${item.id}`,
              color: 'emerald',
            },
          }}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        >
          {item.legalName && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {item.legalName}
            </p>
          )}
        </EntityCard>
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Company, isSelected: boolean) => {
    const departmentsCount = item._count?.departments ?? 0;
    const employeesCount = item._count?.employees ?? 0;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={handleContextEdit}
        onDuplicate={handleContextDuplicate}
        onDelete={handleContextDelete}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.tradeName || '—'}
          subtitle={formatCNPJ(item.cnpj)}
          icon={Building2}
          iconBgColor="bg-linear-to-br from-emerald-500 to-teal-600"
          badges={[
            ...(employeesCount > 0
              ? [
                  {
                    label: `${employeesCount} funcionario${employeesCount > 1 ? 's' : ''}`,
                    variant: 'secondary' as const,
                    icon: Users,
                  },
                ]
              : []),
            {
              label:
                item.status === 'ACTIVE'
                  ? 'Ativa'
                  : item.status === 'INACTIVE'
                    ? 'Inativa'
                    : 'Suspensa',
              variant: item.status === 'ACTIVE' ? 'default' : 'secondary',
            },
          ]}
          footer={{
            type: 'single',
            button: {
              icon: Building2,
              label: `${departmentsCount} departamento${departmentsCount !== 1 ? 's' : ''}`,
              href: `/hr/departments?company=${item.id}`,
              color: 'emerald',
            },
          }}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        >
          {item.legalName && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {item.legalName}
            </p>
          )}
        </EntityCard>
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const selectedIds = Array.from(page.selection?.state.selectedIds || []);
  const hasSelection = selectedIds.length > 0;

  const initialIds = useMemo(
    () => page.filteredItems.map(i => i.id),
    [page.filteredItems]
  );

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION
  // ============================================================================

  const handleCreate = useCallback(() => {
    setIsCnpjModalOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'import-companies',
        title: 'Importar',
        icon: Upload,
        onClick: () => router.push('/import/admin/companies'),
        variant: 'outline',
        permission: companiesConfig.permissions?.import,
      },
      {
        id: 'create-company',
        title: 'Nova Empresa',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: companiesConfig.permissions?.create,
      },
    ],
    [router, handleCreate]
  );

  const visibleActionButtons = useMemo<HeaderButton[]>(
    () =>
      actionButtons
        .filter(button =>
          button.permission ? hasPermission(button.permission) : true
        )
        .map(({ permission, ...button }) => button),
    [actionButtons, hasPermission]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'companies',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Administração', href: '/admin' },
              { label: 'Empresas', href: '/admin/companies' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Empresas"
            description="Gerencie dados cadastrais das empresas"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={companiesConfig.display.labels.searchPlaceholder}
            value={page.searchQuery}
            onSearch={value => page.setSearchQuery(value)}
            showClear={true}
            size="md"
          />

          {/* Grid */}
          {page.isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : page.error ? (
            <GridError
              type="server"
              title="Erro ao carregar empresas"
              message="Ocorreu um erro ao tentar carregar as empresas. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => crud.refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={companiesConfig}
              items={page.filteredItems}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={page.isLoading}
              isSearching={!!page.searchQuery}
              onItemClick={(item, e) => page.handlers.handleItemClick(item, e)}
              onItemDoubleClick={item =>
                page.handlers.handleItemDoubleClick(item)
              }
              showSorting={true}
              defaultSortField="custom"
              defaultSortDirection="asc"
              customSortOptions={sortOptions}
              customSortFn={(a, b, direction) => {
                const multiplier = direction === 'asc' ? 1 : -1;
                const nameA = a.legalName?.toLowerCase() ?? '';
                const nameB = b.legalName?.toLowerCase() ?? '';
                return nameA.localeCompare(nameB, 'pt-BR') * multiplier;
              }}
            />
          )}

          {/* Selection Toolbar */}
          {hasSelection && (
            <SelectionToolbar
              selectedIds={selectedIds}
              totalItems={page.filteredItems.length}
              onClear={() => page.selection?.actions.clear()}
              onSelectAll={() => page.selection?.actions.selectAll()}
              defaultActions={{
                view: true,
                edit: true,
                duplicate: true,
                delete: true,
              }}
              handlers={{
                onView: page.handlers.handleItemsView,
                onEdit: page.handlers.handleItemsEdit,
                onDuplicate: page.handlers.handleItemsDuplicate,
                onDelete: page.handlers.handleItemsDelete,
              }}
            />
          )}

          {/* View Modal */}
          <ViewModal
            isOpen={page.modals.isOpen('view')}
            onClose={() => page.modals.close('view')}
            company={page.modals.viewingItem}
          />

          {/* Create Modal */}
          <CreateModal
            isOpen={page.modals.isOpen('create')}
            onClose={() => page.modals.close('create')}
            isSubmitting={crud.isCreating}
            onSubmit={async data => {
              await crud.create(data);
            }}
          />

          {/* Edit Modal */}
          <EditModal
            isOpen={page.modals.isOpen('edit')}
            onClose={() => page.modals.close('edit')}
            company={page.modals.editingItem}
            isSubmitting={crud.isUpdating}
            onSubmit={async (id, data) => {
              await crud.update(id, data);
            }}
          />

          {/* Delete Confirmation */}
          <DeleteConfirmModal
            isOpen={page.modals.isOpen('delete')}
            onClose={() => page.modals.close('delete')}
            itemCount={page.modals.itemsToDelete.length}
            onConfirm={page.handlers.handleDeleteConfirm}
            isLoading={crud.isDeleting}
          />

          {/* Duplicate Confirmation */}
          <DuplicateConfirmModal
            isOpen={page.modals.isOpen('duplicate')}
            onClose={() => page.modals.close('duplicate')}
            itemCount={page.modals.itemsToDuplicate.length}
            onConfirm={page.handlers.handleDuplicateConfirm}
            isLoading={crud.isDuplicating}
          />

          {/* CNPJ Lookup Modal */}
          <CNPJLookupModal
            isOpen={isCnpjModalOpen}
            onClose={() => setIsCnpjModalOpen(false)}
            onImport={async (brasilData: BrasilAPICompanyData) => {
              try {
                const company = await createCompanyFromBrasilAPI(brasilData);
                toast.success(
                  `Empresa "${company.legalName}" criada com sucesso!`
                );

                // Fechar modal e atualizar listagem
                setIsCnpjModalOpen(false);
                await crud.refetch();
                page.setSearchQuery(''); // Limpar busca para ver a nova empresa
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : 'Erro ao criar empresa';
                toast.error(message);
              }
            }}
            onCreateManually={() => {
              setIsCnpjModalOpen(false);
              page.modals.open('create');
            }}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
