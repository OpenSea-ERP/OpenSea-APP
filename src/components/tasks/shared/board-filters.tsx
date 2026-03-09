'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { CardPriority, Label, BoardMember } from '@/types/tasks';
import { PRIORITY_CONFIG } from '@/types/tasks';
import { Filter, X } from 'lucide-react';
import { MemberAvatar } from './member-avatar';

export interface BoardFiltersState {
  priority?: CardPriority;
  assigneeId?: string;
  labelId?: string;
}

interface BoardFiltersProps {
  filters: BoardFiltersState;
  onFiltersChange: (filters: BoardFiltersState) => void;
  labels?: Label[];
  members?: BoardMember[];
}

const PRIORITIES: CardPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW', 'NONE'];

export function BoardFilters({
  filters,
  onFiltersChange,
  labels = [],
  members = [],
}: BoardFiltersProps) {
  const [filterOpen, setFilterOpen] = useState(false);

  const activeCount = [
    filters.priority,
    filters.assigneeId,
    filters.labelId,
  ].filter(Boolean).length;

  const selectedMember = members.find(m => m.userId === filters.assigneeId);
  const selectedLabel = labels.find(l => l.id === filters.labelId);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Filter button */}
      <Popover open={filterOpen} onOpenChange={setFilterOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            aria-label="Abrir filtros"
            aria-expanded={filterOpen}
            className={cn(
              'h-8 gap-1.5 text-xs',
              activeCount > 0 && 'border-blue-500 text-blue-600'
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros
            {activeCount > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-3 space-y-3">
          {/* Priority filter */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Prioridade
            </p>
            <div className="flex flex-wrap gap-1">
              {PRIORITIES.map(p => {
                const config = PRIORITY_CONFIG[p];
                const isActive = filters.priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors border',
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300'
                        : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted'
                    )}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        priority: isActive ? undefined : p,
                      })
                    }
                  >
                    <span
                      className={cn('h-2 w-2 rounded-full', config.dotColor)}
                    />
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Member filter */}
          {members.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                Responsável
              </p>
              <div className="flex flex-wrap gap-1">
                {members.map(m => {
                  const isActive = filters.assigneeId === m.userId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors border',
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-300'
                          : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted'
                      )}
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          assigneeId: isActive ? undefined : m.userId,
                        })
                      }
                    >
                      <MemberAvatar
                        name={m.userName}
                        size="sm"
                        className="h-4 w-4 text-[8px]"
                      />
                      {m.userName || m.userEmail || 'Sem nome'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Label filter */}
          {labels.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                Etiqueta
              </p>
              <div className="flex flex-wrap gap-1">
                {labels.map(l => {
                  const isActive = filters.labelId === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors border',
                        isActive
                          ? 'border-blue-300 dark:border-blue-500/40'
                          : 'bg-transparent border-transparent hover:bg-muted'
                      )}
                      style={{
                        color: isActive ? l.color : undefined,
                        backgroundColor: isActive ? `${l.color}15` : undefined,
                      }}
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          labelId: isActive ? undefined : l.id,
                        })
                      }
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: l.color }}
                      />
                      {l.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clear */}
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs text-muted-foreground"
              onClick={() => onFiltersChange({})}
            >
              Limpar filtros
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* Active filter chips */}
      {filters.priority && (
        <FilterChip
          label={`Prioridade: ${PRIORITY_CONFIG[filters.priority].label}`}
          onRemove={() => onFiltersChange({ ...filters, priority: undefined })}
        />
      )}
      {selectedMember && (
        <FilterChip
          label={`Responsável: ${selectedMember.userName || selectedMember.userEmail}`}
          onRemove={() =>
            onFiltersChange({ ...filters, assigneeId: undefined })
          }
        />
      )}
      {selectedLabel && (
        <FilterChip
          label={`Etiqueta: ${selectedLabel.name}`}
          color={selectedLabel.color}
          onRemove={() => onFiltersChange({ ...filters, labelId: undefined })}
        />
      )}
    </div>
  );
}

function FilterChip({
  label,
  color,
  onRemove,
}: {
  label: string;
  color?: string;
  onRemove: () => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 px-2.5 py-1 text-xs font-medium"
      style={color ? { backgroundColor: `${color}15`, color } : undefined}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
