/**
 * OpenSea OS - Edit Loan Page
 * Follows the standard edit page pattern: PageLayout > PageHeader > PageBody
 * with Identity Card + Form Card with SectionHeader sections.
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  useCostCenters,
  useDeleteLoan,
  useLoan,
  useUpdateLoan,
} from '@/hooks/finance';
import { translateError } from '@/lib/error-messages';
import { logger } from '@/lib/logger';
import type { LoanStatus, LoanType } from '@/types/finance';
import { LOAN_STATUS_LABELS, LOAN_TYPE_LABELS } from '@/types/finance';
import {
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  Landmark,
  Link as LinkIcon,
  Loader2,
  Lock,
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
// STATUS HELPERS
// =============================================================================

const STATUS_COLORS: Record<LoanStatus, string> = {
  ACTIVE:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
  PAID_OFF: 'bg-sky-50 text-sky-700 dark:bg-sky-500/8 dark:text-sky-300',
  DEFAULTED: 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300',
  RENEGOTIATED:
    'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
  CANCELLED:
    'bg-slate-50 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300',
};

function getStatusLabel(status: LoanStatus): string {
  return LOAN_STATUS_LABELS[status] ?? status;
}

function getTypeLabel(type: LoanType): string {
  return LOAN_TYPE_LABELS[type] ?? type;
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditLoanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data, isLoading: isLoadingLoan, error } = useLoan(id);
  const loan = data?.loan;

  const updateMutation = useUpdateLoan();
  const deleteMutation = useDeleteLoan();

  const { data: bankAccountsData } = useBankAccounts();
  const { data: costCentersData } = useCostCenters();

  const bankAccounts = bankAccountsData?.bankAccounts ?? [];
  const costCenters = costCentersData?.costCenters ?? [];

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Section 1: Identificacao
  const [name, setName] = useState('');
  const [type, setType] = useState<LoanType>('PERSONAL');
  const [contractNumber, setContractNumber] = useState('');

  // Section 2: Valores
  const [interestRate, setInterestRate] = useState(0);
  const [interestType, setInterestType] = useState<'PRICE' | 'SAC'>('PRICE');

  // Section 3: Parcelas
  const [totalInstallments, setTotalInstallments] = useState(0);
  const [installmentDay, setInstallmentDay] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Section 4: Vinculacao
  const [bankAccountId, setBankAccountId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');

  // Section 5: Observacoes
  const [notes, setNotes] = useState('');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (loan) {
      setName(loan.name || '');
      setType(loan.type);
      setContractNumber(loan.contractNumber || '');

      setInterestRate(loan.interestRate || 0);
      const normalizedInterestType =
        loan.interestType === 'SAC' ? 'SAC' : 'PRICE';
      setInterestType(normalizedInterestType);

      setTotalInstallments(loan.totalInstallments || 0);
      setInstallmentDay(loan.installmentDay || 1);
      setStartDate(loan.startDate ? loan.startDate.split('T')[0] : '');
      setEndDate(loan.endDate ? loan.endDate.split('T')[0] : '');

      setBankAccountId(loan.bankAccountId || '');
      setCostCenterId(loan.costCenterId || '');

      setNotes(loan.notes || '');
    }
  }, [loan]);

  // Lock structural fields when there are paid installments
  // (changing them would invalidate the existing amortization schedule)
  const hasPaidInstallments = (loan?.paidInstallments ?? 0) > 0;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('O nome é obrigatório.');
      return;
    }
    if (!bankAccountId) {
      toast.error('A conta bancária é obrigatória.');
      return;
    }
    if (!costCenterId) {
      toast.error('O centro de custo é obrigatório.');
      return;
    }

    try {
      setIsSaving(true);

      await updateMutation.mutateAsync({
        id,
        data: {
          name: name.trim(),
          // Structural fields are blocked when paid installments exist
          ...(hasPaidInstallments
            ? {}
            : {
                type,
                interestRate,
                interestType,
                installmentDay: installmentDay || undefined,
                bankAccountId,
                costCenterId,
              }),
          contractNumber: contractNumber.trim() || undefined,
          endDate: endDate || undefined,
          notes: notes.trim() || undefined,
        },
      });

      toast.success('Empréstimo atualizado com sucesso!');
      router.push(`/finance/loans/${id}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar empréstimo',
        err instanceof Error ? err : undefined
      );
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('name') ||
        msg.includes('Name') ||
        msg.includes('already exists')
      ) {
        setFieldErrors({ name: translateError(msg) });
      } else if (msg.includes('amount') || msg.includes('Amount')) {
        setFieldErrors({ principalAmount: translateError(msg) });
      } else {
        toast.error(translateError(msg));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Empréstimo excluído com sucesso!');
      router.push('/finance/loans');
    } catch (err) {
      logger.error(
        'Erro ao excluir empréstimo',
        err instanceof Error ? err : undefined
      );
      toast.error(translateError(err));
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'cancel',
      title: 'Cancelar',
      onClick: () => router.push(`/finance/loans/${id}`),
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
    { label: 'Empréstimos', href: '/finance/loans' },
    {
      label: loan?.name || '...',
      href: `/finance/loans/${id}`,
    },
    { label: 'Editar' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoadingLoan) {
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

  if (error || !loan) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Empréstimo não encontrado"
            message="O empréstimo solicitado não foi encontrado."
            action={{
              label: 'Voltar para Empréstimos',
              onClick: () => router.push('/finance/loans'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const outstandingBalance = loan.outstandingBalance ?? 0;
  const principalAmount = loan.principalAmount ?? 0;
  const paidInstallments = loan.paidInstallments ?? 0;

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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-violet-600 shadow-lg">
              <Landmark className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando empréstimo
              </p>
              <h1 className="text-xl font-bold truncate">
                {loan.name || 'Sem nome'}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${STATUS_COLORS[loan.status]}`}
              >
                {getStatusLabel(loan.status)}
              </div>
              <div className="rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Tipo</p>
                  <p className="text-[11px] text-muted-foreground">
                    {getTypeLabel(loan.type)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 mb-4">
            <TabsTrigger value="general">Dados Gerais</TabsTrigger>
            <TabsTrigger value="settings">Vinculação</TabsTrigger>
          </TabsList>

          {/* Tab 1: Identificação + Valores + Parcelas */}
          <TabsContent value="general" className="space-y-4">
            {/* Form Card — Section 1: Identificação */}
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-8">
                <div className="space-y-5">
                  <SectionHeader
                    icon={Building2}
                    title="Identificação"
                    subtitle="Dados básicos do empréstimo"
                  />
                  <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 lg:col-span-3 grid gap-2">
                        <Label htmlFor="name">
                          Nome <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Nome do empréstimo"
                          required
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="type">
                          Tipo <span className="text-rose-500">*</span>
                          {hasPaidInstallments && (
                            <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />
                          )}
                        </Label>
                        <Select
                          value={type}
                          onValueChange={(v: string) => setType(v as LoanType)}
                          disabled={hasPaidInstallments}
                        >
                          <SelectTrigger id="type">
                            <SelectValue placeholder="Selecione o tipo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(LOAN_TYPE_LABELS).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2 sm:col-span-2 lg:col-span-1">
                        <Label htmlFor="contractNumber">
                          Número do Contrato
                        </Label>
                        <Input
                          id="contractNumber"
                          value={contractNumber}
                          onChange={e => setContractNumber(e.target.value)}
                          placeholder="Ex: CT-2026-001"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Lock Banner — visible only when paid installments exist */}
            {hasPaidInstallments && (
              <Card className="bg-amber-50 dark:bg-amber-500/8 border-amber-200 dark:border-amber-500/20 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      Campos estruturais bloqueados
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      Este empréstimo já tem {loan?.paidInstallments} parcela(s)
                      paga(s). Tipo, taxa, sistema de amortização, dia de
                      vencimento, conta bancária e centro de custo não podem
                      mais ser alterados — qualquer mudança invalidaria a tabela
                      de amortização e os lançamentos já gerados. Para reajustar
                      essas condições, registre uma renegociação criando um novo
                      empréstimo vinculado.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Form Card — Section 2: Valores */}
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-8">
                <div className="space-y-5">
                  <SectionHeader
                    icon={DollarSign}
                    title="Valores"
                    subtitle="Montantes e taxas do empréstimo"
                  />
                  <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label>Valor Principal (R$)</Label>
                        <Input
                          value={principalAmount.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Definido na criação do empréstimo
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="interestRate">
                          Taxa de Juros (% a.a.)
                          {hasPaidInstallments && (
                            <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />
                          )}
                        </Label>
                        <Input
                          id="interestRate"
                          type="number"
                          step="0.01"
                          min="0"
                          value={interestRate}
                          onChange={e =>
                            setInterestRate(parseFloat(e.target.value) || 0)
                          }
                          placeholder="0,00"
                          disabled={hasPaidInstallments}
                        />
                        <p className="text-xs text-muted-foreground">
                          Equivalente a {(interestRate / 12).toFixed(2)}% a.m.
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="interestType">
                          Sistema de Amortização
                          {hasPaidInstallments && (
                            <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />
                          )}
                        </Label>
                        <Select
                          value={interestType}
                          onValueChange={(v: string) =>
                            setInterestType(v as 'PRICE' | 'SAC')
                          }
                          disabled={hasPaidInstallments}
                        >
                          <SelectTrigger id="interestType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRICE">
                              Tabela Price (Parcela Fixa)
                            </SelectItem>
                            <SelectItem value="SAC">
                              SAC (Amortização Constante)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Saldo Devedor (R$)</Label>
                        <Input
                          value={outstandingBalance.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Calculado automaticamente
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Form Card — Section 3: Parcelas */}
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-8">
                <div className="space-y-5">
                  <SectionHeader
                    icon={Calendar}
                    title="Parcelas"
                    subtitle="Informações de parcelamento e datas"
                  />
                  <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label>
                          Total de Parcelas
                          <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />
                        </Label>
                        <Input
                          value={totalInstallments}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Definido na criação do empréstimo
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label>Parcelas Pagas</Label>
                        <Input
                          value={`${paidInstallments} de ${totalInstallments}`}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Atualizado automaticamente
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="installmentDay">
                          Dia de Vencimento
                          {hasPaidInstallments && (
                            <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />
                          )}
                        </Label>
                        <Input
                          id="installmentDay"
                          type="number"
                          min="1"
                          max="31"
                          value={installmentDay}
                          onChange={e =>
                            setInstallmentDay(parseInt(e.target.value) || 1)
                          }
                          disabled={hasPaidInstallments}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>
                          Data de Início
                          <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />
                        </Label>
                        <Input
                          value={startDate}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Definido na criação do empréstimo
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
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Tab 2: Vinculação + Observações */}
          <TabsContent value="settings" className="space-y-4">
            {/* Form Card — Section 4: Vinculação */}
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-8">
                <div className="space-y-5">
                  <SectionHeader
                    icon={LinkIcon}
                    title="Vinculação"
                    subtitle="Conta bancária e centro de custo vinculados"
                  />
                  <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="bankAccountId">
                          Conta Bancária{' '}
                          <span className="text-rose-500">*</span>
                          {hasPaidInstallments && (
                            <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />
                          )}
                        </Label>
                        <Select
                          value={bankAccountId}
                          onValueChange={setBankAccountId}
                          disabled={hasPaidInstallments}
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
                        <Label htmlFor="costCenterId">
                          Centro de Custo{' '}
                          <span className="text-rose-500">*</span>
                          {hasPaidInstallments && (
                            <Lock className="inline h-3 w-3 ml-1 text-muted-foreground" />
                          )}
                        </Label>
                        <Select
                          value={costCenterId}
                          onValueChange={setCostCenterId}
                          disabled={hasPaidInstallments}
                        >
                          <SelectTrigger id="costCenterId">
                            <SelectValue placeholder="Selecione um centro de custo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {costCenters.map(cc => (
                              <SelectItem key={cc.id} value={cc.id}>
                                {cc.code ? `${cc.code} - ` : ''}
                                {cc.name}
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

            {/* Form Card — Section 5: Observações */}
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
                        placeholder="Observações sobre este empréstimo..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Empréstimo"
        description={`Digite seu PIN de ação para excluir o empréstimo "${loan.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
