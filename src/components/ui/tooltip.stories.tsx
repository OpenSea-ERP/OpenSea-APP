import type { Meta, StoryObj } from '@storybook/react';
import { Info, Trash2 } from 'lucide-react';
import { Button } from './button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Passe o mouse aqui</Button>
      </TooltipTrigger>
      <TooltipContent>Dica rápida sobre esta ação</TooltipContent>
    </Tooltip>
  ),
};

export const WithDelay: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'TooltipProvider aceita `delayDuration` (ms) — abre apenas após o mouse permanecer parado pelo intervalo definido. Útil para evitar flicker em barras de ferramentas densas.',
      },
    },
  },
  render: () => (
    <TooltipProvider delayDuration={500}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" aria-label="Mais informações">
            <Info className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Aparece após 500ms parado</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const MultiLine: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Detalhes do plano</Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-balance">
        Plano Pro inclui usuários ilimitados, integrações com eSocial e backups
        diários automáticos. Atualize a qualquer momento sem interrupção do
        serviço.
      </TooltipContent>
    </Tooltip>
  ),
};

export const OnDisabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Botões desabilitados não disparam eventos de mouse. Para mostrar tooltip explicando o motivo, envolva em `<span>` que recebe o foco/hover (e mantenha `aria-label`).',
      },
    },
  },
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} aria-label="Excluir registro indisponível">
          <Button
            variant="destructive"
            disabled
            className="pointer-events-none"
          >
            <Trash2 className="size-4" />
            Excluir
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        Você não tem permissão para excluir este registro
      </TooltipContent>
    </Tooltip>
  ),
};
