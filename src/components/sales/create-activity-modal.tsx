/**
 * OpenSea OS - Create Activity Modal
 * Modal para criacao rapida de atividades vinculadas a um contato ou negocio
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateActivity } from '@/hooks/sales/use-activities';
import type { ActivityType, CreateActivityRequest } from '@/types/sales';
import { ACTIVITY_TYPE_LABELS } from '@/types/sales';
import { Check, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface CreateActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-filled entity link */
  dealId?: string;
  contactId?: string;
  customerId?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateActivityModal({
  open,
  onOpenChange,
  dealId,
  contactId,
  customerId,
}: CreateActivityModalProps) {
  const createMutation = useCreateActivity();

  const [type, setType] = useState<ActivityType>('NOTE');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleClose = useCallback(() => {
    setType('NOTE');
    setSubject('');
    setDescription('');
    setDueDate('');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    if (!subject.trim()) {
      toast.error('O assunto da atividade é obrigatório.');
      return;
    }

    const payload: CreateActivityRequest = {
      type,
      subject: subject.trim(),
      description: description.trim() || undefined,
      dealId: dealId || undefined,
      contactId: contactId || undefined,
      customerId: customerId || undefined,
      dueDate: dueDate || undefined,
    };

    try {
      await createMutation.mutateAsync(payload);
      toast.success('Atividade criada com sucesso!');
      handleClose();
    } catch {
      toast.error('Erro ao criar atividade.');
    }
  }, [
    type,
    subject,
    description,
    dealId,
    contactId,
    customerId,
    dueDate,
    createMutation,
    handleClose,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Atividade</DialogTitle>
          <DialogDescription>
            Registre uma atividade vinculada ao contexto atual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Type */}
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={type}
              onChange={e => setType(e.target.value as ActivityType)}
            >
              {Object.entries(ACTIVITY_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Assunto *</Label>
            <Input
              placeholder="Ex: Ligação de acompanhamento"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Detalhes da atividade..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <Label>Data prevista</Label>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!subject.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Criar Atividade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
