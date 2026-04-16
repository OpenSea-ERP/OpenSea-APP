/**
 * Create OKR Modal (HR)
 * Wizard de 4 passos para criar um OKR completo (objetivo + key results +
 * configuração de visibilidade), inspirado em 15Five Goals creation flow.
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { employeesService } from '@/services/hr';
import {
  useCreateObjective,
  useCreateKeyResult,
} from '@/app/(dashboard)/(modules)/hr/(entities)/okrs/src/api';
import { getObjectiveLevelColor } from '@/app/(dashboard)/(modules)/hr/(entities)/okrs/src/utils';
import type {
  CreateKeyResultData,
  KeyResultType,
  ObjectiveLevel,
  OKRObjective,
} from '@/types/hr';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Bell,
  CheckCircle2,
  Eye,
  Loader2,
  Plus,
  Search,
  Target,
  Trash2,
  Users,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';

interface CreateOKRModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableObjectives?: OKRObjective[];
  defaultParentId?: string | null;
  defaultLevel?: ObjectiveLevel;
}

const LEVEL_OPTIONS: {
  value: ObjectiveLevel;
  label: string;
  description: string;
  requiresParent: boolean;
}[] = [
  {
    value: 'COMPANY',
    label: 'Empresa',
    description: 'Estratégico — sem pai',
    requiresParent: false,
  },
  {
    value: 'DEPARTMENT',
    label: 'Departamento',
    description: 'Vinculado a um OKR de empresa',
    requiresParent: true,
  },
  {
    value: 'TEAM',
    label: 'Equipe',
    description: 'Vinculado a um OKR de departamento',
    requiresParent: true,
  },
  {
    value: 'INDIVIDUAL',
    label: 'Individual',
    description: 'Vinculado a um OKR de equipe',
    requiresParent: true,
  },
];

const KR_TYPE_OPTIONS: { value: KeyResultType; label: string }[] = [
  { value: 'NUMERIC', label: 'Numérico' },
  { value: 'PERCENTAGE', label: 'Percentual' },
  { value: 'CURRENCY', label: 'Monetário' },
  { value: 'BINARY', label: 'Binário (Sim/Não)' },
];

const PERIOD_OPTIONS = [
  { value: 'Q1_2026', label: '1T 2026' },
  { value: 'Q2_2026', label: '2T 2026' },
  { value: 'Q3_2026', label: '3T 2026' },
  { value: 'Q4_2026', label: '4T 2026' },
  { value: 'Q1_2027', label: '1T 2027' },
  { value: 'Q2_2027', label: '2T 2027' },
];

const MAX_KEY_RESULTS = 5;
const MIN_KEY_RESULTS = 1;

type DraftKeyResult = CreateKeyResultData & { tempId: string };

export function CreateOKRModal({
  isOpen,
  onClose,
  availableObjectives = [],
  defaultParentId = null,
  defaultLevel = 'COMPANY',
}: CreateOKRModalProps) {
  const { hasPermission } = usePermissions();
  const canModify = hasPermission(HR_PERMISSIONS.OKRS.UPDATE);

  const createObjective = useCreateObjective();
  const createKeyResult = useCreateKeyResult();

  // ============================================================================
  // STATE - Step 1
  // ============================================================================

  const [level, setLevel] = useState<ObjectiveLevel>(defaultLevel);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // ============================================================================
  // STATE - Step 2
  // ============================================================================

  const [ownerId, setOwnerId] = useState('');
  const [ownerSearch, setOwnerSearch] = useState('');
  const [period, setPeriod] = useState('Q2_2026');
  const [parentId, setParentId] = useState<string | null>(defaultParentId);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ============================================================================
  // STATE - Step 3 (Key Results)
  // ============================================================================

  const [keyResults, setKeyResults] = useState<DraftKeyResult[]>([]);
  const [krTitle, setKrTitle] = useState('');
  const [krType, setKrType] = useState<KeyResultType>('NUMERIC');
  const [krStartValue, setKrStartValue] = useState('0');
  const [krTargetValue, setKrTargetValue] = useState('');
  const [krUnit, setKrUnit] = useState('');
  const [krWeight, setKrWeight] = useState('1');

  // ============================================================================
  // STATE - Step 4 (Visibility/Notify)
  // ============================================================================

  const [visibility, setVisibility] = useState<'PUBLIC' | 'TEAM' | 'PRIVATE'>(
    'PUBLIC'
  );
  const [notifyOwner, setNotifyOwner] = useState(true);
  const [notifyParentOwner, setNotifyParentOwner] = useState(true);

  // ============================================================================
  // STATE - wizard
  // ============================================================================

  const [currentStep, setCurrentStep] = useState(1);

  // ============================================================================
  // EMPLOYEE QUERY
  // ============================================================================

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'okr-owner-options'],
    queryFn: () =>
      employeesService.listEmployees({ perPage: 100, status: 'ACTIVE' }),
    staleTime: 60_000,
    enabled: isOpen,
  });

  const filteredEmployees = useMemo(() => {
    const employees = employeesData?.employees ?? [];
    if (!ownerSearch.trim()) return employees.slice(0, 10);
    const term = ownerSearch.toLowerCase();
    return employees
      .filter(employee => employee.fullName.toLowerCase().includes(term))
      .slice(0, 10);
  }, [employeesData, ownerSearch]);

  const selectedOwnerName = useMemo(() => {
    if (!ownerId) return '';
    return (
      employeesData?.employees?.find(employee => employee.id === ownerId)
        ?.fullName ?? ''
    );
  }, [ownerId, employeesData]);

  // ============================================================================
  // PARENT OPTIONS (filtered by level)
  // ============================================================================

  const parentLevelByChild: Record<ObjectiveLevel, ObjectiveLevel | null> = {
    COMPANY: null,
    DEPARTMENT: 'COMPANY',
    TEAM: 'DEPARTMENT',
    INDIVIDUAL: 'TEAM',
  };

  const parentOptions = useMemo(() => {
    const expectedParentLevel = parentLevelByChild[level];
    if (!expectedParentLevel) return [];
    return availableObjectives.filter(
      objective => objective.level === expectedParentLevel
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableObjectives, level]);

  const requiresParent = level !== 'COMPANY';

  // ============================================================================
  // VALIDATIONS
  // ============================================================================

  const isStep1Valid = title.trim().length >= 4;
  const isStep2Valid =
    !!ownerId &&
    !!startDate &&
    !!endDate &&
    !!period &&
    (!requiresParent || !!parentId);
  const isStep3Valid =
    keyResults.length >= MIN_KEY_RESULTS &&
    keyResults.length <= MAX_KEY_RESULTS;

  // Permission gating: COMPANY OKRs require register; TEAM/DEPARTMENT require modify
  const canCreateAtLevel = useMemo(() => {
    if (level === 'COMPANY' || level === 'DEPARTMENT') {
      return canModify;
    }
    return true;
  }, [level, canModify]);

  // ============================================================================
  // KEY RESULT HANDLERS
  // ============================================================================

  const handleAddKr = useCallback(() => {
    if (!krTitle.trim() || !krTargetValue) {
      toast.error('Preencha o título e a meta do resultado-chave');
      return;
    }
    if (keyResults.length >= MAX_KEY_RESULTS) {
      toast.error(`Máximo de ${MAX_KEY_RESULTS} resultados-chave por objetivo`);
      return;
    }
    setKeyResults(previous => [
      ...previous,
      {
        tempId: crypto.randomUUID(),
        title: krTitle.trim(),
        type: krType,
        startValue: parseFloat(krStartValue) || 0,
        targetValue: parseFloat(krTargetValue),
        unit: krUnit.trim() || undefined,
        weight: parseFloat(krWeight) || 1,
      },
    ]);
    setKrTitle('');
    setKrTargetValue('');
    setKrStartValue('0');
    setKrUnit('');
    setKrWeight('1');
  }, [
    krTitle,
    krType,
    krStartValue,
    krTargetValue,
    krUnit,
    krWeight,
    keyResults.length,
  ]);

  const handleRemoveKr = useCallback((tempId: string) => {
    setKeyResults(previous =>
      previous.filter(keyResult => keyResult.tempId !== tempId)
    );
  }, []);

  // ============================================================================
  // RESET
  // ============================================================================

  const handleReset = useCallback(() => {
    setLevel(defaultLevel);
    setTitle('');
    setDescription('');
    setOwnerId('');
    setOwnerSearch('');
    setPeriod('Q2_2026');
    setParentId(defaultParentId);
    setStartDate('');
    setEndDate('');
    setKeyResults([]);
    setKrTitle('');
    setKrTargetValue('');
    setKrStartValue('0');
    setKrUnit('');
    setKrWeight('1');
    setVisibility('PUBLIC');
    setNotifyOwner(true);
    setNotifyParentOwner(true);
    setCurrentStep(1);
  }, [defaultLevel, defaultParentId]);

  // ============================================================================
  // SUBMIT
  // ============================================================================

  const handleSubmit = useCallback(async () => {
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      toast.error('Revise os passos antes de criar o objetivo');
      return;
    }
    if (!canCreateAtLevel) {
      toast.error('Você não tem permissão para criar OKR neste nível');
      return;
    }

    try {
      const created = await createObjective.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        ownerId,
        parentId: parentId || undefined,
        level,
        period,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });

      const objectiveId = created.objective.id;
      for (const keyResult of keyResults) {
        await createKeyResult.mutateAsync({
          objectiveId,
          data: {
            title: keyResult.title,
            type: keyResult.type,
            startValue: keyResult.startValue,
            targetValue: keyResult.targetValue,
            unit: keyResult.unit,
            weight: keyResult.weight,
          },
        });
      }

      handleReset();
      onClose();
    } catch {
      // toast feito pelo mutation
    }
  }, [
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    canCreateAtLevel,
    title,
    description,
    ownerId,
    parentId,
    level,
    period,
    startDate,
    endDate,
    keyResults,
    createObjective,
    createKeyResult,
    handleReset,
    onClose,
  ]);

  // ============================================================================
  // STEPS
  // ============================================================================

  const steps: WizardStep[] = [
    {
      title: 'Tipo e Identidade',
      description: 'Defina o nível e o título do objetivo',
      icon: <Target className="h-10 w-10 text-violet-500" />,
      content: (
        <div className="space-y-4 px-1">
          <div className="space-y-2">
            <Label>Nível do Objetivo</Label>
            <div className="grid grid-cols-2 gap-2">
              {LEVEL_OPTIONS.map(option => {
                const color = getObjectiveLevelColor(option.value);
                const isSelected = level === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setLevel(option.value);
                      if (option.value === 'COMPANY') setParentId(null);
                    }}
                    data-testid={`okr-level-${option.value.toLowerCase()}`}
                    className={cn(
                      'rounded-lg border p-3 text-left text-sm transition-colors',
                      isSelected
                        ? color === 'violet'
                          ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/8 dark:text-violet-300'
                          : color === 'sky'
                            ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-500/8 dark:text-sky-300'
                            : color === 'teal'
                              ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-500/8 dark:text-teal-300'
                              : 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300'
                        : 'border-border hover:bg-accent'
                    )}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
            {!canCreateAtLevel && (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                Você não tem permissão para criar OKRs deste nível.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="okr-title">
              Título <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="okr-title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="Ex: Tornar-se referência em soluções ERP no Brasil"
              maxLength={256}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 4 caracteres. Bons OKRs são qualitativos e ambiciosos.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="okr-description">Descrição</Label>
            <Textarea
              id="okr-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Contexto, motivação e o que está fora do escopo"
              rows={3}
              maxLength={2000}
            />
          </div>
        </div>
      ),
      isValid: isStep1Valid && canCreateAtLevel,
    },
    {
      title: 'Responsável e Período',
      description: 'Quem é o dono e quando entrega',
      icon: <Users className="h-10 w-10 text-sky-500" />,
      content: (
        <div className="space-y-4 px-1">
          <div className="space-y-2">
            <Label>
              Responsável <span className="text-rose-500">*</span>
            </Label>
            {selectedOwnerName ? (
              <div className="flex h-9 items-center justify-between rounded-md border border-input bg-background px-3 text-sm">
                <span className="truncate">{selectedOwnerName}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground ml-2"
                  onClick={() => {
                    setOwnerId('');
                    setOwnerSearch('');
                  }}
                  aria-label="Remover responsável"
                >
                  &times;
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={ownerSearch}
                    onChange={event => setOwnerSearch(event.target.value)}
                    placeholder="Buscar funcionário ativo..."
                    className="pl-8 h-9"
                  />
                </div>
                {filteredEmployees.length > 0 && (
                  <div className="max-h-32 overflow-y-auto rounded-md border bg-popover text-xs">
                    {filteredEmployees.map(employee => (
                      <button
                        key={employee.id}
                        type="button"
                        className="w-full px-3 py-1.5 text-left hover:bg-accent transition-colors"
                        onClick={() => {
                          setOwnerId(employee.id);
                          setOwnerSearch('');
                        }}
                      >
                        {employee.fullName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="okr-period">Período</Label>
              <select
                id="okr-period"
                value={period}
                onChange={event => setPeriod(event.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {PERIOD_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {requiresParent && (
              <div className="space-y-2">
                <Label htmlFor="okr-parent">
                  Objetivo Pai <span className="text-rose-500">*</span>
                </Label>
                <select
                  id="okr-parent"
                  value={parentId ?? ''}
                  onChange={event => setParentId(event.target.value || null)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  data-testid="okr-parent-select"
                >
                  <option value="">Selecione...</option>
                  {parentOptions.map(parent => (
                    <option key={parent.id} value={parent.id}>
                      {parent.title}
                    </option>
                  ))}
                </select>
                {parentOptions.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Nenhum OKR pai disponível neste período. Crie um OKR de
                    nível superior antes.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="okr-start">
                Início <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="okr-start"
                type="date"
                value={startDate}
                onChange={event => setStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="okr-end">
                Término <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="okr-end"
                type="date"
                value={endDate}
                onChange={event => setEndDate(event.target.value)}
                min={startDate || undefined}
              />
            </div>
          </div>
        </div>
      ),
      isValid: isStep2Valid,
    },
    {
      title: 'Resultados-Chave',
      description: 'Métricas mensuráveis (mínimo 1, máximo 5)',
      icon: <BarChart3 className="h-10 w-10 text-emerald-500" />,
      content: (
        <div className="space-y-4 px-1">
          {keyResults.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {keyResults.length} de {MAX_KEY_RESULTS} adicionado(s)
              </Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {keyResults.map(keyResult => (
                  <div
                    key={keyResult.tempId}
                    className="flex items-center justify-between rounded-lg border p-2 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{keyResult.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {keyResult.startValue ?? 0} &rarr;{' '}
                        {keyResult.targetValue}
                        {keyResult.unit ? ` ${keyResult.unit}` : ''} &middot;
                        Peso {keyResult.weight}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/8"
                      onClick={() => handleRemoveKr(keyResult.tempId)}
                      aria-label="Remover resultado-chave"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {keyResults.length < MAX_KEY_RESULTS && (
            <div className="rounded-lg border border-dashed p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">
                Adicionar Resultado-Chave
              </p>

              <div className="space-y-2">
                <Label htmlFor="kr-title">Título</Label>
                <Input
                  id="kr-title"
                  value={krTitle}
                  onChange={event => setKrTitle(event.target.value)}
                  placeholder="Ex: Atingir R$ 500k em MRR"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="kr-type">Tipo</Label>
                  <select
                    id="kr-type"
                    value={krType}
                    onChange={event =>
                      setKrType(event.target.value as KeyResultType)
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    {KR_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kr-unit">Unidade</Label>
                  <Input
                    id="kr-unit"
                    value={krUnit}
                    onChange={event => setKrUnit(event.target.value)}
                    placeholder="Ex: %, R$, un"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="kr-start">Valor Inicial</Label>
                  <Input
                    id="kr-start"
                    type="number"
                    inputMode="decimal"
                    value={krStartValue}
                    onChange={event => setKrStartValue(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kr-target">Meta</Label>
                  <Input
                    id="kr-target"
                    type="number"
                    inputMode="decimal"
                    value={krTargetValue}
                    onChange={event => setKrTargetValue(event.target.value)}
                    placeholder="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kr-weight">Peso</Label>
                  <Input
                    id="kr-weight"
                    type="number"
                    value={krWeight}
                    onChange={event => setKrWeight(event.target.value)}
                    placeholder="1"
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5 w-full"
                onClick={handleAddKr}
                disabled={!krTitle.trim() || !krTargetValue}
              >
                <Plus className="mr-1 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          )}

          {keyResults.length === MAX_KEY_RESULTS && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Limite de {MAX_KEY_RESULTS} resultados-chave atingido.
            </p>
          )}
        </div>
      ),
      isValid: isStep3Valid,
    },
    {
      title: 'Visibilidade e Notificações',
      description: 'Quem vê e quem é avisado',
      icon: <Eye className="h-10 w-10 text-teal-500" />,
      content: (
        <div className="space-y-5 px-1">
          <div className="space-y-2">
            <Label>Visibilidade</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                {
                  value: 'PUBLIC',
                  label: 'Pública',
                  description: 'Toda a empresa vê',
                },
                {
                  value: 'TEAM',
                  label: 'Equipe',
                  description: 'Apenas a equipe',
                },
                {
                  value: 'PRIVATE',
                  label: 'Privada',
                  description: 'Apenas responsável e gestor',
                },
              ] as const).map(option => {
                const isSelected = visibility === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value)}
                    className={cn(
                      'rounded-lg border p-2 text-center text-xs transition-colors',
                      isSelected
                        ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/8 dark:text-violet-300'
                        : 'border-border hover:bg-accent'
                    )}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-muted-foreground mt-0.5">
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Visibilidade é informacional. Permissões reais são governadas pelo
              RBAC.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </Label>
            <label className="flex items-start gap-2 rounded-lg border p-2 text-sm cursor-pointer hover:bg-accent">
              <input
                type="checkbox"
                checked={notifyOwner}
                onChange={event => setNotifyOwner(event.target.checked)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <p className="font-medium">Avisar responsável</p>
                <p className="text-xs text-muted-foreground">
                  Notificar quem foi designado como dono.
                </p>
              </div>
            </label>
            {requiresParent && (
              <label className="flex items-start gap-2 rounded-lg border p-2 text-sm cursor-pointer hover:bg-accent">
                <input
                  type="checkbox"
                  checked={notifyParentOwner}
                  onChange={event =>
                    setNotifyParentOwner(event.target.checked)
                  }
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-medium">Avisar dono do OKR pai</p>
                  <p className="text-xs text-muted-foreground">
                    Mantém o líder ciente do alinhamento.
                  </p>
                </div>
              </label>
            )}
          </div>

          <div className="rounded-lg border bg-violet-50/50 dark:bg-violet-500/5 p-3 text-xs text-violet-700 dark:text-violet-300 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Pronto para criar</p>
              <p className="mt-0.5">
                Confira os dados e clique em &quot;Criar OKR&quot;. Você poderá
                editar tudo depois.
              </p>
            </div>
          </div>
        </div>
      ),
      isValid: true,
      footer: (
        <div className="flex items-center gap-2 w-full justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(3)}
          >
            &larr; Voltar
          </Button>
          <Button
            type="button"
            disabled={createObjective.isPending || createKeyResult.isPending}
            onClick={handleSubmit}
            data-testid="okr-create-submit"
          >
            {(createObjective.isPending || createKeyResult.isPending) && (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            )}
            Criar OKR
          </Button>
        </div>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          handleReset();
          onClose();
        }
      }}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={() => {
        handleReset();
        onClose();
      }}
    />
  );
}

export default CreateOKRModal;
