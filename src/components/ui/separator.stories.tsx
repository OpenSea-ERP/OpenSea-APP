import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from './separator';

const meta = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    decorative: { control: 'boolean' },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-80 space-y-3">
      <div className="text-sm font-medium">Configurações da conta</div>
      <Separator />
      <p className="text-sm text-muted-foreground">
        Gerencie suas preferências de notificação, idioma e tema.
      </p>
    </div>
  ),
};

export const Vertical: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Para uso vertical, o pai precisa ter altura definida (ex: `h-8`) — `Separator` herda altura via `data-orientation=vertical`.',
      },
    },
  },
  render: () => (
    <div className="flex h-8 items-center gap-3 text-sm">
      <span>Editar</span>
      <Separator orientation="vertical" />
      <span>Duplicar</span>
      <Separator orientation="vertical" />
      <span>Excluir</span>
    </div>
  ),
};

export const WithText: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Padrão visual para divisores com rótulo central (ex: alternativa de login). O separador é decorativo e o texto é o conteúdo semântico.',
      },
    },
  },
  render: () => (
    <div className="flex w-80 items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        OU
      </span>
      <Separator className="flex-1" />
    </div>
  ),
};

export const Decorative: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Quando `decorative` é `true` (padrão), o Radix aplica `role="none"` e o separador some do AT. Use `decorative={false}` quando o separador comunica estrutura semântica importante.',
      },
    },
  },
  render: () => (
    <div className="w-80 space-y-3">
      <div className="text-sm">Bloco semântico A</div>
      <Separator decorative={false} aria-label="Divisão entre blocos" />
      <div className="text-sm">Bloco semântico B</div>
    </div>
  ),
};
