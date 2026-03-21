'use client';

import { CentralBadge } from '@/components/central/central-badge';
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
import { Button } from '@/components/ui/button';
import {
  useAdminTenants,
  useDashboardStats,
  useRevenueMetrics,
} from '@/hooks/admin/use-admin';
import {
  AlertTriangle,
  Building2,
  CreditCard,
  DollarSign,
  Eye,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

const statusVariants: Record<
  string,
  'emerald' | 'orange' | 'rose' | 'default'
> = {
  ACTIVE: 'emerald',
  INACTIVE: 'orange',
  SUSPENDED: 'rose',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
  SUSPENDED: 'Suspensa',
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  label: string;
  value: string;
  iconColor: string;
}) {
  return (
    <CentralCard className="p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ background: `${iconColor}15` }}
        >
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
        <div>
          <p
            className="text-xs font-medium"
            style={{ color: 'var(--central-text-muted)' }}
          >
            {label}
          </p>
          <p
            className="text-lg font-bold"
            style={{ color: 'var(--central-text-primary)' }}
          >
            {value}
          </p>
        </div>
      </div>
    </CentralCard>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const { data, isLoading } = useAdminTenants(1, 50);
  const { data: dashStats } = useDashboardStats();
  const { data: revenue } = useRevenueMetrics();
  const tenants = data?.tenants ?? [];

  const activeTenants = tenants.filter(t => t.status === 'ACTIVE').length;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  return (
    <div className="px-6 py-5 space-y-4">
      <CentralPageHeader
        title="Assinaturas & Billing"
        description="Visao geral de todas as assinaturas e faturamento"
      />

      {/* Summary stats — derived from real data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={DollarSign}
          label="MRR Total"
          value={formatCurrency(dashStats?.mrr ?? revenue?.mrr ?? 0)}
          iconColor="#10b981"
        />
        <StatCard
          icon={Building2}
          label="Tenants ativos"
          value={String(activeTenants)}
          iconColor="#3b82f6"
        />
        <StatCard
          icon={TrendingUp}
          label="Overage este mes"
          value={formatCurrency(revenue?.overageTotal ?? 0)}
          iconColor="#f59e0b"
        />
        <StatCard
          icon={AlertTriangle}
          label="Upgrades este mes"
          value={String(revenue?.upgradesThisMonth ?? 0)}
          iconColor="#ef4444"
        />
      </div>

      {/* Tenant subscriptions table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse"
              style={{ background: 'var(--central-card-bg)' }}
            />
          ))}
        </div>
      ) : tenants.length === 0 ? (
        <CentralCard className="flex flex-col items-center justify-center py-16 gap-3">
          <CreditCard
            className="h-12 w-12"
            style={{ color: 'var(--central-text-muted)' }}
          />
          <p className="text-sm" style={{ color: 'var(--central-text-muted)' }}>
            Nenhuma assinatura encontrada
          </p>
        </CentralCard>
      ) : (
        <CentralTable>
          <CentralTableHeader>
            <CentralTableRow>
              <CentralTableHead>Tenant</CentralTableHead>
              <CentralTableHead>Slug</CentralTableHead>
              <CentralTableHead>Status</CentralTableHead>
              <CentralTableHead>Criado em</CentralTableHead>
              <CentralTableHead className="w-[80px]">Acoes</CentralTableHead>
            </CentralTableRow>
          </CentralTableHeader>
          <CentralTableBody>
            {tenants.map(t => (
              <CentralTableRow key={t.id}>
                <CentralTableCell>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                      style={{
                        background: 'var(--central-avatar-bg)',
                        color: 'var(--central-avatar-text)',
                      }}
                    >
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{t.name}</span>
                  </div>
                </CentralTableCell>
                <CentralTableCell>
                  <span
                    className="font-mono text-sm"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    {t.slug}
                  </span>
                </CentralTableCell>
                <CentralTableCell>
                  <CentralBadge variant={statusVariants[t.status] ?? 'default'}>
                    {statusLabels[t.status] ?? t.status}
                  </CentralBadge>
                </CentralTableCell>
                <CentralTableCell>
                  <span style={{ color: 'var(--central-text-secondary)' }}>
                    {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </CentralTableCell>
                <CentralTableCell>
                  <Link href={`/central/tenants/${t.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </CentralTableCell>
              </CentralTableRow>
            ))}
          </CentralTableBody>
        </CentralTable>
      )}
    </div>
  );
}
