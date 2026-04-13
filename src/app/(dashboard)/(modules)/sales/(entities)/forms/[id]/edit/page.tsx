/**
 * OpenSea OS - Edit Form Page
 * Página de edição do formulário com editor de campos
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useForm as useFormData,
  useUpdateForm,
  useDeleteForm,
} from '@/hooks/sales/use-forms';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type { Form, FormFieldType } from '@/types/sales';
import { FORM_FIELD_TYPE_LABELS } from '@/types/sales';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Loader2, Plus, Save, Trash2, Type, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// =============================================================================
// FIELD ROW
// =============================================================================

interface FieldRow {
  label: string;
  type: FormFieldType;
  isRequired: boolean;
  order: number;
  options?: string[];
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditFormPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const formId = params.id as string;

  const {
    data: formData,
    isLoading: isLoadingForm,
    error,
  } = useFormData(formId);

  const form = formData?.form as Form | undefined;

  const updateMutation = useUpdateForm();
  const deleteMutation = useDeleteForm();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FieldRow[]>([]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (form) {
      setTitle(form.title || '');
      setDescription(form.description || '');
      setFields(
        (form.fields ?? []).map(f => ({
          label: f.label,
          type: f.type,
          isRequired: f.isRequired,
          order: f.order,
          options: f.options,
        }))
      );
    }
  }, [form]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAddField = () => {
    setFields(prev => [
      ...prev,
      {
        label: '',
        type: 'TEXT' as FormFieldType,
        isRequired: false,
        order: prev.length + 1,
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setFields(prev =>
      prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i + 1 }))
    );
  };

  const handleFieldChange = (
    index: number,
    key: keyof FieldRow,
    value: unknown
  ) => {
    setFields(prev =>
      prev.map((f, i) => (i === index ? { ...f, [key]: value } : f))
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        id: formId,
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          fields: fields.map(f => ({
            label: f.label,
            type: f.type,
            isRequired: f.isRequired,
            order: f.order,
            options: f.options,
          })),
        } as unknown as Record<string, unknown>,
      });

      toast.success('Formulário atualizado com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['forms', formId],
      });
      router.push(`/sales/forms/${formId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar formulário',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar formulário', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(formId);
      toast.success('Formulário excluído com sucesso!');
      router.push('/sales/forms');
    } catch (err) {
      logger.error(
        'Erro ao deletar formulário',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar formulário', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.FORMS.ADMIN)
      ? [
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash2,
            onClick: () => setDeleteModalOpen(true),
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving || !title.trim(),
    },
  ];

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Formulários', href: '/sales/forms' },
    { label: form?.title || '...', href: `/sales/forms/${formId}` },
    { label: 'Editar' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoadingForm) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !form) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Formulário não encontrado"
            message="O formulário solicitado não foi encontrado."
            action={{
              label: 'Voltar para Formulários',
              onClick: () => router.push('/sales/forms'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="form-edit">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-emerald-500 to-teal-600">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando formulário
              </p>
              <h1 className="text-xl font-bold truncate">{form.title}</h1>
            </div>
          </div>
        </Card>

        {/* Form Card: Dados Básicos */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Type}
                title="Dados do Formulário"
                subtitle="Informações básicas de identificação"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">
                    Título <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Título do formulário"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descrição do formulário..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Campos */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={FileText}
                title="Campos do Formulário"
                subtitle="Configure os campos que serão exibidos"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-white dark:bg-slate-800/40"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm font-bold mt-1">
                      {field.order}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Input
                          placeholder="Label do campo"
                          value={field.label}
                          onChange={e =>
                            handleFieldChange(index, 'label', e.target.value)
                          }
                        />
                        <Select
                          value={field.type}
                          onValueChange={v =>
                            handleFieldChange(index, 'type', v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(FORM_FIELD_TYPE_LABELS).map(
                              ([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.isRequired}
                            onCheckedChange={v =>
                              handleFieldChange(index, 'isRequired', v)
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            Obrigatório
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(index)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 mt-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddField}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Campo
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Formulário"
        description={`Digite seu PIN de ação para excluir o formulário "${form.title}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
