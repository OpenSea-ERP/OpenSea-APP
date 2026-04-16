'use client';

/**
 * NPSScoreCard
 *
 * Card de visualização de eNPS / NPS no padrão de produtos como Lattice/15Five.
 * Recebe lista de notas (0-10), calcula e renderiza:
 *   - Score grande (-100 a +100) com color-coding
 *   - Distribuição em barra horizontal: Detractors / Passives / Promoters
 *   - Counts por categoria
 *
 * Cores:
 *   - Detratores (0-6): rose
 *   - Neutros (7-8): amber
 *   - Promotores (9-10): emerald
 */

import { Card } from '@/components/ui/card';
import { useMemo } from 'react';

export interface NPSScoreCardProps {
  /** Notas individuais (cada resposta NPS) entre 0 e 10. */
  scores: number[];
  /** Título do card. Padrão "Score de Recomendação". */
  title?: string;
  /** Subtítulo/contexto opcional. */
  subtitle?: string;
  testId?: string;
}

export function NPSScoreCard({
  scores,
  title = 'Score de Recomendação',
  subtitle,
  testId,
}: NPSScoreCardProps) {
  const stats = useMemo(() => {
    const detractors = scores.filter(score => score <= 6).length;
    const passives = scores.filter(score => score >= 7 && score <= 8).length;
    const promoters = scores.filter(score => score >= 9).length;
    const total = scores.length;
    if (total === 0) {
      return {
        detractors: 0,
        passives: 0,
        promoters: 0,
        total: 0,
        detractorsPct: 0,
        passivesPct: 0,
        promotersPct: 0,
        nps: 0,
      };
    }
    const detractorsPct = (detractors / total) * 100;
    const passivesPct = (passives / total) * 100;
    const promotersPct = (promoters / total) * 100;
    const nps = Math.round(promotersPct - detractorsPct);
    return {
      detractors,
      passives,
      promoters,
      total,
      detractorsPct,
      passivesPct,
      promotersPct,
      nps,
    };
  }, [scores]);

  const npsColor =
    stats.nps >= 50
      ? 'text-emerald-600 dark:text-emerald-300'
      : stats.nps >= 0
        ? 'text-amber-600 dark:text-amber-300'
        : 'text-rose-600 dark:text-rose-300';

  const npsLabel =
    stats.nps >= 75
      ? 'Excelente'
      : stats.nps >= 50
        ? 'Ótimo'
        : stats.nps >= 30
          ? 'Bom'
          : stats.nps >= 0
            ? 'Aceitável'
            : 'Crítico';

  return (
    <Card
      className="bg-white dark:bg-slate-800/60 border border-border p-6"
      data-testid={testId}
    >
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {title}
        </h3>
        {stats.total > 0 && (
          <span className="text-xs text-muted-foreground">
            {stats.total} {stats.total === 1 ? 'resposta' : 'respostas'}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
      )}

      {stats.total === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Sem respostas suficientes para calcular o score
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-3 mb-6">
            <span className={`text-5xl font-bold ${npsColor}`}>
              {stats.nps > 0 ? `+${stats.nps}` : stats.nps}
            </span>
            <div className="flex flex-col">
              <span className={`text-sm font-semibold ${npsColor}`}>
                {npsLabel}
              </span>
              <span className="text-xs text-muted-foreground">
                Escala -100 a +100
              </span>
            </div>
          </div>

          {/* Distribution bar */}
          <div
            className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label="Distribuição entre detratores, neutros e promotores"
          >
            {stats.detractorsPct > 0 && (
              <div
                className="h-full bg-rose-500"
                style={{ width: `${stats.detractorsPct}%` }}
              />
            )}
            {stats.passivesPct > 0 && (
              <div
                className="h-full bg-amber-500"
                style={{ width: `${stats.passivesPct}%` }}
              />
            )}
            {stats.promotersPct > 0 && (
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${stats.promotersPct}%` }}
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <CategoryStat
              colorClass="bg-rose-500"
              label="Detratores"
              count={stats.detractors}
              pct={stats.detractorsPct}
            />
            <CategoryStat
              colorClass="bg-amber-500"
              label="Neutros"
              count={stats.passives}
              pct={stats.passivesPct}
            />
            <CategoryStat
              colorClass="bg-emerald-500"
              label="Promotores"
              count={stats.promoters}
              pct={stats.promotersPct}
            />
          </div>
        </>
      )}
    </Card>
  );
}

function CategoryStat({
  colorClass,
  label,
  count,
  pct,
}: {
  colorClass: string;
  label: string;
  count: number;
  pct: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${colorClass}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-base font-semibold">{count}</span>
      <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
    </div>
  );
}
