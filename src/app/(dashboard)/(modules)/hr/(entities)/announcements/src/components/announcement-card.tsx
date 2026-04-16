'use client';

/**
 * AnnouncementCard
 *
 * Notion/Slack-style card used in the announcements listing. Renders
 * priority chip, audience target chips, content preview, read progress
 * bar, recent readers stack and a "Marcar como lido" button. Auto-marks
 * itself as read while visible (50% / 2s) via `useAutoMarkRead`.
 */

import { ReadProgressBar } from '@/components/hr/read-progress-bar';
import {
  type ReaderAvatar,
  ReadersAvatarStack,
} from '@/components/hr/readers-avatar-stack';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  AnnouncementPriority,
  CompanyAnnouncement,
} from '@/types/hr';
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Info,
  Megaphone,
  Pin,
  UserRound,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAutoMarkRead } from '../hooks/use-auto-mark-read';

interface AnnouncementCardProps {
  announcement: CompanyAnnouncement;
  /** Recent readers preview (from announcement stats endpoint, optional). */
  recentReaders?: ReaderAvatar[];
  /** Callback fired when the card auto-marks itself as read. */
  onAutoMarkRead: (announcementId: string) => void;
  /** Callback fired when the user explicitly clicks the read button. */
  onMarkRead: (announcementId: string) => void;
  /** Whether the explicit mark-as-read mutation is currently running. */
  isMarkingRead?: boolean;
}

const PRIORITY_CONFIG: Record<
  AnnouncementPriority,
  {
    label: string;
    icon: typeof AlertTriangle;
    chipClass: string;
    accentBorder: string;
    gradient: string;
  }
> = {
  URGENT: {
    label: 'Urgente',
    icon: AlertTriangle,
    chipClass:
      'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/8 dark:text-rose-300',
    accentBorder: 'border-l-rose-500',
    gradient: 'from-rose-500 to-rose-600',
  },
  IMPORTANT: {
    label: 'Importante',
    icon: Info,
    chipClass:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/8 dark:text-amber-300',
    accentBorder: 'border-l-amber-500',
    gradient: 'from-amber-500 to-amber-600',
  },
  NORMAL: {
    label: 'Normal',
    icon: Bell,
    chipClass:
      'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/8 dark:text-slate-300',
    accentBorder: 'border-l-slate-400',
    gradient: 'from-slate-500 to-slate-600',
  },
};

const CONTENT_PREVIEW_LIMIT = 200;

function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}...`;
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

export function AnnouncementCard({
  announcement,
  recentReaders,
  onAutoMarkRead,
  onMarkRead,
  isMarkingRead,
}: AnnouncementCardProps) {
  const router = useRouter();

  const config = PRIORITY_CONFIG[announcement.priority];
  const PriorityIcon = config.icon;

  const isReadByMe = announcement.isReadByMe ?? false;
  const readCount = announcement.readCount ?? 0;
  const audienceCount = announcement.audienceCount ?? 0;

  const observerRef = useAutoMarkRead({
    announcementId: announcement.id,
    alreadyRead: isReadByMe,
    onRead: onAutoMarkRead,
  });

  const audienceTargets = announcement.audienceTargets ?? {};
  const departmentsCount = audienceTargets.departments?.length ?? 0;
  const teamsCount = audienceTargets.teams?.length ?? 0;
  const rolesCount = audienceTargets.roles?.length ?? 0;
  const employeesCount = audienceTargets.employees?.length ?? 0;
  const isBroadcast =
    departmentsCount === 0 &&
    teamsCount === 0 &&
    rolesCount === 0 &&
    employeesCount === 0;

  const publishedAt = formatDate(announcement.publishedAt);
  const expiresAt = formatDate(announcement.expiresAt);

  const handleNavigate = () => {
    router.push(`/hr/announcements/${announcement.id}`);
  };

  const handleMarkRead: React.MouseEventHandler = event => {
    event.stopPropagation();
    onMarkRead(announcement.id);
  };

  return (
    <Card
      ref={observerRef}
      data-testid={`announcement-card-${announcement.id}`}
      data-read={isReadByMe ? 'true' : 'false'}
      onClick={handleNavigate}
      className={cn(
        'group relative cursor-pointer overflow-hidden border-l-4 transition-all',
        'bg-white dark:bg-slate-800/60 hover:shadow-md hover:-translate-y-[1px]',
        config.accentBorder,
        !isReadByMe && 'ring-1 ring-violet-200/60 dark:ring-violet-500/20'
      )}
    >
      <div className="flex flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br',
              config.gradient
            )}
          >
            <Megaphone className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold leading-tight truncate">
                {announcement.title}
              </h3>
              {announcement.isPinned && (
                <Badge
                  variant="outline"
                  className="gap-1 border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/8 dark:text-violet-300"
                >
                  <Pin className="h-3 w-3" />
                  Fixado
                </Badge>
              )}
              {!isReadByMe && (
                <span
                  className="inline-block h-2 w-2 rounded-full bg-violet-500"
                  aria-label="Nao lido"
                />
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <Badge
                variant="outline"
                className={cn('gap-1', config.chipClass)}
              >
                <PriorityIcon className="h-3 w-3" />
                {config.label}
              </Badge>
              {announcement.authorEmployee && (
                <span>por {announcement.authorEmployee.fullName}</span>
              )}
              {publishedAt && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {publishedAt}
                </span>
              )}
              {expiresAt && (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Clock className="h-3 w-3" />
                  Expira em {expiresAt}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content preview */}
        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
          {truncate(announcement.content, CONTENT_PREVIEW_LIMIT)}
        </p>

        {/* Audience target chips */}
        <div className="flex flex-wrap gap-1.5">
          {isBroadcast ? (
            <Badge
              variant="outline"
              className="gap-1 border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/8 dark:text-violet-300"
            >
              <Users className="h-3 w-3" />
              Toda a empresa
            </Badge>
          ) : (
            <>
              {departmentsCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  {departmentsCount} depto(s)
                </Badge>
              )}
              {teamsCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {teamsCount} equipe(s)
                </Badge>
              )}
              {rolesCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  {rolesCount} cargo(s)
                </Badge>
              )}
              {employeesCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <UserRound className="h-3 w-3" />
                  {employeesCount} colab(s)
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t pt-3">
          <ReadProgressBar
            readCount={readCount}
            totalAudience={audienceCount}
            compact
          />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <ReadersAvatarStack
                readers={recentReaders ?? []}
                limit={5}
                totalReaders={readCount}
                size="size-7"
              />
              <span className="text-xs text-muted-foreground">
                Lido por {readCount} de {audienceCount}
              </span>
            </div>
            {isReadByMe ? (
              <Badge
                variant="outline"
                className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/8 dark:text-emerald-300"
              >
                <CheckCircle2 className="h-3 w-3" />
                Lido
              </Badge>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isMarkingRead}
                onClick={handleMarkRead}
                data-testid={`announcement-mark-read-${announcement.id}`}
                className="gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Marcar lido
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default AnnouncementCard;
