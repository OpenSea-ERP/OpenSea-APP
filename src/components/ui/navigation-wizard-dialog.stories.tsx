import type { Meta, StoryObj } from '@storybook/react';
import {
  Bell,
  CreditCard,
  FileText,
  Lock,
  Settings,
  Shield,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import {
  NavigationWizardDialog,
  type NavigationSection,
} from './navigation-wizard-dialog';

// NavigationWizardDialog has a sidebar (compact|detailed variants) on desktop
// and a chip-rail on mobile. Steps are non-linear — the user clicks any
// section to navigate. There is no built-in branching API; "branching" is
// emulated by toggling `hidden` on sections based on the user's choice.

const meta = {
  title: 'UI/NavigationWizardDialog',
  component: NavigationWizardDialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof NavigationWizardDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultRender() {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState('profile');

  const sections: NavigationSection[] = [
    {
      id: 'profile',
      label: 'Perfil',
      icon: <User className="h-4 w-4" />,
      description: 'Dados pessoais e contato',
    },
    {
      id: 'notifications',
      label: 'Notificações',
      icon: <Bell className="h-4 w-4" />,
      description: 'Como queremos te avisar',
    },
    {
      id: 'security',
      label: 'Segurança',
      icon: <Shield className="h-4 w-4" />,
      description: 'Senha, MFA e sessões',
    },
    {
      id: 'billing',
      label: 'Faturamento',
      icon: <CreditCard className="h-4 w-4" />,
      description: 'Cartões e plano atual',
    },
  ];

  const content: Record<string, React.ReactNode> = {
    profile: (
      <div className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="nav-name">Nome</Label>
          <Input id="nav-name" placeholder="Maria Silva" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nav-email">E-mail</Label>
          <Input
            id="nav-email"
            type="email"
            placeholder="maria@empresa.com.br"
          />
        </div>
      </div>
    ),
    notifications: (
      <p className="text-sm text-muted-foreground">
        Configure quais e-mails e push notifications você quer receber.
      </p>
    ),
    security: (
      <p className="text-sm text-muted-foreground">
        Gerencie sua senha, autenticação em dois fatores e sessões ativas.
      </p>
    ),
    billing: (
      <p className="text-sm text-muted-foreground">
        Métodos de pagamento, faturas e plano atual.
      </p>
    ),
  };

  return (
    <NavigationWizardDialog
      open={open}
      onOpenChange={setOpen}
      title="Configurações"
      subtitle="Gerencie sua conta e preferências"
      sections={sections}
      activeSection={active}
      onSectionChange={setActive}
      footer={
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => setOpen(false)}>Salvar alterações</Button>
        </>
      }
    >
      {content[active]}
    </NavigationWizardDialog>
  );
}

export const Default: Story = {
  render: () => <DefaultRender />,
};

function BranchingRender() {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState('type');
  const [accountType, setAccountType] = useState<'pf' | 'pj' | null>(null);

  // Branching is emulated via `hidden`: PF-only and PJ-only sections appear
  // depending on the choice in the first step. There is no native branching
  // API in NavigationWizardDialog.
  const sections: NavigationSection[] = [
    {
      id: 'type',
      label: 'Tipo de conta',
      icon: <User className="h-4 w-4" />,
      description: 'PF ou PJ?',
    },
    {
      id: 'pf-docs',
      label: 'Documentos PF',
      icon: <FileText className="h-4 w-4" />,
      description: 'CPF e RG',
      hidden: accountType !== 'pf',
    },
    {
      id: 'pj-docs',
      label: 'Documentos PJ',
      icon: <FileText className="h-4 w-4" />,
      description: 'CNPJ e contrato social',
      hidden: accountType !== 'pj',
    },
    {
      id: 'review',
      label: 'Revisão',
      icon: <Settings className="h-4 w-4" />,
      hidden: accountType === null,
    },
  ];

  return (
    <NavigationWizardDialog
      open={open}
      onOpenChange={setOpen}
      title="Cadastro"
      subtitle="Branching baseado no tipo de conta"
      sections={sections}
      activeSection={active}
      onSectionChange={setActive}
      footer={
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => setOpen(false)}>Concluir</Button>
        </>
      }
    >
      {active === 'type' && (
        <div className="flex gap-3">
          <Button
            variant={accountType === 'pf' ? 'default' : 'outline'}
            onClick={() => {
              setAccountType('pf');
              setActive('pf-docs');
            }}
          >
            Pessoa Física
          </Button>
          <Button
            variant={accountType === 'pj' ? 'default' : 'outline'}
            onClick={() => {
              setAccountType('pj');
              setActive('pj-docs');
            }}
          >
            Pessoa Jurídica
          </Button>
        </div>
      )}
      {active === 'pf-docs' && (
        <p className="text-sm text-muted-foreground">
          Envie cópia digital do CPF e RG.
        </p>
      )}
      {active === 'pj-docs' && (
        <p className="text-sm text-muted-foreground">
          Envie cartão CNPJ e contrato social atualizado.
        </p>
      )}
      {active === 'review' && (
        <p className="text-sm text-muted-foreground">
          Revisar e enviar para análise.
        </p>
      )}
    </NavigationWizardDialog>
  );
}

export const Branching: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'API gap: o componente não tem branching nativo. Esta story emula branches alternando `hidden` em cada seção conforme o estado externo (PF vs PJ).',
      },
    },
  },
  render: () => <BranchingRender />,
};

function WithSummaryRender() {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState('summary');
  const errors = { security: true };

  const sections: NavigationSection[] = [
    {
      id: 'profile',
      label: 'Perfil',
      icon: <User className="h-4 w-4" />,
      badge: (
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          OK
        </span>
      ),
    },
    {
      id: 'security',
      label: 'Segurança',
      icon: <Lock className="h-4 w-4" />,
      badge: (
        <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
          Pendente
        </span>
      ),
    },
    {
      id: 'billing',
      label: 'Faturamento',
      icon: <CreditCard className="h-4 w-4" />,
      badge: (
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          OK
        </span>
      ),
    },
    {
      id: 'summary',
      label: 'Resumo',
      icon: <FileText className="h-4 w-4" />,
      description: 'Tudo em um lugar',
    },
  ];

  return (
    <NavigationWizardDialog
      open={open}
      onOpenChange={setOpen}
      title="Onboarding"
      subtitle="Status por etapa visível na navegação"
      sections={sections}
      activeSection={active}
      onSectionChange={setActive}
      sectionErrors={errors}
      variant="detailed"
      footer={
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Voltar mais tarde
          </Button>
          <Button onClick={() => setOpen(false)}>Finalizar</Button>
        </>
      }
    >
      {active === 'summary' ? (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">Resumo das etapas concluídas:</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Perfil — completo
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Segurança — pendente (configurar 2FA)
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Faturamento — completo
            </li>
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Conteúdo da seção {active}.
        </p>
      )}
    </NavigationWizardDialog>
  );
}

export const WithSummary: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Variante `detailed` com badges por seção + `sectionErrors` (ponto vermelho indicando pendência). Última seção exibe um resumo agregado.',
      },
    },
  },
  render: () => <WithSummaryRender />,
};
