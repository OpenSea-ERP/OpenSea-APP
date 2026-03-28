/**
 * OpenSea OS - Termination Edit Page
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
import { Badge } from '@/components/ui/badge';
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
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { translateError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { Termination, TerminationType, NoticeType } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  NotebookText,
  Save,
  Shield,
  Trash2,
  UserMinus,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  terminationsApi,
  terminationKeys,
  useUpdateTermination,
  useDeleteTermination,
  getTerminationTypeLabel,
  getTerminationStatusLabel,
  getTerminationStatusVariant,
  TERMINATION_TYPE_LABELS,
  NOTICE_TYPE_LABELS,
} from '../../src';

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

export default function TerminationEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const terminationId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: termination,
    isLoading,
    error,
  } = useQuery<Termination>({
    queryKey: terminationKeys.detail(terminationId),
    queryFn: () => terminationsApi.get(terminationId),
  });

  const { getName } = useEmployeeMap(
    termination ? [termination.employeeId] : []
  );

  const employeeName = termination
    ? getName(termination.employeeId)
    : '...';

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdateTermination();
  const deleteMutation = useDeleteTermination({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminationKeys.lists() });
      router.push('/hr/terminations');
    },
  });

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Section 1: Dados da Rescisao
  const [terminationType, setTerminationType] = useState<TerminationType>('SEM_JUSTA_CAUSA');
  const [terminationDate, setTerminationDate] = useState('');
  const [reason, setReason] = useState('');
  const [lastWorkDay, setLastWorkDay] = useState('');

  // Section 2: Aviso Previo
  const [noticePeriod, setNoticePeriod] = useState(false);
  const [noticeType, setNoticeType] = useState<NoticeType>('TRABALHADO');
  const [noticeDays, setNoticeDays] = useState(0);
  const [noticePeriodStartDate, setNoticePeriodStartDate] = useState('');
  const [noticePeriodEndDate, setNoticePeriodEndDate] = useState('');

  // Section 3: Valores
  const [severanceAmount, setSeveranceAmount] = useState(0);
  const [fgtsAmount, setFgtsAmount] = useState(0);

  // Section 4: Observacoes
  const [notes, setNotes] = useState('');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (termination) {
      setTerminationType(termination.type);
      setTerminationDate(
        termination.terminationDate
          ? termination.terminationDate.split('T')[0]
          : ''
      );
      setReason(termination.notes || '');
      setLastWorkDay(
        termination.lastWorkDay
          ? termination.lastWorkDay.split('T')[0]
          : ''
      );

      // Notice period
      const hasNotice =
        termination.noticeType === 'TRABALHADO' ||
        termination.noticeType === 'INDENIZADO';
      setNoticePeriod(hasNotice);
      setNoticeType(termination.noticeType);
      setNoticeDays(termination.noticeDays || 0);

      // Calculate notice dates from termination data
      if (hasNotice && termination.terminationDate) {
        const startDate = new Date(termination.terminationDate);
        setNoticePeriodStartDate(startDate.toISOString().split('T')[0]);
        if (termination.noticeDays) {
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + termination.noticeDays);
          setNoticePeriodEndDate(endDate.toISOString().split('T')[0]);
        }
      }

      // Valores
      setSeveranceAmount(termination.totalLiquido || 0);
      setFgtsAmount(termination.multaFgts || 0);

      setNotes(termination.notes || '');
    }
  }, [termination]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!terminationDate) {
      toast.error('A data de rescisão é obrigatória.');
      return;
    }
    if (!lastWorkDay) {
      toast.error('O último dia de trabalho é obrigatório.');
      return;
    }

    try {
      setIsSaving(true);

      await updateMutation.mutateAsync({
        id: terminationId,
        data: {
          type: terminationType,
          terminationDate,
          lastWorkDay,
          noticeType: noticePeriod ? noticeType : 'DISPENSADO',
          noticeDays: noticePeriod ? noticeDays : 0,
          notes: notes.trim() || undefined,
        },
      });

      toast.success('Rescisão atualizada com sucesso!');
      router.push(`/hr/terminations/${terminationId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar rescisão',
        err instanceof Error ? err : undefined
      );
      toast.error(translateError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(terminationId);
    } catch (err) {
      logger.error(
        'Erro ao excluir rescisão',
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
      onClick: () => router.push(`/hr/terminations/${terminationId}`),
      variant: 'ghost',
    },
    {
      id: 'delete',
      title: 'Excluir',
      icon: Trash2,
      onClick: () => setDeleteModalOpen(true),
      variant: 'default',
      className:
        'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-slate-800 dark:text-white dark:hover:bg-rose-600',
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
    { label: 'RH', href: '/hr' },
    { label: 'Rescisões', href: '/hr/terminations' },
    {
      label: employeeName || '...',
      href: `/hr/terminations/${terminationId}`,
    },
    { label: 'Editar' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

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

  if (error || !termination) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Rescisão não encontrada"
            message="A rescisão solicitada não foi encontrada."
            action={{
              label: 'Voltar para Rescisões',
              onClick: () => router.push('/hr/terminations'),
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
              <UserMinus className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando rescisão
              </p>
              <h1 className="text-xl font-bold truncate">
                {employeeName || 'Colaborador'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Rescisão em{' '}
                {termination.terminationDate
                  ? new Date(termination.terminationDate).toLocaleDateString(
                      'pt-BR'
                    )
                  : '-'}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <Badge variant={getTerminationStatusVariant(termination.status)}>
                {getTerminationStatusLabel(termination.status)}
              </Badge>
              <Badge variant="outline">
                {getTerminationTypeLabel(termination.type)}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Form Card - Section 1: Dados da Rescisao */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={FileText}
                title="Dados da Rescisão"
                subtitle="Informações principais da rescisão contratual"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="terminationType">
                      Tipo de Rescisão <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={terminationType}
                      onValueChange={v => setTerminationType(v as TerminationType)}
                    >
                      <SelectTrigger id="terminationType">
                        <SelectValue placeholder="Selecione o tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TERMINATION_TYPE_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="terminationDate">
                      Data da Rescisão <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="terminationDate"
                      type="date"
                      value={terminationDate}
                      onChange={e => setTerminationDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reason">Motivo</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Descreva o motivo da rescisão..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lastWorkDay">
                      Último Dia de Trabalho{' '}
                      <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="lastWorkDay"
                      type="date"
                      value={lastWorkDay}
                      onChange={e => setLastWorkDay(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card - Section 2: Aviso Previo */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Shield}
                title="Aviso Prévio"
                subtitle="Configuração do aviso prévio"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                {/* Toggle: notice period */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-white dark:bg-slate-800/60">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Aviso Prévio Concedido
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {noticePeriod
                        ? 'O aviso prévio foi concedido'
                        : 'Aviso prévio dispensado'}
                    </p>
                  </div>
                  <Switch
                    checked={noticePeriod}
                    onCheckedChange={checked => {
                      setNoticePeriod(checked);
                      if (!checked) {
                        setNoticeType('DISPENSADO');
                        setNoticeDays(0);
                        setNoticePeriodStartDate('');
                        setNoticePeriodEndDate('');
                      } else {
                        setNoticeType('TRABALHADO');
                      }
                    }}
                  />
                </div>

                {/* Conditional fields */}
                {noticePeriod && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="noticeType">Tipo de Aviso</Label>
                        <Select
                          value={noticeType}
                          onValueChange={v =>
                            setNoticeType(v as NoticeType)
                          }
                        >
                          <SelectTrigger id="noticeType">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(NOTICE_TYPE_LABELS)
                              .filter(([key]) => key !== 'DISPENSADO')
                              .map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="noticeDays">Dias de Aviso</Label>
                        <Input
                          id="noticeDays"
                          type="number"
                          min="0"
                          max="90"
                          value={noticeDays}
                          onChange={e =>
                            setNoticeDays(parseInt(e.target.value) || 0)
                          }
                          placeholder="30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="noticePeriodStartDate">
                          Início do Aviso Prévio
                        </Label>
                        <Input
                          id="noticePeriodStartDate"
                          type="date"
                          value={noticePeriodStartDate}
                          onChange={e =>
                            setNoticePeriodStartDate(e.target.value)
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="noticePeriodEndDate">
                          Fim do Aviso Prévio
                        </Label>
                        <Input
                          id="noticePeriodEndDate"
                          type="date"
                          value={noticePeriodEndDate}
                          onChange={e =>
                            setNoticePeriodEndDate(e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card - Section 3: Valores */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={DollarSign}
                title="Valores"
                subtitle="Verbas rescisórias e FGTS"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="severanceAmount">
                      Valor da Rescisão (R$)
                    </Label>
                    <Input
                      id="severanceAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={severanceAmount}
                      onChange={e =>
                        setSeveranceAmount(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0,00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Total líquido das verbas rescisórias
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="fgtsAmount">Multa FGTS (R$)</Label>
                    <Input
                      id="fgtsAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={fgtsAmount}
                      onChange={e =>
                        setFgtsAmount(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0,00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Multa de 40% sobre o saldo do FGTS
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card - Section 4: Observacoes */}
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
                    placeholder="Observações sobre esta rescisão..."
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
        title="Excluir Rescisão"
        description={`Digite seu PIN de ação para excluir a rescisão de "${employeeName}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
