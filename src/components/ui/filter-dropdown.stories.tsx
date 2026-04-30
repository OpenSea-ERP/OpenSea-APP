import type { Meta, StoryObj } from '@storybook/react';
import { Plus, Tag } from 'lucide-react';
import { useState } from 'react';
import { FilterDropdown, type FilterOption } from './filter-dropdown';

// FilterDropdown supports two modes: multi-select via `selected` +
// `onSelectionChange`, and single-select via `value` + `onChange`. The
// trigger badges the count whenever the active selection is non-empty.

const meta = {
  title: 'UI/FilterDropdown',
  component: FilterDropdown,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof FilterDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATUS_OPTIONS: FilterOption[] = [
  { id: 'pending', label: 'Pendente' },
  { id: 'approved', label: 'Aprovado' },
  { id: 'in-review', label: 'Em revisão' },
  { id: 'rejected', label: 'Recusado' },
  { id: 'archived', label: 'Arquivado' },
];

const CATEGORY_OPTIONS: FilterOption[] = [
  { id: 'roupas', label: 'Roupas' },
  { id: 'calcados', label: 'Calçados' },
  { id: 'acessorios', label: 'Acessórios' },
  { id: 'decoracao', label: 'Decoração' },
  { id: 'eletronicos', label: 'Eletrônicos' },
  { id: 'livros', label: 'Livros' },
];

function DefaultRender() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <FilterDropdown
      label="Status"
      icon={Tag}
      options={STATUS_OPTIONS}
      selected={selected}
      onSelectionChange={setSelected}
    />
  );
}

export const Default: Story = {
  render: () => <DefaultRender />,
};

function WithAppliedRender() {
  const [selected, setSelected] = useState<string[]>(['approved']);
  return (
    <FilterDropdown
      label="Status"
      icon={Tag}
      options={STATUS_OPTIONS}
      selected={selected}
      onSelectionChange={setSelected}
      activeColor="emerald"
    />
  );
}

export const WithApplied: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Filtro com 1 valor já aplicado. O trigger ganha borda + badge na cor da prop `activeColor`.',
      },
    },
  },
  render: () => <WithAppliedRender />,
};

function MultiRender() {
  const [selected, setSelected] = useState<string[]>([
    'roupas',
    'calcados',
    'acessorios',
  ]);
  return (
    <FilterDropdown
      label="Categorias"
      icon={Tag}
      options={CATEGORY_OPTIONS}
      selected={selected}
      onSelectionChange={setSelected}
      activeColor="violet"
      footerAction={{
        icon: Plus,
        label: 'Nova categoria',
        onClick: () => {
          /* would open a creation modal */
        },
        color: 'violet',
      }}
    />
  );
}

export const Multi: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Multi-seleção: itens selecionados sobem para o topo da lista, separados por linha tracejada. Inclui `footerAction` (ex.: criar nova categoria).',
      },
    },
  },
  render: () => <MultiRender />,
};

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'API gap: FilterDropdown não tem prop `disabled`. Para indicar estado desabilitado, envolva em um wrapper com `pointer-events-none opacity-50` (mostrado abaixo).',
      },
    },
  },
  render: () => (
    <div
      className="pointer-events-none opacity-50"
      aria-disabled="true"
      role="group"
      aria-label="Filtro de status (desabilitado)"
    >
      <FilterDropdown
        label="Status"
        icon={Tag}
        options={STATUS_OPTIONS}
        selected={[]}
        onSelectionChange={() => {
          /* noop */
        }}
      />
    </div>
  ),
};
