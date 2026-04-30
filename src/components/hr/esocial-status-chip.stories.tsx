import type { Meta, StoryObj } from '@storybook/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { EsocialStatusChip } from './esocial-status-chip';

/**
 * Chip de status de evento eSocial. Cobre o ciclo completo:
 * DRAFT → REVIEWED → APPROVED → TRANSMITTING → ACCEPTED/REJECTED.
 * Inclui aliases (PENDING/SENDING/SENT) e estados de lote
 * (TRANSMITTED/PARTIALLY_ACCEPTED). Tooltip com código gov.br + mensagem
 * só renderiza quando há `returnCode` ou `returnMessage`.
 */
const meta = {
  title: 'Modules/HR/EsocialStatusChip',
  component: EsocialStatusChip,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Chip dual-theme para status de eventos e lotes eSocial. Ícone animado em estados em transmissão; tooltip rico com código gov.br traduzido e sugestão de correção.',
      },
    },
  },
  decorators: [
    Story => (
      <TooltipProvider delayDuration={150}>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof EsocialStatusChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rascunho: Story = {
  args: { status: 'DRAFT' },
};

export const Aceito: Story = {
  args: {
    status: 'ACCEPTED',
    returnCode: '201',
    returnMessage: 'Evento aceito sem ressalvas pelo SEFAZ eSocial.',
  },
};

export const Transmitindo: Story = {
  args: { status: 'TRANSMITTING' },
};

export const ParcialmenteAceito: Story = {
  args: {
    status: 'PARTIALLY_ACCEPTED',
    returnCode: '202',
    returnMessage:
      'Lote aceito parcialmente. 8 eventos aceitos e 2 rejeitados. Verifique os eventos individuais.',
  },
};

export const Rejeitado: Story = {
  args: {
    status: 'REJECTED',
    returnCode: '1010',
    returnMessage:
      'Estrutura do XML em desacordo com o leiaute. CPF do trabalhador inválido na linha 24.',
  },
};

export const Erro: Story = {
  args: {
    status: 'ERROR',
    returnCode: '500',
    returnMessage:
      'Falha ao comunicar com o serviço gov.br. Tente novamente em instantes.',
  },
};

/**
 * Galeria com todas as variantes lado a lado para revisão visual rápida
 * de cores e ícones em cada estado.
 */
export const TodosEstados: Story = {
  args: { status: 'DRAFT' },
  render: () => (
    <div className="flex max-w-md flex-wrap gap-2">
      <EsocialStatusChip status="DRAFT" />
      <EsocialStatusChip status="PENDING" />
      <EsocialStatusChip status="REVIEWED" />
      <EsocialStatusChip status="APPROVED" />
      <EsocialStatusChip status="TRANSMITTING" />
      <EsocialStatusChip status="SENT" />
      <EsocialStatusChip status="TRANSMITTED" />
      <EsocialStatusChip status="PARTIALLY_ACCEPTED" />
      <EsocialStatusChip status="ACCEPTED" />
      <EsocialStatusChip status="REJECTED" />
      <EsocialStatusChip status="ERROR" />
    </div>
  ),
};
