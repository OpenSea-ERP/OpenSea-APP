'use client';

import { CentralBadge } from '@/components/central/central-badge';
import type { CentralBadgeVariant } from '@/components/central/central-badge';
import { CentralPageHeader } from '@/components/central/central-page-header';
import {
  CentralTable,
  CentralTableBody,
  CentralTableCell,
  CentralTableHead,
  CentralTableHeader,
  CentralTableRow,
} from '@/components/central/central-table';
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
import {
  useCentralUsers,
  useInviteCentralUser,
  useRemoveCentralUser,
  useUpdateCentralUserRole,
} from '@/hooks/admin/use-admin';
import type { CentralUser } from '@/types/admin';
import { Crown, Loader2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// ─── Role config ───────────────────────────────────────────────────────────────

type CentralRole = CentralUser['role'];

const ROLE_CONFIG: Record<
  CentralRole,
  { label: string; variant: CentralBadgeVariant; icon?: React.ReactNode }
> = {
  OWNER: {
    label: 'Proprietário',
    variant: 'violet',
    icon: <Crown className="h-3 w-3 mr-0.5" />,
  },
  ADMIN: { label: 'Administrador', variant: 'sky' },
  SUPPORT: { label: 'Suporte', variant: 'teal' },
  FINANCE: { label: 'Financeiro', variant: 'emerald' },
  VIEWER: { label: 'Visualizador', variant: 'default' },
};

const ASSIGNABLE_ROLES: CentralRole[] = [
  'ADMIN',
  'SUPPORT',
  'FINANCE',
  'VIEWER',
];

// ─── Role Badge component ──────────────────────────────────────────────────────

function RoleBadge({ role }: { role: CentralRole }) {
  const config = ROLE_CONFIG[role];
  return (
    <CentralBadge variant={config.variant} className="gap-0.5">
      {config.icon}
      {config.label}
    </CentralBadge>
  );
}

// ─── Avatar component ──────────────────────────────────────────────────────────

function UserAvatar({
  firstName,
  lastName,
}: {
  firstName?: string;
  lastName?: string;
}) {
  const initials =
    ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase() || '??';
  return (
    <div
      className="flex items-center justify-center w-[30px] h-[30px] rounded-full text-[10px] font-semibold shrink-0"
      style={{
        background: 'var(--central-avatar-bg)',
        color: 'var(--central-avatar-text)',
      }}
    >
      {initials}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { data: users, isLoading } = useCentralUsers();
  const inviteMutation = useInviteCentralUser();
  const updateRoleMutation = useUpdateCentralUserRole();
  const removeMutation = useRemoveCentralUser();

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteRole, setInviteRole] = useState<CentralRole>('VIEWER');

  // Change role dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<CentralUser | null>(null);
  const [newRole, setNewRole] = useState<CentralRole>('VIEWER');

  // Remove confirmation dialog
  const [removeTarget, setRemoveTarget] = useState<CentralUser | null>(null);

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleInvite = async () => {
    if (!inviteUserId.trim()) {
      toast.error('Informe o ID do usuário');
      return;
    }
    try {
      await inviteMutation.mutateAsync({
        userId: inviteUserId.trim(),
        role: inviteRole,
      });
      toast.success('Membro convidado com sucesso');
      setInviteOpen(false);
      setInviteUserId('');
      setInviteRole('VIEWER');
    } catch {
      toast.error('Erro ao convidar membro');
    }
  };

  const handleChangeRole = async () => {
    if (!roleTarget) return;
    try {
      await updateRoleMutation.mutateAsync({
        userId: roleTarget.userId,
        data: { role: newRole },
      });
      toast.success('Papel atualizado com sucesso');
      setRoleDialogOpen(false);
      setRoleTarget(null);
    } catch {
      toast.error('Erro ao alterar papel');
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await removeMutation.mutateAsync(removeTarget.userId);
      toast.success('Membro removido com sucesso');
      setRemoveTarget(null);
    } catch {
      toast.error('Erro ao remover membro');
    }
  };

  const openChangeRole = (user: CentralUser) => {
    setRoleTarget(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="px-6 py-5 space-y-4">
      <CentralPageHeader
        title="Equipe Central"
        description="Gerencie os membros da equipe de administração"
        action={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Convidar membro
          </Button>
        }
      />

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse"
              style={{ background: 'var(--central-card-bg)' }}
            />
          ))}
        </div>
      ) : !users || users.length === 0 ? (
        <div className="central-card flex flex-col items-center justify-center py-16 gap-3">
          <Users
            className="h-12 w-12"
            style={{ color: 'var(--central-text-muted)' }}
          />
          <p className="text-sm" style={{ color: 'var(--central-text-muted)' }}>
            Nenhum membro encontrado
          </p>
        </div>
      ) : (
        <CentralTable>
          <CentralTableHeader>
            <CentralTableRow>
              <CentralTableHead>Usuário</CentralTableHead>
              <CentralTableHead>E-mail</CentralTableHead>
              <CentralTableHead>Papel</CentralTableHead>
              <CentralTableHead>Status</CentralTableHead>
              <CentralTableHead className="w-[200px]">Ações</CentralTableHead>
            </CentralTableRow>
          </CentralTableHeader>
          <CentralTableBody>
            {users.map(u => (
              <CentralTableRow key={u.id}>
                <CentralTableCell>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      firstName={u.user?.profile?.firstName}
                      lastName={u.user?.profile?.lastName}
                    />
                    <span className="font-medium">
                      {u.user?.profile?.firstName ?? ''}{' '}
                      {u.user?.profile?.lastName ?? ''}
                    </span>
                  </div>
                </CentralTableCell>
                <CentralTableCell>
                  <span style={{ color: 'var(--central-text-secondary)' }}>
                    {u.user?.email ?? '—'}
                  </span>
                </CentralTableCell>
                <CentralTableCell>
                  <RoleBadge role={u.role} />
                </CentralTableCell>
                <CentralTableCell>
                  <CentralBadge variant={u.isActive ? 'emerald' : 'default'}>
                    {u.isActive ? 'Ativo' : 'Inativo'}
                  </CentralBadge>
                </CentralTableCell>
                <CentralTableCell>
                  {u.role !== 'OWNER' && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        onClick={() => openChangeRole(u)}
                      >
                        Alterar papel
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        onClick={() => setRemoveTarget(u)}
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </CentralTableCell>
              </CentralTableRow>
            ))}
          </CentralTableBody>
        </CentralTable>
      )}

      {/* ─── Invite Dialog ──────────────────────────────────────────────── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar membro</DialogTitle>
            <DialogDescription>
              Adicione um novo membro à equipe de administração central.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                style={{ color: 'var(--central-text-primary)' }}
              >
                ID do Usuário
              </label>
              <Input
                placeholder="Insira o ID do usuário..."
                value={inviteUserId}
                onChange={e => setInviteUserId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                style={{ color: 'var(--central-text-primary)' }}
              >
                Papel
              </label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value as CentralRole)}
                className="w-full h-10 px-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-ring bg-transparent"
                style={{
                  borderColor: 'var(--central-separator)',
                  color: 'var(--central-text-primary)',
                }}
              >
                {ASSIGNABLE_ROLES.map(role => (
                  <option key={role} value={role}>
                    {ROLE_CONFIG[role].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleInvite}
              disabled={inviteMutation.isPending}
              className="gap-1.5"
            >
              {inviteMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Convidar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Change Role Dialog ─────────────────────────────────────────── */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar papel</DialogTitle>
            <DialogDescription>
              Altere o papel de{' '}
              <strong>
                {roleTarget?.user?.profile?.firstName}{' '}
                {roleTarget?.user?.profile?.lastName}
              </strong>{' '}
              na equipe central.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label
              className="text-sm font-medium"
              style={{ color: 'var(--central-text-primary)' }}
            >
              Novo papel
            </label>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value as CentralRole)}
              className="w-full h-10 px-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-ring bg-transparent"
              style={{
                borderColor: 'var(--central-separator)',
                color: 'var(--central-text-primary)',
              }}
            >
              {ASSIGNABLE_ROLES.map(role => (
                <option key={role} value={role}>
                  {ROLE_CONFIG[role].label}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={updateRoleMutation.isPending}
              className="gap-1.5"
            >
              {updateRoleMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Remove Confirmation Dialog ─────────────────────────────────── */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={open => !open && setRemoveTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover membro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover{' '}
              <strong>
                {removeTarget?.user?.profile?.firstName}{' '}
                {removeTarget?.user?.profile?.lastName}
              </strong>{' '}
              da equipe central? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={removeMutation.isPending}
              className="gap-1.5"
            >
              {removeMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
