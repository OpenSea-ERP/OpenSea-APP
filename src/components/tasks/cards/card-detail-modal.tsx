'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Link,
  Archive,
  Trash2,
  CalendarIcon,
  User,
  Tag,
  Clock,
  Columns3,
  Flag,
  X,
  FileText,
  ListChecks,
  CheckSquare,
  Settings2,
  MessageSquare,
  Activity,
  AlertCircle,
  MoreHorizontal,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCard,
  useUpdateCard,
  useMoveCard,
  useAssignCard,
  useArchiveCard,
  useDeleteCard,
  useManageCardLabels,
} from '@/hooks/tasks/use-cards';
import { useBoard } from '@/hooks/tasks/use-boards';
import { useLabels } from '@/hooks/tasks/use-labels';
import { PriorityBadge } from '@/components/tasks/shared/priority-badge';
import { LabelBadge } from '@/components/tasks/shared/label-badge';
import { MemberAvatar } from '@/components/tasks/shared/member-avatar';
import { CardDetailsTab } from '@/components/tasks/tabs/card-details-tab';
import { CardSubtasksTab } from '@/components/tasks/tabs/card-subtasks-tab';
import { CardChecklistTab } from '@/components/tasks/tabs/card-checklist-tab';
import { CardCommentsTab } from '@/components/tasks/tabs/card-comments-tab';
import { CardCustomFieldsTab } from '@/components/tasks/tabs/card-custom-fields-tab';
import { CardActivityTab } from '@/components/tasks/tabs/card-activity-tab';
import type { CardPriority } from '@/types/tasks';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/tasks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type CardTab = 'geral' | 'subtarefas' | 'checklists' | 'campos' | 'atividade';

const TABS: {
  key: CardTab;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: 'geral', label: 'Detalhes', icon: FileText, color: 'text-blue-500' },
  {
    key: 'subtarefas',
    label: 'Subtarefas',
    icon: ListChecks,
    color: 'text-emerald-500',
  },
  {
    key: 'checklists',
    label: 'Checklists',
    icon: CheckSquare,
    color: 'text-violet-500',
  },
  { key: 'campos', label: 'Campos', icon: Settings2, color: 'text-amber-500' },
  {
    key: 'atividade',
    label: 'Atividade',
    icon: Activity,
    color: 'text-orange-500',
  },
];

// Priority color fallback for header gradient
const PRIORITY_HEADER_COLORS: Record<CardPriority, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
  NONE: '#6b7280',
};

interface CardDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  cardId: string;
}

