/**
 * Edit Production Order Page
 * Apenas acessível para ordens em DRAFT ou PLANNED
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PRODUCTION_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import { productionOrdersService } from '@/services/production';
import type {
  ProductionOrder,
  UpdateProductionOrderRequest,
} from '@/types/production';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  ClipboardList,
  Loader2,
  NotebookText,
  Save,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

export default function EditProductionOrderPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id as string;

  // Form state
  const [priority, setPriority] = useState('2');
  const [quantityPlanned, setQuantityPlanned] = useState('');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const {
    data: orderData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['production-orders', orderId],
    queryFn: async () => {
      const res = await productionOrdersService.getById(orderId);
      return res.productionOrder;
    },
    enabled: !!orderId,
  });

  const order = orderData as ProductionOrder | undefined;

  // Redirect if status is not editable
  useEffect(() => {
    if (order && order.status !== 'DRAFT' && order.status !== 'PLANNED') {
      toast.error('Esta ordem não pode ser editada no status atual.');
      router.push(`/production/orders/${orderId}`);
    }
  }, [order, orderId, router]);

  // Load data into form
  useEffect(() => {
    if (order) {
      setPriority(String(order.priority || 2));
      setQuantityPlanned(String(order.quantityPlanned));
      setPlannedStartDate(
        order.plannedStartDate ? order.plannedStartDate.split('T')[0] : ''
      );
      setPlannedEndDate(
        order.plannedEndDate ? order.plannedEndDate.split('T')[0] : ''
      );
      setNotes(order.notes || '');
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantityPlanned || Number(quantityPlanned) <= 0) {
      toast.error('Quantidade planejada deve ser maior que zero.');
      return;
    }

    try {
      setIsSaving(true);
      const data: UpdateProductionOrderRequest = {
        priority: Number(priority),
        quantityPlanned: Number(quantityPlanned),
        plannedStartDate: plannedStartDate || null,
        plannedEndDate: plannedEndDate || null,
        notes: notes.trim() || null,
      };

      await productionOrdersService.update(orderId, data);
      await queryClient.invalidateQueries({
        queryKey: ['production-orders'],
      });
      toast.success('Ordem de produção atualizada com sucesso!');
      router.push(`/production/orders/${orderId}`);
    } catch (err) {
      logger.error(
        'Failed to update production order',
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error('Não foi possível atualizar a ordem de produção.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    const form = document.getElementById('order-form') as HTMLFormElement;
    if (form) {
      form.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }
  };

  const handleCancel = async () => {
    try {
      await productionOrdersService.cancel(orderId);
      await queryClient.invalidateQueries({
        queryKey: ['production-orders'],
      });
      toast.success('Ordem de produção cancelada!');
      router.push('/production/orders');
    } catch (err) {
      logger.error(
        'Failed to cancel production order',
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error('Erro ao cancelar a ordem de produção.');
    } finally {
      setDeleteModalOpen(false);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Produção', href: '/production' },
              { label: 'Ordens', href: '/production/orders' },
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

  // Error
  if (error || !order) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Produção', href: '/production' },
              { label: 'Ordens', href: '/production/orders' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Ordem não encontrada"
            message="A ordem de produção que você procura não existe ou foi removida."
            action={{
              label: 'Voltar para Ordens',
              onClick: () => router.push('/production/orders'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const actionButtons: HeaderButton[] = [
    {
      id: 'cancel-nav',
      title: 'Cancelar',
      onClick: () => router.push(`/production/orders/${orderId}`),
      variant: 'ghost',
    },
    {
      id: 'delete',
      title: 'Cancelar Ordem',
      icon: Trash2,
      onClick: () => setDeleteModalOpen(true),
      variant: 'default',
      className:
        'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
    },
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar alterações',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSaveClick,
      variant: 'default',
      disabled: isSaving,
    },
  ];

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Produção', href: '/production' },
            { label: 'Ordens', href: '/production/orders' },
            {
              label: order.orderNumber,
              href: `/production/orders/${orderId}`,
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-orange-600 shadow-lg">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">
                Editando ordem de produção
              </p>
              <h1 className="truncate text-xl font-bold">
                {order.orderNumber}
              </h1>
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <Card className="bg-white/5 overflow-hidden py-2">
          <form
            id="order-form"
            onSubmit={handleSubmit}
            className="space-y-8 px-6 py-4"
          >
            {/* Quantidade e Prioridade */}
            <div className="space-y-5">
              <SectionHeader
                icon={ClipboardList}
                title="Dados da Ordem"
                subtitle="Quantidade e prioridade"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="quantityPlanned">
                      Quantidade Planejada{' '}
                      <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="quantityPlanned"
                      type="number"
                      min={1}
                      value={quantityPlanned}
                      onChange={e => setQuantityPlanned(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Baixa</SelectItem>
                        <SelectItem value="2">Normal</SelectItem>
                        <SelectItem value="3">Alta</SelectItem>
                        <SelectItem value="4">Urgente</SelectItem>
                        <SelectItem value="5">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Datas */}
            <div className="space-y-5">
              <SectionHeader
                icon={Calendar}
                title="Datas Planejadas"
                subtitle="Início e fim previstos"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="plannedStartDate">
                      Data de Início Planejada
                    </Label>
                    <Input
                      id="plannedStartDate"
                      type="date"
                      value={plannedStartDate}
                      onChange={e => setPlannedStartDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="plannedEndDate">
                      Data de Fim Planejada
                    </Label>
                    <Input
                      id="plannedEndDate"
                      type="date"
                      value={plannedEndDate}
                      onChange={e => setPlannedEndDate(e.target.value)}
                    />
                  </div>
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
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Observações sobre a ordem de produção"
                    rows={4}
                    maxLength={1000}
                  />
                </div>
              </div>
            </div>
          </form>
        </Card>
      </PageBody>

      {/* Cancel PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleCancel}
        title="Cancelar Ordem de Produção"
        description={`Digite seu PIN de ação para cancelar a ordem "${order.orderNumber}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
