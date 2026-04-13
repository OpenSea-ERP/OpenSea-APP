/**
 * Quality Page — Qualidade
 * Planos de inspeção, retenções de qualidade e tipos de defeito.
 */

'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShieldCheck,
  ClipboardList,
  CheckCircle2,
  ShieldAlert,
  ShieldOff,
  Bug,
  Plus,
  Pencil,
  Trash2,
  Unlock,
  Loader2,
} from 'lucide-react';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { usePermissions } from '@/hooks/use-permissions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';

import { PRODUCTION_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  inspectionPlansService,
  qualityHoldsService,
  defectTypesService,
  productionOrdersService,
} from '@/services/production';
import type {
  InspectionPlan,
  QualityHold,
  QualityHoldStatus,
  DefectType,
  DefectSeverity,
} from '@/types/production';

// ---------------------------------------------------------------------------
// Status / severity helpers
// ---------------------------------------------------------------------------

const HOLD_STATUS_CONFIG: Record<
  QualityHoldStatus,
  { label: string; badgeClass: string }
> = {
  ACTIVE: {
    label: 'Ativa',
    badgeClass:
      'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/8 dark:text-rose-300',
  },
  RELEASED: {
    label: 'Liberada',
    badgeClass:
      'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/8 dark:text-emerald-300',
  },
  SCRAPPED: {
    label: 'Descartada',
    badgeClass:
      'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300',
  },
};

const PLAN_STATUS_CONFIG: Record<
  'active' | 'inactive',
  { label: string; badgeClass: string }
> = {
  active: {
    label: 'Ativo',
    badgeClass:
      'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/8 dark:text-emerald-300',
  },
  inactive: {
    label: 'Inativo',
    badgeClass:
      'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300',
  },
};

const SEVERITY_CONFIG: Record<
  DefectSeverity,
  { label: string; badgeClass: string }
