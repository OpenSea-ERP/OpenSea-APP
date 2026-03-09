'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  useCustomFields,
  useCreateCustomField,
  useUpdateCustomField,
  useDeleteCustomField,
} from '@/hooks/tasks/use-custom-fields';
import type { CustomFieldType } from '@/types/tasks';
import { toast } from 'sonner';
import {
  Loader2,
  Pencil,
  Trash2,
  Check,
  X,
  Plus,
  Asterisk,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BoardCustomFieldsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
}

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  TEXT: 'Texto',
  NUMBER: 'Número',
  DATE: 'Data',
  SELECT: 'Seleção',
  MULTI_SELECT: 'Seleção múltipla',
  CHECKBOX: 'Checkbox',
  URL: 'URL',
  EMAIL: 'E-mail',
};

function isSelectType(type: CustomFieldType): boolean {
  return type === 'SELECT' || type === 'MULTI_SELECT';
}

export function BoardCustomFieldsDialog({
  open,
  onOpenChange,
  boardId,
}: BoardCustomFieldsDialogProps) {
  const { data: fieldsData } = useCustomFields(boardId);
  const createField = useCreateCustomField(boardId);
  const updateField = useUpdateCustomField(boardId);
  const deleteField = useDeleteCustomField(boardId);

  // Create form
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CustomFieldType>('TEXT');
  const [newOptions, setNewOptions] = useState('');
  const [newRequired, setNewRequired] = useState(false);

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState<CustomFieldType>('TEXT');
  const [editingOptions, setEditingOptions] = useState('');
  const [editingRequired, setEditingRequired] = useState(false);

  const fields = Array.isArray(fieldsData) ? fieldsData : [];

  async function handleCreate() {
    if (!newName.trim()) {
      toast.error('O nome do campo é obrigatório.');
      return;
    }

    const options =
      isSelectType(newType) && newOptions.trim()
        ? newOptions
            .split(',')
            .map(o => o.trim())
            .filter(Boolean)
        : undefined;

    try {
      await createField.mutateAsync({
        name: newName.trim(),
        type: newType,
        options,
        isRequired: newRequired,
      });
      setNewName('');
      setNewOptions('');
      setNewRequired(false);
      toast.success('Campo criado!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao criar campo.';
      toast.error(message);
    }
  }

  function startEditing(field: {
    id: string;
    name: string;
    type: CustomFieldType;
    options: string[] | null;
    isRequired: boolean;
  }) {
    setEditingId(field.id);
    setEditingName(field.name);
    setEditingType(field.type);
    setEditingOptions(field.options?.join(', ') ?? '');
    setEditingRequired(field.isRequired);
  }

  async function handleUpdate(fieldId: string) {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }

    const options =
      isSelectType(editingType) && editingOptions.trim()
        ? editingOptions
            .split(',')
            .map(o => o.trim())
            .filter(Boolean)
        : undefined;

    try {
      await updateField.mutateAsync({
        fieldId,
        data: {
          name: editingName.trim(),
          type: editingType,
          options,
          isRequired: editingRequired,
        },
      });
      setEditingId(null);
      toast.success('Campo atualizado!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao atualizar campo.';
      toast.error(message);
    }
  }

  async function handleDelete(fieldId: string) {
    try {
      await deleteField.mutateAsync(fieldId);
      toast.success('Campo removido!');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao remover campo.';
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campos Personalizados</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current fields */}
          <div className="space-y-2">
            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum campo personalizado criado.
              </p>
            ) : (
              fields.map(field => (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <span className="text-sm font-medium flex-1">
                      {field.name}
                    </span>

                    <Badge variant="secondary" className="text-[10px]">
                      {FIELD_TYPE_LABELS[field.type as CustomFieldType]}
                    </Badge>

                    {field.isRequired && (
                      <Asterisk className="h-3 w-3 text-red-500 shrink-0" />
                    )}

                    {editingId !== field.id && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => startEditing(field)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(field.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Inline edit */}
                  {editingId === field.id && (
                    <div className="space-y-2 rounded-md border border-dashed p-3">
                      <Input
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Nome do campo"
                        autoFocus
                      />

                      <Select
                        value={editingType}
                        onValueChange={v =>
                          setEditingType(v as CustomFieldType)
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.entries(FIELD_TYPE_LABELS) as [
                              CustomFieldType,
                              string,
                            ][]
                          ).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {isSelectType(editingType) && (
                        <Input
                          value={editingOptions}
                          onChange={e => setEditingOptions(e.target.value)}
                          className="h-8 text-sm"
                          placeholder="Opções separadas por vírgula"
                        />
                      )}

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-required-${field.id}`}
                          checked={editingRequired}
                          onCheckedChange={v => setEditingRequired(v === true)}
                        />
                        <label
                          htmlFor={`edit-required-${field.id}`}
                          className="text-sm"
                        >
                          Obrigatório
                        </label>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleUpdate(field.id)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Create field */}
          <div className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Novo campo
            </h3>

            <div className="space-y-3">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nome</label>
                <Input
                  placeholder="Ex: Estimativa de horas"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>

              {/* Tipo */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tipo</label>
                <Select
                  value={newType}
                  onValueChange={v => setNewType(v as CustomFieldType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(FIELD_TYPE_LABELS) as [
                        CustomFieldType,
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

              {/* Opções (only for SELECT/MULTI_SELECT) */}
              {isSelectType(newType) && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Opções</label>
                  <Input
                    placeholder="Opção 1, Opção 2, Opção 3"
                    value={newOptions}
                    onChange={e => setNewOptions(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separe as opções por vírgula.
                  </p>
                </div>
              )}

              {/* Obrigatório */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="new-field-required"
                  checked={newRequired}
                  onCheckedChange={v => setNewRequired(v === true)}
                />
                <label htmlFor="new-field-required" className="text-sm">
                  Obrigatório
                </label>
              </div>

              <Button
                onClick={handleCreate}
                disabled={createField.isPending || !newName.trim()}
                size="sm"
              >
                {createField.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Criar Campo
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
