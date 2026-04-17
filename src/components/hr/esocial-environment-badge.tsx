'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Beaker,
  CheckCircle2,
  FlaskConical,
} from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { esocialService } from '@/services/hr/esocial.service';
import type { EsocialEnvironment } from '@/types/esocial/esocial-config.types';

interface EsocialEnvironmentBadgeProps {
  /** Whether to render the long "atenção" banner under the chip. */
  showBanner?: boolean;
  className?: string;
}

const LABELS: Record<
  EsocialEnvironment,
  {
    label: string;
    tone: 'emerald' | 'amber' | 'sky';
    icon: typeof CheckCircle2;
  }
> = {
  PRODUCAO: { label: 'Produção', tone: 'emerald', icon: CheckCircle2 },
  PRODUCAO_RESTRITA: {
    label: 'Produção restrita',
    tone: 'amber',
    icon: FlaskConical,
  },
  HOMOLOGACAO: { label: 'Homologação', tone: 'sky', icon: Beaker },
};

const TONE_CLASS: Record<'emerald' | 'amber' | 'sky', string> = {
  emerald:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
  amber:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
  sky: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20',
};

export function EsocialEnvironmentBadge({
  showBanner = false,
  className,
}: EsocialEnvironmentBadgeProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['esocial-config'],
    queryFn: () => esocialService.getConfig(),
  });

  if (isLoading || !data) return null;

  const env = data.config.environment;
  const info = LABELS[env] ?? LABELS.HOMOLOGACAO;
  const Icon = info.icon;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span
        data-testid="esocial-environment-badge"
        className={cn(
          'inline-flex w-fit items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium',
          TONE_CLASS[info.tone]
        )}
      >
        <Icon className="h-3 w-3" />
        eSocial · {info.label}
      </span>
      {showBanner && env !== 'PRODUCAO' && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            {env === 'PRODUCAO_RESTRITA' ? (
              <>
                Você está em <strong>Produção Restrita</strong>. Os eventos
                transmitidos aqui são aceitos pelo eSocial, mas{' '}
                <strong>não têm validade legal</strong>. Para cumprir obrigações
                fiscais, mude para <strong>Produção</strong> em{' '}
                <Link
                  href="/hr/settings?tab=esocial"
                  className="underline underline-offset-2"
                >
                  Configurações
                </Link>
                .
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
