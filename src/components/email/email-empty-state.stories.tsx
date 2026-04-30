import type { Meta, StoryObj } from '@storybook/react';
import { EmailEmptyState } from './email-empty-state';

const meta = {
  title: 'Tools/Email/EmailEmptyState',
  component: EmailEmptyState,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Empty state full-body do módulo de e-mail — substitui todo o layout de 3 painéis (sidebar + lista + display) quando o usuário ainda não configurou nenhuma conta IMAP/SMTP. Único CTA primário "Adicionar conta" para o wizard de configuração.',
      },
    },
  },
} satisfies Meta<typeof EmailEmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { onAddAccount: () => {} },
  render: args => (
    <div className="flex h-screen w-full">
      <EmailEmptyState {...args} />
    </div>
  ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: { onAddAccount: () => {} },
  render: args => (
    <div className="flex h-screen w-full bg-background">
      <EmailEmptyState {...args} />
    </div>
  ),
};

export const Mobile: Story = {
  args: { onAddAccount: () => {} },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  render: args => (
    <div className="flex h-screen w-full">
      <EmailEmptyState {...args} />
    </div>
  ),
};

export const NoLayoutCard: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Demonstra a render direta dentro de um container truncado — útil para verificar o comportamento de centralização sem o flex parent fullscreen.',
      },
    },
  },
  args: { onAddAccount: () => {} },
  render: args => (
    <div className="flex h-[600px] w-full rounded-xl border border-border bg-background">
      <EmailEmptyState {...args} />
    </div>
  ),
};
