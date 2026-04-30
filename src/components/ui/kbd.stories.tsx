import type { Meta, StoryObj } from '@storybook/react';
import { Kbd, KbdGroup } from './kbd';

const meta = {
  title: 'UI/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: '⌘' },
};

export const Combo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Combinações usam `KbdGroup` para alinhar várias teclas com separador `+` textual.',
      },
    },
  },
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <span className="text-xs text-muted-foreground">+</span>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};

export const ComboMultiple: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-2 text-sm">
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <span className="text-xs text-muted-foreground">+</span>
        <Kbd>Shift</Kbd>
        <span className="text-xs text-muted-foreground">+</span>
        <Kbd>P</Kbd>
      </KbdGroup>
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <span className="text-xs text-muted-foreground">+</span>
        <Kbd>Enter</Kbd>
      </KbdGroup>
    </div>
  ),
};

export const Sizes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'O componente não expõe `cva`, mas a altura/padding pode ser ajustada via `className` (ex: `h-6 px-1.5 text-sm`).',
      },
    },
  },
  render: () => (
    <div className="flex items-center gap-4">
      <Kbd className="h-4 px-1 text-[10px]">⌘</Kbd>
      <Kbd>⌘</Kbd>
      <Kbd className="h-6 px-1.5 text-sm">⌘</Kbd>
      <Kbd className="h-7 px-2 text-base">⌘</Kbd>
    </div>
  ),
};

export const InContext: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Uso típico inline em descrições, dicas e empty states. O `Kbd` é `pointer-events-none` por padrão.',
      },
    },
  },
  render: () => (
    <p className="max-w-md text-sm text-muted-foreground">
      Pressione{' '}
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>{' '}
      para abrir a busca global e{' '}
      <KbdGroup>
        <Kbd>Esc</Kbd>
      </KbdGroup>{' '}
      para fechar.
    </p>
  ),
};

export const Status: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Padrão de “atalho ao lado de ação” — usado em itens de menu e barras de comando.',
      },
    },
  },
  render: () => (
    <div className="flex w-64 items-center justify-between rounded-md border px-3 py-2 text-sm">
      <span>Buscar produtos</span>
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </div>
  ),
};
