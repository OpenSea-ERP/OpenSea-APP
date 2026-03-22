'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBoard } from '@/hooks/tasks/use-boards';
import {
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from '@/hooks/tasks/use-members';
import type { BoardMemberRole } from '@/types/tasks';
import { toast } from 'sonner';
import { Loader2, UserPlus, Trash2, Crown, Eye, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MemberAvatar } from '@/components/tasks/shared/member-avatar';

interface BoardMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
}

const ROLE_LABELS: Record<BoardMemberRole, string> = {
  OWNER: 'Proprietário',
  VIEWER: 'Visualizador',
  EDITOR: 'Editor',
};

export function BoardMembersDialog({
  open,
  onOpenChange,
  boardId,
}: BoardMembersDialogProps) {
  const { data: boardData } = useBoard(boardId);
  const inviteMember = useInviteMember(boardId);
  const updateRole = useUpdateMemberRole(boardId);
  const removeMember = useRemoveMember(boardId);

  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<BoardMemberRole>('EDITOR');
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const members = boardData?.board?.members ?? [];

  async function handleInvite() {
    if (!inviteUserId.trim()) {
      toast.error('Informe o ID ou e-mail do usuário.');
      return;
    }

    try {
      await inviteMember.mutateAsync({
        userId: inviteUserId.trim(),
        role: inviteRole,
      });
      setInviteUserId('');
      toast.success('Membro convidado com sucesso!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao convidar membro.';
      toast.error(message);
    }
  }

  async function handleUpdateRole(memberId: string, role: BoardMemberRole) {
    try {
      await updateRole.mutateAsync({ memberId, data: { role } });
      toast.success('Função atualizada!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar função.';
      toast.error(message);
    }
  }

  async function handleRemove(memberId: string) {
    try {
      await removeMember.mutateAsync(memberId);
      setRemovingMemberId(null);
      toast.success('Membro removido!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao remover membro.';
      toast.error(message);
    }
  }

  function getRoleIcon(role: BoardMemberRole) {
    switch (role) {
      case 'EDITOR':
        return <Pencil className="h-3 w-3" />;
      case 'VIEWER':
        return <Eye className="h-3 w-3" />;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Membros do Quadro</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current members */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Membros atuais ({members.length})
            </h3>

            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum membro adicionado.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-md border px-3 py-2"
                  >
                    {/* Avatar */}
                    <MemberAvatar
                      name={member.userName ?? member.userEmail}
                      avatarUrl={member.userAvatarUrl}
                      size="md"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.userName ?? 'Sem nome'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.userEmail ?? member.userId}
                      </p>
                    </div>

                    {/* Role select */}
                    <Select
                      value={member.role}
                      onValueChange={v =>
                        handleUpdateRole(member.id, v as BoardMemberRole)
                      }
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIEWER">
                          <span className="flex items-center gap-1.5">
                            <Eye className="h-3 w-3" />
                            {ROLE_LABELS.VIEWER}
                          </span>
                        </SelectItem>
                        <SelectItem value="EDITOR">
                          <span className="flex items-center gap-1.5">
                            <Pencil className="h-3 w-3" />
                            {ROLE_LABELS.EDITOR}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Remove */}
                    {removingMemberId === member.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => handleRemove(member.id)}
                          disabled={removeMember.isPending}
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setRemovingMemberId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setRemovingMemberId(member.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invite section */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Convidar membro
            </h3>

            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="invite-user" className="text-sm font-medium">
                  ID ou e-mail do usuário
                </label>
                <Input
                  id="invite-user"
                  placeholder="usuário@exemplo.com"
                  value={inviteUserId}
                  onChange={e => setInviteUserId(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleInvite();
                    }
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="member-role" className="text-sm font-medium">
                  Função
                </label>
                <Select
                  value={inviteRole}
                  onValueChange={v => setInviteRole(v as BoardMemberRole)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEWER">{ROLE_LABELS.VIEWER}</SelectItem>
                    <SelectItem value="EDITOR">{ROLE_LABELS.EDITOR}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleInvite}
                disabled={inviteMember.isPending || !inviteUserId.trim()}
              >
                {inviteMember.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Convidar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
