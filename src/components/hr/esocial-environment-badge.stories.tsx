import type { Meta, StoryObj } from '@storybook/react';
import {
  AlertTriangle,
  Beaker,
  CheckCircle2,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Réplica visual do `EsocialEnvironmentBadge` real.
 *
 * O componente em produção depende de `useQuery(['esocial-config'])` e do
 * `esocialService.getConfig()`. Em Storybook não temos backend, então
 * reproduzimos o markup exatamente — mesmas classes Tailwind, mesmos
 * ícones, mesmo banner de atenção. Quando os achados de mock global
 * forem implementados em `preview.tsx` esta story pode passar a usar o
 * componente real.
 */

type Tone = 'emerald' | 'amber' | 'sky';
type Environment = 'PRODUCAO' | 'PRODUCAO_RESTRITA' | 'HOMOLOGACAO';

interface EnvInfo {
  label: string;
  tone: Tone;
  icon: LucideIcon;
}

const ENV_INFO: Record<Environment, EnvInfo> = {
  PRODUCAO: { label: 'Produção', tone: 'emerald', icon: CheckCircle2 },
  PRODUCAO_RESTRITA: {
    label: 'Produção restrita',
    tone: 'amber',
    icon: FlaskConical,
  },
  HOMOLOGACAO: { label: 'Homologação', tone: 'sky', icon: Beaker },
};

const TONE_CLASS: Record<Tone, string> = {
  emerald:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  amber:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  sky: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20',
};

interface BadgeReplicaProps {
  environment: Environment;
  showBanner?: boolean;
}

function EnvironmentBadgeReplica({
  environment,
  showBanner = false,
}: BadgeReplicaProps) {
  const info = ENV_INFO[environment];
  const Icon = info.icon;

  return (
    <div className="flex flex-col gap-2">
      <span
        data-testid="esocial-environment-badge"
        aria-label={`Ambiente eSocial: ${info.label}`}
        className={cn(
          'inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium',
          TONE_CLASS[info.tone]
        )}
      >
        <Icon className="h-3 w-3" aria-hidden />
        eSocial · {info.label}
      </span>
      {showBanner && environment !== 'PRODUCAO' && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            {environment === 'PRODUCAO_RESTRITA' ? (
              <>
                Você está em <strong>Produção Restrita</strong>. Os eventos
                transmitidos aqui são aceitos pelo eSocial, mas{' '}
                <strong>não têm validade legal</strong>. Para cumprir obrigações
                fiscais, mude para <strong>Produção</strong> em Configurações.
              </>
            ) : (
              <>
                Você está em <strong>Homologação</strong>. Use este ambiente
                apenas para testes de integração. Os eventos transmitidos aqui
                não têm valor legal.
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const meta = {
  title: 'Modules/HR/EsocialEnvironmentBadge',
  component: EnvironmentBadgeReplica,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Badge que sinaliza em qual ambiente eSocial o tenant está operando. Réplica visual do componente real (provider-locked por `useQuery`). Banner amarelo é exibido quando ambiente não é PRODUCAO.',
      },
    },
  },
} satisfies Meta<typeof EnvironmentBadgeReplica>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Producao: Story = {
  args: { environment: 'PRODUCAO' },
};

export const ProducaoRestrita: Story = {
  args: { environment: 'PRODUCAO_RESTRITA', showBanner: true },
};

export const Homologacao: Story = {
  args: { environment: 'HOMOLOGACAO', showBanner: true },
};

export const HomologacaoSemBanner: Story = {
  args: { environment: 'HOMOLOGACAO', showBanner: false },
};
