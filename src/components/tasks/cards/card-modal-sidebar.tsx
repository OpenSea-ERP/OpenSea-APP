'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Clock, User, Tag, Columns3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MemberAvatar } from '@/components/tasks/shared/member-avatar';
import { LabelBadge } from '@/components/tasks/shared/label-badge';
import { IntegrationLinker } from './integration-linker';
import type {
  Column,
  BoardMember,
  Label,
  CardPriority,
  CardStatus,
  CardIntegration,
  IntegrationType,
} from '@/types/tasks';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/tasks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CardModalSidebarProps {
  // Column
  columns: Column[];
  columnId: string;
  onColumnChange: (columnId: string) => void;
  // Status
  status: CardStatus;
  onStatusChange: (status: CardStatus) => void;
  showStatus?: boolean; // only in edit mode
  // Priority
  priority: CardPriority;
  onPriorityChange: (priority: CardPriority) => void;
  // Labels
  allLabels: Label[];
  selectedLabelIds: string[];
  onToggleLabel: (labelId: string) => void;
  // Parent card
  parentCards?: { id: string; title: string }[];
  parentCardId: string | null;
  onParentCardChange?: (cardId: string | null) => void;
  // Assignee
  members: BoardMember[];
  assigneeId: string | null;
  onAssigneeChange: (userId: string | null) => void;
  // Dates
  startDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  dueDate: Date | undefined;
  onDueDateChange: (date: Date | undefined) => void;
  // Estimated hours
  estimatedHours: string;
  onEstimatedHoursChange: (value: string) => void;
  // Integrations
  integrations: CardIntegration[];
  onAddIntegration: (type: IntegrationType, entityId: string, entityLabel: string) => void;
  onRemoveIntegration: (integrationId: string) => void;
}

const PRIORITY_OPTIONS: CardPriority[] = ['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const PRIORITY_DOT_COLORS: Record<CardPriority, string> = {
  NONE: 'bg-gray-400',
  LOW: 'bg-blue-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
};

const PARENT_NONE_VALUE = '__NONE__';
const ASSIGNEE_NONE_VALUE = '__NONE__';

