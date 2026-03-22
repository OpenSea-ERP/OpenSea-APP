/**
 * OpenSea OS - Edit Contract Page
 * Follows the standard edit page pattern: PageLayout > PageHeader > PageBody
 * with Identity Card + Form Cards with SectionHeaders.
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
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  useBankAccounts,
  useContract,
  useCostCenters,
  useDeleteContract,
  useFinanceCategories,
  useUpdateContract,
} from '@/hooks/finance';
import { logger } from '@/lib/logger';
import type { PaymentFrequency } from '@/types/finance';
import {
  CONTRACT_STATUS_LABELS,
  PAYMENT_FREQUENCY_LABELS,
} from '@/types/finance';
import {
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Landmark,
  Loader2,
  NotebookText,
  Save,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
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

export default function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data, isLoading: isLoadingContract, error } = useContract(id);
  const contract = data?.contract;

  const updateMutation = useUpdateContract();
  const deleteMutation = useDeleteContract();

  const { data: bankAccountsData } = useBankAccounts();
  const { data: costCentersData } = useCostCenters();
  const { data: categoriesData } = useFinanceCategories();

  const bankAccounts = bankAccountsData?.bankAccounts ?? [];
  const costCenters = costCentersData?.costCenters ?? [];
  const categories = categoriesData?.categories ?? [];

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Section 1: Dados Básicos
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Section 2: Período
  const [endDate, setEndDate] = useState('');
  const [autoRenew, setAutoRenew] = useState(false);
  const [renewalPeriodMonths, setRenewalPeriodMonths] = useState(12);
  const [alertDaysBefore, setAlertDaysBefore] = useState(30);

  // Section 3: Valores
  const [totalValue, setTotalValue] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentFrequency, setPaymentFrequency] =
    useState<PaymentFrequency>('MONTHLY');

  // Section 4: Vinculação
  const [bankAccountId, setBankAccountId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Section 5: Observações
  const [notes, setNotes] = useState('');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (contract) {
      setTitle(contract.title || '');
      setDescription(contract.description || '');
      setCompanyName(contract.companyName || '');
      setContactName(contract.contactName || '');
      setContactEmail(contract.contactEmail || '');
      setEndDate(contract.endDate ? contract.endDate.split('T')[0] : '');
      setAutoRenew(contract.autoRenew ?? false);
      setRenewalPeriodMonths(contract.renewalPeriodMonths ?? 12);
      setAlertDaysBefore(contract.alertDaysBefore ?? 30);
      setTotalValue(contract.totalValue ?? 0);
      setPaymentAmount(contract.paymentAmount ?? 0);
      setPaymentFrequency(contract.paymentFrequency ?? 'MONTHLY');
      setBankAccountId(contract.bankAccountId || '');
      setCostCenterId(contract.costCenterId || '');
      setCategoryId(contract.categoryId || '');
      setNotes(contract.notes || '');
    }
  }, [contract]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('O título é obrigatório.');
      return;
    }
    if (!companyName.trim()) {
      toast.error('A empresa/fornecedor é obrigatória.');
      return;
    }

    try {
      setIsSaving(true);

      await updateMutation.mutateAsync({
        id,
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          companyName: companyName.trim(),
          contactName: contactName.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          endDate: endDate || undefined,
          autoRenew,
          renewalPeriodMonths: autoRenew ? renewalPeriodMonths : undefined,
          alertDaysBefore,
          totalValue: totalValue || undefined,
          paymentFrequency,
          paymentAmount: paymentAmount || undefined,
          bankAccountId: bankAccountId || undefined,
          costCenterId: costCenterId || undefined,
          categoryId: categoryId || undefined,
          notes: notes.trim() || undefined,
        },
      });

      toast.success('Contrato atualizado com sucesso!');
      router.push(`/finance/contracts/${id}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar contrato',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar contrato', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Contrato excluído com sucesso!');
      router.push('/finance/contracts');
    } catch (err) {
      logger.error(
        'Erro ao excluir contrato',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir contrato', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'cancel',
      title: 'Cancelar',
      onClick: () => router.push(`/finance/contracts/${id}`),
      variant: 'ghost',
    },
    {
      id: 'delete',
      title: 'Excluir',
      icon: Trash2,
      onClick: () => setDeleteModalOpen(true),
      variant: 'default',
      className:
        'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
    },
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar Alterações',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving,
    },
  ];

  // ============================================================================
  // BREADCRUMBS
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Financeiro', href: '/finance' },
    { label: 'Contratos', href: '/finance/contracts' },
    {
      label: contract?.title || '...',
      href: `/finance/contracts/${id}`,
    },
    { label: 'Editar' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoadingContract) {
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

  if (error || !contract) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Contrato não encontrado"
            message="O contrato solicitado não foi encontrado."
            action={{
              label: 'Voltar para Contratos',
              onClick: () => router.push('/finance/contracts'),
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-teal-600 shadow-lg">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando contrato</p>
              <h1 className="text-xl font-bold truncate">
                {contract.title || 'Sem título'}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0 rounded-lg bg-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-xs font-semibold">Status</p>
                <p className="text-[11px] text-muted-foreground">
                  {CONTRACT_STATUS_LABELS[contract.status]}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card — Section 1: Dados Básicos */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={FileText}
                title="Dados Básicos"
                subtitle="Informações principais do contrato"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 grid gap-2">
                    <Label htmlFor="title">
                      Título <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Ex: Contrato de Fornecimento"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Descrição detalhada do contrato..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card — Section 2: Fornecedor */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Building2}
                title="Fornecedor"
                subtitle="Dados da empresa e contato"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 grid gap-2">
                    <Label htmlFor="companyName">
                      Empresa/Fornecedor{' '}
                      <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="Razão social ou nome fantasia"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contactName">Nome do Contato</Label>
                    <Input
                      id="contactName"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      placeholder="Responsável pelo contrato"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contactEmail">E-mail do Contato</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="email@empresa.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card — Section 3: Período */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Calendar}
                title="Período"
                subtitle="Vigência e renovação automática"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={
                        contract.startDate
                          ? contract.startDate.split('T')[0]
                          : ''
                      }
                      disabled
                      className="opacity-60"
                    />
                    <p className="text-xs text-muted-foreground">
                      Não editável após criação
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="endDate">Data de Término</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="alertDaysBefore">Alerta (dias antes)</Label>
                    <Input
                      id="alertDaysBefore"
                      type="number"
                      min="1"
                      max="365"
                      value={alertDaysBefore}
                      onChange={e =>
                        setAlertDaysBefore(parseInt(e.target.value) || 30)
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="autoRenew"
                      checked={autoRenew}
                      onCheckedChange={checked =>
                        setAutoRenew(checked === true)
                      }
                    />
                    <Label htmlFor="autoRenew" className="font-normal text-sm">
                      Renovação automática
                    </Label>
                  </div>
                  {autoRenew && (
                    <div className="grid gap-2 pl-6 max-w-xs">
                      <Label htmlFor="renewalPeriodMonths">
                        Período de renovação (meses)
                      </Label>
                      <Input
                        id="renewalPeriodMonths"
                        type="number"
                        min="1"
                        max="120"
                        value={renewalPeriodMonths}
                        onChange={e =>
                          setRenewalPeriodMonths(parseInt(e.target.value) || 12)
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card — Section 4: Valores */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={DollarSign}
                title="Valores"
                subtitle="Valor total, parcela e frequência de pagamento"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="totalValue">Valor Total (R$)</Label>
                    <Input
                      id="totalValue"
                      type="number"
                      step="0.01"
                      min="0"
                      value={totalValue}
                      onChange={e =>
                        setTotalValue(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0,00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="paymentAmount">Valor da Parcela (R$)</Label>
                    <Input
                      id="paymentAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={paymentAmount}
                      onChange={e =>
                        setPaymentAmount(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0,00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="paymentFrequency">Frequência</Label>
                    <Select
                      value={paymentFrequency}
                      onValueChange={v =>
                        setPaymentFrequency(v as PaymentFrequency)
                      }
                    >
                      <SelectTrigger id="paymentFrequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAYMENT_FREQUENCY_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card — Section 5: Vinculação */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Landmark}
                title="Vinculação"
                subtitle="Conta bancária, centro de custo e categoria"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bankAccountId">Conta Bancária</Label>
                    <Select
                      value={bankAccountId}
                      onValueChange={setBankAccountId}
                    >
                      <SelectTrigger id="bankAccountId">
                        <SelectValue placeholder="Selecione uma conta bancária..." />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map(ba => (
                          <SelectItem key={ba.id} value={ba.id}>
                            {ba.name}
                            {ba.bankName ? ` (${ba.bankName})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="costCenterId">Centro de Custo</Label>
                    <Select
                      value={costCenterId}
                      onValueChange={setCostCenterId}
                    >
                      <SelectTrigger id="costCenterId">
                        <SelectValue placeholder="Selecione um centro de custo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {costCenters.map(cc => (
                          <SelectItem key={cc.id} value={cc.id}>
                            {cc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="categoryId">Categoria</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="categoryId">
                        <SelectValue placeholder="Selecione uma categoria..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card — Section 6: Observações */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Observações"
                subtitle="Notas e informações adicionais"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Informações adicionais sobre o contrato..."
                    rows={4}
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
        title="Excluir Contrato"
        description={`Digite seu PIN de ação para excluir o contrato "${contract.title}". Os lançamentos pendentes serão cancelados. Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
