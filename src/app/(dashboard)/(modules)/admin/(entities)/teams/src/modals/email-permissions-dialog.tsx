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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { teamsService } from '@/services/core/teams.service';
import type {
  TeamEmailAccount,
  UpdateTeamEmailPermissionsData,
} from '@/types/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface EmailPermissionsDialogProps {
  teamId: string;
  teamEmail: TeamEmailAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PermissionKey = keyof UpdateTeamEmailPermissionsData;

const ROLES = [
  { key: 'owner', label: 'Proprietário' },
  { key: 'admin', label: 'Administrador' },
  { key: 'member', label: 'Membro' },
] as const;

const ACTIONS = [
  { key: 'Read', label: 'Leitura' },
  { key: 'Send', label: 'Envio' },
  { key: 'Manage', label: 'Gerenciamento' },
] as const;

function extractPermissions(
  te: TeamEmailAccount,
): UpdateTeamEmailPermissionsData {
  return {
    ownerCanRead: te.ownerCanRead,
    ownerCanSend: te.ownerCanSend,
    ownerCanManage: te.ownerCanManage,
    adminCanRead: te.adminCanRead,
    adminCanSend: te.adminCanSend,
    adminCanManage: te.adminCanManage,
    memberCanRead: te.memberCanRead,
    memberCanSend: te.memberCanSend,
    memberCanManage: te.memberCanManage,
  };
}

export function EmailPermissionsDialog({
  teamId,
  teamEmail,
  open,
  onOpenChange,
}: EmailPermissionsDialogProps) {
  const queryClient = useQueryClient();
  const [permissions, setPermissions] =
    useState<UpdateTeamEmailPermissionsData>({});

  useEffect(() => {
    if (teamEmail && open) {
      setPermissions(extractPermissions(teamEmail));
    }
  }, [teamEmail, open]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTeamEmailPermissionsData) =>
      teamsService.updateTeamEmailPermissions(
        teamId,
        teamEmail!.accountId,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'emails'] });
      toast.success('Permissões atualizadas com sucesso');
      onOpenChange(false);
    },
    onError: () => toast.error('Erro ao atualizar permissões'),
  });

  const togglePermission = (key: PermissionKey) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(permissions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Permissões de E-mail
          </DialogTitle>
          <DialogDescription>
            {teamEmail?.accountAddress
              ? `Editar permissões para ${teamEmail.accountAddress}`
              : 'Editar permissões de acesso ao e-mail por papel.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <div className="space-y-3">
            <Label>Permissões por papel</Label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-3 font-medium">Papel</th>
                    {ACTIONS.map(action => (
                      <th
                        key={action.key}
                        className="text-center py-2 px-3 font-medium"
                      >
                        {action.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map(role => (
                    <tr key={role.key} className="border-b last:border-b-0">
                      <td className="py-2.5 px-3 font-medium">{role.label}</td>
                      {ACTIONS.map(action => {
                        const key =
                          `${role.key}Can${action.key}` as PermissionKey;
                        return (
                          <td key={action.key} className="text-center py-2.5 px-3">
                            <Switch
                              checked={permissions[key] ?? false}
                              onCheckedChange={() => togglePermission(key)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
