'use client';

import { CentralBadge } from '@/components/central/central-badge';
import type { CentralBadgeVariant } from '@/components/central/central-badge';
import { CentralCard } from '@/components/central/central-card';
import {
  useReplyTicket,
  useSupportTicket,
  useUpdateTicketStatus,
} from '@/hooks/admin/use-admin';
import { cn } from '@/lib/utils';
import type { SupportTicket, SupportTicketMessage } from '@/types/admin';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  Send,
  Star,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

// ─── Config ────────────────────────────────────────────────────────────────────

const PRIORITY_VARIANTS: Record<string, CentralBadgeVariant> = {
  CRITICAL: 'rose',
  HIGH: 'orange',
  MEDIUM: 'sky',
  LOW: 'default',
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítico',
  HIGH: 'Alto',
  MEDIUM: 'Médio',
  LOW: 'Baixo',
};

const STATUS_VARIANTS: Record<string, CentralBadgeVariant> = {
  OPEN: 'sky',
  IN_PROGRESS: 'violet',
  WAITING_CLIENT: 'orange',
  RESOLVED: 'emerald',
  CLOSED: 'default',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em atendimento',
  WAITING_CLIENT: 'Aguardando',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
};

const CATEGORY_VARIANTS: Record<string, CentralBadgeVariant> = {
  BUG: 'rose',
  QUESTION: 'sky',
  REQUEST: 'violet',
  FINANCIAL: 'emerald',
  OTHER: 'default',
};

const CATEGORY_LABELS: Record<string, string> = {
  BUG: 'Bug',
  QUESTION: 'Dúvida',
  REQUEST: 'Solicitação',
  FINANCIAL: 'Financeiro',
  OTHER: 'Outro',
};

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Aberto' },
  { value: 'IN_PROGRESS', label: 'Em atendimento' },
  { value: 'WAITING_CLIENT', label: 'Aguardando' },
  { value: 'RESOLVED', label: 'Resolvido' },
  { value: 'CLOSED', label: 'Fechado' },
];

const TEAM_MEMBERS = [
  { value: '', label: 'Não atribuído' },
  { value: 'a1', label: 'Carlos Admin' },
  { value: 'a2', label: 'Ana Suporte' },
  { value: 'a3', label: 'Bruno DevOps' },
];

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_TICKET: SupportTicket = {
  id: '1',
  ticketNumber: 1842,
  tenantId: 't1',
  tenantName: 'Acme Corp',
  createdByUserId: 'u1',
  creatorName: 'João Silva',
  category: 'BUG',
  priority: 'CRITICAL',
  status: 'OPEN',
  subject: 'Falha na sincronização de estoque',
  description:
    'O estoque não está sincronizando corretamente entre o módulo de estoque e o PDV. Ao registrar uma venda no PDV, o estoque não é decrementado automaticamente. Isso está causando divergências nos relatórios.',
  assignedToUserId: 'a1',
  assigneeName: 'Carlos Admin',
  slaFirstResponseMinutes: 30,
  slaResolutionMinutes: 240,
  firstRespondedAt: '2026-03-21T08:45:00Z',
  slaBreached: true,
  createdAt: '2026-03-21T08:30:00Z',
  updatedAt: '2026-03-21T09:00:00Z',
  messages: [
    {
      id: 'm1',
      ticketId: '1',
      authorUserId: 'a1',
      authorName: 'Carlos Admin',
      authorType: 'CENTRAL_TEAM',
      content:
        'Olá João, obrigado por reportar. Estamos verificando o problema na sincronização. Pode nos informar desde quando isso está acontecendo?',
      isInternal: false,
      createdAt: '2026-03-21T08:45:00Z',
    },
    {
      id: 'm2',
      ticketId: '1',
      authorUserId: 'u1',
      authorName: 'João Silva',
      authorType: 'TENANT_USER',
      content:
        'Começou ontem à tarde, por volta das 14h. Desde então todas as vendas no PDV não estão atualizando o estoque.',
      isInternal: false,
      createdAt: '2026-03-21T09:00:00Z',
    },
    {
      id: 'm3',
      ticketId: '1',
      authorUserId: 'system',
      authorName: 'Atlas IA',
      authorType: 'AI_ASSISTANT',
      content:
        'Análise automática: Detectei que o webhook de sincronização entre os módulos Stock e Cashier está falhando com erro 503 desde 2026-03-20 14:02:33 UTC. O serviço de fila (BullMQ) pode estar com problemas de conexão ao Redis.',
      isInternal: false,
      createdAt: '2026-03-21T09:05:00Z',
    },
    {
      id: 'm4',
      ticketId: '1',
      authorUserId: 'a1',
      authorName: 'Carlos Admin',
      authorType: 'CENTRAL_TEAM',
      content:
        'Nota interna: Verificar logs do Redis no Fly.io. Possível problema de memória. @Bruno por favor checar o status do worker.',
      isInternal: true,
      createdAt: '2026-03-21T09:10:00Z',
    },
  ],
};

