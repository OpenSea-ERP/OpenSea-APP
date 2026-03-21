/**
 * OpenSea OS - Edit Payable Entry Page
 * Follows the standard edit page pattern: PageLayout > PageHeader > PageBody
 * with Identity Card + Form Card with CollapsibleSections.
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  useBankAccounts,
  useCostCenters,
  useDeleteFinanceEntry,
  useFinanceCategories,
  useFinanceEntry,
  useUpdateFinanceEntry,
} from '@/hooks/finance';
import { logger } from '@/lib/logger';
import type {
  CostCenterAllocation,
  FinanceEntryStatus,
} from '@/types/finance';
import { FINANCE_ENTRY_STATUS_LABELS } from '@/types/finance';
import {
  ArrowDownCircle,
  DollarSign,
  FileText,
  Landmark,
  Loader2,
  NotebookText,
  Plus,
  Save,
  Target,
  Trash2,
  X,
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
// STATUS LABEL HELPER
// =============================================================================

function getStatusLabel(status: FinanceEntryStatus): string {
  return FINANCE_ENTRY_STATUS_LABELS[status] ?? status;
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditPayablePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data,
    isLoading: isLoadingEntry,
    error,
  } = useFinanceEntry(id);
  const entry = data?.entry;

  const updateMutation = useUpdateFinanceEntry();
  const deleteMutation = useDeleteFinanceEntry();

  const { data: categoriesData } = useFinanceCategories({ type: 'EXPENSE' });
  const { data: costCentersData } = useCostCenters();
  const { data: bankAccountsData } = useBankAccounts();

  const categories = categoriesData?.categories ?? [];
  const costCenters = costCentersData?.costCenters ?? [];
  const bankAccounts = bankAccountsData?.bankAccounts ?? [];

  // Filter categories: EXPENSE or BOTH
  const filteredCategories = categories.filter(
    c => c.type === 'EXPENSE' || c.type === 'BOTH'
  );

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Section 1: Identificacao
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [tags, setTags] = useState('');

  // Section 2: Valores
  const [expectedAmount, setExpectedAmount] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [competenceDate, setCompetenceDate] = useState('');
  const [discount, setDiscount] = useState(0);
  const [interest, setInterest] = useState(0);
  const [penalty, setPenalty] = useState(0);

  // Section 3: Rateio
  const [useAllocations, setUseAllocations] = useState(false);
  const [costCenterId, setCostCenterId] = useState('');
  const [allocations, setAllocations] = useState<CostCenterAllocation[]>([]);

  // Section 4: Conta Bancaria
  const [bankAccountId, setBankAccountId] = useState('');

  // Section 5: Observacoes
  const [notes, setNotes] = useState('');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (entry) {
      setDescription(entry.description || '');
      setCategoryId(entry.categoryId || '');
      setSupplierName(entry.supplierName || '');
      setTags((entry.tags || []).join(', '));

      setExpectedAmount(entry.expectedAmount || 0);
      setDueDate(entry.dueDate ? entry.dueDate.split('T')[0] : '');
      setIssueDate(entry.issueDate ? entry.issueDate.split('T')[0] : '');
      setCompetenceDate(
        entry.competenceDate ? entry.competenceDate.split('T')[0] : ''
      );
      setDiscount(entry.discount || 0);
      setInterest(entry.interest || 0);
      setPenalty(entry.penalty || 0);

      // Rateio: check if allocations exist
      const hasAllocations =
        entry.costCenterAllocations && entry.costCenterAllocations.length > 0;
      setUseAllocations(!!hasAllocations);

      if (hasAllocations) {
        setAllocations(
          entry.costCenterAllocations!.map(a => ({
            costCenterId: a.costCenterId,
            percentage: a.percentage,
          }))
        );
        setCostCenterId('');
      } else {
        setCostCenterId(entry.costCenterId || '');
        setAllocations([]);
      }

      setBankAccountId(entry.bankAccountId || '');
      setNotes(entry.notes || '');
    }
  }, [entry]);

  // ============================================================================
  // ALLOCATION HANDLERS
  // ============================================================================

  const addAllocation = () => {
    setAllocations(prev => [...prev, { costCenterId: '', percentage: 0 }]);
  };

  const removeAllocation = (index: number) => {
    setAllocations(prev => prev.filter((_, i) => i !== index));
  };

  const updateAllocation = (
    index: number,
    field: 'costCenterId' | 'percentage',
    value: string | number
  ) => {
    setAllocations(prev =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  };

  const allocationTotal = allocations.reduce(
    (sum, a) => sum + (a.percentage || 0),
    0
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('A descrição é obrigatória.');
      return;
    }
    if (!categoryId) {
      toast.error('A categoria é obrigatória.');
      return;
    }
    if (!expectedAmount || expectedAmount <= 0) {
      toast.error('O valor esperado deve ser maior que zero.');
      return;
    }
    if (!dueDate) {
      toast.error('A data de vencimento é obrigatória.');
      return;
    }

    // Validate allocations if using them
    if (useAllocations) {
      if (allocations.length === 0) {
        toast.error('Adicione ao menos um centro de custo ao rateio.');
        return;
      }
      const total = allocations.reduce((sum, a) => sum + (a.percentage || 0), 0);
      if (Math.abs(total - 100) > 0.01) {
        toast.error('A soma dos percentuais do rateio deve ser 100%.');
        return;
      }
      const hasEmpty = allocations.some(a => !a.costCenterId);
      if (hasEmpty) {
        toast.error('Selecione o centro de custo em todas as linhas do rateio.');
        return;
      }
    } else {
      if (!costCenterId) {
        toast.error('O centro de custo é obrigatório.');
        return;
      }
    }

    try {
      setIsSaving(true);

      const parsedTags = tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await updateMutation.mutateAsync({
        id,
        data: {
          description: description.trim(),
          categoryId,
          costCenterId: useAllocations ? undefined : costCenterId || undefined,
          costCenterAllocations: useAllocations ? allocations : undefined,
          bankAccountId: bankAccountId || undefined,
          expectedAmount,
          discount,
          interest,
          penalty,
          issueDate: issueDate || undefined,
          dueDate,
          competenceDate: competenceDate || undefined,
          supplierName: supplierName.trim() || undefined,
          notes: notes.trim() || undefined,
          tags: parsedTags.length > 0 ? parsedTags : undefined,
        },
      });

      toast.success('Lançamento atualizado com sucesso!');
      router.push(`/finance/payable/${id}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar lançamento',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar lançamento', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Conta a pagar excluída com sucesso!');
      router.push('/finance/payable');
    } catch (err) {
      logger.error(
        'Erro ao excluir conta a pagar',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir conta a pagar', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'cancel',
      title: 'Cancelar',
      onClick: () => router.push(`/finance/payable/${id}`),
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
    { label: 'Contas a Pagar', href: '/finance/payable' },
    {
      label: entry?.description || '...',
      href: `/finance/payable/${id}`,
    },
    { label: 'Editar' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoadingEntry) {
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

  if (error || !entry) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Lançamento não encontrado"
            message="O lançamento solicitado não foi encontrado."
            action={{
              label: 'Voltar para Contas a Pagar',
              onClick: () => router.push('/finance/payable'),
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-rose-500 to-rose-600 shadow-lg">
              <ArrowDownCircle className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando lançamento
              </p>
              <h1 className="text-xl font-bold truncate">
                {entry.description || 'Sem descrição'}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0 rounded-lg bg-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-xs font-semibold">Status</p>
                <p className="text-[11px] text-muted-foreground">
                  {getStatusLabel(entry.status)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card — Section 1: Identificação */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={FileText}
                title="Identificação"
                subtitle="Dados básicos do lançamento"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 lg:col-span-3 grid gap-2">
                    <Label htmlFor="description">
                      Descrição <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Descrição do lançamento"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="categoryId">
                      Categoria <span className="text-rose-500">*</span>
                    </Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger id="categoryId">
                        <SelectValue placeholder="Selecione uma categoria..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supplierName">Fornecedor</Label>
                    <Input
                      id="supplierName"
                      value={supplierName}
                      onChange={e => setSupplierName(e.target.value)}
                      placeholder="Nome do fornecedor"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={e => setTags(e.target.value)}
                      placeholder="Ex: urgente, mensal, aluguel"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separe por vírgulas
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card — Section 2: Valores */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={DollarSign}
                title="Valores"
                subtitle="Montantes e datas do lançamento"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="expectedAmount">
                      Valor Esperado (R$){' '}
                      <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="expectedAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={expectedAmount}
                      onChange={e =>
                        setExpectedAmount(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0,00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">
                      Data de Vencimento{' '}
                      <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="issueDate">Data de Emissão</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="competenceDate">Data de Competência</Label>
                    <Input
                      id="competenceDate"
                      type="date"
                      value={competenceDate}
                      onChange={e => setCompetenceDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="discount">Desconto (R$)</Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={discount}
                      onChange={e =>
                        setDiscount(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0,00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="interest">Juros (R$)</Label>
                    <Input
                      id="interest"
                      type="number"
                      step="0.01"
                      min="0"
                      value={interest}
                      onChange={e =>
                        setInterest(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0,00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="penalty">Multa (R$)</Label>
                    <Input
                      id="penalty"
                      type="number"
                      step="0.01"
                      min="0"
                      value={penalty}
                      onChange={e =>
                        setPenalty(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card — Section 3: Rateio */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Target}
                title="Centro de Custo"
                subtitle="Defina o centro de custo ou configure o rateio"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                {/* Toggle: simple vs allocation mode */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-white dark:bg-slate-800/60">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Modo Rateio
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {useAllocations
                        ? 'Distribuir entre múltiplos centros de custo'
                        : 'Centro de custo único'}
                    </p>
                  </div>
                  <Switch
                    checked={useAllocations}
                    onCheckedChange={checked => {
                      setUseAllocations(checked);
                      if (!checked) {
                        setAllocations([]);
                      } else {
                        setCostCenterId('');
                      }
                    }}
                  />
                </div>

                {/* Simple mode: single cost center */}
                {!useAllocations && (
                  <div className="grid gap-2">
                    <Label htmlFor="costCenterId">
                      Centro de Custo{' '}
                      <span className="text-rose-500">*</span>
                    </Label>
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
                            {cc.code} - {cc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Allocation mode: multiple cost centers with percentages */}
                {useAllocations && (
                  <div className="space-y-3">
                    {allocations.length > 0 && (
                      <Table aria-label="Tabela de rateio de centros de custo">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Centro de Custo</TableHead>
                            <TableHead className="w-[140px]">
                              Percentual (%)
                            </TableHead>
                            <TableHead className="w-[50px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allocations.map((alloc, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Select
                                  value={alloc.costCenterId}
                                  onValueChange={value =>
                                    updateAllocation(
                                      index,
                                      'costCenterId',
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {costCenters.map(cc => (
                                      <SelectItem key={cc.id} value={cc.id}>
                                        {cc.code} - {cc.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  value={alloc.percentage}
                                  onChange={e =>
                                    updateAllocation(
                                      index,
                                      'percentage',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full"
                                />
                              </TableCell>
                              <TableCell>
                                <button
                                  type="button"
                                  onClick={() => removeAllocation(index)}
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    {/* Total + Add button */}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={addAllocation}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar centro de custo
                      </button>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total: </span>
                        <span
                          className={
                            Math.abs(allocationTotal - 100) < 0.01
                              ? 'font-semibold text-emerald-600'
                              : 'font-semibold text-rose-600'
                          }
                        >
                          {allocationTotal.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card — Section 4: Conta Bancária */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Landmark}
                title="Conta Bancária"
                subtitle="Conta vinculada ao pagamento"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
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
                    placeholder="Observações sobre este lançamento..."
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
        title="Excluir Conta a Pagar"
        description={`Digite seu PIN de ação para excluir o lançamento "${entry.description}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
