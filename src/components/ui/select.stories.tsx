import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select';

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-72">
      <Select>
        <SelectTrigger aria-label="País">
          <SelectValue placeholder="Selecione um país" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="br">Brasil</SelectItem>
          <SelectItem value="ar">Argentina</SelectItem>
          <SelectItem value="cl">Chile</SelectItem>
          <SelectItem value="uy">Uruguai</SelectItem>
          <SelectItem value="py">Paraguai</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-72 space-y-2">
      <Label htmlFor="country-select">País de origem</Label>
      <Select>
        <SelectTrigger id="country-select">
          <SelectValue placeholder="Selecione um país" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="br">Brasil</SelectItem>
          <SelectItem value="ar">Argentina</SelectItem>
          <SelectItem value="cl">Chile</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-72 space-y-2">
      <Label htmlFor="disabled-select">País (bloqueado)</Label>
      <Select disabled>
        <SelectTrigger id="disabled-select">
          <SelectValue placeholder="Indisponível" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="br">Brasil</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="w-72 space-y-2">
      <Label htmlFor="error-select">País</Label>
      <Select>
        <SelectTrigger
          id="error-select"
          aria-invalid
          aria-describedby="error-select-msg"
        >
          <SelectValue placeholder="Selecione um país" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="br">Brasil</SelectItem>
          <SelectItem value="ar">Argentina</SelectItem>
          <SelectItem value="cl">Chile</SelectItem>
        </SelectContent>
      </Select>
      <p id="error-select-msg" className="text-sm text-destructive">
        Selecione um país para continuar
      </p>
    </div>
  ),
};

export const Grouped: Story = {
  render: () => (
    <div className="w-72 space-y-2">
      <Label htmlFor="grouped-select">Localização</Label>
      <Select>
        <SelectTrigger id="grouped-select">
          <SelectValue placeholder="Selecione um país" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>América do Sul</SelectLabel>
            <SelectItem value="br">Brasil</SelectItem>
            <SelectItem value="ar">Argentina</SelectItem>
            <SelectItem value="cl">Chile</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>América do Norte</SelectLabel>
            <SelectItem value="us">Estados Unidos</SelectItem>
            <SelectItem value="ca">Canadá</SelectItem>
            <SelectItem value="mx">México</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

const states = [
  'Acre',
  'Alagoas',
  'Amapá',
  'Amazonas',
  'Bahia',
  'Ceará',
  'Distrito Federal',
  'Espírito Santo',
  'Goiás',
  'Maranhão',
  'Mato Grosso',
  'Mato Grosso do Sul',
  'Minas Gerais',
  'Pará',
  'Paraíba',
  'Paraná',
  'Pernambuco',
  'Piauí',
  'Rio de Janeiro',
  'Rio Grande do Norte',
  'Rio Grande do Sul',
];

export const LongList: Story = {
  render: () => (
    <div className="w-72 space-y-2">
      <Label htmlFor="long-select">Estado (UF)</Label>
      <Select>
        <SelectTrigger id="long-select">
          <SelectValue placeholder="Selecione um estado" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {states.map(state => (
            <SelectItem key={state} value={state.toLowerCase()}>
              {state}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ),
};
