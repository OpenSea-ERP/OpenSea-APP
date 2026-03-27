'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialHealthScore } from '@/hooks/finance';
import type { HealthTrend } from '@/types/finance';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import { useMemo } from 'react';

// ─── Score Color Helpers ──────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score <= 40) return 'text-rose-500';
  if (score <= 70) return 'text-amber-500';
  return 'text-emerald-500';
}

function getScoreGradient(score: number): string {
  if (score <= 40) return '#f43f5e'; // rose-500
  if (score <= 70) return '#f59e0b'; // amber-500
  return '#10b981'; // emerald-500
}

function getScoreTrack(): string {
  return 'rgba(148, 163, 184, 0.15)'; // slate-400/15
}

function getScoreLabel(score: number): string {
  if (score <= 20) return 'Crítica';
  if (score <= 40) return 'Ruim';
  if (score <= 60) return 'Regular';
  if (score <= 80) return 'Boa';
  return 'Excelente';
}

function getDimensionBarColor(score: number, maxScore: number): string {
  const ratio = score / maxScore;
  if (ratio <= 0.3) return 'bg-rose-500';
  if (ratio <= 0.6) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function getTrendIcon(trend: HealthTrend) {
  switch (trend) {
    case 'UP':
      return <ArrowUp className="h-4 w-4 text-emerald-500" />;
    case 'DOWN':
      return <ArrowDown className="h-4 w-4 text-rose-500" />;
    case 'STABLE':
      return <ArrowRight className="h-4 w-4 text-slate-400" />;
  }
}

function getTrendLabel(trend: HealthTrend): string {
  switch (trend) {
    case 'UP':
      return 'Em alta';
    case 'DOWN':
      return 'Em queda';
    case 'STABLE':
      return 'Estável';
  }
}

function getTrendBadgeClasses(trend: HealthTrend): string {
  switch (trend) {
    case 'UP':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300';
    case 'DOWN':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300';
    case 'STABLE':
      return 'bg-slate-50 text-slate-600 dark:bg-slate-500/8 dark:text-slate-300';
  }
}

// ─── Circular Gauge ───────────────────────────────────────────────────

function CircularGauge({ score }: { score: number }) {
  const radius = 56;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const percentage = score / 100;
  const strokeDashoffset = circumference * (1 - percentage);
  const color = getScoreGradient(score);
  const trackColor = getScoreTrack();

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        className="-rotate-90"
      >
        {/* Track */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────

function HealthScoreSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Gauge skeleton */}
          <div className="flex items-center justify-center lg:justify-start">
            <Skeleton className="h-[140px] w-[140px] rounded-full" />
          </div>
          {/* Dimensions skeleton */}
          <div className="flex-1 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
          {/* Tips skeleton */}
          <div className="lg:w-72 space-y-2">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────

export function HealthScoreWidget() {
  const { data: healthScore, isLoading, error } = useFinancialHealthScore();

  const dimensionItems = useMemo(() => {
    if (!healthScore) return [];
    return healthScore.dimensions.map(dimension => ({
      ...dimension,
      percentage: (dimension.score / dimension.maxScore) * 100,
      barColor: getDimensionBarColor(dimension.score, dimension.maxScore),
    }));
  }, [healthScore]);

  if (isLoading) {
    return <HealthScoreSkeleton />;
  }

  if (error || !healthScore) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-violet-500" />
            <h3 className="text-sm font-semibold">Saúde Financeira</h3>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getTrendBadgeClasses(healthScore.trend)}`}
          >
            {getTrendIcon(healthScore.trend)}
            {getTrendLabel(healthScore.trend)}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Gauge */}
          <div className="flex items-center justify-center lg:justify-start shrink-0">
            <CircularGauge score={healthScore.score} />
          </div>

          {/* Dimension Bars */}
          <div className="flex-1 min-w-0 space-y-3">
            {dimensionItems.map(dimension => (
              <div key={dimension.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">
                    {dimension.name}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {dimension.score}/{dimension.maxScore}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${dimension.barColor}`}
                    style={{ width: `${dimension.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="lg:w-72 shrink-0">
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-muted-foreground">
                Sugestões
              </span>
            </div>
            <div className="space-y-2">
              {healthScore.tips.map((tip, index) => (
                <div
                  key={index}
                  className="text-xs leading-relaxed text-muted-foreground bg-muted/50 rounded-lg px-3 py-2"
                >
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
