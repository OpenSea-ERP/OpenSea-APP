/**
 * OpenSea OS - Warehouse Edit Page
 * Página de edição de armazém seguindo o padrão de edit pages
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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Save,
  Trash2,
  Warehouse,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { usePermissions } from '@/hooks/use-permissions';
import { STOCK_PERMISSIONS } from '@/config/rbac/permission-codes';

import {
  useDeleteWarehouse,
  useUpdateWarehouse,
  useWarehouse,
} from '../../src/api';

interface PageProps {
  params: Promise<{ warehouseId: string }>;
}

export default function WarehouseEditPage({ params }: PageProps) {
  const { warehouseId } = use(params);
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(STOCK_PERMISSIONS.WAREHOUSES.DELETE);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: warehouse, isLoading } = useWarehouse(warehouseId);
  const updateMutation = useUpdateWarehouse();
  const deleteMutation = useDeleteWarehouse();

  // ============================================================================
  // STATE
  // ============================================================================

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    isActive: true,
  });
  const [deleteOpen, setDeleteOpen] = useState(false);

  // ============================================================================
  // POPULATE FORM
  // ============================================================================

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name,
        description: warehouse.description ?? '',
        address: warehouse.address ?? '',
        isActive: warehouse.isActive,
      });
    }
  }, [warehouse]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSave = useCallback(() => {
    updateMutation.mutate(
      {
        id: warehouseId,
        data: {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          address: formData.address.trim() || undefined,
          isActive: formData.isActive,
        },
      },
      {
        onSuccess: () => {
          toast.success('Armazém atualizado com sucesso');
          router.push(`/stock/locations/${warehouseId}`);
        },
        onError: () => {
          toast.error('Erro ao atualizar armazém.');
        },
      }
    );
  }, [updateMutation, warehouseId, formData, router]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync(warehouseId);
      toast.success('Armazém excluído com sucesso');
      router.push('/stock/locations');
    } catch {
      toast.error('Erro ao excluir armazém.');
    }
  }, [deleteMutation, warehouseId, router]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Localizações', href: '/stock/locations' },
              { label: '...' },
              { label: 'Editar' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={1} layout="grid" size="lg" />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Localizações', href: '/stock/locations' },
            {
              label: warehouse?.name ?? '...',
              href: `/stock/locations/${warehouseId}`,
            },
            { label: 'Editar' },
          ]}
          buttons={[
            {
              id: 'cancel',
              title: 'Cancelar',
              variant: 'ghost' as const,
              onClick: () => router.back(),
            },
            ...(canDelete
              ? [
                  {
                    id: 'delete',
                    title: 'Excluir',
                    variant: 'outline' as const,
                    icon: Trash2,
                    onClick: () => setDeleteOpen(true),
                    className:
                      'bg-slate-200 hover:bg-rose-600 hover:text-white dark:bg-slate-700 dark:hover:bg-rose-600',
                  },
                ]
              : []),
            {
              id: 'save',
              title: updateMutation.isPending ? 'Salvando...' : 'Salvar alterações',
              icon: Save,
              variant: 'default' as const,
              onClick: handleSave,
              disabled: updateMutation.isPending,
            },
          ]}
        />

        {/* Identity Card */}
        <div className="bg-white/5 p-5 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground mb-1">Editando Armazém</p>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Warehouse className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="font-mono text-sm text-muted-foreground">
                {warehouse?.code}
              </p>
              <h1 className="text-2xl font-bold tracking-tight">
                {warehouse?.name}
              </h1>
            </div>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        <div className="bg-white/95 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4 sm:p-6 space-y-4">
          {/* Código (read-only) */}
          <div>
            <label className="text-sm font-medium">Código</label>
            <Input
              value={warehouse?.code ?? ''}
              disabled
              className="mt-1.5 font-mono"
            />
          </div>

          {/* Nome */}
          <div>
            <label className="text-sm font-medium">Nome</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              className="mt-1.5"
              placeholder="Nome do armazém"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm font-medium">Descrição</label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              className="mt-1.5"
              placeholder="Descrição do armazém (opcional)"
              rows={3}
            />
          </div>

          {/* Endereço */}
          <div>
            <label className="text-sm font-medium">Endereço</label>
            <Input
              value={formData.address}
              onChange={(e) =>
                setFormData((p) => ({ ...p, address: e.target.value }))
              }
              className="mt-1.5"
              placeholder="Endereço físico (opcional)"
            />
          </div>

          {/* Ativo */}
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">Ativo</p>
              <p className="text-xs text-muted-foreground">
                Armazém disponível para uso
              </p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(v) =>
                setFormData((p) => ({ ...p, isActive: v }))
              }
            />
          </div>
        </div>

        {/* Delete Confirmation */}
        <VerifyActionPinModal
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN para excluir este armazém. Todas as zonas e bins serão removidos."
        />
      </PageBody>
    </PageLayout>
  );
}
