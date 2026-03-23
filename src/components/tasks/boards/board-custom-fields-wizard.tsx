'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import type { CustomField, CustomFieldType } from '@/types/tasks';
import { toast } from 'sonner';
import {
  Settings2,
  Pencil,
  Trash2,
  Plus,
  Asterisk,
  ArrowLeft,
  Loader2,
  TextCursorInput,
  Hash,
  Link2,
  Mail,
  CheckSquare,
  CalendarDays,
  List,
  ListChecks,
  LayoutList,
} from 'lucide-react';

interface BoardCustomFieldsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
}

type ViewMode = 'list' | 'form';

interface FieldFormData {
  name: string;
  type: CustomFieldType;
  isRequired: boolean;
  options: string[];
  optionInput: string;
}

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  TEXT: 'Texto',
  NUMBER: 'N\u00famero',
  URL: 'URL',
  EMAIL: 'Email',
  CHECKBOX: 'Caixa de sele\u00e7\u00e3o',
  DATE: 'Data',
  SELECT: 'Sele\u00e7\u00e3o \u00fanica',
  MULTI_SELECT: 'Sele\u00e7\u00e3o m\u00faltipla',
};

const FIELD_TYPE_ICONS: Record<CustomFieldType, React.ReactNode> = {
  TEXT: <TextCursorInput className="h-3.5 w-3.5" />,
  NUMBER: <Hash className="h-3.5 w-3.5" />,
  URL: <Link2 className="h-3.5 w-3.5" />,
  EMAIL: <Mail className="h-3.5 w-3.5" />,
  CHECKBOX: <CheckSquare className="h-3.5 w-3.5" />,
  DATE: <CalendarDays className="h-3.5 w-3.5" />,
  SELECT: <List className="h-3.5 w-3.5" />,
  MULTI_SELECT: <ListChecks className="h-3.5 w-3.5" />,
};

const FIELD_TYPE_COLORS: Record<CustomFieldType, string> = {
  TEXT: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/8 dark:text-sky-300 dark:border-sky-500/20',
  NUMBER:
    'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/8 dark:text-violet-300 dark:border-violet-500/20',
  URL: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/8 dark:text-teal-300 dark:border-teal-500/20',
  EMAIL:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/8 dark:text-emerald-300 dark:border-emerald-500/20',
  CHECKBOX:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/8 dark:text-amber-300 dark:border-amber-500/20',
  DATE: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/8 dark:text-indigo-300 dark:border-indigo-500/20',
  SELECT:
    'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/8 dark:text-orange-300 dark:border-orange-500/20',
  MULTI_SELECT:
    'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-500/8 dark:text-pink-300 dark:border-pink-500/20',
};

function isSelectType(type: CustomFieldType): boolean {
  return type === 'SELECT' || type === 'MULTI_SELECT';
}

const EMPTY_FORM: FieldFormData = {
  name: '',
  type: 'TEXT',
  isRequired: false,
  options: [],
  optionInput: '',
};

