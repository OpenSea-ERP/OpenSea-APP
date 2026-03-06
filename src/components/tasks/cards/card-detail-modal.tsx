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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { PRIORITY_CONFIG } from '@/types/tasks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type CardTab = 'geral' | 'subtarefas' | 'checklists' | 'atividade';

const TABS: { key: CardTab; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'geral', label: 'Geral', icon: FileText, color: 'text-blue-500' },
  { key: 'subtarefas', label: 'Subtarefas', icon: ListChecks, color: 'text-emerald-500' },
  { key: 'checklists', label: 'Checklists', icon: CheckSquare, color: 'text-violet-500' },
  { key: 'atividade', label: 'Atividade', icon: Activity, color: 'text-orange-500' },
];

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
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  // Auto-show custom fields if card already has values
  useEffect(() => {
    if (card?.customFieldValues && card.customFieldValues.length > 0) {
      setShowCustomFields(true);
    }
  }, [card?.customFieldValues]);

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
      },
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
    [handleSaveTitle],
  );

  const handleColumnChange = useCallback(
    (columnId: string) => {
      if (!card || card.columnId === columnId) return;
      moveCard.mutate(
        { cardId, data: { columnId, position: 0 } },
        {
          onSuccess: () => toast.success('Cartão movido'),
          onError: () => toast.error('Erro ao mover cartão'),
        },
      );
    },
    [card, cardId, moveCard],
  );

  const handlePriorityChange = useCallback(
    (priority: string) => {
      updateCard.mutate(
        { cardId, data: { priority: priority as CardPriority } },
        {
          onSuccess: () => toast.success('Prioridade atualizada'),
          onError: () => toast.error('Erro ao atualizar prioridade'),
        },
      );
    },
    [cardId, updateCard],
  );

  const handleAssigneeChange = useCallback(
    (assigneeId: string | null) => {
      assignCard.mutate(
        { cardId, assigneeId },
        {
          onSuccess: () => {
            toast.success(assigneeId ? 'Responsável atribuído' : 'Responsável removido');
            setAssigneeOpen(false);
          },
          onError: () => toast.error('Erro ao atribuir responsável'),
        },
      );
    },
    [cardId, assignCard],
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
        },
      );
    },
    [cardId, updateCard],
  );

  const handleToggleLabel = useCallback(
    (labelId: string) => {
      if (!card) return;
      const currentLabelIds = card.labels?.map((l) => l.id) ?? [];
      const newLabelIds = currentLabelIds.includes(labelId)
        ? currentLabelIds.filter((id) => id !== labelId)
        : [...currentLabelIds, labelId];
      manageLabels.mutate(
        { cardId, labelIds: newLabelIds },
        { onError: () => toast.error('Erro ao atualizar etiquetas') },
      );
    },
    [card, cardId, manageLabels],
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
        },
      );
    },
    [card, cardId, updateCard],
  );

  const handleArchive = useCallback(() => {
    if (!card) return;
    const isArchived = !!card.archivedAt;
    archiveCard.mutate(
      { cardId, archive: !isArchived },
      {
        onSuccess: () => {
          toast.success(isArchived ? 'Cartão desarquivado' : 'Cartão arquivado');
          if (!isArchived) onOpenChange(false);
        },
        onError: () => toast.error('Erro ao arquivar cartão'),
      },
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
      () => toast.error('Erro ao copiar link'),
    );
  }, [cardId]);

  const currentColumn = columns.find((c) => c.id === card?.columnId);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0"
        showCloseButton={false}
      >
        {isLoadingCard || !card ? (
          <div className="flex items-center justify-center p-16">
            <DialogHeader className="sr-only">
              <DialogTitle>Carregando cartão...</DialogTitle>
              <DialogDescription>Carregando detalhes do cartão</DialogDescription>
            </DialogHeader>
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Color bar */}
            {card.labels && card.labels.length > 0 && (
              <div
                className="h-1.5 w-full shrink-0"
                style={{ backgroundColor: card.labels[0].color }}
              />
            )}

            {/* Header */}
            <DialogHeader className="px-6 pt-5 pb-0 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {isEditingTitle ? (
                    <Input
                      ref={titleInputRef}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={handleTitleKeyDown}
                      className="text-xl font-bold border-none shadow-none px-0 focus-visible:ring-0 h-auto py-0"
                    />
                  ) : (
                    <DialogTitle
                      className="text-xl font-bold cursor-pointer hover:text-primary/80 transition-colors"
                      onClick={handleStartEditTitle}
                    >
                      {card.title}
                    </DialogTitle>
                  )}
                  <DialogDescription className="sr-only">
                    Detalhes do cartão {card.title}
                  </DialogDescription>
                  {/* Column badge */}
                  {currentColumn && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: currentColumn.color ?? '#6b7280' }}
                      />
                      <p className="text-xs text-muted-foreground">
                        em <span className="font-medium text-foreground/70">{currentColumn.title}</span>
                      </p>
                    </div>
                  )}
                </div>
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

              {/* Labels row */}
              {card.labels && card.labels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {card.labels.map((label) => (
                    <LabelBadge key={label.id} name={label.name} color={label.color} />
                  ))}
                </div>
              )}

              {/* Tab bar */}
              <div className="flex items-center gap-1 mt-4 -mb-px">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      className={cn(
                        'relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors',
                        isActive
                          ? 'text-foreground bg-muted/50 dark:bg-white/[0.04]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
                      )}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      <Icon className={cn('h-3.5 w-3.5', isActive ? tab.color : '')} />
                      {tab.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </DialogHeader>

            {/* 2-column layout */}
            <div className="flex overflow-hidden flex-1 min-h-0 border-t border-border">
              {/* LEFT: Tab content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {activeTab === 'geral' && (
                  <>
                    {/* Description + Attachments */}
                    <CardDetailsTab card={card} boardId={boardId} />

                    {/* Custom Fields Toggle */}
                    <div className="rounded-lg border border-border/60 bg-muted/20 dark:bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings2 className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium">Campos personalizados</span>
                        </div>
                        <Switch
                          checked={showCustomFields}
                          onCheckedChange={setShowCustomFields}
                        />
                      </div>
                      {showCustomFields && (
                        <div className="mt-3 pt-3 border-t border-border/40">
                          <CardCustomFieldsTab boardId={boardId} cardId={cardId} />
                        </div>
                      )}
                    </div>

                    {/* Comments */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-400" />
                        <h4 className="text-sm font-semibold">Comentários</h4>
                      </div>
                      <CardCommentsTab boardId={boardId} cardId={cardId} />
                    </div>
                  </>
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

                {activeTab === 'atividade' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-orange-500" />
                      <h4 className="text-sm font-semibold">Histórico de atividades</h4>
                    </div>
                    <CardActivityTab boardId={boardId} cardId={cardId} />
                  </div>
                )}
              </div>

              {/* RIGHT: Sidebar */}
              <div className="w-52 shrink-0 border-l border-border bg-muted/20 dark:bg-white/[0.02] p-4 space-y-2 overflow-y-auto hidden sm:block">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Propriedades
                </p>

                {/* Coluna */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Coluna</p>
                  <Select
                    value={card.columnId}
                    onValueChange={handleColumnChange}
                  >
                    <SelectTrigger className="h-8 text-xs w-full">
                      <Columns3 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((col) => (
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

                {/* Prioridade */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Prioridade</p>
                  <Select
                    value={card.priority}
                    onValueChange={handlePriorityChange}
                  >
                    <SelectTrigger className="h-8 text-xs w-full">
                      <Flag className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                      <SelectValue>
                        <span className="flex items-center gap-1">
                          <PriorityBadge priority={card.priority} />
                          {PRIORITY_CONFIG[card.priority].label}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PRIORITY_CONFIG) as CardPriority[]).map((p) => (
                        <SelectItem key={p} value={p}>
                          <span className="flex items-center gap-1.5">
                            <PriorityBadge priority={p} />
                            {PRIORITY_CONFIG[p].label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Responsável */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Responsável</p>
                  <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs w-full justify-start gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{card.assigneeName ?? 'Nenhum'}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="start">
                      <div className="space-y-1">
                        <button
                          className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                          onClick={() => handleAssigneeChange(null)}
                        >
                          <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px]">--</span>
                          <span className="text-muted-foreground">Nenhum</span>
                        </button>
                        {members.map((m) => (
                          <button
                            key={m.userId}
                            className={cn(
                              'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors',
                              card.assigneeId === m.userId && 'bg-muted',
                            )}
                            onClick={() => handleAssigneeChange(m.userId)}
                          >
                            <MemberAvatar name={m.userName} size="sm" />
                            <span className="truncate">{m.userName ?? m.userEmail}</span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Prazo */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Prazo</p>
                  <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'h-8 text-xs w-full justify-start gap-1.5',
                          card.dueDate && new Date(card.dueDate) < new Date() && 'text-red-500 border-red-300 dark:border-red-500/40 bg-red-50/50 dark:bg-red-500/5',
                        )}
                      >
                        <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                        {card.dueDate
                          ? format(new Date(card.dueDate), "dd 'de' MMM", { locale: ptBR })
                          : 'Definir'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={card.dueDate ? new Date(card.dueDate) : undefined}
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

                {/* Etiquetas */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Etiquetas</p>
                  <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 text-xs w-full justify-start gap-1.5">
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
                          allLabels.map((label) => {
                            const isSelected = card.labels?.some((l) => l.id === label.id) ?? false;
                            return (
                              <button
                                key={label.id}
                                className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                                onClick={() => handleToggleLabel(label.id)}
                              >
                                <Checkbox checked={isSelected} className="pointer-events-none" />
                                <LabelBadge name={label.name} color={label.color} />
                              </button>
                            );
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Estimativa */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Estimativa</p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="Horas"
                      defaultValue={card.estimatedHours ?? ''}
                      onBlur={(e) => handleEstimatedHoursBlur(e.target.value)}
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                </div>

                <div className="border-t border-border/60 my-3" />

                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Ações
                </p>

                {/* Action buttons */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs w-full justify-start gap-1.5"
                  onClick={handleCopyLink}
                >
                  <Link className="h-3.5 w-3.5 text-muted-foreground" />
                  Copiar link
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs w-full justify-start gap-1.5"
                  onClick={handleArchive}
                >
                  <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                  {card.archivedAt ? 'Desarquivar' : 'Arquivar'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs w-full justify-start gap-1.5 text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Excluir
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
