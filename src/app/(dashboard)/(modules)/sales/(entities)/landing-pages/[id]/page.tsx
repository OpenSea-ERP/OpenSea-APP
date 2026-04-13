'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useLandingPage,
  usePublishLandingPage,
  useUnpublishLandingPage,
} from '@/hooks/sales/use-landing-pages';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  Globe,
  Pencil,
  Eye,
  FileText,
  Layout,
  Send,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import type { LandingPageStatus } from '@/types/sales';
import {
  LANDING_PAGE_STATUS_LABELS,
  LANDING_PAGE_TEMPLATE_LABELS,
} from '@/types/sales';

const STATUS_COLORS: Record<LandingPageStatus, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
  PUBLISHED:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
  ARCHIVED:
    'bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400',
};

function LandingPageDetailContent() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.id as string;

  const { hasPermission } = usePermissions();
  const canAdmin = hasPermission(SALES_PERMISSIONS.LANDING_PAGES.ADMIN);

  const { data, isLoading, isError } = useLandingPage(pageId);
  const publishPage = usePublishLandingPage();
  const unpublishPage = useUnpublishLandingPage();

  const landingPage = data?.landingPage;

  function handlePublish() {
    publishPage.mutate(pageId, {
      onSuccess: () => toast.success('Página publicada com sucesso!'),
      onError: () => toast.error('Erro ao publicar página.'),
    });
  }

  function handleUnpublish() {
    unpublishPage.mutate(pageId, {
      onSuccess: () => toast.success('Página despublicada com sucesso.'),
      onError: () => toast.error('Erro ao despublicar página.'),
    });
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

  if (isError || !landingPage) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold">
          Página de captura não encontrada
        </h2>
        <Link href="/sales/landing-pages">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Páginas
          </Button>
        </Link>
      </div>
    );
  }

  const sortedSections = [...(landingPage.sections ?? [])].sort(
    (a, b) => a.position - b.position
  );

  return (
    <div className="flex flex-col gap-4" data-testid="landing-page-detail">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Vendas', href: '/sales' },
          { label: 'Páginas de Captura', href: '/sales/landing-pages' },
          { label: landingPage.title },
        ]}
        buttons={[
          ...(canAdmin && landingPage.status === 'DRAFT'
            ? [
                {
                  id: 'publish',
                  title: 'Publicar',
                  icon: Send,
                  variant: 'default' as const,
                  onClick: handlePublish,
                },
              ]
            : []),
          ...(canAdmin && landingPage.status === 'PUBLISHED'
            ? [
                {
                  id: 'unpublish',
                  title: 'Despublicar',
                  icon: EyeOff,
                  variant: 'outline' as const,
                  onClick: handleUnpublish,
                },
              ]
            : []),
          ...(canAdmin
            ? [
                {
                  id: 'edit',
                  title: 'Editar',
                  icon: Pencil,
                  variant: 'default' as const,
                  onClick: () =>
                    router.push(`/sales/landing-pages/${pageId}/edit`),
                },
              ]
            : []),
        ]}
      />

      {/* Identity Card */}
      <Card className="bg-white/5 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-sky-500/10">
              <Globe className="h-6 w-6 text-sky-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{landingPage.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                /p/{landingPage.slug}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant="secondary"
              className={cn('text-xs', STATUS_COLORS[landingPage.status])}
            >
              {LANDING_PAGE_STATUS_LABELS[landingPage.status]}
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"
            >
              <Layout className="h-3 w-3 mr-1" />
              {LANDING_PAGE_TEMPLATE_LABELS[landingPage.template]}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-4 text-center">
          <Eye className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
          <div className="text-2xl font-bold">{landingPage.viewCount}</div>
          <div className="text-xs text-muted-foreground">Visualizações</div>
        </Card>
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-4 text-center">
          <FileText className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
          <div className="text-2xl font-bold">
            {landingPage.submissionCount}
          </div>
          <div className="text-xs text-muted-foreground">Submissões</div>
        </Card>
        {landingPage.formName && (
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-4 text-center">
            <FileText className="h-5 w-5 text-violet-500 mx-auto mb-1" />
            <div className="text-sm font-semibold truncate">
              {landingPage.formName}
            </div>
            <div className="text-xs text-muted-foreground">
              Formulário Vinculado
            </div>
          </Card>
        )}
      </div>

      {/* Page Preview - Sections */}
      <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Layout className="h-5 w-5 text-violet-500" />
          Prévia das Seções
        </h2>

        {sortedSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Layout className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma seção configurada.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSections.map((section, idx) => (
              <div
                key={section.id}
                className={cn(
                  'border border-border rounded-lg p-4',
                  section.type === 'HERO' &&
                    'bg-linear-to-br from-violet-50/50 to-sky-50/50 dark:from-violet-500/5 dark:to-sky-500/5'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {section.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Seção {idx + 1}
                  </span>
                </div>
                {section.title && (
                  <h3 className="text-lg font-bold mb-1">{section.title}</h3>
                )}
                {section.subtitle && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {section.subtitle}
                  </p>
                )}
                {section.content && (
                  <p className="text-sm">{section.content}</p>
                )}
                {section.ctaText && (
                  <div className="mt-3">
                    <Button size="sm" className="gap-1.5">
                      {section.ctaText}
                      {section.ctaLink && <ExternalLink className="h-3 w-3" />}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function LandingPageDetailPage() {
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
      <LandingPageDetailContent />
    </Suspense>
  );
}
