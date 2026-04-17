'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { okrsService } from '@/services/hr/okrs.service';
import type {
  ObjectiveLevel,
  ObjectiveStatus,
  KeyResultType,
} from '@/types/hr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Loader2,
  Plus,
  Save,
  Target,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { okrKeys, useCreateKeyResult } from '../../src/api';
import {
  getObjectiveLevelLabel,
  getObjectiveLevelBadgeClass,
  getObjectiveStatusBadgeClass,
  getObjectiveStatusLabel,
  getKeyResultTypeLabel,
} from '../../src/utils';
import { HR_PERMISSIONS } from '../../../../_shared/constants/hr-permissions';

// ============================================================================
// OPTIONS
// ============================================================================

const LEVEL_OPTIONS: { value: ObjectiveLevel; label: string }[] = [
  { value: 'COMPANY', label: 'Empresa' },
  { value: 'DEPARTMENT', label: 'Departamento' },
  { value: 'TEAM', label: 'Equipe' },
  { value: 'INDIVIDUAL', label: 'Individual' },
];

const STATUS_OPTIONS: { value: ObjectiveStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const PERIOD_OPTIONS = [
  { value: 'Q1_2026', label: '1T 2026' },
  { value: 'Q2_2026', label: '2T 2026' },
  { value: 'Q3_2026', label: '3T 2026' },
  { value: 'Q4_2026', label: '4T 2026' },
  { value: 'Q1_2027', label: '1T 2027' },
  { value: 'Q2_2027', label: '2T 2027' },
];

const KR_TYPE_OPTIONS: { value: KeyResultType; label: string }[] = [
  { value: 'NUMERIC', label: 'Numérico' },
  { value: 'PERCENTAGE', label: 'Percentual' },
  { value: 'CURRENCY', label: 'Monetário' },
  { value: 'BINARY', label: 'Binário (Sim/Não)' },
];

import { CollapsibleSection } from '@/components/hr/collapsible-section';

// ============================================================================
// PAGE
// ============================================================================

export default function OKREditPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const objectiveId = params.id as string;

  const canDelete = hasPermission(HR_PERMISSIONS.OKRS.DELETE);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    data: objectiveData,
    isLoading,
    error,
  } = useQuery({
    queryKey: okrKeys.detail(objectiveId),
    queryFn: async () => {
      const response = await okrsService.getObjective(objectiveId);
      return response.objective;
    },
    enabled: !!objectiveId,
  });

  const objective = objectiveData;

  // ============================================================================
  // FORM STATE
  // ============================================================================

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<ObjectiveLevel>('COMPANY');
  const [status, setStatus] = useState<ObjectiveStatus>('DRAFT');
  const [period, setPeriod] = useState('Q2_2026');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Add KR form state
  const [showAddKr, setShowAddKr] = useState(false);
  const [krTitle, setKrTitle] = useState('');
  const [krType, setKrType] = useState<KeyResultType>('NUMERIC');
  const [krTarget, setKrTarget] = useState('');
  const [krUnit, setKrUnit] = useState('');
  const [krWeight, setKrWeight] = useState('1');

  useEffect(() => {
    if (objective) {
      setTitle(objective.title);
      setDescription(objective.description ?? '');
      setLevel(objective.level);
      setStatus(objective.status);
      setPeriod(objective.period);
      setStartDate(objective.startDate ? objective.startDate.slice(0, 10) : '');
      setEndDate(objective.endDate ? objective.endDate.slice(0, 10) : '');
    }
  }, [objective]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      okrsService.updateObjective(objectiveId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: okrKeys.all });
      toast.success('Objetivo atualizado com sucesso');
      router.push(`/hr/okrs/${objectiveId}`);
    },
    onError: () => {
      toast.error('Erro ao atualizar objetivo');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => okrsService.deleteObjective(objectiveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: okrKeys.all });
      toast.success('Objetivo excluído com sucesso');
      router.push('/hr/okrs');
    },
    onError: () => {
      toast.error('Erro ao excluir objetivo');
    },
  });

  const createKrMutation = useCreateKeyResult();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSave = useCallback(() => {
    if (!title.trim()) {
      toast.error('Preencha o título do objetivo');
      return;
    }
    updateMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      level,
      status,
      period,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
    });
  }, [
    title,
    description,
    level,
    status,
    period,
    startDate,
    endDate,
    updateMutation,
  ]);

  const handleDeleteConfirm = useCallback(() => {
    deleteMutation.mutate();
    setIsDeleteOpen(false);
  }, [deleteMutation]);

  const handleAddKeyResult = useCallback(() => {
    if (!krTitle.trim() || !krTarget) {
      toast.error('Preencha o título e a meta do resultado-chave');
      return;
    }
    createKrMutation.mutate(
      {
        objectiveId,
        data: {
          title: krTitle.trim(),
          type: krType,
          targetValue: parseFloat(krTarget),
          unit: krUnit.trim() || undefined,
          weight: parseFloat(krWeight) || 1,
        },
      },
      {
        onSuccess: () => {
          setKrTitle('');
          setKrTarget('');
          setKrUnit('');
          setKrWeight('1');
          setShowAddKr(false);
          queryClient.invalidateQueries({
            queryKey: okrKeys.detail(objectiveId),
          });
        },
      }
    );
  }, [
    objectiveId,
    krTitle,
    krType,
    krTarget,
    krUnit,
    krWeight,
    createKrMutation,
    queryClient,
  ]);

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout data-testid="okrs-edit-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'OKRs', href: '/hr/okrs' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" gap="gap-4" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !objective) {
    return (
      <PageLayout data-testid="okrs-edit-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'OKRs', href: '/hr/okrs' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Objetivo não encontrado"
            message="O objetivo solicitado não foi encontrado."
            action={{
              label: 'Voltar',
              onClick: () => router.push('/hr/okrs'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout data-testid="okrs-edit-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'OKRs', href: '/hr/okrs' },
            { label: objective.title, href: `/hr/okrs/${objectiveId}` },
            { label: 'Editar' },
          ]}
          buttons={[
            ...(canDelete
              ? [
                  {
                    id: 'delete',
                    title: 'Excluir',
                    icon: Trash2,
                    onClick: () => setIsDeleteOpen(true),
                    variant: 'destructive' as const,
                  },
                ]
              : []),
            {
              id: 'save',
              title: 'Salvar',
              icon: Save,
              onClick: handleSave,
              variant: 'default' as const,
              disabled: updateMutation.isPending,
            },
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-violet-600 text-white shrink-0">
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">{objective.title}</h2>
              <p className="text-sm text-muted-foreground">Editando objetivo</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={getObjectiveLevelBadgeClass(objective.level)}
                >
                  {getObjectiveLevelLabel(objective.level)}
                </Badge>
                <Badge
                  variant="outline"
                  className={getObjectiveStatusBadgeClass(objective.status)}
                >
                  {getObjectiveStatusLabel(objective.status)}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="divide-y">
            <CollapsibleSection
              icon={Target}
              title="Informações Gerais"
              subtitle="Título, descrição, nível e período"
            >
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">
                    Título <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Título do objetivo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-desc">Descrição</Label>
                  <Textarea
                    id="edit-desc"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descrição do objetivo"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-level">Nível</Label>
                    <select
                      id="edit-level"
                      value={level}
                      onChange={e => setLevel(e.target.value as ObjectiveLevel)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                    >
                      {LEVEL_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <select
                      id="edit-status"
                      value={status}
                      onChange={e =>
                        setStatus(e.target.value as ObjectiveStatus)
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-period">Período</Label>
                    <select
                      id="edit-period"
                      value={period}
                      onChange={e => setPeriod(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                    >
                      {PERIOD_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-start">Data de Início</Label>
                    <Input
                      id="edit-start"
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-end">Data de Término</Label>
                    <Input
                      id="edit-end"
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              icon={BarChart3}
              title="Resultados-Chave"
              subtitle={`${objective.keyResults?.length ?? 0} resultado(s)-chave`}
            >
              <div className="space-y-3 mt-2">
                {/* Existing KRs (read-only summary) */}
                {objective.keyResults?.map(kr => (
                  <div
                    key={kr.id}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{kr.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {getKeyResultTypeLabel(kr.type)} | Meta:{' '}
                        {kr.targetValue}
                        {kr.unit ? ` ${kr.unit}` : ''} | Atual:{' '}
                        {kr.currentValue}
                        {kr.unit ? ` ${kr.unit}` : ''} | Peso: {kr.weight}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add KR */}
                {showAddKr ? (
                  <div className="rounded-lg border border-dashed p-3 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Adicionar Resultado-Chave
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="add-kr-title">Título</Label>
                      <Input
                        id="add-kr-title"
                        value={krTitle}
                        onChange={e => setKrTitle(e.target.value)}
                        placeholder="Ex: Atingir 100 novos clientes"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="add-kr-type">Tipo</Label>
                        <select
                          id="add-kr-type"
                          value={krType}
                          onChange={e =>
                            setKrType(e.target.value as KeyResultType)
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                        >
                          {KR_TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-kr-target">Meta</Label>
                        <Input
                          id="add-kr-target"
                          type="number"
                          value={krTarget}
                          onChange={e => setKrTarget(e.target.value)}
                          placeholder="100"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="add-kr-unit">Unidade</Label>
                        <Input
                          id="add-kr-unit"
                          value={krUnit}
                          onChange={e => setKrUnit(e.target.value)}
                          placeholder="Ex: %, R$, un"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-kr-weight">Peso</Label>
                        <Input
                          id="add-kr-weight"
                          type="number"
                          value={krWeight}
                          onChange={e => setKrWeight(e.target.value)}
                          placeholder="1"
                          min="1"
                          max="10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-2.5"
                        onClick={() => setShowAddKr(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="h-9 px-2.5"
                        onClick={handleAddKeyResult}
                        disabled={
                          createKrMutation.isPending ||
                          !krTitle.trim() ||
                          !krTarget
                        }
                      >
                        {createKrMutation.isPending && (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        )}
                        Adicionar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5 w-full"
                    onClick={() => setShowAddKr(true)}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar Resultado-Chave
                  </Button>
                )}
              </div>
            </CollapsibleSection>
          </div>
        </Card>

        <VerifyActionPinModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir este objetivo. Apenas objetivos em rascunho ou cancelados podem ser excluídos."
        />
      </PageBody>
    </PageLayout>
  );
}
