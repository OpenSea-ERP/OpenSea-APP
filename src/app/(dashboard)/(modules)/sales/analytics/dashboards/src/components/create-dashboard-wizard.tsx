'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { useCreateDashboard } from '@/hooks/sales/use-analytics';
import { ApiError } from '@/lib/errors/api-error';
import { translateError } from '@/lib/error-messages';
import type {
  DashboardRole,
  DashboardVisibility,
  CreateDashboardRequest,
} from '@/types/sales';
import { Check, LayoutDashboard, Loader2, Settings } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ─── Local Types ───────────────────────────────────────────────

interface CreateDashboardWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_OPTIONS: { value: DashboardRole | ''; label: string }[] = [
  { value: '', label: 'Nenhum (generico)' },
  { value: 'SELLER', label: 'Vendedor' },
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'DIRECTOR', label: 'Diretor' },
  { value: 'BID_SPECIALIST', label: 'Especialista em Licitações' },
  { value: 'MARKETPLACE_OPS', label: 'Operacoes Marketplace' },
  { value: 'CASHIER', label: 'Caixa' },
];

const VISIBILITY_OPTIONS: { value: DashboardVisibility; label: string }[] = [
  { value: 'PRIVATE', label: 'Privado (somente você)' },
  { value: 'TEAM', label: 'Equipe' },
  { value: 'TENANT', label: 'Todos da empresa' },
];

// ─── Step 1: Informações do Dashboard ─────────────────────────

function StepDashboardInfo({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  fieldErrors,
}: {
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  fieldErrors: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Dashboard *</Label>
        <div className="relative">
          <Input
            placeholder="Ex: Painel de Vendas Mensal"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            aria-invalid={!!fieldErrors.name}
          />
          <FormErrorIcon message={fieldErrors.name} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          placeholder="Descreva o proposito deste dashboard..."
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}

// ─── Step 2: Configuracoes ─────────────────────────────────────

function StepConfig({
  role,
  onRoleChange,
  visibility,
  onVisibilityChange,
}: {
  role: string;
  onRoleChange: (v: string) => void;
  visibility: DashboardVisibility;
  onVisibilityChange: (v: DashboardVisibility) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Perfil Alvo</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={role}
          onChange={e => onRoleChange(e.target.value)}
        >
          {ROLE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Selecione um perfil para filtrar os widgets mais relevantes.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Visibilidade *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={visibility}
          onChange={e =>
            onVisibilityChange(e.target.value as DashboardVisibility)
          }
        >
          {VISIBILITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
        <p>
          Apos criar o dashboard, você podera adicionar e configurar widgets de
          visualização de dados na página de edicao.
        </p>
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreateDashboardWizard({
  open,
  onOpenChange,
}: CreateDashboardWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Step 2 state
  const [role, setRole] = useState('');
  const [visibility, setVisibility] = useState<DashboardVisibility>('PRIVATE');

  const createDashboard = useCreateDashboard();
  const isSubmitting = createDashboard.isPending;
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setName('');
    setDescription('');
    setRole('');
    setVisibility('PRIVATE');
    setFieldErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  async function handleSubmit() {
    const payload: CreateDashboardRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      role: role ? (role as DashboardRole) : undefined,
      visibility,
    };

    try {
      await createDashboard.mutateAsync(payload);
      toast.success('Dashboard criado com sucesso.');
      handleClose();
    } catch (err) {
      const apiError = ApiError.from(err);
      const fieldMap: Record<string, string> = {
        'name already': 'name',
        'Dashboard name already': 'name',
      };
      let mapped = false;
      if (apiError.fieldErrors?.length) {
        const errors: Record<string, string> = {};
        for (const fe of apiError.fieldErrors) {
          errors[fe.field] = translateError(fe.message);
          mapped = true;
        }
        if (mapped) {
          setFieldErrors(errors);
          setCurrentStep(1);
        }
      }
      if (!mapped) {
        for (const [pattern, field] of Object.entries(fieldMap)) {
          if (apiError.message.includes(pattern)) {
            setFieldErrors({ [field]: translateError(apiError.message) });
            setCurrentStep(1);
            mapped = true;
            break;
          }
        }
      }
      if (!mapped) {
        toast.error(translateError(apiError.message));
      }
    }
  }

  const step1Valid = name.trim().length > 0;

  const steps: WizardStep[] = [
    {
      title: 'Informações do Dashboard',
      description: 'Defina o nome e descrição do dashboard.',
      icon: (
        <LayoutDashboard
          className="h-16 w-16 text-purple-400"
          strokeWidth={1.2}
        />
      ),
      content: (
        <StepDashboardInfo
          name={name}
          onNameChange={v => {
            setName(v);
            setFieldErrors(prev => {
              const { name: _, ...rest } = prev;
              return rest;
            });
          }}
          description={description}
          onDescriptionChange={setDescription}
          fieldErrors={fieldErrors}
        />
      ),
      isValid: step1Valid,
    },
    {
      title: 'Configuracoes',
      description: 'Defina o perfil e visibilidade do dashboard.',
      icon: (
        <Settings className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <StepConfig
          role={role}
          onRoleChange={setRole}
          visibility={visibility}
          onVisibilityChange={setVisibility}
        />
      ),
      isValid: true,
      footer: (
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Dashboard
        </Button>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
