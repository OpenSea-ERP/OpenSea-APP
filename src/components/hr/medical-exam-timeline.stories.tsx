import type { Meta, StoryObj } from '@storybook/react';
import type { MedicalExam } from '@/types/hr';
import { MedicalExamTimeline } from './medical-exam-timeline';

/**
 * Timeline vertical do PCMSO (exames médicos ocupacionais) do funcionário.
 * Card de destaque com próximo exame previsto + lista cronológica
 * descendente. Cores por tipo: Admissional/Periódico/Retorno/MudançaFunção/Demissional.
 */

const NOW = new Date();
const DAYS_AGO = (d: number) => {
  const date = new Date(NOW);
  date.setDate(date.getDate() - d);
  return date.toISOString();
};
const DAYS_AHEAD = (d: number) => {
  const date = new Date(NOW);
  date.setDate(date.getDate() + d);
  return date.toISOString();
};

const buildExam = (overrides: Partial<MedicalExam>): MedicalExam => ({
  id: overrides.id ?? `exam-${Math.random().toString(36).slice(2, 9)}`,
  tenantId: 'tenant-1',
  employeeId: 'emp-1',
  type: 'PERIODICO',
  examDate: DAYS_AGO(30),
  expirationDate: DAYS_AHEAD(335),
  doctorName: 'Ana Beatriz Lima',
  doctorCrm: 'CRM-SP 123456',
  result: 'APTO',
  clinicName: 'Clínica Saúde Ocupacional Centro',
  physicianName: 'Dr. Ricardo Mendes',
  physicianCRM: 'CRM-SP 654321',
  validityMonths: 12,
  createdAt: DAYS_AGO(30),
  updatedAt: DAYS_AGO(30),
  ...overrides,
});

const fullHistory: MedicalExam[] = [
  buildExam({
    id: 'exam-1',
    type: 'PERIODICO',
    examDate: DAYS_AGO(30),
    expirationDate: DAYS_AHEAD(335),
    result: 'APTO',
    observations: 'Sem alterações. Manter rotina de retorno em 12 meses.',
  }),
  buildExam({
    id: 'exam-2',
    type: 'MUDANCA_FUNCAO',
    examDate: DAYS_AGO(180),
    expirationDate: DAYS_AGO(180 - 365),
    result: 'APTO_COM_RESTRICOES',
    restrictions:
      'Evitar carregamento manual acima de 15kg por 90 dias após cirurgia ortopédica.',
    observations:
      'Avaliação para mudança de função (analista para coordenação de campo).',
  }),
  buildExam({
    id: 'exam-3',
    type: 'PERIODICO',
    examDate: DAYS_AGO(395),
    expirationDate: DAYS_AGO(30),
    result: 'APTO',
  }),
  buildExam({
    id: 'exam-4',
    type: 'ADMISSIONAL',
    examDate: DAYS_AGO(760),
    result: 'APTO',
    observations: 'Exame admissional concluído sem restrições.',
    documentUrl: 'https://example.com/exam-admission.pdf',
  }),
];

const meta = {
  title: 'Modules/HR/MedicalExamTimeline',
  component: MedicalExamTimeline,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Histórico de exames médicos ocupacionais com card de destaque para o próximo exame (em dia / vence em breve / vencido). Dual-theme; conector vertical da timeline colorido pelo tipo do item.',
      },
    },
  },
  args: {
    onScheduleExam: () => undefined,
    onDeleteExam: () => undefined,
  },
  decorators: [
    Story => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MedicalExamTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    exams: fullHistory,
  },
};

export const ProximoExameVencido: Story = {
  args: {
    exams: [
      buildExam({
        id: 'exam-old',
        type: 'PERIODICO',
        examDate: DAYS_AGO(420),
        expirationDate: DAYS_AGO(55),
        result: 'APTO',
      }),
    ],
    nextExamPlan: {
      status: 'OVERDUE',
      nextExamDate: new Date(DAYS_AGO(55)),
      daysUntilNextExam: -55,
      baseExam: {
        id: 'exam-old',
        type: 'PERIODICO',
        examDate: DAYS_AGO(420),
      } as MedicalExam,
    },
  },
};

export const ProximoExameProximo: Story = {
  args: {
    exams: [
      buildExam({
        id: 'exam-soon',
        type: 'PERIODICO',
        examDate: DAYS_AGO(355),
        expirationDate: DAYS_AHEAD(10),
        result: 'APTO',
      }),
    ],
    nextExamPlan: {
      status: 'DUE_SOON',
      nextExamDate: new Date(DAYS_AHEAD(10)),
      daysUntilNextExam: 10,
      baseExam: {
        id: 'exam-soon',
        type: 'PERIODICO',
        examDate: DAYS_AGO(355),
      } as MedicalExam,
    },
  },
};

export const Carregando: Story = {
  args: {
    exams: [],
    isLoading: true,
  },
};

export const Vazio: Story = {
  args: {
    exams: [],
  },
};
