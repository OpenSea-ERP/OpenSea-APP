'use client';

/**
 * SurveyTrendChart
 *
 * Gráfico de linha (Recharts) para acompanhar a evolução de scores de pesquisas
 * recorrentes (Pulse semanais, eNPS mensais etc.).
 *
 * Aceita N séries (ex: pergunta 1, pergunta 2, eNPS overall) plotadas no mesmo eixo X
 * (data da execução). Usa a paleta padrão do produto (violet/sky/emerald/rose/amber/teal).
 *
 * Empty state com explicação amigável quando não há dados suficientes.
 */

import { Card } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface SurveyTrendPoint {
  /** Data da execução (ISO string ou Date). */
  date: string | Date;
  /** Métricas por série — chave é o nome da série, valor é o número (ou null para gap). */
  [seriesKey: string]: string | number | Date | null;
}

export interface SurveyTrendSeries {
  key: string;
  label: string;
  color: string;
}

export interface SurveyTrendChartProps {
  data: SurveyTrendPoint[];
  series: SurveyTrendSeries[];
  /** Domínio do eixo Y. Padrão: [-100, 100] para eNPS. Use [0, 5] ou [0, 10] para ratings. */
  yDomain?: [number, number];
  height?: number;
  title?: string;
  subtitle?: string;
  testId?: string;
}

const SERIES_PALETTE = [
  'oklch(0.61 0.22 293)', // violet-500
  'oklch(0.69 0.18 230)', // sky-500
  'oklch(0.7 0.18 162)', // emerald-500
  'oklch(0.65 0.21 16)', // rose-500
  'oklch(0.78 0.16 75)', // amber-500
  'oklch(0.7 0.13 195)', // teal-500
];

export function SurveyTrendChart({
  data,
  series,
  yDomain = [-100, 100],
  height = 320,
  title = 'Tendência ao longo do tempo',
  subtitle,
  testId,
}: SurveyTrendChartProps) {
  const formattedData = useMemo(
    () =>
      data.map(point => ({
        ...point,
        dateLabel:
          point.date instanceof Date
            ? point.date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
              })
            : new Date(point.date as string).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
              }),
      })),
    [data]
  );

  const isEmpty = data.length < 2;

  return (
    <Card
      className="bg-white dark:bg-slate-800/60 border border-border p-5"
      data-testid={testId}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </div>

      {isEmpty ? (
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{ height }}
        >
          <div className="rounded-full bg-muted p-3 mb-3">
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Sem dados suficientes ainda</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            A tendência aparecerá aqui assim que esta pesquisa tiver pelo menos
            duas execuções com respostas.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={formattedData}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.25)"
            />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11 }}
              stroke="rgba(100, 116, 139, 0.7)"
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 11 }}
              stroke="rgba(100, 116, 139, 0.7)"
            />
            <Tooltip
              contentStyle={{
                fontSize: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            {series.map((entry, index) => (
              <Line
                key={entry.key}
                type="monotone"
                dataKey={entry.key}
                name={entry.label}
                stroke={entry.color || SERIES_PALETTE[index % SERIES_PALETTE.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

export const SURVEY_TREND_SERIES_PALETTE = SERIES_PALETTE;
