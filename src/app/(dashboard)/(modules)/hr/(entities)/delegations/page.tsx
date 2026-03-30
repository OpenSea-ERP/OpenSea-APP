/**
 * HR Approval Delegations Page
 * Delegação de autoridade de aprovação entre gestores
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
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { usePermissions } from '@/hooks/use-permissions';
import { approvalDelegationsService } from '@/services/hr';
import { employeesService } from '@/services/hr';
import type {
  ApprovalDelegation,
  ApprovalDelegationsResponse,
  DelegationScope,
} from '@/types/hr';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Shield,
  XCircle,
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

const CreateDelegationModal = dynamic(
  () =>
    import('./src/modals/create-delegation-modal').then((m) => ({
      default: m.CreateDelegationModal,
    })),
  { ssr: false },
);

// ============================================================================
// CONSTANTS
// ============================================================================

type TabValue = 'outgoing' | 'incoming';

const SCOPE_LABELS: Record<DelegationScope, string> = {
  ALL: 'Todas',
  ABSENCES: 'Ausências',
  VACATIONS: 'Férias',
  OVERTIME: 'Horas Extras',
  REQUESTS: 'Solicitações',
};

const SCOPE_BADGE_CLASSES: Record<DelegationScope, string> = {
  ALL: 'bg-violet-50 text-violet-700 dark:bg-violet-500/8 dark:text-violet-300',
  ABSENCES:
    'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300',
  VACATIONS:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
  OVERTIME:
    'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
  REQUESTS:
    'bg-sky-50 text-sky-700 dark:bg-sky-500/8 dark:text-sky-300',
};

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function DelegationsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={4} layout="list" size="md" gap="gap-4" />}
    >
      <DelegationsPageContent />
    </Suspense>
  );
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function DelegationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission(HR_PERMISSIONS.DELEGATIONS.CREATE);
  const canRevoke = hasPermission(HR_PERMISSIONS.DELEGATIONS.DELETE);

  // ============================================================================
  // STATE
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);

  const activeTab = useMemo<TabValue>(() => {
    const raw = searchParams.get('tab');
    if (raw === 'incoming') return 'incoming';
    return 'outgoing';
  }, [searchParams]);

  const setActiveTab = useCallback(
    (tab: TabValue) => {
      const url =
        tab === 'outgoing'
          ? '/hr/delegations'
          : '/hr/delegations?tab=incoming';
      router.push(url);
    },
    [router],
  );

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const PAGE_SIZE = 20;

  const fetchFn = useCallback(
    async (pageParam: number): Promise<ApprovalDelegationsResponse> => {
      const params = { page: pageParam, limit: PAGE_SIZE };
      if (activeTab === 'incoming') {
        return approvalDelegationsService.listIncoming(params);
      }
      return approvalDelegationsService.listOutgoing(params);
    },
    [activeTab],
  );

  const queryKey = activeTab === 'outgoing'
    ? 'hr-delegations-outgoing'
    : 'hr-delegations-incoming';

  const {
    data: infiniteData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [queryKey],
    queryFn: async ({ pageParam = 1 }) => fetchFn(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.meta?.page ?? 1;
      const totalPages = lastPage.meta?.pages ?? 1;
      if (currentPage < totalPages) {
        return currentPage + 1;
      }
      return undefined;
    },
  });

  const delegationsData =
    infiniteData?.pages.flatMap((p) => p.delegations) ?? [];

  // ============================================================================
  // EMPLOYEES FOR CREATE MODAL
  // ============================================================================

  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['hr-employees-for-delegation'],
    queryFn: async () => {
      const response = await employeesService.listEmployees({
        status: 'ACTIVE',
        page: 1,
        perPage: 200,
      });
      return response.employees;
    },
    enabled: isCreateOpen,
  });

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const createMutation = useMutation({
    mutationFn: approvalDelegationsService.create,
    onSuccess: () => {
      toast.success('Delegação criada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['hr-delegations-outgoing'] });
      queryClient.invalidateQueries({ queryKey: ['hr-delegations-incoming'] });
    },
    onError: () => {
      toast.error('Erro ao criar delegação');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (delegationId: string) =>
      approvalDelegationsService.revoke(delegationId),
    onSuccess: () => {
      toast.success('Delegação revogada com sucesso');
      setRevokeTargetId(null);
      queryClient.invalidateQueries({ queryKey: ['hr-delegations-outgoing'] });
      queryClient.invalidateQueries({ queryKey: ['hr-delegations-incoming'] });
    },
    onError: () => {
      toast.error('Erro ao revogar delegação');
    },
  });

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];
    if (canCreate) {
      buttons.push({
        id: 'create-delegation',
        title: 'Nova Delegação',
        icon: Plus,
        onClick: () => setIsCreateOpen(true),
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate]);

  // ============================================================================
  // TAB LABELS
  // ============================================================================

  const tabLabels: { value: TabValue; label: string; icon: typeof ArrowUpRight }[] = [
    { value: 'outgoing', label: 'Minhas Delegações', icon: ArrowUpRight },
    { value: 'incoming', label: 'Delegações Recebidas', icon: ArrowDownLeft },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Delegações de Aprovação', href: '/hr/delegations' },
          ]}
          buttons={actionButtons}
        />

        <Header
          title="Delegações de Aprovação"
          description="Delegue autoridade de aprovação para outros colaboradores durante ausências ou férias"
        />
      </PageHeader>

      <PageBody>
        {/* Tabs */}
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 mb-4">
            {tabLabels.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Content */}
        {isLoading ? (
          <GridLoading count={4} layout="list" size="md" gap="gap-4" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar delegações"
            message="Ocorreu um erro ao tentar carregar as delegações. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        ) : delegationsData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Shield className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {activeTab === 'outgoing'
                ? 'Nenhuma delegação criada'
                : 'Nenhuma delegação recebida'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground/70">
              {activeTab === 'outgoing'
                ? 'Crie uma delegação para permitir que outro colaborador aprove em seu nome.'
                : 'Você não recebeu nenhuma delegação de aprovação.'}
            </p>
            {canCreate && activeTab === 'outgoing' && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Nova Delegação
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {delegationsData.map((delegation) => (
              <DelegationCard
                key={delegation.id}
                delegation={delegation}
                activeTab={activeTab}
                canRevoke={canRevoke && activeTab === 'outgoing'}
                onRevoke={() => setRevokeTargetId(delegation.id)}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Create Modal */}
        <CreateDelegationModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          isSubmitting={createMutation.isPending}
          onSubmit={async (data) => {
            await createMutation.mutateAsync(data);
          }}
          employees={employeesData ?? []}
          isLoadingEmployees={isLoadingEmployees}
        />

        {/* Revoke PIN Modal */}
        <VerifyActionPinModal
          isOpen={revokeTargetId !== null}
          onClose={() => setRevokeTargetId(null)}
          onSuccess={() => {
            if (revokeTargetId) {
              revokeMutation.mutate(revokeTargetId);
            }
          }}
          title="Revogar Delegação"
          description="Digite seu PIN de ação para revogar esta delegação de aprovação."
        />
      </PageBody>
    </PageLayout>
  );
}

// ============================================================================
// DELEGATION CARD COMPONENT
// ============================================================================

interface DelegationCardProps {
  delegation: ApprovalDelegation;
  activeTab: TabValue;
  canRevoke: boolean;
  onRevoke: () => void;
}

function DelegationCard({
  delegation,
  activeTab,
  canRevoke,
  onRevoke,
}: DelegationCardProps) {
  const scopeLabel = SCOPE_LABELS[delegation.scope as DelegationScope] ?? delegation.scope;
  const scopeBadge = SCOPE_BADGE_CLASSES[delegation.scope as DelegationScope] ?? '';

  const startFormatted = new Date(delegation.startDate).toLocaleDateString(
    'pt-BR',
    { day: '2-digit', month: 'short', year: 'numeric' },
  );

  const endFormatted = delegation.endDate
    ? new Date(delegation.endDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const otherPartyLabel = activeTab === 'outgoing' ? 'Delegado' : 'Delegante';
  const otherPartyName =
    activeTab === 'outgoing'
      ? delegation.delegateName ?? delegation.delegateId
      : delegation.delegatorName ?? delegation.delegatorId;

  return (
    <div className="rounded-lg border bg-white dark:bg-slate-800/60 border-border p-4 transition-all hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Info */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* Header: Other party name */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">
              {otherPartyLabel}: {otherPartyName}
            </span>

            {/* Status badges */}
            {delegation.isActive ? (
              delegation.isEffective ? (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" />
                  Ativa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300">
                  <Clock className="h-3 w-3" />
                  Agendada
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400">
                <XCircle className="h-3 w-3" />
                Revogada
              </span>
            )}
          </div>

          {/* Scope + Period */}
          <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${scopeBadge}`}>
              <Shield className="h-3 w-3" />
              {scopeLabel}
            </span>

            <span className="inline-flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3" />
              {startFormatted}
              {endFormatted ? ` - ${endFormatted}` : ' (sem termino)'}
            </span>
          </div>

          {/* Reason */}
          {delegation.reason && (
            <p className="text-sm text-muted-foreground/80 line-clamp-2">
              {delegation.reason}
            </p>
          )}
        </div>

        {/* Right: Actions */}
        {canRevoke && delegation.isActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRevoke}
            className="shrink-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 border-rose-200 dark:border-rose-500/20"
          >
            Revogar
          </Button>
        )}
      </div>
    </div>
  );
}
