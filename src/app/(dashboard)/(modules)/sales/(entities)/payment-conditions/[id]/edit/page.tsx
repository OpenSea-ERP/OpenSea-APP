/**
 * OpenSea OS - Edit Payment Condition Page
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
  usePaymentCondition,
  useUpdatePaymentCondition,
  useDeletePaymentCondition,
} from '@/hooks/sales/use-payment-conditions';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type {
  PaymentConditionDTO,
  PaymentConditionType,
  InterestType,
  PaymentConditionApplicable,
} from '@/types/sales';
import {
  PAYMENT_CONDITION_TYPE_LABELS,
  INTEREST_TYPE_LABELS,
  PAYMENT_CONDITION_APPLICABLE_LABELS,
} from '@/types/sales/payment-condition.types';
import { useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CreditCard,
  Loader2,
  Percent,
  Save,
  Settings2,
  ShieldCheck,
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
// PAGE
// =============================================================================

export default function EditPaymentConditionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const pcId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: pcData,
    isLoading: isLoadingPC,
    error,
  } = usePaymentCondition(pcId);

  const pc = pcData?.paymentCondition as PaymentConditionDTO | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdatePaymentCondition();
  const deleteMutation = useDeletePaymentCondition();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<PaymentConditionType>('CASH');
  const [installments, setInstallments] = useState('1');
  const [firstDueDays, setFirstDueDays] = useState('0');
  const [intervalDays, setIntervalDays] = useState('30');
  const [downPaymentPercent, setDownPaymentPercent] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [interestType, setInterestType] = useState<InterestType>('SIMPLE');
  const [penaltyRate, setPenaltyRate] = useState('');
  const [discountCash, setDiscountCash] = useState('');
  const [applicableTo, setApplicableTo] =
    useState<PaymentConditionApplicable>('ALL');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxOrderValue, setMaxOrderValue] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (pc) {
      setName(pc.name || '');
      setDescription(pc.description || '');
      setType(pc.type || 'CASH');
      setInstallments(String(pc.installments ?? 1));
      setFirstDueDays(String(pc.firstDueDays ?? 0));
      setIntervalDays(String(pc.intervalDays ?? 30));
      setDownPaymentPercent(
        pc.downPaymentPercent != null ? String(pc.downPaymentPercent) : ''
      );
      setInterestRate(pc.interestRate != null ? String(pc.interestRate) : '');
      setInterestType(pc.interestType || 'SIMPLE');
      setPenaltyRate(pc.penaltyRate != null ? String(pc.penaltyRate) : '');
      setDiscountCash(pc.discountCash != null ? String(pc.discountCash) : '');
      setApplicableTo(pc.applicableTo || 'ALL');
      setMinOrderValue(
        pc.minOrderValue != null ? String(pc.minOrderValue) : ''
      );
      setMaxOrderValue(
        pc.maxOrderValue != null ? String(pc.maxOrderValue) : ''
      );
      setIsActive(pc.isActive ?? true);
      setIsDefault(pc.isDefault ?? false);
    }
  }, [pc]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nome da condição e obrigatório');
      return;
    }

    if (Number(installments) < 1) {
      toast.error('O número de parcelas deve ser pelo menos 1');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        id: pcId,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          installments: Number(installments),
          firstDueDays: Number(firstDueDays),
          intervalDays: Number(intervalDays),
          downPaymentPercent: downPaymentPercent
            ? Number(downPaymentPercent)
            : null,
          interestRate: interestRate ? Number(interestRate) : null,
          interestType,
          penaltyRate: penaltyRate ? Number(penaltyRate) : null,
          discountCash: discountCash ? Number(discountCash) : null,
          applicableTo,
          minOrderValue: minOrderValue ? Number(minOrderValue) : null,
          maxOrderValue: maxOrderValue ? Number(maxOrderValue) : null,
          isActive,
          isDefault,
        },
      });

      toast.success('Condição de pagamento atualizada com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['payment-conditions', pcId],
      });
      router.push(`/sales/payment-conditions/${pcId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar condição de pagamento',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar condição de pagamento', {
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(pcId);
      toast.success('Condição de pagamento excluída com sucesso!');
      router.push('/sales/payment-conditions');
    } catch (err) {
      logger.error(
        'Erro ao deletar condição de pagamento',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar condição de pagamento', {
        description: message,
      });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.PAYMENT_CONDITIONS.REMOVE)
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
      disabled: isSaving || !name.trim(),
    },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    {
      label: 'Condições de Pagamento',
      href: '/sales/payment-conditions',
    },
    {
      label: pc?.name || '...',
      href: `/sales/payment-conditions/${pcId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoadingPC) {
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
            title="Condição de pagamento não encontrada"
            message="A condição de pagamento solicitada não foi encontrada."
            action={{
              label: 'Voltar para Condições de Pagamento',
              onClick: () => router.push('/sales/payment-conditions'),
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
    <PageLayout data-testid="payment-condition-edit">
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
                Editando condição de pagamento
              </p>
              <h1 className="text-xl font-bold truncate">{pc.name}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Status</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isActive ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Dados Básicos */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={CreditCard}
                title="Dados Básicos"
                subtitle="Nome, tipo e parcelas da condição"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      data-testid="payment-condition-field-name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ex: 30/60/90 dias"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="type">
                      Tipo <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={type}
                      onValueChange={v => setType(v as PaymentConditionType)}
                    >
                      <SelectTrigger
                        id="type"
                        data-testid="payment-condition-field-type"
                      >
                        <SelectValue placeholder="Selecione o tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(PAYMENT_CONDITION_TYPE_LABELS) as [
                            PaymentConditionType,
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
                    <Label htmlFor="applicableTo">Aplicável a</Label>
                    <Select
                      value={applicableTo}
                      onValueChange={v =>
                        setApplicableTo(v as PaymentConditionApplicable)
                      }
                    >
                      <SelectTrigger
                        id="applicableTo"
                        data-testid="payment-condition-field-applicableTo"
                      >
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(
                            PAYMENT_CONDITION_APPLICABLE_LABELS
                          ) as [PaymentConditionApplicable, string][]
                        ).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="installments">
                      Parcelas <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="installments"
                      data-testid="payment-condition-field-installments"
                      type="number"
                      min="1"
                      value={installments}
                      onChange={e => setInstallments(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="firstDueDays">
                      Primeiro Vencimento (dias)
                    </Label>
                    <Input
                      id="firstDueDays"
                      type="number"
                      min="0"
                      value={firstDueDays}
                      onChange={e => setFirstDueDays(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="intervalDays">
                      Intervalo entre Parcelas (dias)
                    </Label>
                    <Input
                      id="intervalDays"
                      type="number"
                      min="1"
                      value={intervalDays}
                      onChange={e => setIntervalDays(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    data-testid="payment-condition-field-description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descreva a condição de pagamento..."
                    rows={2}
                  />
                </div>

                {/* Mobile toggle */}
                <div className="grid grid-cols-1 sm:hidden gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-white dark:bg-slate-800/60">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Status</Label>
                      <p className="text-sm text-muted-foreground">
                        {isActive ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>

                {/* Default toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-white dark:bg-slate-800/60">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">
                      Condição Padrão
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Usar como condição padrão para novos pedidos
                    </p>
                  </div>
                  <Switch checked={isDefault} onCheckedChange={setIsDefault} />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Regras Financeiras */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Percent}
                title="Regras Financeiras"
                subtitle="Juros, multas e descontos"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="downPaymentPercent">Entrada (%)</Label>
                    <Input
                      id="downPaymentPercent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={downPaymentPercent}
                      onChange={e => setDownPaymentPercent(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="discountCash">Desconto à Vista (%)</Label>
                    <Input
                      id="discountCash"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={discountCash}
                      onChange={e => setDiscountCash(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="interestRate">Taxa de Juros (%)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={interestRate}
                      onChange={e => setInterestRate(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="interestType">Tipo de Juros</Label>
                    <Select
                      value={interestType}
                      onValueChange={v => setInterestType(v as InterestType)}
                    >
                      <SelectTrigger id="interestType">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(INTEREST_TYPE_LABELS) as [
                            InterestType,
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
                    <Label htmlFor="penaltyRate">Multa por Atraso (%)</Label>
                    <Input
                      id="penaltyRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={penaltyRate}
                      onChange={e => setPenaltyRate(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Limites */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={ShieldCheck}
                title="Limites de Valor"
                subtitle="Restrições de valor mínimo e máximo do pedido"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="minOrderValue">
                      Valor Mínimo do Pedido (R$)
                    </Label>
                    <Input
                      id="minOrderValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={minOrderValue}
                      onChange={e => setMinOrderValue(e.target.value)}
                      placeholder="Sem limite"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="maxOrderValue">
                      Valor Máximo do Pedido (R$)
                    </Label>
                    <Input
                      id="maxOrderValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={maxOrderValue}
                      onChange={e => setMaxOrderValue(e.target.value)}
                      placeholder="Sem limite"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Installment Preview Card */}
        {type === 'INSTALLMENT' && Number(installments) > 1 && (
          <Card className="bg-white/5 py-2 overflow-hidden">
            <div className="px-6 py-4 space-y-8">
              <div className="space-y-5">
                <SectionHeader
                  icon={Calendar}
                  title="Pré-visualização de Parcelas"
                  subtitle="Simulação dos vencimentos com base nos parametros atuais"
                />
                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: Number(installments) }, (_, i) => {
                      const daysFromNow =
                        Number(firstDueDays) + i * Number(intervalDays);
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-border bg-gray-50 dark:bg-slate-700/40 p-3 space-y-1"
                        >
                          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Parcela {i + 1}
                          </span>
                          <p className="text-sm font-semibold">
                            {daysFromNow} dias após o pedido
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Condição de Pagamento"
        description={`Digite seu PIN de ação para excluir a condição "${pc.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
