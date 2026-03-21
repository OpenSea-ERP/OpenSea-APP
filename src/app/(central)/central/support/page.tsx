'use client';

import { CentralBadge } from '@/components/central/central-badge';
import type { CentralBadgeVariant } from '@/components/central/central-badge';
import { CentralCard } from '@/components/central/central-card';
import { CentralPageHeader } from '@/components/central/central-page-header';
import {
  CentralTable,
  CentralTableBody,
  CentralTableCell,
  CentralTableHead,
  CentralTableHeader,
  CentralTableRow,
} from '@/components/central/central-table';
import { useSupportTickets } from '@/hooks/admin/use-admin';
import type { SupportTicket } from '@/types/admin';
import {
  AlertTriangle,
  Clock,
  Filter,
  Headphones,
  Inbox,
  LifeBuoy,
  Loader2,
  Sparkles,
  Star,
  Timer,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// ─── Config ────────────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#f43f5e',
  HIGH: '#f97316',
  MEDIUM: '#0ea5e9',
  LOW: '#a1a1aa',
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
  { value: '', label: 'Todos os status' },
  { value: 'OPEN', label: 'Abertos' },
  { value: 'IN_PROGRESS', label: 'Em atendimento' },
  { value: 'WAITING_CLIENT', label: 'Aguardando' },
  { value: 'RESOLVED', label: 'Resolvidos' },
  { value: 'CLOSED', label: 'Fechados' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'Todas as prioridades' },
  { value: 'CRITICAL', label: 'Crítico' },
  { value: 'HIGH', label: 'Alto' },
  { value: 'MEDIUM', label: 'Médio' },
  { value: 'LOW', label: 'Baixo' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todas as categorias' },
  { value: 'BUG', label: 'Bug' },
  { value: 'QUESTION', label: 'Dúvida' },
  { value: 'REQUEST', label: 'Solicitação' },
  { value: 'FINANCIAL', label: 'Financeiro' },
  { value: 'OTHER', label: 'Outro' },
];

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_TICKETS: SupportTicket[] = [
  {
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
    description: 'O estoque não está sincronizando corretamente.',
    assignedToUserId: 'a1',
    assigneeName: 'Carlos Admin',
    slaBreached: true,
    createdAt: '2026-03-21T08:30:00Z',
    updatedAt: '2026-03-21T08:30:00Z',
  },
  {
    id: '2',
    ticketNumber: 1841,
    tenantId: 't2',
    tenantName: 'TechFlow Solutions',
    createdByUserId: 'u2',
    creatorName: 'Maria Souza',
    category: 'QUESTION',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    subject: 'Como configurar integrações?',
    description: 'Preciso de ajuda para configurar as integrações.',
    assignedToUserId: 'a2',
    assigneeName: 'Ana Suporte',
    slaBreached: false,
    createdAt: '2026-03-21T07:15:00Z',
    updatedAt: '2026-03-21T09:00:00Z',
  },
  {
    id: '3',
    ticketNumber: 1840,
    tenantId: 't3',
    tenantName: 'StartUp Inc',
    createdByUserId: 'u3',
    creatorName: 'Pedro Santos',
    category: 'REQUEST',
    priority: 'LOW',
    status: 'WAITING_CLIENT',
    subject: 'Solicitação de novo módulo de relatórios',
    description: 'Gostaria de solicitar um novo módulo.',
    slaBreached: false,
    createdAt: '2026-03-20T16:45:00Z',
    updatedAt: '2026-03-21T10:00:00Z',
  },
  {
    id: '4',
    ticketNumber: 1839,
    tenantId: 't1',
    tenantName: 'Acme Corp',
    createdByUserId: 'u4',
    creatorName: 'Fernanda Lima',
    category: 'FINANCIAL',
    priority: 'HIGH',
    status: 'OPEN',
    subject: 'Erro na cobrança do plano',
    description: 'Fui cobrado em duplicidade.',
    assignedToUserId: 'a1',
    assigneeName: 'Carlos Admin',
    slaBreached: true,
    createdAt: '2026-03-20T14:00:00Z',
    updatedAt: '2026-03-20T14:00:00Z',
  },
  {
    id: '5',
    ticketNumber: 1838,
    tenantId: 't4',
    tenantName: 'Global Trade',
    createdByUserId: 'u5',
    creatorName: 'Ricardo Oliveira',
    category: 'BUG',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    subject: 'Relatório financeiro mostra valores incorretos',
    description: 'Os valores no relatório financeiro estão divergentes.',
    assignedToUserId: 'a2',
    assigneeName: 'Ana Suporte',
    slaBreached: false,
    createdAt: '2026-03-20T11:30:00Z',
    updatedAt: '2026-03-21T08:00:00Z',
  },
  {
    id: '6',
    ticketNumber: 1837,
    tenantId: 't2',
    tenantName: 'TechFlow Solutions',
    createdByUserId: 'u6',
    creatorName: 'Camila Rocha',
    category: 'QUESTION',
    priority: 'LOW',
    status: 'RESOLVED',
    subject: 'Dúvida sobre permissões de usuário',
    description: 'Como configurar permissões granulares?',
    assignedToUserId: 'a1',
    assigneeName: 'Carlos Admin',
    slaBreached: false,
    resolvedAt: '2026-03-20T15:00:00Z',
    createdAt: '2026-03-19T10:00:00Z',
    updatedAt: '2026-03-20T15:00:00Z',
    satisfactionRating: 5,
  },
  {
    id: '7',
    ticketNumber: 1836,
    tenantId: 't3',
    tenantName: 'StartUp Inc',
    createdByUserId: 'u7',
    creatorName: 'Lucas Almeida',
    category: 'REQUEST',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    subject: 'Exportação de dados em CSV',
    description: 'Preciso exportar dados para CSV.',
    assignedToUserId: 'a2',
    assigneeName: 'Ana Suporte',
    slaBreached: false,
    createdAt: '2026-03-19T09:00:00Z',
    updatedAt: '2026-03-20T14:00:00Z',
  },
];

const MOCK_STATS = {
  open: 12,
  inProgress: 5,
  waiting: 3,
  slaBreached: 2,
};

const MOCK_METRICS = {
  avgFirstResponse: '2h15min',
  avgResolution: '18h',
  satisfaction: '4.2/5',
  aiResolution: '68%',
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

// ─── Components ────────────────────────────────────────────────────────────────

function PriorityDot({ priority }: { priority: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="rounded-full flex-shrink-0"
        style={{
          width: 8,
          height: 8,
          backgroundColor: PRIORITY_COLORS[priority] ?? '#a1a1aa',
        }}
      />
      <span className="text-sm">{PRIORITY_LABELS[priority] ?? priority}</span>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  variant = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  variant?: CentralBadgeVariant;
}) {
  const variantColors: Record<string, string> = {
    sky: '#0ea5e9',
    violet: '#8b5cf6',
    orange: '#f97316',
    rose: '#f43f5e',
    emerald: '#10b981',
    default: 'var(--central-text-secondary)',
  };

  return (
    <CentralCard className="p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{
            backgroundColor: `${variantColors[variant]}15`,
            color: variantColors[variant],
          }}
        >
          {icon}
        </div>
        <div>
          <p
            className="text-2xl font-bold tabular-nums"
            style={{ color: 'var(--central-text-primary)' }}
          >
            {value}
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--central-text-secondary)' }}
          >
            {label}
          </p>
        </div>
      </div>
    </CentralCard>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <CentralCard className="p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{
            backgroundColor: 'var(--central-avatar-bg)',
            color: 'var(--central-avatar-text)',
          }}
        >
          {icon}
        </div>
        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: 'var(--central-text-primary)' }}
          >
            {value}
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--central-text-secondary)' }}
          >
            {label}
          </p>
        </div>
      </div>
    </CentralCard>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SupportDashboardPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: apiTickets, isLoading } = useSupportTickets({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    category: categoryFilter || undefined,
  });

  // Use API data if available, otherwise mock
  const tickets = apiTickets ?? MOCK_TICKETS;
  const hasFilters = statusFilter || priorityFilter || categoryFilter;

  const filteredTickets = hasFilters
    ? tickets.filter(t => {
        if (statusFilter && t.status !== statusFilter) return false;
        if (priorityFilter && t.priority !== priorityFilter) return false;
        if (categoryFilter && t.category !== categoryFilter) return false;
        return true;
      })
    : tickets;

  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
  };

  return (
    <div className="px-6 py-5 space-y-4">
      {/* Header */}
      <CentralPageHeader
        title="Suporte"
        description="Gerencie tickets de suporte dos tenants"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Inbox className="h-4 w-4" />}
          label="Abertos"
          value={MOCK_STATS.open}
          variant="sky"
        />
        <StatCard
          icon={<Headphones className="h-4 w-4" />}
          label="Em atendimento"
          value={MOCK_STATS.inProgress}
          variant="violet"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Aguardando"
          value={MOCK_STATS.waiting}
          variant="orange"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Fora do SLA"
          value={MOCK_STATS.slaBreached}
          variant="rose"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter
          className="h-4 w-4 flex-shrink-0"
          style={{ color: 'var(--central-text-muted)' }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer"
          style={{
            background: 'var(--central-card-bg)',
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
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer"
          style={{
            background: 'var(--central-card-bg)',
            borderColor: 'var(--central-separator)',
            color: 'var(--central-text-primary)',
          }}
        >
          {PRIORITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="h-10 px-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer"
          style={{
            background: 'var(--central-card-bg)',
            borderColor: 'var(--central-separator)',
            color: 'var(--central-text-primary)',
          }}
        >
          {CATEGORY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:opacity-80 transition-opacity"
            style={{ color: 'var(--central-text-secondary)' }}
          >
            <X className="h-3 w-3" />
            Limpar
          </button>
        )}
      </div>

      {/* Ticket list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2
            className="h-6 w-6 animate-spin"
            style={{ color: 'var(--central-text-muted)' }}
          />
        </div>
      ) : (
        <CentralTable>
          <CentralTableHeader>
            <CentralTableRow>
              <CentralTableHead>#</CentralTableHead>
              <CentralTableHead>Assunto</CentralTableHead>
              <CentralTableHead>Tenant</CentralTableHead>
              <CentralTableHead>Categoria</CentralTableHead>
              <CentralTableHead>Prioridade</CentralTableHead>
              <CentralTableHead>Status</CentralTableHead>
              <CentralTableHead>Atribuído a</CentralTableHead>
              <CentralTableHead>Criado em</CentralTableHead>
            </CentralTableRow>
          </CentralTableHeader>
          <CentralTableBody>
            {filteredTickets.map(ticket => (
              <CentralTableRow
                key={ticket.id}
                className="cursor-pointer"
                onClick={() => router.push(`/central/support/${ticket.id}`)}
              >
                <CentralTableCell>
                  <span className="font-mono text-sm font-semibold">
                    #{ticket.ticketNumber}
                  </span>
                </CentralTableCell>
                <CentralTableCell>
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[240px]">
                      {ticket.subject}
                    </span>
                    {ticket.slaBreached && (
                      <span
                        className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: 'rgba(244,63,94,0.1)',
                          color: '#f43f5e',
                        }}
                      >
                        SLA
                      </span>
                    )}
                  </div>
                </CentralTableCell>
                <CentralTableCell>
                  <span style={{ color: 'var(--central-text-secondary)' }}>
                    {ticket.tenantName ?? '—'}
                  </span>
                </CentralTableCell>
                <CentralTableCell>
                  <CentralBadge
                    variant={CATEGORY_VARIANTS[ticket.category] ?? 'default'}
                  >
                    {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                  </CentralBadge>
                </CentralTableCell>
                <CentralTableCell>
                  <PriorityDot priority={ticket.priority} />
                </CentralTableCell>
                <CentralTableCell>
                  <CentralBadge
                    variant={STATUS_VARIANTS[ticket.status] ?? 'default'}
                  >
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </CentralBadge>
                </CentralTableCell>
                <CentralTableCell>
                  <span style={{ color: 'var(--central-text-secondary)' }}>
                    {ticket.assigneeName ?? '—'}
                  </span>
                </CentralTableCell>
                <CentralTableCell>
                  <span style={{ color: 'var(--central-text-secondary)' }}>
                    {formatDate(ticket.createdAt)}
                  </span>
                </CentralTableCell>
              </CentralTableRow>
            ))}
            {filteredTickets.length === 0 && (
              <CentralTableRow>
                <CentralTableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <LifeBuoy
                      className="h-12 w-12"
                      style={{ color: 'var(--central-text-muted)' }}
                    />
                    <p style={{ color: 'var(--central-text-muted)' }}>
                      {hasFilters
                        ? 'Nenhum ticket encontrado com os filtros aplicados'
                        : 'Nenhum ticket de suporte encontrado'}
                    </p>
                  </div>
                </CentralTableCell>
              </CentralTableRow>
            )}
          </CentralTableBody>
        </CentralTable>
      )}

      {/* Support Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={<Timer className="h-4 w-4" />}
          label="Tempo médio 1.a resposta"
          value={MOCK_METRICS.avgFirstResponse}
        />
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label="Tempo médio resolução"
          value={MOCK_METRICS.avgResolution}
        />
        <MetricCard
          icon={<Star className="h-4 w-4" />}
          label="Satisfação"
          value={MOCK_METRICS.satisfaction}
        />
        <MetricCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Resolvidos por IA"
          value={MOCK_METRICS.aiResolution}
        />
      </div>
    </div>
  );
}
