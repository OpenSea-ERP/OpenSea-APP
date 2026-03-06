import type { EmailFolder, EmailFolderType } from '@/types/email';
import {
  AlertTriangle,
  FileEdit,
  Folder,
  Inbox,
  Send,
  Trash2,
} from 'lucide-react';
import {
  format,
  isSameYear,
  isToday,
  isYesterday,
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
