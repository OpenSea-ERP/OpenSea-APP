'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useFolderAccess,
  useRemoveFolderAccess,
  useSetFolderAccess,
} from '@/hooks/storage';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { usersService } from '@/services/auth/users.service';
import { listPermissionGroups } from '@/services/rbac/rbac.service';
import type { FolderAccessRule, StorageFolder } from '@/types/storage';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// Types
// =============================================================================

interface FolderAccessDialogProps {
  folder: StorageFolder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SectionId = 'overview' | 'groups' | 'users';

interface SectionItem {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
}

interface NewRuleForm {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
}

const EMPTY_FORM: NewRuleForm = {
  canRead: true,
  canWrite: false,
  canDelete: false,
  canShare: false,
};

// =============================================================================
// Helpers
// =============================================================================

function getFolderSharePermissions(folder: StorageFolder | null) {
  if (!folder) return { shareUserCode: '', shareGroupCode: '' };

  if (folder.isSystem) {
    return {
      shareUserCode: 'storage.system-folders.share-user',
      shareGroupCode: 'storage.system-folders.share-group',
    };
  }
  if (folder.isFilter) {
    return {
      shareUserCode: 'storage.filter-folders.share-user',
      shareGroupCode: 'storage.filter-folders.share-group',
    };
  }
  return {
    shareUserCode: 'storage.user-folders.share-user',
    shareGroupCode: 'storage.user-folders.share-group',
  };
}

// =============================================================================
// Main Component
// =============================================================================

export function FolderAccessDialog({
  folder,
  open,
  onOpenChange,
}: FolderAccessDialogProps) {
  const { hasPermission } = usePermissions();
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [groupSearch, setGroupSearch] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [groupForm, setGroupForm] = useState<NewRuleForm>(EMPTY_FORM);
  const [userForm, setUserForm] = useState<NewRuleForm>(EMPTY_FORM);
  const [userResetKey, setUserResetKey] = useState(0);

  const { data: accessData, isLoading } = useFolderAccess(folder?.id ?? '');
  const setAccessMutation = useSetFolderAccess();
  const removeAccessMutation = useRemoveFolderAccess();

  // Determine which share sections are visible
  const { shareUserCode, shareGroupCode } = getFolderSharePermissions(folder);
  const canShareWithUsers = hasPermission(shareUserCode);
  const canShareWithGroups = hasPermission(shareGroupCode);

  // Build available sidebar sections
  const sections = useMemo<SectionItem[]>(() => {
    const result: SectionItem[] = [
      {
        id: 'overview',
        label: 'Quem pode ver',
        icon: <Eye className="w-4 h-4" />,
      },
    ];
    if (canShareWithGroups) {
      result.push({
        id: 'groups',
        label: 'Grupos',
        icon: <Shield className="w-4 h-4" />,
      });
    }
    if (canShareWithUsers) {
      result.push({
        id: 'users',
        label: 'Usuários',
        icon: <UserPlus className="w-4 h-4" />,
      });
    }
    return result;
  }, [canShareWithGroups, canShareWithUsers]);

  // Fetch groups for the groups section
  const { data: allGroups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['permission-groups-for-access'],
    queryFn: () => listPermissionGroups({ isActive: true, limit: 500 }),
    enabled: open && canShareWithGroups && activeSection === 'groups',
    staleTime: 5 * 60 * 1000,
  });

  const rules = accessData?.rules ?? [];
  const directRules = rules.filter((r: FolderAccessRule) => !r.isInherited);
  const inheritedRules = rules.filter((r: FolderAccessRule) => r.isInherited);

