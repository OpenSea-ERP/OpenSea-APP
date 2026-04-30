import type { Meta, StoryObj } from '@storybook/react';
import type { EmployeeKudos } from '@/types/hr';
import { KudosCard } from './kudos-card';

/**
 * Card de feed social de reconhecimento (estilo Slack/Lattice).
 *
 * Stories abaixo cobrem categorias, estado fixado, kudos privado e
 * variantes com permissões. A thread de respostas (`ReplyThread`) só
 * é renderizada quando o usuário expande o card — para manter as
 * stories isoladas de backend, evitamos expandi-la.
 */

const NOW = new Date();
const HOURS_AGO = (h: number) =>
  new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString();
const DAYS_AGO = (d: number) =>
  new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

const baseKudos: EmployeeKudos = {
  id: 'kudos-1',
  tenantId: 'tenant-1',
  fromEmployeeId: 'emp-1',
  toEmployeeId: 'emp-2',
  fromEmployee: {
    id: 'emp-1',
    fullName: 'Maria Silva',
    position: { name: 'Engenheira de Software' },
    department: { name: 'Tecnologia' },
  },
  toEmployee: {
    id: 'emp-2',
    fullName: 'João Souza',
    position: { name: 'Product Manager' },
    department: { name: 'Produto' },
  },
  message:
    'Obrigada por liderar a entrega do checkout v2 com tanta calma e clareza. Você manteve o time alinhado mesmo nos dias mais corridos da sprint. Inspirador!',
  category: 'LEADERSHIP',
  isPublic: true,
  createdAt: HOURS_AGO(3),
  reactionsSummary: [
    { emoji: '🎉', count: 7, hasReacted: true },
    { emoji: '👏', count: 4, hasReacted: false },
    { emoji: '💜', count: 2, hasReacted: false },
  ],
  repliesCount: 2,
  isPinned: false,
};

const meta = {
  title: 'Modules/HR/KudosCard',
  component: KudosCard,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Cartão de kudos no feed do RH. Avatares de remetente e destinatário, badge de categoria dual-theme, reações com toggle e contador de respostas. Pin/excluir gateados por permissão.',
      },
    },
  },
  args: {
    onReact: () => undefined,
    onTogglePin: () => undefined,
    onDelete: () => undefined,
  },
  decorators: [
    Story => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof KudosCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    kudos: baseKudos,
    currentEmployeeId: 'emp-3',
    canPin: false,
    canDelete: false,
  },
};

export const Fixado: Story = {
  args: {
    kudos: {
      ...baseKudos,
      id: 'kudos-pinned',
      isPinned: true,
      pinnedAt: DAYS_AGO(1),
      pinnedBy: 'admin-1',
      category: 'EXCELLENCE',
      message:
        'Reconhecimento especial pela campanha de fim de ano: 32% de aumento em conversão e zero downtime. Time inteiro de parabéns!',
    },
    canPin: true,
    canDelete: true,
    canAdminReplies: true,
  },
};

export const Privado: Story = {
  args: {
    kudos: {
      ...baseKudos,
      id: 'kudos-private',
      category: 'HELPFULNESS',
      isPublic: false,
      message:
        'Obrigado por ter me ajudado a resolver o bug do build na sexta à noite. Sem você o cliente não teria entregue a auditoria a tempo.',
      reactionsSummary: [{ emoji: '🙏', count: 1, hasReacted: true }],
      repliesCount: 0,
      fromEmployee: {
        id: 'emp-4',
        fullName: 'Carla Dias',
        position: { name: 'Líder de DevOps' },
        department: { name: 'Infraestrutura' },
      },
    },
  },
};

export const Inovacao: Story = {
  args: {
    kudos: {
      ...baseKudos,
      id: 'kudos-innovation',
      category: 'INNOVATION',
      message:
        'Sua proposta de cache em camada Redis derrubou a latência do dashboard em 60%. Excelente experimento!',
      reactionsSummary: [
        { emoji: '🚀', count: 12, hasReacted: false },
        { emoji: '💡', count: 5, hasReacted: true },
      ],
      repliesCount: 5,
    },
    canPin: true,
  },
};

export const TrabalhoEmEquipe: Story = {
  args: {
    kudos: {
      ...baseKudos,
      id: 'kudos-teamwork',
      category: 'TEAMWORK',
      message:
        'Time de RH e TI trabalharam juntos pelo onboarding dos 12 novos contratados desta segunda. Zero atrito, todos plugados na primeira manhã.',
      reactionsSummary: [
        { emoji: '🤝', count: 9, hasReacted: false },
        { emoji: '🎉', count: 6, hasReacted: false },
      ],
      repliesCount: 1,
    },
  },
};
