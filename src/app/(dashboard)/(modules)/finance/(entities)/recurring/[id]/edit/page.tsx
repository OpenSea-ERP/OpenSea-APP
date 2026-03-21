/**
 * OpenSea OS - Edit Recurring Page
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
  useRecurringConfig,
  useUpdateRecurringConfig,
  useCancelRecurring,
} from '@/hooks/finance';
import { logger } from '@/lib/logger';
import type { RecurrenceUnit } from '@/types/finance';
import {
  RECURRING_STATUS_LABELS,
  FREQUENCY_LABELS,
  FINANCE_ENTRY_TYPE_LABELS,
} from '@/types/finance';
import {
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  NotebookText,
  RefreshCw,
  Save,
  Settings,
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
// FREQUENCY OPTIONS
// =============================================================================

const FREQUENCY_OPTIONS: { value: RecurrenceUnit; label: string }[] = [
  { value: 'DAILY', label: 'Diário' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'BIWEEKLY', label: 'Quinzenal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'SEMIANNUAL', label: 'Semestral' },
  { value: 'ANNUAL', label: 'Anual' },
];

// =============================================================================
// PAGE
// =============================================================================

export default function EditRecurringPage({
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
    isLoading: isLoadingConfig,
    error,
  } = useRecurringConfig(id);
  const config = data?.config;

  const updateMutation = useUpdateRecurringConfig();
  const cancelMutation = useCancelRecurring();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Section 1: Dados Basicos
  const [description, setDescription] = useState('');
  const [expectedAmount, setExpectedAmount] = useState(0);
  const [frequencyUnit, setFrequencyUnit] = useState<RecurrenceUnit>('MONTHLY');
  const [frequencyInterval, setFrequencyInterval] = useState(1);

  // Section 2: Periodo
  const [endDate, setEndDate] = useState('');

  // Section 3: Taxas
  const [interestRate, setInterestRate] = useState<number | undefined>(undefined);
  const [penaltyRate, setPenaltyRate] = useState<number | undefined>(undefined);

  // Section 4: Observacoes
  const [notes, setNotes] = useState('');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (config) {
      setDescription(config.description || '');
      setExpectedAmount(config.expectedAmount || 0);
      setFrequencyUnit(config.frequencyUnit || 'MONTHLY');
      setFrequencyInterval(config.frequencyInterval || 1);
      setEndDate(config.endDate ? config.endDate.split('T')[0] : '');
      setInterestRate(config.interestRate ?? undefined);
      setPenaltyRate(config.penaltyRate ?? undefined);
      setNotes(config.notes || '');
    }
  }, [config]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('A descrição é obrigatória.');
      return;
    }
    if (expectedAmount <= 0) {
      toast.error('O valor base deve ser maior que zero.');
      return;
    }

    try {
      setIsSaving(true);

      await updateMutation.mutateAsync({
        id,
        data: {
          description: description.trim(),
          expectedAmount,
          frequencyUnit,
          frequencyInterval,
          endDate: endDate || null,
          interestRate: interestRate ?? null,
          penaltyRate: penaltyRate ?? null,
          notes: notes.trim() || null,
        },
      });

      toast.success('Recorrência atualizada com sucesso!');
      router.push(`/finance/recurring/${id}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar recorrência',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar recorrência', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await cancelMutation.mutateAsync(id);
      toast.success('Recorrência excluída com sucesso!');
      router.push('/finance/recurring');
    } catch (err) {
      logger.error(
        'Erro ao excluir recorrência',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir recorrência', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'cancel',
      title: 'Cancelar',
      onClick: () => router.push(`/finance/recurring/${id}`),
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
    { label: 'Recorrências', href: '/finance/recurring' },
    {
      label: config?.description || '...',
      href: `/finance/recurring/${id}`,
    },
    { label: 'Editar' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoadingConfig) {
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

  if (error || !config) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Recorrência não encontrada"
            message="A recorrência solicitada não foi encontrada."
            action={{
              label: 'Voltar para Recorrências',
              onClick: () => router.push('/finance/recurring'),
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-violet-600 shadow-lg">
              <RefreshCw className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando recorrência
              </p>
              <h1 className="text-xl font-bold truncate">
                {config.description || 'Sem descrição'}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0 rounded-lg bg-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-xs font-semibold">Status</p>
                <p className="text-[11px] text-muted-foreground">
                  {RECURRING_STATUS_LABELS[config.status]}
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="text-xs font-semibold">Tipo</p>
                <p className="text-[11px] text-muted-foreground">
                  {FINANCE_ENTRY_TYPE_LABELS[config.type]}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card -- Section 1: Dados Basicos */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={FileText}
                title="Dados Básicos"
                subtitle="Informações principais da recorrência"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 grid gap-2">
                    <Label htmlFor="description">
                      Descrição <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Ex: Aluguel mensal"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="expectedAmount">
                      Valor Base (R$) <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="expectedAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={expectedAmount}
                      onChange={e =>
                        setExpectedAmount(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0,00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="frequencyUnit">Frequência</Label>
                    <Select
                      value={frequencyUnit}
                      onValueChange={v => setFrequencyUnit(v as RecurrenceUnit)}
                    >
                      <SelectTrigger id="frequencyUnit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="frequencyInterval">Intervalo</Label>
                    <Input
                      id="frequencyInterval"
                      type="number"
                      min="1"
                      value={frequencyInterval}
                      onChange={e =>
                        setFrequencyInterval(parseInt(e.target.value) || 1)
                      }
                      placeholder="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ex: 2 para a cada 2 meses
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card -- Section 2: Periodo */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Calendar}
                title="Período"
                subtitle="Data de término da recorrência"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={config.startDate ? config.startDate.split('T')[0] : ''}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      A data de início não pode ser alterada
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
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco para sem data de término
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card -- Section 3: Configuracao */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Settings}
                title="Configuração"
                subtitle="Taxas de juros e multa"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="interestRate">Taxa de Juros (%)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={interestRate ?? ''}
                      onChange={e =>
                        setInterestRate(
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="0,00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="penaltyRate">Taxa de Multa (%)</Label>
                    <Input
                      id="penaltyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={penaltyRate ?? ''}
                      onChange={e =>
                        setPenaltyRate(
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card -- Section 4: Observacoes */}
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
                    placeholder="Informações adicionais sobre a recorrência..."
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
        title="Excluir Recorrência"
        description={`Digite seu PIN de ação para excluir a recorrência "${config.description}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
