import type { Meta, StoryObj } from '@storybook/react';
import { CalendarDays } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Button } from './button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';

const meta = {
  title: 'UI/HoverCard',
  component: HoverCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Padrão de cartão de perfil em hover/foco. O `HoverCardTrigger` precisa ser focável — use `Button` ou outro elemento interativo.',
      },
    },
  },
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link" className="h-auto p-0">
          <Avatar className="size-8">
            <AvatarImage src="/storybook-fixtures/avatar.png" alt="" />
            <AvatarFallback>AS</AvatarFallback>
          </Avatar>
          <span className="ml-2">@ana.silva</span>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex gap-3">
          <Avatar>
            <AvatarImage src="/storybook-fixtures/avatar.png" alt="" />
            <AvatarFallback>AS</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Ana Silva</h4>
            <p className="text-sm text-muted-foreground">
              Gerente de operações — OpenSea ERP.
            </p>
            <div className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
              <CalendarDays className="size-3" />
              <span>Na empresa desde mar/2023</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const WithLink: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Trigger como link clicável. O hover mostra preview e o clique navega — bom para menções a entidades (produtos, clientes, pedidos).',
      },
    },
  },
  render: () => (
    <p className="max-w-md text-sm">
      O pedido foi processado pelo cliente{' '}
      <HoverCard>
        <HoverCardTrigger asChild>
          <a
            href="#cliente-123"
            className="font-medium underline underline-offset-4"
          >
            Bruno Costa
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Bruno Costa</h4>
            <p className="text-xs text-muted-foreground">CPF 123.456.789-00</p>
            <p className="text-sm">12 pedidos nos últimos 90 dias</p>
            <p className="text-sm">Total gasto: R$ 4.328,90</p>
          </div>
        </HoverCardContent>
      </HoverCard>
      , no canal Whatsapp.
    </p>
  ),
};

export const DelayCustom: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`openDelay` controla a latência de abertura no hover (ms). Use valores baixos (~150) para previews e altos (~600) para evitar flicker em listas densas.',
      },
    },
  },
  render: () => (
    <div className="flex items-center gap-6">
      <HoverCard openDelay={150} closeDelay={100}>
        <HoverCardTrigger asChild>
          <Button variant="outline">Abertura rápida (150ms)</Button>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm">Preview imediato — bom para tooltips ricos.</p>
        </HoverCardContent>
      </HoverCard>

      <HoverCard openDelay={600} closeDelay={200}>
        <HoverCardTrigger asChild>
          <Button variant="outline">Abertura lenta (600ms)</Button>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm">
            Evita flicker quando o usuário só passa por cima.
          </p>
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
};
