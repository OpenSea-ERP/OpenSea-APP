/**
 * OpenSea OS - Edit Consortium Page
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
  useConsortium,
  useCostCenters,
  useDeleteConsortium,
  useUpdateConsortium,
} from '@/hooks/finance';
import { logger } from '@/lib/logger';
import { CONSORTIUM_STATUS_LABELS } from '@/types/finance';
import {
  DollarSign,
  FileText,
  Landmark,
  Loader2,
  NotebookText,
  Save,
  Trash2,
  Users,
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

export default function EditConsortiumPage({
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
    isLoading: isLoadingConsortium,
    error,
  } = useConsortium(id);
  const consortium = data?.consortium;

  const updateMutation = useUpdateConsortium();
  const deleteMutation = useDeleteConsortium();

  const { data: bankAccountsData } = useBankAccounts();
  const { data: costCentersData } = useCostCenters();

  const bankAccounts = bankAccountsData?.bankAccounts ?? [];
  const costCenters = costCentersData?.costCenters ?? [];

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Section 1: Dados Basicos
  const [name, setName] = useState('');
  const [administrator, setAdministrator] = useState('');
  const [groupNumber, setGroupNumber] = useState('');
  const [quotaNumber, setQuotaNumber] = useState('');
  const [contractNumber, setContractNumber] = useState('');

  // Section 2: Valores
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalInstallments, setTotalInstallments] = useState(0);
  const [paymentDay, setPaymentDay] = useState<number | undefined>(undefined);

  // Section 3: Vinculacao
  const [bankAccountId, setBankAccountId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');

  // Section 4: Observacoes
  const [notes, setNotes] = useState('');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (consortium) {
      setName(consortium.name || '');
      setAdministrator(consortium.administrator || '');
      setGroupNumber(consortium.groupNumber || '');
      setQuotaNumber(consortium.quotaNumber || '');
      setContractNumber(consortium.contractNumber || '');
      setMonthlyPayment(consortium.monthlyPayment || 0);
      setTotalInstallments(consortium.totalInstallments || 0);
      setPaymentDay(consortium.paymentDay ?? undefined);
      setBankAccountId(consortium.bankAccountId || '');
      setCostCenterId(consortium.costCenterId || '');
      setNotes(consortium.notes || '');
    }
  }, [consortium]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('O nome é obrigatório.');
      return;
    }
    if (!administrator.trim()) {
      toast.error('A administradora é obrigatória.');
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
          administrator: administrator.trim(),
          groupNumber: groupNumber.trim() || undefined,
          quotaNumber: quotaNumber.trim() || undefined,
          contractNumber: contractNumber.trim() || undefined,
          monthlyPayment: monthlyPayment || undefined,
          totalInstallments: totalInstallments || undefined,
          paymentDay: paymentDay || undefined,
          bankAccountId,
          costCenterId,
          notes: notes.trim() || undefined,
        },
      });

      toast.success('Consórcio atualizado com sucesso!');
      router.push(`/finance/consortia/${id}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar consórcio',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar consórcio', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Consórcio excluído com sucesso!');
      router.push('/finance/consortia');
    } catch (err) {
      logger.error(
        'Erro ao excluir consórcio',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir consórcio', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'cancel',
      title: 'Cancelar',
      onClick: () => router.push(`/finance/consortia/${id}`),
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
    { label: 'Consórcios', href: '/finance/consortia' },
    {
      label: consortium?.name || '...',
      href: `/finance/consortia/${id}`,
    },
    { label: 'Editar' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoadingConsortium) {
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

  if (error || !consortium) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Consórcio não encontrado"
            message="O consórcio solicitado não foi encontrado."
            action={{
              label: 'Voltar para Consórcios',
              onClick: () => router.push('/finance/consortia'),
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-pink-600 shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando consórcio
              </p>
              <h1 className="text-xl font-bold truncate">
                {consortium.name || 'Sem nome'}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0 rounded-lg bg-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-xs font-semibold">Status</p>
                <p className="text-[11px] text-muted-foreground">
                  {CONSORTIUM_STATUS_LABELS[consortium.status]}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card — Section 1: Dados Basicos */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={FileText}
                title="Dados Básicos"
                subtitle="Informações principais do consórcio"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 grid gap-2">
                    <Label htmlFor="name">
                      Nome / Descrição <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ex: Consórcio Imóvel Residencial"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="administrator">
                      Administradora <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="administrator"
                      value={administrator}
                      onChange={e => setAdministrator(e.target.value)}
                      placeholder="Ex: Porto Seguro, Embracon..."
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contractNumber">Número do Contrato</Label>
                    <Input
                      id="contractNumber"
                      value={contractNumber}
                      onChange={e => setContractNumber(e.target.value)}
                      placeholder="Ex: CTR-2026-001"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="groupNumber">Grupo</Label>
                    <Input
                      id="groupNumber"
                      value={groupNumber}
                      onChange={e => setGroupNumber(e.target.value)}
                      placeholder="Ex: 0123"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="quotaNumber">Cota</Label>
                    <Input
                      id="quotaNumber"
                      value={quotaNumber}
                      onChange={e => setQuotaNumber(e.target.value)}
                      placeholder="Ex: 045"
                    />
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
                subtitle="Parcelas e vencimento"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="monthlyPayment">Parcela Mensal (R$)</Label>
                    <Input
                      id="monthlyPayment"
                      type="number"
                      step="0.01"
                      min="0"
                      value={monthlyPayment}
                      onChange={e =>
                        setMonthlyPayment(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0,00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="totalInstallments">
                      Total de Parcelas
                    </Label>
                    <Input
                      id="totalInstallments"
                      type="number"
                      min="1"
                      value={totalInstallments}
                      onChange={e =>
                        setTotalInstallments(parseInt(e.target.value) || 0)
                      }
                      placeholder="Ex: 120"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="paymentDay">Dia de Vencimento</Label>
                    <Input
                      id="paymentDay"
                      type="number"
                      min="1"
                      max="31"
                      value={paymentDay ?? ''}
                      onChange={e =>
                        setPaymentDay(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="Ex: 15"
                    />
                    <p className="text-xs text-muted-foreground">
                      Dia do mês (1-31)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card — Section 3: Vinculacao */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Landmark}
                title="Vinculação"
                subtitle="Conta bancária e centro de custo"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bankAccountId">
                      Conta Bancária <span className="text-rose-500">*</span>
                    </Label>
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
                    <Label htmlFor="costCenterId">
                      Centro de Custo <span className="text-rose-500">*</span>
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

        {/* Form Card — Section 4: Observacoes */}
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
                    placeholder="Informações adicionais sobre o consórcio..."
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
        title="Excluir Consórcio"
        description={`Digite seu PIN de ação para excluir o consórcio "${consortium.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
