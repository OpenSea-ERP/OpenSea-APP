/**
 * OKR Tree Node (HR)
 * Componente recursivo que renderiza um nó da árvore de OKRs (Company → Team
 * → Individual) com indent visual, linha de connection, owner avatar, badges,
 * progress bar agregada e expand/collapse. Inspirado em 15Five Goals tree.
 */

'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OkrTreeNode as OkrTreeNodeData } from '@/lib/hr/okr-rollup';
import {
  getHealthBadgeClass,
  getHealthLabel,
} from '@/lib/hr/okr-rollup';
import {
  getObjectiveLevelBadgeClass,
  getObjectiveLevelLabel,
  formatPeriodLabel,
} from '@/app/(dashboard)/(modules)/hr/(entities)/okrs/src/utils';
import { ChevronDown, ChevronRight, Target, Users } from 'lucide-react';
import { useState } from 'react';
import { OkrProgressBar } from './okr-progress-bar';

export interface OkrTreeNodeProps {
  node: OkrTreeNodeData;
  depth?: number;
  defaultExpanded?: boolean;
  onSelect?: (objectiveId: string) => void;
  selectedId?: string | null;
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function OkrTreeNode({
  node,
  depth = 0,
  defaultExpanded = true,
  onSelect,
  selectedId,
}: OkrTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.objective.id;

  const ownerName = node.objective.owner?.fullName ?? 'Sem responsável';

  return (
    <div
      data-testid={`okr-node-${node.objective.id}`}
      className="relative"
      style={{ paddingLeft: depth === 0 ? 0 : '1.5rem' }}
    >
      {depth > 0 && (
        <span
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700"
        />
      )}
      {depth > 0 && (
        <span
          aria-hidden
          className="absolute left-0 top-6 h-px w-4 bg-slate-200 dark:bg-slate-700"
        />
      )}

      <div
        className={cn(
          'group relative flex items-start gap-3 rounded-lg border bg-white dark:bg-slate-800/60 p-3 transition-colors',
          'hover:border-violet-300 dark:hover:border-violet-700',
          isSelected && 'border-violet-500 ring-2 ring-violet-200 dark:ring-violet-900'
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={() => setIsExpanded(prev => !prev)}
          disabled={!hasChildren}
          aria-label={
            hasChildren
              ? isExpanded
                ? 'Recolher filhos'
                : 'Expandir filhos'
              : 'Sem filhos'
          }
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            <span className="block h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
          )}
        </Button>

        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
            'bg-linear-to-br from-violet-500 to-violet-600 text-white'
          )}
        >
          <Target className="h-4 w-4" />
        </div>

        <button
          type="button"
          onClick={() => onSelect?.(node.objective.id)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold truncate max-w-md">
                  {node.objective.title}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] py-0',
                    getObjectiveLevelBadgeClass(node.objective.level)
                  )}
                >
                  {getObjectiveLevelLabel(node.objective.level)}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] py-0',
                    getHealthBadgeClass(node.health)
                  )}
                >
                  {getHealthLabel(node.health)}
                </Badge>
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[9px] bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                      {getInitials(ownerName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[140px]">{ownerName}</span>
                </span>
                <span>{formatPeriodLabel(node.objective.period)}</span>
                {hasChildren && (
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {node.children.length} filho(s)
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 min-w-[140px]">
              <div className="text-xs font-medium">
                {node.rollupProgress}%
              </div>
              <OkrProgressBar
                progress={node.rollupProgress}
                health={node.health}
                expectedProgress={node.expectedProgress}
                daysToDeadline={node.daysToDeadline}
                size="sm"
                className="w-32"
              />
            </div>
          </div>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-2 space-y-2">
          {node.children.map(child => (
            <OkrTreeNode
              key={child.objective.id}
              node={child}
              depth={depth + 1}
              defaultExpanded={defaultExpanded}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default OkrTreeNode;
