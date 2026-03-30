'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Progress } from '@/components/ui/progress';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { usePermissions } from '@/hooks/use-permissions';
import type {
  OffboardingChecklist,
  OffboardingStatus,
} from '@/types/hr/offboarding.types';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Trash2,
  UserMinus,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useListOffboardingChecklists } from './src/api/list-offboarding.query';
import { useDeleteOffboarding } from './src/api/mutations';

const CreateOffboardingModal = dynamic(
  () =>
    import('./src/modals/create-offboarding-modal').then(m => ({
      default: m.CreateOffboardingModal,
    })),
  { ssr: false }
);

function OffboardingPageContent() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(HR_PERMISSIONS.OFFBOARDING.CREATE);
  const canDelete = hasPermission(HR_PERMISSIONS.OFFBOARDING.DELETE);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OffboardingStatus | ''>('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OffboardingChecklist | null>(
    null
  );

  const sentinelRef = useRef<HTMLDivElement>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: (statusFilter || undefined) as OffboardingStatus | undefined,
    }),
    [search, statusFilter]
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListOffboardingChecklists(filters);

  const deleteOffboarding = useDeleteOffboarding({
    onSuccess: () => setDeleteTarget(null),
  });

  const checklists = useMemo(
    () => data?.pages.flatMap(page => page.checklists) ?? [],
    [data]
  );

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleChecklistClick = useCallback(
    (checklist: OffboardingChecklist) => {
      router.push(`/hr/offboarding/${checklist.id}`);
    },
    [router]
  );

  const statusOptions = [
    { label: 'Todos', value: '' },
    { label: 'Em Progresso', value: 'IN_PROGRESS' },
    { label: 'Concluído', value: 'COMPLETED' },
  ];

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Recursos Humanos', href: '/hr' },
            { label: 'Offboarding', href: '/hr/offboarding' },
          ]}
          hasPermission={hasPermission}
          buttons={
            canCreate
              ? [
                  {
                    label: 'Novo Checklist',
                    icon: Plus,
                    onClick: () => setCreateModalOpen(true),
                  },
                ]
              : undefined
          }
        />
      </PageHeader>

      <PageBody>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <SearchBar
              value={search}
              onSearch={setSearch}
              placeholder="Buscar por título..."
              className="flex-1"
            />
            <FilterDropdown
              label="Status"
              value={statusFilter}
              options={statusOptions}
              onChange={val => setStatusFilter(val as OffboardingStatus | '')}
            />
          </div>

          {isLoading ? (
            <GridLoading />
          ) : error ? (
            <GridError type="server" title="Erro ao carregar" message={error?.message} />
          ) : checklists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <UserMinus className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-sm font-medium">
                Nenhum checklist de offboarding encontrado
              </p>
              <p className="text-xs mt-1">
                {search || statusFilter
                  ? 'Tente ajustar os filtros.'
                  : 'Crie o primeiro checklist para começar.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {checklists.map(checklist => (
                <Card
                  key={checklist.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-slate-800/60 border border-border"
                  onClick={() => handleChecklistClick(checklist)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">
                        {checklist.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {checklist.items.length} itens
                      </p>
                    </div>
                    <Badge
                      variant={
                        checklist.progress === 100 ? 'default' : 'secondary'
                      }
                      className={
                        checklist.progress === 100
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300 border-0'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300 border-0'
                      }
                    >
                      {checklist.progress === 100 ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Concluído
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Em Progresso
                        </>
                      )}
                    </Badge>
                  </div>

                  <Progress value={checklist.progress} className="h-2 mb-2" />

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{checklist.progress}% concluído</span>
                    <span>
                      {new Date(checklist.createdAt).toLocaleDateString(
                        'pt-BR'
                      )}
                    </span>
                  </div>

                  {canDelete && (
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteTarget(checklist);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </PageBody>

      {canCreate && (
        <CreateOffboardingModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
        />
      )}

      <VerifyActionPinModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          if (deleteTarget) {
            deleteOffboarding.mutate(deleteTarget.id);
          }
        }}
        title="Confirmar Exclusão"
        description={`Digite seu PIN de ação para excluir o checklist "${deleteTarget?.title ?? ''}".`}
      />
    </PageLayout>
  );
}

export default function OffboardingPage() {
  return (
    <Suspense fallback={<GridLoading />}>
      <OffboardingPageContent />
    </Suspense>
  );
}
