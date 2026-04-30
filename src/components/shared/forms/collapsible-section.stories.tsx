import type { Meta, StoryObj } from '@storybook/react';
import {
  AlertTriangle,
  Banknote,
  Cog,
  Download,
  Leaf,
  Mail,
  Sparkles,
} from 'lucide-react';
import { CollapsibleSection } from './collapsible-section';

const meta = {
  title: 'Shared/Forms/CollapsibleSection',
  component: CollapsibleSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Card de seção colapsável (header com ícone + título + subtítulo). Usado em formulários longos para agrupar campos. Aceita 7 tonalidades via prop `accent` (`violet | sky | emerald | amber | rose | teal | slate`). Header é um `<button>` (via Radix `CollapsibleTrigger asChild`), portanto alcançável por leitor de tela.',
      },
    },
  },
} satisfies Meta<typeof CollapsibleSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const SampleBody = () => (
  <div className="space-y-3 pt-4">
    <p className="text-sm text-muted-foreground">
      Conteúdo da seção. Aqui entram campos do formulário, controles ou qualquer
      outro conteúdo arbitrário.
    </p>
    <ul className="text-sm list-disc pl-5 space-y-1">
      <li>Item de exemplo 1</li>
      <li>Item de exemplo 2</li>
      <li>Item de exemplo 3</li>
    </ul>
  </div>
);

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Configuração padrão — accent `violet`, `defaultOpen=true`, com subtítulo.',
      },
    },
  },
  render: () => (
    <div className="w-[640px]">
      <CollapsibleSection
        icon={Sparkles}
        title="Configurações gerais"
        subtitle="Preferências básicas da sua conta"
      >
        <SampleBody />
      </CollapsibleSection>
    </div>
  ),
};

export const StartCollapsed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`defaultOpen=false` — seção começa fechada; clique no header para expandir.',
      },
    },
  },
  render: () => (
    <div className="w-[640px]">
      <CollapsibleSection
        icon={Cog}
        title="Configurações avançadas"
        subtitle="Para usuários experientes"
        defaultOpen={false}
      >
        <SampleBody />
      </CollapsibleSection>
    </div>
  ),
};

export const NoSubtitle: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Sem `subtitle` — apenas título; útil para seções com nome auto-explicativo.',
      },
    },
  },
  render: () => (
    <div className="w-[640px]">
      <CollapsibleSection icon={Download} title="Exportação">
        <SampleBody />
      </CollapsibleSection>
    </div>
  ),
};

export const AllAccents: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Paleta completa de 7 tonalidades (`accent`). Cada cor tem variante light/dark coordenada com o sistema de tons da aplicação.',
      },
    },
  },
  render: () => (
    <div className="bg-background min-h-screen p-6">
      <div className="mx-auto w-full max-w-2xl space-y-3">
        <CollapsibleSection
          icon={Sparkles}
          title="Violet (default)"
          subtitle="Tom padrão do sistema"
          accent="violet"
          defaultOpen={false}
        >
          <SampleBody />
        </CollapsibleSection>
        <CollapsibleSection
          icon={Mail}
          title="Sky"
          subtitle="Comunicação / informacional"
          accent="sky"
          defaultOpen={false}
        >
          <SampleBody />
        </CollapsibleSection>
        <CollapsibleSection
          icon={Leaf}
          title="Emerald"
          subtitle="Sucesso / receitas"
          accent="emerald"
          defaultOpen={false}
        >
          <SampleBody />
        </CollapsibleSection>
        <CollapsibleSection
          icon={AlertTriangle}
          title="Amber"
          subtitle="Atenção / pendências"
          accent="amber"
          defaultOpen={false}
        >
          <SampleBody />
        </CollapsibleSection>
        <CollapsibleSection
          icon={AlertTriangle}
          title="Rose"
          subtitle="Destrutivo (substitui red — ver §9.1)"
          accent="rose"
          defaultOpen={false}
        >
          <SampleBody />
        </CollapsibleSection>
        <CollapsibleSection
          icon={Banknote}
          title="Teal"
          subtitle="Financeiro / contábil"
          accent="teal"
          defaultOpen={false}
        >
          <SampleBody />
        </CollapsibleSection>
        <CollapsibleSection
          icon={Cog}
          title="Slate"
          subtitle="Neutro / configuração"
          accent="slate"
          defaultOpen={false}
        >
          <SampleBody />
        </CollapsibleSection>
      </div>
    </div>
  ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  parameters: {
    docs: {
      description: {
        story: 'Mesma seção em tema escuro — accent claro vira `*-500/8`.',
      },
    },
  },
  render: () => (
    <div className="w-[640px]">
      <CollapsibleSection
        icon={Sparkles}
        title="Configurações gerais"
        subtitle="Preferências básicas da sua conta"
      >
        <SampleBody />
      </CollapsibleSection>
    </div>
  ),
};
