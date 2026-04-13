/**
 * OpenSea OS - Edit Coupon Page
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
import {
  useCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
} from '@/hooks/sales/use-coupons';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type { Coupon, CouponType, CouponApplicableTo } from '@/types/sales';
import {
  COUPON_TYPE_LABELS,
  COUPON_APPLICABLE_LABELS,
} from '@/types/sales/coupon.types';
import { useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Loader2,
  Percent,
  Save,
  Settings2,
  ShieldCheck,
  Ticket,
  Trash2,
  Users,
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

export default function EditCouponPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const couponId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: couponData,
    isLoading: isLoadingCoupon,
    error,
  } = useCoupon(couponId);

  const coupon = couponData?.coupon as Coupon | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdateCoupon();
  const deleteMutation = useDeleteCoupon();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<CouponType>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [maxUsageTotal, setMaxUsageTotal] = useState('');
  const [maxUsagePerCustomer, setMaxUsagePerCustomer] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [applicableTo, setApplicableTo] = useState<CouponApplicableTo>('ALL');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (coupon) {
      setCode(coupon.code || '');
      setType(coupon.type || 'PERCENTAGE');
      setValue(String(coupon.value ?? ''));
      setMinOrderValue(
        coupon.minOrderValue != null ? String(coupon.minOrderValue) : ''
      );
      setMaxDiscount(
        coupon.maxDiscount != null ? String(coupon.maxDiscount) : ''
      );
      setMaxUsageTotal(
        coupon.maxUsageTotal != null ? String(coupon.maxUsageTotal) : ''
      );
      setMaxUsagePerCustomer(String(coupon.maxUsagePerCustomer ?? ''));
      setValidFrom(toDateInputValue(coupon.validFrom));
      setValidUntil(toDateInputValue(coupon.validUntil));
      setIsActive(coupon.isActive ?? true);
      setApplicableTo(coupon.applicableTo || 'ALL');
    }
  }, [coupon]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Código do cupom e obrigatório');
      return;
    }

    if (!value || Number(value) <= 0) {
      toast.error('Valor do desconto e obrigatório e deve ser maior que zero');
      return;
    }

    if (!validFrom || !validUntil) {
      toast.error('Datas de validade sao obrigatorias');
      return;
    }

    if (new Date(validUntil) <= new Date(validFrom)) {
      toast.error('Data final deve ser posterior a data inicial');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        couponId,
        data: {
          code: code.trim().toUpperCase(),
          type,
          value: Number(value),
          minOrderValue: minOrderValue ? Number(minOrderValue) : undefined,
          maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
          maxUsageTotal: maxUsageTotal ? Number(maxUsageTotal) : undefined,
          maxUsagePerCustomer: maxUsagePerCustomer
            ? Number(maxUsagePerCustomer)
            : undefined,
          validFrom: new Date(validFrom).toISOString(),
          validUntil: new Date(validUntil).toISOString(),
          isActive,
          applicableTo,
        },
      });

      toast.success('Cupom atualizado com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['coupons', couponId],
      });
      router.push(`/sales/coupons/${couponId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar cupom',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar cupom', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(couponId);
      toast.success('Cupom excluído com sucesso!');
      router.push('/sales/coupons');
    } catch (err) {
      logger.error(
        'Erro ao deletar cupom',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar cupom', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.COUPONS.REMOVE)
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
      disabled: isSaving || !code.trim() || !value,
    },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Cupons', href: '/sales/coupons' },
    {
      label: coupon?.code || '...',
      href: `/sales/coupons/${couponId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoadingCoupon) {
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

  if (error || !coupon) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Cupom não encontrado"
            message="O cupom solicitado não foi encontrado."
            action={{
              label: 'Voltar para Cupons',
              onClick: () => router.push('/sales/coupons'),
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-violet-500 to-purple-600">
              <Ticket className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando cupom</p>
              <h1 className="text-xl font-bold truncate font-mono">
                {coupon.code}
              </h1>
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

        {/* Form Card: Dados do Cupom */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Percent}
                title="Dados do Cupom"
                subtitle="Código, tipo e valor do desconto"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="code">
                      Código <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase())}
                      placeholder="EX: DESCONTO10"
                      className="font-mono uppercase"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="type">
                      Tipo de Desconto <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={type}
                      onValueChange={v => setType(v as CouponType)}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Selecione o tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(COUPON_TYPE_LABELS) as [
                            CouponType,
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
                    <Label htmlFor="value">
                      {type === 'PERCENTAGE' ? 'Percentual (%)' : 'Valor (R$)'}{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      min="0"
                      step={type === 'PERCENTAGE' ? '1' : '0.01'}
                      max={type === 'PERCENTAGE' ? '100' : undefined}
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      placeholder={type === 'PERCENTAGE' ? '10' : '50.00'}
                      required
                      disabled={type === 'FREE_SHIPPING'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="applicableTo">Aplicável a</Label>
                    <Select
                      value={applicableTo}
                      onValueChange={v =>
                        setApplicableTo(v as CouponApplicableTo)
                      }
                    >
                      <SelectTrigger id="applicableTo">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.entries(COUPON_APPLICABLE_LABELS) as [
                            CouponApplicableTo,
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
                title="Limites"
                subtitle="Restrições de valor e desconto máximo"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="maxDiscount">Desconto Máximo (R$)</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={maxDiscount}
                      onChange={e => setMaxDiscount(e.target.value)}
                      placeholder="Sem limite"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Validade e Uso */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Calendar}
                title="Validade e Uso"
                subtitle="Período de validade e limites de utilização"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="validFrom">
                      Valido de <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={validFrom}
                      onChange={e => setValidFrom(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="validUntil">
                      Valido ate <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={validUntil}
                      onChange={e => setValidUntil(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="maxUsageTotal">Limite Total de Usos</Label>
                    <Input
                      id="maxUsageTotal"
                      type="number"
                      min="0"
                      step="1"
                      value={maxUsageTotal}
                      onChange={e => setMaxUsageTotal(e.target.value)}
                      placeholder="Ilimitado"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="maxUsagePerCustomer">
                      Limite por Cliente
                    </Label>
                    <Input
                      id="maxUsagePerCustomer"
                      type="number"
                      min="1"
                      step="1"
                      value={maxUsagePerCustomer}
                      onChange={e => setMaxUsagePerCustomer(e.target.value)}
                      placeholder="1"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Usos Realizados</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/50">
                      <span className="text-sm text-muted-foreground">
                        {coupon.usageCount} uso(s)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Info (read-only) */}
        {coupon.aiGenerated && (
          <Card className="bg-white/5 py-2 overflow-hidden">
            <div className="px-6 py-4 space-y-8">
              <div className="space-y-5">
                <SectionHeader
                  icon={Settings2}
                  title="Informações de IA"
                  subtitle="Este cupom foi gerado automáticamente por inteligencia artificial"
                />
                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <div className="grid gap-2">
                    <Label>Motivo da Geração</Label>
                    <div className="flex items-center min-h-10 px-3 py-2 rounded-md border border-border bg-muted/50">
                      <span className="text-sm text-muted-foreground">
                        {coupon.aiReason || 'Nenhum motivo registrado'}
                      </span>
                    </div>
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
        title="Excluir Cupom"
        description={`Digite seu PIN de ação para excluir o cupom "${coupon.code}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
