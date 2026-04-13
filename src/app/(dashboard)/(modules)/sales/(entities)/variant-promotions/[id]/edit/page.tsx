/**
 * OpenSea OS - Edit Variant Promotion Page
 * Página de edicao de promoção de variante
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useVariantPromotion,
  useUpdateVariantPromotion,
  useDeleteVariantPromotion,
} from '@/hooks/sales/use-sales-other';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type { VariantPromotion } from '@/types/sales';
import type { DiscountType } from '@/types/sales/promotion.types';
import { DISCOUNT_TYPE_LABELS } from '@/types/sales/promotion.types';
import { useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  FileText,
  Loader2,
  Percent,
  Save,
  Tag,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// SECTION HEADER
// =============================================================================

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

// =============================================================================
// HELPERS
// =============================================================================

function toDateInputValue(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditVariantPromotionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const promotionId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: promotionData,
    isLoading,
    error,
  } = useVariantPromotion(promotionId);

  const promotion = promotionData?.promotion as VariantPromotion | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdateVariantPromotion();
  const deleteMutation = useDeleteVariantPromotion();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (promotion) {
      setName(promotion.name || '');
      setDiscountType(promotion.discountType || 'PERCENTAGE');
      setDiscountValue(String(promotion.discountValue ?? ''));
      setStartDate(toDateInputValue(promotion.startDate));
      setEndDate(toDateInputValue(promotion.endDate));
      setIsActive(promotion.isActive ?? true);
      setNotes(promotion.notes || '');
    }
  }, [promotion]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('O nome da promoção e obrigatório');
      return;
    }

    if (!discountValue || Number(discountValue) <= 0) {
      toast.error(
        'O valor do desconto e obrigatório e deve ser maior que zero'
      );
      return;
    }

    if (!startDate || !endDate) {
      toast.error('As datas de inicio e fim sao obrigatorias');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('A data final deve ser posterior a data inicial');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        id: promotionId,
        data: {
          name: name.trim(),
          discountType,
          discountValue: Number(discountValue),
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          isActive,
          notes: notes.trim() || undefined,
        },
      });

      toast.success('Promoção atualizada com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['variant-promotions', promotionId],
      });
      router.push(`/sales/variant-promotions/${promotionId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar promoção',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar promoção', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(promotionId);
      toast.success('Promoção excluída com sucesso!');
      router.push('/sales/variant-promotions');
    } catch (err) {
      logger.error(
        'Erro ao deletar promoção',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar promoção', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.PROMOTIONS.REMOVE)
      ? [
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash2,
            onClick: () => setDeleteModalOpen(true),
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving || !name.trim() || !discountValue,
    },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Promoções', href: '/sales/variant-promotions' },
    {
      label: promotion?.name || '...',
      href: `/sales/variant-promotions/${promotionId}`,
    },
    { label: 'Editar' },
  ];

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

  if (error || !promotion) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Promoção não encontrada"
            message="A promoção solicitada não foi encontrada."
            action={{
              label: 'Voltar para Promoções',
              onClick: () => router.push('/sales/variant-promotions'),
            }}
          />
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
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-orange-500 to-amber-600">
              <Tag className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando promoção</p>
              <h1 className="text-xl font-bold truncate">{promotion.name}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Status</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isActive ? 'Ativa' : 'Inativa'}
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Dados da Promoção */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Percent}
                title="Dados da Promoção"
                subtitle="Nome, tipo e valor do desconto"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nome da promoção"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="discountType">
                      Tipo de Desconto <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={discountType}
                      onValueChange={v => setDiscountType(v as DiscountType)}
                    >
                      <SelectTrigger id="discountType">
                        <SelectValue placeholder="Selecione o tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(DISCOUNT_TYPE_LABELS) as [
                            DiscountType,
                            string,
                          ][]
                        ).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="discountValue">
                      {discountType === 'PERCENTAGE'
                        ? 'Percentual (%)'
                        : 'Valor (R$)'}{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="discountValue"
                      type="number"
                      min="0"
                      step={discountType === 'PERCENTAGE' ? '1' : '0.01'}
                      max={discountType === 'PERCENTAGE' ? '100' : undefined}
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value)}
                      placeholder={
                        discountType === 'PERCENTAGE' ? '10' : '50.00'
                      }
                      required
                    />
                  </div>
                </div>

                {/* Mobile toggle */}
                <div className="grid grid-cols-1 sm:hidden gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-white dark:bg-slate-800/60">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Status</Label>
                      <p className="text-sm text-muted-foreground">
                        {isActive ? 'Ativa' : 'Inativa'}
                      </p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Período */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Calendar}
                title="Período"
                subtitle="Datas de inicio e fim da promoção"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">
                      Data de Inicio <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="endDate">
                      Data de Fim <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Observações */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={FileText}
                title="Observações"
                subtitle="Notas adicionais sobre esta promoção"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Observações sobre esta promoção..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Promoção"
        description={`Digite seu PIN de ação para excluir a promoção "${promotion.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
