/**
 * OpenSea OS - Edit Price Table Page
 * Pagina de edicao de tabela de preco
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useDeletePriceTable,
  usePriceTable,
  useUpdatePriceTable,
} from '@/hooks/sales/use-price-tables';
import { PRICE_TABLE_TYPE_LABELS } from '@/types/sales';
import type { PriceTableType } from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { DollarSign, Save, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function EditPriceTablePage() {
  return (
    <Suspense fallback={<GridLoading count={1} layout="grid" size="lg" />}>
      <EditPriceTableContent />
    </Suspense>
  );
}

function EditPriceTableContent() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const id = params.id as string;

  const { data, isLoading } = usePriceTable(id);
  const updateMutation = useUpdatePriceTable();
  const deleteMutation = useDeletePriceTable();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'DEFAULT' as PriceTableType,
    currency: 'BRL',
    priority: 0,
    isActive: true,
    isDefault: false,
    priceIncludesTax: true,
  });

  const priceTable = data?.priceTable;

  useEffect(() => {
    if (priceTable) {
      setFormData({
        name: priceTable.name,
        description: priceTable.description ?? '',
        type: priceTable.type,
        currency: priceTable.currency,
        priority: priceTable.priority,
        isActive: priceTable.isActive,
        isDefault: priceTable.isDefault,
        priceIncludesTax: priceTable.priceIncludesTax,
      });
    }
  }, [priceTable]);

  const handleSave = useCallback(async () => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          ...formData,
          description: formData.description || undefined,
        },
      });
      toast.success('Tabela de preco atualizada com sucesso!');
      router.push(`/sales/pricing/${id}`);
    } catch {
      toast.error('Erro ao atualizar tabela de preco.');
    }
  }, [id, formData, updateMutation, router]);

  const handleDeleteConfirm = useCallback(async () => {
    await deleteMutation.mutateAsync(id);
    setDeleteModalOpen(false);
    toast.success('Tabela de preco excluida com sucesso!');
    router.push('/sales/pricing');
  }, [id, deleteMutation, router]);

  if (isLoading || !priceTable) {
    return <GridLoading count={1} layout="grid" size="lg" />;
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Tabelas de Preco', href: '/sales/pricing' },
            { label: priceTable.name, href: `/sales/pricing/${id}` },
            { label: 'Editar' },
          ]}
          buttons={[
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
            {
              id: 'save',
              title: 'Salvar',
              icon: Save,
              onClick: handleSave,
              variant: 'default' as const,
            },
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Editar Tabela de Preco
              </h2>
              <p className="text-sm text-muted-foreground">
                Altere as informacoes da tabela
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nome da tabela"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                value={formData.type}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    type: e.target.value as PriceTableType,
                  }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors"
              >
                {Object.entries(PRICE_TABLE_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descricao</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Descricao da tabela"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    currency: e.target.value,
                  }))
                }
                maxLength={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    priority: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                Ativa
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      isDefault: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                Tabela Padrao
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.priceIncludesTax}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      priceIncludesTax: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                Preco inclui imposto
              </label>
            </div>
          </div>
        </div>

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusao"
          description="Digite seu PIN de acao para excluir esta tabela de preco. Esta acao nao pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
