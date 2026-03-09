/**
 * Finance Category Detail Page
 * Follows the manufacturer detail page pattern with PageBreadcrumb, InfoField, MetadataSection
 */

'use client';

import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { InfoField } from '@/components/shared/info-field';
import { MetadataSection } from '@/components/shared/metadata-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { useDeleteFinanceCategory, useFinanceCategory } from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { FINANCE_CATEGORY_TYPE_LABELS } from '@/types/finance';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Edit, FolderTree, Info, Trash } from 'lucide-react';
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
      <div className="flex items-center justify-center h-96">
        <div className="space-y-4 w-full max-w-2xl">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Categoria não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <PageBreadcrumb
          items={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Categorias', href: '/finance/categories' },
            {
              label: category.name,
              href: `/finance/categories/${id}`,
            },
          ]}
        />
        <div className="flex gap-2">
          {canDelete && !category.isSystem && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPinOpen(true)}
              className="gap-2"
            >
              <Trash className="h-4 w-4 text-red-800" />
              Excluir
            </Button>
          )}

          {canEdit && !category.isSystem && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/finance/categories/${id}/edit`)}
              className="gap-2"
            >
              <Edit className="h-4 w-4 text-sky-500" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Hero Card */}
      <Card className="p-4 sm:p-6">
        <div className="flex gap-4 sm:flex-row items-center sm:gap-6">
          <div
            className="flex items-center justify-center h-10 w-10 md:h-16 md:w-16 rounded-lg shrink-0"
            style={{
              backgroundColor: category.color || '#8b5cf6',
            }}
          >
            <FolderTree className="md:h-8 md:w-8 text-white" />
          </div>
          <div className="flex justify-between flex-1 gap-4 flex-row items-center">
            <div>
              <h1 className="text-lg sm:text-3xl font-bold tracking-tight">
                {category.name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {FINANCE_CATEGORY_TYPE_LABELS[category.type]}
                {category.parentName &&
                  ` • Subcategoria de ${category.parentName}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={category.isActive ? 'success' : 'secondary'}>
                {category.isActive ? 'Ativa' : 'Inativa'}
              </Badge>
              {category.isSystem && <Badge variant="outline">Sistema</Badge>}
            </div>
          </div>
        </div>
      </Card>

      {/* Details Card */}
      <Card className="flex flex-col gap-10 sm:p-6">
        <div>
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 text-white/60">
            <Info className="h-6 w-6" />
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
              label="Tipo"
              value={FINANCE_CATEGORY_TYPE_LABELS[category.type]}
            />
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
          </div>
        </div>

        {category.description && (
          <div>
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 text-white/60">
              <FolderTree className="h-6 w-6" />
              Descrição
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap px-4">
              {category.description}
            </p>
          </div>
        )}
      </Card>

      {/* Metadata */}
      <MetadataSection
        createdAt={category.createdAt}
        updatedAt={category.updatedAt}
      />

      {/* Delete PIN Verification */}
      <VerifyActionPinModal
        isOpen={isPinOpen}
        onClose={() => setIsPinOpen(false)}
        onSuccess={handleDelete}
        title="Excluir Categoria"
        description="Digite seu PIN de Ação para confirmar a exclusão desta categoria."
      />
    </div>
  );
}
