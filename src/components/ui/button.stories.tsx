import type { Meta, StoryObj } from '@storybook/react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { expect } from 'vitest';
import { page } from '@vitest/browser/context';
import { Button } from './button';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
        'text',
      ],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'plan', 'lg', 'icon', 'icon-sm', 'icon-lg'],
    },
    disabled: { control: 'boolean' },
  },
  args: { children: 'Botão padrão' },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllVariants: Story = {
  tags: ['visual'],
  render: () => (
    <div data-testid="button-all-variants" className="flex flex-wrap gap-3">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="text">Text</Button>
    </div>
  ),
  play: async () => {
    await expect
      .element(page.getByTestId('button-all-variants'))
      .toMatchScreenshot('button-all-variants');
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Pequeno</Button>
      <Button size="default">Padrão</Button>
      <Button size="lg">Grande</Button>
      <Button size="plan">Plan</Button>
      <Button size="icon">
        <Plus className="size-4" />
      </Button>
      <Button size="icon-sm">
        <Plus className="size-4" />
      </Button>
      <Button size="icon-lg">
        <Plus className="size-5" />
      </Button>
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true } };

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <Loader2 className="size-4 animate-spin" />
        Carregando...
      </>
    ),
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Plus className="size-4" />
        Novo item
      </>
    ),
  },
};

export const DestructiveWithIcon: Story = {
  args: {
    variant: 'destructive',
    children: (
      <>
        <Trash2 className="size-4" />
        Excluir
      </>
    ),
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  parameters: { backgrounds: { default: 'dark' } },
  args: { children: 'Botão em modo escuro' },
};
