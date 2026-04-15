/**
 * HR Announcements Management Page
 * Gestão de comunicados da empresa
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { GridError } from '@/components/handlers/grid-error';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { usePermissions } from '@/hooks/use-permissions';
import { portalService } from '@/services/hr';
import type {
  CompanyAnnouncement,
  AnnouncementPriority,
  CreateAnnouncementData,
} from '@/types/hr';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Bell,
  Info,
  Loader2,
  Megaphone,
  Plus,
} from 'lucide-react';
import dynamic from 'next/dynamic';
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

const CreateAnnouncementModal = dynamic(
  () =>
    import('./src/modals/create-announcement-modal').then(m => ({
      default: m.CreateAnnouncementModal,
    })),
  { ssr: false }
);

// ============================================================================
// CONSTANTS
// ============================================================================

const PRIORITY_CONFIG: Record<
  AnnouncementPriority,
  {
    label: string;
    icon: LucideIcon;
    badgeClass: string;
    gradient: string;
  }
> = {
  URGENT: {
    label: 'Urgente',
    icon: AlertTriangle,
    badgeClass:
      'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300',
    gradient: 'from-rose-500 to-rose-600',
  },
  IMPORTANT: {
    label: 'Importante',
    icon: Info,
    badgeClass:
      'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
    gradient: 'from-amber-500 to-amber-600',
  },
  NORMAL: {
    label: 'Normal',
    icon: Bell,
    badgeClass:
      'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300',
    gradient: 'from-blue-500 to-blue-600',
  },
};

const PRIORITY_FILTER_OPTIONS = [
  { id: 'NORMAL', label: 'Normal' },
  { id: 'IMPORTANT', label: 'Importante' },
  { id: 'URGENT', label: 'Urgente' },
];

export default function AnnouncementsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="grid" size="md" gap="gap-4" />}
    >
      <AnnouncementsPageContent />
    </Suspense>
  );
}

function AnnouncementsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission(HR_PERMISSIONS.EMPLOYEES.MANAGE);
  const canEdit = hasPermission(HR_PERMISSIONS.EMPLOYEES.MANAGE);
  const canDelete = hasPermission(HR_PERMISSIONS.EMPLOYEES.MANAGE);

  // ============================================================================
  // STATE
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // URL-BASED FILTERS
  // ============================================================================

  const priorityFilter = useMemo(() => {
    const raw = searchParams.get('priority');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const buildFilterUrl = useCallback(
    (params: { priority?: string[] }) => {
      const priorities =
        params.priority !== undefined ? params.priority : priorityFilter;
      const parts: string[] = [];
      if (priorities.length > 0) parts.push(`priority=${priorities.join(',')}`);
      return parts.length > 0
        ? `/hr/announcements?${parts.join('&')}`
        : '/hr/announcements';
    },
    [priorityFilter]
  );

  const setPriorityFilter = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ priority: ids }));
    },
    [router, buildFilterUrl]
  );

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const PAGE_SIZE = 20;

  const {
    data: infiniteData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['hr-announcements'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await portalService.listAnnouncements({
        page: pageParam,
        perPage: PAGE_SIZE,
      });
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.meta?.page ?? 1;
      const totalPages = lastPage.meta?.totalPages ?? 1;
      if (currentPage < totalPages) {
        return currentPage + 1;
      }
      return undefined;
    },
  });

  const announcementsData =
    infiniteData?.pages.flatMap(p => p.announcements) ?? [];

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

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const createMutation = useMutation({
    mutationFn: (data: CreateAnnouncementData) =>
      portalService.createAnnouncement(data),
    onSuccess: () => {
      toast.success('Comunicado criado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
    },
    onError: () => {
      toast.error('Erro ao criar comunicado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => portalService.deleteAnnouncement(id),
    onSuccess: () => {
      toast.success('Comunicado excluído com sucesso');
      queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
    },
    onError: () => {
      toast.error('Erro ao excluir comunicado');
    },
  });

  // ============================================================================
  // FILTERED ITEMS
  // ============================================================================

  const filteredItems = useMemo(() => {
    let items = announcementsData;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        item =>
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          (item.authorEmployee?.fullName &&
            item.authorEmployee.fullName.toLowerCase().includes(q))
      );
    }

    // Priority filter
    if (priorityFilter.length > 0) {
      const set = new Set(priorityFilter);
      items = items.filter(item => set.has(item.priority));
    }

    return items;
  }, [announcementsData, searchQuery, priorityFilter]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/hr/announcements/${ids[0]}`);
    }
  };

  const handleEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/hr/announcements/${ids[0]}/edit`);
    }
  };

  const handleDelete = (ids: string[]) => {
    setDeleteTargetIds(ids);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    for (const id of deleteTargetIds) {
      await deleteMutation.mutateAsync(id);
    }
    setIsDeleteOpen(false);
    setDeleteTargetIds([]);
  };

  // ============================================================================
  // RENDER CARDS
  // ============================================================================

  const renderGridCard = (item: CompanyAnnouncement, isSelected: boolean) => {
    const config = PRIORITY_CONFIG[item.priority];
    const PriorityIcon = config.icon;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleView}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.title}
          subtitle={
            item.content.length > 80
              ? `${item.content.substring(0, 80)}...`
              : item.content
          }
          icon={Megaphone}
          iconBgColor={`bg-linear-to-br ${config.gradient}`}
          badges={[
            {
              label: config.label,
              variant: 'outline',
            },
            ...(item.isActive
              ? []
              : [
                  {
                    label: 'Inativo' as string,
                    variant: 'secondary' as const,
                  },
                ]),
          ]}
          footer={{
            type: 'single' as const,
            button: {
              icon: Megaphone,
              label: `Publicado em ${new Date(item.publishedAt).toLocaleDateString('pt-BR')}`,
              color: 'violet',
            },
          }}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          showStatusBadges={false}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: CompanyAnnouncement, isSelected: boolean) => {
    const config = PRIORITY_CONFIG[item.priority];
    const PriorityIcon = config.icon;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleView}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.title}
          subtitle={
            item.content.length > 120
              ? `${item.content.substring(0, 120)}...`
              : item.content
          }
          icon={Megaphone}
          iconBgColor={`bg-linear-to-br ${config.gradient}`}
          badges={[
            {
              label: config.label,
              variant: 'outline',
            },
            ...(item.isActive
              ? []
              : [
                  {
                    label: 'Inativo' as string,
                    variant: 'secondary' as const,
                  },
                ]),
          ]}
          footer={{
            type: 'single' as const,
            button: {
              icon: Megaphone,
              label: `Publicado em ${new Date(item.publishedAt).toLocaleDateString('pt-BR')}`,
              color: 'violet',
            },
          }}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          showStatusBadges={false}
        />
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const initialIds = useMemo(
    () => filteredItems.map(i => i.id),
    [filteredItems]
  );

  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];
    if (canCreate) {
      buttons.push({
        id: 'create-announcement',
        title: 'Novo Comunicado',
        icon: Plus,
        onClick: () => setIsCreateOpen(true),
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'announcements',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Comunicados', href: '/hr/announcements' },
            ]}
            buttons={actionButtons}
          />

          <Header
            title="Comunicados"
            description="Gerencie comunicados e avisos para os colaboradores"
          />
        </PageHeader>

        <PageBody>
          <div data-testid="announcements-page" className="contents" />
          <div data-testid="announcements-search">
            <SearchBar
              placeholder="Buscar comunicados..."
              value={searchQuery}
              onSearch={value => setSearchQuery(value)}
              onClear={() => setSearchQuery('')}
              showClear={true}
              size="md"
            />
          </div>

          {isLoading ? (
            <GridLoading count={6} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar comunicados"
              message="Ocorreu um erro ao tentar carregar os comunicados. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={{
                name: 'Announcement',
                namePlural: 'Announcements',
                slug: 'announcements',
                icon: Megaphone,
                api: {
                  baseUrl: '/api/v1/hr/announcements',
                  queryKey: 'hr-announcements',
                  queryKeys: {
                    list: ['hr-announcements'],
                    detail: (id: string) => ['hr-announcements', id],
                  },
                  endpoints: {
                    list: '/v1/hr/announcements',
                    get: '/v1/hr/announcements/:id',
                    create: '/v1/hr/announcements',
                    update: '/v1/hr/announcements/:id',
                    delete: '/v1/hr/announcements/:id',
                  },
                },
                routes: {
                  list: '/hr/announcements',
                  detail: '/hr/announcements/:id',
                  edit: '/hr/announcements/:id/edit',
                },
                permissions: {
                  view: HR_PERMISSIONS.EMPLOYEES.MANAGE,
                  create: HR_PERMISSIONS.EMPLOYEES.MANAGE,
                  update: HR_PERMISSIONS.EMPLOYEES.MANAGE,
                  delete: HR_PERMISSIONS.EMPLOYEES.MANAGE,
                },
                display: {
                  icon: Megaphone,
                  color: 'violet',
                  gradient: 'from-violet-500 to-violet-600',
                  titleField: 'title',
                  labels: {
                    singular: 'Comunicado',
                    plural: 'Comunicados',
                    emptyState: 'Nenhum comunicado encontrado',
                    searchPlaceholder: 'Buscar comunicados...',
                  },
                },
                grid: {
                  defaultView: 'grid',
                  columns: { sm: 1, md: 2, lg: 3, xl: 4 },
                  showViewToggle: true,
                  enableDragSelection: true,
                  selectable: true,
                  searchableFields: ['title', 'content'],
                  defaultSort: { field: 'createdAt', direction: 'desc' },
                  pageSize: 20,
                },
              }}
              items={filteredItems}
              toolbarStart={
                <div data-testid="announcements-filter-priority">
                  <FilterDropdown
                    label="Prioridade"
                    icon={AlertTriangle}
                    options={PRIORITY_FILTER_OPTIONS}
                    selected={priorityFilter}
                    onSelectionChange={setPriorityFilter}
                    activeColor="violet"
                    searchPlaceholder="Buscar prioridade..."
                    emptyText="Nenhuma prioridade encontrada."
                  />
                </div>
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemClick={item => handleView([item.id])}
              onItemDoubleClick={item => handleView([item.id])}
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
          <CreateAnnouncementModal
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
              setDeleteTargetIds([]);
            }}
            onSuccess={handleDeleteConfirm}
            title="Excluir Comunicado"
            description={`Digite seu PIN de ação para excluir ${deleteTargetIds.length} comunicado(s). Esta ação não pode ser desfeita.`}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
