'use client';

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mail,
  Megaphone,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useResolveNotification } from '../../hooks/use-notification-preferences';
import { useMarkNotificationReadV2 } from '../../hooks/use-notifications-v2';
import {
  NotificationKind,
  type NotificationActionDefinition,
  type NotificationFormField,
  type NotificationRecord,
} from '../../types';
import { sanitizeText, sanitizeUrl } from '../../utils/sanitize';

interface NotificationItemProps {
  notification: NotificationRecord;
  onOpen?: () => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onOpen,
  compact,
}: NotificationItemProps) {
  const kind = notification.kind ?? NotificationKind.INFORMATIONAL;
  const isUnread = !notification.isRead;
  const router = useRouter();
  const markRead = useMarkNotificationReadV2();

  const navigateTarget = sanitizeUrl(resolveNavigateTarget(notification, kind));
  const safeTitle = sanitizeText(notification.title);
  const safeMessage = sanitizeText(notification.message);

  const handleClick = (e: React.MouseEvent) => {
    // Ignore clicks that came from interactive children (buttons, links, inputs)
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select, [role="button"]'))
      return;

    if (isUnread) {
      markRead.mutate(notification.id);
    }
    if (onOpen) onOpen();
    if (navigateTarget) {
      router.push(navigateTarget);
    }
  };

  const clickable = Boolean(navigateTarget || isUnread);

  return (
    <div
      onClick={clickable ? handleClick : undefined}
      className={cn(
        'flex gap-3 p-3.5 rounded-lg border transition-all relative',
        'border-l-4',
        clickable && 'cursor-pointer hover:shadow-md',
        isUnread
          ? 'bg-white dark:bg-slate-800/60 border-gray-200 dark:border-white/10 shadow-sm'
          : 'bg-gray-50/60 dark:bg-white/[0.02] border-gray-100 dark:border-white/5',
        isUnread
          ? priorityBorderColor(notification.priority)
          : 'border-l-transparent'
      )}
    >
      {isUnread && (
        <span className="absolute top-3.5 right-3.5 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
      )}

      <div className="shrink-0">
        <KindBadge kind={kind} />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5 pr-4">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              'text-sm truncate',
              isUnread
                ? 'font-semibold text-gray-900 dark:text-white'
                : 'font-medium text-gray-500 dark:text-white/50'
            )}
          >
            {safeTitle}
          </h4>
          <span
            className={cn(
              'text-[11px] shrink-0 tabular-nums',
              isUnread
                ? 'text-gray-600 dark:text-white/60'
                : 'text-gray-400 dark:text-white/30'
            )}
          >
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>

        <p
          className={cn(
            'text-xs line-clamp-2',
            isUnread
              ? 'text-gray-700 dark:text-white/70'
              : 'text-gray-400 dark:text-white/30'
          )}
        >
          {safeMessage}
        </p>

        <KindRenderer
          kind={kind}
          notification={notification}
          onOpen={onOpen}
          compact={compact}
        />
      </div>
    </div>
  );
}

function priorityBorderColor(priority: string): string {
  switch (priority) {
    case 'URGENT':
      return 'border-l-rose-500';
    case 'HIGH':
      return 'border-l-amber-500';
    case 'NORMAL':
      return 'border-l-blue-500';
    case 'LOW':
      return 'border-l-slate-400';
    default:
      return 'border-l-blue-500';
  }
}

function resolveNavigateTarget(
  n: NotificationRecord,
  kind: NotificationKind
): string | null {
  const md = (n.metadata ?? {}) as Record<string, unknown>;
  if (kind === NotificationKind.REPORT) {
    return (md.reportUrl as string) ?? n.actionUrl ?? null;
  }
  if (kind === NotificationKind.EMAIL_PREVIEW) {
    return (md.openInAppUrl as string) ?? n.actionUrl ?? null;
  }
  if (n.actionUrl) return n.actionUrl;
  return null;
}

