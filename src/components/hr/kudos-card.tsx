/**
 * KudosCard
 *
 * Card de feed social estilo Slack/Lattice:
 * - Avatares de remetente e destinatario
 * - Categoria com badge dual-theme
 * - Reactions row com EmojiPicker (toggle + optimistic)
 * - Botao "Responder" + thread expandida (ReplyThread)
 * - Acoes contextuais: pin/unpin (modify) e excluir (admin)
 * - Timestamp relativo
 */

'use client';

import { ReplyThread } from '@/components/hr/reply-thread';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmojiPicker } from '@/components/ui/emoji-picker';
import { UserAvatar } from '@/components/shared/user-avatar';
import { cn } from '@/lib/utils';
import type { EmployeeKudos, KudosCategory } from '@/types/hr';
import {
  ArrowRight,
  Handshake,
  Lightbulb,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Pin,
  PinOff,
  Shield,
  Sparkles,
  Star,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

// ============================================================================
// CATEGORY CONFIG
// ============================================================================

interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  /** Tailwind classes for badge: dual-theme (light + dark) */
  badgeClass: string;
  /** Tailwind classes for the small leading category dot */
  iconColor: string;
}

const CATEGORY_CONFIG: Record<KudosCategory, CategoryConfig> = {
  TEAMWORK: {
    label: 'Trabalho em Equipe',
    icon: Handshake,
    badgeClass:
      'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/8 dark:text-violet-300',
    iconColor: 'text-violet-500',
  },
  INNOVATION: {
    label: 'Inovação',
    icon: Lightbulb,
    badgeClass:
      'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/8 dark:text-sky-300',
    iconColor: 'text-sky-500',
  },
  LEADERSHIP: {
    label: 'Liderança',
    icon: Shield,
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/8 dark:text-emerald-300',
    iconColor: 'text-emerald-500',
  },
  EXCELLENCE: {
    label: 'Excelência',
    icon: Star,
    badgeClass:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/8 dark:text-amber-300',
    iconColor: 'text-amber-500',
  },
  HELPFULNESS: {
    label: 'Prestatividade',
    icon: Sparkles,
    badgeClass:
      'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/8 dark:text-teal-300',
    iconColor: 'text-teal-500',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

interface KudosCardProps {
  kudos: EmployeeKudos;
  /** Identifier of the currently logged employee (for permission scoping). */
  currentEmployeeId?: string;
  /** Whether the user can pin/unpin (hr.kudos.modify). */
  canPin?: boolean;
  /** Whether the user can delete the kudos (hr.kudos.remove or admin). */
  canDelete?: boolean;
  /** Whether the user can administer replies (hr.kudos.admin). */
  canAdminReplies?: boolean;
  onReact: (kudosId: string, emoji: string) => void;
  onTogglePin?: (kudos: EmployeeKudos) => void;
  onDelete?: (kudos: EmployeeKudos) => void;
}

export function KudosCard({
  kudos,
  currentEmployeeId,
  canPin = false,
  canDelete = false,
  canAdminReplies = false,
  onReact,
  onTogglePin,
  onDelete,
}: KudosCardProps) {
  const [isThreadExpanded, setIsThreadExpanded] = useState(false);

  const config = CATEGORY_CONFIG[kudos.category];
  const CategoryIcon = config.icon;

  const senderName = kudos.fromEmployee?.fullName ?? 'Colaborador';
  const receiverName = kudos.toEmployee?.fullName ?? 'Colaborador';
  const senderRole = kudos.fromEmployee?.position?.name;
  const receiverRole = kudos.toEmployee?.position?.name;
  const senderDept = kudos.fromEmployee?.department?.name;
  const receiverDept = kudos.toEmployee?.department?.name;

  const reactions = kudos.reactionsSummary ?? [];
  const repliesCount = kudos.repliesCount ?? 0;
  const relativeTime = formatRelativeTime(kudos.createdAt);
  const hasContextActions = canPin || canDelete;

  const handleReactionClick = (emoji: string) => {
    onReact(kudos.id, emoji);
  };

  return (
    <article
      data-testid={`kudos-card-${kudos.id}`}
      className={cn(
        'rounded-xl border bg-white dark:bg-slate-800/60 border-border p-5 transition-shadow',
        'hover:shadow-md',
        kudos.isPinned &&
          'ring-1 ring-amber-200/70 dark:ring-amber-500/20 shadow-sm'
      )}
    >
      {/* HEADER: avatares + nomes + categoria + actions */}
      <header className="flex items-start gap-3">
        {/* Sender avatar */}
        <UserAvatar
          name={senderName}
          avatarUrl={kudos.fromEmployee?.photoUrl}
          size="md"
          className="shrink-0"
        />

        <div className="min-w-0 flex-1">
          {/* Title line: "X reconheceu Y" */}
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="font-semibold text-foreground">{senderName}</span>
            <span className="text-muted-foreground">deu kudos para</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />
            {/* Receiver avatar inline (smaller) */}
            <UserAvatar
              name={receiverName}
              avatarUrl={kudos.toEmployee?.photoUrl}
              size="sm"
              className="h-6 w-6"
            />
            <span className="font-semibold text-foreground">
              {receiverName}
            </span>
          </div>

          {/* Sub line: roles/depts */}
          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {senderRole && <span>{senderRole}</span>}
            {senderRole && senderDept && <span>·</span>}
            {senderDept && <span>{senderDept}</span>}
            <span className="mx-1">·</span>
            {receiverRole && <span>{receiverRole}</span>}
            {receiverRole && receiverDept && <span>·</span>}
            {receiverDept && <span>{receiverDept}</span>}
          </div>
        </div>

        {/* Pinned badge + dot menu */}
        <div className="flex items-center gap-2">
          {kudos.isPinned && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/8 dark:text-amber-300"
              data-testid={`kudos-pinned-badge-${kudos.id}`}
            >
              <Pin className="h-3 w-3" />
              Fixado
            </span>
          )}
          {hasContextActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Mais acoes"
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  data-testid={`kudos-actions-${kudos.id}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {canPin && (
                  <DropdownMenuItem
                    onClick={() => onTogglePin?.(kudos)}
                    data-testid={`kudos-toggle-pin-${kudos.id}`}
                  >
                    {kudos.isPinned ? (
                      <>
                        <PinOff className="mr-2 h-4 w-4" />
                        Desafixar
                      </>
                    ) : (
                      <>
                        <Pin className="mr-2 h-4 w-4" />
                        Fixar no topo
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {canPin && canDelete && <DropdownMenuSeparator />}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete?.(kudos)}
                    className="text-rose-600 focus:text-rose-600"
                    data-testid={`kudos-delete-${kudos.id}`}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* MESSAGE */}
      <p className="mt-3 whitespace-pre-line text-sm text-foreground/90">
        {kudos.message}
      </p>

      {/* META: category + private + time */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
            config.badgeClass
          )}
        >
          <CategoryIcon className="h-3 w-3" />
          {config.label}
        </span>
        {!kudos.isPublic && (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300">
            <Lock className="h-3 w-3" />
            Privado
          </span>
        )}
        <span
          className="ml-auto text-xs text-muted-foreground"
          title={new Date(kudos.createdAt).toLocaleString('pt-BR')}
        >
          {relativeTime}
        </span>
      </div>

      {/* REACTIONS row */}
      <div
        className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3"
        data-testid={`kudos-react-${kudos.id}`}
      >
        {reactions.map(reaction => (
          <button
            key={reaction.emoji}
            type="button"
            onClick={() => handleReactionClick(reaction.emoji)}
            data-testid={`kudos-reaction-${kudos.id}-${reaction.emoji}`}
            className={cn(
              'inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs transition-colors',
              reaction.hasReacted
                ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/40 dark:bg-violet-500/12 dark:text-violet-200'
                : 'border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:bg-accent hover:text-foreground'
            )}
            aria-pressed={reaction.hasReacted}
          >
            <span aria-hidden="true">{reaction.emoji}</span>
            <span className="font-medium">{reaction.count}</span>
          </button>
        ))}
        <EmojiPicker
          onSelect={emoji => handleReactionClick(emoji)}
          testIdPrefix={`kudos-emoji-${kudos.id}`}
        />

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsThreadExpanded(prev => !prev)}
            data-testid={`kudos-reply-${kudos.id}`}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border border-border bg-transparent px-2.5 py-1 text-xs text-muted-foreground transition-colors',
              'hover:border-primary/40 hover:bg-accent hover:text-foreground',
              isThreadExpanded &&
                'border-primary/40 bg-accent text-foreground'
            )}
            aria-expanded={isThreadExpanded}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {repliesCount > 0
              ? `${repliesCount} ${repliesCount === 1 ? 'resposta' : 'respostas'}`
              : 'Responder'}
          </button>
        </div>
      </div>

      {/* THREAD (expanded) */}
      {isThreadExpanded && (
        <div className="mt-3 border-t border-border/60 pt-3">
          <ReplyThread
            kudosId={kudos.id}
            currentEmployeeId={currentEmployeeId}
            canAdminReplies={canAdminReplies}
          />
        </div>
      )}
    </article>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatRelativeTime(isoDate: string): string {
  const now = new Date();
  const created = new Date(isoDate);
  const diffMs = now.getTime() - created.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays}d`;
  return created.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: now.getFullYear() === created.getFullYear() ? undefined : 'numeric',
  });
}
