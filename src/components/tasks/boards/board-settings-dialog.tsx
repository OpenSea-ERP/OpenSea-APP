'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useBoard, useUpdateBoard } from '@/hooks/tasks/use-boards';
import {
  useCreateColumn,
  useUpdateColumn,
  useDeleteColumn,
  useReorderColumns,
} from '@/hooks/tasks/use-columns';
import type { BoardVisibility } from '@/types/tasks';
import { toast } from 'sonner';
import { Loader2, Settings2 } from 'lucide-react';
import { BoardSettingsGeneral } from './board-settings-general';
import { BoardSettingsGradient } from './board-settings-gradient';
import { BoardSettingsColumns } from './board-settings-columns';
import { BoardCustomFieldsDialog } from './board-custom-fields-dialog';

interface BoardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
}

export function BoardSettingsDialog({
  open,
  onOpenChange,
  boardId,
}: BoardSettingsDialogProps) {
  const { data: boardData } = useBoard(boardId);
  const updateBoard = useUpdateBoard();
  const createColumn = useCreateColumn(boardId);
  const updateColumn = useUpdateColumn(boardId);
  const deleteColumn = useDeleteColumn(boardId);
  const reorderColumns = useReorderColumns(boardId);

  const board = boardData?.board;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<BoardVisibility>('PRIVATE');
  const [customFieldsOpen, setCustomFieldsOpen] = useState(false);

  useEffect(() => {
    if (board) {
      setName(board.title);
      setDescription(board.description ?? '');
      setVisibility(board.visibility);
    }
  }, [board]);

  const columns = board?.columns
    ? [...board.columns].sort((a, b) => a.position - b.position)
    : [];

  async function handleSave() {
    if (!name.trim()) {
      toast.error('O nome do quadro é obrigatório.');
      return;
    }

    try {
      await updateBoard.mutateAsync({
        boardId,
        data: {
          title: name.trim(),
          description: description.trim() || null,
          visibility,
        },
      });
      toast.success('Quadro atualizado com sucesso!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar quadro.';
      toast.error(message);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurações do Quadro</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <BoardSettingsGeneral
              name={name}
              onNameChange={setName}
              description={description}
              onDescriptionChange={setDescription}
              visibility={visibility}
              onVisibilityChange={setVisibility}
            />

            <BoardSettingsGradient
              boardId={boardId}
              currentGradientId={board?.gradientId}
              updateBoard={updateBoard}
            />

            <BoardSettingsColumns
              columns={columns}
              createColumn={createColumn}
              updateColumn={updateColumn}
              deleteColumn={deleteColumn}
              reorderColumns={reorderColumns}
            />

            {/* Custom Fields */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Campos Personalizados</h3>
              <p className="text-xs text-muted-foreground">
                Defina campos extras para os cartões deste quadro.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5 gap-1.5"
                onClick={() => setCustomFieldsOpen(true)}
                type="button"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Gerenciar Campos
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateBoard.isPending}
            >
              Fechar
            </Button>
            <Button onClick={handleSave} disabled={updateBoard.isPending}>
              {updateBoard.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BoardCustomFieldsDialog
        open={customFieldsOpen}
        onOpenChange={setCustomFieldsOpen}
        boardId={boardId}
      />
    </>
  );
}