function KindBadge({ kind }: { kind: NotificationKind }) {
  const map: Record<NotificationKind, { icon: React.ReactNode; cls: string }> =
    {
      [NotificationKind.INFORMATIONAL]: {
        icon: <Bell className="h-4 w-4" />,
        cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      },
      [NotificationKind.LINK]: {
        icon: <ExternalLink className="h-4 w-4" />,
        cls: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      },
      [NotificationKind.ACTIONABLE]: {
        icon: <CheckCircle2 className="h-4 w-4" />,
        cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      },
      [NotificationKind.APPROVAL]: {
        icon: <CheckCircle2 className="h-4 w-4" />,
        cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      },
      [NotificationKind.FORM]: {
        icon: <CheckCircle2 className="h-4 w-4" />,
        cls: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      },
      [NotificationKind.PROGRESS]: {
        icon: <Loader2 className="h-4 w-4 animate-spin" />,
        cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
      },
      [NotificationKind.SYSTEM_BANNER]: {
        icon: <AlertCircle className="h-4 w-4" />,
        cls: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      },
      [NotificationKind.IMAGE_BANNER]: {
        icon: <Megaphone className="h-4 w-4" />,
        cls: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
      },
      [NotificationKind.REPORT]: {
        icon: <FileText className="h-4 w-4" />,
        cls: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
      },
      [NotificationKind.EMAIL_PREVIEW]: {
        icon: <Mail className="h-4 w-4" />,
        cls: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      },
    };
  const { icon, cls } = map[kind] ?? map[NotificationKind.INFORMATIONAL];
  return (
    <div
      className={cn(
        'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
        cls
      )}
    >
      {icon}
    </div>
  );
}

function KindRenderer({
  kind,
  notification,
  onOpen,
  compact,
}: {
  kind: NotificationKind;
  notification: NotificationRecord;
  onOpen?: () => void;
  compact?: boolean;
}) {
  switch (kind) {
    case NotificationKind.LINK: {
      const safeLinkUrl = sanitizeUrl(notification.actionUrl);
      const rawActionText =
        notification.metadata &&
        (notification.metadata as Record<string, unknown>).actionText
          ? String(
              (notification.metadata as Record<string, unknown>).actionText
            )
          : 'Abrir';
      return safeLinkUrl ? (
        <Link
          href={safeLinkUrl}
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          onClick={onOpen}
        >
          <ExternalLink className="h-3 w-3" />
          {sanitizeText(rawActionText)}
        </Link>
      ) : null;
    }

    case NotificationKind.ACTIONABLE:
    case NotificationKind.APPROVAL:
      return (
        <ActionButtons
          notification={notification}
          requireReasonOnDestructive={kind === NotificationKind.APPROVAL}
          disabled={notification.state !== 'PENDING'}
        />
      );

    case NotificationKind.FORM:
      if (notification.state !== 'PENDING') {
        return (
          <div className="text-xs text-muted-foreground italic">
            Formulário enviado
          </div>
        );
      }
      return compact ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Preencher formulário
          <ChevronRight className="h-3 w-3" />
        </button>
      ) : (
        <FormRenderer notification={notification} />
      );

    case NotificationKind.PROGRESS:
      return (
        <ProgressBlock
          progress={notification.progress ?? 0}
          total={notification.progressTotal ?? 100}
          detailsUrl={notification.actionUrl ?? null}
        />
      );

    case NotificationKind.IMAGE_BANNER:
      return (
        <ImageBannerBlock
          imageUrl={
            (notification.metadata as Record<string, unknown> | null)
              ?.imageUrl as string | undefined
          }
          imageAlt={
            (notification.metadata as Record<string, unknown> | null)
              ?.imageAlt as string | undefined
          }
          actionUrl={notification.actionUrl ?? null}
          compact={compact}
        />
      );

    case NotificationKind.REPORT:
      return <ReportBlock notification={notification} compact={compact} />;

    case NotificationKind.EMAIL_PREVIEW:
      return <EmailPreviewBlock notification={notification} />;

    default:
      return null;
  }
}

