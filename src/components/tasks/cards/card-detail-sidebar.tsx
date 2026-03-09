'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Archive,
  Trash2,
  CalendarIcon,
  User,
  Tag,
  Clock,
  Columns3,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PriorityBadge } from '@/components/tasks/shared/priority-badge';
import { LabelBadge } from '@/components/tasks/shared/label-badge';
import { MemberAvatar } from '@/components/tasks/shared/member-avatar';
import type { Card, CardPriority } from '@/types/tasks';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/tasks';
import type { Column, BoardMember, Label } from '@/types/tasks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CardDetailSidebarProps {
  card: Card;
  columns: Column[];
  members: BoardMember[];
  allLabels: Label[];
  isOverdue: boolean;
  isDueSoon: boolean;
  assigneeOpen: boolean;
  onAssigneeOpenChange: (open: boolean) => void;
  labelsOpen: boolean;
  onLabelsOpenChange: (open: boolean) => void;
  dueDateOpen: boolean;
  onDueDateOpenChange: (open: boolean) => void;
  onColumnChange: (columnId: string) => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onAssigneeChange: (assigneeId: string | null) => void;
  onDueDateChange: (date: Date | undefined) => void;
  onEstimatedHoursBlur: (value: string) => void;
  onToggleLabel: (labelId: string) => void;
  onCopyLink: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function CardDetailSidebar({
  card,
  columns,
  members,
  allLabels,
  isOverdue,
  isDueSoon,
  assigneeOpen,
  onAssigneeOpenChange,
  labelsOpen,
  onLabelsOpenChange,
  dueDateOpen,
  onDueDateOpenChange,
  onColumnChange,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onDueDateChange,
  onEstimatedHoursBlur,
  onToggleLabel,
  onCopyLink,
  onArchive,
  onDelete,
}: CardDetailSidebarProps) {
  return (
    <div className="w-56 shrink-0 border-l border-border bg-muted/20 dark:bg-white/[0.02] overflow-y-auto hidden sm:block">
      <div className="p-3 space-y-3">
        {/* Section: Status & Priority */}
        <div className="rounded-lg bg-background/50 dark:bg-white/[0.03] border border-border/40 p-3 space-y-2.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Status
          </p>

          {/* Coluna */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium">
              Coluna
            </p>
            <Select
              value={card.columnId}
              onValueChange={onColumnChange}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <Columns3 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columns.map(col => (
                  <SelectItem key={col.id} value={col.id}>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: col.color ?? '#6b7280',
                        }}
                      />
                      {col.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium">
              Status
            </p>
            <Select
              value={card.status}
              onValueChange={onStatusChange}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue>
                  <span
                    className={cn(
                      'flex items-center gap-1.5',
                      STATUS_CONFIG[card.status].color
                    )}
                  >
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full shrink-0',
                        card.status === 'DONE' && 'bg-green-500',
                        card.status === 'IN_PROGRESS' &&
                          'bg-blue-500',
                        card.status === 'CANCELED' && 'bg-red-500',
                        card.status === 'OPEN' && 'bg-gray-400'
                      )}
                    />
                    {STATUS_CONFIG[card.status].label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(STATUS_CONFIG) as Array<
                    keyof typeof STATUS_CONFIG
                  >
                ).map(s => (
                  <SelectItem key={s} value={s}>
                    <span
                      className={cn(
                        'flex items-center gap-1.5',
                        STATUS_CONFIG[s].color
                      )}
                    >
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

          {/* Prioridade */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium">
              Prioridade
            </p>
            <Select
              value={card.priority}
              onValueChange={onPriorityChange}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue>
                  <span className="flex items-center gap-1.5">
                    <PriorityBadge priority={card.priority} />
                    {PRIORITY_CONFIG[card.priority].label}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(PRIORITY_CONFIG) as CardPriority[]).map(
                  p => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-1.5">
                        <PriorityBadge priority={p} />
                        {PRIORITY_CONFIG[p].label}
                      </span>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Section: People & Dates */}
        <div className="rounded-lg bg-background/50 dark:bg-white/[0.03] border border-border/40 p-3 space-y-2.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Atribuição
          </p>

          {/* Responsável */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium">
              Responsável
            </p>
            <Popover
              open={assigneeOpen}
              onOpenChange={onAssigneeOpenChange}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs w-full justify-start gap-1.5"
                >
                  {card.assigneeName ? (
                    <>
                      <MemberAvatar
                        name={card.assigneeName}
                        size="sm"
                        className="h-4 w-4 text-[8px]"
                      />
                      <span className="truncate">
                        {card.assigneeName}
                      </span>
                    </>
                  ) : (
                    <>
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        Nenhum
                      </span>
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-1">
                  <button
                    className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                    onClick={() => onAssigneeChange(null)}
                  >
                    <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px]">
                      --
                    </span>
                    <span className="text-muted-foreground">
                      Nenhum
                    </span>
                  </button>
                  {members.map(m => (
                    <button
                      key={m.userId}
                      className={cn(
                        'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors',
                        card.assigneeId === m.userId && 'bg-muted'
                      )}
                      onClick={() => onAssigneeChange(m.userId)}
                    >
                      <MemberAvatar name={m.userName} size="sm" />
                      <span className="truncate">
                        {m.userName ?? m.userEmail}
                      </span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Prazo */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium">
              Prazo
            </p>
            <Popover open={dueDateOpen} onOpenChange={onDueDateOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-8 text-xs w-full justify-start gap-1.5',
                    isOverdue &&
                      'text-red-500 border-red-300 dark:border-red-500/40 bg-red-50/50 dark:bg-red-500/5',
                    isDueSoon &&
                      'text-amber-600 border-amber-300 dark:border-amber-500/40 bg-amber-50/50 dark:bg-amber-500/5'
                  )}
                >
                  <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                  {card.dueDate
                    ? format(new Date(card.dueDate), "dd 'de' MMM", {
                        locale: ptBR,
                      })
                    : 'Definir'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    card.dueDate ? new Date(card.dueDate) : undefined
                  }
                  onSelect={onDueDateChange}
                  locale={ptBR}
                />
                {card.dueDate && (
                  <div className="px-3 pb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-destructive"
                      onClick={() => onDueDateChange(undefined)}
                    >
                      Remover prazo
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Estimativa */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground font-medium">
              Estimativa
            </p>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Input
                type="number"
                min={0}
                step={0.5}
                placeholder="Horas"
                defaultValue={card.estimatedHours ?? ''}
                onBlur={e => onEstimatedHoursBlur(e.target.value)}
                className="h-8 text-xs flex-1"
              />
            </div>
          </div>
        </div>

        {/* Section: Labels */}
        <div className="rounded-lg bg-background/50 dark:bg-white/[0.03] border border-border/40 p-3 space-y-2.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Etiquetas
          </p>
          <Popover open={labelsOpen} onOpenChange={onLabelsOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs w-full justify-start gap-1.5"
              >
                <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {card.labels && card.labels.length > 0
                  ? `${card.labels.length} selecionada${card.labels.length > 1 ? 's' : ''}`
                  : 'Nenhuma'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-2" align="start">
              <div className="space-y-1">
                {allLabels.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-1">
                    Nenhuma etiqueta neste quadro
                  </p>
                ) : (
                  allLabels.map(label => {
                    const isSelected =
                      card.labels?.some(l => l.id === label.id) ??
                      false;
                    return (
                      <button
                        key={label.id}
                        className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                        onClick={() => onToggleLabel(label.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          className="pointer-events-none"
                        />
                        <LabelBadge
                          name={label.name}
                          color={label.color}
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Show selected labels */}
          {card.labels && card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {card.labels.map(label => (
                <LabelBadge
                  key={label.id}
                  name={label.name}
                  color={label.color}
                  className="text-[9px]"
                />
              ))}
            </div>
          )}
        </div>

        {/* Section: Actions */}
        <div className="rounded-lg bg-background/50 dark:bg-white/[0.03] border border-border/40 p-3 space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Ações
          </p>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs w-full justify-start gap-1.5"
            onClick={onCopyLink}
          >
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            Copiar link
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs w-full justify-start gap-1.5"
            onClick={onArchive}
          >
            <Archive className="h-3.5 w-3.5 text-muted-foreground" />
            {card.archivedAt ? 'Desarquivar' : 'Arquivar'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs w-full justify-start gap-1.5 text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir cartão?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação é irreversível. Subtarefas, comentários e
                  anexos também serão removidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Meta info */}
        <div className="px-1 pt-1 space-y-1">
          <p className="text-[10px] text-muted-foreground">
            Criado por{' '}
            <span className="font-medium text-foreground/70">
              {card.creatorName ?? 'Desconhecido'}
            </span>
          </p>
          {card.createdAt && (
            <p className="text-[10px] text-muted-foreground">
              em{' '}
              {format(
                new Date(card.createdAt),
                "dd 'de' MMM 'de' yyyy 'às' HH:mm",
                { locale: ptBR }
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
