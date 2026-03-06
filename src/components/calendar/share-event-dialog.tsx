'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUsers } from '@/hooks/use-users';
import { useShareEventWithUsers, useShareEventWithTeam } from '@/hooks/calendar';
import { teamsService } from '@/services/core/teams.service';
import type { CalendarEvent } from '@/types/calendar';
import { useQuery } from '@tanstack/react-query';
import { Search, Share2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';

interface ShareEventDialogProps {
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

export function ShareEventDialog({
  event,
  open,
  onOpenChange,
}: ShareEventDialogProps) {
  const [tab, setTab] = useState<'users' | 'teams'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const { data: usersData, isLoading: usersLoading } = useUsers(open);
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', 'share-dialog'],
    queryFn: () => teamsService.listTeams({ isActive: true, limit: 100 }),
    enabled: open,
  });

  const shareWithUsers = useShareEventWithUsers();
  const shareWithTeam = useShareEventWithTeam();

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
    const next = new Set(selectedUserIds);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.add(userId);
    }
    setSelectedUserIds(next);
  }

  async function handleShareWithUsers() {
    if (selectedUserIds.size === 0) return;

    try {
      const result = await shareWithUsers.mutateAsync({
        eventId: event.id,
        userIds: Array.from(selectedUserIds),
      });
      toast.success(`Evento compartilhado com ${result.shared} usuário(s)`);
      setSelectedUserIds(new Set());
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

  const isSharing = shareWithUsers.isPending || shareWithTeam.isPending;
  const canShare = tab === 'users' ? selectedUserIds.size > 0 : !!selectedTeamId;

  function handleShare() {
    if (tab === 'users') handleShareWithUsers();
    else handleShareWithTeam();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Compartilhar evento
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'users' | 'teams')} className="flex flex-col">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="teams">Equipes</TabsTrigger>
            </TabsList>
          </div>

          {/* Search bar */}
          <div className="px-6 pt-4 pb-2">
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

          {/* Users tab */}
          <TabsContent value="users" className="mt-0 flex-1">
            <ScrollArea className="h-[280px]">
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-12">
                  Nenhum usuário disponível
                </div>
              ) : (
                <div className="px-4 py-1 space-y-0.5">
                  {filteredUsers.map((u) => {
                    const name = u.profile?.name
                      ? `${u.profile.name} ${u.profile.surname ?? ''}`.trim()
                      : u.username ?? u.email;
                    const isSelected = selectedUserIds.has(u.id);

                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/10 dark:bg-primary/15'
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleUser(u.id)}
                        />
                        <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium shrink-0">
                          {getInitials(name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {u.email}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Teams tab */}
          <TabsContent value="teams" className="mt-0 flex-1">
            <ScrollArea className="h-[280px]">
              {teamsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-12">
                  Nenhuma equipe encontrada
                </div>
              ) : (
                <div className="px-4 py-1 space-y-0.5">
                  {filteredTeams.map((team) => {
                    const isSelected = selectedTeamId === team.id;
                    return (
                      <label
                        key={team.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/10 dark:bg-primary/15'
                            : 'hover:bg-accent/50'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            setSelectedTeamId(isSelected ? null : team.id)
                          }
                        />
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: team.color ? `${team.color}20` : undefined }}
                        >
                          <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {team.color && (
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: team.color }}
                              />
                            )}
                            <span className="text-sm font-medium truncate">{team.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {team.membersCount} membro(s)
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer - always at bottom, outside tabs */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/50">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleShare}
            disabled={!canShare || isSharing}
          >
            {isSharing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Share2 className="w-4 h-4 mr-1.5" />
            )}
            {tab === 'users'
              ? `Compartilhar (${selectedUserIds.size})`
              : 'Compartilhar com equipe'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
