import type { Meta, StoryObj } from '@storybook/react';
import { InstallmentPreview } from './installment-preview';

const meta = {
  title: 'Modules/Finance/InstallmentPreview',
  component: InstallmentPreview,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Pré-visualização de parcelas geradas a partir de um lançamento parcelado — exibe número da parcela, vencimento calculado e valor (com ajuste de centavos na última parcela). Usado dentro de wizards de criação de Contas a Pagar/Receber recorrentes.',
      },
    },
  },
} satisfies Meta<typeof InstallmentPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  args: {
    dueDate: '2025-05-15',
    amount: 12000,
    totalInstallments: 12,
    interval: 1,
    unit: 'MONTHLY',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empréstimo de R$ 12.000,00 em 12 parcelas mensais (R$ 1.000,00 cada), iniciando em 15/05/2025.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    dueDate: '',
    amount: 0,
    totalInstallments: 0,
    interval: 1,
    unit: 'MONTHLY',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estado inicial — sem dados suficientes para calcular as parcelas (data ou valor não preenchidos).',
      },
    },
  },
};

export const ThreeInstallmentsWithRemainder: Story = {
  args: {
    dueDate: '2025-05-15',
    amount: 1000,
    totalInstallments: 3,
    interval: 1,
    unit: 'MONTHLY',
  },
  parameters: {
    docs: {
      description: {
        story:
          'R$ 1.000,00 em 3 parcelas — primeiras parcelas R$ 333,33 e a última recebe o resto (R$ 333,34) para fechar exatamente o total.',
      },
    },
  },
};

export const QuarterlyConsortium: Story = {
  args: {
    dueDate: '2025-05-15',
    amount: 24000,
    totalInstallments: 8,
    interval: 1,
    unit: 'QUARTERLY',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Consórcio de 8 parcelas trimestrais de R$ 3.000,00 — exemplo de cadência longa típica de imobiliário/veicular.',
      },
    },
  },
};

export const BiweeklySalary: Story = {
  args: {
    dueDate: '2025-05-15',
    amount: 6000,
    totalInstallments: 6,
    interval: 1,
    unit: 'BIWEEKLY',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Pagamento quinzenal — 6 parcelas a cada 15 dias, padrão de retenção de prestador de serviços.',
      },
    },
  },
};
