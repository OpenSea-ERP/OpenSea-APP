'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCatalog,
  useUpdateCatalog,
  useDeleteCatalog,
} from '@/hooks/sales/use-catalogs';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { BookOpen, Calendar, Save, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function EditCatalogPage() {
  const params = useParams();
  const router = useRouter();
  const catalogId = params.id as string;
  const { hasPermission } = usePermissions();

  const canDelete = hasPermission(SALES_PERMISSIONS.CATALOGS.ADMIN);

  const { data, isLoading, error } = useCatalog(catalogId);
  const updateMutation = useUpdateCatalog();
  const deleteMutation = useDeleteCatalog();

  const [deleteOpen, setDeleteOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [layout, setLayout] = useState('GRID');
  const [showPrices, setShowPrices] = useState(true);
  const [showStock, setShowStock] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  // Populate form when data loads
  useEffect(() => {
    if (data?.catalog) {
      const c = data.catalog;
      setName(c.name);
      setDescription(c.description ?? '');
      setSlug(c.slug ?? '');
      setStatus(c.status);
      setLayout(c.layout);
      setShowPrices(c.showPrices);
      setShowStock(c.showStock);
      setIsPublic(c.isPublic);
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        catalogId,
        data: {
          name,
          description: description || undefined,
          slug: slug || undefined,
          status: status as 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
          layout: layout as 'GRID' | 'LIST' | 'MAGAZINE',
          showPrices,
          showStock,
          isPublic,
        },
      });
      toast.success('Catálogo atualizado com sucesso');
      router.push(`/sales/catalogs/${catalogId}`);
    } catch {
      toast.error('Erro ao atualizar catálogo');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(catalogId);
      toast.success('Catálogo excluído com sucesso');
      router.push('/sales/catalogs');
    } catch {
      toast.error('Erro ao excluir catálogo');
    }
    setDeleteOpen(false);
  };

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

  if (error || !data?.catalog) {
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
    <PageLayout data-testid="catalog-edit">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas' },
            { label: 'Catálogos', href: '/sales/catalogs' },
            { label: data.catalog.name, href: `/sales/catalogs/${catalogId}` },
            { label: 'Editar' },
          ]}
          actions={[
            ...(canDelete
              ? [
                  {
                    label: 'Excluir',
                    icon: Trash2,
                    variant: 'destructive' as const,
                    onClick: () => setDeleteOpen(true),
                  },
                ]
              : []),
            {
              label: 'Salvar',
              icon: Save,
              onClick: handleSave,
              disabled: updateMutation.isPending,
            },
          ]}
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
              <h1 className="text-lg font-semibold">{data.catalog.name}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Criado em{' '}
                {new Date(data.catalog.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <Card className="mt-4 bg-white/5 py-2 overflow-hidden">
          <div className="space-y-6 p-5">
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">Informações Básicas</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nome do catálogo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    placeholder="url-slug"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descrição do catálogo"
                  rows={3}
                />
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">
                Configurações de Exibição
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Rascunho</SelectItem>
                      <SelectItem value="ACTIVE">Ativo</SelectItem>
                      <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Layout</Label>
                  <Select value={layout} onValueChange={setLayout}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GRID">Grade</SelectItem>
                      <SelectItem value="LIST">Lista</SelectItem>
                      <SelectItem value="MAGAZINE">Magazine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">Opções</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showPrices">Exibir preços</Label>
                  <Switch
                    id="showPrices"
                    checked={showPrices}
                    onCheckedChange={setShowPrices}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="showStock">Exibir estoque</Label>
                  <Switch
                    id="showStock"
                    checked={showStock}
                    onCheckedChange={setShowStock}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isPublic">Catálogo público</Label>
                  <Switch
                    id="isPublic"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Delete Modal */}
        <VerifyActionPinModal
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir este catálogo."
        />
      </PageBody>
    </PageLayout>
  );
}
