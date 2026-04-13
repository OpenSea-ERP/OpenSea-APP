/**
 * OpenSea OS - Edit Discount Rule Page
 * Página de edição da regra de desconto com formulário completo
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
  useDiscountRule,
  useUpdateDiscountRule,
  useDeleteDiscountRule,
} from '@/hooks/sales/use-discount-rules';
import { usePermissions } from '@/hooks/use-permissions';
import { discountRulesConfig } from '@/config/entities/discount-rules.config';
import { logger } from '@/lib/logger';
import type { DiscountRule, DiscountType } from '@/types/sales';
import { useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Loader2,
  NotebookText,
  Percent,
  Save,
  Settings,
  ShoppingCart,
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

export default function EditDiscountRulePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const ruleId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: ruleData,
    isLoading: isLoadingRule,
    error,
  } = useDiscountRule(ruleId);

  const rule = ruleData?.discountRule as DiscountRule | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdateDiscountRule();
  const deleteMutation = useDeleteDiscountRule();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DiscountType>('PERCENTAGE');
  const [value, setValue] = useState(0);
  const [minOrderValue, setMinOrderValue] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productId, setProductId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(0);
  const [isStackable, setIsStackable] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (rule) {
      setName(rule.name || '');
      setDescription(rule.description || '');
      setType(rule.type || 'PERCENTAGE');
      setValue(rule.value || 0);
      setMinOrderValue(rule.minOrderValue ? String(rule.minOrderValue) : '');
      setMinQuantity(rule.minQuantity ? String(rule.minQuantity) : '');
      setCategoryId(rule.categoryId || '');
      setProductId(rule.productId || '');
      setCustomerId(rule.customerId || '');
      setStartDate(
        rule.startDate
          ? new Date(rule.startDate).toISOString().split('T')[0]
          : ''
      );
      setEndDate(
        rule.endDate ? new Date(rule.endDate).toISOString().split('T')[0] : ''
      );
      setIsActive(rule.isActive ?? true);
      setPriority(rule.priority || 0);
      setIsStackable(rule.isStackable ?? false);
    }
  }, [rule]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Datas de início e fim são obrigatórias');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        id: ruleId,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          value,
          minOrderValue: minOrderValue ? parseFloat(minOrderValue) : undefined,
          minQuantity: minQuantity ? parseInt(minQuantity) : undefined,
          categoryId: categoryId.trim() || undefined,
          productId: productId.trim() || undefined,
          customerId: customerId.trim() || undefined,
          startDate,
          endDate,
          isActive,
          priority,
          isStackable,
        },
      });

      toast.success('Regra de desconto atualizada com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['discount-rules', ruleId],
      });
      router.push(`/sales/discount-rules/${ruleId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar regra de desconto',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar regra de desconto', {
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(ruleId);
      toast.success('Regra de desconto excluída com sucesso!');
      router.push('/sales/discount-rules');
    } catch (err) {
      logger.error(
        'Erro ao deletar regra de desconto',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar regra de desconto', {
        description: message,
      });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(discountRulesConfig.permissions.delete)
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
      disabled: isSaving || !name.trim() || !startDate || !endDate,
    },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Regras de Desconto', href: '/sales/discount-rules' },
    {
      label: rule?.name || '...',
      href: `/sales/discount-rules/${ruleId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoadingRule) {
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
            message="A regra de desconto solicitada não foi encontrada."
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
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="discount-rule-edit">
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
              {type === 'PERCENTAGE' ? (
                <Percent className="h-7 w-7 text-white" />
              ) : (
                <DollarSign className="h-7 w-7 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando regra de desconto
              </p>
              <h1 className="text-xl font-bold truncate">{rule.name}</h1>
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

        {/* Form Card: Dados Básicos */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Dados Básicos"
                subtitle="Nome, tipo e valor do desconto"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="name">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nome da regra de desconto"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="type">
                      Tipo <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={type}
                      onValueChange={v => setType(v as DiscountType)}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentual</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">Valor Fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="value">
                      Valor <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      min={0}
                      step={type === 'PERCENTAGE' ? '1' : '0.01'}
                      value={value}
                      onChange={e => setValue(parseFloat(e.target.value) || 0)}
                      placeholder={type === 'PERCENTAGE' ? '10' : '50.00'}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descrição da regra de desconto..."
                    rows={2}
                  />
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

        {/* Form Card: Período e Prioridade */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Settings}
                title="Período e Prioridade"
                subtitle="Vigência e configurações avançadas"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">
                      Data Início <span className="text-red-500">*</span>
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
                      Data Fim <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Input
                      id="priority"
                      type="number"
                      min={0}
                      value={priority}
                      onChange={e => setPriority(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div className="flex items-end">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-white dark:bg-slate-800/60 w-full">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">
                          Acumulável
                        </Label>
                      </div>
                      <Switch
                        checked={isStackable}
                        onCheckedChange={setIsStackable}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Condições */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={ShoppingCart}
                title="Condições"
                subtitle="Critérios para aplicação do desconto"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="minOrderValue">
                      Valor Mínimo do Pedido
                    </Label>
                    <Input
                      id="minOrderValue"
                      type="number"
                      min={0}
                      step="0.01"
                      value={minOrderValue}
                      onChange={e => setMinOrderValue(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="minQuantity">Quantidade Mínima</Label>
                    <Input
                      id="minQuantity"
                      type="number"
                      min={0}
                      value={minQuantity}
                      onChange={e => setMinQuantity(e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="categoryId">Categoria (ID)</Label>
                    <Input
                      id="categoryId"
                      value={categoryId}
                      onChange={e => setCategoryId(e.target.value)}
                      placeholder="ID da categoria"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="productId">Produto (ID)</Label>
                    <Input
                      id="productId"
                      value={productId}
                      onChange={e => setProductId(e.target.value)}
                      placeholder="ID do produto"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="customerId">Cliente (ID)</Label>
                    <Input
                      id="customerId"
                      value={customerId}
                      onChange={e => setCustomerId(e.target.value)}
                      placeholder="ID do cliente"
                    />
                  </div>
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
        title="Excluir Regra de Desconto"
        description={`Digite seu PIN de ação para excluir a regra "${rule.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
