import type { Meta, StoryObj } from '@storybook/react';
import { Bold, Italic, Underline } from 'lucide-react';
import { Toggle } from './toggle';

const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg'],
    },
    pressed: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    'aria-label': 'Alternar opção',
    children: 'Alternar',
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pressed: Story = {
  args: {
    defaultPressed: true,
    children: 'Ativado',
    'aria-label': 'Filtro ativado',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Indisponível',
    'aria-label': 'Filtro indisponível',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Toggle size="sm" aria-label="Negrito (pequeno)">
        <Bold />
      </Toggle>
      <Toggle size="default" aria-label="Negrito (padrão)">
        <Bold />
      </Toggle>
      <Toggle size="lg" aria-label="Negrito (grande)">
        <Bold />
      </Toggle>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Toggle variant="default" aria-label="Variante padrão">
        <Bold />
      </Toggle>
      <Toggle variant="outline" aria-label="Variante outline">
        <Bold />
      </Toggle>
    </div>
  ),
};

export const WithIcon: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Quando o conteúdo é apenas ícone, sempre forneça `aria-label` descrevendo o estado/ação.',
      },
    },
  },
  render: () => (
    <div className="flex items-center gap-2">
      <Toggle aria-label="Aplicar negrito">
        <Bold />
      </Toggle>
      <Toggle aria-label="Aplicar itálico">
        <Italic />
      </Toggle>
      <Toggle aria-label="Aplicar sublinhado">
        <Underline />
      </Toggle>
    </div>
  ),
};

export const WithIconAndText: Story = {
  render: () => (
    <Toggle aria-label="Aplicar negrito ao texto selecionado">
      <Bold />
      Negrito
    </Toggle>
  ),
};
