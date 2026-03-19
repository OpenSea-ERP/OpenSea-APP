/**
 * OpenSea OS - Warehouse Edit Page
 * Follows the standard edit page pattern: PageLayout > PageHeader > PageBody
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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-permissions';
import { STOCK_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  AlertTriangle,
  Info,
  Loader2,
  MapPinHouse,
  NotebookText,
  Save,
  Trash2,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import {
  useDeleteWarehouse,
  useUpdateWarehouse,
  useWarehouse,
} from '../../src/api';

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-foreground" />
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

interface PageProps {
  params: Promise<{ warehouseId: string }>;
}

export default function WarehouseEditPage({ params }: PageProps) {
  const { warehouseId } = use(params);
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(STOCK_PERMISSIONS.WAREHOUSES.DELETE);

  // Data fetching
  const { data: warehouse, isLoading, error } = useWarehouse(warehouseId);
  const updateMutation = useUpdateWarehouse();
  const deleteMutation = useDeleteWarehouse();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);

  // UI state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteWarningOpen, setDeleteWarningOpen] = useState(false);


  // Populate form
  useEffect(() => {
    if (warehouse) {
      setName(warehouse.name);
      setDescription(warehouse.description ?? '');
      setAddress(warehouse.address ?? '');
      setIsActive(warehouse.isActive);
    }
  }, [warehouse]);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      toast.error('O nome do armazém é obrigatório');
      return;
    }

    updateMutation.mutate(
      {
        id: warehouseId,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          address: address.trim() || undefined,
          isActive,
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
  }, [updateMutation, warehouseId, name, description, address, isActive, router]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync(warehouseId);
      toast.success('Armazém excluído com sucesso');
      router.push('/stock/locations');
    } catch {
      toast.error('Erro ao excluir armazém.');
    }
  }, [deleteMutation, warehouseId, router]);

  // Loading state
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
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  // Error state
  if (error || !warehouse) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Localizações', href: '/stock/locations' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Armazém não encontrado"
            message="O armazém que você está procurando não existe ou foi removido."
            action={{
              label: 'Voltar para Localizações',
              onClick: () => router.push('/stock/locations'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const actionButtons: HeaderButton[] = [
    {
      id: 'cancel',
      title: 'Cancelar',
      onClick: () => router.push(`/stock/locations/${warehouseId}`),
      variant: 'ghost',
    },
    ...(canDelete
      ? [
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash2,
            onClick: () => {
              if (warehouse.stats && warehouse.stats.occupiedBins > 0) {
                setDeleteWarningOpen(true);
              } else {
                setDeleteOpen(true);
              }
            },
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
    {
      id: 'save',
      title: updateMutation.isPending ? 'Salvando...' : 'Salvar alterações',
      icon: updateMutation.isPending ? Loader2 : Save,
      onClick: handleSave,
      variant: 'default',
      disabled: updateMutation.isPending,
    },
  ];

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Localizações', href: '/stock/locations' },
            {
              label: warehouse.name,
              href: `/stock/locations/${warehouseId}`,
            },
            { label: 'Editar' },
          ]}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg">
              <WarehouseIcon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">
                Editando armazém
              </p>
              <h1 className="truncate text-xl font-bold">
                {warehouse.name}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0 rounded-lg bg-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-xs font-semibold">Status</p>
                <p className="text-[11px] text-muted-foreground">
                  {isActive ? 'Ativo' : 'Inativo'}
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <Card className="bg-white/5 overflow-hidden py-2">
          <div className="space-y-8 px-6 py-4">
            {/* Identificação */}
            <div className="space-y-5">
              <SectionHeader
                icon={Info}
                title="Identificação"
                subtitle="Dados principais do armazém"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="code">Código</Label>
                    <Input
                      id="code"
                      value={warehouse.code}
                      disabled
                      className="font-mono"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nome do armazém"
                      maxLength={255}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-5">
              <SectionHeader
                icon={MapPinHouse}
                title="Endereço"
                subtitle="Localização física do armazém"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Endereço físico (opcional)"
                    maxLength={255}
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Observações"
                subtitle="Notas adicionais"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição do armazém (opcional)"
                    rows={4}
                    maxLength={1000}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </PageBody>

      {/* Delete Warning Dialog (when warehouse has items) */}
      {deleteWarningOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
              <h3 className="text-lg font-semibold">Armazém com Itens</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Este armazém possui <strong>{warehouse.stats?.occupiedBins ?? 0} nichos ocupados</strong> com
              itens. Ao excluir, todos os itens serão desvinculados dos seus nichos.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteWarningOpen(false)}
                className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setDeleteWarningOpen(false);
                  setDeleteOpen(true);
                }}
                className="px-4 py-2 text-sm rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                Prosseguir com Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete PIN Confirmation Modal */}
      <VerifyActionPinModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Armazém"
        description={`Digite seu PIN de ação para excluir o armazém "${warehouse.name}". Todas as zonas e nichos serão removidos.`}
      />
    </PageLayout>
  );
}
