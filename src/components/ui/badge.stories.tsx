import type { Meta, StoryObj } from '@storybook/react';
import { CheckCircle2, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { expect } from 'vitest';
import { page } from '@vitest/browser/context';
import { Badge } from './badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'destructive',
        'success',
        'warning',
        'outline',
      ],
    },
  },
  args: { children: 'Badge padrão' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllVariants: Story = {
  tags: ['visual'],
  render: () => (
    <div data-testid="badge-all-variants" className="flex flex-wrap gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
  play: async () => {
    await expect
      .element(page.getByTestId('badge-all-variants'))
      .toMatchScreenshot('badge-all-variants');
  },
};

// Padrão de chips dual-theme (CLAUDE.md §9):
// light: bg-{color}-50 text-{color}-700
// dark:  bg-{color}-500/8 text-{color}-300
export const DualThemeChips: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Chips com paleta dual-theme (CLAUDE.md §9). `bg-{color}-50 text-{color}-700` no light; `bg-{color}-500/8 text-{color}-300` no dark. Use Badge com className quando precisar de cor semântica fora das variants base.',
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge
        variant="outline"
        className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/8 dark:text-emerald-300 dark:border-emerald-500/20"
      >
        Em dia
      </Badge>
      <Badge
        variant="outline"
        className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/8 dark:text-amber-300 dark:border-amber-500/20"
      >
        Pendente
      </Badge>
      <Badge
        variant="outline"
        className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/8 dark:text-rose-300 dark:border-rose-500/20"
      >
        Atrasado
      </Badge>
      <Badge
        variant="outline"
        className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/8 dark:text-sky-300 dark:border-sky-500/20"
      >
        Em análise
      </Badge>
      <Badge
        variant="outline"
        className="bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/8 dark:text-violet-300 dark:border-violet-500/20"
      >
        Beta
      </Badge>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="success">
        <CheckCircle2 aria-hidden="true" />
        Aprovado
      </Badge>
      <Badge variant="warning">
        <Clock aria-hidden="true" />
        Aguardando
      </Badge>
      <Badge variant="destructive">
        <ShieldAlert aria-hidden="true" />
        Bloqueado
      </Badge>
      <Badge variant="default">
        <Sparkles aria-hidden="true" />
        Novo
      </Badge>
    </div>
  ),
};

export const Status: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Status semânticos comuns em listagens (Ativo / Pendente / Suspenso) usando variants nativas.',
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge variant="success">Ativo</Badge>
      <Badge variant="warning">Pendente</Badge>
      <Badge variant="destructive">Suspenso</Badge>
    </div>
  ),
};
