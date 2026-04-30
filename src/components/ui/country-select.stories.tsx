import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CountrySelect } from './country-select';
import { Label } from './label';

// Project CountrySelect is a Radix Popover combobox with built-in search and
// circular flag SVGs. The country registry is bundled inside the component
// (~70 countries, BR/Latam-first ordering). There is no "all countries"
// expansion knob — what's exported is what's available.

const meta = {
  title: 'UI/CountrySelect',
  component: CountrySelect,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof CountrySelect>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultRender() {
  const [value, setValue] = useState('BR');
  return (
    <div className="w-80">
      <CountrySelect value={value} onValueChange={setValue} />
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultRender />,
};

// Search: the popover always renders a search input on top of the list. To
// surface this state in docs we open with an uncommon country pre-selected
// so users see the typed-filter pattern.
function WithSearchRender() {
  const [value, setValue] = useState('JP');
  return (
    <div className="w-80 space-y-2">
      <Label htmlFor="pais-busca">País (clique e digite para buscar)</Label>
      <CountrySelect
        id="pais-busca"
        value={value}
        onValueChange={setValue}
        placeholder="Buscar país..."
      />
      <p className="text-xs text-muted-foreground">
        A busca filtra por nome ou código (ex: digite &quot;col&quot; ou
        &quot;JP&quot;).
      </p>
    </div>
  );
}

export const WithSearch: Story = {
  render: () => <WithSearchRender />,
};

// "All countries" — the registry is fixed at ~70 countries. This story just
// confirms the dropdown handles the full list without performance issues.
function AllCountriesRender() {
  const [value, setValue] = useState('OTHER');
  return (
    <div className="w-80 space-y-2">
      <Label htmlFor="pais-todos">País de origem</Label>
      <CountrySelect id="pais-todos" value={value} onValueChange={setValue} />
      <p className="text-xs text-muted-foreground">
        Lista completa do registro (~70 países, América do Sul primeiro).
      </p>
    </div>
  );
}

export const AllCountries: Story = {
  render: () => <AllCountriesRender />,
};

function WithLabelRender() {
  const [value, setValue] = useState('BR');
  return (
    <div className="w-80 space-y-2">
      <Label htmlFor="nacionalidade">Nacionalidade</Label>
      <CountrySelect
        id="nacionalidade"
        value={value}
        onValueChange={setValue}
      />
      <p className="text-xs text-muted-foreground">
        Telefone com DDI +55 será aplicado automaticamente para Brasil.
      </p>
    </div>
  );
}

export const WithLabel: Story = {
  render: () => <WithLabelRender />,
};

function DisabledRender() {
  const [value, setValue] = useState('BR');
  return (
    <div className="w-80 space-y-2">
      <Label htmlFor="pais-bloq">País (bloqueado)</Label>
      <CountrySelect
        id="pais-bloq"
        value={value}
        onValueChange={setValue}
        disabled
      />
    </div>
  );
}

export const Disabled: Story = {
  render: () => <DisabledRender />,
};
