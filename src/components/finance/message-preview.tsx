/**
 * MessagePreview
 * Previews an escalation message template with example data.
 * Supports WhatsApp bubble, Email card, Internal Note, and System Alert styles.
 */

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Mail,
  MessageCircle,
  FileText,
  Bell,
  Smartphone,
  X,
} from 'lucide-react';
import type { EscalationChannel } from '@/types/finance';

// ============================================================================
// TYPES
// ============================================================================

interface MessagePreviewProps {
  /** Raw message template with {placeholders} */
  message: string;
  /** Subject line (for EMAIL) */
  subject?: string;
  /** Currently selected channel */
  channel: EscalationChannel;
  /** Show channel toggle buttons */
  showChannelToggle?: boolean;
  /** Called when closed */
  onClose?: () => void;
  className?: string;
}

// ============================================================================
// EXAMPLE DATA
// ============================================================================

const EXAMPLE_DATA = {
  customerName: 'João Silva',
  amount: 'R$ 1.500,00',
  dueDate: '25/03/2026',
  daysPastDue: '15',
  entryCode: 'REC-0042',
  description: 'Mensalidade Março',
} as const;

const CHANNEL_ICON: Record<EscalationChannel, React.ReactNode> = {
  WHATSAPP: <MessageCircle className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  INTERNAL_NOTE: <FileText className="h-4 w-4" />,
  SYSTEM_ALERT: <Bell className="h-4 w-4" />,
};

const CHANNEL_LABEL: Record<EscalationChannel, string> = {
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  INTERNAL_NOTE: 'Nota Interna',
  SYSTEM_ALERT: 'Alerta do Sistema',
};

const CHANNEL_COLORS: Record<
  EscalationChannel,
  { bg: string; border: string; accent: string; bubble: string }
