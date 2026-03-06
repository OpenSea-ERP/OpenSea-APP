'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Board, Card } from '@/types/tasks';
import { PRIORITY_CONFIG } from '@/types/tasks';
import { PriorityBadge } from '../shared/priority-badge';
import { MemberAvatar } from '../shared/member-avatar';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

interface TableViewProps {
  board: Board;
  cards: Card[];
  boardId: string;
  onCardClick?: (card: Card) => void;
}

type SortColumn = 'title' | 'status' | 'priority' | 'assignee' | 'dueDate' | 'labels';
type SortDirection = 'asc' | 'desc';

const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  NONE: 0,
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export function TableView({ board, cards, boardId, onCardClick }: TableViewProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const columns = useMemo(
    () => [...(board.columns ?? [])].sort((a, b) => a.position - b.position),
    [board.columns],
  );

  const columnMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const col of columns) map.set(col.id, col.title);
    return map;
  }, [columns]);

  const sortedCards = useMemo(() => {
    if (!sortColumn) return cards;

    const sorted = [...cards].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'title':
          cmp = a.title.localeCompare(b.title, 'pt-BR');
          break;
        case 'status': {
          const nameA = columnMap.get(a.columnId) ?? '';
          const nameB = columnMap.get(b.columnId) ?? '';
          cmp = nameA.localeCompare(nameB, 'pt-BR');
          break;
        }
        case 'priority':
          cmp = (PRIORITY_ORDER[a.priority] ?? 0) - (PRIORITY_ORDER[b.priority] ?? 0);
          break;
        case 'assignee':
          cmp = (a.assigneeName ?? '').localeCompare(b.assigneeName ?? '', 'pt-BR');
          break;
        case 'dueDate': {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          cmp = dateA - dateB;
          break;
        }
        case 'labels':
          cmp = (a.labels?.length ?? 0) - (b.labels?.length ?? 0);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [cards, sortColumn, sortDirection, columnMap]);

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }

  function SortIcon({ column }: { column: SortColumn }) {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-10">
                #
              </th>
              {[
                { key: 'title' as const, label: 'Título' },
                { key: 'status' as const, label: 'Coluna', width: 'w-36' },
                { key: 'priority' as const, label: 'Prioridade', width: 'w-32' },
                { key: 'assignee' as const, label: 'Responsável', width: 'w-40' },
                { key: 'dueDate' as const, label: 'Prazo', width: 'w-36' },
                { key: 'labels' as const, label: 'Etiquetas', width: 'w-32' },
              ].map(({ key, label, width }) => (
                <th key={key} className={cn('px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider', width)}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => handleSort(key)}
                  >
                    {label}
                    <SortIcon column={key} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sortedCards.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Nenhum cartão encontrado
                </td>
              </tr>
            ) : (
              sortedCards.map((card, index) => {
                const columnName = columnMap.get(card.columnId) ?? '--';
                const overdue = isOverdue(card.dueDate);

                return (
                  <tr
                    key={card.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => onCardClick?.(card)}
                  >
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium line-clamp-1">{card.title}</span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{columnName}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1.5">
                        <PriorityBadge priority={card.priority} />
                        <span className={cn('text-xs font-medium', PRIORITY_CONFIG[card.priority].color)}>
                          {PRIORITY_CONFIG[card.priority].label}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {card.assigneeName ? (
                        <span className="inline-flex items-center gap-2">
                          <MemberAvatar name={card.assigneeName} size="sm" />
                          <span className="text-sm truncate max-w-[120px]">{card.assigneeName}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {card.dueDate ? (
                        <span className={cn('text-xs font-medium', overdue ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                          {formatDate(card.dueDate)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {card.labels && card.labels.length > 0 ? (
                        <div className="flex items-center gap-1">
                          {card.labels.slice(0, 3).map((label) => (
                            <span
                              key={label.id}
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: label.color }}
                              title={label.name}
                            />
                          ))}
                          {card.labels.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{card.labels.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">--</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
