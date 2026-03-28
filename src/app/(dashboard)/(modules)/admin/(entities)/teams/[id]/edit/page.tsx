/**
 * OpenSea OS - Team Edit Page
 * Página completa de edição e gerenciamento de equipe:
 * informações, membros, e-mails, calendários e quadros
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { UserAvatar } from '@/components/shared/user-avatar';
import { ADMIN_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { teamsService } from '@/services/core/teams.service';
import type {
  Team,
  TeamEmailAccount,
  TeamMember,
  TeamMemberRole,
} from '@/types/core';
import { TEAM_MEMBER_ROLE_LABELS } from '@/types/core';
import type { Calendar as CalendarModel } from '@/types/calendar';
import { TeamCalendarPermissionsDialog } from '@/components/calendar';
import {
  useMyCalendars,
  useCreateTeamCalendar,
  useDeleteCalendar,
  useUpdateCalendar,
} from '@/hooks/calendar';
import { boardsService } from '@/services/tasks/boards-service';
import { useDeleteBoard } from '@/hooks/tasks/use-boards';
import { BoardCreateDialog } from '@/components/tasks/boards/board-create-dialog';
import { BoardSettingsDialog } from '@/components/tasks/boards/board-settings-dialog';
import { BoardMembersDialog } from '@/components/tasks/boards/board-members-dialog';
import type { Board } from '@/types/tasks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  Crown,
  KanbanSquare,
  Link2,
  Link2Off,
  Loader2,
  Mail,
  Pencil,
  Save,
  Settings,
  Shield,
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
import {
  AddMemberDialog,
  EmailPermissionsDialog,
  LinkEmailDialog,
} from '../../src';

export default function EditTeamPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const teamId = params.id as string;
  const { hasPermission } = usePermissions();
  const { user: currentUser } = useAuth();

  // Permissions
  const canManageMembers = hasPermission(ADMIN_PERMISSIONS.USERS.ADMIN);
  const canReadEmails = hasPermission(ADMIN_PERMISSIONS.USERS.ADMIN);
  const canLinkEmails = hasPermission(ADMIN_PERMISSIONS.USERS.ADMIN);
  const canManageEmails = hasPermission(ADMIN_PERMISSIONS.USERS.ADMIN);
  const canUnlinkEmails = hasPermission(ADMIN_PERMISSIONS.USERS.ADMIN);

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

  // Email state
  const [linkEmailOpen, setLinkEmailOpen] = useState(false);
  const [editEmailPermsOpen, setEditEmailPermsOpen] = useState(false);
  const [selectedTeamEmail, setSelectedTeamEmail] =
    useState<TeamEmailAccount | null>(null);

  // Calendar state
  const [calendarPermsOpen, setCalendarPermsOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] =
    useState<CalendarModel | null>(null);
  const [renameCalendar, setRenameCalendar] = useState<CalendarModel | null>(
    null
  );
  const [renameValue, setRenameValue] = useState('');
  const [deleteCalendarConfirm, setDeleteCalendarConfirm] =
    useState<CalendarModel | null>(null);
  const [createCalendarOpen, setCreateCalendarOpen] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');

  // Board state
  const [createBoardOpen, setCreateBoardOpen] = useState(false);
  const [settingsBoardId, setSettingsBoardId] = useState<string | null>(null);
  const [membersBoardId, setMembersBoardId] = useState<string | null>(null);
  const [deleteBoardConfirm, setDeleteBoardConfirm] = useState<Board | null>(
    null
  );

  // ─── Queries ──────────────────────────────────────────────────────────

  const { data: teamData, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['teams', teamId],
    queryFn: () => teamsService.getTeam(teamId),
  });

  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['teams', teamId, 'members'],
    queryFn: () => teamsService.listTeamMembers(teamId, { limit: 100 }),
  });

  const team = teamData?.team;
  const members = membersData?.data ?? [];

  const { data: teamEmailsData, isLoading: isLoadingTeamEmails } = useQuery({
    queryKey: ['teams', teamId, 'emails'],
    queryFn: () => teamsService.listTeamEmails(teamId),
    enabled: canReadEmails,
  });

  const teamEmails = teamEmailsData?.emailAccounts ?? [];

  const { data: calendarsData, isLoading: isLoadingCalendars } =
    useMyCalendars();
  const teamCalendars = (calendarsData?.calendars ?? []).filter(
    c => c.type === 'TEAM' && c.ownerId === teamId
  );
  const createTeamCalendar = useCreateTeamCalendar();
  const deleteCalendar = useDeleteCalendar();
  const updateCalendar = useUpdateCalendar();

  const { data: boardsData, isLoading: isLoadingBoards } = useQuery({
    queryKey: ['task-boards', { teamId, type: 'TEAM' }],
    queryFn: () => boardsService.list({ teamId, type: 'TEAM', limit: 100 }),
  });
  const teamBoards = boardsData?.boards ?? [];
  const deleteBoard = useDeleteBoard();

  // Derived
  const currentMember = members.find(m => m.userId === currentUser?.id);
  const currentUserTeamRole = currentMember?.role as
    | 'OWNER'
    | 'ADMIN'
    | 'MEMBER'
    | undefined;
  const isCurrentUserOwner = currentUserTeamRole === 'OWNER';
  const canManageTeamCalendars =
    currentUserTeamRole === 'OWNER' || currentUserTeamRole === 'ADMIN';

  // ─── Sync form with loaded data ──────────────────────────────────────

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

  // ─── Mutations ────────────────────────────────────────────────────────

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
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar equipe');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => teamsService.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Equipe excluída com sucesso');
      router.push('/admin/teams');
    },
    onError: () => toast.error('Erro ao excluir equipe'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      teamsService.removeTeamMember(teamId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
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
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
      toast.success('Papel alterado com sucesso');
      setChangeRoleOpen(false);
      setSelectedMember(null);
    },
    onError: () => toast.error('Erro ao alterar papel'),
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: (userId: string) =>
      teamsService.transferOwnership(teamId, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      toast.success('Propriedade transferida com sucesso');
      setChangeRoleOpen(false);
      setSelectedMember(null);
    },
    onError: () => toast.error('Erro ao transferir propriedade'),
  });

  const unlinkEmailMutation = useMutation({
    mutationFn: (accountId: string) =>
      teamsService.unlinkEmailFromTeam(teamId, accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'emails'] });
      toast.success('Conta de e-mail desvinculada com sucesso');
    },
    onError: () => toast.error('Erro ao desvincular conta de e-mail'),
  });

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleDeleteConfirm = () => {
    deleteMutation.mutate();
    setDeleteConfirmOpen(false);
  };

  const handleChangeRole = (member: TeamMember) => {
    setSelectedMember(member);
    setNewRole(member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN');
    setChangeRoleOpen(true);
  };

  const handleConfirmChangeRole = () => {
    setChangeRoleOpen(false);
    setPendingAction('changeRole');
    setPinConfirmOpen(true);
  };

  const handleRequestRemoveMember = (memberId: string) => {
    setMemberToRemove(memberId);
    setPendingAction('removeMember');
    setPinConfirmOpen(true);
  };

  const handlePinSuccess = () => {
    if (pendingAction === 'changeRole' && selectedMember) {
      if (newRole === 'OWNER') {
        transferOwnershipMutation.mutate(selectedMember.userId);
      } else {
        changeRoleMutation.mutate({
          memberId: selectedMember.id,
          role: newRole,
        });
      }
    } else if (pendingAction === 'removeMember' && memberToRemove) {
      removeMemberMutation.mutate(memberToRemove);
    }
    setPendingAction(null);
    setMemberToRemove(null);
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

  // ─── Loading state ────────────────────────────────────────────────────

  if (isLoadingTeam) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Administração', href: '/admin' },
              { label: 'Equipes', href: '/admin/teams' },
              { label: '...' },
              { label: 'Editar' },
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

  // ─── Not found state ──────────────────────────────────────────────────

  if (!team) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Administração', href: '/admin' },
              { label: 'Equipes', href: '/admin/teams' },
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
            <Button onClick={() => router.push('/admin/teams')}>
              Voltar para Equipes
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Administração', href: '/admin' },
            { label: 'Equipes', href: '/admin/teams' },
            { label: team.name, href: `/admin/teams/${teamId}` },
            { label: 'Editar' },
          ]}
          buttons={[
            {
              id: 'delete',
              title: 'Excluir',
              icon: Trash2,
              onClick: () => setDeleteConfirmOpen(true),
              className:
                'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
            },
            {
              id: 'save',
              title: saveMutation.isPending ? 'Salvando...' : 'Salvar',
              icon: saveMutation.isPending ? Loader2 : Save,
              onClick: () => saveMutation.mutate(),
              disabled:
                !hasChanges || !form.name.trim() || saveMutation.isPending,
            },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-5">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-xl shrink-0 ${
                !team.color ? 'bg-linear-to-br from-blue-500 to-cyan-600' : ''
              }`}
              style={
                team.color
                  ? {
                      background: `linear-gradient(to bottom right, ${team.color}, ${team.color}CC)`,
                    }
                  : undefined
              }
            >
              <PiUsersThreeDuotone className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando equipe</p>
              <h1 className="text-2xl font-bold tracking-tight">
                {team.name}
              </h1>
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        <div className="flex flex-col gap-4">
          {/* ─── Informações Card ─────────────────────────────────────── */}
          <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg uppercase font-semibold flex items-center gap-2 mb-4">
              <PiUsersThreeDuotone className="h-5 w-5" />
              Informações
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Row 1: Nome + Cor */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="Nome da equipe"
                  maxLength={128}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Cor</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={form.color || '#3b82f6'}
                    onChange={e => updateField('color', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    id="color"
                    value={form.color}
                    onChange={e => updateField('color', e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Row 2: Descrição */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder="Descrição da equipe"
                  rows={3}
                  maxLength={2000}
                />
              </div>
            </div>
          </Card>

          {/* ─── Members Card ─────────────────────────────────────────── */}
          <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg uppercase font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Membros
                <Badge variant="secondary" className="ml-2">
                  {members.length}
                </Badge>
              </h3>
              {canManageMembers && (
                <Button size="sm" onClick={() => setAddMemberOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
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
                      {canManageMembers &&
                        member.role !== 'OWNER' &&
                        (isCurrentUserOwner || member.role === 'MEMBER') && (
                          <>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleChangeRole(member)}
                                  >
                                    <Shield className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Alterar papel</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      handleRequestRemoveMember(member.id)
                                    }
                                  >
                                    <UserMinus className="w-4 h-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Remover membro
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ─── Email Accounts Card ──────────────────────────────────── */}
          {canReadEmails && (
            <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg uppercase font-semibold flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contas de E-mail
                  <Badge variant="secondary" className="ml-2">
                    {teamEmails.length}
                  </Badge>
                </h3>
                {canLinkEmails && (
                  <Button size="sm" onClick={() => setLinkEmailOpen(true)}>
                    <Link2 className="w-4 h-4 mr-2" />
                    Vincular E-mail
                  </Button>
                )}
              </div>

              {isLoadingTeamEmails ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : teamEmails.length === 0 ? (
                <div className="py-8 text-center">
                  <Mail className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Nenhuma conta de e-mail vinculada.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {teamEmails.map(te => (
                    <div
                      key={te.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                          <Mail className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {te.accountAddress ?? te.accountId}
                          </p>
                          {te.accountDisplayName && (
                            <p className="text-sm text-muted-foreground">
                              {te.accountDisplayName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {canManageEmails && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedTeamEmail(te);
                                    setEditEmailPermsOpen(true);
                                  }}
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Editar permissões
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {canUnlinkEmails && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    unlinkEmailMutation.mutate(te.accountId)
                                  }
                                  disabled={unlinkEmailMutation.isPending}
                                >
                                  <Link2Off className="w-4 h-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Desvincular</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* ─── Calendars Card ───────────────────────────────────────── */}
          <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg uppercase font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendários da Equipe
                <Badge variant="secondary" className="ml-2">
                  {teamCalendars.length}
                </Badge>
              </h3>
              {canManageTeamCalendars && (
                <Button
                  size="sm"
                  onClick={() => {
                    setNewCalendarName('');
                    setCreateCalendarOpen(true);
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Novo Calendário
                </Button>
              )}
            </div>

            {isLoadingCalendars ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : teamCalendars.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Nenhum calendário de equipe criado.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamCalendars.map(cal => (
                  <div
                    key={cal.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{
                          background: team.color
                            ? `${team.color}18`
                            : 'rgb(59 130 246 / 0.1)',
                        }}
                      >
                        <Calendar
                          className="h-4 w-4"
                          style={{
                            color: team.color || 'rgb(59 130 246)',
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{cal.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {(cal.access?.canManage ?? canManageTeamCalendars) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setRenameCalendar(cal);
                                  setRenameValue(cal.name);
                                }}
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Configurações</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {(cal.access?.canManage ?? canManageTeamCalendars) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedCalendar(cal);
                                  setCalendarPermsOpen(true);
                                }}
                              >
                                <Users className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Permissões</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {(cal.access?.canDelete ?? isCurrentUserOwner) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteCalendarConfirm(cal)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ─── Boards Card ──────────────────────────────────────────── */}
          <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg uppercase font-semibold flex items-center gap-2">
                <KanbanSquare className="h-5 w-5" />
                Quadros da Equipe
                <Badge variant="secondary" className="ml-2">
                  {teamBoards.length}
                </Badge>
              </h3>
              {canManageTeamCalendars && (
                <Button size="sm" onClick={() => setCreateBoardOpen(true)}>
                  <KanbanSquare className="w-4 h-4 mr-2" />
                  Novo Quadro
                </Button>
              )}
            </div>

            {isLoadingBoards ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : teamBoards.length === 0 ? (
              <div className="py-8 text-center">
                <KanbanSquare className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Nenhum quadro de equipe criado.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {teamBoards.map(board => (
                  <div
                    key={board.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/tasks/${board.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{
                          background: team.color
                            ? `${team.color}18`
                            : 'rgb(59 130 246 / 0.1)',
                        }}
                      >
                        <KanbanSquare
                          className="h-4 w-4"
                          style={{
                            color: team.color || 'rgb(59 130 246)',
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{board.title}</p>
                        {board.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {board.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {board.archivedAt && (
                        <Badge variant="secondary" className="mr-2">
                          Arquivado
                        </Badge>
                      )}
                      {(isCurrentUserOwner || canManageTeamCalendars) && (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setSettingsBoardId(board.id);
                                  }}
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Configurações</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setMembersBoardId(board.id);
                                  }}
                                >
                                  <Users className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Permissões</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setDeleteBoardConfirm(board);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Excluir</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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

      {/* ─── Modals ────────────────────────────────────────────────────── */}

      {/* CHANGE ROLE / TRANSFER OWNERSHIP MODAL */}
      <Dialog open={changeRoleOpen} onOpenChange={setChangeRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Papel do Membro</DialogTitle>
            <DialogDescription>
              Altere o papel de {selectedMember?.userName ?? 'membro'} na equipe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Novo papel</Label>
              <Select
                value={newRole}
                onValueChange={v =>
                  setNewRole(v as 'OWNER' | 'ADMIN' | 'MEMBER')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Membro</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  {isCurrentUserOwner && (
                    <SelectItem value="OWNER">
                      Proprietário (Transferir Propriedade)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            {newRole === 'OWNER' && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    Atenção: Transferência de propriedade
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Ao transferir a propriedade, você será rebaixado para
                    Administrador e{' '}
                    <span className="font-medium">
                      {selectedMember?.userName ?? 'este membro'}
                    </span>{' '}
                    se tornará o novo proprietário da equipe. Esta ação requer
                    confirmação por PIN.
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRoleOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmChangeRole}
              variant={newRole === 'OWNER' ? 'destructive' : 'default'}
            >
              {newRole === 'OWNER' ? 'Transferir Propriedade' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD MEMBER DIALOG */}
      <AddMemberDialog
        teamId={teamId}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
      />

      {/* DELETE TEAM CONFIRM */}
      <VerifyActionPinModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Equipe"
        description={`Tem certeza que deseja excluir a equipe "${team.name}"? Esta ação não pode ser desfeita.`}
      />

      {/* PIN CONFIRM for role change / transfer ownership / remove member */}
      <VerifyActionPinModal
        isOpen={pinConfirmOpen}
        onClose={() => {
          setPinConfirmOpen(false);
          setPendingAction(null);
          setMemberToRemove(null);
        }}
        onSuccess={handlePinSuccess}
        title={
          pendingAction === 'changeRole' && newRole === 'OWNER'
            ? 'Confirmar Transferência de Propriedade'
            : pendingAction === 'removeMember'
              ? 'Confirmar Remoção de Membro'
              : 'Confirmar Alteração de Papel'
        }
        description={
          pendingAction === 'changeRole' && newRole === 'OWNER'
            ? `Digite seu PIN de ação para transferir a propriedade da equipe para ${selectedMember?.userName ?? 'este membro'}.`
            : pendingAction === 'removeMember'
              ? 'Digite seu PIN de ação para remover este membro da equipe.'
              : `Digite seu PIN de ação para alterar o papel de ${selectedMember?.userName ?? 'membro'}.`
        }
      />

      {/* LINK EMAIL DIALOG */}
      <LinkEmailDialog
        teamId={teamId}
        open={linkEmailOpen}
        onOpenChange={setLinkEmailOpen}
      />

      {/* EMAIL PERMISSIONS DIALOG */}
      <EmailPermissionsDialog
        teamId={teamId}
        teamEmail={selectedTeamEmail}
        open={editEmailPermsOpen}
        onOpenChange={setEditEmailPermsOpen}
      />

      {/* RENAME CALENDAR DIALOG */}
      {(() => {
        const editAccent = team.color || '#3b82f6';
        return (
          <Dialog
            open={!!renameCalendar}
            onOpenChange={open => {
              if (!open) setRenameCalendar(null);
            }}
          >
            <DialogContent className="sm:max-w-[440px] p-0">
              <div
                className="h-1.5 w-full rounded-t-lg transition-colors"
                style={{
                  background: `linear-gradient(to right, ${editAccent}, ${editAccent}80)`,
                }}
              />

              <div className="px-6 pt-4 pb-2">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2.5">
                    <div
                      className="p-2 rounded-lg transition-colors"
                      style={{ background: `${editAccent}18` }}
                    >
                      <Pencil
                        className="w-4 h-4"
                        style={{ color: editAccent }}
                      />
                    </div>
                    Renomear Calendário
                  </DialogTitle>
                  <DialogDescription>
                    Altere o nome do calendário da equipe. A cor é herdada da
                    equipe.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 pb-2">
                <Label
                  htmlFor="calendar-name"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Nome
                </Label>
                <Input
                  id="calendar-name"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  placeholder="Nome do calendário"
                  className="mt-1.5"
                  style={{ borderColor: `${editAccent}50` }}
                />
              </div>

              <DialogFooter className="px-6 pb-5 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setRenameCalendar(null)}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={!renameValue.trim() || updateCalendar.isPending}
                  style={{ background: editAccent }}
                  className="hover:opacity-90 text-white"
                  onClick={() => {
                    if (!renameCalendar) return;
                    updateCalendar.mutate(
                      {
                        id: renameCalendar.id,
                        data: { name: renameValue.trim() },
                      },
                      {
                        onSuccess: () => {
                          toast.success('Calendário renomeado com sucesso');
                          setRenameCalendar(null);
                        },
                        onError: err =>
                          toast.error(
                            err instanceof Error
                              ? err.message
                              : 'Erro ao renomear calendário'
                          ),
                      }
                    );
                  }}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* DELETE CALENDAR CONFIRM DIALOG */}
      <VerifyActionPinModal
        isOpen={!!deleteCalendarConfirm}
        onClose={() => setDeleteCalendarConfirm(null)}
        onSuccess={() => {
          if (!deleteCalendarConfirm) return;
          deleteCalendar.mutate(deleteCalendarConfirm.id, {
            onSuccess: () => {
              toast.success('Calendário excluído com sucesso');
              setDeleteCalendarConfirm(null);
            },
            onError: err =>
              toast.error(
                err instanceof Error
                  ? err.message
                  : 'Erro ao excluir calendário'
              ),
          });
        }}
        title="Excluir Calendário"
        description={`Tem certeza que deseja excluir o calendário "${deleteCalendarConfirm?.name}"? Todos os eventos associados serão removidos. Esta ação não pode ser desfeita.`}
      />

      {/* CREATE CALENDAR DIALOG */}
      <Dialog open={createCalendarOpen} onOpenChange={setCreateCalendarOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div
                className="p-2 rounded-lg"
                style={{
                  background: team.color
                    ? `${team.color}18`
                    : 'rgb(59 130 246 / 0.1)',
                }}
              >
                <Calendar
                  className="w-4 h-4"
                  style={{ color: team.color || 'rgb(59 130 246)' }}
                />
              </div>
              Novo Calendário
            </DialogTitle>
            <DialogDescription>
              Crie um novo calendário para a equipe. Se não preencher o nome,
              será usado o nome padrão.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-calendar-name">Nome</Label>
            <Input
              id="new-calendar-name"
              value={newCalendarName}
              onChange={e => setNewCalendarName(e.target.value)}
              placeholder={`Calendário de ${team.name}`}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateCalendarOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              disabled={createTeamCalendar.isPending}
              onClick={() => {
                const name =
                  newCalendarName.trim() || `Calendário de ${team.name}`;
                createTeamCalendar.mutate(
                  { teamId, name },
                  {
                    onSuccess: () => {
                      toast.success('Calendário criado com sucesso');
                      setCreateCalendarOpen(false);
                    },
                    onError: err =>
                      toast.error(
                        err instanceof Error
                          ? err.message
                          : 'Erro ao criar calendário'
                      ),
                  }
                );
              }}
            >
              Criar Calendário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE BOARD DIALOG */}
      <BoardCreateDialog
        open={createBoardOpen}
        onOpenChange={setCreateBoardOpen}
        teamId={teamId}
      />

      {/* BOARD SETTINGS DIALOG */}
      {settingsBoardId && (
        <BoardSettingsDialog
          open={!!settingsBoardId}
          onOpenChange={open => {
            if (!open) setSettingsBoardId(null);
          }}
          boardId={settingsBoardId}
        />
      )}

      {/* BOARD MEMBERS DIALOG */}
      {membersBoardId && (
        <BoardMembersDialog
          open={!!membersBoardId}
          onOpenChange={open => {
            if (!open) setMembersBoardId(null);
          }}
          boardId={membersBoardId}
        />
      )}

      {/* DELETE BOARD CONFIRM */}
      <VerifyActionPinModal
        isOpen={!!deleteBoardConfirm}
        onClose={() => setDeleteBoardConfirm(null)}
        onSuccess={() => {
          if (!deleteBoardConfirm) return;
          deleteBoard.mutate(deleteBoardConfirm.id, {
            onSuccess: () => {
              toast.success('Quadro excluído com sucesso');
              setDeleteBoardConfirm(null);
            },
            onError: err =>
              toast.error(
                err instanceof Error
                  ? err.message
                  : 'Erro ao excluir quadro'
              ),
          });
        }}
        title="Excluir Quadro"
        description={`Tem certeza que deseja excluir o quadro "${deleteBoardConfirm?.title}"? Todos os cards e dados serão removidos permanentemente.`}
      />

      {/* CALENDAR PERMISSIONS DIALOG */}
      <TeamCalendarPermissionsDialog
        calendar={selectedCalendar}
        open={calendarPermsOpen}
        onOpenChange={setCalendarPermsOpen}
        userTeamRole={currentUserTeamRole}
        teamColor={team.color}
      />
    </PageLayout>
  );
}