> = {
  WHATSAPP: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    accent: 'text-emerald-700 dark:text-emerald-300',
    bubble: 'bg-emerald-100 dark:bg-emerald-900/50',
  },
  EMAIL: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    border: 'border-sky-200 dark:border-sky-800',
    accent: 'text-sky-700 dark:text-sky-300',
    bubble: 'bg-white dark:bg-slate-800',
  },
  INTERNAL_NOTE: {
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    border: 'border-slate-200 dark:border-slate-700',
    accent: 'text-slate-700 dark:text-slate-300',
    bubble: 'bg-slate-100 dark:bg-slate-800/50',
  },
  SYSTEM_ALERT: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    accent: 'text-amber-700 dark:text-amber-300',
    bubble: 'bg-amber-100 dark:bg-amber-900/50',
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function replacePlaceholders(template: string): string {
  return template
    .replace(/{customerName}/g, EXAMPLE_DATA.customerName)
    .replace(/{amount}/g, EXAMPLE_DATA.amount)
    .replace(/{dueDate}/g, EXAMPLE_DATA.dueDate)
    .replace(/{daysPastDue}/g, EXAMPLE_DATA.daysPastDue)
    .replace(/{entryCode}/g, EXAMPLE_DATA.entryCode)
    .replace(/{description}/g, EXAMPLE_DATA.description);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MessagePreview({
  message,
  subject,
  channel: initialChannel,
  showChannelToggle = false,
  onClose,
  className,
}: MessagePreviewProps) {
  const [activeChannel, setActiveChannel] =
    useState<EscalationChannel>(initialChannel);

  const renderedMessage = useMemo(
    () => replacePlaceholders(message || ''),
    [message],
  );
  const renderedSubject = useMemo(
    () => (subject ? replacePlaceholders(subject) : ''),
    [subject],
  );

  const colors = CHANNEL_COLORS[activeChannel];

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden',
        colors.border,
        className,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-2.5 border-b',
          colors.bg,
          colors.border,
        )}
      >
        <div className={cn('flex items-center gap-2 text-sm font-medium', colors.accent)}>
          {CHANNEL_ICON[activeChannel]}
          <span>Pré-visualização — {CHANNEL_LABEL[activeChannel]}</span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Channel Toggle */}
      {showChannelToggle && (
        <div className={cn('flex gap-1 px-4 py-2 border-b', colors.border)}>
          {(
            Object.keys(CHANNEL_LABEL) as EscalationChannel[]
          ).map((ch) => (
            <Button
              key={ch}
              variant={activeChannel === ch ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveChannel(ch)}
            >
              {CHANNEL_ICON[ch]}
              <span className="ml-1.5">{CHANNEL_LABEL[ch]}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Preview Body */}
      <div className={cn('p-4', colors.bg)}>
        {activeChannel === 'WHATSAPP' && (
          <WhatsAppPreview message={renderedMessage} />
        )}
        {activeChannel === 'EMAIL' && (
          <EmailPreview subject={renderedSubject} message={renderedMessage} />
        )}
        {activeChannel === 'INTERNAL_NOTE' && (
          <InternalNotePreview message={renderedMessage} />
        )}
        {activeChannel === 'SYSTEM_ALERT' && (
          <SystemAlertPreview
            subject={renderedSubject}
            message={renderedMessage}
          />
        )}
      </div>

      {/* Footer — example data notice */}
      <div
        className={cn(
          'px-4 py-2 text-[11px] text-muted-foreground border-t',
          colors.border,
        )}
      >
        Dados de exemplo: {EXAMPLE_DATA.customerName} &bull;{' '}
        {EXAMPLE_DATA.amount} &bull; Vencimento: {EXAMPLE_DATA.dueDate}
      </div>
    </div>
  );
}

// ============================================================================
// CHANNEL-SPECIFIC PREVIEWS
// ============================================================================

function WhatsAppPreview({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div className="w-full max-w-[320px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-[#e5ddd5] dark:bg-slate-900 overflow-hidden">
        {/* WhatsApp header */}
        <div className="bg-emerald-600 dark:bg-emerald-800 px-3 py-2 flex items-center gap-2">
          <Smartphone className="h-3.5 w-3.5 text-white/80" />
          <span className="text-white text-xs font-medium">
            Cobrança Automática
          </span>
        </div>
        {/* Message bubble */}
        <div className="p-3 min-h-[100px]">
          <div className="bg-white dark:bg-emerald-900/60 rounded-lg rounded-tl-none p-2.5 shadow-sm max-w-[85%] text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
            {message || (
              <span className="text-muted-foreground italic">
                Digite uma mensagem para ver a pré-visualização
              </span>
            )}
            <div className="text-[10px] text-slate-400 text-right mt-1">
              14:30
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailPreview({
  subject,
  message,
}: {
  subject: string;
  message: string;
}) {
  return (
    <div className="w-full max-w-[440px] mx-auto rounded-lg border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
      {/* Email header */}
      <div className="px-4 py-3 border-b border-sky-100 dark:border-sky-900 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">De:</span>
          <span className="text-xs font-medium">noreply@empresa.com</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Para:</span>
          <span className="text-xs font-medium">joao@email.com</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Assunto:</span>
          <span className="text-xs font-semibold">
            {subject || 'Cobrança'}
          </span>
        </div>
      </div>
      {/* Email body */}
      <div className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed min-h-[80px]">
        {message || (
          <span className="text-muted-foreground italic">
            Digite uma mensagem para ver a pré-visualização
          </span>
        )}
      </div>
    </div>
  );
}

function InternalNotePreview({ message }: { message: string }) {
  const now = new Date();
  const timestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="w-full max-w-[440px] mx-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span>Nota adicionada automaticamente em {timestamp}</span>
      </div>
      <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed border-l-2 border-slate-300 dark:border-slate-600 pl-3">
        {message || (
          <span className="text-muted-foreground italic">
            Digite uma mensagem para ver a pré-visualização
          </span>
        )}
      </div>
    </div>
  );
}

function SystemAlertPreview({
  subject,
  message,
}: {
  subject: string;
  message: string;
}) {
  return (
    <div className="w-full max-w-[440px] mx-auto rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          {subject || 'Alerta de Cobrança'}
        </span>
      </div>
      <div className="text-sm text-amber-700 dark:text-amber-300/80 whitespace-pre-wrap leading-relaxed">
        {message || (
          <span className="text-muted-foreground italic">
            Digite uma mensagem para ver a pré-visualização
          </span>
        )}
      </div>
      <div className="text-[10px] text-amber-500 dark:text-amber-500/60">
        Prioridade: Alta &bull; Tipo: Alerta
      </div>
    </div>
  );
}
