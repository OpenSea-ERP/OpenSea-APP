import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { Progress } from './progress';

const meta = {
  title: 'UI/Progress',
  component: Progress,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 50 },
  render: args => (
    <div className="w-80">
      <Progress {...args} />
    </div>
  ),
};

export const Empty: Story = {
  args: { value: 0 },
  render: args => (
    <div className="w-80">
      <Progress {...args} />
    </div>
  ),
};

export const Full: Story = {
  args: { value: 100 },
  render: args => (
    <div className="w-80">
      <Progress {...args} />
    </div>
  ),
};

export const WithLabel: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Padrão recomendado: rótulo visível + valor numérico + barra. O `Progress` deve receber `aria-label` ou ser ligado a um `<label>` próximo.',
      },
    },
  },
  render: () => (
    <div className="w-80 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Importação de produtos</span>
        <span className="text-muted-foreground">75% concluído</span>
      </div>
      <Progress value={75} aria-label="Importação de produtos: 75% concluído" />
    </div>
  ),
};

function AnimatedRender() {
  const [value, setValue] = useState(10);
  useEffect(() => {
    const timer = setTimeout(() => setValue(82), 400);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="w-80 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Sincronização</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <Progress
        value={value}
        aria-label={`Sincronização em andamento: ${value}%`}
      />
    </div>
  );
}

export const Animated: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'O componente possui transição suave nativa (`transition-all`). Animar entre valores reais (não indeterminado) é o caminho preferido.',
      },
    },
  },
  render: () => <AnimatedRender />,
};

export const Sizes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'O componente não expõe variantes via `cva`, mas a altura pode ser ajustada via `className` (ex: `h-1`, `h-3`).',
      },
    },
  },
  render: () => (
    <div className="w-80 space-y-4">
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Compacto (h-1)</span>
        <Progress value={40} className="h-1" aria-label="Progresso compacto" />
      </div>
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Padrão (h-2)</span>
        <Progress value={60} aria-label="Progresso padrão" />
      </div>
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Grande (h-3)</span>
        <Progress value={80} className="h-3" aria-label="Progresso grande" />
      </div>
    </div>
  ),
};
