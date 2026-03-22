'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCatalog } from '@/hooks/sales/use-catalogs';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { AiContextPanel } from '@/components/sales/ai-context-panel';
import {
  BookOpen,
  Calendar,
  Eye,
  Globe,
  Grid3X3,
  List,
  Lock,
  Pencil,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

function getStatusBadge(status: string) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="secondary">Rascunho</Badge>;
    case 'ACTIVE':
      return (
        <Badge variant="default" className="bg-emerald-500">
          Ativo
        </Badge>
      );
    case 'ARCHIVED':
      return <Badge variant="outline">Arquivado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'GENERAL':
      return 'Geral';
    case 'SELLER':
      return 'Vendedor';
    case 'CAMPAIGN':
      return 'Campanha';
    case 'CUSTOMER':
      return 'Cliente';
    case 'AI_GENERATED':
      return 'Gerado por IA';
    default:
      return type;
  }
}

export default function CatalogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const catalogId = params.id as string;
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission(SALES_PERMISSIONS.CATALOGS.MODIFY);

  const { data, isLoading, error } = useCatalog(catalogId);
  const catalog = data?.catalog;

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas' },
              { label: 'Catálogos', href: '/sales/catalogs' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !catalog) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas' },
              { label: 'Catálogos', href: '/sales/catalogs' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError message={error?.message} />
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas' },
            { label: 'Catálogos', href: '/sales/catalogs' },
            { label: catalog.name },
          ]}
          actions={
            canEdit
              ? [
                  {
                    label: 'Editar',
                    icon: Pencil,
                    onClick: () =>
                      router.push(`/sales/catalogs/${catalogId}/edit`),
                  },
                ]
              : []
          }
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
              <BookOpen className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{catalog.name}</h1>
                {getStatusBadge(catalog.status)}
                {catalog.isPublic ? (
                  <Globe className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Lock className="h-4 w-4 text-slate-400" />
                )}
              </div>
              {catalog.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {catalog.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Criado em{' '}
                  {new Date(catalog.createdAt).toLocaleDateString('pt-BR')}
                </span>
                <span>Tipo: {getTypeLabel(catalog.type)}</span>
                <span>Layout: {catalog.layout}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Details Card */}
        <Card className="mt-4 bg-white/5 p-5">
          <h2 className="text-sm font-semibold mb-3">Configurações</h2>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <span className="text-muted-foreground">Exibir Preços</span>
              <p className="font-medium">
                {catalog.showPrices ? 'Sim' : 'Não'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Exibir Estoque</span>
              <p className="font-medium">{catalog.showStock ? 'Sim' : 'Não'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Público</span>
              <p className="font-medium">{catalog.isPublic ? 'Sim' : 'Não'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Curadoria IA</span>
              <p className="font-medium">{catalog.aiCurated ? 'Sim' : 'Não'}</p>
            </div>
          </div>
          {catalog.slug && (
            <div className="mt-3 text-sm">
              <span className="text-muted-foreground">Slug: </span>
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {catalog.slug}
              </code>
            </div>
          )}
          {catalog.publicUrl && (
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">URL Pública: </span>
              <a
                href={catalog.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {catalog.publicUrl}
              </a>
            </div>
          )}
        </Card>

        {/* Product Grid placeholder */}
        <Card className="mt-4 bg-white/5 p-5">
          <h2 className="text-sm font-semibold mb-3">Itens do Catálogo</h2>
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="text-center">
              <Grid3X3 className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">
                {catalog.itemCount !== undefined
                  ? `${catalog.itemCount} item(ns) no catálogo`
                  : 'Carregando itens...'}
              </p>
            </div>
          </div>
        </Card>
        {/* AI Insights */}
        <AiContextPanel entityType="catalog" entityId={catalogId} />
      </PageBody>
    </PageLayout>
  );
}
