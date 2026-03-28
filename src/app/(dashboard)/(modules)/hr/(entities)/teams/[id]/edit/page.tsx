/**
 * OpenSea OS - HR Team Edit Page
 * Página de edição de equipe no contexto HR:
 * informações gerais e gerenciamento de membros
 */

'use client';

import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { teamsService } from '@/services/core/teams.service';
import type { TeamMember, TeamMemberRole } from '@/types/core';
import { TEAM_MEMBER_ROLE_LABELS } from '@/types/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Crown,
  Loader2,
  Save,
  ShieldCheck,
  Trash2,
  User,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import { PiUsersThreeDuotone } from 'react-icons/pi';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AddMemberDialog } from '../../src';

const PRESET_COLORS = [
  '#3B82F6',
  '#06B6D4',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#F97316',
  '#14B8A6',
  '#6366F1',
];

export default function HREditTeamPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const teamId = params.id as string;
  const { hasPermission } = usePermissions();
  const { user: currentUser } = useAuth();

  const canManageMembers = hasPermission(HR_PERMISSIONS.TEAMS.MANAGE);

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '',
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Member management state
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newRole, setNewRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER'>(
    'MEMBER'
  );
  const [pinConfirmOpen, setPinConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    'changeRole' | 'removeMember' | null
  >(null);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  // Delete team state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Queries
  const { data: teamData, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['hr-teams', teamId],
    queryFn: () => teamsService.getTeam(teamId),
  });

  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['hr-teams', teamId, 'members'],
    queryFn: () => teamsService.listTeamMembers(teamId, { limit: 100 }),
  });

  const team = teamData?.team;
  const members = membersData?.data ?? [];

  // Derived
  const currentMember = members.find(m => m.userId === currentUser?.id);
  const currentUserTeamRole = currentMember?.role as
    | 'OWNER'
    | 'ADMIN'
    | 'MEMBER'
    | undefined;
  const isCurrentUserOwner = currentUserTeamRole === 'OWNER';

  // Sync form with loaded data
  useEffect(() => {
    if (team) {
      setForm({
        name: team.name,
        description: team.description ?? '',
        color: team.color ?? '',
      });
      setHasChanges(false);
    }
  }, [team]);

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K]
  ) {
    setForm(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }

  // Mutations
  const saveMutation = useMutation({
    mutationFn: () =>
      teamsService.updateTeam(teamId, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        color: form.color.trim() || null,
      }),
    onSuccess: async () => {
      toast.success('Equipe atualizada com sucesso');
      setHasChanges(false);
      await queryClient.invalidateQueries({ queryKey: ['hr-teams'] });
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar equipe');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => teamsService.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Equipe excluída com sucesso');
      router.push('/hr/teams');
    },
    onError: () => toast.error('Erro ao excluir equipe'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      teamsService.removeTeamMember(teamId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['hr-teams', teamId, 'members'],
      });
      queryClient.invalidateQueries({ queryKey: ['hr-teams', teamId] });
      queryClient.invalidateQueries({ queryKey: ['hr-teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Membro removido com sucesso');
    },
    onError: () => toast.error('Erro ao remover membro'),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({
      memberId,
      role,
    }: {
      memberId: string;
      role: 'ADMIN' | 'MEMBER';
    }) => teamsService.changeTeamMemberRole(teamId, memberId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['hr-teams', teamId, 'members'],
      });
      toast.success('Papel alterado com sucesso');
      setChangeRoleOpen(false);
      setSelectedMember(null);
    },
    onError: () => toast.error('Erro ao alterar papel'),
  });

  // Handlers
  const handleSave = () => saveMutation.mutate();

  const handleDeleteTeam = () => {
    deleteMutation.mutate();
    setDeleteConfirmOpen(false);
  };

  const handleRemoveMember = (memberId: string) => {
    setMemberToRemove(memberId);
    setPendingAction('removeMember');
    setPinConfirmOpen(true);
  };

  const handleChangeRole = (member: TeamMember) => {
    setSelectedMember(member);
    setNewRole(member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN');
    setPendingAction('changeRole');
    setPinConfirmOpen(true);
  };

  const handlePinSuccess = () => {
    setPinConfirmOpen(false);
    if (pendingAction === 'removeMember' && memberToRemove) {
      removeMemberMutation.mutate(memberToRemove);
      setMemberToRemove(null);
    }
    if (pendingAction === 'changeRole' && selectedMember) {
      const roleToSet = newRole === 'OWNER' ? 'ADMIN' : newRole;
      changeRoleMutation.mutate({
        memberId: selectedMember.id,
        role: roleToSet as 'ADMIN' | 'MEMBER',
      });
    }
    setPendingAction(null);
  };

  const getRoleBadge = (role: TeamMemberRole) => {
    switch (role) {
      case 'OWNER':
        return (
          <Badge
            variant="default"
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Crown className="w-3 h-3 mr-1" />
            {TEAM_MEMBER_ROLE_LABELS.OWNER}
          </Badge>
        );
      case 'ADMIN':
        return (
          <Badge
            variant="default"
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <ShieldCheck className="w-3 h-3 mr-1" />
            {TEAM_MEMBER_ROLE_LABELS.ADMIN}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <User className="w-3 h-3 mr-1" />
            {TEAM_MEMBER_ROLE_LABELS.MEMBER}
          </Badge>
        );
    }
  };

  // Loading state
  if (isLoadingTeam) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Recursos Humanos', href: '/hr' },
              { label: 'Equipes', href: '/hr/teams' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageBody>
      </PageLayout>
    );
  }

  // Not found state
  if (!team) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Recursos Humanos', href: '/hr' },
              { label: 'Equipes', href: '/hr/teams' },
              { label: 'Não encontrada' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <PiUsersThreeDuotone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Equipe não encontrada
            </h2>
            <p className="text-muted-foreground mb-6">
              A equipe que você está procurando não existe ou foi removida.
            </p>
            <Button onClick={() => router.push('/hr/teams')}>
              Voltar para Equipes
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Recursos Humanos', href: '/hr' },
            { label: 'Equipes', href: '/hr/teams' },
            { label: team.name, href: `/hr/teams/${teamId}` },
            { label: 'Editar' },
          ]}
          buttons={[
            {
              id: 'delete',
              title: 'Excluir',
              icon: Trash2,
              onClick: () => setDeleteConfirmOpen(true),
              variant: 'ghost' as const,
            },
            {
              id: 'save',
              title: 'Salvar',
              icon: Save,
              onClick: handleSave,
              disabled: !hasChanges || saveMutation.isPending,
            },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-5">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-xl shrink-0 ${
                !form.color ? 'bg-linear-to-br from-blue-500 to-cyan-600' : ''
              }`}
              style={
                form.color
                  ? {
                      background: `linear-gradient(to bottom right, ${form.color}, ${form.color}CC)`,
                    }
                  : undefined
              }
            >
              <PiUsersThreeDuotone className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
              <p className="text-sm font-mono text-muted-foreground mt-0.5">
                {team.slug}
              </p>
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        <div className="flex flex-col gap-4">
          {/* Form Card */}
          <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg uppercase font-semibold flex items-center gap-2 mb-4">
              Informações da Equipe
            </h3>

            <div className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="edit-team-name">Nome *</Label>
                <Input
                  id="edit-team-name"
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="Nome da equipe"
                />
              </div>

              {/* Descricao */}
              <div className="space-y-2">
                <Label htmlFor="edit-team-description">Descrição</Label>
                <Textarea
                  id="edit-team-description"
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder="Descreva a equipe..."
                  rows={3}
                />
              </div>

              {/* Cor */}
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className="w-8 h-8 rounded-full border-2 transition-all cursor-pointer"
                      style={{
                        backgroundColor: color,
                        borderColor:
                          form.color === color ? 'white' : 'transparent',
                        boxShadow:
                          form.color === color ? `0 0 0 2px ${color}` : 'none',
                      }}
                      onClick={() =>
                        updateField('color', form.color === color ? '' : color)
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Members Card */}
          <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg uppercase font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Membros
                <Badge variant="secondary" className="ml-2">
                  {team.membersCount}
                </Badge>
              </h3>
              {canManageMembers && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddMemberOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Membro
                </Button>
              )}
            </div>

            {isLoadingMembers ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Nenhum membro encontrado.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        name={member.userName}
                        email={member.userEmail}
                        avatarUrl={member.userAvatarUrl}
                        size="md"
                      />
                      <div>
                        <p className="font-medium">
                          {member.userName || member.userEmail || 'Sem nome'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.userEmail ?? member.userId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(member.role)}
                      {canManageMembers && member.role !== 'OWNER' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleChangeRole(member)}
                            title="Alterar papel"
                          >
                            <ShieldCheck className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:text-rose-500"
                            onClick={() => handleRemoveMember(member.id)}
                            title="Remover membro"
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </PageBody>

      {/* Add Member Dialog */}
      <AddMemberDialog
        teamId={teamId}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
      />

      {/* PIN Confirm for member actions */}
      <VerifyActionPinModal
        isOpen={pinConfirmOpen}
        onClose={() => {
          setPinConfirmOpen(false);
          setPendingAction(null);
          setMemberToRemove(null);
          setSelectedMember(null);
        }}
        onSuccess={handlePinSuccess}
        title={
          pendingAction === 'removeMember' ? 'Remover Membro' : 'Alterar Papel'
        }
        description={
          pendingAction === 'removeMember'
            ? 'Digite seu PIN de ação para confirmar a remoção do membro.'
            : `Digite seu PIN de ação para alterar o papel para ${
                newRole === 'ADMIN' ? 'Administrador' : 'Membro'
              }.`
        }
      />

      {/* Delete Team Confirm */}
      <VerifyActionPinModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onSuccess={handleDeleteTeam}
        title="Excluir Equipe"
        description={`Tem certeza que deseja excluir a equipe "${team.name}"? Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