const MOCK_TICKET_RESOLVED: SupportTicket = {
  ...MOCK_TICKET,
  id: '6',
  ticketNumber: 1837,
  status: 'RESOLVED',
  satisfactionRating: 5,
  satisfactionComment: 'Excelente atendimento! Problema resolvido rapidamente.',
  resolvedAt: '2026-03-20T15:00:00Z',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSlaTime(minutes?: number): string {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}min`;
}

function getSlaStatus(
  limitMinutes?: number,
  respondedAt?: string,
  createdAt?: string
): { label: string; breached: boolean } {
  if (!limitMinutes) return { label: '—', breached: false };
  if (respondedAt && createdAt) {
    const elapsed = Math.floor(
      (new Date(respondedAt).getTime() - new Date(createdAt).getTime()) / 60000
    );
    const breached = elapsed > limitMinutes;
    return {
      label: `${formatSlaTime(elapsed)} / ${formatSlaTime(limitMinutes)}`,
      breached,
    };
  }
  return { label: `Limite: ${formatSlaTime(limitMinutes)}`, breached: false };
}

// ─── Components ────────────────────────────────────────────────────────────────

function MessageBubble({
  author,
  authorType,
  time,
  isInternal = false,
  children,
}: {
  author: string;
  authorType: SupportTicketMessage['authorType'];
  time: string;
  isInternal?: boolean;
  children: React.ReactNode;
}) {
  const isCentral = authorType === 'CENTRAL_TEAM';
  const isAI = authorType === 'AI_ASSISTANT';

  const bubbleStyle: React.CSSProperties = isInternal
    ? {
        border: '1px dashed var(--central-separator)',
        backgroundColor: 'var(--central-card-bg)',
      }
    : isCentral
      ? {
          backgroundColor: 'rgba(139,92,246,0.08)',
          border: '1px solid rgba(139,92,246,0.15)',
        }
      : isAI
        ? {
            backgroundColor: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.15)',
          }
        : {
            backgroundColor: 'var(--central-card-bg)',
            border: '1px solid var(--central-separator)',
          };

  const iconBg = isCentral
    ? 'rgba(139,92,246,0.15)'
    : isAI
      ? 'rgba(99,102,241,0.15)'
      : 'var(--central-avatar-bg)';

  const iconColor = isCentral
    ? '#8b5cf6'
    : isAI
      ? '#6366f1'
      : 'var(--central-avatar-text)';

  return (
    <div
      className={cn(
        'flex gap-3',
        isCentral && !isInternal ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'flex-1 rounded-xl px-4 py-3 max-w-[75%]',
          isCentral && !isInternal ? 'ml-auto' : ''
        )}
        style={bubbleStyle}
      >
        {/* Header */}
        <div
          className={cn(
            'flex items-center gap-2 mb-1',
            isCentral && !isInternal ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <span
            className="text-xs font-semibold"
            style={{ color: 'var(--central-text-primary)' }}
          >
            {author}
          </span>
          {isAI && <CentralBadge variant="violet">IA</CentralBadge>}
          {isInternal && (
            <span
              className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: 'rgba(245,158,11,0.1)',
                color: '#f59e0b',
              }}
            >
              <Lock className="h-2.5 w-2.5" />
              Nota interna
            </span>
          )}
          <span
            className="text-[10px]"
            style={{ color: 'var(--central-text-muted)' }}
          >
            {formatDate(time)}
          </span>
        </div>

        {/* Content */}
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--central-text-primary)' }}
        >
          {children}
        </p>
      </div>
    </div>
  );
}

function SatisfactionDisplay({
  rating,
  comment,
}: {
  rating: number;
  comment?: string;
}) {
  return (
    <CentralCard className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="h-4 w-4" style={{ color: '#10b981' }} />
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--central-text-primary)' }}
        >
          Avaliacao do cliente
        </span>
      </div>
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className="h-5 w-5"
            style={{
              color: i <= rating ? '#f59e0b' : 'var(--central-text-muted)',
              fill: i <= rating ? '#f59e0b' : 'transparent',
            }}
          />
        ))}
        <span
          className="ml-2 text-sm font-semibold"
          style={{ color: 'var(--central-text-primary)' }}
        >
          {rating}/5
        </span>
      </div>
      {comment && (
        <p
          className="text-sm italic"
          style={{ color: 'var(--central-text-secondary)' }}
        >
          &ldquo;{comment}&rdquo;
        </p>
      )}
    </CentralCard>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;

  const { data: apiTicket, isLoading } = useSupportTicket(ticketId);
  const replyMutation = useReplyTicket();
  const statusMutation = useUpdateTicketStatus();

  const [replyContent, setReplyContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  // Use API data if available, otherwise mock
  const ticket: SupportTicket | undefined =
    apiTicket ?? (ticketId === '6' ? MOCK_TICKET_RESOLVED : MOCK_TICKET);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2
          className="h-6 w-6 animate-spin"
          style={{ color: 'var(--central-text-muted)' }}
        />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="px-6 py-5">
        <p style={{ color: 'var(--central-text-muted)' }}>
          Ticket nao encontrado.
        </p>
      </div>
    );
  }

  const messages = ticket.messages ?? [];
  const slaFirstResponse = getSlaStatus(
    ticket.slaFirstResponseMinutes,
    ticket.firstRespondedAt,
    ticket.createdAt
  );
  const slaResolution = getSlaStatus(
    ticket.slaResolutionMinutes,
    ticket.resolvedAt,
    ticket.createdAt
  );

  const handleReply = () => {
    if (!replyContent.trim()) return;
    replyMutation.mutate(
      { ticketId, data: { content: replyContent, isInternal } },
      {
        onSuccess: () => {
          setReplyContent('');
          setIsInternal(false);
        },
      }
    );
  };

  const handleStatusChange = (newStatus: string) => {
    statusMutation.mutate({ ticketId, status: newStatus });
  };

  return (
    <div className="px-6 py-5 space-y-4">
      {/* Back link */}
      <Link
        href="/central/support"
        className="inline-flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
        style={{ color: 'var(--central-text-secondary)' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao suporte
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h1
            className="text-lg font-bold"
            style={{ color: 'var(--central-text-primary)' }}
          >
            #{ticket.ticketNumber} — {ticket.subject}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <CentralBadge
              variant={PRIORITY_VARIANTS[ticket.priority] ?? 'default'}
            >
              {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
            </CentralBadge>
            <CentralBadge variant={STATUS_VARIANTS[ticket.status] ?? 'default'}>
              {STATUS_LABELS[ticket.status] ?? ticket.status}
            </CentralBadge>
            <CentralBadge
              variant={CATEGORY_VARIANTS[ticket.category] ?? 'default'}
            >
              {CATEGORY_LABELS[ticket.category] ?? ticket.category}
            </CentralBadge>
          </div>
          <p
            className="text-xs mt-2"
            style={{ color: 'var(--central-text-secondary)' }}
          >
            Tenant: {ticket.tenantName ?? '—'} · Criado por:{' '}
            {ticket.creatorName ?? '—'} · {formatDate(ticket.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={ticket.status}
            onChange={e => handleStatusChange(e.target.value)}
            className="h-9 px-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer bg-transparent"
            style={{
              borderColor: 'var(--central-separator)',
              color: 'var(--central-text-primary)',
            }}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={ticket.assignedToUserId ?? ''}
            onChange={() => {
              // Assignment handled via useAssignTicket hook
            }}
            className="h-9 px-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer bg-transparent"
            style={{
              borderColor: 'var(--central-separator)',
              color: 'var(--central-text-primary)',
            }}
          >
            {TEAM_MEMBERS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SLA info bar */}
      <div
        className="flex flex-wrap gap-4 text-xs px-4 py-2.5 rounded-lg"
        style={{
          backgroundColor: 'var(--central-card-bg)',
          border: '1px solid var(--central-separator)',
        }}
      >
        <span style={{ color: 'var(--central-text-secondary)' }}>
          <Clock className="inline h-3 w-3 mr-1" style={{ marginTop: -2 }} />
          SLA 1.a resposta:{' '}
          <span
            className="font-semibold"
            style={{
              color: slaFirstResponse.breached
                ? '#f43f5e'
                : 'var(--central-text-primary)',
            }}
          >
            {slaFirstResponse.label}
          </span>
        </span>
        <span style={{ color: 'var(--central-text-secondary)' }}>
          <Clock className="inline h-3 w-3 mr-1" style={{ marginTop: -2 }} />
          SLA resolucao:{' '}
          <span
            className="font-semibold"
            style={{
              color: slaResolution.breached
                ? '#f43f5e'
                : 'var(--central-text-primary)',
            }}
          >
            {slaResolution.label}
          </span>
        </span>
      </div>

      {/* Conversation */}
      <CentralCard className="p-5">
        <div className="space-y-4">
          {/* Initial description */}
          <MessageBubble
            author={ticket.creatorName ?? 'Usuário'}
            authorType="TENANT_USER"
            time={ticket.createdAt}
          >
            {ticket.description}
          </MessageBubble>

          {/* Messages */}
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              author={msg.authorName ?? 'Desconhecido'}
              authorType={msg.authorType}
              time={msg.createdAt}
              isInternal={msg.isInternal}
            >
              {msg.content}
            </MessageBubble>
          ))}
        </div>

        {/* Reply form */}
        {ticket.status !== 'CLOSED' && (
          <div
            className="mt-6 pt-4"
            style={{ borderTop: '1px solid var(--central-separator)' }}
          >
            <textarea
              placeholder="Escreva sua resposta..."
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              rows={3}
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none bg-transparent"
              style={{
                borderColor: 'var(--central-separator)',
                color: 'var(--central-text-primary)',
              }}
            />
            <div className="flex items-center justify-between mt-3">
              <label
                className="flex items-center gap-2 text-xs cursor-pointer select-none"
                style={{ color: 'var(--central-text-secondary)' }}
              >
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={e => setIsInternal(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Lock className="h-3 w-3" />
                Nota interna (nao visivel ao tenant)
              </label>
              <button
                onClick={handleReply}
                disabled={!replyContent.trim() || replyMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#8b5cf6' }}
              >
                {replyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar resposta
              </button>
            </div>
          </div>
        )}
      </CentralCard>

      {/* Satisfaction (if resolved/closed) */}
      {ticket.satisfactionRating != null && ticket.satisfactionRating > 0 && (
        <SatisfactionDisplay
          rating={ticket.satisfactionRating}
          comment={ticket.satisfactionComment}
        />
      )}
    </div>
  );
}
