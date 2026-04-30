import type { Meta, StoryObj } from '@storybook/react';
import { Building2, CheckCircle2, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { StepWizardDialog, type WizardStep } from './step-wizard-dialog';

// StepWizardDialog renders an icon column on the left + title/content/footer
// on the right. Each step controls its own validity via `isValid` and may
// override the footer entirely with `step.footer`.

const meta = {
  title: 'UI/StepWizardDialog',
  component: StepWizardDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof StepWizardDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultRender() {
  const [open, setOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  const steps: WizardStep[] = [
    {
      title: 'Identificação',
      description: 'Quem é o titular da conta?',
      icon: <User className="h-12 w-12 text-blue-500" />,
      content: (
        <div className="space-y-3">
          <Label htmlFor="wiz-name">Nome completo</Label>
          <Input id="wiz-name" placeholder="Maria Silva" />
        </div>
      ),
    },
    {
      title: 'Empresa',
      description: 'Dados da organização vinculada.',
      icon: <Building2 className="h-12 w-12 text-emerald-500" />,
      content: (
        <div className="space-y-3">
          <Label htmlFor="wiz-org">Razão social</Label>
          <Input id="wiz-org" placeholder="Empresa Demo Ltda" />
        </div>
      ),
    },
    {
      title: 'Confirmação',
      description: 'Tudo pronto para concluir.',
      icon: <CheckCircle2 className="h-12 w-12 text-violet-500" />,
      content: (
        <p className="text-sm text-muted-foreground">
          Revise as informações dos passos anteriores e finalize.
        </p>
      ),
      footer: <Button onClick={() => setOpen(false)}>Concluir</Button>,
    },
  ];

  return (
    <>
      {!open && (
        <Button
          onClick={() => {
            setOpen(true);
            setCurrentStep(1);
          }}
        >
          Abrir wizard
        </Button>
      )}
      <StepWizardDialog
        open={open}
        onOpenChange={setOpen}
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

export const Default: Story = {
  render: () => <DefaultRender />,
};

function WithValidationRender() {
  const [open, setOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const steps: WizardStep[] = [
    {
      title: 'E-mail de contato',
      description: 'Avançar só fica disponível com e-mail válido.',
      icon: <Mail className="h-12 w-12 text-blue-500" />,
      isValid: isEmailValid,
      content: (
        <div className="space-y-3">
          <Label htmlFor="wiz-email">E-mail</Label>
          <Input
            id="wiz-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="voce@empresa.com.br"
            aria-invalid={email.length > 0 && !isEmailValid}
          />
          {email.length > 0 && !isEmailValid && (
            <p className="text-xs text-destructive">
              Informe um e-mail válido.
            </p>
          )}
        </div>
      ),
    },
    {
      title: 'Pronto',
      description: 'E-mail confirmado.',
      icon: <CheckCircle2 className="h-12 w-12 text-emerald-500" />,
      content: (
        <p className="text-sm text-muted-foreground">
          Vamos enviar a confirmação para <strong>{email}</strong>.
        </p>
      ),
      footer: <Button onClick={() => setOpen(false)}>Concluir</Button>,
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={setOpen}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={() => setOpen(false)}
    />
  );
}

export const WithValidation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstração de `step.isValid` controlando o botão "Avançar". Enquanto o e-mail estiver inválido, o botão fica desabilitado.',
      },
    },
  },
  render: () => <WithValidationRender />,
};

function SkipAllowedRender() {
  const [open, setOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  // Optional step renders a custom footer letting the user "Pular".
  const steps: WizardStep[] = [
    {
      title: 'Foto de perfil',
      description: 'Opcional — você pode adicionar depois.',
      icon: <User className="h-12 w-12 text-blue-500" />,
      content: (
        <p className="text-sm text-muted-foreground">
          Arraste uma imagem ou clique para selecionar. Tamanho recomendado:
          512x512px.
        </p>
      ),
      footer: (
        <>
          <Button variant="outline" onClick={() => setCurrentStep(2)}>
            Pular
          </Button>
          <Button onClick={() => setCurrentStep(2)}>Enviar foto</Button>
        </>
      ),
    },
    {
      title: 'Pronto',
      icon: <CheckCircle2 className="h-12 w-12 text-emerald-500" />,
      content: (
        <p className="text-sm text-muted-foreground">
          Cadastro concluído. Você pode editar a foto a qualquer momento no
          perfil.
        </p>
      ),
      footer: <Button onClick={() => setOpen(false)}>Concluir</Button>,
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={setOpen}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={() => setOpen(false)}
    />
  );
}

export const SkipAllowed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Footer customizado oferece a opção "Pular" ao lado de "Enviar foto" — útil em campos opcionais.',
      },
    },
  },
  render: () => <SkipAllowedRender />,
};

function SubmittingFinalRender() {
  const [open, setOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(2);
  const [submitting, setSubmitting] = useState(true);

  const steps: WizardStep[] = [
    {
      title: 'Resumo',
      icon: <User className="h-12 w-12 text-blue-500" />,
      content: <p className="text-sm">Conferência de dados.</p>,
    },
    {
      title: 'Finalizando',
      description: 'Enviando informações para o servidor...',
      icon: <CheckCircle2 className="h-12 w-12 text-violet-500" />,
      content: (
        <div className="flex items-center justify-center py-6">
          <div className="size-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
      ),
      footer: (
        <Button disabled={submitting} onClick={() => setOpen(false)}>
          {submitting ? 'Enviando...' : 'Concluir'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <StepWizardDialog
        open={open}
        onOpenChange={setOpen}
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onClose={() => setOpen(false)}
      />
      <Button
        size="sm"
        variant="ghost"
        className="fixed bottom-2 right-2"
        onClick={() => setSubmitting(s => !s)}
      >
        toggle submitting
      </Button>
    </>
  );
}

export const SubmittingFinal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Última etapa simulando submissão em andamento. O footer custom desabilita o botão enquanto `submitting === true`.',
      },
    },
  },
  render: () => <SubmittingFinalRender />,
};
