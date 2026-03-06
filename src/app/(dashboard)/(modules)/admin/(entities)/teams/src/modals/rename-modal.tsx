'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Team } from '@/types/core';
import { Loader2, X } from 'lucide-react';
import { PiUsersThreeDuotone } from 'react-icons/pi';
import { useEffect, useState } from 'react';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team | null;
  isSubmitting: boolean;
  onSubmit: (id: string, data: { name: string }) => Promise<void>;
}

export function RenameModal({
  isOpen,
  onClose,
  team,
  isSubmitting,
  onSubmit,
}: RenameModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (team) {
      setName(team.name || '');
    }
  }, [team]);

  if (!team) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit(team.id, { name: trimmed });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-3 items-center">
              <div
                className={cn(
                  'flex items-center justify-center text-white shrink-0 p-2 rounded-lg',
                  !team.color && 'bg-linear-to-br from-blue-500 to-cyan-600'
                )}
                style={
                  team.color
                    ? {
                        background: `linear-gradient(to bottom right, ${team.color}, ${team.color}CC)`,
                      }
                    : undefined
                }
              >
                <PiUsersThreeDuotone className="h-5 w-5" />
              </div>
              Renomear Equipe
            </div>
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="team-name">Nome da Equipe</Label>
            <Input
              id="team-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Digite o nome da equipe"
              autoFocus
              maxLength={255}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
