import type { EmailFolder, EmailFolderType } from '@/types/email';
import {
  AlertTriangle,
  FileEdit,
  Folder,
  Inbox,
  Send,
  Trash2,
} from 'lucide-react';
import type { EmailMessageListItem } from '@/types/email';
import {
  format,
  isSameMonth,
  isSameWeek,
  isSameYear,
  isToday,
  isYesterday,
  subWeeks,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Avatar Colors ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
];

export function getAvatarColor(email: string): string {
  let hash = 0;
  for (const char of email) hash = (hash << 5) - hash + char.charCodeAt(0);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string | null, address: string): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  return address.substring(0, 2).toUpperCase();
}

// ── Date Formatting ──────────────────────────────────────────────────────────

export function formatEmailDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return format(d, "'Ontem', HH:mm");
  if (isSameYear(d, now)) return format(d, 'd MMM', { locale: ptBR });
  return format(d, 'd MMM yyyy', { locale: ptBR });
}

export function formatEmailDateFull(dateStr: string): string {
  return format(new Date(dateStr), "d 'de' MMMM 'de' yyyy, HH:mm", {
    locale: ptBR,
  });
}

// ── File Utils ───────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Folder Utils ─────────────────────────────────────────────────────────────

export const FOLDER_ICON: Record<EmailFolderType, React.ElementType> = {
  INBOX: Inbox,
  SENT: Send,
  DRAFTS: FileEdit,
  TRASH: Trash2,
  SPAM: AlertTriangle,
  CUSTOM: Folder,
};

export const FOLDER_ORDER: EmailFolderType[] = [
  'INBOX',
  'SENT',
  'DRAFTS',
  'SPAM',
  'TRASH',
  'CUSTOM',
];

/** Map IMAP/English folder names to Portuguese */
export const FOLDER_PT_NAMES: Record<string, string> = {
  inbox: 'Caixa de entrada',
  sent: 'Enviados',
  'sent mail': 'Enviados',
  'sent items': 'Enviados',
  drafts: 'Rascunhos',
  draft: 'Rascunhos',
  trash: 'Lixeira',
  'deleted items': 'Lixeira',
  deleted: 'Lixeira',
  spam: 'Spam',
  junk: 'Spam',
  'junk e-mail': 'Spam',
  archive: 'Arquivo',
  archives: 'Arquivo',
  all: 'Todos',
  'all mail': 'Todos',
  starred: 'Com estrela',
  flagged: 'Com estrela',
  important: 'Importantes',
};

export function getFolderDisplayName(folder: EmailFolder): string {
  const lower = folder.displayName.toLowerCase().trim();
  if (FOLDER_PT_NAMES[lower]) return FOLDER_PT_NAMES[lower];

  const remoteLower = folder.remoteName.toLowerCase().trim();
  if (FOLDER_PT_NAMES[remoteLower]) return FOLDER_PT_NAMES[remoteLower];

  // Try partial matches
  for (const [key, label] of Object.entries(FOLDER_PT_NAMES)) {
    if (lower.includes(key) || remoteLower.includes(key)) return label;
  }

  return folder.displayName;
}

// ── Date Grouping ─────────────────────────────────────────────────────────────

export interface DateGroup {
  key: string;
  label: string;
  messages: EmailMessageListItem[];
}

/**
 * Classifies a date into a group key.
 * Priority order ensures mutual exclusivity:
 * today > yesterday > this-week > last-week > this-month > month-YYYY-M
 */
function getDateGroupKey(date: Date, now: Date): string {
  if (isToday(date)) return 'today';
  if (isYesterday(date)) return 'yesterday';
  if (isSameWeek(date, now, { weekStartsOn: 1 })) return 'this-week';

  const lastWeekRef = subWeeks(now, 1);
  if (isSameWeek(date, lastWeekRef, { weekStartsOn: 1 })) return 'last-week';

  if (isSameMonth(date, now) && isSameYear(date, now)) return 'this-month';

  return `month-${date.getFullYear()}-${date.getMonth()}`;
}

/** Returns a human-readable label for a group key */
function getDateGroupLabel(key: string, now: Date): string {
  if (key === 'today') return 'Hoje';
  if (key === 'yesterday') return 'Ontem';
  if (key === 'this-week') return 'Essa Semana';
  if (key === 'last-week') return 'Semana Passada';
  if (key === 'this-month') return 'Este Mês';

  // month-YYYY-M
  const parts = key.split('-');
  const year = parseInt(parts[1], 10);
  const month = parseInt(parts[2], 10);
  const monthDate = new Date(year, month, 1);
  const monthName = format(monthDate, 'MMMM', { locale: ptBR });
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  if (isSameYear(monthDate, now)) return capitalized;
  return `${capitalized} de ${year}`;
}

/** Group order — defines display priority from most recent to oldest */
const GROUP_ORDER = [
  'today',
  'yesterday',
  'this-week',
  'last-week',
  'this-month',
];

/**
 * Groups messages by date category. Messages within each group
 * retain their original order (assumed to be date descending).
 * Groups are ordered from most recent to oldest.
 */
export function groupMessagesByDate(
  messages: EmailMessageListItem[]
): DateGroup[] {
  const now = new Date();
  const groupMap = new Map<string, EmailMessageListItem[]>();

  for (const msg of messages) {
    const key = getDateGroupKey(new Date(msg.receivedAt), now);
    const existing = groupMap.get(key);
    if (existing) {
      existing.push(msg);
    } else {
      groupMap.set(key, [msg]);
    }
  }

  // Sort groups: fixed-order groups first, then month groups by date descending
  const sortedKeys = [...groupMap.keys()].sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a);
    const bi = GROUP_ORDER.indexOf(b);

    // Both are fixed-order groups
    if (ai !== -1 && bi !== -1) return ai - bi;
    // Only a is fixed-order
    if (ai !== -1) return -1;
    // Only b is fixed-order
    if (bi !== -1) return 1;

    // Both are month-YYYY-M: sort descending (newer months first)
    const [, aYear, aMonth] = a.split('-').map(Number);
    const [, bYear, bMonth] = b.split('-').map(Number);
    if (aYear !== bYear) return bYear - aYear;
    return bMonth - aMonth;
  });

  return sortedKeys.map(key => ({
    key,
    label: getDateGroupLabel(key, now),
    messages: groupMap.get(key)!,
  }));
}
