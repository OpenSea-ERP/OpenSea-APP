import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { AttributeConfig } from '@/types/entity-config';
import { AttributeManager } from './attribute-manager';

const meta = {
  title: 'Shared/Forms/AttributeManager',
  component: AttributeManager,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Gerenciador de atributos chave-valor (controlled). Recebe `value`, `onChange`, `config: AttributeConfig` e flags `disabled` / `error`. Suporta `maxAttributes` e `allowDuplicateKeys` (default: false — bloqueia duplicatas).',
      },
    },
  },
} satisfies Meta<typeof AttributeManager>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseConfig: AttributeConfig = {
  singular: 'Atributo',
  plural: 'Atributos do produto',
  keyLabel: 'Chave',
  valueLabel: 'Valor',
  keyPlaceholder: 'Ex.: Cor',
  valuePlaceholder: 'Ex.: Azul marinho',
  maxAttributes: 5,
  allowDuplicateKeys: false,
};

// Controlled wrapper — extracted to satisfy react-hooks/rules-of-hooks
// (hooks cannot be called inside a Story `render` function lambda directly
// without an explicit named component).
interface ControlledProps {
  initial?: Array<{ key: string; value: string }>;
  config?: AttributeConfig;
  disabled?: boolean;
  error?: string;
}

function ControlledAttributeManager({
  initial = [],
  config = baseConfig,
  disabled = false,
  error,
}: ControlledProps) {
  const [items, setItems] = useState(initial);
  return (
    <div className="bg-background w-[640px] p-6">
      <AttributeManager
        value={items}
        onChange={setItems}
        config={config}
        disabled={disabled}
        error={error}
      />
    </div>
  );
}

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado inicial vazio: empty state com chamada para adicionar o primeiro atributo.',
      },
    },
  },
  render: () => <ControlledAttributeManager />,
};

export const WithAttributes: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Lista pré-populada — cada linha é editável e removível independentemente.',
      },
    },
  },
  render: () => (
    <ControlledAttributeManager
      initial={[
        { key: 'Cor', value: 'Azul marinho' },
        { key: 'Tamanho', value: 'M' },
        { key: 'Material', value: '100% algodão' },
      ]}
    />
  ),
};

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Modo somente leitura — botão "Adicionar" e inputs ficam desabilitados, remoção bloqueada.',
      },
    },
  },
  render: () => (
    <ControlledAttributeManager
      disabled
      initial={[
        { key: 'SKU', value: 'CAM-AZ-M' },
        { key: 'Peso', value: '180g' },
      ]}
    />
  ),
};

export const WithError: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Erro externo controlado via prop `error` (sobrescreve o `localError` interno do componente).',
      },
    },
  },
  render: () => (
    <ControlledAttributeManager
      error="Pelo menos um atributo é obrigatório para publicar este produto."
      initial={[]}
    />
  ),
};

export const AtMaxCapacity: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Lista no limite (`maxAttributes`) — botão "Adicionar" desabilitado, contador exibido abaixo.',
      },
    },
  },
  render: () => (
    <ControlledAttributeManager
      config={{ ...baseConfig, maxAttributes: 3 }}
      initial={[
        { key: 'Cor', value: 'Preto' },
        { key: 'Tamanho', value: 'G' },
        { key: 'Estampa', value: 'Lisa' },
      ]}
    />
  ),
};
