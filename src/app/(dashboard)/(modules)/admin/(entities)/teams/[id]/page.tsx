/**
 * OpenSea OS - Team Detail Page (Read-Only View)
 * Página de visualização de uma equipe: informações, membros, e-mails, calendários e quadros
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
import { Skeleton } from '@/components/ui/skeleton';
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
import { InfoField } from '@/components/shared/info-field';
import { toast } from 'sonner';
import { teamsService } from '@/services/core/teams.service';
import type { Team, TeamMember, TeamMemberRole } from '@/types/core';
import { TEAM_MEMBER_ROLE_LABELS } from '@/types/core';
import { useMyCalendars } from '@/hooks/calendar';
import { boardsService } from '@/services/tasks/boards-service';
import type { Board } from '@/types/tasks';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Crown,
  Edit,
  FileText,
  KanbanSquare,
  Mail,
  ShieldCheck,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { PiUsersThreeDuotone } from 'react-icons/pi';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const teamId = params.id as string;
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission(ADMIN_PERMISSIONS.USERS.ADMIN);
  const canDelete = hasPermission(ADMIN_PERMISSIONS.USERS.ADMIN);
  const canReadEmails = hasPermission(ADMIN_PERMISSIONS.USERS.ADMIN);

  // State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [slugCopied, setSlugCopied] = useState(false);

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

  const { data: calendarsData, isLoading: isLoadingCalendars } =
    useMyCalendars();
  const teamCalendars = (calendarsData?.calendars ?? []).filter(
    c => c.type === 'TEAM' && c.ownerId === teamId
  );

  // Team Boards
  const { data: boardsData, isLoading: isLoadingBoards } = useQuery({
    queryKey: ['task-boards', { teamId, type: 'TEAM' }],
    queryFn: () => boardsService.list({ teamId, type: 'TEAM', limit: 100 }),
  });
  const teamBoards = boardsData?.boards ?? [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => teamsService.deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Equipe excluída com sucesso');
      router.push('/admin/teams');
    },
    onError: () => toast.error('Erro ao excluir equipe'),
  });

  const handleDeleteConfirm = () => {
    deleteMutation.mutate();
    setDeleteConfirmOpen(false);
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
                <h1 className="text-2xl font-bold tracking-tight">
                  {team.name}
                </h1>
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
          {/* Informações Card */}
          <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg uppercase font-semibold flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" />
              Informações
            </h3>
            <InfoField
              label="Descrição"
              value={team.description}
              emptyText="Sem descrição"
            />
          </Card>

          {/* Members Card */}
          <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg uppercase font-semibold flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" />
              Membros
              <Badge variant="secondary" className="ml-2">
                {team.membersCount}
              </Badge>
            </h3>

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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Email Accounts Card */}
          {canReadEmails && (
            <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-lg uppercase font-semibold flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5" />
                Contas de E-mail
                <Badge variant="secondary" className="ml-2">
                  {teamEmails.length}
                </Badge>
              </h3>

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
                      className="flex items-center p-3 rounded-lg border hover:bg-accent/50 transition-colors"
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
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Calendars Card */}
          <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg uppercase font-semibold flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5" />
              Calendários da Equipe
              <Badge variant="secondary" className="ml-2">
                {teamCalendars.length}
              </Badge>
            </h3>

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
                    className="flex items-center p-3 rounded-lg border hover:bg-accent/50 transition-colors"
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
                      <p className="font-medium">{cal.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Boards Card */}
          <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg uppercase font-semibold flex items-center gap-2 mb-4">
              <KanbanSquare className="h-5 w-5" />
              Quadros da Equipe
              <Badge variant="secondary" className="ml-2">
                {teamBoards.length}
              </Badge>
            </h3>

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
                      <p className="font-medium">{board.title}</p>
                    </div>
                    {board.archivedAt && (
                      <Badge variant="secondary">Arquivado</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </PageBody>

      {/* DELETE CONFIRM */}
      <VerifyActionPinModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Equipe"
        description={`Tem certeza que deseja excluir a equipe "${team.name}"? Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
