import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CurrencyInput } from './currency-input';
import { Label } from './label';

// Project CurrencyInput is calculator-style: digits accumulate as cents and
// the decimal point auto-walks left. It defaults to BRL (R$) with pt-BR
// formatting and supports negative values via the `allowNegative` prop.

const meta = {
  title: 'UI/CurrencyInput',
  component: CurrencyInput,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof CurrencyInput>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultRender() {
  const [value, setValue] = useState<number | null>(null);
  return (
    <div className="w-72">
      <CurrencyInput
        value={value}
        onChange={setValue}
        placeholder="R$ 0,00"
        aria-label="Valor"
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultRender />,
};

function WithValueRender() {
  const [value, setValue] = useState<number | null>(1234.56);
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="preco">Preço de venda</Label>
      <CurrencyInput id="preco" value={value} onChange={setValue} />
    </div>
  );
}

export const WithValue: Story = {
  render: () => <WithValueRender />,
};

function DisabledRender() {
  const [value, setValue] = useState<number | null>(99.9);
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="preco-bloq">Preço fixo</Label>
      <CurrencyInput
        id="preco-bloq"
        value={value}
        onChange={setValue}
        disabled
      />
    </div>
  );
}

export const Disabled: Story = {
  render: () => <DisabledRender />,
};

// Negative values are supported when `allowNegative` is true (default).
// Typing "-" before digits flips the sign; the displayed string keeps the
// minus sign in front of the formatted number.
function NegativeRender() {
  const [value, setValue] = useState<number | null>(-450.75);
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="ajuste">Ajuste contábil</Label>
      <CurrencyInput
        id="ajuste"
        value={value}
        onChange={setValue}
        allowNegative
        className={
          value !== null && value < 0
            ? 'text-rose-600 dark:text-rose-400'
            : undefined
        }
      />
      <p className="text-xs text-muted-foreground">
        Valores negativos são exibidos em vermelho (composição na página).
      </p>
    </div>
  );
}

export const Negative: Story = {
  render: () => <NegativeRender />,
};

function WithLabelAndHelperRender() {
  const [value, setValue] = useState<number | null>(2500);
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="meta">Meta de faturamento</Label>
      <CurrencyInput
        id="meta"
        value={value}
        onChange={setValue}
        aria-describedby="meta-helper"
      />
      <p id="meta-helper" className="text-xs text-muted-foreground">
        Valor bruto mensal projetado em reais (BRL).
      </p>
    </div>
  );
}

export const WithLabelAndHelper: Story = {
  render: () => <WithLabelAndHelperRender />,
};
