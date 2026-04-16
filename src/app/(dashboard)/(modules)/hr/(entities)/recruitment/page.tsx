/**
 * OpenSea OS - Recruitment Job Postings Page
 * Página de vagas do módulo de Recrutamento e Seleção
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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
  SelectionToolbar,
  useEntityPage,
} from '@/core';
import { HR_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { recruitmentService } from '@/services/hr/recruitment.service';
import { departmentsService } from '@/services/hr/departments.service';
import { KanbanJobSelector } from '@/components/hr/kanban-job-selector';
import type { JobPosting } from '@/types/hr';
import { Briefcase, Loader2, MapPin, Plus, Users } from 'lucide-react';
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
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
import {
  JOB_POSTING_STATUS_LABELS,
  JOB_POSTING_STATUS_COLORS,
  JOB_POSTING_TYPE_LABELS,
  JOB_POSTING_STATUS_OPTIONS,
  JOB_POSTING_TYPE_OPTIONS,
  formatSalaryRange,
  jobPostingsConfig,
} from './src';

const CreateJobPostingModal = dynamic(
  () =>
    import('./src/modals/create-job-posting-modal').then(m => ({
      default: m.CreateJobPostingModal,
    })),
  { ssr: false }
);

export default function RecruitmentJobPostingsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <RecruitmentJobPostingsContent />
    </Suspense>
  );
}

function RecruitmentJobPostingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const canView = hasPermission(HR_PERMISSIONS.RECRUITMENT.ACCESS);
  const canCreate = hasPermission(HR_PERMISSIONS.RECRUITMENT.REGISTER);
  const canModify = hasPermission(HR_PERMISSIONS.RECRUITMENT.MODIFY);
  const canDelete = hasPermission(HR_PERMISSIONS.RECRUITMENT.REMOVE);
  const canAdmin = hasPermission(HR_PERMISSIONS.RECRUITMENT.ADMIN);

  // URL filters
  const statusFilter = searchParams.get('status') ?? '';
  const typeFilter = searchParams.get('type') ?? '';

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch departments for create modal
  const { data: deptsData } = useQuery({
    queryKey: ['departments', 'select'],
    queryFn: () => departmentsService.listDepartments({ perPage: 100 }),
  });

  // Fetch positions for create modal
  const { data: positionsData } = useQuery({
    queryKey: ['positions', 'select'],
    queryFn: async () => {
      const { positionsService } = await import(
        '@/services/hr/positions.service'
      );
      return positionsService.listPositions({ perPage: 100 });
    },
  });

  const departments = useMemo(
    () => (deptsData?.departments ?? []).map(d => ({ id: d.id, name: d.name })),
    [deptsData]
  );

  const positions = useMemo(
    () =>
      (positionsData?.positions ?? []).map(
        (p: { id: string; name: string }) => ({
          id: p.id,
          name: p.name,
        })
      ),
    [positionsData]
  );

  // Infinite scroll
  const PAGE_SIZE = 20;
  const {
    data: infiniteData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      'job-postings',
      'infinite',
      statusFilter,
      typeFilter,
      searchQuery,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      return recruitmentService.listJobPostings({
        page: pageParam,
        perPage: PAGE_SIZE,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        search: searchQuery || undefined,
      });
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.meta?.page ?? lastPage.page ?? 1;
      const total = lastPage.meta?.totalPages ?? lastPage.totalPages ?? 1;
      return currentPage < total ? currentPage + 1 : undefined;
    },
  });

  const allItems = useMemo(
    () => infiniteData?.pages.flatMap(p => p.jobPostings ?? []) ?? [],
    [infiniteData]
  );

  // Sentinel
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: recruitmentService.createJobPosting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      import('sonner').then(({ toast }) =>
        toast.success('Vaga criada com sucesso')
      );
    },
    onError: () => {
      import('sonner').then(({ toast }) => toast.error('Erro ao criar vaga'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: recruitmentService.deleteJobPosting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      import('sonner').then(({ toast }) =>
        toast.success('Vaga excluída com sucesso')
      );
    },
    onError: () => {
      import('sonner').then(({ toast }) => toast.error('Erro ao excluir vaga'));
    },
  });

  const publishMutation = useMutation({
    mutationFn: recruitmentService.publishJobPosting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      import('sonner').then(({ toast }) =>
        toast.success('Vaga publicada com sucesso')
      );
    },
  });

  const closeMutation = useMutation({
    mutationFn: recruitmentService.closeJobPosting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      import('sonner').then(({ toast }) =>
        toast.success('Vaga encerrada com sucesso')
      );
    },
  });

  // Filter URL helpers
  const buildFilterUrl = useCallback(
    (params: { status?: string; type?: string }) => {
      const s = params.status !== undefined ? params.status : statusFilter;
      const t = params.type !== undefined ? params.type : typeFilter;
      const parts: string[] = [];
      if (s) parts.push(`status=${s}`);
      if (t) parts.push(`type=${t}`);
      return parts.length > 0
        ? `/hr/recruitment?${parts.join('&')}`
        : '/hr/recruitment';
    },
    [statusFilter, typeFilter]
  );

  // Page setup for selection
  const page = useEntityPage<JobPosting>({
    entityName: 'Vaga',
    entityNamePlural: 'Vagas',
    queryKey: ['job-postings'],
    crud: {
      items: allItems,
      isLoading,
      error: error as Error | null,
      refetch: () => {
        queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      },
      isCreating: createMutation.isPending,
      isUpdating: false,
      isDuplicating: false,
      isDeleting: deleteMutation.isPending,
      create: async (data: Record<string, unknown>) => {
        await createMutation.mutateAsync(
          data as unknown as Parameters<
            typeof recruitmentService.createJobPosting
          >[0]
        );
        return {} as JobPosting;
      },
      update: async () => ({}) as JobPosting,
      delete: async (id: string) => {
        await deleteMutation.mutateAsync(id);
      },
    } as never,
    viewRoute: id => `/hr/recruitment/${id}`,
    editRoute: id => `/hr/recruitment/${id}/edit`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      return Boolean(
        item.title.toLowerCase().includes(q) ||
          (item.location && item.location.toLowerCase().includes(q))
      );
    },
  });

  const selectedIds = Array.from(page.selection?.state.selectedIds || []);
  const hasSelection = selectedIds.length > 0;
  const initialIds = useMemo(() => allItems.map(i => i.id), [allItems]);

  // Context menu actions builder
  const getActions = useCallback(
    (item: JobPosting) => {
      const actions: Array<{
        id: string;
        label: string;
        onClick: () => void;
        variant?: 'destructive';
        separator?: 'before';
      }> = [];

      if (canView && item.status !== 'DRAFT') {
        actions.push({
          id: 'kanban',
          label: 'Pipeline Kanban',
          onClick: () => router.push(`/hr/recruitment/${item.id}/kanban`),
          separator: 'before',
        });
      }

      if (canAdmin && item.status === 'DRAFT') {
        actions.push({
          id: 'publish',
          label: 'Publicar',
          onClick: () => publishMutation.mutate(item.id),
          separator: actions.length === 0 ? 'before' : undefined,
        });
      }

      if (canAdmin && item.status === 'OPEN') {
        actions.push({
          id: 'close',
          label: 'Encerrar',
          onClick: () => closeMutation.mutate(item.id),
          separator: actions.length === 0 ? 'before' : undefined,
        });
      }

      if (canDelete) {
        actions.push({
          id: 'delete',
          label: 'Excluir',
          variant: 'destructive',
          separator: 'before',
          onClick: () => {
            setDeleteId(item.id);
            setIsDeleteOpen(true);
          },
        });
      }

      return actions;
    },
    [canView, canAdmin, canDelete, publishMutation, closeMutation, router]
  );

  const renderGridCard = (item: JobPosting, isSelected: boolean) => {
    const statusColor = JOB_POSTING_STATUS_COLORS[item.status];
    const applicants = item._count?.applications ?? 0;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? ids => page.handlers.handleItemsView(ids) : undefined}
        onEdit={
          canModify ? ids => page.handlers.handleItemsEdit(ids) : undefined
        }
        actions={getActions(item)}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.title}
          subtitle={item.location ?? 'Remoto'}
          icon={Briefcase}
          iconBgColor="bg-linear-to-br from-violet-500 to-violet-600"
          badges={[
            {
              label: JOB_POSTING_STATUS_LABELS[item.status],
              variant: statusColor.variant,
            },
            {
              label: JOB_POSTING_TYPE_LABELS[item.type],
              variant: 'outline',
            },
          ]}
          footer={{
            type: 'split',
            left: {
              icon: MapPin,
              label: formatSalaryRange(item.salaryMin, item.salaryMax),
              color: 'emerald',
            },
            right: {
              icon: Users,
              label: `${applicants} candidato${applicants !== 1 ? 's' : ''}`,
              color: 'violet',
            },
          }}
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

  const renderListCard = (item: JobPosting, isSelected: boolean) => {
    const statusColor = JOB_POSTING_STATUS_COLORS[item.status];
    const applicants = item._count?.applications ?? 0;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? ids => page.handlers.handleItemsView(ids) : undefined}
        onEdit={
          canModify ? ids => page.handlers.handleItemsEdit(ids) : undefined
        }
        actions={getActions(item)}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.title}
          subtitle={item.location ?? 'Remoto'}
          icon={Briefcase}
          iconBgColor="bg-linear-to-br from-violet-500 to-violet-600"
          badges={[
            {
              label: JOB_POSTING_STATUS_LABELS[item.status],
              variant: statusColor.variant,
            },
            {
              label: JOB_POSTING_TYPE_LABELS[item.type],
              variant: 'outline',
            },
          ]}
          footer={{
            type: 'split',
            left: {
              icon: MapPin,
              label: formatSalaryRange(item.salaryMin, item.salaryMax),
              color: 'emerald',
            },
            right: {
              icon: Users,
              label: `${applicants} candidato${applicants !== 1 ? 's' : ''}`,
              color: 'violet',
            },
          }}
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

  return (
    <CoreProvider
      selection={{
        namespace: 'job-postings',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Recrutamento', href: '/hr/recruitment' },
            ]}
            buttons={[
              ...(canView
                ? [
                    {
                      id: 'candidates',
                      title: 'Candidatos',
                      icon: Users,
                      onClick: () => router.push('/hr/recruitment/candidates'),
                      variant: 'outline' as const,
                    },
                  ]
                : []),
              ...(canCreate
                ? [
                    {
                      id: 'create',
                      title: 'Nova Vaga',
                      icon: Plus,
                      onClick: () => setIsCreateOpen(true),
                      variant: 'default' as const,
                    },
                  ]
                : []),
            ]}
          >
            {canView && <KanbanJobSelector />}
          </PageActionBar>

          <Header
            title="Recrutamento e Seleção"
            description="Gerencie vagas, candidatos e processos seletivos"
          />
        </PageHeader>

        <PageBody>
          <div data-testid="recruitment-page" className="contents" />
          <div data-testid="recruitment-search">
            <SearchBar
              placeholder="Buscar vagas..."
              value={searchQuery}
              onSearch={setSearchQuery}
              onClear={() => setSearchQuery('')}
              showClear={true}
              size="md"
            />
          </div>

          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar vagas"
              message="Ocorreu um erro ao tentar carregar as vagas. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () =>
                  queryClient.invalidateQueries({
                    queryKey: ['job-postings'],
                  }),
              }}
            />
          ) : (
            <EntityGrid
              config={jobPostingsConfig}
              items={allItems}
              toolbarStart={
                <>
                  <div data-testid="recruitment-filter-status">
                    <FilterDropdown
                      label="Status"
                      icon={Briefcase}
                      options={JOB_POSTING_STATUS_OPTIONS.map(o => ({
                        id: o.value,
                        label: o.label,
                      }))}
                      selected={statusFilter ? [statusFilter] : []}
                      onSelectionChange={ids =>
                        router.push(buildFilterUrl({ status: ids[0] ?? '' }))
                      }
                      activeColor="emerald"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                  </div>
                  <div data-testid="recruitment-filter-type">
                    <FilterDropdown
                      label="Tipo"
                      icon={Briefcase}
                      options={JOB_POSTING_TYPE_OPTIONS.map(o => ({
                        id: o.value,
                        label: o.label,
                      }))}
                      selected={typeFilter ? [typeFilter] : []}
                      onSelectionChange={ids =>
                        router.push(buildFilterUrl({ type: ids[0] ?? '' }))
                      }
                      activeColor="violet"
                    searchPlaceholder="Buscar tipo..."
                    emptyText="Nenhum tipo encontrado."
                  />
                  </div>
                </>
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemClick={(item, e) => page.handlers.handleItemClick(item, e)}
              onItemDoubleClick={item =>
                page.handlers.handleItemDoubleClick(item)
              }
              showSorting={true}
              defaultSortField="name"
              defaultSortDirection="asc"
            />
          )}

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {hasSelection && (
            <SelectionToolbar
              selectedIds={selectedIds}
              totalItems={allItems.length}
              onClear={() => page.selection?.actions.clear()}
              onSelectAll={() => page.selection?.actions.selectAll()}
              defaultActions={{
                view: canView,
                edit: canModify,
                delete: canDelete,
              }}
              handlers={{
                onView: page.handlers.handleItemsView,
                onEdit: page.handlers.handleItemsEdit,
                onDelete: ids => {
                  setDeleteId(ids[0]);
                  setIsDeleteOpen(true);
                },
              }}
            />
          )}

          <CreateJobPostingModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            isSubmitting={createMutation.isPending}
            onSubmit={async data => {
              await createMutation.mutateAsync(data);
            }}
            departments={departments}
            positions={positions}
          />

          <VerifyActionPinModal
            isOpen={isDeleteOpen}
            onClose={() => {
              setIsDeleteOpen(false);
              setDeleteId(null);
            }}
            onSuccess={() => {
              if (deleteId) {
                deleteMutation.mutate(deleteId);
              }
              setIsDeleteOpen(false);
              setDeleteId(null);
            }}
            title="Excluir Vaga"
            description="Digite seu PIN de ação para excluir esta vaga. Esta ação não pode ser desfeita."
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