function ActionButtons({
  notification,
  requireReasonOnDestructive,
  disabled,
}: {
  notification: NotificationRecord;
  requireReasonOnDestructive: boolean;
  disabled: boolean;
}) {
  const { mutateAsync, isPending } = useResolveNotification();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const actions = (notification.actions ??
    []) as NotificationActionDefinition[];

  const handleResolve = async (action: NotificationActionDefinition) => {
    if (
      action.requiresReason ||
      (requireReasonOnDestructive && action.style === 'destructive')
    ) {
      if (activeAction !== action.key) {
        setActiveAction(action.key);
        return;
      }
      if (!reason.trim()) return;
    }
    await mutateAsync({
      notificationId: notification.id,
      actionKey: action.key,
      reason: reason || undefined,
    });
    setActiveAction(null);
    setReason('');
  };

  if (disabled) {
    return (
      <div className="text-xs text-muted-foreground italic flex items-center gap-1">
        <Check className="h-3 w-3" />
        Resolvido como{' '}
        <span className="font-medium">
          {sanitizeText(notification.resolvedAction)}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-1" onClick={e => e.stopPropagation()}>
      <div className="flex gap-2 flex-wrap">
        {actions.map(action => (
          <Button
            key={action.key}
            size="sm"
            variant={
              action.style === 'destructive'
                ? 'destructive'
                : action.style === 'ghost'
                  ? 'ghost'
                  : 'default'
            }
            onClick={() => handleResolve(action)}
            disabled={isPending}
            className="h-7 text-xs"
          >
            {sanitizeText(action.label)}
          </Button>
        ))}
      </div>
      {activeAction && (
        <div className="space-y-1">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Justificativa..."
            className="w-full text-xs border rounded p-2 resize-none bg-background"
            rows={2}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setActiveAction(null);
              setReason('');
            }}
            className="h-6 text-xs"
          >
            <X className="h-3 w-3 mr-1" /> Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}

function FormRenderer({ notification }: { notification: NotificationRecord }) {
  const { mutateAsync, isPending } = useResolveNotification();
  const submit = (notification.actions ?? [])[0];
  const fields = (submit?.formSchema ?? []) as NotificationFormField[];
  const [values, setValues] = useState<Record<string, unknown>>({});

  return (
    <form
      className="space-y-2 pt-1"
      onClick={e => e.stopPropagation()}
      onSubmit={async e => {
        e.preventDefault();
        await mutateAsync({
          notificationId: notification.id,
          actionKey: submit?.key ?? 'submit',
          payload: values,
        });
      }}
    >
      {fields.map(field => (
        <div key={field.key} className="space-y-1">
          <label className="text-xs font-medium">
            {sanitizeText(field.label)}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              required={field.required}
              className="w-full text-xs border rounded p-2 bg-background"
              rows={2}
              onChange={e =>
                setValues(v => ({ ...v, [field.key]: e.target.value }))
              }
            />
          ) : (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              required={field.required}
              className="w-full text-xs border rounded p-2 bg-background"
              onChange={e =>
                setValues(v => ({
                  ...v,
                  [field.key]:
                    field.type === 'number'
                      ? Number(e.target.value)
                      : e.target.value,
                }))
              }
            />
          )}
        </div>
      ))}
      <Button
        type="submit"
        size="sm"
        disabled={isPending}
        className="h-7 text-xs"
      >
        {sanitizeText(submit?.label) || 'Enviar'}
      </Button>
    </form>
  );
}

