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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Progress } from '@/components/ui/progress';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { usePermissions } from '@/hooks/use-permissions';
import type {
  OnboardingChecklist,
  OnboardingStatus,
} from '@/types/hr/onboarding.types';
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  Plus,
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
import { useListOnboardingChecklists } from './src/api/list-onboarding.query';

const CreateOnboardingModal = dynamic(
  () =>
    import('./src/modals/create-onboarding-modal').then(m => ({
      default: m.CreateOnboardingModal,
    })),
  { ssr: false }
);

function OnboardingPageContent() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(HR_PERMISSIONS.ONBOARDING.CREATE);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | ''>('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: (statusFilter || undefined) as OnboardingStatus | undefined,
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
  } = useListOnboardingChecklists(filters);

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
    (checklist: OnboardingChecklist) => {
      router.push(`/hr/onboarding/${checklist.id}`);
    },
    [router]
  );

  const statusOptions = [
    { id: '', label: 'Todos' },
    { id: 'IN_PROGRESS', label: 'Em Progresso' },
    { id: 'COMPLETED', label: 'Concluído' },
  ];

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Onboarding', href: '/hr/onboarding' },
          ]}
          hasPermission={hasPermission}
          actions={
            canCreate ? (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline">Novo Checklist</span>
              </Button>
            ) : undefined
          }
        />

        <Header
          title="Onboarding"
          description="Checklists de integração para novos colaboradores"
        />
      </PageHeader>

      <PageBody>
        <div className="space-y-4" data-testid="onboarding-page">
          <div data-testid="onboarding-search">
            <SearchBar
              value={search}
              onSearch={setSearch}
              placeholder="Buscar checklists de onboarding..."
            />
          </div>

          <div className="flex items-center gap-2">
            <div data-testid="onboarding-filter-status">
              <FilterDropdown
                label="Status"
                value={statusFilter}
                options={statusOptions}
                onChange={val => setStatusFilter(val as OnboardingStatus | '')}
                activeColor="emerald"
              />
            </div>
            <span className="text-xs text-muted-foreground" data-testid="onboarding-count">
              {checklists.length} checklist(s)
            </span>
          </div>

          {isLoading ? (
            <GridLoading />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar"
              message={error?.message}
            />
          ) : checklists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardList className="h-8 w-8 mb-3 opacity-40" />
              <p className="text-sm font-medium">
                Nenhum checklist de onboarding encontrado
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
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-white/5 border border-border"
                  onClick={() => handleChecklistClick(checklist)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">
                        {checklist.title}
                      </h3>
                      {checklist.employee ? (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {checklist.employee.fullName}
                          {checklist.employee.position &&
                            ` \u2022 ${checklist.employee.position.name}`}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {checklist.items.length} itens
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        checklist.progress === 100 ? 'default' : 'secondary'
                      }
                      className={
                        checklist.progress === 100
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300 border-0'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300 border-0'
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
        <CreateOnboardingModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
        />
      )}
    </PageLayout>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<GridLoading />}>
      <OnboardingPageContent />
    </Suspense>
  );
}
