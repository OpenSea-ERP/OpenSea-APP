/**
 * OpenSea OS - Permission Group Detail Page
 * Página de detalhes de um grupo de permissões específico
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/core/components/confirm-dialog';
import { logger } from '@/lib/logger';
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';
import { cn } from '@/lib/utils';
import * as rbacService from '@/services/rbac/rbac.service';
import type { User } from '@/types/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Edit,
  Plus,
  Search,
  Shield,
  Trash2,
  Users as UsersIcon,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  MATRIX_TABS,
  STANDARD_ACTIONS,
  mapActionToStandard,
  type StandardAction,
} from '../src/config/permission-matrix-config';
import { ModuleTabList } from '../src/components/module-tab-list';
import {
  PermissionMatrixTable,
  type ResourcePermissionMap,
} from '../src/components/permission-matrix-table';

export default function PermissionGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const groupId = params.id as string;

  const [activeTab, setActiveTab] = useState('users');
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [activePermTab, setActivePermTab] = useState(MATRIX_TABS[0].id);
  const [searchAvailableUser, setSearchAvailableUser] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [confirmRemoveUserId, setConfirmRemoveUserId] = useState<string | null>(
    null
  );

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ['permission-group-details', groupId],
    queryFn: async () => {
      const group = await rbacService.getPermissionGroupById(groupId);

      let permissions: import('@/types/rbac').PermissionWithEffect[] = [];
      try {
        permissions = await rbacService.listGroupPermissions(groupId);
      } catch (error) {
        logger.error(
          'Error fetching group permissions',
          error instanceof Error ? error : undefined
        );
      }

      return {
        group,
        users: [],
        permissions,
      };
    },
    enabled: !!groupId,
  });

  const { data: allPermissionsData } = useQuery({
    queryKey: ['all-permissions-structured'],
    queryFn: async () => {
      try {
        return await rbacService.listAllPermissions();
      } catch (error) {
        logger.error(
          'Error fetching all permissions',
          error instanceof Error ? error : undefined
        );
        return { permissions: [], total: 0, modules: [] };
      }
    },
  });

  const {
    data: groupUsersData = [],
    isLoading: usersLoading,
    refetch: refetchGroupUsers,
    error: usersError,
  } = useQuery({
    queryKey: ['permission-group-users', groupId],
    queryFn: () => rbacService.listUsersByGroup(groupId),
    enabled: !!groupId,
    retry: 2,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const group = groupData?.group;
  const groupPermissions = useMemo(
    () => groupData?.permissions || [],
    [groupData?.permissions]
  );

  const groupUsers = useMemo(() => {
    const users = groupUsersData || [];
    if (!searchUser) return users;
    const search = searchUser.toLowerCase();
    return users.filter(
      u =>
        u.username?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search)
    );
  }, [groupUsersData, searchUser]);

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['all-users'],
    queryFn: async () => {
      try {
        const response = await rbacService.listAllUsers();
        return response as User[];
      } catch (error) {
        logger.error(
          'Error fetching users',
          error instanceof Error ? error : undefined
        );
        return [];
      }
    },
    enabled: addUserModalOpen,
  });

  const availableUsers = useMemo(() => {
    const groupUserIds = new Set(groupUsers.map(u => u.id));
    return allUsers
      .filter((user: User) => !groupUserIds.has(user.id))
      .filter((user: User) => {
        if (!searchAvailableUser) return true;
        const search = searchAvailableUser.toLowerCase();
        return (
          user.username?.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search)
        );
      });
  }, [allUsers, groupUsers, searchAvailableUser]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const addUserToGroupMutation = useMutation({
    mutationFn: async (userId: string) => {
      await rbacService.assignGroupToUser(userId, { groupId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['permission-group-details', groupId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['permission-group-users', groupId],
      });
      await refetchGroupUsers();
      showSuccessToast('Usuário adicionado ao grupo');
      setAddUserModalOpen(false);
      setSelectedUserId(null);
      setSearchAvailableUser('');
    },
    onError: error => {
      logger.error(
        'Error adding user to group',
        error instanceof Error ? error : undefined
      );
      showErrorToast({
        title: 'Erro ao adicionar usuário',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await rbacService.removeGroupFromUser(userId, groupId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['permission-group-details', groupId],
      });
      await queryClient.invalidateQueries({
        queryKey: ['permission-group-users', groupId],
      });
      await refetchGroupUsers();
      showSuccessToast('Usuário removido do grupo');
      setConfirmRemoveUserId(null);
    },
    onError: error => {
      logger.error(
        'Error removing user from group',
        error instanceof Error ? error : undefined
      );
      showErrorToast({
        title: 'Erro ao remover usuário',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
      setConfirmRemoveUserId(null);
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleEdit = () => {
    router.push(`/admin/permission-groups/${groupId}/edit`);
  };

  const handleAddUser = () => {
    if (selectedUserId) {
      addUserToGroupMutation.mutate(selectedUserId);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setConfirmRemoveUserId(userId);
  };

  const handleConfirmRemoveUser = () => {
    if (confirmRemoveUserId) {
      removeUserMutation.mutate(confirmRemoveUserId);
    }
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const groupPermissionCodes = useMemo(
    () => new Set(groupPermissions.map(p => p.code)),
    [groupPermissions]
  );

  const { matrixPermissionMaps, matrixSelectedCounts, matrixTotalCounts } =
    useMemo(() => {
      if (!allPermissionsData)
        return {
          matrixPermissionMaps: {} as Record<string, ResourcePermissionMap[]>,
          matrixSelectedCounts: {} as Record<string, number>,
          matrixTotalCounts: {} as Record<string, number>,
        };

      // Build a map: "module.resource" → { action → Set<code> }
      const codesByBackendResource = new Map<
        string,
        Map<string, Set<string>>
      >();

      for (const moduleGroup of allPermissionsData.permissions) {
        const moduleLower = moduleGroup.module.toLowerCase();
        for (const [resourceKey, resourceGroup] of Object.entries(
          moduleGroup.resources
        )) {
          const backendKey = `${moduleLower}.${resourceKey}`;
          if (!codesByBackendResource.has(backendKey)) {
            codesByBackendResource.set(backendKey, new Map());
          }
          const actionMap = codesByBackendResource.get(backendKey)!;
          for (const perm of resourceGroup.permissions) {
            const standardAction = mapActionToStandard(perm.action);
            if (!actionMap.has(standardAction)) {
              actionMap.set(standardAction, new Set());
            }
            actionMap.get(standardAction)!.add(perm.code);
          }
        }
      }

      // For each tab, build ResourcePermissionMap[] and counts
      const allPermMaps: Record<string, ResourcePermissionMap[]> = {};
      const selCounts: Record<string, number> = {};
      const totCounts: Record<string, number> = {};

      for (const tab of MATRIX_TABS) {
        const maps: ResourcePermissionMap[] = [];
        let tabTotal = 0;
        let tabSelected = 0;

        tab.resources.forEach((resource, idx) => {
          const actionCodes = {} as Record<StandardAction, Set<string>>;
          for (const action of STANDARD_ACTIONS) {
            actionCodes[action] = new Set();
          }

          for (const br of resource.backendResources) {
            const actionMap = codesByBackendResource.get(br);
            if (!actionMap) continue;
            for (const [action, codes] of actionMap) {
              const stdAction = action as StandardAction;
              for (const code of codes) {
                actionCodes[stdAction].add(code);
              }
            }
          }

          let resourceTotal = 0;
          let resourceSelected = 0;
          for (const action of resource.availableActions) {
            for (const code of actionCodes[action]) {
              resourceTotal++;
              if (groupPermissionCodes.has(code)) resourceSelected++;
            }
          }
          tabTotal += resourceTotal;
          tabSelected += resourceSelected;

          maps.push({ resourceIndex: idx, actionCodes });
        });

        allPermMaps[tab.id] = maps;
        selCounts[tab.id] = tabSelected;
        totCounts[tab.id] = tabTotal;
      }

      return {
        matrixPermissionMaps: allPermMaps,
        matrixSelectedCounts: selCounts,
        matrixTotalCounts: totCounts,
      };
    }, [allPermissionsData, groupPermissionCodes]);

  const activePermTabConfig = useMemo(
    () => MATRIX_TABS.find(t => t.id === activePermTab),
    [activePermTab]
  );

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (groupLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-24 w-full" />
        </PageHeader>
        <PageBody>
          <Skeleton className="h-96 w-full" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!group) {
    return (
      <PageLayout>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Grupo não encontrado
            </h2>
            <p className="text-muted-foreground mb-6">
              O grupo de permissões que você está procurando não existe ou foi
              removido.
            </p>
            <Button onClick={() => router.push('/admin/permission-groups')}>
              Voltar para Grupos
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const usersCount = groupData?.group?.usersCount || groupUsers.length;
  const permissionsCount =
    groupData?.group?.permissionsCount || groupPermissions.length;

  return (
    <PageLayout>
      <PageHeader>
        {/* Action Bar */}
        <PageActionBar
          breadcrumbItems={[
            { label: 'Administração', href: '/admin' },
            {
              label: 'Grupos de Permissões',
              href: '/admin/permission-groups',
            },
            { label: group.name },
          ]}
          buttons={[
            {
              id: 'edit',
              title: 'Editar',
              icon: Edit,
              onClick: handleEdit,
            },
          ]}
        />

        {/* Title Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-5">
            {/* Icon */}
            <div
              className={cn(
                'flex h-14 w-14 items-center justify-center rounded-xl shrink-0',
                !group.color && 'bg-linear-to-br from-purple-500 to-pink-600'
              )}
              style={
                group.color
                  ? {
                      background: `linear-gradient(to bottom right, ${group.color}, ${group.color}CC)`,
                    }
                  : undefined
              }
            >
              <Shield className="h-7 w-7 text-white" />
            </div>

            {/* Title + subtitle */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                {group.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {group.isActive ? 'Ativo' : 'Inativo'} · Prioridade{' '}
                {group.priority}
                {group.description && ` · ${group.description}`}
              </p>
            </div>

            {/* Date badges */}
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {group.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>
                    {new Date(group.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {group.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    {new Date(group.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-10 mb-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Usuários ({usersCount})
            </TabsTrigger>
            <TabsTrigger
              value="permissions"
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Permissões ({permissionsCount})
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-white/5 p-6 w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    Usuários deste Grupo
                  </h3>
                  <Badge variant="secondary">
                    {groupUsersData.length} usuário
                    {groupUsersData.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant={'ghost'}
                  onClick={() => setAddUserModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Usuário
                </Button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário por nome ou e-mail..."
                  value={searchUser}
                  onChange={e => setSearchUser(e.target.value)}
                  className="pl-9"
                />
              </div>

              {usersLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : usersError ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Erro ao carregar usuários do grupo</p>
                  <p className="text-xs mt-2 text-red-500">
                    {(usersError as Error).message}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => refetchGroupUsers()}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : groupUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum usuário atribuído a este grupo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {groupUsers.map(userInGroup => (
                    <div
                      key={userInGroup.id}
                      className="flex items-center justify-between bg-linear-to-r from-slate-100 dark:from-slate-800 to-transparent p-3 rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold">
                          {(userInGroup.username || userInGroup.email)
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">
                            {userInGroup.username || userInGroup.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {userInGroup.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(userInGroup.id)}
                        disabled={
                          group.isSystem || removeUserMutation.isPending
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <Card className="bg-white/5 p-6 w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Permissões do Grupo</h3>
                <Badge variant="secondary">
                  {groupPermissions.length} permissões ativas
                </Badge>
              </div>

              {groupLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="flex gap-0 h-[500px]">
                  <div className="py-2">
                    <ModuleTabList
                      tabs={MATRIX_TABS}
                      activeTabId={activePermTab}
                      onTabChange={setActivePermTab}
                      selectedCounts={matrixSelectedCounts}
                      totalCounts={matrixTotalCounts}
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto py-2 px-2">
                    <PermissionMatrixTable
                      tab={activePermTabConfig!}
                      resources={activePermTabConfig?.resources ?? []}
                      permissionMaps={matrixPermissionMaps[activePermTab] ?? []}
                      selectedCodes={groupPermissionCodes}
                      onToggleCode={() => {}}
                      onToggleCodes={() => {}}
                      readOnly
                    />
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>

      {/* Add User Modal */}
      <Dialog open={addUserModalOpen} onOpenChange={setAddUserModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Adicionar Usuário ao Grupo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário por nome ou e-mail..."
                value={searchAvailableUser}
                onChange={e => setSearchAvailableUser(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex-1 overflow-y-auto border rounded-lg">
              {availableUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UsersIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>
                    {searchAvailableUser
                      ? 'Nenhum usuário encontrado'
                      : 'Todos os usuários já estão neste grupo'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {availableUsers.map((user: User) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={cn(
                        'flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors',
                        selectedUserId === user.id &&
                          'bg-primary/10 border-l-4 border-primary'
                      )}
                    >
                      <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold shrink-0">
                        {(user.username || user.email)
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.username || user.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      {selectedUserId === user.id && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <svg
                            className="h-3 w-3 text-primary-foreground"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setAddUserModalOpen(false);
                setSelectedUserId(null);
                setSearchAvailableUser('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={!selectedUserId || addUserToGroupMutation.isPending}
            >
              {addUserToGroupMutation.isPending
                ? 'Adicionando...'
                : 'Adicionar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove User Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmRemoveUserId}
        onOpenChange={open => !open && setConfirmRemoveUserId(null)}
        title="Remover Usuário do Grupo"
        description="Tem certeza que deseja remover este usuário do grupo? Esta ação não pode ser desfeita."
        onConfirm={handleConfirmRemoveUser}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="destructive"
        isLoading={removeUserMutation.isPending}
      />
    </PageLayout>
  );
}
