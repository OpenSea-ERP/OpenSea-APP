/**
 * EscalationConfigModal
 * NavigationWizardDialog para criar/editar réguas de cobrança.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  NavigationWizardDialog,
  type NavigationSection,
} from '@/components/ui/navigation-wizard-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowDown,
  ArrowUp,
  FileText,
  Layers,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateEscalation,
  useUpdateEscalation,
  useEscalation,
} from '@/hooks/finance/use-escalations';
import type {
  EscalationChannel,
  EscalationStep,
  EscalationTemplateType,
} from '@/types/finance';
import {
  ESCALATION_CHANNEL_LABELS,
  ESCALATION_TEMPLATE_LABELS,
} from '@/types/finance';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface EscalationConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escalationId?: string;
  onSaved?: () => void;
}

type SectionId = 'basic' | 'steps';

interface StepFormData {
  tempId: string;
  daysOverdue: number;
  channel: EscalationChannel;
  templateType: EscalationTemplateType;
  message: string;
}

const PLACEHOLDER_HINTS =
  'Variáveis: {customerName}, {amount}, {dueDate}, {daysPastDue}, {entryCode}';

function generateTempId() {
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_STEP: () => StepFormData = () => ({
  tempId: generateTempId(),
  daysOverdue: 1,
  channel: 'EMAIL',
  templateType: 'FRIENDLY_REMINDER',
  message: '',
});

// ============================================================================
// COMPONENT
// ============================================================================

export function EscalationConfigModal({
  open,
  onOpenChange,
  escalationId,
  onSaved,
}: EscalationConfigModalProps) {
  const isEditing = !!escalationId;
  const [activeSection, setActiveSection] = useState<SectionId>('basic');

  // Form state
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState<StepFormData[]>([DEFAULT_STEP()]);
  const [sectionErrors, setSectionErrors] = useState<Record<string, boolean>>(
    {}
  );

  // Fetch existing data for edit
  const { data: existingData } = useEscalation(escalationId ?? '');

  useEffect(() => {
    if (existingData?.escalation) {
      const esc = existingData.escalation;
      setName(esc.name);
      setIsDefault(esc.isDefault);
      setIsActive(esc.isActive);
      setSteps(
        esc.steps.map((s) => ({
          tempId: s.id ?? generateTempId(),
          daysOverdue: s.daysOverdue,
          channel: s.channel,
          templateType: s.templateType,
          message: s.message,
        }))
      );
    }
  }, [existingData]);

  // Reset on open
  useEffect(() => {
    if (open && !isEditing) {
      setActiveSection('basic');
      setName('');
      setIsDefault(false);
      setIsActive(true);
      setSteps([DEFAULT_STEP()]);
      setSectionErrors({});
    }
  }, [open, isEditing]);

  // Step management
  const addStep = useCallback(() => {
    setSteps((prev) => [...prev, DEFAULT_STEP()]);
  }, []);

  const removeStep = useCallback((tempId: string) => {
    setSteps((prev) => prev.filter((s) => s.tempId !== tempId));
  }, []);

  const updateStep = useCallback(
    (tempId: string, field: keyof StepFormData, value: unknown) => {
      setSteps((prev) =>
        prev.map((s) => (s.tempId === tempId ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  const moveStep = useCallback((tempId: string, direction: 'up' | 'down') => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.tempId === tempId);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);

  // Mutations
  const createMutation = useCreateEscalation();
  const updateMutation = useUpdateEscalation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSave = useCallback(async () => {
    // Validate
    const errors: Record<string, boolean> = {};
    if (!name.trim()) errors.basic = true;
    if (steps.length === 0) errors.steps = true;
    setSectionErrors(errors);
    if (Object.keys(errors).length > 0) {
      setActiveSection(Object.keys(errors)[0] as SectionId);
      return;
    }

    const stepsPayload: Omit<EscalationStep, 'id'>[] = steps.map((s, i) => ({
      daysOverdue: s.daysOverdue,
      channel: s.channel,
      templateType: s.templateType,
      message: s.message,
      order: i + 1,
    }));

    try {
      if (isEditing && escalationId) {
        await updateMutation.mutateAsync({
          id: escalationId,
          data: { name, isDefault, isActive, steps: stepsPayload },
        });
        toast.success('Régua de cobrança atualizada com sucesso!');
      } else {
        await createMutation.mutateAsync({
          name,
          isDefault,
          isActive,
          steps: stepsPayload,
        });
        toast.success('Régua de cobrança criada com sucesso!');
      }
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error(
        isEditing
          ? 'Erro ao atualizar régua de cobrança.'
          : 'Erro ao criar régua de cobrança.'
      );
    }
  }, [
    name,
    isDefault,
    isActive,
    steps,
    isEditing,
    escalationId,
    createMutation,
    updateMutation,
    onSaved,
    onOpenChange,
  ]);

  const handleClose = useCallback(
    (val: boolean) => {
      if (isPending) return;
      onOpenChange(val);
    },
    [isPending, onOpenChange]
  );

  // Sections
  const sections: NavigationSection[] = useMemo(
    () => [
      {
        id: 'basic',
        label: 'Dados Básicos',
        icon: <FileText className="h-4 w-4" />,
        description: 'Nome e configurações gerais',
      },
      {
        id: 'steps',
        label: 'Etapas de Cobrança',
        icon: <Layers className="h-4 w-4" />,
        description: 'Canais, prazos e mensagens',
      },
    ],
    []
  );

  return (
    <NavigationWizardDialog
      open={open}
      onOpenChange={handleClose}
      title={isEditing ? 'Editar Régua de Cobrança' : 'Nova Régua de Cobrança'}
      subtitle="Configure as etapas de cobrança automática"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={(id) => setActiveSection(id as SectionId)}
      sectionErrors={sectionErrors}
      isPending={isPending}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : isEditing ? (
              'Salvar Alterações'
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Criar Régua
              </>
            )}
          </Button>
        </>
      }
    >
      {/* Section: Dados Básicos */}
      {activeSection === 'basic' && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="esc-name">
              Nome <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="esc-name"
              placeholder="Ex: Régua Padrão, Cobrança Agressiva..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={isDefault}
              onCheckedChange={setIsDefault}
              id="esc-default"
              disabled={isPending}
            />
            <Label htmlFor="esc-default" className="text-sm">
              Definir como régua padrão
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              id="esc-active"
              disabled={isPending}
            />
            <Label htmlFor="esc-active" className="text-sm">
              Régua ativa
            </Label>
          </div>
        </div>
      )}

      {/* Section: Etapas de Cobrança */}
      {activeSection === 'steps' && (
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div
              key={step.tempId}
              className="rounded-lg border border-border p-4 space-y-3 bg-white dark:bg-slate-800/60"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">
                  Etapa {idx + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveStep(step.tempId, 'up')}
                    disabled={idx === 0 || isPending}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => moveStep(step.tempId, 'down')}
                    disabled={idx === steps.length - 1 || isPending}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  {steps.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-rose-500 hover:text-rose-600"
                      onClick={() => removeStep(step.tempId)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Dias Vencidos</Label>
                  <Input
                    type="number"
                    min={1}
                    value={step.daysOverdue}
                    onChange={(e) =>
                      updateStep(
                        step.tempId,
                        'daysOverdue',
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="h-8"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Canal</Label>
                  <Select
                    value={step.channel}
                    onValueChange={(v) =>
                      updateStep(step.tempId, 'channel', v)
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ESCALATION_CHANNEL_LABELS).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo</Label>
                  <Select
                    value={step.templateType}
                    onValueChange={(v) =>
                      updateStep(step.tempId, 'templateType', v)
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ESCALATION_TEMPLATE_LABELS).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Mensagem</Label>
                <Textarea
                  value={step.message}
                  onChange={(e) =>
                    updateStep(step.tempId, 'message', e.target.value)
                  }
                  placeholder={PLACEHOLDER_HINTS}
                  rows={3}
                  className="text-sm resize-none"
                  disabled={isPending}
                />
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addStep}
            disabled={isPending}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Etapa
          </Button>
        </div>
      )}
    </NavigationWizardDialog>
  );
}
