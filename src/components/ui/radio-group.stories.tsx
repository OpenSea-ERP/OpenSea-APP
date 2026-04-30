import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './label';
import { RadioGroup, RadioGroupItem } from './radio-group';

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="pix" aria-label="Forma de pagamento">
      <div className="flex items-center gap-3">
        <RadioGroupItem value="card" id="payment-card" />
        <Label htmlFor="payment-card">Cartão de crédito</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem value="boleto" id="payment-boleto" />
        <Label htmlFor="payment-boleto">Boleto bancário</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem value="pix" id="payment-pix" />
        <Label htmlFor="payment-pix">Pix</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup
      defaultValue="card"
      disabled
      aria-label="Forma de pagamento (bloqueada)"
    >
      <div className="flex items-center gap-3">
        <RadioGroupItem value="card" id="d-payment-card" />
        <Label htmlFor="d-payment-card">Cartão de crédito</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem value="boleto" id="d-payment-boleto" />
        <Label htmlFor="d-payment-boleto">Boleto bancário</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem value="pix" id="d-payment-pix" />
        <Label htmlFor="d-payment-pix">Pix</Label>
      </div>
    </RadioGroup>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <RadioGroup
      defaultValue="standard"
      className="w-96"
      aria-label="Plano de envio"
    >
      <div className="flex items-start gap-3 rounded-lg border p-3">
        <RadioGroupItem
          value="standard"
          id="ship-standard"
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor="ship-standard">Envio padrão</Label>
          <p className="text-sm text-muted-foreground">
            Entrega em 5 a 7 dias úteis. Frete grátis acima de R$ 99.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-lg border p-3">
        <RadioGroupItem value="express" id="ship-express" className="mt-0.5" />
        <div className="space-y-1">
          <Label htmlFor="ship-express">Envio expresso</Label>
          <p className="text-sm text-muted-foreground">
            Entrega em 2 a 3 dias úteis. Acréscimo de R$ 19,90.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-lg border p-3">
        <RadioGroupItem value="sameday" id="ship-sameday" className="mt-0.5" />
        <div className="space-y-1">
          <Label htmlFor="ship-sameday">Mesmo dia</Label>
          <p className="text-sm text-muted-foreground">
            Disponível apenas para capitais. Acréscimo de R$ 39,90.
          </p>
        </div>
      </div>
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup
      defaultValue="m"
      className="flex flex-row gap-6"
      aria-label="Tamanho"
    >
      <div className="flex items-center gap-2">
        <RadioGroupItem value="p" id="size-p" />
        <Label htmlFor="size-p">P</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="m" id="size-m" />
        <Label htmlFor="size-m">M</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="g" id="size-g" />
        <Label htmlFor="size-g">G</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="gg" id="size-gg" />
        <Label htmlFor="size-gg">GG</Label>
      </div>
    </RadioGroup>
  ),
};
