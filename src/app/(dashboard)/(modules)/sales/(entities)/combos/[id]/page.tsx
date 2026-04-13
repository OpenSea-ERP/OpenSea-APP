/**
 * OpenSea OS - Combo Detail Page
 * Página de detalhes do combo com informações gerais e itens
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
import { useCombo } from '@/hooks/sales/use-combos';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { Combo, ComboDiscountType } from '@/types/sales';
import {
  Calendar,
  DollarSign,
  Edit,
  Hash,
  Info,
  Layers,
  Package,
  Percent,
  ShieldCheck,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const COMBO_TYPE_LABELS: Record<string, string> = {
  FIXED: 'Preço Fixo',
  DYNAMIC: 'Dinamico',
};

const DISCOUNT_TYPE_LABELS: Record<ComboDiscountType, string> = {
  PERCENTAGE: 'Percentual',
  FIXED_VALUE: 'Valor Fixo',
};

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

export default function ComboDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const comboId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: comboData, isLoading, error } = useCombo(comboId);

  const combo = comboData?.combo as Combo | undefined;

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.COMBOS.ADMIN)
      ? [
          {
            id: 'edit',
            title: 'Editar Combo',
            icon: Edit,
            onClick: () => router.push(`/sales/combos/${comboId}/edit`),
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
    { label: 'Combos', href: '/sales/combos' },
    { label: combo?.name || '...' },
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

  if (error || !combo) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Combo não encontrado"
            message="O combo que você está procurando não existe ou foi removido."
            action={{
              label: 'Voltar para Combos',
              onClick: () => router.push('/sales/combos'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  const typeLabel = COMBO_TYPE_LABELS[combo.type] || combo.type;
  const createdDate = formatDate(combo.createdAt);

  const discountDisplay =
    combo.discountType === 'PERCENTAGE' && combo.discountValue != null
      ? `${combo.discountValue}%`
      : combo.discountType === 'FIXED_VALUE' && combo.discountValue != null
        ? formatCurrency(combo.discountValue)
        : null;

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
              <Package className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{typeLabel}</p>
              <h1 className="text-xl font-bold truncate">{combo.name}</h1>
              {combo.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {combo.description}
                </p>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                  combo.isActive
                    ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400'
                }`}
              >
                {combo.isActive ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>
        </Card>

        {/* Informações Gerais */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-foreground" />
                <div>
                  <h3 className="text-base font-semibold">
                    Informações Gerais
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Dados de configuração do combo
                  </p>
                </div>
              </div>
              <div className="border-b border-border" />
            </div>

            <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={Layers} label="Tipo" value={typeLabel} />
                {combo.type === 'FIXED' && combo.fixedPrice != null && (
                  <InfoRow
                    icon={DollarSign}
                    label="Preço Fixo"
                    value={formatCurrency(combo.fixedPrice)}
                  />
                )}
                {combo.discountType && (
                  <InfoRow
                    icon={Percent}
                    label="Tipo de Desconto"
                    value={DISCOUNT_TYPE_LABELS[combo.discountType]}
                  />
                )}
                {discountDisplay && (
                  <InfoRow
                    icon={ShieldCheck}
                    label="Valor do Desconto"
                    value={discountDisplay}
                  />
                )}
                <InfoRow
                  icon={Hash}
                  label="Mínimo de Itens"
                  value={combo.minItems?.toString()}
                />
                <InfoRow
                  icon={Hash}
                  label="Máximo de Itens"
                  value={combo.maxItems?.toString()}
                />
                <InfoRow
                  icon={Calendar}
                  label="Valido a partir de"
                  value={combo.validFrom ? formatDate(combo.validFrom) : null}
                />
                <InfoRow
                  icon={Calendar}
                  label="Valido ate"
                  value={combo.validUntil ? formatDate(combo.validUntil) : null}
                />
                <InfoRow
                  icon={Calendar}
                  label="Criado em"
                  value={createdDate}
                />
              </div>

              {combo.description && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Descrição
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {combo.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Itens do Combo */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-foreground" />
                <div>
                  <h3 className="text-base font-semibold">Itens do Combo</h3>
                  <p className="text-sm text-muted-foreground">
                    Produtos e categorias incluidos neste combo
                  </p>
                </div>
              </div>
              <div className="border-b border-border" />
            </div>

            {(combo.minItems != null || combo.maxItems != null) && (
              <div className="flex flex-wrap gap-3">
                {combo.minItems != null && (
                  <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300">
                    <Hash className="h-3 w-3" />
                    Mínimo: {combo.minItems}{' '}
                    {combo.minItems === 1 ? 'item' : 'itens'}
                  </div>
                )}
                {combo.maxItems != null && (
                  <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300">
                    <Hash className="h-3 w-3" />
                    Máximo: {combo.maxItems}{' '}
                    {combo.maxItems === 1 ? 'item' : 'itens'}
                  </div>
                )}
              </div>
            )}

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(combo as any).items?.length > 0 ? (
              <div className="w-full rounded-xl border border-border bg-white dark:bg-slate-800/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Produto
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        SKU
                      </th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                        Qtd
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                        Preço Unit.
                      </th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">
                        Obrigatório
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(combo as any).items.map((item: any, idx: number) => (
                      <tr
                        key={item.id || idx}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 font-medium">
                          {item.variant?.name || 'Produto removido'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                          {item.variant?.sku || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.variant?.price != null
                            ? `R$ ${Number(item.variant.price).toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.isRequired ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300">
                              Sim
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-500/8 dark:text-slate-400">
                              Não
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-sky-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum item adicionado a este combo. Use o botão
                    &quot;Editar Combo&quot; para adicionar produtos.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </PageBody>
    </PageLayout>
  );
}
