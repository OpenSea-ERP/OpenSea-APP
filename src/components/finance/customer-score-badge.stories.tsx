import type { Meta, StoryObj } from '@storybook/react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  CUSTOMER_SCORE_COLORS,
  CUSTOMER_SCORE_LABELS,
  type CustomerScore,
} from '@/types/finance';
import { CustomerScoreBadge } from './customer-score-badge';

// ============================================================================
// VISUAL REPLICA
// ----------------------------------------------------------------------------
// O componente real (`CustomerScoreBadge`) consome o hook `useCustomerScore`
// que dispara TanStack Query contra o backend. Em Storybook a query não
// resolve, então as stories abaixo usam um réplica visual (`ScoreBadgeReplica`)
// que renderiza os mesmos primitivos (Badge + Tooltip) e usa as mesmas
// constantes (`CUSTOMER_SCORE_COLORS`, `CUSTOMER_SCORE_LABELS`) — preserva
// fielmente a aparência sem depender de provider de dados.
// ============================================================================

interface ScoreBadgeReplicaProps {
  score: CustomerScore;
  className?: string;
}

function ScoreBadgeReplica({ score, className }: ScoreBadgeReplicaProps) {
  const colors = CUSTOMER_SCORE_COLORS[score.level];
  const label = CUSTOMER_SCORE_LABELS[score.level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'text-xs font-medium cursor-help',
              colors.bg,
              colors.text,
              className
            )}
            aria-label={`Score do cliente: ${label} (${score.score})`}
          >
            {label} ({score.score})
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[240px]">
          <div className="space-y-1.5 text-xs">
            <p className="font-semibold">{score.customerName}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <span className="text-muted-foreground">Média de dias:</span>
              <span className="font-mono">
                {score.avgDaysToPay.toFixed(1)} dias
              </span>
              <span className="text-muted-foreground">Taxa em dia:</span>
              <span className="font-mono">
                {(score.onTimeRate * 100).toFixed(0)}%
              </span>
              <span className="text-muted-foreground">Total de títulos:</span>
              <span className="font-mono">{score.totalEntries}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// FIXTURES
// ============================================================================

const excellentScore: CustomerScore = {
  customerName: 'Construtora Horizonte Ltda',
  score: 95,
  level: 'EXCELLENT',
  avgDaysToPay: 1.2,
  onTimeRate: 0.98,
  totalEntries: 142,
};

const goodScore: CustomerScore = {
  customerName: 'Comércio Vila Nova S.A.',
  score: 78,
  level: 'GOOD',
  avgDaysToPay: 4.5,
  onTimeRate: 0.85,
  totalEntries: 87,
};

const fairScore: CustomerScore = {
  customerName: 'Mercearia São José ME',
  score: 55,
  level: 'FAIR',
  avgDaysToPay: 12.7,
  onTimeRate: 0.62,
  totalEntries: 34,
};

const poorScore: CustomerScore = {
  customerName: 'Distribuidora Atrasada Ltda',
  score: 22,
  level: 'POOR',
  avgDaysToPay: 28.3,
  onTimeRate: 0.31,
  totalEntries: 19,
};

// ============================================================================
// META
// ============================================================================

const meta = {
  title: 'Modules/Finance/CustomerScoreBadge',
  component: CustomerScoreBadge,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Badge que sumariza a confiabilidade de pagamento de um cliente em quatro níveis (Excelente, Bom, Regular, Ruim) com tooltip detalhado mostrando média de dias para pagar, taxa de pontualidade e total de títulos. **Stories abaixo usam réplica visual** porque o componente real depende do hook `useCustomerScore` (TanStack Query) que não resolve em Storybook.',
      },
    },
  },
} satisfies Meta<typeof CustomerScoreBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// STORIES
// ============================================================================

export const Excellent: Story = {
  render: () => <ScoreBadgeReplica score={excellentScore} />,
  parameters: {
    docs: {
      description: {
        story:
          'Cliente top — 98% de pontualidade, paga em média 1,2 dias antes do vencimento. Verde.',
      },
    },
  },
};

export const Good: Story = {
  render: () => <ScoreBadgeReplica score={goodScore} />,
  parameters: {
    docs: {
      description: {
        story: 'Cliente confiável — pequenos atrasos esporádicos. Azul.',
      },
    },
  },
};

export const Fair: Story = {
  render: () => <ScoreBadgeReplica score={fairScore} />,
  parameters: {
    docs: {
      description: {
        story:
          'Atenção — atrasos moderados e taxa de pontualidade abaixo de 70%. Âmbar.',
      },
    },
  },
};

export const Poor: Story = {
  render: () => <ScoreBadgeReplica score={poorScore} />,
  parameters: {
    docs: {
      description: {
        story:
          'Risco alto — atrasos médios >28 dias, menos de 1/3 dos títulos pagos em dia. Rosa.',
      },
    },
  },
};

export const AllLevels: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <ScoreBadgeReplica score={excellentScore} />
      <ScoreBadgeReplica score={goodScore} />
      <ScoreBadgeReplica score={fairScore} />
      <ScoreBadgeReplica score={poorScore} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Comparação lado a lado dos quatro níveis para verificação rápida do contraste de cores entre as variantes.',
      },
    },
  },
};

export const Loading: Story = {
  render: () => (
    <Badge variant="outline" className="text-xs gap-1" aria-busy>
      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      Score
    </Badge>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Estado durante o fetch do score no backend — badge neutro com ícone girando.',
      },
    },
  },
};
