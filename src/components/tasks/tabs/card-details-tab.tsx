'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Paperclip,
  Upload,
  Trash2,
} from 'lucide-react';
import { useUpdateCard } from '@/hooks/tasks/use-cards';
import { useAttachments, useDeleteAttachment } from '@/hooks/tasks/use-attachments';
import type { Card } from '@/types/tasks';

interface CardDetailsTabProps {
  card: Card;
  boardId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CardDetailsTab({ card, boardId }: CardDetailsTabProps) {
  const updateCard = useUpdateCard(boardId);
  const { data: attachmentsData } = useAttachments(boardId, card.id);
  const deleteAttachment = useDeleteAttachment(boardId, card.id);

  const attachments = attachmentsData?.attachments ?? [];

  // Description editing
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');

  const handleStartEditDesc = useCallback(() => {
    setEditDesc(card.description ?? '');
    setIsEditingDesc(true);
  }, [card.description]);

  const handleSaveDesc = useCallback(() => {
    const newDesc = editDesc.trim() || null;
    if (newDesc === (card.description ?? null)) {
      setIsEditingDesc(false);
      return;
    }
    updateCard.mutate(
      { cardId: card.id, data: { description: newDesc } },
      {
        onSuccess: () => {
          toast.success('Descrição atualizada');
          setIsEditingDesc(false);
        },
        onError: () => toast.error('Erro ao atualizar descrição'),
      },
    );
  }, [card.id, card.description, editDesc, updateCard]);

  const handleDeleteAttachment = useCallback(
    (attachmentId: string) => {
      deleteAttachment.mutate(attachmentId, {
        onSuccess: () => toast.success('Anexo removido'),
        onError: () => toast.error('Erro ao remover anexo'),
      });
    },
    [deleteAttachment],
  );

  return (
    <div className="space-y-6 flex-col w-full">
      {/* Description */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Descrição</h3>
        </div>
        {isEditingDesc ? (
          <div className="space-y-2">
            <Textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Adicione uma descrição..."
              rows={4}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveDesc} disabled={updateCard.isPending}>
                Salvar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingDesc(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="min-h-[60px] rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors whitespace-pre-wrap"
            onClick={handleStartEditDesc}
          >
            {card.description || 'Clique para adicionar uma descrição...'}
          </div>
        )}
      </section>

      {/* Attachments */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">
              Anexos {attachments.length > 0 && `(${attachments.length})`}
            </h3>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" disabled>
            <Upload className="h-3.5 w-3.5 mr-1" />
            Enviar
          </Button>
        </div>
        {attachments.length === 0 ? (
          <p className="text-xs text-muted-foreground px-1">Nenhum anexo</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 rounded-md border border-border p-2 text-xs group"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">
                    {att.fileName ?? att.file?.originalName ?? 'Arquivo'}
                  </p>
                  {att.file && (
                    <p className="text-muted-foreground">
                      {formatFileSize(att.file.size)}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => handleDeleteAttachment(att.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
