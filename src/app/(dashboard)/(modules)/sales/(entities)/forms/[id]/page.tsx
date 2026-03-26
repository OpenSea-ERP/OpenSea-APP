/**
 * OpenSea OS - Form Detail Page
 * Página de detalhes do formulário com preview e submissões
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
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm, useFormSubmissions } from '@/hooks/sales/use-forms';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { Form, FormField, FormSubmission } from '@/types/sales';
import { FORM_STATUS_LABELS, FORM_FIELD_TYPE_LABELS } from '@/types/sales';
import {
  Calendar,
  ClipboardList,
  Edit,
  FileText,
  Hash,
  Type,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

// ============================================================================
// INFO ROW COMPONENT
// ============================================================================

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function FormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const formId = params.id as string;

  const { data: formData, isLoading, error } = useForm(formId);
  const { data: submissionsData } = useFormSubmissions(formId);

  const form = formData?.form as Form | undefined;
  const submissions = (submissionsData?.submissions ??
    []) as unknown as FormSubmission[];

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.FORMS.ADMIN)
      ? [
          {
            id: 'edit',
            title: 'Editar Formulário',
            icon: Edit,
            onClick: () => router.push(`/sales/forms/${formId}/edit`),
            variant: 'default' as const,
          },
        ]
      : []),
  ];

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Formulários', href: '/sales/forms' },
    { label: form?.title || '...' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoading) {
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
            message="O formulário que você está procurando não existe ou foi removido."
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
  // HELPERS
  // ============================================================================

  const statusLabel = FORM_STATUS_LABELS[form.status] || form.status;
  const fields = form.fields || [];

  const createdDate = new Date(form.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const getStatusColor = () => {
    switch (form.status) {
      case 'DRAFT':
        return 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400';
      case 'PUBLISHED':
        return 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300';
      case 'ARCHIVED':
        return 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300';
      default:
        return '';
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
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
              <p className="text-sm text-muted-foreground">Formulário</p>
              <h1 className="text-xl font-bold truncate">{form.title}</h1>
              {form.description && (
                <p className="text-sm text-muted-foreground">
                  {form.description}
                </p>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getStatusColor()}`}
              >
                {statusLabel}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="submissions">Envios</TabsTrigger>
          </TabsList>

          {/* TAB: Preview (rendered fields) */}
          <TabsContent value="preview" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Preview do Formulário
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Visualização dos campos configurados
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-base font-semibold text-muted-foreground">
                      Nenhum campo configurado
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Edite o formulário para adicionar campos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields
                      .sort((a, b) => a.order - b.order)
                      .map((field: FormField) => (
                        <div
                          key={field.id}
                          className="w-full rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm font-bold">
                              {field.order}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold">
                                {field.label}
                                {field.isRequired && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {FORM_FIELD_TYPE_LABELS[field.type] ||
                                  field.type}
                              </p>
                            </div>
                            <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300">
                              {FORM_FIELD_TYPE_LABELS[field.type] || field.type}
                            </div>
                          </div>
                          {field.options && field.options.length > 0 && (
                            <div className="mt-2 pl-11">
                              <p className="text-xs text-muted-foreground">
                                Opções: {field.options.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Informações */}
          <TabsContent value="info" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Type className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Dados do Formulário
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Informações gerais
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow
                      icon={FileText}
                      label="Status"
                      value={statusLabel}
                    />
                    <InfoRow
                      icon={Hash}
                      label="Campos"
                      value={`${fields.length} campo(s)`}
                    />
                    <InfoRow
                      icon={ClipboardList}
                      label="Envios"
                      value={`${form.submissionCount} envio(s)`}
                    />
                    <InfoRow
                      icon={Calendar}
                      label="Criado em"
                      value={createdDate}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Envios */}
          <TabsContent value="submissions" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4">
                {submissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-base font-semibold text-muted-foreground">
                      Nenhum envio registrado
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Os envios aparecerão aqui quando o formulário for
                      preenchido.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((sub: FormSubmission) => (
                      <div
                        key={sub.id}
                        className="w-full rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">
                            Envio #{sub.id.substring(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sub.createdAt).toLocaleDateString(
                              'pt-BR',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </p>
                        </div>
                        <pre className="text-xs text-muted-foreground bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3 overflow-x-auto">
                          {JSON.stringify(sub.data, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </PageLayout>
  );
}
