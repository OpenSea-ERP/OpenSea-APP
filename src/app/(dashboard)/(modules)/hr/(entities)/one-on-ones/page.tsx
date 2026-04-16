/**
 * 1:1 Meetings Listing Page
 *
 * Layout estilo Lattice/15Five:
 *  - Hero compacto com CTA "Agendar 1:1"
 *  - Tabs: Próximas | Realizadas | Como gestor | Como liderado | Pendentes ações
 *  - Cards timeline-style com avatares de ambos, status, contagem de talking
 *    points e action items abertos
 *  - Empty state convidativo + sentinel para infinite scroll
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import {
  useOneOnOnes,
  useScheduleOneOnOne,
} from '@/hooks/hr/use-one-on-ones';
import { useMyEmployee } from '@/hooks/use-me';
import { usePermissions } from '@/hooks/use-permissions';
import { translateError } from '@/lib/error-messages';
import type {
  OneOnOneMeeting,
  OneOnOneStatus,
  ScheduleOneOnOneData,
} from '@/types/hr';
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  MessageSquareText,
  Plus,
  UserCircle,
  Users,
  type LucideIcon,
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

const ScheduleOneOnOneModal = dynamic(
  () =>
    import('./src/modals/schedule-one-on-one-modal').then(module => ({
      default: module.ScheduleOneOnOneModal,
    })),
  { ssr: false }
);

// ============================================================================
// CONSTANTS
// ============================================================================

type TabValue =
  | 'upcoming'
  | 'completed'
  | 'as-manager'
  | 'as-report'
  | 'pending-actions';

const TABS: { value: TabValue; label: string; icon: LucideIcon }[] = [
  { value: 'upcoming', label: 'Próximas', icon: CalendarClock },
  { value: 'completed', label: 'Realizadas', icon: CalendarCheck },
  { value: 'as-manager', label: 'Como gestor', icon: UserCircle },
  { value: 'as-report', label: 'Como liderado', icon: Users },
  { value: 'pending-actions', label: 'Pendentes ações', icon: ClipboardList },
];

const STATUS_LABEL: Record<OneOnOneStatus, string> = {
  SCHEDULED: 'Agendada',
  COMPLETED: 'Realizada',
  CANCELLED: 'Cancelada',
};

const STATUS_BADGE_CLASSES: Record<OneOnOneStatus, string> = {
  SCHEDULED:
    'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300',
  COMPLETED:
    'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  CANCELLED:
    'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300',
};

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function OneOnOnesPage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="list" size="md" gap="gap-4" />}
    >
      <OneOnOnesPageContent />
    </Suspense>
  );
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function OneOnOnesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();
  const { data: myEmployeeData } = useMyEmployee();

  const myEmployeeId = myEmployeeData?.employee?.id;

  // Permissions
  const canList = hasPermission(HR_PERMISSIONS.ONE_ON_ONES.LIST);
  const canCreate = hasPermission(HR_PERMISSIONS.ONE_ON_ONES.CREATE);

  // ============================================================================
  // URL-DRIVEN TAB
  // ============================================================================

  const activeTab = useMemo<TabValue>(() => {
    const raw = searchParams.get('tab');
    if (
      raw === 'completed' ||
      raw === 'as-manager' ||
      raw === 'as-report' ||
      raw === 'pending-actions'
    )
      return raw;
    return 'upcoming';
  }, [searchParams]);

  const setActiveTab = useCallback(
    (tab: TabValue) => {
      router.push(tab === 'upcoming' ? '/hr/one-on-ones' : `/hr/one-on-ones?tab=${tab}`);
    },
    [router]
  );

  // ============================================================================
  // FILTERS DERIVED FROM TAB
  // ============================================================================

  const filters = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    switch (activeTab) {
      case 'upcoming':
        return {
          status: 'SCHEDULED' as OneOnOneStatus,
          from: today.toISOString(),
        };
      case 'completed':
        return { status: 'COMPLETED' as OneOnOneStatus };
      case 'as-manager':
        return { role: 'manager' as const };
      case 'as-report':
        return { role: 'report' as const };
      case 'pending-actions':
        return {};
    }
  }, [activeTab]);

  const meetingsQuery = useOneOnOnes({ filters, enabled: canList });

  const meetings = useMemo<OneOnOneMeeting[]>(
    () => meetingsQuery.data?.pages.flatMap(page => page.meetings) ?? [],
    [meetingsQuery.data]
  );

  // For "pending-actions" we filter client-side: meetings with at least one
  // action item assigned to the current user that's not yet completed.
  const visibleMeetings = useMemo(() => {
    if (activeTab !== 'pending-actions' || !myEmployeeId) return meetings;
    return meetings.filter(meeting =>
      (meeting.actionItems ?? []).some(
        actionItem =>
          !actionItem.completed && actionItem.ownerId === myEmployeeId
      )
    );
  }, [activeTab, meetings, myEmployeeId]);

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          meetingsQuery.hasNextPage &&
          !meetingsQuery.isFetchingNextPage
        ) {
          meetingsQuery.fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [meetingsQuery]);

  // ============================================================================
  // SCHEDULE MUTATION
  // ============================================================================

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const scheduleMutation = useScheduleOneOnOne();

  const handleSchedule = useCallback(
    async (payload: ScheduleOneOnOneData) => {
      try {
        await scheduleMutation.mutateAsync(payload);
        toast.success('Reunião 1:1 agendada com sucesso.');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        toast.error(translateError(message));
        throw error;
      }
    },
    [scheduleMutation]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!canList) {
    return (
      <PageLayout data-testid="one-on-ones-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Reuniões 1:1' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Sem permissão"
            message="Você não tem permissão para visualizar reuniões 1:1."
          />
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout data-testid="one-on-ones-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Reuniões 1:1', href: '/hr/one-on-ones' },
          ]}
        />

        {/* Hero compacto */}
        <div
          data-testid="one-on-ones-hero"
          className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 via-white to-sky-50/40 p-5 dark:border-violet-500/15 dark:from-violet-500/8 dark:via-slate-900/40 dark:to-sky-500/5"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-sm">
              <Users className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                Reuniões 1:1
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Agende conversas regulares com seus liderados, alinhe pautas e
                acompanhe os próximos passos.
              </p>
            </div>
            {canCreate && (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsScheduleOpen(true)}
                data-testid="one-on-ones-schedule-button"
              >
                <Plus className="h-4 w-4" />
                Agendar 1:1
              </Button>
            )}
          </div>
        </div>
      </PageHeader>

      <PageBody>
        <Tabs
          value={activeTab}
          className="w-full"
          data-testid="one-on-ones-tabs"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto sm:h-12 mb-4">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className="flex items-center gap-2"
                  data-testid={`one-on-ones-tab-${tab.value}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <div className="space-y-3" data-testid="one-on-ones-list">
          {meetingsQuery.isLoading ? (
            <GridLoading count={6} layout="list" size="md" gap="gap-4" />
          ) : meetingsQuery.error ? (
            <GridError
              type="server"
              title="Erro ao carregar reuniões"
              message="Ocorreu um erro ao carregar suas reuniões 1:1. Tente novamente."
              action={{
                label: 'Tentar novamente',
                onClick: () => {
                  meetingsQuery.refetch();
                },
              }}
            />
          ) : visibleMeetings.length === 0 ? (
            <EmptyState
              tab={activeTab}
              canCreate={canCreate}
              onCreate={() => setIsScheduleOpen(true)}
            />
          ) : (
            visibleMeetings.map(meeting => (
              <OneOnOneCard
                key={meeting.id}
                meeting={meeting}
                currentEmployeeId={myEmployeeId}
                onOpen={() => router.push(`/hr/one-on-ones/${meeting.id}`)}
              />
            ))
          )}
        </div>

        <div ref={sentinelRef} className="h-1" />
        {meetingsQuery.isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        <ScheduleOneOnOneModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          isSubmitting={scheduleMutation.isPending}
          onSubmit={handleSchedule}
        />
      </PageBody>
    </PageLayout>
  );
}

// ============================================================================
// CARD
// ============================================================================

interface OneOnOneCardProps {
  meeting: OneOnOneMeeting;
  currentEmployeeId?: string;
  onOpen: () => void;
}

function OneOnOneCard({
  meeting,
  currentEmployeeId,
  onOpen,
}: OneOnOneCardProps) {
  const scheduledAt = new Date(meeting.scheduledAt);
  const isManager = currentEmployeeId === meeting.managerId;
  const counterpart = isManager ? meeting.report : meeting.manager;
  const myRoleLabel = isManager ? 'Você (gestor)' : 'Você (liderado)';

  const talkingPointsCount =
    meeting._count?.talkingPoints ?? meeting.talkingPoints?.length ?? 0;
  const openActionItems =
    meeting._count?.openActionItems ??
    (meeting.actionItems ?? []).filter(item => !item.completed).length;

  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid={`one-on-one-card-${meeting.id}`}
      className="group flex w-full flex-col gap-3 rounded-xl border border-border bg-white p-4 text-left transition-colors hover:border-violet-300 hover:bg-violet-50/30 dark:bg-slate-800/60 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <PairAvatar
            primaryName={meeting.manager?.fullName ?? 'Gestor'}
            secondaryName={meeting.report?.fullName ?? 'Liderado'}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {meeting.manager?.fullName ?? 'Gestor'} &harr;{' '}
              {meeting.report?.fullName ?? 'Liderado'}
            </p>
            {currentEmployeeId && counterpart && (
              <p className="text-xs text-muted-foreground">
                {myRoleLabel} &middot; com {counterpart.fullName}
              </p>
            )}
          </div>
        </div>
        <Badge
          variant="outline"
          className={STATUS_BADGE_CLASSES[meeting.status]}
        >
          {STATUS_LABEL[meeting.status]}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="h-3.5 w-3.5" />
          {scheduledAt.toLocaleString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {meeting.durationMinutes} min
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquareText className="h-3.5 w-3.5" />
          {talkingPointsCount} pauta(s)
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {openActionItems} ação(ões) em aberto
        </span>
      </div>
    </button>
  );
}

// ============================================================================
// PAIR AVATAR (deterministic colors based on name hash)
// ============================================================================

const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-pink-500',
];

function hashColor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index++) {
    hash = (hash << 5) - hash + name.charCodeAt(index);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

function PairAvatar({
  primaryName,
  secondaryName,
}: {
  primaryName: string;
  secondaryName: string;
}) {
  return (
    <div className="flex -space-x-2">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white dark:border-slate-900 ${hashColor(primaryName)}`}
      >
        {initials(primaryName)}
      </div>
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white dark:border-slate-900 ${hashColor(secondaryName)}`}
      >
        {initials(secondaryName)}
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  tab: TabValue;
  canCreate: boolean;
  onCreate: () => void;
}

function EmptyState({ tab, canCreate, onCreate }: EmptyStateProps) {
  const titleByTab: Record<TabValue, string> = {
    upcoming: 'Nenhum 1:1 agendado',
    completed: 'Nenhuma reunião realizada ainda',
    'as-manager': 'Você não tem reuniões como gestor',
    'as-report': 'Você não tem reuniões como liderado',
    'pending-actions': 'Sem ações pendentes para você',
  };
  const descriptionByTab: Record<TabValue, string> = {
    upcoming: 'Que tal agendar uma conversa com seu time?',
    completed: 'Reuniões concluídas aparecerão por aqui.',
    'as-manager': 'Quando você agendar 1:1 com seus liderados, eles aparecem nesta aba.',
    'as-report': 'Quando seu gestor agendar uma reunião, ela aparece aqui.',
    'pending-actions': 'Você está em dia com seus compromissos. Bom trabalho.',
  };

  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/40 px-6 py-16 text-center dark:bg-slate-900/20"
      data-testid="one-on-ones-empty"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 to-sky-500/15">
        <Users className="h-8 w-8 text-violet-500" />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        {titleByTab[tab]}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {descriptionByTab[tab]}
      </p>
      {canCreate && tab !== 'completed' && tab !== 'pending-actions' && (
        <Button
          type="button"
          size="sm"
          className="mt-4"
          onClick={onCreate}
          data-testid="one-on-ones-empty-cta"
        >
          <Plus className="h-4 w-4" />
          Agendar agora
        </Button>
      )}
    </div>
  );
}
