'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useUpdateTeamCalendarPermissions } from '@/hooks/calendar';
import type { Calendar, TeamCalendarPermissions } from '@/types/calendar';
import { Crown, Shield, Users, Save, Settings, Eye, Plus, Pencil, Trash2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';

interface TeamCalendarPermissionsDialogProps {
  calendar: Calendar | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Role of the current user in the team. Determines which role rows are editable. */
  userTeamRole?: 'OWNER' | 'ADMIN' | 'MEMBER';
  /** Team color to use as accent (calendars inherit team color). */
  teamColor?: string | null;
}

const ROLE_HIERARCHY: Record<string, number> = {
  OWNER: 0,
  ADMIN: 1,
  MEMBER: 2,
};

const EVENT_PERMISSIONS = [
  { key: 'canRead' as const, label: 'Visualizar eventos', icon: Eye },
  { key: 'canCreate' as const, label: 'Criar eventos', icon: Plus },
  { key: 'canEdit' as const, label: 'Editar eventos', icon: Pencil },
  { key: 'canDelete' as const, label: 'Excluir eventos', icon: Trash2 },
  { key: 'canShare' as const, label: 'Compartilhar eventos', icon: Share2 },
];

const ROLES = [
  { key: 'owner' as const, label: 'Proprietário', icon: Crown, color: '#f59e0b', bgColor: '#f59e0b' },
  { key: 'admin' as const, label: 'Administrador', icon: Shield, color: '#3b82f6', bgColor: '#3b82f6' },
  { key: 'member' as const, label: 'Membro', icon: Users, color: '#10b981', bgColor: '#10b981' },
];

type RoleKey = 'owner' | 'admin' | 'member';
type PermKey = 'canRead' | 'canCreate' | 'canEdit' | 'canDelete' | 'canShare' | 'canManage';

function buildKey(role: RoleKey, perm: PermKey): keyof TeamCalendarPermissions {
  const capitalized = perm.charAt(0).toUpperCase() + perm.slice(1);
  return `${role}${capitalized}` as keyof TeamCalendarPermissions;
}

export function TeamCalendarPermissionsDialog({
  calendar,
  open,
  onOpenChange,
  userTeamRole = 'MEMBER',
  teamColor,
}: TeamCalendarPermissionsDialogProps) {
  const updatePermissions = useUpdateTeamCalendarPermissions();
  const [perms, setPerms] = useState<TeamCalendarPermissions>({});

  useEffect(() => {
    if (calendar) {
      const defaults: TeamCalendarPermissions = {
        ownerCanRead: true,
        ownerCanCreate: true,
        ownerCanEdit: true,
        ownerCanDelete: true,
        ownerCanShare: true,
        ownerCanManage: true,
        adminCanRead: true,
        adminCanCreate: true,
        adminCanEdit: true,
        adminCanDelete: false,
        adminCanShare: true,
        adminCanManage: false,
        memberCanRead: true,
        memberCanCreate: true,
        memberCanEdit: false,
        memberCanDelete: false,
        memberCanShare: false,
        memberCanManage: false,
      };
      setPerms(defaults);
    }
  }, [calendar]);

  function togglePerm(role: RoleKey, perm: PermKey) {
    const key = buildKey(role, perm);
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function isRoleDisabled(role: RoleKey): boolean {
    if (userTeamRole === 'OWNER') return false;
    const roleLevel = ROLE_HIERARCHY[role.toUpperCase()] ?? 0;
    const userLevel = ROLE_HIERARCHY[userTeamRole] ?? 2;
    return roleLevel <= userLevel;
  }

  async function handleSave() {
    if (!calendar) return;

    try {
      await updatePermissions.mutateAsync({ id: calendar.id, data: perms });
      toast.success('Permissões atualizadas com sucesso');
      onOpenChange(false);
    } catch (error) {
      toast.error(translateError(error));
    }
  }

  const accentColor = teamColor || calendar?.color || '#3b82f6';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto p-0">
        {/* Accent bar */}
        <div
          className="h-1.5 w-full rounded-t-lg"
          style={{ background: `linear-gradient(to right, ${accentColor}, ${accentColor}80)` }}
        />

        <div className="px-6 pt-4 pb-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div
                className="p-2 rounded-lg"
                style={{ background: `${accentColor}18` }}
              >
                <Shield className="w-4 h-4" style={{ color: accentColor }} />
              </div>
              Permissões do Calendário
            </DialogTitle>
            <DialogDescription>
              {calendar && (
                <span>
                  Configure as permissões de acesso para &quot;{calendar.name}&quot;
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-3 px-6 pb-2">
          {ROLES.map(({ key: role, label, icon: Icon, color, bgColor }) => {
            const disabled = isRoleDisabled(role);
            const manageKey = buildKey(role, 'canManage');
            const manageChecked = perms[manageKey] ?? false;

            return (
              <div
                key={role}
                className="rounded-lg border transition-colors"
                style={{
                  borderColor: disabled ? 'var(--border)' : `${bgColor}30`,
                  background: disabled ? undefined : `${bgColor}05`,
                }}
              >
                {/* Role header */}
                <div
                  className="flex items-center gap-2.5 px-4 py-2.5 border-b"
                  style={{ borderColor: disabled ? 'var(--border)' : `${bgColor}20` }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: `${bgColor}20` }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <span className="text-sm font-semibold flex-1">{label}</span>
                  {disabled && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Bloqueado
                    </span>
                  )}
                </div>

                {/* Permissions grid */}
                <div className="px-4 py-3 space-y-2.5">
                  {/* Gerenciar calendário - highlighted */}
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-dashed" style={{ borderColor: disabled ? 'var(--border)' : `${bgColor}20` }}>
                    <Checkbox
                      id={`${role}-canManage`}
                      checked={manageChecked}
                      onCheckedChange={() => togglePerm(role, 'canManage')}
                      disabled={disabled}
                    />
                    <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                    <Label
                      htmlFor={`${role}-canManage`}
                      className={`text-sm font-medium ${disabled ? 'text-muted-foreground' : 'cursor-pointer'}`}
                    >
                      Gerenciar calendário
                    </Label>
                  </div>

                  {/* Event permissions */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {EVENT_PERMISSIONS.map(({ key: perm, label: permLabel, icon: PermIcon }) => {
                      const fullKey = buildKey(role, perm);
                      return (
                        <div key={perm} className="flex items-center gap-2">
                          <Checkbox
                            id={`${role}-${perm}`}
                            checked={perms[fullKey] ?? false}
                            onCheckedChange={() => togglePerm(role, perm)}
                            disabled={disabled}
                          />
                          <PermIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                          <Label
                            htmlFor={`${role}-${perm}`}
                            className={`text-xs ${disabled ? 'text-muted-foreground' : 'cursor-pointer'}`}
                          >
                            {permLabel}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="px-6 pb-5 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={updatePermissions.isPending}
            style={{ background: accentColor }}
            className="hover:opacity-90 text-white"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {updatePermissions.isPending ? 'Salvando...' : 'Salvar Permissões'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
