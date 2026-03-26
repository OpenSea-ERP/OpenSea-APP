/**
 * OpenSea OS - Payment Condition Detail Page
 * Pagina de detalhes da condicao de pagamento com informacoes gerais e regras
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
import { usePaymentCondition } from '@/hooks/sales/use-payment-conditions';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  PAYMENT_CONDITION_TYPE_LABELS,
  INTEREST_TYPE_LABELS,
  PAYMENT_CONDITION_APPLICABLE_LABELS,
} from '@/types/sales/payment-condition.types';
import type { PaymentConditionDTO } from '@/types/sales';
import {
  Calendar,
  CreditCard,
  Edit,
  Hash,
  Percent,
  Settings2,
  ShieldCheck,
  Tag,
  Target,
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

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPercent(value: number): string {
  return `${value}%`;
}

// ============================================================================
// PAGE
// ============================================================================

export default function PaymentConditionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const pcId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: pcData, isLoading, error } = usePaymentCondition(pcId);

  const pc = pcData?.paymentCondition as PaymentConditionDTO | undefined;

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.PAYMENT_CONDITIONS.MODIFY)
      ? [
          {
            id: 'edit',
            title: 'Editar',
            icon: Edit,
            onClick: () =>
              router.push(`/sales/payment-conditions/${pcId}/edit`),
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
    { label: 'Condicoes de Pagamento', href: '/sales/payment-conditions' },
    { label: pc?.name || '...' },
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

  if (error || !pc) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Condicao de pagamento nao encontrada"
            message="A condicao de pagamento que voce esta procurando nao existe ou foi removida."
            action={{
              label: 'Voltar para Condicoes de Pagamento',
              onClick: () => router.push('/sales/payment-conditions'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // DERIVED DATA
  // ============================================================================

  const createdDate = formatDateTime(pc.createdAt);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>
      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-violet-500 to-purple-600">
              <CreditCard className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Condicao de pagamento
              </p>
              <h1 className="text-xl font-bold truncate">{pc.name}</h1>
              <p className="text-sm text-muted-foreground">
                Criado em {createdDate}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                  pc.isActive
                    ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400'
                }`}
              >
                {pc.isActive ? 'Ativo' : 'Inativo'}
              </div>
              {pc.isDefault && (
                <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300">
                  Padrao
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Section: Informacoes Gerais */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-foreground" />
                <div>
                  <h3 className="text-base font-semibold">
                    Informacoes Gerais
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tipo, parcelas e prazos da condicao
                  </p>
                </div>
              </div>
              <div className="border-b border-border" />
            </div>

            <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoRow
                  icon={Tag}
                  label="Tipo"
                  value={PAYMENT_CONDITION_TYPE_LABELS[pc.type]}
                />
                <InfoRow
                  icon={Hash}
                  label="Parcelas"
                  value={String(pc.installments)}
                />
                <InfoRow
                  icon={Calendar}
                  label="Primeiro Vencimento"
                  value={`${pc.firstDueDays} dias`}
                />
                <InfoRow
                  icon={Calendar}
                  label="Intervalo entre Parcelas"
                  value={`${pc.intervalDays} dias`}
                />
                <InfoRow
                  icon={Target}
                  label="Aplicavel a"
                  value={PAYMENT_CONDITION_APPLICABLE_LABELS[pc.applicableTo]}
                />
                {pc.description && (
                  <InfoRow
                    icon={Tag}
                    label="Descricao"
                    value={pc.description}
                  />
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Regras Financeiras */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Settings2 className="h-5 w-5 text-foreground" />
                <div>
                  <h3 className="text-base font-semibold">
                    Regras Financeiras
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Juros, multas, descontos e limites
                  </p>
                </div>
              </div>
              <div className="border-b border-border" />
            </div>

            <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pc.downPaymentPercent != null && pc.downPaymentPercent > 0 && (
                  <InfoRow
                    icon={Percent}
                    label="Entrada"
                    value={formatPercent(pc.downPaymentPercent)}
                  />
                )}
                {pc.discountCash != null && pc.discountCash > 0 && (
                  <InfoRow
                    icon={Percent}
                    label="Desconto a Vista"
                    value={formatPercent(pc.discountCash)}
                  />
                )}
                {pc.interestRate != null && pc.interestRate > 0 && (
                  <InfoRow
                    icon={Percent}
                    label="Taxa de Juros"
                    value={`${formatPercent(pc.interestRate)} (${INTEREST_TYPE_LABELS[pc.interestType]})`}
                  />
                )}
                {pc.penaltyRate != null && pc.penaltyRate > 0 && (
                  <InfoRow
                    icon={ShieldCheck}
                    label="Multa por Atraso"
                    value={formatPercent(pc.penaltyRate)}
                  />
                )}
                {pc.minOrderValue != null && (
                  <InfoRow
                    icon={ShieldCheck}
                    label="Valor Minimo do Pedido"
                    value={formatCurrency(pc.minOrderValue)}
                  />
                )}
                {pc.maxOrderValue != null && (
                  <InfoRow
                    icon={ShieldCheck}
                    label="Valor Maximo do Pedido"
                    value={formatCurrency(pc.maxOrderValue)}
                  />
                )}
                {!pc.downPaymentPercent &&
                  !pc.discountCash &&
                  !pc.interestRate &&
                  !pc.penaltyRate &&
                  pc.minOrderValue == null &&
                  pc.maxOrderValue == null && (
                    <p className="text-sm text-muted-foreground col-span-full">
                      Nenhuma regra financeira configurada.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Resumo de Parcelas */}
        {pc.type === 'INSTALLMENT' && pc.installments > 1 && (
          <Card className="bg-white/5 py-2 overflow-hidden">
            <div className="px-6 py-4 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-foreground" />
                  <div>
                    <h3 className="text-base font-semibold">
                      Resumo de Parcelas
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Simulacao dos vencimentos para um pedido hipotetico
                    </p>
                  </div>
                </div>
                <div className="border-b border-border" />
              </div>

              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: pc.installments }, (_, i) => {
                    const daysFromNow =
                      pc.firstDueDays + i * pc.intervalDays;
                    return (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-gray-50 dark:bg-slate-700/40 p-3 space-y-1"
                      >
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Hash className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium uppercase tracking-wider">
                            Parcela {i + 1}
                          </span>
                        </div>
                        <p className="text-sm font-semibold">
                          {daysFromNow} dias apos o pedido
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}
      </PageBody>
    </PageLayout>
  );
}