function ProgressBlock({
  progress,
  total,
  detailsUrl,
}: {
  progress: number;
  total: number;
  detailsUrl: string | null;
}) {
  const pct =
    total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 0;
  const safeDetailsUrl = sanitizeUrl(detailsUrl);
  return (
    <div className="space-y-1 pt-1">
      <div className="flex justify-between items-center text-[11px] text-muted-foreground">
        <span className="tabular-nums">
          {progress} / {total}
        </span>
        <span className="tabular-nums font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      {safeDetailsUrl && (
        <Link
          href={safeDetailsUrl}
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          Ver detalhes <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function ImageBannerBlock({
  imageUrl,
  imageAlt,
  actionUrl,
  compact,
}: {
  imageUrl?: string;
  imageAlt?: string;
  actionUrl: string | null;
  compact?: boolean;
}) {
  const safeImageUrl = sanitizeUrl(imageUrl);
  const safeAlt = sanitizeText(imageAlt) || 'Banner';
  const safeActionUrl = sanitizeUrl(actionUrl);
  if (!safeImageUrl) return null;
  return (
    <div className="pt-1 space-y-1.5">
      <div
        className={cn(
          'relative rounded-md overflow-hidden bg-muted flex items-center justify-center',
          compact ? 'h-24' : 'h-48'
        )}
      >
        <img
          src={safeImageUrl}
          alt={safeAlt}
          className="w-full h-full object-cover"
          onError={e => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <ImageIcon className="h-6 w-6 text-muted-foreground absolute" />
      </div>
      {safeActionUrl && (
        <Link
          href={safeActionUrl}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Abrir <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function ReportBlock({
  notification,
  compact,
}: {
  notification: NotificationRecord;
  compact?: boolean;
}) {
  const md = (notification.metadata ?? {}) as Record<string, unknown>;
  const safeUrl = sanitizeUrl(
    (md.reportUrl as string | undefined) ?? notification.actionUrl ?? null
  );
  const safeName =
    sanitizeText(md.reportName as string | undefined) || 'Relatório';
  const safeFormat =
    sanitizeText(md.reportFormat as string | undefined) || 'pdf';
  const size = md.reportSize as number | undefined;
  const safePeriod = sanitizeText(md.reportPeriod as string | undefined);

  return (
    <div
      className="flex items-center gap-3 p-2 rounded-md border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] mt-1"
      onClick={e => e.stopPropagation()}
    >
      <div className="h-10 w-10 shrink-0 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{safeName}</p>
        <p className="text-[11px] text-muted-foreground">
          {safeFormat.toUpperCase()}
          {size ? ` · ${(size / 1024).toFixed(0)} KB` : ''}
          {safePeriod ? ` · ${safePeriod}` : ''}
        </p>
      </div>
      {safeUrl && (
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-7 gap-1 shrink-0"
        >
          <Link
            href={safeUrl}
            target={safeUrl.startsWith('http') ? '_blank' : undefined}
          >
            <Download className="h-3.5 w-3.5" />
            {compact ? '' : 'Baixar'}
          </Link>
        </Button>
      )}
    </div>
  );
}

function EmailPreviewBlock({
  notification,
}: {
  notification: NotificationRecord;
}) {
  const md = (notification.metadata ?? {}) as Record<string, unknown>;
  const safeFrom = sanitizeText(
    (md.emailFromName as string | undefined) ?? (md.emailFrom as string)
  );
  const safeSubject = sanitizeText(md.emailSubject as string | undefined);
  const safePreview = sanitizeText(md.emailPreview as string | undefined);
  const safeOpenUrl = sanitizeUrl(
    (md.openInAppUrl as string | undefined) ?? notification.actionUrl ?? null
  );

  return (
    <div className="space-y-1 mt-1 p-2 rounded-md border border-sky-200 dark:border-sky-500/20 bg-sky-50/60 dark:bg-sky-500/5">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Mail className="h-3 w-3" />
        <span className="font-medium text-gray-800 dark:text-white/80">
          {safeFrom}
        </span>
      </div>
      {safeSubject && (
        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
          {safeSubject}
        </p>
      )}
      {safePreview && (
        <p className="text-[11px] text-muted-foreground line-clamp-2">
          {safePreview}
        </p>
      )}
      {safeOpenUrl && (
        <Link
          href={safeOpenUrl}
          className="inline-flex items-center gap-1 text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
        >
          Abrir no e-mail <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}
