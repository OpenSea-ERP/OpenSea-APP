'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
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
import { PRIORITY_HEX } from '@/components/tasks/_utils';
import { CardDetailHeader } from './card-detail-header';
import { CardDetailSidebar } from './card-detail-sidebar';
import { CardDetailTabs } from './card-detail-tabs';
import type { CardTab } from './card-detail-tabs';
import type { CardPriority } from '@/types/tasks';

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
  const { data: cardData, isLoading: isLoadingCard, isError: isCardError } = useCard(boardId, cardId);
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

  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);

  // ── Title editing handlers ──

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

  // ── Sidebar handlers ──

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

  // ── Derived values ──

  const currentColumn = columns.find(c => c.id === card?.columnId);

  const headerColor =
    card?.labels?.[0]?.color ??
    PRIORITY_HEX[card?.priority ?? 'NONE'];

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
        {isCardError ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3">
            <DialogHeader className="sr-only">
              <DialogTitle>Erro ao carregar cartão</DialogTitle>
              <DialogDescription>
                Não foi possível carregar os detalhes do cartão
              </DialogDescription>
            </DialogHeader>
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Erro ao carregar o cartão. Tente novamente.
            </p>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : isLoadingCard || !card ? (
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
            {/* Colored header bar */}
            <div
              className="h-2 w-full shrink-0 rounded-t-lg"
              style={{
                background: `linear-gradient(135deg, ${headerColor}, ${headerColor}99)`,
              }}
            />

            <CardDetailHeader
              card={card}
              currentColumn={currentColumn}
              isOverdue={isOverdue}
              isDueSoon={isDueSoon}
              isEditingTitle={isEditingTitle}
              editTitle={editTitle}
              onEditTitleChange={setEditTitle}
              onStartEditTitle={handleStartEditTitle}
              onSaveTitle={handleSaveTitle}
              onTitleKeyDown={handleTitleKeyDown}
              onClose={() => onOpenChange(false)}
            />

            {/* 3-column layout */}
            <div
              className="flex overflow-hidden flex-1 min-h-0 border-t border-border mt-3"
              style={{ height: 'calc(90vh - 120px)' }}
            >
              <CardDetailTabs
                card={card}
                boardId={boardId}
                cardId={cardId}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              <CardDetailSidebar
                card={card}
                columns={columns}
                members={members}
                allLabels={allLabels}
                isOverdue={isOverdue}
                isDueSoon={isDueSoon}
                assigneeOpen={assigneeOpen}
                onAssigneeOpenChange={setAssigneeOpen}
                labelsOpen={labelsOpen}
                onLabelsOpenChange={setLabelsOpen}
                dueDateOpen={dueDateOpen}
                onDueDateOpenChange={setDueDateOpen}
                onColumnChange={handleColumnChange}
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
                onAssigneeChange={handleAssigneeChange}
                onDueDateChange={handleDueDateChange}
                onEstimatedHoursBlur={handleEstimatedHoursBlur}
                onToggleLabel={handleToggleLabel}
                onCopyLink={handleCopyLink}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
