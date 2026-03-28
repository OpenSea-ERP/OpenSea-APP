/**
 * HR Add Member Dialog
 * Dialog para adicionar membro a uma equipe no contexto HR
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserAvatar } from '@/components/shared/user-avatar';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';
import { teamsService } from '@/services/core/teams.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserApiResult {
  id: string;
  email: string;
  username: string;
  profile: {
    name: string;
    surname: string;
    avatarUrl: string;
  } | null;
}

interface UserResult {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

interface AddMemberDialogProps {
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({
  teamId,
  open,
  onOpenChange,
}: AddMemberDialogProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState<UserResult[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');

  useEffect(() => {
    if (!open) return;
    setIsLoadingUsers(true);
    apiClient
      .get<{ users: UserApiResult[] }>('/v1/users')
      .then(response => {
        setAllUsers(
          (response.users ?? []).map(u => ({
            id: u.id,
            name:
              [u.profile?.name, u.profile?.surname].filter(Boolean).join(' ') ||
              u.username,
            username: u.username,
            email: u.email,
            avatarUrl: u.profile?.avatarUrl ?? null,
          }))
        );
      })
      .catch(error => {
        logger.error(
          'Erro ao carregar usuarios',
          error instanceof Error ? error : undefined
        );
        setAllUsers([]);
      })
      .finally(() => setIsLoadingUsers(false));
  }, [open]);

  const searchResults =
    search.trim().length >= 2
      ? allUsers.filter(u => {
          const q = search.toLowerCase();
          return (
            u.username.toLowerCase().includes(q) ||
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
          );
        })
      : [];

  const addMemberMutation = useMutation({
    mutationFn: () =>
      teamsService.addTeamMember(teamId, {
        userId: selectedUser!.id,
        role,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['hr-teams', teamId, 'members'],
      });
      queryClient.invalidateQueries({ queryKey: ['hr-teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['hr-teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      showSuccessToast('Membro adicionado com sucesso');
      handleClose();
    },
    onError: error => {
      logger.error(
        'Erro ao adicionar membro',
        error instanceof Error ? error : undefined
      );
      showErrorToast({
        title: 'Erro ao adicionar membro',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    },
  });

  const handleClose = () => {
    setSearch('');
    setSelectedUser(null);
    setRole('MEMBER');
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    addMemberMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={val => !val && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Adicionar Membro
          </DialogTitle>
          <DialogDescription>
            Busque um usuário para adicionar à equipe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {!selectedUser ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Buscar por username, nome ou e-mail</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Digite o username, nome ou e-mail..."
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>

              {isLoadingUsers && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!isLoadingUsers && searchResults.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-1">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors text-left"
                      onClick={() => setSelectedUser(user)}
                    >
                      <UserAvatar
                        name={user.name}
                        email={user.email}
                        avatarUrl={user.avatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!isLoadingUsers &&
                search.trim().length >= 2 &&
                searchResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    Nenhum usuário encontrado.
                  </p>
                )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-accent/30">
                <UserAvatar
                  name={selectedUser.name}
                  email={selectedUser.email}
                  avatarUrl={selectedUser.avatarUrl}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">
                    @{selectedUser.username}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                >
                  Alterar
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Papel</Label>
                <Select
                  value={role}
                  onValueChange={v => setRole(v as 'ADMIN' | 'MEMBER')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Membro</SelectItem>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!selectedUser || addMemberMutation.isPending}
            >
              {addMemberMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                'Adicionar Membro'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
