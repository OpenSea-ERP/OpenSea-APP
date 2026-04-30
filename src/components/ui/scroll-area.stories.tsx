import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea, ScrollBar } from './scroll-area';
import { Separator } from './separator';

const meta = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const longParagraphs = Array.from({ length: 8 }, (_, i) => i + 1);

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-[200px] w-80 rounded-md border p-4">
      <h4 className="mb-3 text-sm font-medium">Termos de uso</h4>
      <div className="space-y-3 text-sm text-muted-foreground">
        {longParagraphs.map(i => (
          <p key={i}>
            Parágrafo {i}. O usuário concorda em utilizar a plataforma de acordo
            com as políticas vigentes, respeitando os limites do plano
            contratado e as normas de proteção de dados pessoais.
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Para scroll horizontal explícito, adicione `<ScrollBar orientation="horizontal" />` dentro do `ScrollArea`. O viewport precisa de `whitespace-nowrap`.',
      },
    },
  },
  render: () => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
      <div className="flex w-max gap-3 p-4">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="flex h-24 w-32 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-sm font-medium"
          >
            Item {i + 1}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

export const Combined: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Scroll vertical + horizontal simultâneos. Útil para tabelas amplas em containers fixos.',
      },
    },
  },
  render: () => (
    <ScrollArea className="h-[260px] w-96 rounded-md border">
      <div className="w-[800px] p-4">
        <div className="grid grid-cols-6 gap-2 text-sm">
          {Array.from({ length: 60 }, (_, i) => (
            <div
              key={i}
              className="flex h-16 items-center justify-center rounded-md border bg-muted/40"
            >
              Célula {i + 1}
            </div>
          ))}
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

const teamMembers = [
  'Ana Silva',
  'Bruno Costa',
  'Carla Souza',
  'Daniel Rocha',
  'Eduarda Lima',
  'Fábio Mendes',
  'Gabriela Alves',
  'Henrique Dias',
  'Isabela Ramos',
  'João Pereira',
  'Karla Nunes',
  'Lucas Martins',
  'Mariana Freitas',
  'Nathan Pires',
  'Olívia Tavares',
  'Pedro Henrique',
];

export const WithList: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Padrão para listas longas em painéis laterais (membros da equipe, histórico, notificações).',
      },
    },
  },
  render: () => (
    <ScrollArea className="h-[260px] w-72 rounded-md border">
      <div className="p-4">
        <h4 className="mb-3 text-sm font-medium">Equipe (16)</h4>
        <div className="space-y-1 text-sm">
          {teamMembers.map((name, idx) => (
            <div key={name}>
              <div className="py-1">{name}</div>
              {idx < teamMembers.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  ),
};
