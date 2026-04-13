/**
 * OpenSea OS - Discount Rule Detail Page
 * Página de detalhes da regra de desconto com configuração e condições
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDiscountRule } from '@/hooks/sales/use-discount-rules';
import { usePermissions } from '@/hooks/use-permissions';
import { discountRulesConfig } from '@/config/entities/discount-rules.config';
import type { DiscountRule } from '@/types/sales';
import { DISCOUNT_TYPE_LABELS } from '@/types/sales';
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  Hash,
  Layers,
  Percent,
  Settings,
  ShoppingCart,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

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
// PAGE
// ============================================================================

export default function DiscountRuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const ruleId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: ruleData, isLoading, error } = useDiscountRule(ruleId);

  const rule = ruleData?.discountRule as DiscountRule | undefined;

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(discountRulesConfig.permissions.update &&
    hasPermission(discountRulesConfig.permissions.update)
      ? [
          {
            id: 'edit',
            title: 'Editar',
            icon: Edit,
            onClick: () => router.push(`/sales/discount-rules/${ruleId}/edit`),
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
    { label: 'Regras de Desconto', href: '/sales/discount-rules' },
    { label: rule?.name || '...' },
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

  if (error || !rule) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Regra não encontrada"
            message="A regra de desconto que você está procurando não existe ou foi removida."
            action={{
              label: 'Voltar para Regras de Desconto',
              onClick: () => router.push('/sales/discount-rules'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const formatValue = () => {
    if (rule.type === 'PERCENTAGE') return `${rule.value}%`;
    return formatCurrency(rule.value);
  };

  const createdDate = new Date(rule.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const typeLabel = DISCOUNT_TYPE_LABELS[rule.type];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="discount-rule-detail">
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-emerald-500 to-teal-600">
              {rule.type === 'PERCENTAGE' ? (
                <Percent className="h-7 w-7 text-white" />
              ) : (
                <DollarSign className="h-7 w-7 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{typeLabel}</p>
              <h1 className="text-xl font-bold truncate">{rule.name}</h1>
              {rule.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {rule.description}
                </p>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border',
                  rule.isActive
                    ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400'
                )}
              >
                {rule.isActive ? 'Ativa' : 'Inativa'}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 mb-4">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="conditions">Condições</TabsTrigger>
          </TabsList>

          {/* TAB: Configuração */}
          <TabsContent value="config" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Configuração da Regra
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Tipo, valor e período de vigência
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow
                      icon={rule.type === 'PERCENTAGE' ? Percent : DollarSign}
                      label="Tipo de Desconto"
                      value={typeLabel}
                    />
                    <InfoRow
                      icon={DollarSign}
                      label="Valor"
                      value={formatValue()}
                    />
                    <InfoRow
                      icon={Calendar}
                      label="Início"
                      value={new Date(rule.startDate).toLocaleDateString(
                        'pt-BR'
                      )}
                    />
                    <InfoRow
                      icon={Calendar}
                      label="Fim"
                      value={new Date(rule.endDate).toLocaleDateString('pt-BR')}
                    />
                    <InfoRow
                      icon={Hash}
                      label="Prioridade"
                      value={String(rule.priority)}
                    />
                    <InfoRow
                      icon={Layers}
                      label="Acumulável"
                      value={rule.isStackable ? 'Sim' : 'Não'}
                    />
                    <InfoRow
                      icon={Clock}
                      label="Criada em"
                      value={createdDate}
                    />
                    <InfoRow
                      icon={rule.isActive ? CheckCircle : XCircle}
                      label="Status"
                      value={rule.isActive ? 'Ativa' : 'Inativa'}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Condições */}
          <TabsContent value="conditions" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Condições de Aplicação
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Critérios para ativação do desconto
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow
                      icon={DollarSign}
                      label="Valor Mínimo do Pedido"
                      value={
                        rule.minOrderValue
                          ? formatCurrency(rule.minOrderValue)
                          : undefined
                      }
                    />
                    <InfoRow
                      icon={Hash}
                      label="Quantidade Mínima"
                      value={
                        rule.minQuantity ? String(rule.minQuantity) : undefined
                      }
                    />
                    <InfoRow
                      icon={ShoppingCart}
                      label="Categoria"
                      value={rule.categoryId || undefined}
                    />
                    <InfoRow
                      icon={ShoppingCart}
                      label="Produto"
                      value={rule.productId || undefined}
                    />
                    <InfoRow
                      icon={ShoppingCart}
                      label="Cliente"
                      value={rule.customerId || undefined}
                    />
                  </div>

                  {!rule.minOrderValue &&
                    !rule.minQuantity &&
                    !rule.categoryId &&
                    !rule.productId &&
                    !rule.customerId && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Nenhuma condição específica definida. A regra se
                          aplica a todos os pedidos no período de vigência.
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </PageLayout>
  );
}
