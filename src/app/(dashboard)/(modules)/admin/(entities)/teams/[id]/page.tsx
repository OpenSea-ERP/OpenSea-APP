/**
 * OpenSea OS - Team Detail Page
 * Página de detalhes de uma equipe: informações, membros e ações
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { UserAvatar } from '@/components/shared/user-avatar';
import { CORE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/contexts/auth-context';
import { InfoField } from '@/components/shared/info-field';
import { toast } from 'sonner';
import { teamsService } from '@/services/core/teams.service';
import type { Team, TeamEmailAccount, TeamMember, TeamMemberRole } from '@/types/core';
import { TEAM_MEMBER_ROLE_LABELS } from '@/types/core';
import type { Calendar as CalendarModel } from '@/types/calendar';
import { CalendarBadge, TeamCalendarPermissionsDialog } from '@/components/calendar';
import { useMyCalendars, useCreateTeamCalendar, useDeleteCalendar, useUpdateCalendar } from '@/hooks/calendar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Copy,
  Crown,
  Edit,
  FileText,
  Pencil,
  Link2,
  Link2Off,
  Mail,
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
import { useState } from 'react';
import { AddMemberDialog, EmailPermissionsDialog, LinkEmailDialog } from '../src';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const teamId = params.id as string;
  const { hasPermission } = usePermissions();
  const { user: currentUser } = useAuth();

  const canEdit = hasPermission(CORE_PERMISSIONS.TEAMS.UPDATE);
  const canDelete = hasPermission(CORE_PERMISSIONS.TEAMS.DELETE);
  const canManageMembers = hasPermission(CORE_PERMISSIONS.TEAMS.MEMBERS.ADD);
  const canReadEmails = hasPermission(CORE_PERMISSIONS.TEAMS.EMAILS.READ);
  const canLinkEmails = hasPermission(CORE_PERMISSIONS.TEAMS.EMAILS.LINK);
  const canManageEmails = hasPermission(CORE_PERMISSIONS.TEAMS.EMAILS.MANAGE);
  const canUnlinkEmails = hasPermission(CORE_PERMISSIONS.TEAMS.EMAILS.UNLINK);

  // State
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newRole, setNewRole] = useState<'OWNER' | 'ADMIN' | 'MEMBER'>('MEMBER');
  const [pinConfirmOpen, setPinConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'changeRole' | 'removeMember' | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [slugCopied, setSlugCopied] = useState(false);
  const [linkEmailOpen, setLinkEmailOpen] = useState(false);
  const [editEmailPermsOpen, setEditEmailPermsOpen] = useState(false);
  const [selectedTeamEmail, setSelectedTeamEmail] = useState<TeamEmailAccount | null>(null);
  const [calendarPermsOpen, setCalendarPermsOpen] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarModel | null>(null);
  const [renameCalendar, setRenameCalendar] = useState<CalendarModel | null>(null);
  const [renameValue, setRenameValue] = useState('');
  // renameColor removed — team calendars inherit the team's color
  const [deleteCalendarConfirm, setDeleteCalendarConfirm] = useState<CalendarModel | null>(null);


  // Queries
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

  const { data: calendarsData, isLoading: isLoadingCalendars } = useMyCalendars();
  const teamCalendars = (calendarsData?.calendars ?? []).filter(
    (c) => c.type === 'TEAM' && c.ownerId === teamId,
  );
  const createTeamCalendar = useCreateTeamCalendar();
  const deleteCalendar = useDeleteCalendar();
  const updateCalendar = useUpdateCalendar();

  const currentMember = members.find(m => m.userId === currentUser?.id);
  const currentUserTeamRole = currentMember?.role as 'OWNER' | 'ADMIN' | 'MEMBER' | undefined;
  const isCurrentUserOwner = currentUserTeamRole === 'OWNER';
  const canManageTeamCalendars = currentUserTeamRole === 'OWNER' || currentUserTeamRole === 'ADMIN';

  // Mutations
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
    mutationFn: (memberId: string) => teamsService.removeTeamMember(teamId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['teams', teamId] });
      toast.success('Membro removido com sucesso');
    },
    onError: () => toast.error('Erro ao remover membro'),
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: 'ADMIN' | 'MEMBER' }) =>
      teamsService.changeTeamMemberRole(teamId, memberId, { role }),
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

  // Handlers
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
    // Close the role dialog, open PIN confirmation
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

  const handleCopySlug = async (slug: string) => {
    await navigator.clipboard.writeText(slug);
    setSlugCopied(true);
    setTimeout(() => setSlugCopied(false), 2000);
  };

  const getRoleBadge = (role: TeamMemberRole) => {
    switch (role) {
      case 'OWNER':
        return (
          <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white">
            <Crown className="w-3 h-3 mr-1" />
            {TEAM_MEMBER_ROLE_LABELS.OWNER}
          </Badge>
        );
      case 'ADMIN':
        return (
          <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white">
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
              { label: 'Administração', href: '/admin' },
              { label: 'Equipes', href: '/admin/teams' },
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

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Administração', href: '/admin' },
            { label: 'Equipes', href: '/admin/teams' },
            { label: team.name },
          ]}
          buttons={[
            ...(canDelete
              ? [
                  {
                    id: 'delete',
                    title: 'Excluir',
                    icon: Trash2,
                    onClick: () => setDeleteConfirmOpen(true),
                    variant: 'ghost' as const,
                  },
                ]
              : []),
            ...(canEdit
              ? [
                  {
                    id: 'edit',
                    title: 'Editar',
                    icon: Edit,
                    onClick: () => router.push(`/admin/teams/${teamId}/edit`),
                  },
                ]
              : []),
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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{team.name}</h1>
                <Badge variant={team.isActive ? 'default' : 'secondary'}>
                  {team.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-mono text-muted-foreground">
                  {team.slug}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopySlug(team.slug)}
                      >
                        {slugCopied ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {slugCopied ? 'Copiado!' : 'Copiar slug'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {team.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>
                    {new Date(team.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {team.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    {new Date(team.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        <div className="flex flex-col gap-4">
          {/* Description Card */}
          <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg uppercase font-semibold flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" />
              Informações
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <InfoField
                  label="Descrição"
                  value={team.description}
                  emptyText="Sem descrição"
                />
              </div>
              <InfoField
                label="Cor"
                value={team.color}
                icon={
                  team.color ? (
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: team.color }}
                    />
                  ) : undefined
                }
                emptyText="Sem cor"
              />
              <InfoField
                label="Criado por"
                value={team.creatorName ?? team.createdBy}
              />
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
                <p className="text-muted-foreground">Nenhum membro encontrado.</p>
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
                      {canManageMembers && member.role !== 'OWNER' && (isCurrentUserOwner || member.role === 'MEMBER') && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleChangeRole(member)}
                            title="Alterar papel"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRequestRemoveMember(member.id)}
                            title="Remover membro"
                          >
                            <UserMinus className="w-4 h-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Team Emails Card */}
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
                              <TooltipContent>Editar permissões</TooltipContent>
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
                                  onClick={() => unlinkEmailMutation.mutate(te.accountId)}
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

          {/* Team Calendars Card */}
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
                    createTeamCalendar.mutate(
                      { teamId, name: `Calendário de ${team.name}` },
                      {
                        onSuccess: () => toast.success('Calendário criado com sucesso'),
                        onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar calendário'),
                      },
                    );
                  }}
                  disabled={createTeamCalendar.isPending}
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
                    <CalendarBadge name={cal.name} type={cal.type} color={team.color} />
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
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
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
                                <Settings className="w-4 h-4" />
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
        </div>
      </PageBody>

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
                onValueChange={v => setNewRole(v as 'OWNER' | 'ADMIN' | 'MEMBER')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Membro</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  {isCurrentUserOwner && (
                    <SelectItem value="OWNER">Proprietário (Transferir Propriedade)</SelectItem>
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
                    Ao transferir a propriedade, você será rebaixado para Administrador e{' '}
                    <span className="font-medium">{selectedMember?.userName ?? 'este membro'}</span>{' '}
                    se tornará o novo proprietário da equipe. Esta ação requer confirmação por PIN.
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

      {/* DELETE CONFIRM */}
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

      {/* EDIT CALENDAR DIALOG (name only — color inherited from team) */}
      {(() => {
        const editAccent = team.color || '#3b82f6';
        return (
          <Dialog open={!!renameCalendar} onOpenChange={(open) => { if (!open) setRenameCalendar(null); }}>
            <DialogContent className="sm:max-w-[440px] p-0">
              {/* Accent bar */}
              <div
                className="h-1.5 w-full rounded-t-lg transition-colors"
                style={{ background: `linear-gradient(to right, ${editAccent}, ${editAccent}80)` }}
              />

              <div className="px-6 pt-4 pb-2">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2.5">
                    <div
                      className="p-2 rounded-lg transition-colors"
                      style={{ background: `${editAccent}18` }}
                    >
                      <Pencil className="w-4 h-4" style={{ color: editAccent }} />
                    </div>
                    Renomear Calendário
                  </DialogTitle>
                  <DialogDescription>
                    Altere o nome do calendário da equipe. A cor é herdada da equipe.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="px-6 pb-2">
                <Label htmlFor="calendar-name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Nome
                </Label>
                <Input
                  id="calendar-name"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder="Nome do calendário"
                  className="mt-1.5"
                  style={{ borderColor: `${editAccent}50` }}
                />
              </div>

              <DialogFooter className="px-6 pb-5 pt-3">
                <Button variant="outline" onClick={() => setRenameCalendar(null)}>
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
                        onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao renomear calendário'),
                      },
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
      <Dialog open={!!deleteCalendarConfirm} onOpenChange={(open) => { if (!open) setDeleteCalendarConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Calendário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o calendário &quot;{deleteCalendarConfirm?.name}&quot;?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Todos os eventos associados a este calendário serão removidos. Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCalendarConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteCalendar.isPending}
              onClick={() => {
                if (!deleteCalendarConfirm) return;
                deleteCalendar.mutate(deleteCalendarConfirm.id, {
                  onSuccess: () => {
                    toast.success('Calendário excluído com sucesso');
                    setDeleteCalendarConfirm(null);
                  },
                  onError: (err) => toast.error(err instanceof Error ? err.message : 'Erro ao excluir calendário'),
                });
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
