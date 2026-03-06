'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUsers } from '@/hooks/use-users';
import { useInviteParticipants, useShareEventWithTeam } from '@/hooks/calendar';
import { teamsService } from '@/services/core/teams.service';
import type { CalendarEvent, ParticipantRole } from '@/types/calendar';
import { EVENT_TYPE_COLORS } from '@/types/calendar';
import { useQuery } from '@tanstack/react-query';
import { Search, UserPlus, Users, Loader2, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';

interface InviteShareDialogProps {
  event: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  GUEST: 'Convidado',
  ASSIGNEE: 'Responsável',
};

export function InviteShareDialog({
  event,
  open,
  onOpenChange,
}: InviteShareDialogProps) {
  const [tab, setTab] = useState<'users' | 'teams'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<
    Map<string, { userId: string; role: ParticipantRole }>
  >(new Map());
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const { data: usersData, isLoading: usersLoading } = useUsers(open);
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', 'invite-share-dialog'],
    queryFn: () => teamsService.listTeams({ isActive: true, limit: 100 }),
    enabled: open && tab === 'teams',
  });

  const inviteMutation = useInviteParticipants();
  const shareWithTeam = useShareEventWithTeam();

  const eventColor = event.color ?? EVENT_TYPE_COLORS[event.type] ?? '#64748b';
  const existingParticipantIds = new Set((event.participants ?? []).map((p) => p.userId));

  const filteredUsers = (usersData?.users ?? []).filter((u) => {
    if (existingParticipantIds.has(u.id)) return false;
    if (!userSearch) return true;
    const name = u.profile?.name
      ? `${u.profile.name} ${u.profile.surname ?? ''}`.trim()
      : '';
    const searchLower = userSearch.toLowerCase();
    return (
      name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      (u.username ?? '').toLowerCase().includes(searchLower)
    );
  });

  const teams = teamsData?.data ?? [];
  const filteredTeams = teams.filter((t) => {
    if (!teamSearch) return true;
    return t.name.toLowerCase().includes(teamSearch.toLowerCase());
  });

  function toggleUser(userId: string) {
    const next = new Map(selectedUsers);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.set(userId, { userId, role: 'GUEST' });
    }
    setSelectedUsers(next);
  }

  function cycleRole(userId: string) {
    const next = new Map(selectedUsers);
    const entry = next.get(userId);
    if (entry) {
      const newRole = entry.role === 'GUEST' ? 'ASSIGNEE' : 'GUEST';
      next.set(userId, { ...entry, role: newRole });
      setSelectedUsers(next);
    }
  }

  async function handleInviteUsers() {
    if (selectedUsers.size === 0) return;
    try {
      const result = await inviteMutation.mutateAsync({
        eventId: event.id,
        data: { participants: Array.from(selectedUsers.values()) },
      });
      toast.success(`${result.invited} participante(s) convidado(s)`);
      setSelectedUsers(new Map());
      setUserSearch('');
      onOpenChange(false);
    } catch (error) {
      toast.error(translateError(error));
    }
  }

  async function handleShareWithTeam() {
    if (!selectedTeamId) return;
    try {
      const result = await shareWithTeam.mutateAsync({
        eventId: event.id,
        teamId: selectedTeamId,
      });
      toast.success(`Evento compartilhado com ${result.shared} membro(s) da equipe`);
      setSelectedTeamId(null);
      setTeamSearch('');
      onOpenChange(false);
    } catch (error) {
      toast.error(translateError(error));
    }
  }

  const isPending = inviteMutation.isPending || shareWithTeam.isPending;
  const canSubmit = tab === 'users' ? selectedUsers.size > 0 : !!selectedTeamId;

  function handleSubmit() {
    if (tab === 'users') handleInviteUsers();
    else handleShareWithTeam();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Convidar participantes</DialogTitle>
        {/* Header with color bar */}
        <div className="relative px-5 pt-7 pb-4">
          <div
            className="absolute top-0 left-0 w-full h-1.5 rounded-t-lg"
            style={{ backgroundColor: eventColor }}
          />
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg shrink-0"
              style={{ backgroundColor: `${eventColor}18` }}
            >
              <UserPlus className="w-5 h-5" style={{ color: eventColor }} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Convidar participantes</h2>
              <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                {event.title}
              </p>
            </div>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-1 px-5 pb-3">
          <button
            onClick={() => setTab('users')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'users'
                ? 'text-white'
                : 'bg-muted/50 dark:bg-white/5 text-muted-foreground hover:bg-muted dark:hover:bg-white/10'
            }`}
            style={tab === 'users' ? { backgroundColor: eventColor } : undefined}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Usuários
            {selectedUsers.size > 0 && (
              <span className="bg-white/25 text-[0.65rem] px-1.5 py-0.5 rounded-full font-semibold">
                {selectedUsers.size}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('teams')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'teams'
                ? 'text-white'
                : 'bg-muted/50 dark:bg-white/5 text-muted-foreground hover:bg-muted dark:hover:bg-white/10'
            }`}
            style={tab === 'teams' ? { backgroundColor: eventColor } : undefined}
          >
            <Users className="w-3.5 h-3.5" />
            Equipes
            {selectedTeamId && (
              <span className="bg-white/25 text-[0.65rem] px-1.5 py-0.5 rounded-full font-semibold">
                1
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={tab === 'users' ? 'Buscar por nome ou e-mail...' : 'Buscar equipe...'}
              value={tab === 'users' ? userSearch : teamSearch}
              onChange={(e) =>
                tab === 'users'
                  ? setUserSearch(e.target.value)
                  : setTeamSearch(e.target.value)
              }
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[300px] border-t border-border/40">
          {tab === 'users' ? (
            usersLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="w-8 h-8 mb-2 opacity-40" />
                <span className="text-sm">Nenhum usuário disponível</span>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {filteredUsers.map((u) => {
                  const name = u.profile?.name
                    ? `${u.profile.name} ${u.profile.surname ?? ''}`.trim()
                    : u.username ?? u.email;
                  const isSelected = selectedUsers.has(u.id);
                  const entry = selectedUsers.get(u.id);

                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${
                        isSelected
                          ? ''
                          : 'border-transparent hover:bg-accent/50'
                      }`}
                      style={isSelected ? { backgroundColor: `${eventColor}10`, borderColor: `${eventColor}35` } : undefined}
                    >
                      {/* Avatar */}
                      <div
                        className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={isSelected
                          ? { backgroundColor: `${eventColor}cc`, color: 'white' }
                          : { backgroundColor: `${eventColor}18`, color: eventColor }
                        }
                      >
                        {getInitials(name)}
                      </div>

                      {/* Name + email */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{name}</div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>

                      {/* Role badge or check indicator */}
                      {isSelected ? (
                        <Badge
                          variant="secondary"
                          className="text-[0.65rem] h-6 gap-1 cursor-pointer hover:bg-accent shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            cycleRole(u.id);
                          }}
                        >
                          {ROLE_LABELS[entry?.role ?? 'GUEST']}
                          <ChevronDown className="w-3 h-3" />
                        </Badge>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-border/60 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            teamsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTeams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="w-8 h-8 mb-2 opacity-40" />
                <span className="text-sm">Nenhuma equipe encontrada</span>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {filteredTeams.map((team) => {
                  const isSelected = selectedTeamId === team.id;
                  return (
                    <div
                      key={team.id}
                      onClick={() => setSelectedTeamId(isSelected ? null : team.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${
                        isSelected
                          ? ''
                          : 'border-transparent hover:bg-accent/50'
                      }`}
                      style={isSelected ? { backgroundColor: `${eventColor}10`, borderColor: `${eventColor}35` } : undefined}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: team.color ? `${team.color}20` : `${eventColor}15` }}
                      >
                        <Users className="w-4 h-4" style={{ color: team.color ?? eventColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {team.color && (
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: team.color }}
                            />
                          )}
                          <span className="text-sm font-medium truncate">{team.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {team.membersCount} membro(s)
                        </div>
                      </div>
                      {isSelected ? (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: eventColor }}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-border/60 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="h-9 px-5 text-white"
            style={{ backgroundColor: canSubmit ? eventColor : undefined }}
            onClick={handleSubmit}
            disabled={!canSubmit || isPending}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <UserPlus className="w-4 h-4 mr-1.5" />
            )}
            {tab === 'users'
              ? `Convidar${selectedUsers.size > 0 ? ` (${selectedUsers.size})` : ''}`
              : 'Compartilhar com equipe'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
