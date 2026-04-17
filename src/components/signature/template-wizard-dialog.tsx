'use client';

/**
 * Signature template wizard.
 *
 * 3-step linear wizard using StepWizardDialog. Steps:
 *   1. Info       — name, description, signature level
 *   2. Rules      — routing type, reminder days, expiration days
 *   3. Signers    — dynamic list of signer slots (order, role, label)
 *
 * Used by the templates list page both to create and to edit templates. When
 * an `initialTemplate` is passed, the wizard pre-fills the fields and posts
 * to updateTemplate (TODO backend); otherwise it calls createTemplate.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StepWizardDialog } from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import { signatureTemplatesService } from '@/services/signature';
import type {
  CreateTemplateData,
  EnvelopeRoutingType,
  SignatureLevel,
  SignatureTemplate,
  SignerSlot,
} from '@/types/signature';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  FilePlus2,
  Loader2,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface TemplateWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTemplate?: SignatureTemplate | null;
}

interface TemplateFormState {
  name: string;
  description: string;
  signatureLevel: SignatureLevel;
  routingType: EnvelopeRoutingType;
  reminderDays: number;
  expirationDays: number | '';
  signerSlots: SignerSlot[];
}

const EMPTY_STATE: TemplateFormState = {
  name: '',
  description: '',
  signatureLevel: 'ADVANCED',
  routingType: 'SEQUENTIAL',
  reminderDays: 3,
  expirationDays: 15,
  signerSlots: [
    {
      order: 1,
      group: 1,
      role: 'SIGNER',
      label: 'Signatário Principal',
      signatureLevel: 'ADVANCED',
    },
  ],
};

function buildInitialState(
  template: SignatureTemplate | null | undefined
): TemplateFormState {
  if (!template) return { ...EMPTY_STATE };
  return {
    name: template.name,
    description: template.description ?? '',
    signatureLevel: template.signatureLevel,
    routingType: template.routingType,
    reminderDays: template.reminderDays,
    expirationDays: template.expirationDays ?? '',
    signerSlots: template.signerSlots.length
      ? template.signerSlots
      : EMPTY_STATE.signerSlots,
  };
}

export function TemplateWizardDialog({
  open,
  onOpenChange,
  initialTemplate,
}: TemplateWizardDialogProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<TemplateFormState>(
    buildInitialState(initialTemplate)
  );

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(initialTemplate));
      setCurrentStep(1);
    }
  }, [open, initialTemplate]);

  const isEdit = Boolean(initialTemplate);

  const mutation = useMutation({
    mutationFn: async (): Promise<SignatureTemplate> => {
      const payload: CreateTemplateData = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        signatureLevel: form.signatureLevel,
        routingType: form.routingType,
        signerSlots: form.signerSlots,
        reminderDays: form.reminderDays,
        expirationDays:
          form.expirationDays === '' ? undefined : form.expirationDays,
      };
      const response =
        isEdit && initialTemplate
          ? await signatureTemplatesService.updateTemplate(
              initialTemplate.id,
              payload
            )
          : await signatureTemplatesService.createTemplate(payload);
      return response.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature', 'templates'] });
      toast.success(
        isEdit ? 'Modelo atualizado com sucesso.' : 'Modelo criado com sucesso.'
      );
      onOpenChange(false);
    },
    onError: error => {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o modelo.';
      toast.error(message);
    },
  });

  const infoValid = form.name.trim().length >= 3;
  const rulesValid = form.reminderDays >= 0;
  const signersValid =
    form.signerSlots.length > 0 &&
    form.signerSlots.every(slot => slot.label.trim().length > 0);

  const handleAddSigner = () => {
    setForm(prev => ({
      ...prev,
      signerSlots: [
        ...prev.signerSlots,
        {
          order: prev.signerSlots.length + 1,
          group:
            prev.routingType === 'PARALLEL' ? 1 : prev.signerSlots.length + 1,
          role: 'SIGNER',
          label: `Signatário ${prev.signerSlots.length + 1}`,
          signatureLevel: prev.signatureLevel,
        },
      ],
    }));
  };

  const handleRemoveSigner = (index: number) => {
    setForm(prev => ({
      ...prev,
      signerSlots: prev.signerSlots.filter((_, position) => position !== index),
    }));
  };

  const handleUpdateSigner = <Field extends keyof SignerSlot>(
    index: number,
    field: Field,
    value: SignerSlot[Field]
  ) => {
    setForm(prev => ({
      ...prev,
      signerSlots: prev.signerSlots.map((slot, position) =>
        position === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  const steps = useMemo(
    () => [
      {
        title: isEdit ? 'Editar modelo' : 'Novo modelo de assinatura',
        description: 'Informações gerais do modelo reutilizável.',
        icon: <FilePlus2 className="h-10 w-10 text-violet-500" />,
        isValid: infoValid,
        content: (
          <div className="space-y-4">
            <div>
              <Label>Nome do modelo *</Label>
              <Input
                value={form.name}
                onChange={event =>
                  setForm(prev => ({ ...prev, name: event.target.value }))
                }
                placeholder="Ex.: Contrato padrão de serviços"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.description}
                onChange={event =>
                  setForm(prev => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Para quando este modelo deve ser usado..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nível padrão de assinatura</Label>
              <select
                value={form.signatureLevel}
                onChange={event =>
                  setForm(prev => ({
                    ...prev,
                    signatureLevel: event.target.value as SignatureLevel,
                  }))
                }
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="SIMPLE">Simples</option>
                <option value="ADVANCED">Avançada</option>
                <option value="QUALIFIED">Qualificada (ICP-Brasil)</option>
              </select>
            </div>
          </div>
        ),
      },
      {
        title: 'Regras de envio',
        description: 'Como o envelope se comporta ao ser enviado.',
        icon: <ClipboardList className="h-10 w-10 text-violet-500" />,
        isValid: rulesValid,
        content: (
          <div className="space-y-4">
            <div>
              <Label>Tipo de roteamento</Label>
              <select
                value={form.routingType}
                onChange={event =>
                  setForm(prev => ({
                    ...prev,
                    routingType: event.target.value as EnvelopeRoutingType,
                  }))
                }
                className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="SEQUENTIAL">Sequencial</option>
                <option value="PARALLEL">Paralelo</option>
                <option value="HYBRID">Híbrido</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Sequencial aguarda cada assinatura; paralelo envia a todos de
                uma vez; híbrido combina grupos.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Lembretes (dias)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.reminderDays}
                  onChange={event =>
                    setForm(prev => ({
                      ...prev,
                      reminderDays: Number(event.target.value) || 0,
                    }))
                  }
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Intervalo entre lembretes automáticos por e-mail.
                </p>
              </div>
              <div>
                <Label>Validade (dias)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.expirationDays}
                  onChange={event =>
                    setForm(prev => ({
                      ...prev,
                      expirationDays:
                        event.target.value === ''
                          ? ''
                          : Number(event.target.value),
                    }))
                  }
                  placeholder="Ex.: 15"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Após este prazo, o envelope expira automaticamente.
                </p>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Signatários',
        description: 'Defina os papéis que receberão o documento.',
        icon: <Users className="h-10 w-10 text-violet-500" />,
        isValid: signersValid,
        content: (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {form.signerSlots.length}{' '}
                {form.signerSlots.length === 1
                  ? 'signatário definido'
                  : 'signatários definidos'}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSigner}
              >
                <Plus className="mr-1 h-4 w-4" />
                Adicionar
              </Button>
            </div>

            {form.signerSlots.map((slot, index) => (
              <div
                key={`slot-${index}`}
                className="space-y-2 rounded-lg border bg-muted/30 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Slot {index + 1}
                  </span>
                  {form.signerSlots.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-rose-500"
                      onClick={() => handleRemoveSigner(index)}
                      aria-label="Remover slot"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Rótulo *</Label>
                    <Input
                      value={slot.label}
                      onChange={event =>
                        handleUpdateSigner(index, 'label', event.target.value)
                      }
                      placeholder="Ex.: Responsável Financeiro"
                      className="mt-0.5 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Papel</Label>
                    <select
                      value={slot.role}
                      onChange={event =>
                        handleUpdateSigner(index, 'role', event.target.value)
                      }
                      className="mt-0.5 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="SIGNER">Assinante</option>
                      <option value="APPROVER">Aprovador</option>
                      <option value="WITNESS">Testemunha</option>
                      <option value="REVIEWER">Revisor</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Ordem</Label>
                    <Input
                      type="number"
                      min={1}
                      value={slot.order}
                      onChange={event =>
                        handleUpdateSigner(
                          index,
                          'order',
                          Number(event.target.value) || 1
                        )
                      }
                      className="mt-0.5 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Grupo</Label>
                    <Input
                      type="number"
                      min={1}
                      value={slot.group}
                      onChange={event =>
                        handleUpdateSigner(
                          index,
                          'group',
                          Number(event.target.value) || 1
                        )
                      }
                      className="mt-0.5 h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ),
        footer: (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(2)}
            >
              ← Voltar
            </Button>
            <Button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={!signersValid || mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isEdit ? 'Salvar alterações' : 'Criar modelo'}
            </Button>
          </>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, infoValid, rulesValid, signersValid, isEdit, mutation.isPending]
  );

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      onClose={() => onOpenChange(false)}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      heightClass="h-[560px]"
    />
  );
}
