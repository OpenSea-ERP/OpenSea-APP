import type { Meta, StoryObj } from '@storybook/react';
import { CopyButton } from './copy-button';

const meta = {
  title: 'Shared/CopyButton',
  component: CopyButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Botão para copiar conteúdo para a área de transferência via `navigator.clipboard.writeText`. Mostra `Check` por 2s após sucesso e dispara toast (`sonner`). Possui `Tooltip` com texto descritivo. **Gap A11y:** o componente não define `aria-label` explícito no `<Button>` — o tooltip ajuda visualmente, mas leitores de tela ficam dependentes do `tooltipText`. Recomenda-se adicionar `aria-label={tooltipText}` no botão e `aria-live="polite"` para anunciar o "Copiado!".',
      },
    },
  },
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: 'OPENSEA-TENANT-001',
    tooltipText: 'Copiar identificador',
    successMessage: 'Identificador copiado',
  },
};

export const Copied: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado pós-clique: o ícone vira `Check` verde e o tooltip troca para "Copiado!" por 2s. **Gap:** o componente não expõe prop `defaultCopied` para forçar o estado em testes visuais — clique no botão para visualizar.',
      },
    },
  },
  args: {
    content: 'sk_live_abc_123',
    tooltipText: 'Copiar token',
    successMessage: 'Token copiado',
  },
};

export const Sizes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tamanhos disponíveis: `sm`, `default`, `lg`, `icon`.',
      },
    },
  },
  render: () => (
    <div className="flex items-center gap-3">
      <CopyButton content="abc-001" size="sm" tooltipText="sm" />
      <CopyButton content="abc-002" size="default" tooltipText="default" />
      <CopyButton content="abc-003" size="lg" tooltipText="lg" />
      <CopyButton content="abc-004" size="icon" tooltipText="icon" />
    </div>
  ),
};

export const Inline: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Uso inline ao lado de um valor — padrão típico em campos de identificador / token.',
      },
    },
  },
  render: () => (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
      <code className="text-sm font-mono">tnt_abc123def456</code>
      <CopyButton
        content="tnt_abc123def456"
        variant="ghost"
        size="sm"
        tooltipText="Copiar tenant id"
        successMessage="Tenant id copiado"
      />
    </div>
  ),
};
