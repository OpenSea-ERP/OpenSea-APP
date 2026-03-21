'use client';

import { cn } from '@/lib/utils';
import { useCreateTicket, useMyTickets } from '@/hooks/support/use-support';
import type { SupportTicket } from '@/types/admin';
import {
  ArrowLeft,
  FileText,
  LifeBuoy,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Config ────────────────────────────────────────────────────────────────────

type WidgetView = 'menu' | 'create-ticket' | 'my-tickets';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  OPEN: {
    bg: 'bg-sky-50 dark:bg-sky-500/10',
    text: 'text-sky-700 dark:text-sky-300',
  },
  IN_PROGRESS: {
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    text: 'text-violet-700 dark:text-violet-300',
  },
  WAITING_CLIENT: {
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    text: 'text-orange-700 dark:text-orange-300',
  },
  RESOLVED: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  CLOSED: {
    bg: 'bg-zinc-100 dark:bg-zinc-500/10',
    text: 'text-zinc-600 dark:text-zinc-400',
  },
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em atendimento',
  WAITING_CLIENT: 'Aguardando',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
};

const CATEGORY_OPTIONS = [
  { value: 'BUG', label: 'Bug' },
  { value: 'QUESTION', label: 'Duvida' },
  { value: 'REQUEST', label: 'Solicitacao' },
  { value: 'FINANCIAL', label: 'Financeiro' },
  { value: 'OTHER', label: 'Outro' },
];

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_MY_TICKETS: SupportTicket[] = [
  {
    id: 'mt1',
    ticketNumber: 1842,
    tenantId: 't1',
    createdByUserId: 'me',
    category: 'BUG',
    priority: 'CRITICAL',
    status: 'OPEN',
    subject: 'Falha na sincronizacao de estoque',
    description: '',
    slaBreached: true,
    createdAt: '2026-03-21T08:30:00Z',
    updatedAt: '2026-03-21T08:30:00Z',
  },
  {
    id: 'mt2',
    ticketNumber: 1839,
    tenantId: 't1',
    createdByUserId: 'me',
    category: 'FINANCIAL',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    subject: 'Erro na cobranca do plano',
    description: '',
    slaBreached: false,
    createdAt: '2026-03-20T14:00:00Z',
    updatedAt: '2026-03-20T14:00:00Z',
  },
  {
    id: 'mt3',
    ticketNumber: 1837,
    tenantId: 't1',
    createdByUserId: 'me',
    category: 'QUESTION',
    priority: 'LOW',
    status: 'RESOLVED',
    subject: 'Duvida sobre permissoes de usuario',
    description: '',
    slaBreached: false,
    resolvedAt: '2026-03-20T15:00:00Z',
    createdAt: '2026-03-19T10:00:00Z',
    updatedAt: '2026-03-20T15:00:00Z',
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function MenuView({
  onNavigate,
  ticketCount,
}: {
  onNavigate: (view: WidgetView) => void;
  ticketCount: number;
}) {
  return (
    <div className="p-4 space-y-2">
      <button
        onClick={() => {
          // Placeholder: will connect to Atlas AI chat
        }}
        className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm font-medium transition-colors hover:bg-accent"
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10">
          <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <span className="text-foreground">Falar com Atlas</span>
          <p className="text-xs text-muted-foreground">Assistente com IA</p>
        </div>
      </button>

      <button
        onClick={() => onNavigate('create-ticket')}
        className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm font-medium transition-colors hover:bg-accent"
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-500/10">
          <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <span className="text-foreground">Abrir ticket</span>
          <p className="text-xs text-muted-foreground">Enviar para a equipe</p>
        </div>
      </button>

      <button
        onClick={() => onNavigate('my-tickets')}
        className="w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm font-medium transition-colors hover:bg-accent"
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-500/10">
          <MessageCircle className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        </div>
        <div className="flex-1">
          <span className="text-foreground">Meus tickets</span>
          <p className="text-xs text-muted-foreground">
            Acompanhar solicitacoes
          </p>
        </div>
        {ticketCount > 0 && (
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-violet-500 text-white text-[10px] font-bold">
            {ticketCount}
          </span>
        )}
      </button>
    </div>
  );
}

function CreateTicketView({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const createMutation = useCreateTicket();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('BUG');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    createMutation.mutate(
      { subject, description, category },
      {
        onSuccess: () => {
          setSubject('');
          setCategory('BUG');
          setDescription('');
          onSuccess();
        },
      }
    );
  };

  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <ArrowLeft className="h-3 w-3" />
        Voltar
      </button>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Assunto
          </label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Descreva brevemente o problema..."
            className="w-full h-9 px-3 rounded-lg border border-border text-sm outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Categoria
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-border text-sm outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground appearance-none cursor-pointer"
          >
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Descricao
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descreva o problema em detalhes..."
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm outline-none focus:ring-2 focus:ring-ring resize-none bg-transparent text-foreground"
            required
          />
        </div>

        {/* File upload placeholder */}
        <div className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
          <p className="text-xs text-muted-foreground">
            Arraste arquivos ou clique para anexar (em breve)
          </p>
        </div>

        <button
          type="submit"
          disabled={
            !subject.trim() || !description.trim() || createMutation.isPending
          }
          className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 transition-colors disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Enviar ticket
        </button>
      </form>
    </div>
  );
}

function MyTicketsView({ onBack }: { onBack: () => void }) {
  const { data: apiTickets, isLoading } = useMyTickets();
  const tickets = apiTickets ?? MOCK_MY_TICKETS;

  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <ArrowLeft className="h-3 w-3" />
        Voltar
      </button>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <MessageCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Voce nao possui tickets abertos
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(ticket => {
            const statusStyle =
              STATUS_COLORS[ticket.status] ?? STATUS_COLORS.CLOSED;
            return (
              <div
                key={ticket.id}
                className="p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      #{ticket.ticketNumber} — {ticket.subject}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'flex-shrink-0 inline-flex items-center text-[9px] font-semibold rounded-xl px-2 py-0.5',
                      statusStyle.bg,
                      statusStyle.text
                    )}
                  >
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Widget ───────────────────────────────────────────────────────────────

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<WidgetView>('menu');
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: apiTickets } = useMyTickets();
  const tickets = apiTickets ?? MOCK_MY_TICKETS;
  const openTicketCount = tickets.filter(
    t => t.status !== 'RESOLVED' && t.status !== 'CLOSED'
  ).length;

  // Close on click outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const togglePanel = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) setView('menu');
  };

  const handleNavigate = (newView: WidgetView) => setView(newView);
  const handleBack = () => setView('menu');

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50">
      {/* Panel */}
      {isOpen && (
        <div
          className={cn(
            'absolute bottom-16 right-0 w-80 rounded-2xl shadow-2xl border border-border bg-background',
            'animate-in fade-in slide-in-from-bottom-2 duration-200'
          )}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-semibold text-foreground">
                Suporte
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-accent transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {/* Panel body */}
          {view === 'menu' && (
            <MenuView
              onNavigate={handleNavigate}
              ticketCount={openTicketCount}
            />
          )}
          {view === 'create-ticket' && (
            <CreateTicketView
              onBack={handleBack}
              onSuccess={() => setView('my-tickets')}
            />
          )}
          {view === 'my-tickets' && <MyTicketsView onBack={handleBack} />}
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={togglePanel}
        className={cn(
          'relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200',
          'bg-violet-500 hover:bg-violet-600 text-white',
          'hover:scale-105 active:scale-95'
        )}
      >
        <LifeBuoy className="h-5 w-5" />
        {openTicketCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold">
            {openTicketCount}
          </span>
        )}
      </button>
    </div>
  );
}
