import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SearchBar } from './search-bar';

/**
 * `SearchBar` é o input de busca padrão das listagens. Tem debounce
 * embutido (default 300ms), três tamanhos (sm/md/lg), estados de
 * validação (default/loading/error/success) e ícones customizáveis.
 * Totalmente prop-driven — não depende de contexto.
 */
const meta = {
  title: 'Layout/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Input de busca com debounce, ícones e estados de validação. API tipada via `SearchBarProps`. Use o estado `loading` para feedback visual durante chamadas async.',
      },
    },
  },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultRender() {
  const [value, setValue] = useState('');
  return (
    <div className="w-[640px] max-w-full">
      <SearchBar
        value={value}
        placeholder="Procurar produtos..."
        onSearch={setValue}
        onClear={() => setValue('')}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultRender />,
};

function WithValueRender() {
  const [value, setValue] = useState('Camiseta básica preta');
  return (
    <div className="w-[640px] max-w-full">
      <SearchBar
        value={value}
        placeholder="Procurar produtos..."
        onSearch={setValue}
        onClear={() => setValue('')}
      />
    </div>
  );
}

export const WithValue: Story = {
  render: () => <WithValueRender />,
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[640px] max-w-full">
      <SearchBar
        value="Busca bloqueada"
        placeholder="Procurar produtos..."
        onSearch={() => undefined}
        onClear={() => undefined}
        disabled
      />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="w-[640px] max-w-full">
      <SearchBar
        value="Camiseta"
        placeholder="Procurar produtos..."
        onSearch={() => undefined}
        onClear={() => undefined}
        state="loading"
      />
    </div>
  ),
};

export const ErrorState: Story = {
  name: 'Error',
  render: () => (
    <div className="w-[640px] max-w-full">
      <SearchBar
        value="@@@"
        placeholder="Procurar produtos..."
        onSearch={() => undefined}
        onClear={() => undefined}
        state="error"
        errorMessage="Termo de busca inválido. Use ao menos 3 caracteres."
      />
    </div>
  ),
};

export const Success: Story = {
  name: 'With Suggestions (Success)',
  render: () => (
    <div className="w-[640px] max-w-full">
      <SearchBar
        value="Camiseta"
        placeholder="Procurar produtos..."
        onSearch={() => undefined}
        onClear={() => undefined}
        state="success"
        successMessage="12 resultados encontrados."
      />
    </div>
  ),
};
