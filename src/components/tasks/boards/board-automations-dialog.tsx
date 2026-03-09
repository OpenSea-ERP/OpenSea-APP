'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  useAutomations,
  useCreateAutomation,
  useDeleteAutomation,
  useToggleAutomation,
} from '@/hooks/tasks/use-automations';
import type { AutomationTrigger, AutomationAction } from '@/types/tasks';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BoardAutomationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
}

const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  CARD_MOVED: 'Card movido',
  CARD_CREATED: 'Card criado',
  DUE_DATE_REACHED: 'Prazo atingido',
  LABEL_ADDED: 'Etiqueta adicionada',
};

const ACTION_LABELS: Record<AutomationAction, string> = {
  MOVE_CARD: 'Mover card',
  ASSIGN_MEMBER: 'Atribuir membro',
  ADD_LABEL: 'Adicionar etiqueta',
  SET_PRIORITY: 'Definir prioridade',
  SEND_NOTIFICATION: 'Enviar notificação',
};

export function BoardAutomationsDialog({
  open,
  onOpenChange,
  boardId,
}: BoardAutomationsDialogProps) {
  const { data: automationsData } = useAutomations(boardId);
  const createAutomation = useCreateAutomation(boardId);
  const deleteAutomation = useDeleteAutomation(boardId);
  const toggleAutomation = useToggleAutomation(boardId);

  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<AutomationTrigger>('CARD_MOVED');
  const [action, setAction] = useState<AutomationAction>('MOVE_CARD');
  const [triggerConfigJson, setTriggerConfigJson] = useState('');
  const [actionConfigJson, setActionConfigJson] = useState('');

  const automations = Array.isArray(automationsData) ? automationsData : [];

  async function handleCreate() {
    if (!name.trim()) {
      toast.error('O nome da automação é obrigatório.');
      return;
    }

    let triggerConfig: Record<string, unknown> = {};
    let actionConfig: Record<string, unknown> = {};

    if (triggerConfigJson.trim()) {
      try {
        triggerConfig = JSON.parse(triggerConfigJson);
      } catch {
        toast.error('Configuração do gatilho inválida (JSON).');
        return;
      }
    }

    if (actionConfigJson.trim()) {
      try {
        actionConfig = JSON.parse(actionConfigJson);
      } catch {
        toast.error('Configuração da ação inválida (JSON).');
        return;
      }
    }

    try {
      await createAutomation.mutateAsync({
        name: name.trim(),
        trigger,
        triggerConfig,
        action,
        actionConfig,
        isActive: true,
      });
      setName('');
      setTriggerConfigJson('');
      setActionConfigJson('');
      toast.success('Automação criada!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao criar automação.';
      toast.error(message);
    }
  }

  async function handleToggle(automationId: string) {
    try {
      await toggleAutomation.mutateAsync(automationId);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao alterar automação.';
      toast.error(message);
    }
  }

  async function handleDelete(automationId: string) {
    try {
      await deleteAutomation.mutateAsync(automationId);
      toast.success('Automação removida!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao remover automação.';
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Automações do Quadro</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current automations */}
          <div className="space-y-2">
            {automations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma automação configurada.
              </p>
            ) : (
              automations.map(automation => (
                <div
                  key={automation.id}
                  className="flex items-start gap-3 rounded-md border px-3 py-3"
                >
                  <Zap className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium">{automation.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">
                        {
                          TRIGGER_LABELS[
                            automation.trigger as AutomationTrigger
                          ]
                        }
                      </Badge>
                      <span className="text-xs text-muted-foreground">→</span>
                      <Badge variant="outline" className="text-[10px]">
                        {ACTION_LABELS[automation.action as AutomationAction]}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={automation.isActive}
                      onCheckedChange={() => handleToggle(automation.id)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(automation.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create automation */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Nova automação
            </h3>

            <div className="space-y-3">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  placeholder="Ex: Mover para concluido"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              {/* Gatilho */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Gatilho</label>
                <Select
                  value={trigger}
                  onValueChange={v => setTrigger(v as AutomationTrigger)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(TRIGGER_LABELS) as [
                        AutomationTrigger,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Acao */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Acao</label>
                <Select
                  value={action}
                  onValueChange={v => setAction(v as AutomationAction)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(ACTION_LABELS) as [
                        AutomationAction,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Trigger config */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Configuração do gatilho{' '}
                  <span className="text-muted-foreground font-normal">
                    (JSON, opcional)
                  </span>
                </label>
                <Input
                  placeholder='{"columnId": "..."}'
                  value={triggerConfigJson}
                  onChange={e => setTriggerConfigJson(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              {/* Action config */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Configuração da ação{' '}
                  <span className="text-muted-foreground font-normal">
                    (JSON, opcional)
                  </span>
                </label>
                <Input
                  placeholder='{"targetColumnId": "..."}'
                  value={actionConfigJson}
                  onChange={e => setActionConfigJson(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={createAutomation.isPending || !name.trim()}
                size="sm"
              >
                {createAutomation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Criar Automação
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
