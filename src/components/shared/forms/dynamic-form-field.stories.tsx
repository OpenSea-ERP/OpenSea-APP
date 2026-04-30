import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { FormFieldConfig } from '@/types/entity-config';
import { DynamicFormField } from './dynamic-form-field';

const meta = {
  title: 'Shared/Forms/DynamicFormField',
  component: DynamicFormField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Campo de formulário config-driven (controlled). Renderiza um dos 9 tipos suportados: `text`, `number`, `textarea`, `date`, `select`, `switch`, `checkbox`, `color`, `file`. Para `switch`/`checkbox` o label visível é a `description` (não há `<Label htmlFor>` superior — o htmlFor aponta para o controle dentro do flex).',
      },
    },
  },
} satisfies Meta<typeof DynamicFormField>;

export default meta;
type Story = StoryObj<typeof meta>;

// Controlled wrapper — hooks must live in a named PascalCase component
// (react-hooks/rules-of-hooks).
interface ControlledProps {
  config: FormFieldConfig;
  initial?: unknown;
  error?: string;
}

function ControlledField({ config, initial, error }: ControlledProps) {
  const [value, setValue] = useState<unknown>(initial);
  return (
    <div className="bg-background w-[420px] p-6">
      <DynamicFormField
        config={config}
        value={value}
        onChange={setValue}
        error={error}
      />
    </div>
  );
}

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Campo de texto simples com label, placeholder e descrição.',
      },
    },
  },
  render: () => (
    <ControlledField
      config={{
        name: 'name',
        label: 'Nome do produto',
        type: 'text',
        placeholder: 'Camiseta Premium',
        required: true,
        description: 'Nome curto que aparece no catálogo.',
      }}
      initial=""
    />
  ),
};

export const NumberField: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tipo `number` — converte automaticamente o input para Number.',
      },
    },
  },
  render: () => (
    <ControlledField
      config={{
        name: 'price',
        label: 'Preço (R$)',
        type: 'number',
        placeholder: '0,00',
        required: true,
      }}
      initial={89.9}
    />
  ),
};

export const TextareaField: Story = {
  render: () => (
    <ControlledField
      config={{
        name: 'description',
        label: 'Descrição',
        type: 'textarea',
        placeholder: 'Descreva o produto em detalhes…',
        description: 'Texto longo exibido na página do produto.',
      }}
      initial="Camiseta unissex 100% algodão pima, gola redonda e modelagem reta."
    />
  ),
};

export const DateField: Story = {
  render: () => (
    <ControlledField
      config={{
        name: 'releaseAt',
        label: 'Data de lançamento',
        type: 'date',
        required: true,
      }}
      initial="2026-05-15"
    />
  ),
};

export const SelectField: Story = {
  render: () => (
    <ControlledField
      config={{
        name: 'category',
        label: 'Categoria',
        type: 'select',
        placeholder: 'Selecione uma categoria',
        options: [
          { label: 'Vestuário', value: 'apparel' },
          { label: 'Calçados', value: 'shoes' },
          { label: 'Acessórios', value: 'accessories' },
        ],
      }}
      initial="apparel"
    />
  ),
};

export const SwitchField: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tipo `switch` — não renderiza o label superior (usa `description` ao lado do controle).',
      },
    },
  },
  render: () => (
    <ControlledField
      config={{
        name: 'active',
        label: 'Ativo',
        type: 'switch',
        description: 'Produto ativo no catálogo',
      }}
      initial={true}
    />
  ),
};

export const CheckboxField: Story = {
  render: () => (
    <ControlledField
      config={{
        name: 'acceptTerms',
        label: 'Aceitar termos',
        type: 'checkbox',
        description: 'Concordo com os termos de uso',
      }}
      initial={false}
    />
  ),
};

export const ColorField: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tipo `color` — combo de color picker + input hexadecimal sincronizados.',
      },
    },
  },
  render: () => (
    <ControlledField
      config={{
        name: 'brandColor',
        label: 'Cor da marca',
        type: 'color',
        description: 'Usada nos cards e botões primários.',
      }}
      initial="#7c3aed"
    />
  ),
};

export const WithError: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado de erro — mensagem renderizada abaixo do campo em `text-destructive`.',
      },
    },
  },
  render: () => (
    <ControlledField
      config={{
        name: 'sku',
        label: 'SKU',
        type: 'text',
        placeholder: 'CAM-001',
        required: true,
      }}
      initial=""
      error="SKU é obrigatório."
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <ControlledField
      config={{
        name: 'sku',
        label: 'SKU (gerado automaticamente)',
        type: 'text',
        placeholder: 'CAM-001',
        disabled: true,
      }}
      initial="CAM-AZ-M-001"
    />
  ),
};
