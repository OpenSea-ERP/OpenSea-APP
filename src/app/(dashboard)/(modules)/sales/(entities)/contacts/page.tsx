/**
 * OpenSea OS - Contacts Page
 * Pagina de gerenciamento de contatos com infinite scroll e filtros server-side
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
import { contactsConfig } from '@/config/entities/contacts.config';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useContactsInfinite,
  useDeleteContact,
} from '@/hooks/sales/use-contacts';
import type {
  Contact,
  LeadTemperature,
  LifecycleStage,
} from '@/types/sales';
import {
  LIFECYCLE_STAGE_LABELS,
  LEAD_TEMPERATURE_LABELS,
  CONTACT_ROLE_LABELS,
} from '@/types/sales';
import type { ContactRole } from '@/types/sales';
import {
  Flame,
  Mail,
  Phone,
  Plus,
  Snowflake,
  Sun,
  Trash2,
  UserCircle,
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
// HELPERS
// ============================================================================

const LIFECYCLE_STAGE_COLORS: Record<LifecycleStage, string> = {
  LEAD: 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  MQL: 'border-blue-600/25 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8 text-blue-700 dark:text-blue-300',
  SQL: 'border-indigo-600/25 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/8 text-indigo-700 dark:text-indigo-300',
  OPPORTUNITY:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  CUSTOMER:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  EVANGELIST:
    'border-purple-600/25 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/8 text-purple-700 dark:text-purple-300',
  CHURNED:
    'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
};

function getLeadTemperatureIndicator(temp?: LeadTemperature) {
  switch (temp) {
    case 'HOT':
      return { icon: Flame, label: 'Quente', color: 'text-rose-500' };
    case 'WARM':
      return { icon: Sun, label: 'Morno', color: 'text-amber-500' };
    case 'COLD':
      return { icon: Snowflake, label: 'Frio', color: 'text-blue-500' };
    default:
      return null;
  }
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] || '?').toUpperCase();
}

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function ContactsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <ContactsPageContent />
    </Suspense>
  );
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function ContactsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const lifecycleFilter = useMemo(() => {
    const raw = searchParams.get('lifecycleStage');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const temperatureFilter = useMemo(() => {
    const raw = searchParams.get('leadTemperature');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const roleFilter = useMemo(() => {
    const raw = searchParams.get('role');
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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    contacts,
    total,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useContactsInfinite({
    search: debouncedSearch || undefined,
    lifecycleStage: (lifecycleFilter[0] as LifecycleStage) || undefined,
    leadTemperature: (temperatureFilter[0] as LeadTemperature) || undefined,
    sortBy: sortBy === 'name' ? 'firstName' : sortBy,
    sortOrder,
  });

  const deleteMutation = useDeleteContact();

  // Client-side role filter (backend may not support it)
  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (roleFilter.length > 0) {
      list = list.filter(c => c.role && roleFilter.includes(c.role));
    }
    return list;
  }, [contacts, roleFilter]);

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // URL FILTER HELPERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: {
      lifecycleStage?: string[];
      leadTemperature?: string[];
      role?: string[];
    }) => {
      const parts: string[] = [];
      const lc =
        params.lifecycleStage !== undefined
          ? params.lifecycleStage
          : lifecycleFilter;
      const lt =
        params.leadTemperature !== undefined
          ? params.leadTemperature
          : temperatureFilter;
      const rl = params.role !== undefined ? params.role : roleFilter;
      if (lc.length > 0) parts.push(`lifecycleStage=${lc.join(',')}`);
      if (lt.length > 0) parts.push(`leadTemperature=${lt.join(',')}`);
      if (rl.length > 0) parts.push(`role=${rl.join(',')}`);
      return parts.length > 0
        ? `/sales/contacts?${parts.join('&')}`
        : '/sales/contacts';
    },
    [lifecycleFilter, temperatureFilter, roleFilter]
  );

  const setLifecycleFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ lifecycleStage: ids })),
    [router, buildFilterUrl]
  );

  const setTemperatureFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ leadTemperature: ids })),
    [router, buildFilterUrl]
  );

  const setRoleFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ role: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  const lifecycleOptions = useMemo(
    () =>
      Object.entries(LIFECYCLE_STAGE_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  const temperatureOptions = useMemo(
    () =>
      Object.entries(LEAD_TEMPERATURE_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  const roleOptions = useMemo(
    () =>
      Object.entries(CONTACT_ROLE_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/contacts/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/contacts/${ids[0]}/edit`);
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
        ? 'Contato excluido com sucesso!'
        : `${itemsToDelete.length} contatos excluidos!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Contact, isSelected: boolean) => {
    const stageLabel =
      LIFECYCLE_STAGE_LABELS[item.lifecycleStage] || item.lifecycleStage;
    const tempIndicator = getLeadTemperatureIndicator(item.leadTemperature);
    const roleLabel = item.role ? CONTACT_ROLE_LABELS[item.role] : undefined;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          hasPermission(contactsConfig.permissions.update)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(contactsConfig.permissions.delete)
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
          title={item.fullName}
          subtitle={item.email || item.jobTitle || 'Sem e-mail'}
          icon={UserCircle}
          iconBgColor="bg-linear-to-br from-teal-500 to-emerald-600"

          badges={[
            {
              label: stageLabel,
              variant: 'default',
            },
            ...(roleLabel
              ? [
                  {
                    label: roleLabel,
                    variant: 'secondary' as const,
                  },
                ]
              : []),
            ...(tempIndicator
              ? [
                  {
                    label: tempIndicator.label,
                    variant: 'outline' as const,
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

  const renderListCard = (item: Contact, isSelected: boolean) => {
    const stageColor =
      LIFECYCLE_STAGE_COLORS[item.lifecycleStage] || LIFECYCLE_STAGE_COLORS.LEAD;
    const stageLabel =
      LIFECYCLE_STAGE_LABELS[item.lifecycleStage] || item.lifecycleStage;
    const tempIndicator = getLeadTemperatureIndicator(item.leadTemperature);
    const roleLabel = item.role ? CONTACT_ROLE_LABELS[item.role] : undefined;

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof UserCircle;
      color: string;
    }[] = [
      {
        label: stageLabel,
        variant: 'outline',
        color: stageColor,
      },
      ...(roleLabel
        ? [
            {
              label: roleLabel,
              variant: 'outline' as const,
              color:
                'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
            },
          ]
        : []),
      ...(tempIndicator
        ? [
            {
              label: tempIndicator.label,
              variant: 'outline' as const,
              icon: tempIndicator.icon as typeof UserCircle,
              color:
                tempIndicator.color === 'text-rose-500'
                  ? 'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300'
                  : tempIndicator.color === 'text-amber-500'
                    ? 'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300'
                    : 'border-blue-600/25 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8 text-blue-700 dark:text-blue-300',
            },
          ]
        : []),
      ...(item.email
        ? [
            {
              label: item.email,
              variant: 'outline' as const,
              icon: Mail as typeof UserCircle,
              color:
                'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
            },
          ]
        : []),
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          hasPermission(contactsConfig.permissions.update)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(contactsConfig.permissions.delete)
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
                {item.fullName}
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
          icon={UserCircle}
          iconBgColor="bg-linear-to-br from-teal-500 to-emerald-600"
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

  const initialIds = useMemo(
    () => filteredContacts.map(i => i.id),
    [filteredContacts]
  );

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleCreate = useCallback(() => {
    router.push('/sales/contacts/new');
  }, [router]);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-contact',
        title: 'Novo Contato',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: contactsConfig.permissions.create,
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
        namespace: 'contacts',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Contatos', href: '/sales/contacts' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Contatos"
            description="Gerencie os contatos do CRM"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={contactsConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar contatos"
              message="Ocorreu um erro ao tentar carregar os contatos. Por favor, tente novamente."
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
                config={contactsConfig}
                items={filteredContacts}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Estagio"
                      icon={UserCircle}
                      options={lifecycleOptions}
                      selected={lifecycleFilter}
                      onSelectionChange={setLifecycleFilter}
                      activeColor="teal"
                      searchPlaceholder="Buscar estagio..."
                      emptyText="Nenhum estagio encontrado."
                    />
                    <FilterDropdown
                      label="Temperatura"
                      icon={Flame}
                      options={temperatureOptions}
                      selected={temperatureFilter}
                      onSelectionChange={setTemperatureFilter}
                      activeColor="amber"
                      searchPlaceholder="Buscar temperatura..."
                      emptyText="Nenhuma temperatura encontrada."
                    />
                    <FilterDropdown
                      label="Papel"
                      icon={UserCircle}
                      options={roleOptions}
                      selected={roleFilter}
                      onSelectionChange={setRoleFilter}
                      activeColor="violet"
                      searchPlaceholder="Buscar papel..."
                      emptyText="Nenhum papel encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'contato' : 'contatos'}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/sales/contacts/${item.id}`)
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
          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusao"
            description={
              itemsToDelete.length === 1
                ? 'Digite seu PIN de acao para excluir este contato. Esta acao nao pode ser desfeita.'
                : `Digite seu PIN de acao para excluir ${itemsToDelete.length} contatos. Esta acao nao pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
