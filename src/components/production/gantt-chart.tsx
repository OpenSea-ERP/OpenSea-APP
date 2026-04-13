'use client';

import { useMemo, useRef, useState } from 'react';
import type { ScheduleEntry, ScheduleEntryStatus } from '@/types/production';

// ---------------------------------------------------------------------------
// Status color mapping
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<
  ScheduleEntryStatus,
  { bg: string; border: string; text: string; label: string }
> = {
  PLANNED: {
    bg: 'bg-sky-500/90 dark:bg-sky-500/80',
    border: 'border-sky-600 dark:border-sky-400',
    text: 'text-white',
    label: 'Planejado',
  },
  CONFIRMED: {
    bg: 'bg-violet-500/90 dark:bg-violet-500/80',
    border: 'border-violet-600 dark:border-violet-400',
    text: 'text-white',
    label: 'Confirmado',
  },
  IN_PROGRESS: {
    bg: 'bg-emerald-500/90 dark:bg-emerald-500/80',
    border: 'border-emerald-600 dark:border-emerald-400',
    text: 'text-white',
    label: 'Em Andamento',
  },
  COMPLETED: {
    bg: 'bg-slate-500/90 dark:bg-slate-400/80',
    border: 'border-slate-600 dark:border-slate-300',
    text: 'text-white',
    label: 'Concluído',
  },
  CANCELLED: {
    bg: 'bg-rose-500/90 dark:bg-rose-500/80',
    border: 'border-rose-600 dark:border-rose-400',
    text: 'text-white',
    label: 'Cancelado',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function diffDays(a: Date, b: Date): number {
  return Math.round(
    (startOfDay(b).getTime() - startOfDay(a).getTime()) / (1000 * 60 * 60 * 24),
  );
}

function formatWeekday(date: Date): string {
  return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
}

function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GanttRow {
  label: string;
  entries: ScheduleEntry[];
}

export interface GanttChartProps {
  entries: ScheduleEntry[];
  startDate: Date;
  endDate: Date;
  onEntryClick?: (entry: ScheduleEntry) => void;
  /** Map of workstationId -> workstation name for row grouping */
  workstationNames?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function Tooltip({
  entry,
  x,
  y,
}: {
  entry: ScheduleEntry;
  x: number;
  y: number;
}) {
  const colors = STATUS_COLORS[entry.status];
  return (
    <div
      className="fixed z-50 pointer-events-none rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-lg p-3 min-w-[200px] max-w-[280px]"
      style={{ left: x + 12, top: y - 60 }}
    >
      <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
        {entry.title}
      </p>
      <div className="mt-1 space-y-1 text-xs text-gray-600 dark:text-white/60">
        <p>
          Início: {formatShortDate(new Date(entry.startDate))}
        </p>
        <p>
          Fim: {formatShortDate(new Date(entry.endDate))}
        </p>
        <p className="flex items-center gap-1.5">
          Status:{' '}
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${colors.bg} ${colors.text}`}
          >
            {colors.label}
          </span>
        </p>
        {entry.notes && (
          <p className="pt-1 border-t border-gray-100 dark:border-white/10 line-clamp-2">
            {entry.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const DAY_WIDTH = 40; // px per day column (min)
const ROW_HEIGHT = 44; // px per row
const HEADER_HEIGHT = 52; // px for header

export function GanttChart({
  entries,
  startDate,
  endDate,
  onEntryClick,
  workstationNames,
}: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredEntry, setHoveredEntry] = useState<{
    entry: ScheduleEntry;
    x: number;
    y: number;
  } | null>(null);

  // Build day columns
  const days = useMemo(() => {
    const s = startOfDay(startDate);
    const e = startOfDay(endDate);
    const totalDays = diffDays(s, e) + 1;
    const result: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      result.push(addDays(s, i));
    }
    return result;
  }, [startDate, endDate]);

  const totalDays = days.length;

  // Today index
  const todayIdx = useMemo(() => {
    const today = startOfDay(new Date());
    const idx = diffDays(startOfDay(startDate), today);
    if (idx >= 0 && idx < totalDays) return idx;
    return -1;
  }, [startDate, totalDays]);

  // Group entries into rows
  const rows = useMemo<GanttRow[]>(() => {
    // If we have workstation names, group by workstation
    const hasWorkstations =
      workstationNames && Object.keys(workstationNames).length > 0;

    if (hasWorkstations) {
      const groups = new Map<string, ScheduleEntry[]>();
      const ungrouped: ScheduleEntry[] = [];

      for (const entry of entries) {
        if (entry.workstationId && workstationNames[entry.workstationId]) {
          const key = entry.workstationId;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(entry);
        } else {
          ungrouped.push(entry);
        }
      }

      const result: GanttRow[] = [];
      for (const [wsId, wsEntries] of groups) {
        result.push({
          label: workstationNames[wsId],
          entries: wsEntries,
        });
      }
      if (ungrouped.length > 0) {
        result.push({ label: 'Sem estação', entries: ungrouped });
      }
      return result;
    }

    // Flat list — one entry per row
    return entries.map(entry => ({
      label: entry.title,
      entries: [entry],
    }));
  }, [entries, workstationNames]);

  const chartWidth = Math.max(totalDays * DAY_WIDTH, 600);

  // Calculate bar position for an entry
  function getBarStyle(entry: ScheduleEntry) {
    const s = startOfDay(new Date(entry.startDate));
    const e = startOfDay(new Date(entry.endDate));
    const rangeStart = startOfDay(startDate);

    const startOffset = Math.max(0, diffDays(rangeStart, s));
    const endOffset = Math.min(totalDays - 1, diffDays(rangeStart, e));
    const barDays = endOffset - startOffset + 1;

    const left = (startOffset / totalDays) * 100;
    const width = (barDays / totalDays) * 100;

    return { left: `${left}%`, width: `${width}%` };
  }

  if (entries.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-16 text-gray-500 dark:text-white/40 text-sm"
        data-testid="gantt-empty"
      >
        Nenhuma entrada para exibir no período selecionado.
      </div>
    );
  }

  return (
    <div className="relative" data-testid="gantt-chart">
      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="overflow-x-auto overflow-y-auto rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900/50"
        style={{ maxHeight: 480 }}
      >
        <div style={{ width: chartWidth, minWidth: '100%' }}>
          {/* Header — sticky */}
          <div
            className="sticky top-0 z-20 flex border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-800/80 backdrop-blur"
            style={{ height: HEADER_HEIGHT }}
          >
            {/* Row label column */}
            <div className="sticky left-0 z-30 w-[160px] shrink-0 flex items-center px-3 font-medium text-xs text-gray-500 dark:text-white/50 border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-800/80">
              Estação / Entrada
            </div>
            {/* Day columns */}
            <div className="flex-1 flex relative">
              {days.map((day, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center text-center border-r border-gray-100 dark:border-white/5 ${
                    isWeekend(day)
                      ? 'bg-slate-50 dark:bg-slate-800/30'
                      : ''
                  }`}
                  style={{ width: `${(1 / totalDays) * 100}%`, minWidth: DAY_WIDTH }}
                >
                  <span className="text-[10px] font-medium text-gray-400 dark:text-white/40 uppercase">
                    {formatWeekday(day)}
                  </span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-white/80">
                    {day.getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className={`flex border-b border-gray-100 dark:border-white/5 ${
                rowIdx % 2 === 0
                  ? 'bg-white dark:bg-slate-900/30'
                  : 'bg-gray-50/50 dark:bg-slate-800/20'
              }`}
              style={{ height: ROW_HEIGHT }}
            >
              {/* Row label */}
              <div className="sticky left-0 z-10 w-[160px] shrink-0 flex items-center px-3 border-r border-gray-200 dark:border-white/10 bg-inherit">
                <span className="text-xs font-medium text-gray-700 dark:text-white/70 truncate">
                  {row.label}
                </span>
              </div>

              {/* Entry bars area */}
              <div className="flex-1 relative">
                {/* Day grid lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {days.map((day, idx) => (
                    <div
                      key={idx}
                      className={`border-r border-gray-100 dark:border-white/5 ${
                        isWeekend(day)
                          ? 'bg-slate-50/50 dark:bg-slate-800/20'
                          : ''
                      }`}
                      style={{ width: `${(1 / totalDays) * 100}%`, minWidth: DAY_WIDTH }}
                    />
                  ))}
                </div>

                {/* Today line */}
                {todayIdx >= 0 && (
                  <div
                    className="absolute top-0 bottom-0 w-px border-l-2 border-dashed border-rose-500 z-10 pointer-events-none"
                    style={{
                      left: `${((todayIdx + 0.5) / totalDays) * 100}%`,
                    }}
                  />
                )}

                {/* Bars */}
                {row.entries.map((entry) => {
                  const style = getBarStyle(entry);
                  const colors = STATUS_COLORS[entry.status];
                  return (
                    <div
                      key={entry.id}
                      className={`absolute top-1.5 h-8 rounded-md border cursor-pointer transition-all hover:brightness-110 hover:shadow-md flex items-center px-2 overflow-hidden ${colors.bg} ${colors.border} ${colors.text}`}
                      style={{
                        left: style.left,
                        width: style.width,
                        minWidth: 24,
                      }}
                      onClick={() => onEntryClick?.(entry)}
                      onMouseEnter={(e) => {
                        setHoveredEntry({
                          entry,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      onMouseMove={(e) => {
                        if (hoveredEntry?.entry.id === entry.id) {
                          setHoveredEntry({
                            entry,
                            x: e.clientX,
                            y: e.clientY,
                          });
                        }
                      }}
                      onMouseLeave={() => setHoveredEntry(null)}
                      data-testid={`gantt-bar-${entry.id}`}
                    >
                      <span className="text-[11px] font-medium truncate leading-none">
                        {entry.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating tooltip */}
      {hoveredEntry && (
        <Tooltip
          entry={hoveredEntry.entry}
          x={hoveredEntry.x}
          y={hoveredEntry.y}
        />
      )}
    </div>
  );
}
