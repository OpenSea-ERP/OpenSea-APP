import type { Meta, StoryObj } from '@storybook/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

const meta = {
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`type="single"` — apenas um item ativo por vez (padrão para alinhamento de texto).',
      },
    },
  },
  render: () => (
    <ToggleGroup
      type="single"
      defaultValue="left"
      aria-label="Alinhamento de texto"
    >
      <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
        <AlignLeft />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Alinhar ao centro">
        <AlignCenter />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinhar à direita">
        <AlignRight />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Multiple: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`type="multiple"` — múltiplos itens podem ficar ativos simultaneamente (formatação rica de texto).',
      },
    },
  },
  render: () => (
    <ToggleGroup
      type="multiple"
      defaultValue={['bold']}
      aria-label="Formatação de texto"
    >
      <ToggleGroupItem value="bold" aria-label="Negrito">
        <Bold />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Itálico">
        <Italic />
      </ToggleGroupItem>
      <ToggleGroupItem value="underline" aria-label="Sublinhado">
        <Underline />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Outline: Story = {
  render: () => (
    <ToggleGroup
      type="single"
      variant="outline"
      defaultValue="center"
      aria-label="Alinhamento (outline)"
    >
      <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
        <AlignLeft />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Alinhar ao centro">
        <AlignCenter />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinhar à direita">
        <AlignRight />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <ToggleGroup
      type="single"
      defaultValue="center"
      disabled
      aria-label="Alinhamento desabilitado"
    >
      <ToggleGroupItem value="left" aria-label="Alinhar à esquerda">
        <AlignLeft />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Alinhar ao centro">
        <AlignCenter />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Alinhar à direita">
        <AlignRight />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const WithTextAndIcon: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Itens com ícone + texto. Quando há texto visível, o `aria-label` no item passa a ser opcional, mas o `aria-label` no grupo continua importante.',
      },
    },
  },
  render: () => (
    <ToggleGroup
      type="single"
      defaultValue="left"
      aria-label="Alinhamento de texto"
    >
      <ToggleGroupItem value="left">
        <AlignLeft />
        Esquerda
      </ToggleGroupItem>
      <ToggleGroupItem value="center">
        <AlignCenter />
        Centro
      </ToggleGroupItem>
      <ToggleGroupItem value="right">
        <AlignRight />
        Direita
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <ToggleGroup type="single" size="sm" aria-label="Tamanho pequeno">
        <ToggleGroupItem value="bold" aria-label="Negrito">
          <Bold />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Itálico">
          <Italic />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" size="default" aria-label="Tamanho padrão">
        <ToggleGroupItem value="bold" aria-label="Negrito">
          <Bold />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Itálico">
          <Italic />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" size="lg" aria-label="Tamanho grande">
        <ToggleGroupItem value="bold" aria-label="Negrito">
          <Bold />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Itálico">
          <Italic />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
};