export function BoardCustomFieldsWizard({
  open,
  onOpenChange,
  boardId,
}: BoardCustomFieldsWizardProps) {
  const { data: fieldsData } = useCustomFields(boardId);
  const createField = useCreateCustomField(boardId);
  const updateField = useUpdateCustomField(boardId);
  const deleteField = useDeleteCustomField(boardId);

  const [view, setView] = useState<ViewMode>('list');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [form, setForm] = useState<FieldFormData>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fields: CustomField[] = Array.isArray(fieldsData) ? fieldsData : [];

  const resetAndGoToList = useCallback(() => {
    setView('list');
    setEditingFieldId(null);
    setForm(EMPTY_FORM);
  }, []);

  function handleOpenChange(open: boolean) {
    if (!open) {
      resetAndGoToList();
    }
    onOpenChange(open);
  }

  function handleNewField() {
    setEditingFieldId(null);
    setForm(EMPTY_FORM);
    setView('form');
  }

  function handleEditField(field: CustomField) {
    setEditingFieldId(field.id);
    setForm({
      name: field.name,
      type: field.type,
      isRequired: field.isRequired,
      options: field.options ?? [],
      optionInput: '',
    });
    setView('form');
  }

  async function handleDeleteField(fieldId: string) {
    setDeletingId(fieldId);
    try {
      await deleteField.mutateAsync(fieldId);
      toast.success('Campo removido com sucesso.');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao remover campo.';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  }

  function handleAddOption() {
    const value = form.optionInput.trim();
    if (!value) return;
    if (form.options.includes(value)) {
      toast.error('Esta op\u00e7\u00e3o j\u00e1 existe.');
      return;
    }
    setForm(prev => ({
      ...prev,
      options: [...prev.options, value],
      optionInput: '',
    }));
  }

  function handleRemoveOption(index: number) {
    setForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('O nome do campo \u00e9 obrigat\u00f3rio.');
      return;
    }

    if (isSelectType(form.type) && form.options.length === 0) {
      toast.error(
        'Adicione pelo menos uma op\u00e7\u00e3o para campos de sele\u00e7\u00e3o.'
      );
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      isRequired: form.isRequired,
      options: isSelectType(form.type) ? form.options : undefined,
    };

    try {
      if (editingFieldId) {
        await updateField.mutateAsync({
          fieldId: editingFieldId,
          data: payload,
        });
        toast.success('Campo atualizado com sucesso.');
      } else {
        await createField.mutateAsync(payload);
        toast.success('Campo criado com sucesso.');
      }
      resetAndGoToList();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar campo.';
      toast.error(message);
    }
  }

  const isSaving = createField.isPending || updateField.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            {view === 'form' && (
              <button
                type="button"
                onClick={resetAndGoToList}
                className="p-1 rounded-md hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/10">
              <Settings2 className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {view === 'list'
                  ? 'Campos Personalizados'
                  : editingFieldId
                    ? 'Editar Campo'
                    : 'Novo Campo'}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {view === 'list'
                  ? 'Gerencie os campos personalizados deste quadro'
                  : editingFieldId
                    ? 'Altere as propriedades do campo'
                    : 'Configure o novo campo personalizado'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ───── List View ───── */}
        {view === 'list' && (
          <>
            <div className="flex-1 overflow-y-auto -mx-6 px-6">
              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5">
                    <LayoutList className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nenhum campo personalizado
                  </p>
                  <p className="text-xs text-muted-foreground/70 text-center max-w-xs">
                    Campos personalizados permitem adicionar
                    informa\u00e7\u00f5es extras aos cart\u00f5es deste quadro.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {fields.map(field => (
                    <div
                      key={field.id}
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-white dark:bg-slate-800/60 px-3 py-2.5 group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    >
                      {/* Icon */}
                      <span className="text-muted-foreground shrink-0">
                        {FIELD_TYPE_ICONS[field.type]}
                      </span>

                      {/* Name */}
                      <span className="text-sm font-medium flex-1 truncate">
                        {field.name}
                      </span>

                      {/* Required */}
                      {field.isRequired && (
                        <Asterisk className="h-3 w-3 text-rose-500 shrink-0" />
                      )}

                      {/* Type badge */}
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0.5 font-medium ${FIELD_TYPE_COLORS[field.type]}`}
                      >
                        {FIELD_TYPE_LABELS[field.type]}
                      </Badge>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleEditField(field)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          disabled={deletingId === field.id}
                          onClick={() => handleDeleteField(field.id)}
                        >
                          {deletingId === field.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                size="sm"
                className="h-9 gap-1.5 w-full sm:w-auto"
                onClick={handleNewField}
              >
                <Plus className="h-4 w-4" />
                Novo campo
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ───── Form View (Create / Edit) ───── */}
        {view === 'form' && (
          <>
            <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="cf-name" className="text-sm font-medium">
                  Nome
                </label>
                <Input
                  id="cf-name"
                  placeholder="Ex: Estimativa de horas"
                  value={form.name}
                  onChange={e =>
                    setForm(prev => ({ ...prev, name: e.target.value }))
                  }
                  autoFocus
                />
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label htmlFor="cf-type" className="text-sm font-medium">
                  Tipo
                </label>
                <Select
                  value={form.type}
                  onValueChange={v =>
                    setForm(prev => ({
                      ...prev,
                      type: v as CustomFieldType,
                      // Clear options when switching away from select types
                      options: isSelectType(v as CustomFieldType)
                        ? prev.options
                        : [],
                    }))
                  }
                >
                  <SelectTrigger className="h-10">
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
                        <span className="flex items-center gap-2">
                          {FIELD_TYPE_ICONS[value]}
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Required */}
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">Obrigat\u00f3rio</p>
                  <p className="text-xs text-muted-foreground">
                    Exigir preenchimento deste campo
                  </p>
                </div>
                <Switch
                  checked={form.isRequired}
                  onCheckedChange={checked =>
                    setForm(prev => ({ ...prev, isRequired: checked }))
                  }
                />
              </div>

              {/* Options (SELECT / MULTI_SELECT) */}
              {isSelectType(form.type) && (
                <div className="space-y-2.5">
                  <label className="text-sm font-medium">
                    Op\u00e7\u00f5es
                  </label>

                  {/* Existing options */}
                  {form.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.options.map((opt, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-white/10 px-2 py-1 text-xs font-medium"
                        >
                          {opt}
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(index)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add option */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Digite uma op\u00e7\u00e3o..."
                      value={form.optionInput}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          optionInput: e.target.value,
                        }))
                      }
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 shrink-0"
                      onClick={handleAddOption}
                      disabled={!form.optionInput.trim()}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pressione Enter ou clique em Adicionar para incluir cada
                    op\u00e7\u00e3o.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={resetAndGoToList}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="h-9 gap-1.5"
                onClick={handleSave}
                disabled={isSaving || !form.name.trim()}
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingFieldId ? 'Salvar altera\u00e7\u00f5es' : 'Criar campo'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
