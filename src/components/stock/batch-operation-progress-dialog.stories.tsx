import type { Meta, StoryObj } from '@storybook/react';
import { BatchOperationProgressDialog } from './batch-operation-progress-dialog';

/**
 * `BatchOperationProgressDialog` é um modal de progresso para operações em
 * lote no estoque (excluir, duplicar, criar produtos/templates/itens).
 *
 * Estados visuais:
 * - **Processing**: spinner azul + barra de progresso animada
 * - **Paused**: ícone amarelo, mostra confirmação de cancelamento
 * - **Complete (sucesso)**: check verde + resumo
 * - **Complete (com erros)**: X vermelho + lista de falhas
 *
 * Suporta 3 tipos: `delete`, `duplicate`, `create` — cada um com mensagens
 * próprias e emoji decorativo.
 */
const meta = {
  title: 'Modules/Stock/BatchOperationProgressDialog',
  component: BatchOperationProgressDialog,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dialog de progresso para operações em lote (delete/duplicate/create). Mostra barra de progresso, contagem completed/total, lista de falhas e oferece botão de cancelamento com confirmação inline.',
      },
    },
  },
} satisfies Meta<typeof BatchOperationProgressDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

export const Default: Story = {
  name: 'Processing — delete',
  args: {
    open: true,
    isProcessing: true,
    isPaused: false,
    progress: 42,
    total: 50,
    completed: 21,
    failed: [],
    operationType: 'delete',
    itemName: 'produtos',
    onOpenChange: noop,
    onPause: noop,
    onResume: noop,
    onCancel: noop,
  },
};

export const ProcessingDuplicate: Story = {
  name: 'Processing — duplicate',
  args: {
    open: true,
    isProcessing: true,
    progress: 67,
    total: 30,
    completed: 20,
    failed: [],
    operationType: 'duplicate',
    itemName: 'templates',
    onOpenChange: noop,
    onPause: noop,
    onResume: noop,
    onCancel: noop,
  },
};

export const ProcessingCreate: Story = {
  name: 'Processing — create',
  args: {
    open: true,
    isProcessing: true,
    progress: 12,
    total: 200,
    completed: 24,
    failed: [],
    operationType: 'create',
    itemName: 'variantes',
    onOpenChange: noop,
    onPause: noop,
    onResume: noop,
    onCancel: noop,
  },
};

export const CompleteSuccess: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`isProcessing=false` + `failed=[]` + `total > 0` → estado de sucesso com check verde e resumo.',
      },
    },
  },
  args: {
    open: true,
    isProcessing: false,
    progress: 100,
    total: 50,
    completed: 50,
    failed: [],
    operationType: 'delete',
    itemName: 'produtos',
    onOpenChange: noop,
  },
};

export const CompleteWithErrors: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`isProcessing=false` + `failed.length > 0` → resumo com bloco de falhas. Pluralização de mensagens é resolvida pelo componente.',
      },
    },
  },
  args: {
    open: true,
    isProcessing: false,
    progress: 100,
    total: 50,
    completed: 50,
    failed: ['p-001', 'p-014', 'p-023'],
    operationType: 'duplicate',
    itemName: 'templates',
    onOpenChange: noop,
  },
};

export const Paused: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado intermediário: usuário clicou em "Cancelar operação" — fila pausa imediatamente e exibe confirmação inline.',
      },
    },
  },
  args: {
    open: true,
    isProcessing: true,
    isPaused: true,
    progress: 38,
    total: 100,
    completed: 38,
    failed: [],
    operationType: 'create',
    itemName: 'itens',
    onOpenChange: noop,
    onPause: noop,
    onResume: noop,
    onCancel: noop,
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: {
    open: true,
    isProcessing: false,
    progress: 100,
    total: 25,
    completed: 25,
    failed: ['t-001'],
    operationType: 'delete',
    itemName: 'templates',
    onOpenChange: noop,
  },
};
