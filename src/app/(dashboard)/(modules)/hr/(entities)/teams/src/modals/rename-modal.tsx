/**
 * HR Rename Team Modal
 * Modal para renomear uma equipe no contexto HR
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Team } from '@/types/core';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

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
  const form = useForm<{ name: string }>({
    defaultValues: { name: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (team) {
      form.reset({ name: team.name });
    }
  }, [team, form]);

  const handleSubmit = async (data: { name: string }) => {
    if (!team) return;
    await onSubmit(team.id, data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Renomear Equipe</DialogTitle>
          <DialogDescription>
            Insira o novo nome para a equipe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-team-name">Nome *</Label>
              <div className="relative">
                <Input
                  id="rename-team-name"
                  placeholder="Nome da equipe"
                  aria-invalid={!!form.formState.errors.name}
                  {...form.register('name', {
                    required: 'Nome é obrigatório',
                  })}
                  autoFocus
                />
                {form.formState.errors.name && (
                  <FormErrorIcon
                    message={form.formState.errors.name.message ?? ''}
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
