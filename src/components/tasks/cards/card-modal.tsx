'use client';

import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  Copy,
  Archive,
  Trash2,
  Loader2,
  FileText,
  MessageSquare,
  ListChecks,
  Activity,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCard,
  useCreateCard,
  useUpdateCard,
  useMoveCard,
  useAssignCard,
  useArchiveCard,
  useDeleteCard,
  useManageCardLabels,
} from '@/hooks/tasks/use-cards';
import { useBoard } from '@/hooks/tasks/use-boards';
import { useLabels } from '@/hooks/tasks/use-labels';
import { useCustomFields, useSetCustomFieldValues } from '@/hooks/tasks/use-custom-fields';
import { useAttachments, useUploadAttachment, useDeleteAttachment } from '@/hooks/tasks/use-attachments';
import { useIntegrations, useCreateIntegration, useDeleteIntegration } from '@/hooks/tasks/use-integrations';
import { useCardMembers, useAddCardMember, useRemoveCardMember } from '@/hooks/tasks/use-card-members';
import { useComments, useCreateComment } from '@/hooks/tasks/use-comments';

import { CardModalMembers } from './card-modal-members';
import { CardModalSidebar } from './card-modal-sidebar';
import { CardModalGeneralTab } from './card-modal-general-tab';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { getGradientForBoard } from '@/components/tasks/shared/board-gradients';
import { storageFilesService } from '@/services/storage/files.service';
import { attachmentsService, integrationsService } from '@/services/tasks';

import type {
  CardPriority,
  CardStatus,
  IntegrationType,
  CardIntegration,
  CardAttachment,
  CustomField,
} from '@/types/tasks';

// Lazy-loaded tab components
const CardCommentsTab = lazy(() =>
  import('../tabs/card-comments-tab').then(m => ({ default: m.CardCommentsTab }))
);
const CardSubtasksTab = lazy(() =>
  import('../tabs/card-subtasks-tab').then(m => ({ default: m.CardSubtasksTab }))
);
const CardChecklistTab = lazy(() =>
  import('../tabs/card-checklist-tab').then(m => ({ default: m.CardChecklistTab }))
);
const CardActivityTab = lazy(() =>
  import('../tabs/card-activity-tab').then(m => ({ default: m.CardActivityTab }))
);

interface CardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  cardId?: string;
  defaultColumnId?: string;
}

type ModalTab = 'geral' | 'comentarios' | 'subtarefas' | 'atividade';

const TABS: { key: ModalTab; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'geral', label: 'Geral', icon: FileText, color: 'text-blue-500' },
  { key: 'comentarios', label: 'Comentários', icon: MessageSquare, color: 'text-emerald-500' },
  { key: 'subtarefas', label: 'Subtarefas', icon: ListChecks, color: 'text-violet-500' },
  { key: 'atividade', label: 'Atividade', icon: Activity, color: 'text-orange-500' },
];

function TabSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export function CardModal({
  open,
  onOpenChange,
  boardId,
  cardId,
  defaultColumnId,
}: CardModalProps) {
  const isEditMode = !!cardId;

  // ── Data queries ──
  const { data: boardData } = useBoard(boardId);
  const { data: labelsData } = useLabels(boardId);
  const { data: fieldsData } = useCustomFields(boardId);
  const {
    data: cardData,
    isLoading: isLoadingCard,
    isError: isCardError,
  } = useCard(boardId, cardId ?? '');

  // Edit-mode-only queries (only enabled when we have a cardId)
  const { data: attachmentsData } = useAttachments(boardId, cardId ?? '');
  const { data: integrationsData } = useIntegrations(boardId, cardId ?? '');
  const { data: cardMembersData } = useCardMembers(boardId, cardId ?? '');
  const { data: commentsData } = useComments(boardId, cardId ?? '');

  // ── Derived data ──
  const board = boardData?.board;
  const columns = board?.columns ?? [];
  const members = board?.members ?? [];
  const allLabels = labelsData?.labels ?? [];
  const customFields: CustomField[] = fieldsData?.customFields ?? [];
  const card = cardData?.card;
  const attachments: CardAttachment[] = attachmentsData?.attachments ?? [];
  const integrations: CardIntegration[] = integrationsData?.integrations ?? [];
  const cardMemberIds: string[] = (cardMembersData?.members ?? []).map(
    (m: { userId: string }) => m.userId
  );
  const recentComments = (commentsData?.comments ?? [])
    .slice(0, 3)
    .map((c: { id: string; content: string; authorName: string | null; authorAvatarUrl?: string | null; createdAt: string }) => ({
      id: c.id,
      content: c.content,
      authorName: c.authorName,
      authorAvatarUrl: c.authorAvatarUrl,
      createdAt: c.createdAt,
    }));

  const sortedColumns = [...columns].sort((a, b) => a.position - b.position);
  const firstColumnId = sortedColumns[0]?.id ?? '';

  // ── Mutations ──
  const createCard = useCreateCard(boardId);
  const updateCard = useUpdateCard(boardId);
  const moveCard = useMoveCard(boardId);
  const assignCard = useAssignCard(boardId);
  const archiveCard = useArchiveCard(boardId);
  const deleteCard = useDeleteCard(boardId);
  const manageLabels = useManageCardLabels(boardId);
  const setFieldValues = useSetCustomFieldValues(boardId);
  const uploadAttachment = useUploadAttachment(boardId, cardId ?? '');
  const deleteAttachment = useDeleteAttachment(boardId, cardId ?? '');
  const createIntegration = useCreateIntegration(boardId, cardId ?? '');
  const deleteIntegration = useDeleteIntegration(boardId, cardId ?? '');
  const addCardMember = useAddCardMember(boardId, cardId ?? '');
  const removeCardMember = useRemoveCardMember(boardId, cardId ?? '');
  const createComment = useCreateComment(boardId, cardId ?? '');

  // ── Local state ──
  const [activeTab, setActiveTab] = useState<ModalTab>('geral');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(defaultColumnId ?? firstColumnId);
  const [priority, setPriority] = useState<CardPriority>('NONE');
  const [status, setStatus] = useState<CardStatus>('OPEN');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [parentCardId, setParentCardId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [estimatedHours, setEstimatedHours] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingIntegrations, setPendingIntegrations] = useState<
    { type: IntegrationType; entityId: string; entityLabel: string }[]
  >([]);

  const initializedRef = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // ── Initialize form from card data (edit mode) ──
  useEffect(() => {
    if (isEditMode && card && !initializedRef.current) {
      setTitle(card.title);
      setDescription(card.description ?? '');
      setColumnId(card.columnId);
      setPriority(card.priority);
      setStatus(card.status);
      setAssigneeId(card.assigneeId);
      setSelectedLabelIds(card.labels?.map(l => l.id) ?? []);
      setParentCardId(card.parentCardId);
      setStartDate(card.startDate ? new Date(card.startDate) : undefined);
      setDueDate(card.dueDate ? new Date(card.dueDate) : undefined);
      setEstimatedHours(card.estimatedHours != null ? String(card.estimatedHours) : '');
      // Initialize custom field values
      const vals: Record<string, string> = {};
      for (const fv of card.customFieldValues ?? []) {
        vals[fv.fieldId] = fv.value ?? '';
      }
      setCustomFieldValues(vals);
      initializedRef.current = true;
    }
  }, [isEditMode, card]);

  // Initialize card members from query
  useEffect(() => {
    if (isEditMode && cardMemberIds.length > 0 && memberIds.length === 0) {
      setMemberIds(cardMemberIds);
    }
  }, [isEditMode, cardMemberIds, memberIds.length]);

  // Auto-focus title in edit mode after card data loads
  useEffect(() => {
    if (isEditMode && card && initializedRef.current) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => titleRef.current?.focus());
    }
  }, [isEditMode, card]);

  // Set default column when board loads (create mode)
  useEffect(() => {
    if (!isEditMode && !columnId && firstColumnId) {
      setColumnId(firstColumnId);
    }
  }, [isEditMode, columnId, firstColumnId]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      initializedRef.current = false;
      setTitle('');
      setDescription('');
      setColumnId(defaultColumnId ?? '');
      setPriority('NONE');
      setStatus('OPEN');
      setAssigneeId(null);
      setSelectedLabelIds([]);
      setParentCardId(null);
      setStartDate(undefined);
      setDueDate(undefined);
      setEstimatedHours('');
      setCustomFieldValues({});
      setMemberIds([]);
      setPendingFiles([]);
      setActiveTab('geral');
      setDeleteModalOpen(false);
    }
  }, [open, defaultColumnId]);

  // ── Handlers ──

  const handleToggleLabel = useCallback(
    (labelId: string) => {
      setSelectedLabelIds(prev =>
        prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
      );
      // Auto-save in edit mode
      if (isEditMode && cardId) {
        const newIds = selectedLabelIds.includes(labelId)
          ? selectedLabelIds.filter(id => id !== labelId)
          : [...selectedLabelIds, labelId];
        manageLabels.mutate(
          { cardId, labelIds: newIds },
          {
            onError: () =>
              toast.error('Não foi possível atualizar as etiquetas. Tente novamente.'),
          }
        );
      }
    },
    [isEditMode, cardId, selectedLabelIds, manageLabels]
  );

  const handleColumnChange = useCallback(
    (newColumnId: string) => {
      setColumnId(newColumnId);
      if (isEditMode && cardId) {
        moveCard.mutate(
          { cardId, data: { columnId: newColumnId, position: 0 } },
          {
            onSuccess: () => toast.success('Cartão movido'),
            onError: () => toast.error('Não foi possível mover o cartão. Tente novamente.'),
          }
        );
      }
    },
    [isEditMode, cardId, moveCard]
  );

  const handleStatusChange = useCallback(
    (newStatus: CardStatus) => {
      setStatus(newStatus);
      if (isEditMode && cardId) {
        updateCard.mutate(
          { cardId, data: { status: newStatus } },
          {
            onSuccess: () => toast.success('Status atualizado'),
            onError: () => toast.error('Não foi possível atualizar o status. Tente novamente.'),
          }
        );
      }
    },
    [isEditMode, cardId, updateCard]
  );

  const handlePriorityChange = useCallback(
    (newPriority: CardPriority) => {
      setPriority(newPriority);
      if (isEditMode && cardId) {
        updateCard.mutate(
          { cardId, data: { priority: newPriority } },
          {
            onSuccess: () => toast.success('Prioridade atualizada'),
            onError: () =>
              toast.error('Não foi possível atualizar a prioridade. Tente novamente.'),
          }
        );
      }
    },
    [isEditMode, cardId, updateCard]
  );

  const handleAssigneeChange = useCallback(
    (newAssigneeId: string | null) => {
      setAssigneeId(newAssigneeId);
      if (isEditMode && cardId) {
        assignCard.mutate(
          { cardId, assigneeId: newAssigneeId },
          {
            onSuccess: () =>
              toast.success(newAssigneeId ? 'Responsável atribuído' : 'Responsável removido'),
            onError: () =>
              toast.error('Não foi possível atribuir o responsável. Tente novamente.'),
          }
        );
      }
    },
    [isEditMode, cardId, assignCard]
  );

  const handleStartDateChange = useCallback(
    (date: Date | undefined) => {
      setStartDate(date);
      if (isEditMode && cardId) {
        updateCard.mutate(
          { cardId, data: { startDate: date ? date.toISOString() : null } },
          {
            onSuccess: () => toast.success(date ? 'Data de início definida' : 'Data de início removida'),
            onError: () =>
              toast.error('Não foi possível atualizar a data de início. Tente novamente.'),
          }
        );
      }
    },
    [isEditMode, cardId, updateCard]
  );

  const handleDueDateChange = useCallback(
    (date: Date | undefined) => {
      setDueDate(date);
      if (isEditMode && cardId) {
        updateCard.mutate(
          { cardId, data: { dueDate: date ? date.toISOString() : null } },
          {
            onSuccess: () => toast.success(date ? 'Prazo definido' : 'Prazo removido'),
            onError: () => toast.error('Não foi possível atualizar o prazo. Tente novamente.'),
          }
        );
      }
    },
    [isEditMode, cardId, updateCard]
  );

  const handleEstimatedHoursChange = useCallback(
    (value: string) => {
      setEstimatedHours(value);
    },
    []
  );

  // Auto-save estimated hours on blur in edit mode
  const handleEstimatedHoursBlur = useCallback(() => {
    if (isEditMode && cardId) {
      const hours = estimatedHours ? parseFloat(estimatedHours) : null;
      updateCard.mutate(
        { cardId, data: { estimatedHours: hours } },
        {
          onSuccess: () => toast.success('Estimativa atualizada'),
          onError: () =>
            toast.error('Não foi possível atualizar a estimativa. Tente novamente.'),
        }
      );
    }
  }, [isEditMode, cardId, estimatedHours, updateCard]);

  const handleCustomFieldChange = useCallback(
    (fieldId: string, value: string) => {
      setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }));
    },
    []
  );

  const handleAddMember = useCallback(
    (userId: string) => {
      setMemberIds(prev => [...prev, userId]);
      if (isEditMode && cardId) {
        addCardMember.mutate(userId, {
          onError: () =>
            toast.error('Não foi possível adicionar o membro. Tente novamente.'),
        });
      }
    },
    [isEditMode, cardId, addCardMember]
  );

  const handleRemoveMember = useCallback(
    (userId: string) => {
      setMemberIds(prev => prev.filter(id => id !== userId));
      if (isEditMode && cardId) {
        removeCardMember.mutate(userId, {
          onError: () =>
            toast.error('Não foi possível remover o membro. Tente novamente.'),
        });
      }
    },
    [isEditMode, cardId, removeCardMember]
  );

  const handleRemoveAttachment = useCallback(
    (attachmentId: string) => {
      if (isEditMode) {
        deleteAttachment.mutate(attachmentId, {
          onSuccess: () => toast.success('Anexo removido'),
          onError: () => toast.error('Não foi possível remover o anexo. Tente novamente.'),
        });
      }
    },
    [isEditMode, deleteAttachment]
  );

  const handleUploadAttachment = useCallback(
    async (file: File) => {
      if (!isEditMode || !cardId) {
        // Buffer files for upload after card creation
        setPendingFiles(prev => [...prev, file]);
        toast.info('Arquivo será enviado ao salvar o cartão');
        return;
      }

      try {
        // 1. Upload file to storage
        const storageResult = await storageFilesService.uploadFile(null, file, {
          entityType: 'task-attachment',
          entityId: cardId,
        });

        // 2. Link to card as attachment
        await uploadAttachment.mutateAsync({
          fileId: storageResult.file.id,
          fileName: file.name,
        });

        toast.success('Anexo adicionado');
      } catch {
        toast.error('Não foi possível enviar o anexo. Tente novamente.');
      }
    },
    [isEditMode, cardId, uploadAttachment]
  );

  const handleLinkStorageFile = useCallback(
    async (file: { id: string; name: string; size: number; mimeType: string }) => {
      if (!isEditMode || !cardId) {
        toast.info('Salve o cartão antes de vincular arquivos do Storage');
        return;
      }

      try {
        await uploadAttachment.mutateAsync({
          fileId: file.id,
          fileName: file.name,
        });
        toast.success('Arquivo do Storage vinculado');
      } catch {
        toast.error('Não foi possível vincular o arquivo. Tente novamente.');
      }
    },
    [isEditMode, cardId, uploadAttachment]
  );

  const handleAddComment = useCallback(
    (content: string) => {
      if (!isEditMode || !cardId || !content.trim()) return;
      createComment.mutate(
        { content: content.trim() },
        {
          onSuccess: () => toast.success('Comentário adicionado'),
          onError: () => toast.error('Não foi possível adicionar o comentário.'),
        }
      );
    },
    [isEditMode, cardId, createComment]
  );

  const handleAddIntegration = useCallback(
    (type: IntegrationType, entityId: string, entityLabel: string) => {
      if (isEditMode && cardId) {
        createIntegration.mutate(
          { type, entityId, entityLabel },
          {
            onSuccess: () => toast.success('Integração adicionada'),
            onError: () =>
              toast.error('Não foi possível adicionar a integração. Tente novamente.'),
          }
        );
      } else {
        // Create mode — buffer locally
        setPendingIntegrations((prev) => [...prev, { type, entityId, entityLabel }]);
        toast.success('Integração será criada ao salvar o cartão');
      }
    },
    [isEditMode, cardId, createIntegration]
  );

  const handleRemoveIntegration = useCallback(
    (integrationId: string) => {
      if (isEditMode) {
        deleteIntegration.mutate(integrationId, {
          onSuccess: () => toast.success('Integração removida'),
          onError: () => toast.error('Não foi possível remover a integração. Tente novamente.'),
        });
      } else if (integrationId.startsWith('pending-')) {
        const idx = parseInt(integrationId.replace('pending-', ''), 10);
        setPendingIntegrations((prev) => prev.filter((_, i) => i !== idx));
      }
    },
    [isEditMode, deleteIntegration]
  );

  // ── Actions ──

  const handleCopyLink = useCallback(() => {
    if (!cardId) return;
    const url = `${window.location.origin}${window.location.pathname}?card=${cardId}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success('Link copiado'),
      () => toast.error('Não foi possível copiar o link. Tente novamente.')
    );
  }, [cardId]);

  const handleArchive = useCallback(() => {
    if (!cardId || !card) return;
    const isArchived = !!card.archivedAt;
    archiveCard.mutate(
      { cardId, archive: !isArchived },
      {
        onSuccess: () => {
          toast.success(isArchived ? 'Cartão desarquivado' : 'Cartão arquivado');
          if (!isArchived) onOpenChange(false);
        },
        onError: () =>
          toast.error('Não foi possível arquivar o cartão. Tente novamente.'),
      }
    );
  }, [cardId, card, archiveCard, onOpenChange]);

  const handleDeleteConfirm = useCallback(() => {
    if (!cardId) return;
    deleteCard.mutate(cardId, {
      onSuccess: () => {
        toast.success('Cartão excluído');
        setDeleteModalOpen(false);
        onOpenChange(false);
      },
      onError: () =>
        toast.error('Não foi possível excluir o cartão. Tente novamente.'),
    });
  }, [cardId, deleteCard, onOpenChange]);

  // ── Title/Description save (edit mode) ──

  const handleTitleBlur = useCallback(() => {
    if (!isEditMode || !cardId || !card) return;
    if (!title.trim() || title.trim() === card.title) return;
    updateCard.mutate(
      { cardId, data: { title: title.trim() } },
      {
        onSuccess: () => toast.success('Título atualizado'),
        onError: () => toast.error('Não foi possível atualizar o título. Tente novamente.'),
      }
    );
  }, [isEditMode, cardId, card, title, updateCard]);

  const handleDescriptionBlur = useCallback(() => {
    if (!isEditMode || !cardId || !card) return;
    const newDesc = description.trim() || null;
    if (newDesc === (card.description ?? null)) return;
    updateCard.mutate(
      { cardId, data: { description: newDesc } },
      {
        onSuccess: () => toast.success('Descrição atualizada'),
        onError: () => toast.error('Não foi possível atualizar a descrição. Tente novamente.'),
      }
    );
  }, [isEditMode, cardId, card, description, updateCard]);

  // ── Create submit ──

  const handleCreate = useCallback(async () => {
    if (!title.trim()) {
      toast.error('O título do cartão é obrigatório.');
      return;
    }
    if (!columnId) {
      toast.error('Selecione uma coluna.');
      return;
    }

    try {
      const result = await createCard.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        columnId,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? dueDate.toISOString() : null,
        startDate: startDate ? startDate.toISOString() : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
        parentCardId: parentCardId || null,
      });

      const newCardId = result?.card?.id;

      // After creation, run secondary mutations in parallel
      if (newCardId) {
        const promises: Promise<unknown>[] = [];

        // Custom field values
        const fieldEntries = Object.entries(customFieldValues).filter(
          ([, v]) => v !== ''
        );
        if (fieldEntries.length > 0) {
          promises.push(
            setFieldValues.mutateAsync({
              cardId: newCardId,
              values: fieldEntries.map(([fieldId, value]) => ({
                fieldId,
                value: value || null,
              })),
            })
          );
        }

        // Create pending integrations
        for (const integration of pendingIntegrations) {
          promises.push(
            integrationsService.create(boardId, newCardId, {
              type: integration.type,
              entityId: integration.entityId,
              entityLabel: integration.entityLabel,
            })
          );
        }

        // Upload pending files
        for (const file of pendingFiles) {
          promises.push(
            storageFilesService
              .uploadFile(null, file, {
                entityType: 'task-attachment',
                entityId: newCardId,
              })
              .then((storageResult) =>
                attachmentsService.upload(boardId, newCardId, {
                  fileId: storageResult.file.id,
                  fileName: file.name,
                })
              )
          );
        }

        if (promises.length > 0) {
          const results = await Promise.allSettled(promises);
          const failures = results.filter(r => r.status === 'rejected');
          if (failures.length > 0) {
            toast.warning(
              `Cartão criado, mas ${failures.length} operação(ões) secundária(s) falharam.`
            );
          }
        }
      }

      toast.success('Cartão criado com sucesso!');
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao criar cartão.';
      toast.error(message);
    }
  }, [
    title, description, columnId, priority, assigneeId, dueDate, startDate,
    estimatedHours, selectedLabelIds, parentCardId, customFieldValues, pendingFiles,
    pendingIntegrations, boardId, createCard, setFieldValues, onOpenChange,
  ]);

  // ── Save (edit mode) — batch custom fields ──

  const handleSave = useCallback(async () => {
    if (!cardId) return;

    // Save custom fields
    const existingValues = card?.customFieldValues ?? [];
    const changedValues = customFields
      .map(field => {
        const newValue = customFieldValues[field.id] ?? '';
        const existingValue = existingValues.find(v => v.fieldId === field.id)?.value ?? '';
        if (newValue === existingValue) return null;
        return { fieldId: field.id, value: newValue || null };
      })
      .filter(Boolean) as { fieldId: string; value: string | null }[];

    if (changedValues.length > 0) {
      setFieldValues.mutate(
        { cardId, values: changedValues },
        {
          onSuccess: () => toast.success('Campos atualizados'),
          onError: () =>
            toast.error('Não foi possível salvar os campos. Tente novamente.'),
        }
      );
    }

    // Also save estimated hours if needed
    handleEstimatedHoursBlur();

    onOpenChange(false);
  }, [
    cardId, card, customFields, customFieldValues, setFieldValues,
    handleEstimatedHoursBlur, onOpenChange,
  ]);

  // ── Render ──

  if (!open) return null;

  const isLoading = isEditMode && (isLoadingCard || !card);
  const isError = isEditMode && isCardError;
  const isPending = createCard.isPending;

  const gradient = getGradientForBoard(boardId, board?.gradientId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="h-[100dvh] w-full max-w-full md:h-auto md:max-w-[800px] md:max-h-[90vh] overflow-hidden p-0 gap-0 rounded-none md:rounded-lg"
          showCloseButton={false}
        >
          {/* Board color header strip */}
          <div
            className="h-1.5 w-full shrink-0 rounded-t-lg"
            style={{ background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})` }}
          />

          {isError ? (
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
          ) : isLoading ? (
            <div className="flex items-center justify-center p-20">
              <DialogHeader className="sr-only">
                <DialogTitle>Carregando cartão...</DialogTitle>
                <DialogDescription>Carregando detalhes do cartão</DialogDescription>
              </DialogHeader>
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="flex flex-col h-full md:max-h-[90vh]">
              {/* ── Fixed area: Title + Description ── */}
              <div className="shrink-0 px-5 pt-4 pb-3 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Title row + Members */}
                    <div className="flex items-center gap-3">
                      <Input
                        ref={titleRef}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            titleRef.current?.blur();
                          }
                        }}
                        placeholder="Título do cartão"
                        className="text-lg font-bold border-none shadow-none px-0 focus-visible:ring-0 h-auto py-0 flex-1"
                        autoFocus
                      />
                      <CardModalMembers
                        boardId={boardId}
                        cardId={cardId}
                        boardMembers={members}
                        members={memberIds}
                        onAdd={handleAddMember}
                        onRemove={handleRemoveMember}
                      />
                    </div>
                    <DialogHeader className="sr-only">
                      <DialogTitle>
                        {isEditMode ? 'Editar cartão' : 'Novo cartão'}
                      </DialogTitle>
                      <DialogDescription>
                        {isEditMode
                          ? `Editando cartão: ${card?.title ?? ''}`
                          : 'Criando novo cartão'}
                      </DialogDescription>
                    </DialogHeader>
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

              </div>

              {/* ── Two-panel area ── */}
              <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
                {/* Left panel */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Tab bar */}
                  <div className="shrink-0 flex items-center gap-0.5 px-4 border-b border-border/50 bg-slate-50 dark:bg-white/5 overflow-x-auto scrollbar-none">
                    {TABS.map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          className={cn(
                            'relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap',
                            isActive
                              ? 'text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                          onClick={() => setActiveTab(tab.key)}
                        >
                          <Icon
                            className={cn('h-3.5 w-3.5', isActive ? tab.color : '')}
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
                  <div className={cn(
                    'flex-1 min-h-0 px-5 py-4',
                    activeTab === 'geral' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'
                  )}>
                    {activeTab === 'geral' && (
                      <CardModalGeneralTab
                        description={description}
                        onDescriptionChange={setDescription}
                        onDescriptionBlur={handleDescriptionBlur}
                        attachments={isEditMode ? attachments : []}
                        onUploadAttachment={handleUploadAttachment}
                        onRemoveAttachment={handleRemoveAttachment}
                        onLinkStorageFile={isEditMode ? handleLinkStorageFile : undefined}
                        boardId={boardId}
                        customFields={customFields}
                        customFieldValues={customFieldValues}
                        onCustomFieldChange={handleCustomFieldChange}
                        recentComments={isEditMode ? recentComments : []}
                        onAddComment={isEditMode && cardId ? handleAddComment : undefined}
                        onViewAllComments={
                          isEditMode
                            ? () => setActiveTab('comentarios')
                            : undefined
                        }
                        isCreateMode={!isEditMode}
                      />
                    )}

                    {activeTab === 'comentarios' && isEditMode && cardId && (
                      <Suspense fallback={<TabSkeleton />}>
                        <CardCommentsTab boardId={boardId} cardId={cardId} />
                      </Suspense>
                    )}
                    {activeTab === 'comentarios' && !isEditMode && (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        Comentários estarão disponíveis após criar o cartão
                      </p>
                    )}

                    {activeTab === 'subtarefas' && isEditMode && cardId && (
                      <Suspense fallback={<TabSkeleton />}>
                        <div className="space-y-3">
                          <CardSubtasksTab boardId={boardId} cardId={cardId} />
                          <CardChecklistTab
                            boardId={boardId}
                            cardId={cardId}
                            checklists={card?.checklists ?? []}
                          />
                        </div>
                      </Suspense>
                    )}
                    {activeTab === 'subtarefas' && !isEditMode && (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        Subtarefas estarão disponíveis após criar o cartão
                      </p>
                    )}

                    {activeTab === 'atividade' && isEditMode && cardId && (
                      <Suspense fallback={<TabSkeleton />}>
                        <CardActivityTab boardId={boardId} cardId={cardId} />
                      </Suspense>
                    )}
                    {activeTab === 'atividade' && !isEditMode && (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        O histórico de atividades aparecerá após a criação do cartão
                      </p>
                    )}
                  </div>
                </div>

                {/* Right sidebar */}
                <CardModalSidebar
                  columns={columns}
                  columnId={columnId}
                  onColumnChange={handleColumnChange}
                  status={status}
                  onStatusChange={handleStatusChange}
                  showStatus={isEditMode}
                  priority={priority}
                  onPriorityChange={handlePriorityChange}
                  allLabels={allLabels}
                  selectedLabelIds={selectedLabelIds}
                  onToggleLabel={handleToggleLabel}
                  members={members}
                  assigneeId={assigneeId}
                  onAssigneeChange={handleAssigneeChange}
                  startDate={startDate}
                  onStartDateChange={handleStartDateChange}
                  dueDate={dueDate}
                  onDueDateChange={handleDueDateChange}
                  parentCardId={parentCardId}
                  onParentCardChange={setParentCardId}
                  estimatedHours={estimatedHours}
                  onEstimatedHoursChange={handleEstimatedHoursChange}
                  integrations={
                    isEditMode
                      ? integrations
                      : pendingIntegrations.map((pi, idx) => ({
                          id: `pending-${idx}`,
                          cardId: '',
                          type: pi.type,
                          entityId: pi.entityId,
                          entityLabel: pi.entityLabel,
                          createdAt: new Date().toISOString(),
                          createdBy: '',
                        }))
                  }
                  onAddIntegration={handleAddIntegration}
                  onRemoveIntegration={handleRemoveIntegration}
                />
              </div>

              {/* ── Footer ── */}
              <div className="shrink-0 border-t border-border px-5 py-3 flex items-center justify-between">
                {/* Left: Actions (edit mode) */}
                <div className="flex items-center gap-1">
                  {isEditMode && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-2.5 text-xs gap-1.5"
                        onClick={handleCopyLink}
                        type="button"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copiar link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-2.5 text-xs gap-1.5"
                        onClick={handleArchive}
                        type="button"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        {card?.archivedAt ? 'Desarquivar' : 'Arquivar'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-2.5 text-xs gap-1.5 text-rose-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        onClick={() => setDeleteModalOpen(true)}
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </Button>
                    </>
                  )}
                </div>

                {/* Right: Cancel + Submit */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5"
                    onClick={() => onOpenChange(false)}
                    disabled={isPending}
                    type="button"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="h-9 px-2.5"
                    onClick={isEditMode ? handleSave : handleCreate}
                    disabled={isPending}
                    type="button"
                  >
                    {isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    )}
                    {isEditMode ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete PIN confirmation */}
      {isEditMode && (
        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Excluir cartão"
          description="Esta ação é irreversível. Subtarefas, comentários e anexos também serão removidos. Digite seu PIN para confirmar."
        />
      )}
    </>
  );
}
