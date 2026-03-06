'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUsers } from '@/hooks/use-users';
import { useInviteParticipants } from '@/hooks/calendar';
import type { CalendarEvent, ParticipantRole } from '@/types/calendar';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';

interface ParticipantInviteDialogProps {
  event: CalendarEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ParticipantInviteDialog({
  event,
  open,
  onOpenChange,
}: ParticipantInviteDialogProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<
    Map<string, { userId: string; role: ParticipantRole }>
  >(new Map());

  const { data: usersData, isLoading: usersLoading } = useUsers(open);
  const inviteMutation = useInviteParticipants();

  const existingParticipantIds = new Set((event.participants ?? []).map((p) => p.userId));

  const filteredUsers = (usersData?.users ?? []).filter((u) => {
    if (existingParticipantIds.has(u.id)) return false;
    if (!search) return true;
    const name = u.profile?.name
      ? `${u.profile.name} ${u.profile.surname ?? ''}`.trim()
      : '';
    const searchLower = search.toLowerCase();
    return (
      name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      (u.username ?? '').toLowerCase().includes(searchLower)
    );
  });

  function toggleUser(userId: string) {
    const next = new Map(selected);
    if (next.has(userId)) {
      next.delete(userId);
    } else {
      next.set(userId, { userId, role: 'GUEST' });
    }
    setSelected(next);
  }

  function changeRole(userId: string, role: ParticipantRole) {
    const next = new Map(selected);
    const entry = next.get(userId);
    if (entry) {
      next.set(userId, { ...entry, role });
      setSelected(next);
    }
  }

  async function handleInvite() {
    if (selected.size === 0) return;

    try {
      const result = await inviteMutation.mutateAsync({
        eventId: event.id,
        data: {
          participants: Array.from(selected.values()),
        },
      });
      toast.success(`${result.invited} participante(s) convidado(s)`);
      setSelected(new Map());
      setSearch('');
      onOpenChange(false);
    } catch (error) {
      toast.error(translateError(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Convidar participantes
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="max-h-[300px]">
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              Nenhum usuário encontrado
            </div>
          ) : (
            <div className="space-y-1 p-1">
              {filteredUsers.map((u) => {
                const name = u.profile?.name
                  ? `${u.profile.name} ${u.profile.surname ?? ''}`.trim()
                  : u.username ?? u.email;
                const isSelected = selected.has(u.id);
                const entry = selected.get(u.id);

                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent"
                  >
                    <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleUser(u.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {u.email}
                        </div>
                      </div>
                    </label>
                    {isSelected && (
                      <Select
                        value={entry?.role ?? 'GUEST'}
                        onValueChange={(val) => changeRole(u.id, val as ParticipantRole)}
                      >
                        <SelectTrigger className="w-[110px] h-7 text-xs shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GUEST">Convidado</SelectItem>
                          <SelectItem value="ASSIGNEE">Responsável</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleInvite}
            disabled={selected.size === 0 || inviteMutation.isPending}
          >
            {inviteMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <UserPlus className="w-4 h-4 mr-1" />
            )}
            Convidar ({selected.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
