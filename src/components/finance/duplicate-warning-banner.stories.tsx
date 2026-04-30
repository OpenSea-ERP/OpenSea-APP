import type { Meta, StoryObj } from '@storybook/react';
import { DuplicateWarningBanner } from './duplicate-warning-banner';
import type { DuplicateMatch } from '@/types/finance';

// ============================================================================
// Fixtures realistas — duplicidades de lançamentos financeiros
// ============================================================================

const singleMatch: DuplicateMatch[] = [
  {
    entryId: 'fin_01HX7Y2K3Z4N5V6W7Q8R9S',
    description: 'Aluguel - Sala 12 - Edifício Comercial',
    supplierName: 'Imobiliária São Paulo Ltda',
    expectedAmount: 3450.0,
    dueDate: '2025-05-15',
    score: 92,
    matchReasons: ['Mesmo fornecedor', 'Mesmo valor', 'Vencimento próximo'],
  },
];

const multipleMatches: DuplicateMatch[] = [
  {
    entryId: 'fin_01HX7Y2K3Z4N5V6W7Q8R9S',
    description: 'Energia elétrica - Matriz - Maio/2025',
    supplierName: 'CPFL Energia S.A.',
    expectedAmount: 1234.56,
    dueDate: '2025-05-10',
    score: 95,
    matchReasons: ['Mesmo fornecedor', 'Mesmo valor', 'Mesma descrição'],
  },
  {
    entryId: 'fin_01HX7Y2K3Z4N5V6W7Q8R9T',
    description: 'Energia eletrica matriz Maio',
    supplierName: 'CPFL Energia S.A.',
    expectedAmount: 1234.56,
    dueDate: '2025-05-12',
    score: 78,
    matchReasons: ['Mesmo fornecedor', 'Mesmo valor'],
  },
  {
    entryId: 'fin_01HX7Y2K3Z4N5V6W7Q8R9U',
    description: 'Conta de luz Banco do Brasil agência 1234',
    customerName: 'Banco do Brasil S.A.',
    expectedAmount: 1230.0,
    dueDate: '2025-05-15',
    score: 65,
    matchReasons: ['Valor similar', 'Vencimento próximo'],
  },
];

const meta = {
  title: 'Modules/Finance/DuplicateWarningBanner',
  component: DuplicateWarningBanner,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Banner de aviso disparado durante criação de lançamento financeiro quando o sistema detecta possíveis duplicidades (mesmo fornecedor, mesmo valor, vencimento próximo). Cada match exibe descrição, dados de identificação, score percentual de similaridade e badges com motivos do match.',
      },
    },
  },
} satisfies Meta<typeof DuplicateWarningBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  args: {
    duplicates: singleMatch,
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    duplicates: [],
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estado durante a verificação no backend — usuário recebe feedback imediato de que o sistema está checando duplicidades.',
      },
    },
  },
};

export const MultipleDuplicates: Story = {
  args: {
    duplicates: multipleMatches,
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Cenário comum em contas recorrentes: três entradas similares para conta de energia, com scores variados (95%, 78%, 65%) refletindo confiança decrescente do match.',
      },
    },
  },
};

export const NoMatches: Story = {
  args: {
    duplicates: [],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Sem duplicidades — componente não renderiza nada. Garantia de zero ruído visual durante criação normal de lançamento.',
      },
    },
  },
};
