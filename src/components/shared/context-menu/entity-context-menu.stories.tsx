import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '@/components/ui/card';
import { EntityContextMenu } from './entity-context-menu';

const meta = {
  title: 'Shared/ContextMenu/EntityContextMenu',
  component: EntityContextMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Context menu genérico para itens (Visualizar / Editar / Duplicar / Movimentar Estoque / Copiar Código / Excluir). Clique com o botão direito sobre o card para acionar.\n\n**Gap importante (CLAUDE.md regra 5):** o componente real **não** aceita a prop `actions: ContextMenuAction[]` mencionada no padrão de 3 grupos (base / custom / destructive). Hoje só expõe callbacks nominais e a ordem é fixa. Para suportar custom actions arbitrárias com `separator: "before"`, é necessário evoluir a API do componente (ver stories `WithCustomActions` e `FullStack`, que se restringem ao que existe).',
      },
    },
  },
} satisfies Meta<typeof EntityContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const TriggerCard = ({ label }: { label: string }) => (
  <Card className="w-72 p-6 text-center cursor-context-menu select-none">
    <p className="text-sm text-muted-foreground">Clique com o botão direito</p>
    <p className="font-semibold mt-1">{label}</p>
  </Card>
);

export const Default: Story = {
  render: () => (
    <EntityContextMenu onView={() => {}} onEdit={() => {}}>
      <TriggerCard label="Camiseta Algodao Premium" />
    </EntityContextMenu>
  ),
};

export const WithViewEdit: Story = {
  render: () => (
    <EntityContextMenu
      onView={() => {}}
      onEdit={() => {}}
      onDuplicate={() => {}}
    >
      <TriggerCard label="Produto com Visualizar/Editar/Duplicar" />
    </EntityContextMenu>
  ),
};

export const WithCustomActions: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '**Gap:** sem prop `actions` arbitrária no componente. As "custom actions" disponíveis hoje sao callbacks nominais fixos: `onStockMovement` e `onCopyCode`. Para Exportar/Imprimir, seria necessário expandir a API.',
      },
    },
  },
  render: () => (
    <EntityContextMenu
      onView={() => {}}
      onEdit={() => {}}
      onStockMovement={() => {}}
      onCopyCode={() => {}}
    >
      <TriggerCard label="Produto com acoes de estoque" />
    </EntityContextMenu>
  ),
};

export const WithDestructive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Excluir aparece por último, separado por `ContextMenuSeparator`. Conforme regra 5 (CLAUDE.md): destructive ao final.',
      },
    },
  },
  render: () => (
    <EntityContextMenu onView={() => {}} onEdit={() => {}} onDelete={() => {}}>
      <TriggerCard label="Produto com excluir" />
    </EntityContextMenu>
  ),
};

export const FullStack: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Stack completo: base (Visualizar/Editar/Duplicar) + custom disponíveis (Movimentar Estoque, Copiar Código) + destructive (Excluir). **Gap:** o separator entre "base" e "custom" não existe na API atual — só há um separator antes do `onDelete`. Cobertura plena dos 3 grupos exige refator do componente.',
      },
    },
  },
  render: () => (
    <EntityContextMenu
      onView={() => {}}
      onEdit={() => {}}
      onDuplicate={() => {}}
      onStockMovement={() => {}}
      onCopyCode={() => {}}
      onDelete={() => {}}
      isMultipleSelection
      selectedCount={3}
    >
      <TriggerCard label="3 itens selecionados" />
    </EntityContextMenu>
  ),
};
