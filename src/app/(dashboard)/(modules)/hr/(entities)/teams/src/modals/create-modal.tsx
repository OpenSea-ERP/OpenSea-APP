/**
 * HR Create Team Modal
 * Modal para criar nova equipe no contexto HR
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
import { Textarea } from '@/components/ui/textarea';
import { useFormErrorHandler } from '@/hooks/use-form-error-handler';
import { showSuccessToast } from '@/lib/toast-utils';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createTeam } from '../utils/teams.crud';

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#06B6D4', // cyan
  '#10B981', // emerald
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#F97316', // orange
  '#14B8A6', // teal
  '#6366F1', // indigo
];

interface CreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');

  const form = useForm<{ name: string; description: string }>({
    defaultValues: { name: '', description: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const { handleError } = useFormErrorHandler({
    form,
    fieldMap: {
      'name already exists': 'name',
      'already exists': 'name',
    },
  });

  const handleSubmit = async (data: { name: string; description: string }) => {
    setIsLoading(true);
    try {
      await createTeam({
        name: data.name,
        description: data.description || null,
        color: selectedColor || null,
      });
      showSuccessToast('Equipe criada com sucesso');
      onSuccess();
      onOpenChange(false);
      form.reset();
      setSelectedColor('');
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Equipe</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar uma nova equipe
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-4 py-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="hr-team-name">Nome *</Label>
              <div className="relative">
                <Input
                  id="hr-team-name"
                  placeholder="Ex: Equipe de Vendas"
                  aria-invalid={!!form.formState.errors.name}
                  {...form.register('name', {
                    required: 'Nome é obrigatório',
                  })}
                />
                {form.formState.errors.name && (
                  <FormErrorIcon
                    message={form.formState.errors.name.message ?? ''}
                  />
                )}
              </div>
            </div>

            {/* Descricao */}
            <div className="space-y-2">
              <Label htmlFor="hr-team-description">Descrição</Label>
              <Textarea
                id="hr-team-description"
                placeholder="Descreva a equipe..."
                rows={3}
                {...form.register('description')}
              />
            </div>

            {/* Cor */}
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded-full border-2 transition-all cursor-pointer"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        selectedColor === color ? 'white' : 'transparent',
                      boxShadow:
                        selectedColor === color ? `0 0 0 2px ${color}` : 'none',
                    }}
                    onClick={() =>
                      setSelectedColor(selectedColor === color ? '' : color)
                    }
                  />
                ))}
              </div>
              {selectedColor && (
                <p className="text-xs text-muted-foreground">
                  Cor selecionada: {selectedColor}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Equipe'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
