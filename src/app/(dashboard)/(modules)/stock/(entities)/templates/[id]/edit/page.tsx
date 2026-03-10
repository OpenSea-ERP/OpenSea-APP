/**
 * OpenSea OS - Template Edit Page
 * Página dedicada para edição de um template
 */

'use client';

import { logger } from '@/lib/logger';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { templatesService } from '@/services/stock';
import type {
  Template,
  TemplateAttributes,
  UnitOfMeasure,
} from '@/types/stock';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import Image from 'next/image';
import { GrObjectGroup } from 'react-icons/gr';
import { useParams, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
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

  const { data: template, isLoading } = useQuery<Template>({
    queryKey: ['templates', templateId],
    queryFn: async () => {
      const response = await templatesService.getTemplate(templateId);
      return response.template;
    },
  });

  const handleBack = () => {
    router.push(`/stock/templates/${templateId}`);
  };

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
    } catch (error) {
      logger.error(
        'Failed to save template',
        error instanceof Error ? error : new Error(String(error)),
        {
          templateId,
        }
      );
      toast.error('Erro ao salvar template');
      throw error;
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-12 text-center">
          <GrObjectGroup className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">
            {'Template não encontrado'}
          </h2>
          <p className="text-muted-foreground mb-6">
            O template que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6">
      {/* Header */}
      <div className="max-w-8xl flex w-full items-center justify-between mb-6">
        <PageBreadcrumb
          items={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Templates', href: '/stock/templates' },
            {
              label: template?.name || '...',
              href: `/stock/templates/${templateId}`,
            },
            { label: 'Editar', href: `/stock/templates/${templateId}/edit` },
          ]}
        />
        <Button
          size={'sm'}
          onClick={handleSaveClick}
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>

      {/* Form */}
      <div className="max-w-8xl mx-auto space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-linear-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-slate-600 to-slate-800 shadow-lg">
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
              <span className="text-2xl font-bold text-white">
                {template.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Editando template</p>
            <h1 className="text-xl font-bold">{template.name}</h1>
          </div>
        </div>

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
      </div>
    </div>
  );
}
