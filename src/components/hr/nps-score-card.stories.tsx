import type { Meta, StoryObj } from '@storybook/react';
import { NPSScoreCard } from './nps-score-card';

/**
 * Cartão de eNPS com score grande (-100 a +100), distribuição em barra
 * horizontal (detratores/neutros/promotores) e contagem por categoria.
 * Inspirado em Lattice e 15Five.
 */
const meta = {
  title: 'Modules/HR/NPSScoreCard',
  component: NPSScoreCard,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Calcula NPS a partir das notas brutas (0-10) e renderiza score, barra de distribuição e breakdown. Cor do score: emerald (≥50), amber (≥0), rose (<0).',
      },
    },
  },
  decorators: [
    Story => (
      <div className="w-[420px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NPSScoreCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper: build score arrays
const range = (count: number, value: number) => Array(count).fill(value);

export const Excelente: Story = {
  args: {
    title: 'eNPS — Q4 2026',
    subtitle: 'Pesquisa anual de engajamento da Engenharia',
    scores: [
      ...range(28, 10),
      ...range(15, 9),
      ...range(6, 8),
      ...range(2, 7),
      ...range(1, 5),
    ],
  },
};

export const Otimo: Story = {
  args: {
    title: 'eNPS — Time Comercial',
    subtitle: 'Quinzena de 15/04/2026',
    scores: [
      ...range(12, 10),
      ...range(10, 9),
      ...range(8, 8),
      ...range(4, 7),
      ...range(3, 6),
      ...range(1, 4),
    ],
  },
};

export const Aceitavel: Story = {
  args: {
    title: 'eNPS — Operações',
    subtitle: 'Pulse semanal',
    scores: [
      ...range(8, 10),
      ...range(6, 9),
      ...range(7, 8),
      ...range(5, 7),
      ...range(6, 5),
      ...range(3, 3),
    ],
  },
};

export const Critico: Story = {
  args: {
    title: 'eNPS — Suporte N1',
    subtitle: 'Resultado preocupante após mudança de ferramenta',
    scores: [
      ...range(2, 10),
      ...range(3, 9),
      ...range(4, 8),
      ...range(5, 6),
      ...range(8, 4),
      ...range(4, 2),
    ],
  },
};

export const Vazio: Story = {
  args: {
    title: 'eNPS — Time recém-criado',
    subtitle: 'Aguardando primeiras respostas',
    scores: [],
  },
};
