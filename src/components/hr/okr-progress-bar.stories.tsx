import type { Meta, StoryObj } from '@storybook/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { OkrProgressBar } from './okr-progress-bar';

/**
 * Barra de progresso de OKR com cor por estado de saúde e marker
 * vertical para o progresso esperado (pacing). Tooltip detalha
 * dias até o prazo.
 *
 * Estados de saúde (`OkrHealthStatus`):
 *   - NOT_STARTED · ON_TRACK · AT_RISK · OFF_TRACK · COMPLETED
 */
const meta = {
  title: 'Modules/HR/OkrProgressBar',
  component: OkrProgressBar,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Barra de progresso colorida por OkrHealthStatus, com marker do progresso esperado e tooltip de detalhes. Tamanhos sm/md/lg. Inspirado em 15Five e Linear.',
      },
    },
  },
  decorators: [
    Story => (
      <TooltipProvider delayDuration={150}>
        <div className="w-80">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof OkrProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoCaminho: Story = {
  args: {
    progress: 62,
    expectedProgress: 60,
    health: 'ON_TRACK',
    daysToDeadline: 14,
    showLabel: true,
  },
};

export const EmRisco: Story = {
  args: {
    progress: 35,
    expectedProgress: 55,
    health: 'AT_RISK',
    daysToDeadline: 10,
    showLabel: true,
  },
};

export const Atrasado: Story = {
  args: {
    progress: 18,
    expectedProgress: 70,
    health: 'OFF_TRACK',
    daysToDeadline: 3,
    showLabel: true,
  },
};

export const Concluido: Story = {
  args: {
    progress: 100,
    expectedProgress: 100,
    health: 'COMPLETED',
    daysToDeadline: -2,
    showLabel: true,
  },
};

export const NaoIniciado: Story = {
  args: {
    progress: 0,
    expectedProgress: 25,
    health: 'NOT_STARTED',
    daysToDeadline: 45,
    showLabel: true,
  },
};

/**
 * Drill-down visual: três tamanhos no mesmo objetivo (Linear/Lattice
 * usam barra fina em listas e grossa em detalhe).
 */
export const Tamanhos: Story = {
  args: {
    progress: 72,
    expectedProgress: 65,
    health: 'ON_TRACK',
    daysToDeadline: 21,
  },
  render: args => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Pequeno (sm)</p>
        <OkrProgressBar {...args} size="sm" />
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Médio (md)</p>
        <OkrProgressBar {...args} size="md" />
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Grande (lg)</p>
        <OkrProgressBar {...args} size="lg" showLabel />
      </div>
    </div>
  ),
};
