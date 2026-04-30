import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { Combobox, type ComboboxOption } from './combobox';

const meta = {
  title: 'UI/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const PAISES: ComboboxOption[] = [
  { value: 'br', label: 'Brasil' },
  { value: 'pt', label: 'Portugal' },
  { value: 'us', label: 'Estados Unidos' },
  { value: 'es', label: 'Espanha' },
  { value: 'fr', label: 'França' },
  { value: 'it', label: 'Itália' },
  { value: 'de', label: 'Alemanha' },
  { value: 'jp', label: 'Japão' },
];

const STATUS: ComboboxOption[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'approved', label: 'Aprovado' },
  { value: 'rejected', label: 'Recusado' },
  { value: 'archived', label: 'Arquivado' },
];

function DefaultRender() {
  const [value, setValue] = useState<string>('');
  return (
    <div className="w-[320px]">
      <Combobox
        options={STATUS}
        value={value}
        onValueChange={setValue}
        placeholder="Selecione um status"
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultRender />,
};

function WithSearchRender() {
  const [value, setValue] = useState<string>('');
  return (
    <div className="w-[320px]">
      <Combobox
        options={PAISES}
        value={value}
        onValueChange={setValue}
        placeholder="Selecione um país"
        searchPlaceholder="Buscar país..."
      />
    </div>
  );
}

export const WithSearch: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A busca filtra as opções conforme o usuário digita (matching por label).',
      },
    },
  },
  render: () => <WithSearchRender />,
};

function MultipleRender() {
  // API atual aceita apenas seleção única (single-select). Esta story
  // simula multi-seleção exibindo chips de valores selecionados acima do
  // combobox; cada clique adiciona/remove da lista local.
  const [selected, setSelected] = useState<string[]>([]);

  const handleChange = (val: string) => {
    if (!val) return;
    setSelected(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  return (
    <div className="w-[360px] space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {selected.length === 0 ? (
          <span className="text-muted-foreground text-xs">
            Nenhum item selecionado
          </span>
        ) : (
          selected.map(val => {
            const opt = PAISES.find(p => p.value === val);
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
              >
                {opt?.label}
              </span>
            );
          })
        )}
      </div>
      <Combobox
        options={PAISES}
        value=""
        onValueChange={handleChange}
        placeholder="Adicionar país..."
        searchPlaceholder="Buscar país..."
      />
    </div>
  );
}

export const Multiple: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'API mismatch: o componente Combobox do projeto suporta apenas seleção única. Esta story simula multi-seleção via estado externo + chips, padrão recomendado quando multi-select for necessário.',
      },
    },
  },
  render: () => <MultipleRender />,
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[320px]">
      <Combobox
        options={STATUS}
        value="pending"
        placeholder="Selecione um status"
        disabled
      />
    </div>
  ),
};

function NoResultsRender() {
  const [value, setValue] = useState<string>('');
  return (
    <div className="w-[320px]">
      <Combobox
        options={[]}
        value={value}
        onValueChange={setValue}
        placeholder="Selecione um item"
        emptyText="Nenhum resultado encontrado."
        searchPlaceholder="Buscar..."
      />
    </div>
  );
}

export const NoResults: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado vazio: nenhuma opção disponível ou nenhuma corresponde à busca.',
      },
    },
  },
  render: () => <NoResultsRender />,
};

function AsyncRender() {
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [value, setValue] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOptions(PAISES);
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-[320px]">
      <Combobox
        options={loading ? [] : options}
        value={value}
        onValueChange={setValue}
        placeholder={loading ? 'Carregando opções...' : 'Selecione um país'}
        emptyText={loading ? 'Carregando...' : 'Nenhum resultado encontrado.'}
        searchPlaceholder="Buscar país..."
        disabled={loading}
      />
    </div>
  );
}

export const Async: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado de carregamento enquanto opções são buscadas (simulado via setTimeout 1500ms). Após carregar, lista os países normalmente.',
      },
    },
  },
  render: () => <AsyncRender />,
};
