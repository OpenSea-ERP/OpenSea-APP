import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Label } from './label';
import { Slider } from './slider';

const meta = {
  title: 'UI/Slider',
  component: Slider,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultRender() {
  const [value, setValue] = useState([40]);
  return (
    <div className="w-80">
      <Slider
        value={value}
        onValueChange={setValue}
        max={100}
        step={1}
        aria-label="Volume"
        aria-valuetext={`${value[0]} por cento`}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultRender />,
};

function RangeRender() {
  const [value, setValue] = useState([20, 80]);
  return (
    <div className="w-80 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <Label>Faixa de preço</Label>
        <span className="text-muted-foreground">
          R$ {value[0]} – R$ {value[1]}
        </span>
      </div>
      <Slider
        value={value}
        onValueChange={setValue}
        min={0}
        max={100}
        step={1}
        aria-label="Faixa de preço"
        aria-valuetext={`Entre R$ ${value[0]} e R$ ${value[1]}`}
      />
    </div>
  );
}

export const Range: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Range com dois polegares — passe um array com dois valores em `value`/`defaultValue`.',
      },
    },
  },
  render: () => <RangeRender />,
};

function WithStepsRender() {
  const [value, setValue] = useState([50]);
  return (
    <div className="w-80 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <Label>Nível de zoom</Label>
        <span className="text-muted-foreground">{value[0]}%</span>
      </div>
      <Slider
        value={value}
        onValueChange={setValue}
        min={0}
        max={100}
        step={10}
        aria-label="Nível de zoom"
        aria-valuetext={`${value[0]} por cento`}
      />
    </div>
  );
}

export const WithSteps: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Use `step` para discretizar o valor. Combine com `min`/`max` para limites do domínio.',
      },
    },
  },
  render: () => <WithStepsRender />,
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <Slider
        defaultValue={[35]}
        max={100}
        step={1}
        disabled
        aria-label="Slider desabilitado"
      />
    </div>
  ),
};

function WithLabelRender() {
  const [value, setValue] = useState([72]);
  return (
    <div className="w-80 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <Label htmlFor="slider-brilho">Brilho</Label>
        <span className="font-medium tabular-nums">{value[0]}%</span>
      </div>
      <Slider
        id="slider-brilho"
        value={value}
        onValueChange={setValue}
        max={100}
        step={1}
        aria-valuetext={`Brilho ${value[0]} por cento`}
      />
    </div>
  );
}

export const WithLabel: Story = {
  render: () => <WithLabelRender />,
};

function VerticalRender() {
  const [value, setValue] = useState([60]);
  return (
    <div className="flex h-56 items-center gap-3">
      <Slider
        orientation="vertical"
        value={value}
        onValueChange={setValue}
        max={100}
        step={1}
        aria-label="Equalizador"
        aria-valuetext={`${value[0]} por cento`}
      />
      <span className="text-sm text-muted-foreground tabular-nums">
        {value[0]}%
      </span>
    </div>
  );
}

export const Vertical: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`orientation="vertical"` — o pai precisa de altura definida (ex: `h-56`) e o componente herda `min-h-44`.',
      },
    },
  },
  render: () => <VerticalRender />,
};