export function CardModalSidebar({
  columns,
  columnId,
  onColumnChange,
  status,
  onStatusChange,
  showStatus = false,
  priority,
  onPriorityChange,
  allLabels,
  selectedLabelIds,
  onToggleLabel,
  parentCards = [],
  parentCardId,
  onParentCardChange,
  members,
  assigneeId,
  onAssigneeChange,
  startDate,
  onStartDateChange,
  dueDate,
  onDueDateChange,
  estimatedHours,
  onEstimatedHoursChange,
  integrations,
  onAddIntegration,
  onRemoveIntegration,
}: CardModalSidebarProps) {
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  const selectedLabels = allLabels.filter(l => selectedLabelIds.includes(l.id));

  return (
    <div className="w-full md:w-[210px] shrink-0 border-t md:border-t-0 md:border-l border-border/50 bg-slate-50 dark:bg-white/5 overflow-y-auto">
      <div className="p-3 space-y-3">
        {/* ── Coluna ── */}
        <div className="space-y-1">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
            Coluna
          </p>
          <Select value={columnId} onValueChange={onColumnChange}>
            <SelectTrigger className="h-7 text-xs w-full">
              <Columns3 className="h-3 w-3 mr-1 text-muted-foreground shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...columns]
                .sort((a, b) => a.position - b.position)
                .map(col => (
                  <SelectItem key={col.id} value={col.id}>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: col.color ?? '#6b7280' }}
                      />
                      {col.title}
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Status (edit mode only) ── */}
        {showStatus && (
          <div className="space-y-1">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              Status
            </p>
            <Select
              value={status}
              onValueChange={v => onStatusChange(v as CardStatus)}
            >
              <SelectTrigger className="h-7 text-xs w-full">
                <SelectValue>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full shrink-0',
                        status === 'DONE' && 'bg-green-500',
                        status === 'IN_PROGRESS' && 'bg-blue-500',
                        status === 'CANCELED' && 'bg-red-500',
                        status === 'OPEN' && 'bg-gray-400'
                      )}
                    />
                    {STATUS_CONFIG[status].label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_CONFIG) as CardStatus[]).map(s => (
                  <SelectItem key={s} value={s}>
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full shrink-0',
                          s === 'DONE' && 'bg-green-500',
                          s === 'IN_PROGRESS' && 'bg-blue-500',
                          s === 'CANCELED' && 'bg-red-500',
                          s === 'OPEN' && 'bg-gray-400'
                        )}
                      />
                      {STATUS_CONFIG[s].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ── Prioridade ── */}
        <div className="space-y-1">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
            Prioridade
          </p>
          <div className="flex items-center gap-1">
            {PRIORITY_OPTIONS.map(p => (
              <button
                key={p}
                type="button"
                title={PRIORITY_CONFIG[p].label}
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center transition-all',
                  priority === p
                    ? 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                    : 'hover:ring-1 hover:ring-muted-foreground/30'
                )}
                onClick={() => onPriorityChange(p)}
              >
                <span
                  className={cn(
                    'h-3 w-3 rounded-full',
                    PRIORITY_DOT_COLORS[p]
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* ── Labels ── */}
        <div className="space-y-1">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
            Etiquetas
          </p>
          {selectedLabels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {selectedLabels.map(label => (
                <LabelBadge
                  key={label.id}
                  name={label.name}
                  color={label.color}
                  className="text-[8px]"
                />
              ))}
            </div>
          )}
          <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full justify-start gap-1.5"
                type="button"
              >
                <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                {selectedLabels.length > 0
                  ? `${selectedLabels.length} selecionada${selectedLabels.length > 1 ? 's' : ''}`
                  : 'Nenhuma'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                {allLabels.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1">
                    Nenhuma etiqueta neste quadro
                  </p>
                ) : (
                  allLabels.map(label => {
                    const isSelected = selectedLabelIds.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        type="button"
                        className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                        onClick={() => onToggleLabel(label.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          className="pointer-events-none"
                        />
                        <LabelBadge name={label.name} color={label.color} />
                      </button>
                    );
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* ── Card Pai ── */}
        {parentCards.length > 0 && onParentCardChange && (
          <div className="space-y-1">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              Card Pai
            </p>
            <Select
              value={parentCardId ?? PARENT_NONE_VALUE}
              onValueChange={v =>
                onParentCardChange(v === PARENT_NONE_VALUE ? null : v)
              }
            >
              <SelectTrigger className="h-7 text-xs w-full">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PARENT_NONE_VALUE}>
                  <span className="text-muted-foreground">Nenhum</span>
                </SelectItem>
                {parentCards.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="truncate">{c.title}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ── Responsável ── */}
        <div className="space-y-1">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
            Responsável
          </p>
          <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full justify-start gap-1.5"
                type="button"
              >
                {assigneeId ? (
                  (() => {
                    const member = members.find(m => m.userId === assigneeId);
                    return member ? (
                      <>
                        <MemberAvatar
                          name={member.userName}
                          avatarUrl={member.userAvatarUrl}
                          size="sm"
                          className="h-4 w-4 text-[7px]"
                        />
                        <span className="truncate">
                          {member.userName ?? member.userEmail}
                        </span>
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Nenhum</span>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <User className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Nenhum</span>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-2" align="start">
              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                <button
                  type="button"
                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    onAssigneeChange(null);
                    setAssigneeOpen(false);
                  }}
                >
                  <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px]">
                    --
                  </span>
                  <span className="text-muted-foreground">Nenhum</span>
                </button>
                {members.map(m => (
                  <button
                    key={m.userId}
                    type="button"
                    className={cn(
                      'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors',
                      assigneeId === m.userId && 'bg-muted'
                    )}
                    onClick={() => {
                      onAssigneeChange(m.userId);
                      setAssigneeOpen(false);
                    }}
                  >
                    <MemberAvatar
                      name={m.userName}
                      avatarUrl={m.userAvatarUrl}
                      size="sm"
                    />
                    <span className="truncate">
                      {m.userName ?? m.userEmail}
                    </span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* ── Início ── */}
        <div className="space-y-1">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
            Início
          </p>
          <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full justify-start gap-1.5"
                type="button"
              >
                <CalendarIcon className="h-3 w-3 shrink-0" />
                {startDate
                  ? format(startDate, "dd 'de' MMM", { locale: ptBR })
                  : 'Definir'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={d => {
                  onStartDateChange(d);
                  setStartDateOpen(false);
                }}
                locale={ptBR}
              />
              {startDate && (
                <div className="px-3 pb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="w-full text-xs text-rose-500"
                    onClick={() => {
                      onStartDateChange(undefined);
                      setStartDateOpen(false);
                    }}
                  >
                    Remover data
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* ── Prazo ── */}
        <div className="space-y-1">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
            Prazo
          </p>
          <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full justify-start gap-1.5"
                type="button"
              >
                <CalendarIcon className="h-3 w-3 shrink-0" />
                {dueDate
                  ? format(dueDate, "dd 'de' MMM", { locale: ptBR })
                  : 'Definir'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={d => {
                  onDueDateChange(d);
                  setDueDateOpen(false);
                }}
                locale={ptBR}
              />
              {dueDate && (
                <div className="px-3 pb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="w-full text-xs text-rose-500"
                    onClick={() => {
                      onDueDateChange(undefined);
                      setDueDateOpen(false);
                    }}
                  >
                    Remover prazo
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* ── Tempo de Execução ── */}
        <div className="space-y-1">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
            Tempo de Execução
          </p>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
            <Input
              type="number"
              min={0}
              step={0.5}
              placeholder="Horas"
              value={estimatedHours}
              onChange={e => onEstimatedHoursChange(e.target.value)}
              className="h-7 text-xs flex-1"
            />
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-border" />

        {/* ── Integrações ── */}
        <div className="space-y-1">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
            Integrações
          </p>
          <IntegrationLinker
            integrations={integrations}
            onAdd={onAddIntegration}
            onRemove={onRemoveIntegration}
          />
        </div>
      </div>
    </div>
  );
}