  // Filtered groups based on search
  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return allGroups;
    const q = groupSearch.toLowerCase();
    return allGroups.filter(
      g =>
        g.name.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q)
    );
  }, [allGroups, groupSearch]);

  // Handlers
  const handleAddGroupRule = useCallback(async () => {
    if (!folder || !selectedGroupId) return;

    try {
      await setAccessMutation.mutateAsync({
        folderId: folder.id,
        data: {
          groupId: selectedGroupId,
          ...groupForm,
        },
      });
      toast.success('Acesso concedido ao grupo');
      setSelectedGroupId('');
      setGroupForm(EMPTY_FORM);
    } catch {
      toast.error('Erro ao conceder acesso ao grupo');
    }
  }, [folder, selectedGroupId, groupForm, setAccessMutation]);

  const handleAddUserRule = useCallback(async () => {
    if (!folder || !selectedUserId) return;

    try {
      await setAccessMutation.mutateAsync({
        folderId: folder.id,
        data: {
          userId: selectedUserId,
          ...userForm,
        },
      });
      toast.success('Acesso concedido ao usuário');
      setSelectedUserId('');
      setUserForm(EMPTY_FORM);
      setUserResetKey(k => k + 1);
    } catch {
      toast.error('Erro ao conceder acesso ao usuário');
    }
  }, [folder, selectedUserId, userForm, setAccessMutation]);

  const handleRemoveRule = useCallback(
    async (rule: FolderAccessRule) => {
      if (!folder || rule.isInherited) return;

      try {
        await removeAccessMutation.mutateAsync({
          folderId: folder.id,
          ruleId: rule.id,
        });
        toast.success('Regra de acesso removida');
      } catch {
        toast.error('Erro ao remover regra de acesso');
      }
    },
    [folder, removeAccessMutation]
  );

  const handleEditRule = useCallback(
    async (rule: FolderAccessRule, form: NewRuleForm) => {
      if (!folder) return;

      try {
        await setAccessMutation.mutateAsync({
          folderId: folder.id,
          data: {
            ...(rule.userId
              ? { userId: rule.userId }
              : { groupId: rule.groupId! }),
            ...form,
          },
        });
        toast.success('Permissões atualizadas');
      } catch {
        toast.error('Erro ao atualizar permissões');
      }
    },
    [folder, setAccessMutation]
  );

  const handleClose = useCallback(() => {
    setActiveSection('overview');
    setGroupSearch('');
    setSelectedGroupId('');
    setSelectedUserId('');
    setGroupForm(EMPTY_FORM);
    setUserForm(EMPTY_FORM);
    onOpenChange(false);
  }, [onOpenChange]);

  // If only overview is visible, use simple layout (no sidebar)
  const hasSidebar = sections.length > 1;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          hasSidebar ? 'sm:max-w-4xl' : 'sm:max-w-lg',
          'max-h-[85vh] flex flex-col'
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Gerenciar acesso
          </DialogTitle>
          <DialogDescription>
            {folder ? `Pasta "${folder.name}"` : ''}
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            'flex flex-1 overflow-hidden min-h-0',
            hasSidebar ? 'gap-0' : ''
          )}
        >
          {/* Sidebar */}
          {hasSidebar && (
            <nav className="w-48 shrink-0 border-r border-gray-200 dark:border-slate-700 p-2 space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left',
                    activeSection === section.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  )}
                >
                  {section.icon}
                  {section.label}
                </button>
              ))}
            </nav>
          )}

          {/* Content */}
          <ScrollArea className="flex-1 p-4">
            {activeSection === 'overview' && (
              <OverviewSection
                directRules={directRules}
                inheritedRules={inheritedRules}
                isLoading={isLoading}
                onRemoveRule={handleRemoveRule}
                onEditRule={handleEditRule}
                isRemoving={removeAccessMutation.isPending}
                isEditing={setAccessMutation.isPending}
                canRemoveRules={canShareWithUsers || canShareWithGroups}
              />
            )}

            {activeSection === 'groups' && (
              <ShareWithGroupsSection
                rules={rules}
                filteredGroups={filteredGroups}
                isLoading={isLoadingGroups}
                search={groupSearch}
                onSearchChange={setGroupSearch}
                selectedGroupId={selectedGroupId}
                onSelectGroup={setSelectedGroupId}
                form={groupForm}
                onFormChange={setGroupForm}
                onAdd={handleAddGroupRule}
                onRemoveRule={handleRemoveRule}
                isRemoving={removeAccessMutation.isPending}
                isPending={setAccessMutation.isPending}
              />
            )}

            {activeSection === 'users' && (
              <ShareWithUsersSection
                rules={rules}
                selectedUserId={selectedUserId}
                onSelectUser={setSelectedUserId}
                form={userForm}
                onFormChange={setUserForm}
                onAdd={handleAddUserRule}
                onRemoveRule={handleRemoveRule}
                isRemoving={removeAccessMutation.isPending}
                isPending={setAccessMutation.isPending}
                resetKey={userResetKey}
              />
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Section: Overview
// =============================================================================

function OverviewSection({
  directRules,
  inheritedRules,
  isLoading,
  onRemoveRule,
  onEditRule,
  isRemoving,
  isEditing,
  canRemoveRules,
}: {
  directRules: FolderAccessRule[];
  inheritedRules: FolderAccessRule[];
  isLoading: boolean;
  onRemoveRule: (rule: FolderAccessRule) => void;
  onEditRule: (rule: FolderAccessRule, form: NewRuleForm) => Promise<void>;
  isRemoving: boolean;
  isEditing: boolean;
  canRemoveRules: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const resolveLabel = (rule: FolderAccessRule) => {
    if (rule.userId) {
      return rule.userName || rule.userId;
    }
    if (rule.groupId) {
      return rule.groupName || rule.groupId;
    }
    return 'Desconhecido';
  };

  const resolveType = (rule: FolderAccessRule) => {
    if (rule.userId) return 'Usuário';
    if (rule.groupId) return 'Grupo';
    return '';
  };

  return (
    <div className="space-y-4">
      {/* Direct rules */}
      {directRules.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Regras diretas
          </h4>
          {directRules.map(rule => (
            <AccessRuleRow
              key={rule.id}
              rule={rule}
              label={resolveLabel(rule)}
              typeLabel={resolveType(rule)}
              onRemove={canRemoveRules ? () => onRemoveRule(rule) : undefined}
              onEdit={
                canRemoveRules ? form => onEditRule(rule, form) : undefined
              }
              isRemoving={isRemoving}
              isEditing={isEditing}
            />
          ))}
        </div>
      )}

      {/* Inherited rules */}
      {inheritedRules.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Herdadas (somente leitura)
          </h4>
          {inheritedRules.map(rule => (
            <AccessRuleRow
              key={rule.id}
              rule={rule}
              label={resolveLabel(rule)}
              typeLabel={resolveType(rule)}
            />
          ))}
        </div>
      )}

      {directRules.length === 0 && inheritedRules.length === 0 && (
        <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400">
          Nenhuma regra de acesso configurada
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Section: Share with Groups
// =============================================================================

function ShareWithGroupsSection({
  rules,
  filteredGroups,
  isLoading,
  search,
  onSearchChange,
  selectedGroupId,
  onSelectGroup,
  form,
  onFormChange,
  onAdd,
  onRemoveRule,
  isRemoving,
  isPending,
}: {
  rules: FolderAccessRule[];
  filteredGroups: Array<{
    id: string;
    name: string;
    description?: string | null;
  }>;
  isLoading: boolean;
  search: string;
  onSearchChange: (s: string) => void;
  selectedGroupId: string;
  onSelectGroup: (id: string) => void;
  form: NewRuleForm;
  onFormChange: (form: NewRuleForm) => void;
  onAdd: () => void;
  onRemoveRule: (rule: FolderAccessRule) => void;
  isRemoving: boolean;
  isPending: boolean;
}) {
  const groupsWithAccess = rules.filter(r => r.groupId && !r.isInherited);
  const groupIdsWithAccess = new Set(groupsWithAccess.map(r => r.groupId));
  const availableGroups = filteredGroups.filter(
    g => !groupIdsWithAccess.has(g.id)
  );

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">
        Compartilhar com grupos de permissão
      </h4>

      {/* Search */}
      <div className="relative px-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar grupo..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Available groups list */}
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {availableGroups.map(group => (
              <button
                key={group.id}
                onClick={() =>
                  onSelectGroup(group.id === selectedGroupId ? '' : group.id)
                }
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                  selectedGroupId === group.id
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-gray-100 dark:hover:bg-slate-800 border border-transparent'
                )}
              >
                <Shield className="w-4 h-4 text-gray-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{group.name}</p>
                  {group.description && (
                    <p className="text-xs text-gray-500 truncate">
                      {group.description ?? 'Sem descrição'}
                    </p>
                  )}
                </div>
              </button>
            ))}
            {availableGroups.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                {search
                  ? 'Nenhum grupo encontrado'
                  : 'Todos os grupos já têm acesso'}
              </p>
            )}
          </>
        )}
      </div>

      {/* Permissions form (when a group is selected) */}
      {selectedGroupId && (
        <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 space-y-3">
          <p className="text-sm font-medium">
            Permissões para o grupo selecionado
          </p>
          <PermissionCheckboxes form={form} onChange={onFormChange} />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSelectGroup('')}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={onAdd} disabled={isPending}>
              <Plus className="w-4 h-4" />
              {isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </div>
      )}

      {/* Already shared groups */}
      {groupsWithAccess.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-slate-700">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Grupos com acesso
          </h4>
          {groupsWithAccess.map(rule => {
            const group = filteredGroups.find(g => g.id === rule.groupId) || {
              id: rule.groupId ?? '',
              name: rule.groupName ?? rule.groupId ?? 'Desconhecido',
            };
            return (
              <AccessRuleRow
                key={rule.id}
                rule={rule}
                label={group.name}
                typeLabel="Grupo"
                onRemove={() => onRemoveRule(rule)}
                isRemoving={isRemoving}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Section: Share with Users (username lookup)
// =============================================================================

function ShareWithUsersSection({
  rules,
  selectedUserId,
  onSelectUser,
  form,
  onFormChange,
  onAdd,
  onRemoveRule,
  isRemoving,
  isPending,
  resetKey,
}: {
  rules: FolderAccessRule[];
  selectedUserId: string;
  onSelectUser: (id: string) => void;
  form: NewRuleForm;
  onFormChange: (form: NewRuleForm) => void;
  onAdd: () => void;
  onRemoveRule: (rule: FolderAccessRule) => void;
  isRemoving: boolean;
  isPending: boolean;
  resetKey: number;
}) {
  const [usernameInput, setUsernameInput] = useState('');
  const [searchTriggered, setSearchTriggered] = useState('');

  // Reset search form when parent signals success (resetKey incremented)
  useEffect(() => {
    if (resetKey > 0) {
      setUsernameInput('');
      setSearchTriggered('');
    }
  }, [resetKey]);

  const usersWithAccess = rules.filter(r => r.userId && !r.isInherited);
  const userIdsWithAccess = new Set(usersWithAccess.map(r => r.userId));

  // Lookup user by exact username
  const {
    data: lookupResult,
    isLoading: isSearching,
    isError,
  } = useQuery({
    queryKey: ['user-by-username', searchTriggered],
    queryFn: async () => {
      const response = await usersService.getUserByUsername(searchTriggered);
      return response.user;
    },
    enabled: !!searchTriggered,
    retry: false,
    staleTime: 30 * 1000,
  });

  const handleSearch = useCallback(() => {
    const trimmed = usernameInput.trim();
    if (trimmed.length < 3) {
      toast.error('Digite pelo menos 3 caracteres');
      return;
    }
    onSelectUser('');
    setSearchTriggered(trimmed);
  }, [usernameInput, onSelectUser]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    },
    [handleSearch]
  );

  // Determine if the found user already has access
  const userAlreadyHasAccess =
    lookupResult && userIdsWithAccess.has(lookupResult.id);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Compartilhar com usuário</h4>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Digite o username completo do usuário para buscar.
      </p>

      {/* Username search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-0 p-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Username exato do usuário..."
            value={usernameInput}
            onChange={e => setUsernameInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button
          variant="default"
          onClick={handleSearch}
          disabled={isSearching || usernameInput.trim().length < 3}
          className="shrink-0 h-12"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Buscar'
          )}
        </Button>
      </div>

      {/* Search result */}
      {searchTriggered && !isSearching && (
        <div className="space-y-2">
          {isError && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">
                Nenhum usuário encontrado com o username &quot;{searchTriggered}
                &quot;
              </p>
            </div>
          )}

          {lookupResult && userAlreadyHasAccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30">
              <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                O usuário <strong>{lookupResult.username}</strong> já possui
                acesso a esta pasta.
              </p>
            </div>
          )}

          {lookupResult && !userAlreadyHasAccess && (
            <button
              onClick={() =>
                onSelectUser(
                  lookupResult.id === selectedUserId ? '' : lookupResult.id
                )
              }
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-left transition-colors',
                selectedUserId === lookupResult.id
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700'
              )}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">
                  {lookupResult.profile?.name
                    ? `${lookupResult.profile.name} ${lookupResult.profile.surname || ''}`.trim()
                    : lookupResult.username}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  @{lookupResult.username}
                </p>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Permissions form (when a user is selected) */}
      {selectedUserId && (
        <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 space-y-3">
          <p className="text-sm font-medium">
            Permissões para o usuário selecionado
          </p>
          <PermissionCheckboxes form={form} onChange={onFormChange} />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSelectUser('')}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={onAdd} disabled={isPending}>
              <Plus className="w-4 h-4" />
              {isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </div>
      )}

      {/* Already shared users */}
      {usersWithAccess.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-slate-700">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Usuários com acesso
          </h4>
          {usersWithAccess.map(rule => (
            <AccessRuleRow
              key={rule.id}
              rule={rule}
              label={rule.userName || rule.userId || 'Desconhecido'}
              typeLabel="Usuário"
              onRemove={() => onRemoveRule(rule)}
              isRemoving={isRemoving}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Shared: Permission Checkboxes
// =============================================================================

function PermissionCheckboxes({
  form,
  onChange,
}: {
  form: NewRuleForm;
  onChange: (form: NewRuleForm) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={form.canRead}
          onCheckedChange={checked =>
            onChange({ ...form, canRead: checked === true })
          }
        />
        Leitura
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={form.canWrite}
          onCheckedChange={checked =>
            onChange({ ...form, canWrite: checked === true })
          }
        />
        Escrita
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={form.canDelete}
          onCheckedChange={checked =>
            onChange({ ...form, canDelete: checked === true })
          }
        />
        Exclusão
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={form.canShare}
          onCheckedChange={checked =>
            onChange({ ...form, canShare: checked === true })
          }
        />
        Compartilhar
      </label>
    </div>
  );
}

// =============================================================================
// Shared: Access Rule Row
// =============================================================================

function AccessRuleRow({
  rule,
  label,
  typeLabel,
  onRemove,
  onEdit,
  isRemoving,
  isEditing: isEditingParent,
}: {
  rule: FolderAccessRule;
  label: string;
  typeLabel: string;
  onRemove?: () => void;
  onEdit?: (form: NewRuleForm) => void;
  isRemoving?: boolean;
  isEditing?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<NewRuleForm>({
    canRead: rule.canRead,
    canWrite: rule.canWrite,
    canDelete: rule.canDelete,
    canShare: rule.canShare,
  });

  const permissions = [
    rule.canRead && 'Leitura',
    rule.canWrite && 'Escrita',
    rule.canDelete && 'Exclusão',
    rule.canShare && 'Compartilhar',
  ].filter(Boolean);

  const handleSaveEdit = async () => {
    onEdit?.(editForm);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      canRead: rule.canRead,
      canWrite: rule.canWrite,
      canDelete: rule.canDelete,
      canShare: rule.canShare,
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-500 shrink-0" />
          <p className="text-sm font-medium truncate">{label}</p>
          {typeLabel && (
            <Badge variant="outline" className="text-[10px] shrink-0">
              {typeLabel}
            </Badge>
          )}
        </div>
        <PermissionCheckboxes form={editForm} onChange={setEditForm} />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSaveEdit} disabled={isEditingParent}>
            {isEditingParent ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800">
        <Shield className="w-4 h-4 text-gray-500" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{label}</p>
          {typeLabel && (
            <Badge variant="outline" className="text-[10px] shrink-0">
              {typeLabel}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap mt-0.5">
          {permissions.map(p => (
            <Badge
              key={p as string}
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              {p}
            </Badge>
          ))}
        </div>
      </div>

      {!rule.isInherited && onEdit && (
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
        >
          <Pencil className="w-4 h-4 text-gray-500" />
        </Button>
      )}

      {!rule.isInherited && onRemove && (
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onRemove}
          disabled={isRemoving}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      )}

      {rule.isInherited && (
        <Badge variant="outline" className="text-[10px] shrink-0">
          Herdada
        </Badge>
      )}
    </div>
  );
}
