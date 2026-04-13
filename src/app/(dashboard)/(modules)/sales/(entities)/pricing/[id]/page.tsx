/**
 * OpenSea OS - Price Table Detail Page
 * Visualização da tabela de preço com grid de itens
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useDeletePriceTable,
  usePriceTable,
  usePriceTableItems,
} from '@/hooks/sales/use-price-tables';
import { PRICE_TABLE_TYPE_LABELS } from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { DollarSign, Edit, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';
import { toast } from 'sonner';

export default function PriceTableDetailPage() {
  return (
    <Suspense fallback={<GridLoading count={1} layout="grid" size="lg" />}>
      <PriceTableDetailContent />
    </Suspense>
  );
}

function PriceTableDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const id = params.id as string;

  const { data, isLoading } = usePriceTable(id);
  const { data: itemsData } = usePriceTableItems(id);
  const deleteMutation = useDeletePriceTable();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const priceTable = data?.priceTable;
  const items = itemsData?.items ?? [];

  const handleDeleteConfirm = useCallback(async () => {
    await deleteMutation.mutateAsync(id);
    setDeleteModalOpen(false);
    toast.success('Tabela de preço excluída com sucesso!');
    router.push('/sales/pricing');
  }, [id, deleteMutation, router]);

  if (isLoading || !priceTable) {
    return <GridLoading count={1} layout="grid" size="lg" />;
  }

  return (
    <PageLayout data-testid="price-table-detail">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Tabelas de Preco', href: '/sales/pricing' },
            { label: priceTable.name },
          ]}
          buttons={[
            ...(hasPermission(SALES_PERMISSIONS.PRICE_TABLES.MODIFY)
              ? [
                  {
                    id: 'edit',
                    title: 'Editar',
                    icon: Edit,
                    onClick: () => router.push(`/sales/pricing/${id}/edit`),
                    variant: 'outline' as const,
                  },
                ]
              : []),
            ...(hasPermission(SALES_PERMISSIONS.PRICE_TABLES.REMOVE)
              ? [
                  {
                    id: 'delete',
                    title: 'Excluir',
                    icon: Trash2,
                    onClick: () => setDeleteModalOpen(true),
                    variant: 'destructive' as const,
                  },
                ]
              : []),
          ]}
        />
        <Header
          title={priceTable.name}
          description={
            priceTable.description || PRICE_TABLE_TYPE_LABELS[priceTable.type]
          }
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white">
              <DollarSign className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {priceTable.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {priceTable.description || 'Sem descrição'}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border',
                    'border-blue-600/25 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8 text-blue-700 dark:text-blue-300'
                  )}
                >
                  {PRICE_TABLE_TYPE_LABELS[priceTable.type]}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border',
                    priceTable.isActive
                      ? 'border-emerald-600/25 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                      : 'border-gray-300 bg-gray-50 dark:bg-white/[0.04] text-gray-500'
                  )}
                >
                  {priceTable.isActive ? 'Ativa' : 'Inativa'}
                </span>
                <span className="text-xs text-muted-foreground">
                  Moeda: {priceTable.currency}
                </span>
                <span className="text-xs text-muted-foreground">
                  Prioridade: {priceTable.priority}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="rounded-xl border bg-card p-6 mt-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Itens da Tabela ({items.length})
          </h3>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum item cadastrado nesta tabela.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Variante</th>
                    <th className="pb-2 font-medium">Preco</th>
                    <th className="pb-2 font-medium">Qtd Min</th>
                    <th className="pb-2 font-medium">Qtd Max</th>
                    <th className="pb-2 font-medium">Custo</th>
                    <th className="pb-2 font-medium">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">
                        {item.variantId.slice(0, 8)}...
                      </td>
                      <td className="py-2">R$ {item.price.toFixed(2)}</td>
                      <td className="py-2">{item.minQuantity}</td>
                      <td className="py-2">{item.maxQuantity ?? '-'}</td>
                      <td className="py-2">
                        {item.costPrice
                          ? `R$ ${item.costPrice.toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="py-2">
                        {item.marginPercent ? `${item.marginPercent}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir esta tabela de preco. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
