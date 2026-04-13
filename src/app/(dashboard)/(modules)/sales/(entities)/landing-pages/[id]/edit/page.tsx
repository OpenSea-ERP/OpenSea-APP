'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useLandingPage,
  useUpdateLandingPage,
  useDeleteLandingPage,
} from '@/hooks/sales/use-landing-pages';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { ApiError } from '@/lib/errors/api-error';
import { translateError } from '@/lib/error-messages';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  Globe,
  Trash2,
  Save,
  Loader2,
  Plus,
} from 'lucide-react';

interface SectionEdit {
  tempId: string;
  type: string;
  title: string;
  content: string;
  ctaText: string;
  ctaLink: string;
  position: number;
}

let sectionIdCounter = 0;

function LandingPageEditContent() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;

  const { hasPermission } = usePermissions();
  const canAdmin = hasPermission(SALES_PERMISSIONS.LANDING_PAGES.ADMIN);

  const { data, isLoading, isError } = useLandingPage(pageId);
  const updatePage = useUpdateLandingPage();
  const deletePage = useDeleteLandingPage();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<SectionEdit[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data?.landingPage) {
      const lp = data.landingPage;
      setTitle(lp.title);
      setSlug(lp.slug);
      setDescription(lp.description || '');
      const sorted = [...(lp.sections ?? [])].sort(
        (a, b) => a.position - b.position
      );
      setSections(
        sorted.map(s => ({
          tempId: `existing-${s.id}`,
          type: s.type,
          title: s.title || '',
          content: s.content || '',
          ctaText: s.ctaText || '',
          ctaLink: s.ctaLink || '',
          position: s.position,
        }))
      );
    }
  }, [data?.landingPage]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      await updatePage.mutateAsync({
        id: pageId,
        data: {
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          sections: sections.map((s, idx) => ({
            type: s.type as
              | 'HERO'
              | 'FEATURES'
              | 'CTA'
              | 'FORM'
              | 'TESTIMONIALS'
              | 'CUSTOM',
            title: s.title || undefined,
            content: s.content || undefined,
            ctaText: s.ctaText || undefined,
            ctaLink: s.ctaLink || undefined,
            position: idx,
          })),
        },
      });

      toast.success('Página atualizada com sucesso!');
      router.push(`/sales/landing-pages/${pageId}`);
    } catch (err) {
      const apiError = ApiError.from(err);
      toast.error(translateError(apiError.message));
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    pageId,
    title,
    slug,
    description,
    sections,
    updatePage,
    router,
  ]);

  function handleDelete() {
    deletePage.mutate(pageId, {
      onSuccess: () => {
        toast.success('Página excluída com sucesso.');
        router.push('/sales/landing-pages');
      },
      onError: () => {
        toast.error('Erro ao excluir página.');
      },
    });
  }

  function addSection() {
    sectionIdCounter += 1;
    setSections(prev => [
      ...prev,
      {
        tempId: `new-${sectionIdCounter}`,
        type: 'CUSTOM',
        title: '',
        content: '',
        ctaText: '',
        ctaLink: '',
        position: prev.length,
      },
    ]);
  }

  function removeSection(tempId: string) {
    setSections(prev => prev.filter(s => s.tempId !== tempId));
  }

  function updateSection(
    tempId: string,
    field: keyof SectionEdit,
    value: string
  ) {
    setSections(prev =>
      prev.map(s => (s.tempId === tempId ? { ...s, [field]: value } : s))
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data?.landingPage) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold">Página não encontrada</h2>
        <Link href="/sales/landing-pages">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Páginas
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="landing-page-edit">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Vendas', href: '/sales' },
          { label: 'Páginas de Captura', href: '/sales/landing-pages' },
          {
            label: data.landingPage.title,
            href: `/sales/landing-pages/${pageId}`,
          },
          { label: 'Editar' },
        ]}
        buttons={[
          ...(canAdmin
            ? [
                {
                  id: 'delete',
                  title: 'Excluir',
                  icon: Trash2,
                  variant: 'destructive' as const,
                  onClick: () => setShowDeleteModal(true),
                },
              ]
            : []),
          {
            id: 'save',
            title: 'Salvar',
            icon: isSaving ? Loader2 : Save,
            variant: 'default' as const,
            onClick: handleSave,
            disabled: isSaving || !title.trim() || !slug.trim(),
          },
        ]}
      />

      {/* Identity Card */}
      <Card className="bg-white/5 p-5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-500/10">
            <Globe className="h-6 w-6 text-sky-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Editar Página de Captura</h1>
            <p className="text-sm text-muted-foreground">
              Criada em{' '}
              {new Date(data.landingPage.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </Card>

      {/* Form Card */}
      <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Título da página"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input
                value={slug}
                onChange={e =>
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '-')
                      .replace(/-+/g, '-')
                  )
                }
                placeholder="slug-da-pagina"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descrição da página"
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Sections Editor */}
      <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
        <h2 className="text-base font-semibold mb-4">Editor de Seções</h2>

        <div className="space-y-4">
          {sections.map((section, idx) => (
            <div
              key={section.tempId}
              className="border border-border rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Seção {idx + 1}</h4>
                {sections.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400"
                    onClick={() => removeSection(section.tempId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Título</Label>
                <Input
                  value={section.title}
                  onChange={e =>
                    updateSection(section.tempId, 'title', e.target.value)
                  }
                  placeholder="Título da seção"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Conteúdo</Label>
                <Textarea
                  value={section.content}
                  onChange={e =>
                    updateSection(section.tempId, 'content', e.target.value)
                  }
                  placeholder="Texto da seção..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Texto do CTA</Label>
                  <Input
                    value={section.ctaText}
                    onChange={e =>
                      updateSection(section.tempId, 'ctaText', e.target.value)
                    }
                    placeholder="Ex: Saiba Mais"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Link do CTA</Label>
                  <Input
                    value={section.ctaLink}
                    onChange={e =>
                      updateSection(section.tempId, 'ctaLink', e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={addSection}
          >
            <Plus className="h-4 w-4" />
            Adicionar Seção
          </Button>
        </div>
      </Card>

      {/* Delete Modal */}
      <VerifyActionPinModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDelete}
        title="Confirmar Exclusão"
        description={`Digite seu PIN de ação para excluir a página "${data.landingPage.title}".`}
      />
    </div>
  );
}

export default function LandingPageEditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <LandingPageEditContent />
    </Suspense>
  );
}
