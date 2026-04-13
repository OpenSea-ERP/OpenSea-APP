/**
 * OpenSea OS - Customers Page
 * Página de gerenciamento de clientes com infinite scroll e filtros server-side
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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { customersConfig } from '@/config/entities/customers.config';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useCreateCustomer,
  useCustomersInfinite,
  useDeleteCustomer,
} from '@/hooks/sales/use-customers';
import { CreateCustomerWizard } from './src/components/create-customer-wizard';
import type { Customer } from '@/types/sales';
import {
  Building2,
  Loader2,
  Mail,
  Phone,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { useDebounce } from '@/hooks/use-debounce';

// ============================================================================
// TYPES
// ============================================================================

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function CustomersPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <CustomersPageContent />
    </Suspense>
  );
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function CustomersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const typeFilter = useMemo(() => {
    const raw = searchParams.get('type');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>(
    'createdAt'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    customers: customersData,
    total: customersTotal,
    isLoading,
    error,
    refetch,
  } = useCustomersInfinite();

  const createMutation = useCreateCustomer();
  const deleteMutation = useDeleteCustomer();

  // Client-side filtering (until backend supports query params)
  const customers = useMemo(() => {
    let list = customersData ?? [];

    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          (c.document && c.document.toLowerCase().includes(query)) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.phone && c.phone.includes(query))
      );
    }

    // Type filter
    if (typeFilter.length > 0) {
      list = list.filter(c => typeFilter.includes(c.type));
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return list;
  }, [customersData, debouncedSearch, typeFilter, sortBy, sortOrder]);

  const total = customers.length;

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Sentinel ready for when backend supports pagination
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      () => {
        // Will call fetchNextPage when infinite query is implemented
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ============================================================================
  // URL FILTER HELPERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: { type?: string[] }) => {
      const parts: string[] = [];
      const t = params.type !== undefined ? params.type : typeFilter;
      if (t.length > 0) parts.push(`type=${t.join(',')}`);
      return parts.length > 0
        ? `/sales/customers?${parts.join('&')}`
        : '/sales/customers';
    },
    [typeFilter]
  );

  const setTypeFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ type: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  const typeOptions = useMemo(
    () => [
      { id: 'INDIVIDUAL', label: 'Pessoa Física' },
      { id: 'BUSINESS', label: 'Pessoa Jurídica' },
    ],
    []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/customers/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/customers/${ids[0]}/edit`);
    }
  };

  const handleContextDelete = (ids: string[]) => {
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
        ? 'Cliente excluído com sucesso!'
        : `${itemsToDelete.length} clientes excluídos!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Customer, isSelected: boolean) => {
    const isCompany = item.type === 'BUSINESS';
    const typeLabel = isCompany ? 'Pessoa Jurídica' : 'Pessoa Física';
    const statusLabel = item.isActive ? 'Ativo' : 'Inativo';

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          customersConfig.permissions.update &&
          hasPermission(customersConfig.permissions.update)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(customersConfig.permissions.delete)
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
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={item.document || 'Documento não informado'}
          icon={isCompany ? Building2 : User}
          iconBgColor={
            isCompany
              ? 'bg-linear-to-br from-violet-500 to-purple-600'
              : 'bg-linear-to-br from-blue-500 to-indigo-600'
          }
          badges={[
            {
              label: typeLabel,
              variant: 'default',
            },
            ...(!item.isActive
              ? [
                  {
                    label: statusLabel,
                    variant: 'secondary' as const,
                  },
                ]
              : []),
          ]}
          footer={
            item.email || item.phone
              ? {
                  type: 'single' as const,
                  button: {
                    icon: item.email ? Mail : Phone,
                    label: item.email || item.phone || '',
                    onClick: () => {},
                    color: 'secondary' as const,
                  },
                }
              : undefined
          }
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Customer, isSelected: boolean) => {
    const isCompany = item.type === 'BUSINESS';
    const typeLabel = isCompany ? 'PJ' : 'PF';

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof User;
      color: string;
    }[] = [
      {
        label: typeLabel,
        variant: 'outline',
        icon: isCompany ? Building2 : User,
        color: isCompany
          ? 'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300'
          : 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
      },
      ...(item.document
        ? [
            {
              label: item.document,
              variant: 'outline' as const,
              color:
                'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
            },
          ]
        : []),
      ...(item.email
        ? [
            {
              label: item.email,
              variant: 'outline' as const,
              icon: Mail as typeof User,
              color:
                'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
            },
          ]
        : []),
      ...(!item.isActive
        ? [
            {
              label: 'Inativo',
              variant: 'outline' as const,
              color:
                'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
            },
          ]
        : []),
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          customersConfig.permissions.update &&
          hasPermission(customersConfig.permissions.update)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(customersConfig.permissions.delete)
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
          id={item.id}
          variant="list"
          title={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {item.name}
              </span>
              {item.phone && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {item.phone}
                </span>
              )}
            </span>
          }
          metadata={
            <div className="flex items-center gap-1.5 mt-0.5">
              {listBadges.map((badge, i) => (
                <span
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border shrink-0',
                    badge.color
                  )}
                >
                  {badge.icon && <badge.icon className="w-3 h-3" />}
                  {badge.label}
                </span>
              ))}
            </div>
          }
          icon={isCompany ? Building2 : User}
          iconBgColor={
            isCompany
              ? 'bg-linear-to-br from-violet-500 to-purple-600'
              : 'bg-linear-to-br from-blue-500 to-indigo-600'
          }
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const initialIds = useMemo(() => customers.map(i => i.id), [customers]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-customer',
        title: 'Novo Cliente',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: customersConfig.permissions.create,
      },
    ],
    [handleCreate]
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
        namespace: 'customers',
        initialIds,
      }}
    >
      <PageLayout data-testid="customers-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Clientes', href: '/sales/customers' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Clientes"
            description="Gerencie a base de clientes do CRM"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={customersConfig.display.labels.searchPlaceholder}
            value={searchQuery}
            onSearch={setSearchQuery}
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
              title="Erro ao carregar clientes"
              message="Ocorreu um erro ao tentar carregar os clientes. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <>
              <EntityGrid
                config={customersConfig}
                items={customers}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Tipo"
                      icon={User}
                      options={typeOptions}
                      selected={typeFilter}
                      onSelectionChange={setTypeFilter}
                      activeColor="violet"
                      searchPlaceholder="Buscar tipo..."
                      emptyText="Nenhum tipo encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'cliente' : 'clientes'}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/sales/customers/${item.id}`)
                }
                showSorting={true}
                defaultSortField="createdAt"
                defaultSortDirection="desc"
                onSortChange={(field, direction) => {
                  if (field !== 'custom') {
                    setSortBy(field as 'name' | 'createdAt' | 'updatedAt');
                    setSortOrder(direction);
                  }
                }}
              />

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-1" />
            </>
          )}

          {/* Delete Confirmation */}
          <CreateCustomerWizard
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={async data => {
              await createMutation.mutateAsync(data);
              toast.success('Cliente criado com sucesso!');
            }}
            isSubmitting={createMutation.isPending}
          />

          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description={
              itemsToDelete.length === 1
                ? 'Digite seu PIN de ação para excluir este cliente. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${itemsToDelete.length} clientes. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