> = {
  CRITICAL: {
    label: 'Crítico',
    badgeClass:
      'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/8 dark:text-rose-300',
  },
  MAJOR: {
    label: 'Maior',
    badgeClass:
      'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/8 dark:text-amber-300',
  },
  MINOR: {
    label: 'Menor',
    badgeClass:
      'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/8 dark:text-sky-300',
  },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function QualityPage() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('planos');

  const canAccess = hasPermission(PRODUCTION_PERMISSIONS.QUALITY.ACCESS);
  const canRegister = hasPermission(PRODUCTION_PERMISSIONS.QUALITY.REGISTER);
  const canModify = hasPermission(PRODUCTION_PERMISSIONS.QUALITY.MODIFY);

  // --- Modal state ---------------------------------------------------------

  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [createPlanStep, setCreatePlanStep] = useState(1);
  const [editingPlan, setEditingPlan] = useState<InspectionPlan | null>(null);
  const [editPlanStep, setEditPlanStep] = useState(1);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const [showCreateHold, setShowCreateHold] = useState(false);
  const [createHoldStep, setCreateHoldStep] = useState(1);
  const [releasingHoldId, setReleasingHoldId] = useState<string | null>(null);
  const [releaseResolution, setReleaseResolution] = useState('');

  // --- Create plan form state -----------------------------------------------

  const [planForm, setPlanForm] = useState({
    inspectionType: '',
    description: '',
    sampleSize: '',
    aqlLevel: '',
    instructions: '',
  });

  const resetPlanForm = () => {
    setPlanForm({
      inspectionType: '',
      description: '',
      sampleSize: '',
      aqlLevel: '',
      instructions: '',
    });
    setCreatePlanStep(1);
  };

  // --- Edit plan form state -------------------------------------------------

  const [editPlanForm, setEditPlanForm] = useState({
    inspectionType: '',
    description: '',
    sampleSize: '',
    aqlLevel: '',
    instructions: '',
    isActive: true,
  });

  const openEditPlan = (plan: InspectionPlan) => {
    setEditPlanForm({
      inspectionType: plan.inspectionType,
      description: plan.description ?? '',
      sampleSize: String(plan.sampleSize),
      aqlLevel: plan.aqlLevel ?? '',
      instructions: plan.instructions ?? '',
      isActive: plan.isActive,
    });
    setEditPlanStep(1);
    setEditingPlan(plan);
  };

  // --- Create hold form state -----------------------------------------------

  const [holdForm, setHoldForm] = useState({
    productionOrderId: '',
    reason: '',
  });

  const resetHoldForm = () => {
    setHoldForm({ productionOrderId: '', reason: '' });
    setCreateHoldStep(1);
  };

  // ---- Data queries -------------------------------------------------------

  const {
    data: plansData,
    isLoading: isLoadingPlans,
    error: plansError,
  } = useQuery({
    queryKey: ['production', 'inspection-plans'],
    queryFn: async () => {
      const res = await inspectionPlansService.list();
      return res.inspectionPlans;
    },
    enabled: canAccess,
  });

  const {
    data: holdsData,
    isLoading: isLoadingHolds,
    error: holdsError,
  } = useQuery({
    queryKey: ['production', 'quality-holds'],
    queryFn: async () => {
      const res = await qualityHoldsService.list();
      return res.qualityHolds;
    },
    enabled: canAccess,
  });

  const {
    data: defectsData,
    isLoading: isLoadingDefects,
    error: defectsError,
  } = useQuery({
    queryKey: ['production', 'defect-types'],
    queryFn: async () => {
      const res = await defectTypesService.list();
      return res.defectTypes;
    },
    enabled: canAccess,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['production', 'production-orders'],
    queryFn: async () => {
      const res = await productionOrdersService.list();
      return res.productionOrders;
    },
    enabled: canAccess && showCreateHold,
  });

  // ---- Stats --------------------------------------------------------------

  const plans = plansData ?? [];
  const holds = holdsData ?? [];
  const defects = defectsData ?? [];

  const stats = useMemo(() => {
    return {
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.isActive).length,
      activeHolds: holds.filter(h => h.status === 'ACTIVE').length,
      releasedHolds: holds.filter(h => h.status === 'RELEASED').length,
    };
  }, [plans, holds]);

  // ---- Mutations ----------------------------------------------------------

  const createPlanMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      inspectionPlansService.create(data),
    onSuccess: () => {
      toast.success('Plano de inspeção criado com sucesso');
      queryClient.invalidateQueries({
        queryKey: ['production', 'inspection-plans'],
      });
      setShowCreatePlan(false);
      resetPlanForm();
    },
    onError: () => toast.error('Erro ao criar plano de inspeção'),
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      inspectionPlansService.update(id, data),
    onSuccess: () => {
      toast.success('Plano de inspeção atualizado com sucesso');
      queryClient.invalidateQueries({
        queryKey: ['production', 'inspection-plans'],
      });
      setEditingPlan(null);
    },
    onError: () => toast.error('Erro ao atualizar plano de inspeção'),
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => inspectionPlansService.delete(id),
    onSuccess: () => {
      toast.success('Plano de inspeção excluído com sucesso');
      queryClient.invalidateQueries({
        queryKey: ['production', 'inspection-plans'],
      });
      setDeletingPlanId(null);
    },
    onError: () => toast.error('Erro ao excluir plano de inspeção'),
  });

  const createHoldMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      qualityHoldsService.create(data),
    onSuccess: () => {
      toast.success('Retenção de qualidade criada com sucesso');
      queryClient.invalidateQueries({
        queryKey: ['production', 'quality-holds'],
      });
      setShowCreateHold(false);
      resetHoldForm();
    },
    onError: () => toast.error('Erro ao criar retenção de qualidade'),
  });

  const releaseHoldMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      qualityHoldsService.release(id, data),
    onSuccess: () => {
      toast.success('Retenção liberada com sucesso');
      queryClient.invalidateQueries({
        queryKey: ['production', 'quality-holds'],
      });
      setReleasingHoldId(null);
      setReleaseResolution('');
    },
    onError: () => toast.error('Erro ao liberar retenção'),
  });

  // ---- Handlers -----------------------------------------------------------

  const handleCreatePlan = () => {
    createPlanMutation.mutate({
      inspectionType: planForm.inspectionType,
      description: planForm.description || null,
      sampleSize: Number(planForm.sampleSize),
      aqlLevel: planForm.aqlLevel || null,
      instructions: planForm.instructions || null,
    });
  };

  const handleUpdatePlan = () => {
    if (!editingPlan) return;
    updatePlanMutation.mutate({
      id: editingPlan.id,
      data: {
        inspectionType: editPlanForm.inspectionType,
        description: editPlanForm.description || null,
        sampleSize: Number(editPlanForm.sampleSize),
        aqlLevel: editPlanForm.aqlLevel || null,
        instructions: editPlanForm.instructions || null,
        isActive: editPlanForm.isActive,
      },
    });
  };

  const handleCreateHold = () => {
    createHoldMutation.mutate({
      productionOrderId: holdForm.productionOrderId,
      reason: holdForm.reason,
    });
  };

  const handleReleaseHold = () => {
    if (!releasingHoldId) return;
    releaseHoldMutation.mutate({
      id: releasingHoldId,
      data: { resolution: releaseResolution || null },
    });
  };

  // ---- Stats cards config -------------------------------------------------

  const statsCards = [
    {
      label: 'Total de Inspeções',
      value: stats.totalPlans,
      icon: ClipboardList,
      from: 'from-teal-500',
      to: 'to-teal-600',
    },
    {
      label: 'Planos Ativos',
      value: stats.activePlans,
      icon: CheckCircle2,
      from: 'from-emerald-500',
      to: 'to-emerald-600',
    },
    {
      label: 'Retenções Ativas',
      value: stats.activeHolds,
      icon: ShieldAlert,
      from: 'from-rose-500',
      to: 'to-rose-600',
    },
    {
      label: 'Retenções Liberadas',
      value: stats.releasedHolds,
      icon: ShieldOff,
      from: 'from-sky-500',
      to: 'to-sky-600',
    },
  ];

  // ---- Create Plan Wizard Steps -------------------------------------------

  const createPlanSteps: WizardStep[] = [
    {
      title: 'Tipo e Amostragem',
      description: 'Defina o tipo de inspeção, descrição e tamanho da amostra.',
      icon: <ClipboardList className="h-10 w-10 text-teal-400" />,
      isValid:
        planForm.inspectionType.trim().length > 0 &&
        Number(planForm.sampleSize) > 0,
      content: (
        <div className="space-y-4 p-1">
          <div className="space-y-2">
            <Label>Tipo de Inspeção *</Label>
            <Input
              placeholder="Ex: Visual, Dimensional, Funcional"
              value={planForm.inspectionType}
              onChange={e =>
                setPlanForm(p => ({ ...p, inspectionType: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descreva o plano de inspeção..."
              value={planForm.description}
              onChange={e =>
                setPlanForm(p => ({ ...p, description: e.target.value }))
              }
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Tamanho da Amostra *</Label>
            <Input
              type="number"
              placeholder="Ex: 10"
              min={1}
              value={planForm.sampleSize}
              onChange={e =>
                setPlanForm(p => ({ ...p, sampleSize: e.target.value }))
              }
            />
          </div>
        </div>
      ),
    },
    {
      title: 'AQL e Instruções',
      description: 'Defina o nível AQL e instruções de inspeção.',
      icon: <ShieldCheck className="h-10 w-10 text-teal-400" />,
      isValid: true,
      content: (
        <div className="space-y-4 p-1">
          <div className="space-y-2">
            <Label>Nível AQL</Label>
            <Select
              value={planForm.aqlLevel}
              onValueChange={v => setPlanForm(p => ({ ...p, aqlLevel: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível AQL" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.065">0,065</SelectItem>
                <SelectItem value="0.10">0,10</SelectItem>
                <SelectItem value="0.15">0,15</SelectItem>
                <SelectItem value="0.25">0,25</SelectItem>
                <SelectItem value="0.40">0,40</SelectItem>
                <SelectItem value="0.65">0,65</SelectItem>
                <SelectItem value="1.0">1,0</SelectItem>
                <SelectItem value="1.5">1,5</SelectItem>
                <SelectItem value="2.5">2,5</SelectItem>
                <SelectItem value="4.0">4,0</SelectItem>
                <SelectItem value="6.5">6,5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Instruções de Inspeção</Label>
            <Textarea
              placeholder="Descreva as instruções detalhadas para a inspeção..."
              value={planForm.instructions}
              onChange={e =>
                setPlanForm(p => ({ ...p, instructions: e.target.value }))
              }
              rows={5}
            />
          </div>
        </div>
      ),
      footer: (
        <div className="flex items-center justify-end gap-2 px-6 pb-4">
          <Button
            variant="outline"
            onClick={() => setCreatePlanStep(1)}
            className="h-9 px-2.5"
          >
            Voltar
          </Button>
          <Button
            onClick={handleCreatePlan}
            disabled={createPlanMutation.isPending}
            className="h-9 px-2.5"
          >
            {createPlanMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            Criar Plano
          </Button>
        </div>
      ),
    },
  ];

  // ---- Edit Plan Wizard Steps ---------------------------------------------

  const editPlanSteps: WizardStep[] = [
    {
      title: 'Tipo e Amostragem',
      description: 'Edite o tipo de inspeção, descrição e tamanho da amostra.',
      icon: <ClipboardList className="h-10 w-10 text-teal-400" />,
      isValid:
        editPlanForm.inspectionType.trim().length > 0 &&
        Number(editPlanForm.sampleSize) > 0,
      content: (
        <div className="space-y-4 p-1">
          <div className="space-y-2">
            <Label>Tipo de Inspeção *</Label>
            <Input
              placeholder="Ex: Visual, Dimensional, Funcional"
              value={editPlanForm.inspectionType}
              onChange={e =>
                setEditPlanForm(p => ({
                  ...p,
                  inspectionType: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descreva o plano de inspeção..."
              value={editPlanForm.description}
              onChange={e =>
                setEditPlanForm(p => ({ ...p, description: e.target.value }))
              }
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Tamanho da Amostra *</Label>
            <Input
              type="number"
              placeholder="Ex: 10"
              min={1}
              value={editPlanForm.sampleSize}
              onChange={e =>
                setEditPlanForm(p => ({ ...p, sampleSize: e.target.value }))
              }
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Label>Status</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditPlanForm(p => ({ ...p, isActive: true }))}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  editPlanForm.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/8 dark:text-emerald-300 dark:border-emerald-500/20'
                    : 'bg-gray-100 text-gray-500 border border-gray-200 dark:bg-white/5 dark:text-white/40 dark:border-white/10'
                }`}
              >
                Ativo
              </button>
              <button
                type="button"
                onClick={() =>
                  setEditPlanForm(p => ({ ...p, isActive: false }))
                }
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  !editPlanForm.isActive
                    ? 'bg-slate-50 text-slate-700 border border-slate-300 dark:bg-slate-500/8 dark:text-slate-300 dark:border-slate-500/20'
                    : 'bg-gray-100 text-gray-500 border border-gray-200 dark:bg-white/5 dark:text-white/40 dark:border-white/10'
                }`}
              >
                Inativo
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'AQL e Instruções',
      description: 'Edite o nível AQL e instruções de inspeção.',
      icon: <ShieldCheck className="h-10 w-10 text-teal-400" />,
      isValid: true,
      content: (
        <div className="space-y-4 p-1">
          <div className="space-y-2">
            <Label>Nível AQL</Label>
            <Select
              value={editPlanForm.aqlLevel}
              onValueChange={v => setEditPlanForm(p => ({ ...p, aqlLevel: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível AQL" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.065">0,065</SelectItem>
                <SelectItem value="0.10">0,10</SelectItem>
                <SelectItem value="0.15">0,15</SelectItem>
                <SelectItem value="0.25">0,25</SelectItem>
                <SelectItem value="0.40">0,40</SelectItem>
                <SelectItem value="0.65">0,65</SelectItem>
                <SelectItem value="1.0">1,0</SelectItem>
                <SelectItem value="1.5">1,5</SelectItem>
                <SelectItem value="2.5">2,5</SelectItem>
                <SelectItem value="4.0">4,0</SelectItem>
                <SelectItem value="6.5">6,5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Instruções de Inspeção</Label>
            <Textarea
              placeholder="Descreva as instruções detalhadas para a inspeção..."
              value={editPlanForm.instructions}
              onChange={e =>
                setEditPlanForm(p => ({ ...p, instructions: e.target.value }))
              }
              rows={5}
            />
          </div>
        </div>
      ),
      footer: (
        <div className="flex items-center justify-end gap-2 px-6 pb-4">
          <Button
            variant="outline"
            onClick={() => setEditPlanStep(1)}
            className="h-9 px-2.5"
          >
            Voltar
          </Button>
          <Button
            onClick={handleUpdatePlan}
            disabled={updatePlanMutation.isPending}
            className="h-9 px-2.5"
          >
            {updatePlanMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            Salvar Alterações
          </Button>
        </div>
      ),
    },
  ];

  // ---- Create Hold Wizard Steps -------------------------------------------

  const createHoldSteps: WizardStep[] = [
    {
      title: 'Dados da Retenção',
      description:
        'Selecione a ordem de produção e informe o motivo da retenção.',
      icon: <ShieldAlert className="h-10 w-10 text-rose-400" />,
      isValid:
        holdForm.productionOrderId.length > 0 &&
        holdForm.reason.trim().length > 0,
      content: (
        <div className="space-y-4 p-1">
          <div className="space-y-2">
            <Label>Ordem de Produção *</Label>
            <Select
              value={holdForm.productionOrderId}
              onValueChange={v =>
                setHoldForm(p => ({ ...p, productionOrderId: v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a ordem de produção" />
              </SelectTrigger>
              <SelectContent>
                {(ordersData ?? []).map(order => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.orderNumber} — {order.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Motivo da Retenção *</Label>
            <Textarea
              placeholder="Descreva o motivo da retenção de qualidade..."
              value={holdForm.reason}
              onChange={e =>
                setHoldForm(p => ({ ...p, reason: e.target.value }))
              }
              rows={4}
            />
          </div>
        </div>
      ),
      footer: (
        <div className="flex items-center justify-end gap-2 px-6 pb-4">
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateHold(false);
              resetHoldForm();
            }}
            className="h-9 px-2.5"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateHold}
            disabled={
              createHoldMutation.isPending ||
              holdForm.productionOrderId.length === 0 ||
              holdForm.reason.trim().length === 0
            }
            className="h-9 px-2.5"
          >
            {createHoldMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            Criar Retenção
          </Button>
        </div>
      ),
    },
  ];

  // ---- Build order number map for display ----------------------------------

  const orderMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (ordersData) {
      for (const o of ordersData) {
        map[o.id] = o.orderNumber;
      }
    }
    return map;
  }, [ordersData]);

  // ---- Render --------------------------------------------------------------

  return (
    <div className="space-y-6" data-testid="quality-page">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Produção', href: '/production' },
          { label: 'Qualidade', href: '/production/quality' },
        ]}
      />

      <PageHeroBanner
        title="Qualidade"
        description="Controle de qualidade da produção: planos de inspeção, retenções e rastreamento de defeitos."
        icon={ShieldCheck}
        iconGradient="from-teal-500 to-emerald-600"
        buttons={[]}
        hasPermission={hasPermission}
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map(s => (
          <Card
            key={s.label}
            className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-linear-to-br ${s.from} ${s.to} flex items-center justify-center`}
              >
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-white/60">
                  {s.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoadingPlans || isLoadingHolds ? '—' : s.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
          <TabsTrigger value="planos" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Planos de Inspeção
          </TabsTrigger>
          <TabsTrigger value="retencoes" className="gap-2">
            <ShieldAlert className="h-4 w-4" />
            Retenções
          </TabsTrigger>
          <TabsTrigger value="defeitos" className="gap-2">
            <Bug className="h-4 w-4" />
            Tipos de Defeito
          </TabsTrigger>
        </TabsList>

        {/* --- Planos de Inspeção tab --- */}
        <TabsContent value="planos" className="space-y-4">
          {canRegister && (
            <div className="flex justify-end">
              <Button
                size="sm"
                className="h-9 px-2.5 gap-1"
                onClick={() => {
                  resetPlanForm();
                  setShowCreatePlan(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Novo Plano
              </Button>
            </div>
          )}

          {isLoadingPlans && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {plansError && (
            <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-sm text-rose-600 dark:text-rose-400">
                Erro ao carregar planos de inspeção.
              </p>
            </Card>
          )}

          {!isLoadingPlans && !plansError && plans.length === 0 && (
            <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-sm text-gray-500 dark:text-white/60">
                Nenhum plano de inspeção cadastrado.
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {plans.map(plan => {
              const statusKey = plan.isActive ? 'active' : 'inactive';
              const cfg = PLAN_STATUS_CONFIG[statusKey];
              return (
                <Card
                  key={plan.id}
                  className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {plan.inspectionType}
                    </p>
                    <Badge variant="outline" className={cfg.badgeClass}>
                      {cfg.label}
                    </Badge>
                  </div>

                  {plan.description && (
                    <p className="text-xs text-gray-500 dark:text-white/60 line-clamp-2">
                      {plan.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-white/50">
                    <div className="flex justify-between">
                      <span>Amostra</span>
                      <span className="font-medium text-gray-700 dark:text-white/80">
                        {plan.sampleSize}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>AQL</span>
                      <span className="font-medium text-gray-700 dark:text-white/80">
                        {plan.aqlLevel ?? '—'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 dark:text-white/40">
                    Criado em {formatDate(plan.createdAt)}
                  </div>

                  {(canModify || canRegister) && (
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-white/5">
                      {canModify && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-2.5 gap-1"
                          onClick={() => openEditPlan(plan)}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Button>
                      )}
                      {canModify && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-2.5 gap-1 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/10"
                          onClick={() => setDeletingPlanId(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* --- Retenções tab --- */}
        <TabsContent value="retencoes" className="space-y-4">
          {canRegister && (
            <div className="flex justify-end">
              <Button
                size="sm"
                className="h-9 px-2.5 gap-1"
                onClick={() => {
                  resetHoldForm();
                  setShowCreateHold(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Nova Retenção
              </Button>
            </div>
          )}

          {isLoadingHolds && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {holdsError && (
            <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-sm text-rose-600 dark:text-rose-400">
                Erro ao carregar retenções de qualidade.
              </p>
            </Card>
          )}

          {!isLoadingHolds && !holdsError && holds.length === 0 && (
            <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-sm text-gray-500 dark:text-white/60">
                Nenhuma retenção de qualidade registrada.
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {holds.map(hold => {
              const cfg = HOLD_STATUS_CONFIG[hold.status];
              return (
                <Card
                  key={hold.id}
                  className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {orderMap[hold.productionOrderId] ??
                        hold.productionOrderId.slice(0, 8)}
                    </p>
                    <Badge variant="outline" className={cfg.badgeClass}>
                      {cfg.label}
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-white/60 line-clamp-3">
                    {hold.reason}
                  </p>

                  <div className="text-xs text-gray-500 dark:text-white/50 space-y-1">
                    <div className="flex justify-between">
                      <span>Retida em</span>
                      <span>{formatDate(hold.holdAt)}</span>
                    </div>
                    {hold.releasedAt && (
                      <div className="flex justify-between">
                        <span>Liberada em</span>
                        <span>{formatDate(hold.releasedAt)}</span>
                      </div>
                    )}
                    {hold.resolution && (
                      <div className="pt-1">
                        <span className="text-gray-400 dark:text-white/40">
                          Resolução:{' '}
                        </span>
                        <span className="text-gray-600 dark:text-white/60">
                          {hold.resolution}
                        </span>
                      </div>
                    )}
                  </div>

                  {canModify && hold.status === 'ACTIVE' && (
                    <div className="pt-1 border-t border-gray-100 dark:border-white/5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-2.5 gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                        onClick={() => setReleasingHoldId(hold.id)}
                      >
                        <Unlock className="h-4 w-4" />
                        Liberar
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* --- Tipos de Defeito tab --- */}
        <TabsContent value="defeitos" className="space-y-4">
          {isLoadingDefects && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {defectsError && (
            <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-sm text-rose-600 dark:text-rose-400">
                Erro ao carregar tipos de defeito.
              </p>
            </Card>
          )}

          {!isLoadingDefects && !defectsError && defects.length === 0 && (
            <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-sm text-gray-500 dark:text-white/60">
                Nenhum tipo de defeito cadastrado.
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {defects.map(defect => {
              const sev = SEVERITY_CONFIG[defect.severity];
              return (
                <Card
                  key={defect.id}
                  className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-gray-400 dark:text-white/40">
                        {defect.code}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {defect.name}
                      </p>
                    </div>
                    <Badge variant="outline" className={sev.badgeClass}>
                      {sev.label}
                    </Badge>
                  </div>

                  {defect.description && (
                    <p className="text-xs text-gray-500 dark:text-white/60 line-clamp-2">
                      {defect.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-white/40">
                    <span>
                      {defect.isActive ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/8 dark:text-emerald-300"
                        >
                          Ativo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300"
                        >
                          Inativo
                        </Badge>
                      )}
                    </span>
                    <span>{formatDate(defect.createdAt)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* --- Create Plan Wizard --- */}
      <StepWizardDialog
        open={showCreatePlan}
        onOpenChange={open => {
          if (!open) {
            setShowCreatePlan(false);
            resetPlanForm();
          }
        }}
        steps={createPlanSteps}
        currentStep={createPlanStep}
        onStepChange={setCreatePlanStep}
        onClose={() => {
          setShowCreatePlan(false);
          resetPlanForm();
        }}
      />

      {/* --- Edit Plan Wizard --- */}
      <StepWizardDialog
        open={editingPlan !== null}
        onOpenChange={open => {
          if (!open) setEditingPlan(null);
        }}
        steps={editPlanSteps}
        currentStep={editPlanStep}
        onStepChange={setEditPlanStep}
        onClose={() => setEditingPlan(null)}
      />

      {/* --- Create Hold Wizard --- */}
      <StepWizardDialog
        open={showCreateHold}
        onOpenChange={open => {
          if (!open) {
            setShowCreateHold(false);
            resetHoldForm();
          }
        }}
        steps={createHoldSteps}
        currentStep={createHoldStep}
        onStepChange={setCreateHoldStep}
        onClose={() => {
          setShowCreateHold(false);
          resetHoldForm();
        }}
      />

      {/* --- Release Hold Dialog --- */}
      {releasingHoldId && (
        <StepWizardDialog
          open={releasingHoldId !== null}
          onOpenChange={open => {
            if (!open) {
              setReleasingHoldId(null);
              setReleaseResolution('');
            }
          }}
          steps={[
            {
              title: 'Liberar Retenção',
              description:
                'Informe a resolução para liberar a retenção de qualidade.',
              icon: <Unlock className="h-10 w-10 text-emerald-400" />,
              isValid: true,
              content: (
                <div className="space-y-4 p-1">
                  <div className="space-y-2">
                    <Label>Resolução</Label>
                    <Textarea
                      placeholder="Descreva a resolução ou ação corretiva tomada..."
                      value={releaseResolution}
                      onChange={e => setReleaseResolution(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              ),
              footer: (
                <div className="flex items-center justify-end gap-2 px-6 pb-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReleasingHoldId(null);
                      setReleaseResolution('');
                    }}
                    className="h-9 px-2.5"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleReleaseHold}
                    disabled={releaseHoldMutation.isPending}
                    className="h-9 px-2.5"
                  >
                    {releaseHoldMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    Confirmar Liberação
                  </Button>
                </div>
              ),
            },
          ]}
          currentStep={1}
          onStepChange={() => {}}
          onClose={() => {
            setReleasingHoldId(null);
            setReleaseResolution('');
          }}
        />
      )}

      {/* --- Delete Plan PIN confirmation --- */}
      <VerifyActionPinModal
        isOpen={deletingPlanId !== null}
        onClose={() => setDeletingPlanId(null)}
        onSuccess={() => {
          if (deletingPlanId) {
            deletePlanMutation.mutate(deletingPlanId);
          }
        }}
        title="Confirmar Exclusão"
        description="Digite seu PIN de ação para excluir este plano de inspeção."
      />
    </div>
  );
}
