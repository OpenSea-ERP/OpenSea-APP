/**
 * OpenSea OS - Coupon Detail Page
 * Página de detalhes do cupom com informações gerais, regras e estatisticas
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Card } from '@/components/ui/card';
import { useCoupon } from '@/hooks/sales/use-coupons';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  COUPON_TYPE_LABELS,
  COUPON_APPLICABLE_LABELS,
} from '@/types/sales/coupon.types';
import type { Coupon } from '@/types/sales';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Calendar,
  Clock,
  Edit,
  Hash,
  Percent,
  Settings2,
  ShieldCheck,
  Tag,
  Target,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

// ============================================================================
// INFO ROW COMPONENT
// ============================================================================

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDiscountDisplay(coupon: Coupon): string {
  if (coupon.type === 'PERCENTAGE') {
    return `${coupon.value}%`;
  }
  if (coupon.type === 'FIXED_VALUE') {
    return formatCurrency(coupon.value);
  }
  return 'Frete Gratis';
}

function isCouponExpired(coupon: Coupon): boolean {
  return new Date(coupon.validUntil) < new Date();
}

// ============================================================================
// PAGE
// ============================================================================

export default function CouponDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const couponId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: couponData, isLoading, error } = useCoupon(couponId);

  const coupon = couponData?.coupon as Coupon | undefined;

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.COUPONS.ADMIN)
      ? [
          {
            id: 'edit',
            title: 'Editar Cupom',
            icon: Edit,
            onClick: () => router.push(`/sales/coupons/${couponId}/edit`),
            variant: 'default' as const,
          },
        ]
      : []),
  ];

  // ============================================================================
  // BREADCRUMBS
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Cupons', href: '/sales/coupons' },
    { label: coupon?.code || '...' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !coupon) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Cupom não encontrado"
            message="O cupom que você está procurando não existe ou foi removido."
            action={{
              label: 'Voltar para Cupons',
              onClick: () => router.push('/sales/coupons'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // DERIVED DATA
  // ============================================================================

  const expired = isCouponExpired(coupon);
  const createdDate = formatDateTime(coupon.createdAt);
  const discountDisplay = getDiscountDisplay(coupon);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="coupon-detail">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>
      <PageBody>
        {/* Identity Card */}
        <Card data-testid="coupon-identity" className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-violet-500 to-purple-600">
              <Ticket className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Cupom de desconto</p>
              <h1 className="text-xl font-bold truncate font-mono">
                {coupon.code}
              </h1>
              <p className="text-sm text-muted-foreground">
                Criado em {createdDate}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                  coupon.isActive && !expired
                    ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                    : expired
                      ? 'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300'
                      : 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400'
                }`}
              >
                {expired ? 'Expirado' : coupon.isActive ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Informações do Desconto */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Percent className="h-5 w-5 text-foreground" />
                <div>
                  <h3 className="text-base font-semibold">
                    Informações do Desconto
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tipo, valor e regras do cupom
                  </p>
                </div>
              </div>
              <div className="border-b border-border" />
            </div>

            <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoRow
                  icon={Tag}
                  label="Tipo de Desconto"
                  value={COUPON_TYPE_LABELS[coupon.type]}
                />
                <InfoRow
                  icon={Percent}
                  label="Valor do Desconto"
                  value={discountDisplay}
                />
                <InfoRow
                  icon={Target}
                  label="Aplicável a"
                  value={COUPON_APPLICABLE_LABELS[coupon.applicableTo]}
                />
                {coupon.minOrderValue != null && (
                  <InfoRow
                    icon={ShieldCheck}
                    label="Valor Mínimo do Pedido"
                    value={formatCurrency(coupon.minOrderValue)}
                  />
                )}
                {coupon.maxDiscount != null && (
                  <InfoRow
                    icon={ShieldCheck}
                    label="Desconto Máximo"
                    value={formatCurrency(coupon.maxDiscount)}
                  />
                )}
                {coupon.aiGenerated && (
                  <InfoRow
                    icon={Settings2}
                    label="Gerado por IA"
                    value={coupon.aiReason || 'Sim'}
                  />
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Validade e Uso */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-foreground" />
                <div>
                  <h3 className="text-base font-semibold">Validade e Uso</h3>
                  <p className="text-sm text-muted-foreground">
                    Período de validade e limites de utilização
                  </p>
                </div>
              </div>
              <div className="border-b border-border" />
            </div>

            <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoRow
                  icon={Calendar}
                  label="Valido de"
                  value={formatDate(coupon.validFrom)}
                />
                <InfoRow
                  icon={Calendar}
                  label="Valido ate"
                  value={formatDate(coupon.validUntil)}
                />
                <InfoRow
                  icon={Hash}
                  label="Usos Realizados"
                  value={String(coupon.usageCount)}
                />
                <InfoRow
                  icon={Users}
                  label="Limite Total de Usos"
                  value={
                    coupon.maxUsageTotal != null
                      ? String(coupon.maxUsageTotal)
                      : 'Ilimitado'
                  }
                />
                <InfoRow
                  icon={Users}
                  label="Limite por Cliente"
                  value={String(coupon.maxUsagePerCustomer)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Histórico de Uso */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-foreground" />
                <div>
                  <h3 className="text-base font-semibold">Histórico de Uso</h3>
                  <p className="text-sm text-muted-foreground">
                    Resumo de utilização e progresso do cupom
                  </p>
                </div>
              </div>
              <div className="border-b border-border" />
            </div>

            {/* Usage Progress Card */}
            <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-6">
              {/* Progress Bar */}
              {coupon.maxUsageTotal != null ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-violet-500" />
                      <span className="text-sm font-medium">
                        Progresso de Utilização
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {coupon.usageCount} / {coupon.maxUsageTotal}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress
                      value={Math.min(
                        (coupon.usageCount / coupon.maxUsageTotal) * 100,
                        100
                      )}
                      className="h-3 [--progress-bg:theme(colors.violet.100)] dark:[--progress-bg:theme(colors.violet.500/0.15)] [--progress-fill:theme(colors.violet.500)]"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {Math.round(
                        (coupon.usageCount / coupon.maxUsageTotal) * 100
                      )}
                      % utilizado
                    </span>
                    <span>
                      {Math.max(coupon.maxUsageTotal - coupon.usageCount, 0)}{' '}
                      {coupon.maxUsageTotal - coupon.usageCount === 1
                        ? 'uso restante'
                        : 'usos restantes'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-violet-500" />
                      <span className="text-sm font-medium">
                        Total de Utilizacoes
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {coupon.usageCount}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress
                      value={coupon.usageCount > 0 ? 100 : 0}
                      className="h-3 [--progress-bg:theme(colors.violet.100)] dark:[--progress-bg:theme(colors.violet.500/0.15)] [--progress-fill:theme(colors.violet.500)]"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este cupom nao possui limite de utilização
                  </p>
                </div>
              )}

              {/* Stats Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Usage count stat */}
                <div className="rounded-lg border border-border bg-gray-50 dark:bg-slate-700/40 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wider">
                      Usos Totais
                    </span>
                  </div>
                  <p className="text-2xl font-bold">{coupon.usageCount}</p>
                </div>

                {/* Remaining days stat */}
                <div className="rounded-lg border border-border bg-gray-50 dark:bg-slate-700/40 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wider">
                      {expired ? 'Expirado ha' : 'Expira em'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {(() => {
                      const now = new Date();
                      const until = new Date(coupon.validUntil);
                      const diffMs = Math.abs(until.getTime() - now.getTime());
                      const diffDays = Math.ceil(
                        diffMs / (1000 * 60 * 60 * 24)
                      );
                      return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
                    })()}
                  </p>
                </div>

                {/* Per-customer limit stat */}
                <div className="rounded-lg border border-border bg-gray-50 dark:bg-slate-700/40 p-4 space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium uppercase tracking-wider">
                      Limite / Cliente
                    </span>
                  </div>
                  <p className="text-2xl font-bold">
                    {coupon.maxUsagePerCustomer}
                  </p>
                </div>
              </div>

              {/* Status indicator */}
              {coupon.maxUsageTotal != null &&
                coupon.usageCount >= coupon.maxUsageTotal && (
                  <div className="flex items-center gap-3 rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 px-4 py-3">
                    <ShieldCheck className="h-5 w-5 text-rose-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                        Limite de uso atingido
                      </p>
                      <p className="text-xs text-rose-600 dark:text-rose-400">
                        Este cupom atingiu o número máximo de utilizacoes
                        permitidas e não pode mais ser utilizado.
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </Card>
      </PageBody>
    </PageLayout>
  );
}
