import type { Meta, StoryObj } from '@storybook/react';
import type { ActionCardRenderData } from '@/types/ai';
import { AiActionCard } from './action-card';

const meta = {
  title: 'Tools/AI/AiActionCard',
  component: AiActionCard,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Card de ação proposta pelo Atlas (assistente IA) — cada módulo (stock / finance / hr / sales) tem paleta própria (violeta / esmeralda / céu / âmbar) com borda lateral 4px. Ciclo de status: PENDING (aguardando) → CONFIRMED (executando) → EXECUTED / FAILED / CANCELLED. Suporta campos formatados (currency, badge, number, date) e link para o registro criado.',
      },
    },
  },
} satisfies Meta<typeof AiActionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseData: ActionCardRenderData = {
  type: 'ACTION_CARD',
  actionId: 'act_01HXY',
  toolName: 'create_product',
  displayName: 'Cadastrar produto',
  module: 'stock',
  status: 'PENDING',
  fields: [
    { label: 'Nome', value: 'Camiseta Algodão Premium' },
    { label: 'SKU', value: 'CAM-001', type: 'badge' },
    { label: 'Preço', value: 'R$ 89,90', type: 'currency' },
    { label: 'Estoque inicial', value: '42', type: 'number' },
  ],
};

const noop = () => {};

export const Default: Story = {
  args: { data: baseData, onConfirm: noop, onCancel: noop },
};

export const Finance: Story = {
  args: {
    data: {
      ...baseData,
      module: 'finance',
      displayName: 'Lançar conta a pagar',
      toolName: 'create_payable',
      fields: [
        { label: 'Fornecedor', value: 'Têxtil Sul Ltda.' },
        { label: 'Valor', value: 'R$ 12.450,90', type: 'currency' },
        { label: 'Vencimento', value: '15/05/2026', type: 'date' },
        { label: 'Categoria', value: 'Insumos', type: 'badge' },
      ],
    },
    onConfirm: noop,
    onCancel: noop,
  },
};

export const HrSales: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Lado a lado: módulos HR (céu) e Sales (âmbar) demonstrando o sistema de cores.',
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AiActionCard
        data={{
          ...baseData,
          actionId: 'act_hr',
          module: 'hr',
          displayName: 'Aprovar férias',
          toolName: 'approve_vacation',
          fields: [
            { label: 'Colaborador', value: 'Maria Silva' },
            { label: 'Período', value: '01/06 a 30/06/2026', type: 'date' },
            { label: 'Saldo', value: '30 dias', type: 'badge' },
          ],
        }}
        onConfirm={noop}
        onCancel={noop}
      />
      <AiActionCard
        data={{
          ...baseData,
          actionId: 'act_sales',
          module: 'sales',
          displayName: 'Confirmar pedido',
          toolName: 'confirm_order',
          fields: [
            { label: 'Cliente', value: 'Distribuidora Norte' },
            { label: 'Total', value: 'R$ 3.299,00', type: 'currency' },
            { label: 'Itens', value: '14', type: 'number' },
          ],
        }}
        onConfirm={noop}
        onCancel={noop}
      />
    </div>
  ),
};

export const Executada: Story = {
  args: {
    data: {
      ...baseData,
      status: 'EXECUTED',
      result: {
        success: true,
        message: 'Produto cadastrado com sucesso.',
        entityId: 'prd_01HXY',
        entityUrl: '/stock/products/prd_01HXY',
      },
    },
    onConfirm: noop,
    onCancel: noop,
  },
};

export const Falhou: Story = {
  args: {
    data: {
      ...baseData,
      status: 'FAILED',
      result: {
        success: false,
        message: 'SKU já existente — escolha outro código.',
      },
    },
    onConfirm: noop,
    onCancel: noop,
  },
};

export const Cancelada: Story = {
  args: {
    data: { ...baseData, status: 'CANCELLED' },
    onConfirm: noop,
    onCancel: noop,
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: { data: baseData, onConfirm: noop, onCancel: noop },
};
