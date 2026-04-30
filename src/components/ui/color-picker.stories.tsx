import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorPicker } from './color-picker';

const brandPalette = [
  '#0F172A',
  '#1D4ED8',
  '#0EA5E9',
  '#10B981',
  '#F43F5E',
  '#A855F7',
  '#64748B',
  '#E11D48',
] as const;

function ColorPickerRender({
  initialValue,
  legend,
  helperText,
  ...props
}: Omit<React.ComponentProps<typeof ColorPicker>, 'value' | 'onChange'> & {
  initialValue?: string;
  legend: string;
  helperText?: string;
}) {
  const [value, setValue] = useState(initialValue ?? '#8B5CF6');

  return (
    <fieldset className="w-80 space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <ColorPicker value={value} onChange={setValue} {...props} />
      {helperText ? (
        <p className="text-sm text-muted-foreground">
          Cor atual: <span className="font-mono">{value.toUpperCase()}</span>.
          {` ${helperText}`}
        </p>
      ) : null}
    </fieldset>
  );
}

const meta = {
  title: 'UI/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    value: {
      control: 'text',
      name: 'Cor selecionada',
    },
    onChange: {
      control: false,
      name: 'Ao trocar cor',
    },
    disabled: {
      control: 'boolean',
      name: 'Desabilitado',
    },
    className: {
      control: 'text',
      name: 'Classe CSS',
    },
    showHex: {
      control: 'boolean',
      name: 'Exibir HEX',
    },
    palette: {
      control: false,
      name: 'Paleta',
    },
  },
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Padrão',
  render: () => <ColorPickerRender legend="Cor da categoria" />,
};

export const WithSwatches: Story = {
  name: 'Com amostras',
  render: () => (
    <ColorPickerRender
      legend="Paleta da marca"
      palette={brandPalette}
      helperText="Use a paleta curada para manter consistência visual."
    />
  ),
};

export const WithCustomHex: Story = {
  name: 'Com HEX customizado',
  render: () => (
    <ColorPickerRender
      legend="Cor importada"
      initialValue="#123ABC"
      helperText="O valor inicial pode vir de uma cor já salva, mesmo fora da paleta."
    />
  ),
};

export const Disabled: Story = {
  name: 'Desabilitado',
  render: () => (
    <ColorPickerRender legend="Cor bloqueada" initialValue="#0EA5E9" disabled />
  ),
};