export function CardDetailModal({
  open,
  onOpenChange,
  boardId,
  cardId,
}: CardDetailModalProps) {
  const { data: cardData, isLoading: isLoadingCard } = useCard(boardId, cardId);
  const { data: boardData } = useBoard(boardId);
  const { data: labelsData } = useLabels(boardId);

  const card = cardData?.card;
  const board = boardData?.board;
  const allLabels = labelsData?.labels ?? [];
  const columns = board?.columns ?? [];
  const members = board?.members ?? [];

  const updateCard = useUpdateCard(boardId);
  const moveCard = useMoveCard(boardId);
  const assignCard = useAssignCard(boardId);
  const archiveCard = useArchiveCard(boardId);
  const deleteCard = useDeleteCard(boardId);
  const manageLabels = useManageCardLabels(boardId);

  const [activeTab, setActiveTab] = useState<CardTab>('geral');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleStartEditTitle = useCallback(() => {
    if (!card) return;
    setEditTitle(card.title);
    setIsEditingTitle(true);
  }, [card]);

  const handleSaveTitle = useCallback(() => {
    if (!card || !editTitle.trim() || editTitle.trim() === card.title) {
      setIsEditingTitle(false);
      return;
    }
    updateCard.mutate(
      { cardId, data: { title: editTitle.trim() } },
      {
        onSuccess: () => {
          toast.success('Título atualizado');
          setIsEditingTitle(false);
        },
        onError: () => toast.error('Erro ao atualizar título'),
      }
    );
  }, [card, cardId, editTitle, updateCard]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveTitle();
      }
      if (e.key === 'Escape') setIsEditingTitle(false);
    },
    [handleSaveTitle]
  );

  const handleColumnChange = useCallback(
    (columnId: string) => {
      if (!card || card.columnId === columnId) return;
      moveCard.mutate(
        { cardId, data: { columnId, position: 0 } },
        {
          onSuccess: () => toast.success('Cartão movido'),
          onError: () => toast.error('Erro ao mover cartão'),
        }
      );
    },
    [card, cardId, moveCard]
  );

  const handlePriorityChange = useCallback(
    (priority: string) => {
      updateCard.mutate(
        { cardId, data: { priority: priority as CardPriority } },
        {
          onSuccess: () => toast.success('Prioridade atualizada'),
          onError: () => toast.error('Erro ao atualizar prioridade'),
        }
      );
    },
    [cardId, updateCard]
  );

  const handleAssigneeChange = useCallback(
    (assigneeId: string | null) => {
      assignCard.mutate(
        { cardId, assigneeId },
        {
          onSuccess: () => {
            toast.success(
              assigneeId ? 'Responsável atribuído' : 'Responsável removido'
            );
            setAssigneeOpen(false);
          },
          onError: () => toast.error('Erro ao atribuir responsável'),
        }
      );
    },
    [cardId, assignCard]
  );

  const handleDueDateChange = useCallback(
    (date: Date | undefined) => {
      updateCard.mutate(
        { cardId, data: { dueDate: date ? date.toISOString() : null } },
        {
          onSuccess: () => {
            toast.success(date ? 'Prazo definido' : 'Prazo removido');
            setDueDateOpen(false);
          },
          onError: () => toast.error('Erro ao atualizar prazo'),
        }
      );
    },
    [cardId, updateCard]
  );

  const handleToggleLabel = useCallback(
    (labelId: string) => {
      if (!card) return;
      const currentLabelIds = card.labels?.map(l => l.id) ?? [];
      const newLabelIds = currentLabelIds.includes(labelId)
        ? currentLabelIds.filter(id => id !== labelId)
        : [...currentLabelIds, labelId];
      manageLabels.mutate(
        { cardId, labelIds: newLabelIds },
        { onError: () => toast.error('Erro ao atualizar etiquetas') }
      );
    },
    [card, cardId, manageLabels]
  );

  const handleEstimatedHoursBlur = useCallback(
    (value: string) => {
      const hours = value ? parseFloat(value) : null;
      if (hours === card?.estimatedHours) return;
      updateCard.mutate(
        { cardId, data: { estimatedHours: hours } },
        {
          onSuccess: () => toast.success('Estimativa atualizada'),
          onError: () => toast.error('Erro ao atualizar estimativa'),
        }
      );
    },
    [card, cardId, updateCard]
  );

  const handleStatusChange = useCallback(
    (status: string) => {
      updateCard.mutate(
        {
          cardId,
          data: {
            status: status as 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELED',
          },
        },
        {
          onSuccess: () => toast.success('Status atualizado'),
          onError: () => toast.error('Erro ao atualizar status'),
        }
      );
    },
    [cardId, updateCard]
  );

  const handleArchive = useCallback(() => {
    if (!card) return;
    const isArchived = !!card.archivedAt;
    archiveCard.mutate(
      { cardId, archive: !isArchived },
      {
        onSuccess: () => {
          toast.success(
            isArchived ? 'Cartão desarquivado' : 'Cartão arquivado'
          );
          if (!isArchived) onOpenChange(false);
        },
        onError: () => toast.error('Erro ao arquivar cartão'),
      }
    );
  }, [card, cardId, archiveCard, onOpenChange]);

  const handleDelete = useCallback(() => {
    deleteCard.mutate(cardId, {
      onSuccess: () => {
        toast.success('Cartão excluído');
        onOpenChange(false);
      },
      onError: () => toast.error('Erro ao excluir cartão'),
    });
  }, [cardId, deleteCard, onOpenChange]);

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}?card=${cardId}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success('Link copiado'),
      () => toast.error('Erro ao copiar link')
    );
  }, [cardId]);

  const currentColumn = columns.find(c => c.id === card?.columnId);

  // Derive header color from first label or priority
  const headerColor =
    card?.labels?.[0]?.color ??
    PRIORITY_HEADER_COLORS[card?.priority ?? 'NONE'];

  // Due date helpers
  const isOverdue = card?.dueDate
    ? new Date(card.dueDate) < new Date() && card.status !== 'DONE'
    : false;
  const isDueSoon =
    card?.dueDate && !isOverdue
      ? new Date(card.dueDate).getTime() - Date.now() <
          2 * 24 * 60 * 60 * 1000 && card.status !== 'DONE'
      : false;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-6xl max-h-[90vh] overflow-hidden p-0 gap-0"
        showCloseButton={false}
      >
        {isLoadingCard || !card ? (
          <div className="flex items-center justify-center p-20">
            <DialogHeader className="sr-only">
              <DialogTitle>Carregando cartão...</DialogTitle>
              <DialogDescription>
                Carregando detalhes do cartão
              </DialogDescription>
            </DialogHeader>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* ═══════ Colored header bar ═══════ */}
            <div
              className="h-2 w-full shrink-0 rounded-t-lg"
              style={{
                background: `linear-gradient(135deg, ${headerColor}, ${headerColor}99)`,
              }}
            />

            {/* ═══════ Header section ═══════ */}
            <DialogHeader className="px-5 pt-4 pb-0 shrink-0">
              <div className="flex items-start gap-3">
                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  {isEditingTitle ? (
                    <Input
                      ref={titleInputRef}
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={handleTitleKeyDown}
                      className="text-lg font-bold border-none shadow-none px-0 focus-visible:ring-0 h-auto py-0"
                    />
                  ) : (
                    <DialogTitle
                      className="text-lg font-bold cursor-pointer hover:text-primary/80 transition-colors leading-tight"
                      onClick={handleStartEditTitle}
                    >
                      {card.title}
                    </DialogTitle>
                  )}
                  <DialogDescription className="sr-only">
                    Detalhes do cartão {card.title}
                  </DialogDescription>

                  {/* Inline badges row */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {/* Column badge */}
                    {currentColumn && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 gap-1 font-normal"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: currentColumn.color ?? '#6b7280',
                          }}
                        />
                        {currentColumn.title}
                      </Badge>
                    )}

                    {/* Status badge */}
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] h-5 font-medium',
                        card.status === 'DONE' &&
                          'bg-green-500/15 text-green-600 dark:text-green-400',
                        card.status === 'IN_PROGRESS' &&
                          'bg-blue-500/15 text-blue-600 dark:text-blue-400',
                        card.status === 'CANCELED' &&
                          'bg-red-500/15 text-red-600 dark:text-red-400',
                        card.status === 'OPEN' &&
                          'bg-gray-500/15 text-gray-600 dark:text-gray-400'
                      )}
                    >
                      {STATUS_CONFIG[card.status].label}
                    </Badge>

                    {/* Priority badge */}
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] h-5 gap-1 font-medium',
                        card.priority === 'URGENT' &&
                          'bg-red-500/15 text-red-600 dark:text-red-400',
                        card.priority === 'HIGH' &&
                          'bg-orange-500/15 text-orange-600 dark:text-orange-400',
                        card.priority === 'MEDIUM' &&
                          'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
                        card.priority === 'LOW' &&
                          'bg-blue-500/15 text-blue-600 dark:text-blue-400',
                        card.priority === 'NONE' &&
                          'bg-gray-500/10 text-gray-500'
                      )}
                    >
                      <PriorityBadge priority={card.priority} />
                      {PRIORITY_CONFIG[card.priority].label}
                    </Badge>

                    {/* Due date badge */}
                    {card.dueDate && (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] h-5 gap-1 font-medium',
                          isOverdue &&
                            'bg-red-500/15 text-red-600 dark:text-red-400',
                          isDueSoon &&
                            'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                          !isOverdue && !isDueSoon && 'bg-gray-500/10'
                        )}
                      >
                        {isOverdue && <AlertCircle className="h-3 w-3" />}
                        <CalendarIcon className="h-3 w-3" />
                        {format(new Date(card.dueDate), "dd 'de' MMM", {
                          locale: ptBR,
                        })}
                      </Badge>
                    )}

                    {/* Assignee badge */}
                    {card.assigneeName && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 gap-1 font-normal"
                      >
                        <MemberAvatar
                          name={card.assigneeName}
                          size="sm"
                          className="h-3.5 w-3.5 text-[7px]"
                        />
                        {card.assigneeName}
                      </Badge>
                    )}

                    {/* Counters */}
                    {card._count && card._count.comments > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 gap-1 font-normal text-muted-foreground"
                      >
                        <MessageSquare className="h-3 w-3" />
                        {card._count.comments}
                      </Badge>
                    )}
                    {card._count && card._count.subtasks > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 gap-1 font-normal text-muted-foreground"
                      >
                        <ListChecks className="h-3 w-3" />
                        {card._count.completedSubtasks}/{card._count.subtasks}
                      </Badge>
                    )}

                    {/* Labels */}
                    {card.labels && card.labels.length > 0 && (
                      <>
                        {card.labels.map(label => (
                          <LabelBadge
                            key={label.id}
                            name={label.name}
                            color={label.color}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Fechar</span>
                </Button>
              </div>
            </DialogHeader>

            {/* ═══════ 3-column layout ═══════ */}
            <div
              className="flex overflow-hidden flex-1 min-h-0 border-t border-border mt-3"
              style={{ height: 'calc(90vh - 120px)' }}
            >
              {/* ─── Column 1: Comments (messaging) ─── */}
              <div className="w-[280px] shrink-0 border-r border-border flex flex-col bg-muted/10 dark:bg-white/[0.01] hidden md:flex">
                {/* Column header */}
                <div className="shrink-0 px-3 py-2.5 border-b border-border/50 flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-semibold">Comentários</span>
                  {card._count && card._count.comments > 0 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1.5 ml-auto"
                    >
                      {card._count.comments}
                    </Badge>
                  )}
                </div>

                {/* Messages area + input */}
                <CardCommentsTab
                  boardId={boardId}
                  cardId={cardId}
                  messagingLayout
                />
              </div>

              {/* ─── Column 2: Tab content (center) ─── */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Tab bar */}
                <div className="shrink-0 flex items-center gap-0.5 px-4 border-b border-border bg-muted/20 dark:bg-white/[0.02]">
                  {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        className={cn(
                          'relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
                          isActive
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                        onClick={() => setActiveTab(tab.key)}
                      >
                        <Icon
                          className={cn(
                            'h-3.5 w-3.5',
                            isActive ? tab.color : ''
                          )}
                        />
                        {tab.label}
                        {isActive && (
                          <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                  {activeTab === 'geral' && (
                    <CardDetailsTab card={card} boardId={boardId} />
                  )}

                  {activeTab === 'subtarefas' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-emerald-500" />
                        <h4 className="text-sm font-semibold">Subtarefas</h4>
                      </div>
                      <CardSubtasksTab boardId={boardId} cardId={cardId} />
                    </div>
                  )}

                  {activeTab === 'checklists' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-violet-500" />
                        <h4 className="text-sm font-semibold">Checklists</h4>
                      </div>
                      <CardChecklistTab
                        boardId={boardId}
                        cardId={cardId}
                        checklists={card.checklists ?? []}
                      />
                    </div>
                  )}

                  {activeTab === 'campos' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-amber-500" />
                        <h4 className="text-sm font-semibold">
                          Campos personalizados
                        </h4>
                      </div>
                      <CardCustomFieldsTab boardId={boardId} cardId={cardId} />
                    </div>
                  )}

                  {activeTab === 'atividade' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-orange-500" />
                        <h4 className="text-sm font-semibold">
                          Histórico de atividades
                        </h4>
                      </div>
                      <CardActivityTab boardId={boardId} cardId={cardId} />
                    </div>
                  )}

                  {/* Show comments inline on mobile (no left column) */}
                  <div className="md:hidden space-y-3 border-t border-border pt-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-blue-400" />
                      <h4 className="text-sm font-semibold">Comentários</h4>
                    </div>
                    <CardCommentsTab boardId={boardId} cardId={cardId} />
                  </div>
                </div>
              </div>

              {/* ─── Column 3: Properties sidebar ─── */}
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
                        onValueChange={handleColumnChange}
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
                        onValueChange={handleStatusChange}
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
                        onValueChange={handlePriorityChange}
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
                        onOpenChange={setAssigneeOpen}
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
                              onClick={() => handleAssigneeChange(null)}
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
                                onClick={() => handleAssigneeChange(m.userId)}
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
                      <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
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
                            onSelect={handleDueDateChange}
                            locale={ptBR}
                          />
                          {card.dueDate && (
                            <div className="px-3 pb-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-destructive"
                                onClick={() => handleDueDateChange(undefined)}
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
                          onBlur={e => handleEstimatedHoursBlur(e.target.value)}
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
                    <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
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
                                  onClick={() => handleToggleLabel(label.id)}
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
                      onClick={handleCopyLink}
                    >
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      Copiar link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs w-full justify-start gap-1.5"
                      onClick={handleArchive}
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
                          <AlertDialogAction onClick={handleDelete}>
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
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
