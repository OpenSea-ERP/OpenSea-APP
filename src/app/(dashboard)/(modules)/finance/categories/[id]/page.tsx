/**
 * Finance Category Detail Page
 * Follows company detail page pattern: PageLayout > PageActionBar > Identity Card > Content
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { InfoField } from '@/components/shared/info-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { useDeleteFinanceCategory, useFinanceCategory } from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { FINANCE_CATEGORY_TYPE_LABELS } from '@/types/finance';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import {
  Calendar,
  Clock,
  Edit,
  FolderTree,
  Trash,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useCallback, useState } from 'react';
import { toast } from 'sonner';

export default function FinanceCategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { data, isLoading } = useFinanceCategory(id);
  const deleteMutation = useDeleteFinanceCategory();
  const category = data?.category;

  const canEdit = hasPermission(FINANCE_PERMISSIONS.CATEGORIES.UPDATE);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.CATEGORIES.DELETE);

  const [isPinOpen, setIsPinOpen] = useState(false);

  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Categoria excluída com sucesso!');
      router.push('/finance/categories');
    } catch {
      toast.error('Erro ao excluir categoria.');
    }
  }, [id, deleteMutation, router]);

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Categorias', href: '/finance/categories' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!category) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Categorias', href: '/finance/categories' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <FolderTree className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Categoria não encontrada
            </h2>
            <p className="text-muted-foreground mb-6">
              A categoria que você está procurando não existe ou foi removida.
            </p>
            <Button onClick={() => router.push('/finance/categories')}>
              Voltar para Categorias
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const actionButtons = [];
  if (canDelete && !category.isSystem) {
    actionButtons.push({
      id: 'delete',
      title: 'Excluir',
      icon: Trash,
      onClick: () => setIsPinOpen(true),
      variant: 'outline' as const,
    });
  }
  if (canEdit && !category.isSystem) {
    actionButtons.push({
      id: 'edit',
      title: 'Editar',
      icon: Edit,
      onClick: () => router.push(`/finance/categories/${id}/edit`),
    });
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Categorias', href: '/finance/categories' },
            { label: category.name },
          ]}
          buttons={actionButtons}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-5">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0"
              style={{
                background: category.color
                  ? `linear-gradient(135deg, ${category.color}, ${category.color}cc)`
                  : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              }}
            >
              <FolderTree className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {category.name}
                </h1>
                <Badge variant={category.isActive ? 'success' : 'secondary'}>
                  {category.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
                {category.isSystem && (
                  <Badge variant="outline">Sistema</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {FINANCE_CATEGORY_TYPE_LABELS[category.type]}
                {category.parentName &&
                  ` · Subcategoria de ${category.parentName}`}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {category.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>
                    {new Date(category.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {category.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    {new Date(category.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        {/* Details */}
        <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg uppercase font-semibold flex items-center gap-2 mb-4">
            <FolderTree className="h-5 w-5" />
            Informações
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <InfoField
              label="Nome"
              value={category.name}
              showCopyButton
              copyTooltip="Copiar Nome"
            />
            <InfoField label="Slug" value={category.slug} showCopyButton />
            <InfoField
              label="Ordem de Exibição"
              value={category.displayOrder}
            />
            {category.parentName && (
              <InfoField
                label="Categoria Pai"
                value={category.parentName}
              />
            )}
            {category.childrenCount !== undefined &&
              category.childrenCount > 0 && (
                <InfoField
                  label="Subcategorias"
                  value={category.childrenCount}
                />
              )}
            {category.entryCount !== undefined && (
              <InfoField
                label="Lançamentos Vinculados"
                value={category.entryCount}
              />
            )}
            {category.description && (
              <InfoField
                label="Descrição"
                value={category.description}
                className="md:col-span-3"
              />
            )}
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Verification */}
      <VerifyActionPinModal
        isOpen={isPinOpen}
        onClose={() => setIsPinOpen(false)}
        onSuccess={handleDelete}
        title="Excluir Categoria"
        description="Digite seu PIN de Ação para confirmar a exclusão desta categoria."
      />
    </PageLayout>
  );
}
