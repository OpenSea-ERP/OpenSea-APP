/**
 * OpenSea OS - Template Edit Page
 * Página dedicada para edição de um template
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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { logger } from '@/lib/logger';
import { templatesService } from '@/services/stock';
import type {
  Template,
  TemplateAttributes,
  UnitOfMeasure,
} from '@/types/stock';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { GrObjectGroup } from 'react-icons/gr';
import { toast } from 'sonner';
import {
  TemplateForm,
  type TemplateFormRef,
} from '../../src/components/template-form';

export default function TemplateEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const templateId = params.id as string;
  const formRef = useRef<TemplateFormRef>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: template,
    isLoading,
    error,
  } = useQuery<Template>({
    queryKey: ['templates', templateId],
    queryFn: async () => {
      const response = await templatesService.getTemplate(templateId);
      return response.template;
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSave = async (data: {
    name: string;
    iconUrl?: string;
    unitOfMeasure: UnitOfMeasure;
    productAttributes: Record<string, unknown>;
    variantAttributes: Record<string, unknown>;
    itemAttributes: Record<string, unknown>;
    specialModules?: string[];
  }) => {
    try {
      setIsSaving(true);
      await templatesService.updateTemplate(templateId, {
        name: data.name,
        iconUrl: data.iconUrl,
        unitOfMeasure: data.unitOfMeasure,
        productAttributes: data.productAttributes as TemplateAttributes,
        variantAttributes: data.variantAttributes as TemplateAttributes,
        itemAttributes: data.itemAttributes as TemplateAttributes,
        specialModules: data.specialModules,
      });
      await queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template atualizado com sucesso!');
      router.push(`/stock/templates/${templateId}`);
    } catch (err) {
      logger.error(
        'Failed to save template',
        err instanceof Error ? err : new Error(String(err)),
        { templateId }
      );
      toast.error('Erro ao salvar template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (formRef.current) {
      const data = formRef.current.getData();
      handleSave(data);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await templatesService.deleteTemplate(templateId);
      await queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template excluído com sucesso!');
      router.push('/stock/templates');
    } catch (err) {
      logger.error(
        'Failed to delete template',
        err instanceof Error ? err : new Error(String(err)),
        { templateId }
      );
      toast.error('Erro ao excluir template');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  // ============================================================================
  // ACTION BAR BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'delete',
      title: 'Excluir',
      icon: Trash2,
      onClick: () => setDeleteModalOpen(true),
      variant: 'default',
      className:
        'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
      disabled: isDeleting,
    },
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar alterações',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSaveClick,
      variant: 'default',
      disabled: isSaving,
    },
  ];

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Templates', href: '/stock/templates' },
              { label: '...' },
              { label: 'Editar' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error || !template) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Templates', href: '/stock/templates' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Template não encontrado"
            message="O template que você está procurando não existe ou foi removido."
            action={{
              label: 'Voltar para Templates',
              onClick: () => router.push('/stock/templates'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const formattedDate = new Date(template.createdAt).toLocaleDateString(
    'pt-BR',
    { day: '2-digit', month: 'long', year: 'numeric' }
  );

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Templates', href: '/stock/templates' },
            {
              label: template.name,
              href: `/stock/templates/${templateId}`,
            },
            { label: 'Editar' },
          ]}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-pink-600 shadow-lg">
              {template.iconUrl ? (
                <Image
                  src={template.iconUrl}
                  alt={template.name}
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain brightness-0 invert"
                  unoptimized
                />
              ) : (
                <GrObjectGroup className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando template</p>
              <h1 className="text-xl font-bold truncate">{template.name}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0 rounded-lg bg-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-xs font-semibold">Status</p>
                <p className="text-[11px] text-muted-foreground">{template.isActive ? 'Ativo' : 'Inativo'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Template Form */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <TemplateForm
            ref={formRef}
            template={template}
            onSubmit={async data => {
              await handleSave({
                name: data.name,
                iconUrl: data.iconUrl,
                unitOfMeasure: data.unitOfMeasure,
                productAttributes: data.productAttributes || {},
                variantAttributes: data.variantAttributes || {},
                itemAttributes: data.itemAttributes || {},
                specialModules: data.specialModules,
              });
            }}
          />
        </Card>
      </PageBody>

      {/* Delete Confirmation */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDelete}
        title="Excluir Template"
        description={`Digite seu PIN de ação para excluir o template "${template.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
