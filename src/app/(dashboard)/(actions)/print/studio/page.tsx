/**
 * Print Studio - Label Templates List
 * Página de gerenciamento de templates de etiquetas
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ConfirmDialog,
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
  useEntityCrud,
  useEntityPage,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { parseStudioTemplate } from '@/core/print-queue/components/studio-label-renderer';
import { storageFilesService } from '@/services/storage/files.service';
import { TestPrintModal } from '@/core/print-queue/components/test-print-modal';
import type { LabelTemplate } from '@/core/print-queue/editor';
import { LABEL_SIZE_PRESETS } from '@/core/print-queue/editor';
import { labelTemplatesService } from '@/services/stock/label-templates.service';
import {
  ArrowDownAZ,
  Calendar,
  Clock,
  Copy,
  Download,
  Edit,
  Eye,
  Loader2,
  Pen,
  Plus,
  Printer,
  Router,
  Ruler,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { labelTemplatesConfig } from './src';

// =============================================================================
// RENAME MODAL
// =============================================================================

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: LabelTemplate | null;
  isSubmitting: boolean;
  onSubmit: (id: string, data: Partial<LabelTemplate>) => Promise<void>;
}

function RenameModal({
  isOpen,
  onClose,
  template,
  isSubmitting,
  onSubmit,
}: RenameModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (template) {
      setName(template.name || '');
    }
  }, [template]);

  if (!template) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit(template.id, { name: trimmed });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-3 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-blue-500 to-cyan-600 p-2 rounded-lg">
                <Tag className="h-5 w-5" />
              </div>
              Renomear Template
            </div>
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="template-name">Nome do Template</Label>
            <Input
              id="template-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Digite o nome do template"
              autoFocus
              maxLength={255}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Resolve thumbnailUrl relativa para URL completa com token
 */
function resolveThumbnailUrl(
  url: string | null | undefined
): string | undefined {
  if (!url) return undefined;
  const match = url.match(/\/v1\/storage\/files\/([^/]+)\/serve/);
  if (match) {
    return storageFilesService.getServeUrl(match[1]);
  }
  return url;
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function PrintStudioPage() {
  const router = useRouter();

  // ============================================================================
  // STATE
  // ============================================================================

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] =
    useState<LabelTemplate | null>(null);
  const [testPrintTemplate, setTestPrintTemplate] =
    useState<LabelTemplate | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [templateToRename, setTemplateToRename] =
    useState<LabelTemplate | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // CRUD SETUP
  // ============================================================================

  const crud = useEntityCrud<LabelTemplate>({
    entityName: 'LabelTemplate',
    entityNamePlural: 'LabelTemplates',
    queryKey: ['label-templates'],
    baseUrl: '/api/v1/label-templates',
    listFn: async () => {
      const response = await labelTemplatesService.listTemplates({
        includeSystem: true,
      });
      return response.templates;
    },
    getFn: async (id: string) => {
      const response = await labelTemplatesService.getTemplate(id);
      return response.template;
    },
    createFn: async data => {
      const response = await labelTemplatesService.createTemplate(
        data as Parameters<typeof labelTemplatesService.createTemplate>[0]
      );
      return response.template;
    },
    updateFn: async (id: string, data) => {
      const response = await labelTemplatesService.updateTemplate(
        id,
        data as Parameters<typeof labelTemplatesService.updateTemplate>[1]
      );
      return response.template;
    },
    deleteFn: (id: string) => labelTemplatesService.deleteTemplate(id),
    duplicateFn: async (id: string) => {
      const original = await labelTemplatesService.getTemplate(id);
      const response = await labelTemplatesService.duplicateTemplate(
        id,
        `${original.template.name} (Cópia)`
      );
      return response.template;
    },
  });

  // ============================================================================
  // PAGE SETUP
  // ============================================================================

  const page = useEntityPage<LabelTemplate>({
    entityName: 'LabelTemplate',
    entityNamePlural: 'LabelTemplates',
    queryKey: ['label-templates'],
    crud,
    viewRoute: id => `/print/studio/label/${id}`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      const name = item.name?.toLowerCase() || '';
      const description = item.description?.toLowerCase() || '';
      return [name, description].some(value => value.includes(q));
    },
    duplicateConfig: {
      getNewName: item => `${item.name} (Cópia)`,
      getData: item => ({
        name: `${item.name} (Cópia)`,
        width: item.width,
        height: item.height,
        grapesJsData: item.grapesJsData,
      }),
    },
  });

  // ============================================================================
  // SIZE FILTER
  // ============================================================================

  const sizeFilterOptions = useMemo(() => {
    const items = crud.items ?? [];
    const seen = new Set<string>();
    const options: { id: string; label: string }[] = [];

    for (const item of items) {
      const key = `${item.width}x${item.height}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const preset = LABEL_SIZE_PRESETS.find(
        p => p.width === item.width && p.height === item.height
      );
      options.push({
        id: key,
        label: preset
          ? `${preset.name} (${item.width}x${item.height}mm)`
          : `${item.width}x${item.height}mm`,
      });
    }

    return options;
  }, [crud.items]);

  const filteredBySize = useMemo(() => {
    if (selectedSizes.length === 0) return page.filteredItems;
    return page.filteredItems.filter(item =>
      selectedSizes.includes(`${item.width}x${item.height}`)
    );
  }, [page.filteredItems, selectedSizes]);

  // ============================================================================
  // CUSTOM HANDLERS
  // ============================================================================

  const handleExport = useCallback(async (template: LabelTemplate) => {
    try {
      const fullTemplate = await labelTemplatesService.getTemplate(template.id);
      const exportData = {
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        template: {
          name: fullTemplate.template.name,
          description: fullTemplate.template.description || '',
          width: fullTemplate.template.width,
          height: fullTemplate.template.height,
          grapesJsData: fullTemplate.template.grapesJsData,
        },
      };
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name}.label.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar template');
    }
  }, []);

  const handleTestPrint = useCallback(async (template: LabelTemplate) => {
    try {
      const fullTemplate = await labelTemplatesService.getTemplate(template.id);
      setTestPrintTemplate(fullTemplate.template);
    } catch {
      toast.error('Erro ao carregar template para teste');
    }
  }, []);

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.exportVersion || !data.template) {
          toast.error(
            'Arquivo JSON inválido. Formato de exportação não reconhecido.'
          );
          return;
        }

        const { name, description, width, height, grapesJsData } =
          data.template;
        if (!name || !width || !height || !grapesJsData) {
          toast.error('Arquivo JSON incompleto. Campos obrigatórios ausentes.');
          return;
        }

        const result = await crud.create({
          name: `${name} (Importado)`,
          description: description || '',
          width,
          height,
          grapesJsData,
        } as Partial<LabelTemplate>);

        if (result?.id) {
          router.push(`/print/studio/label/${result.id}/edit`);
        }
      } catch {
        toast.error(
          'Erro ao importar template. Verifique se o arquivo é válido.'
        );
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [crud, router]
  );

  const handleRename = useCallback(
    async (id: string, data: Partial<LabelTemplate>) => {
      await crud.update(id, data);
    },
    [crud]
  );

  // ============================================================================
  // CONTEXT MENU HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    const id = ids[0];
    if (id) router.push(`/print/studio/label/${id}`);
  };

  const handleContextEdit = (ids: string[]) => {
    const id = ids[0];
    if (id) router.push(`/print/studio/label/${id}/edit`);
  };

  const handleContextRename = (ids: string[]) => {
    const id = ids[0];
    if (!id) return;
    const template = (crud.items ?? []).find(t => t.id === id);
    if (template) {
      setTemplateToRename(template);
      setRenameOpen(true);
    }
  };

  const handleContextDuplicate = (ids: string[]) =>
    page.handlers.handleItemsDuplicate(ids);

  const handleContextDelete = (ids: string[]) => {
    const id = ids[0];
    if (!id) return;
    const template = (crud.items ?? []).find(t => t.id === id);
    if (template) {
      setTemplateToDelete(template);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = useCallback(async () => {
    if (!templateToDelete) return;
    await crud.deleteItem(templateToDelete.id);
    setDeleteDialogOpen(false);
    setTemplateToDelete(null);
  }, [templateToDelete, crud]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const sortOptions = useMemo(
    () => [
      {
        field: 'custom' as const,
        direction: 'asc' as const,
        label: 'Nome (A-Z)',
        icon: ArrowDownAZ,
      },
      {
        field: 'custom' as const,
        direction: 'desc' as const,
        label: 'Nome (Z-A)',
        icon: ArrowDownAZ,
      },
      {
        field: 'createdAt' as const,
        direction: 'desc' as const,
        label: 'Mais recentes',
        icon: Calendar,
      },
      {
        field: 'createdAt' as const,
        direction: 'asc' as const,
        label: 'Mais antigos',
        icon: Calendar,
      },
      {
        field: 'updatedAt' as const,
        direction: 'desc' as const,
        label: 'Última atualização',
        icon: Clock,
      },
    ],
    []
  );

  const getContextActions = useCallback(
    (template: LabelTemplate): ContextMenuAction[] => {
      const actions: ContextMenuAction[] = [
        // -- Base actions --
        {
          id: 'view',
          label: 'Visualizar',
          icon: Eye,
          onClick: ids => handleContextView(ids),
        },
        ...(!template.isSystem
          ? [
              {
                id: 'edit',
                label: 'Editar',
                icon: Edit,
                onClick: (ids: string[]) => handleContextEdit(ids),
              },
              {
                id: 'rename',
                label: 'Renomear',
                icon: Pen,
                onClick: (ids: string[]) => handleContextRename(ids),
              },
            ]
          : []),
        {
          id: 'duplicate',
          label: 'Duplicar',
          icon: Copy,
          onClick: (ids: string[]) => handleContextDuplicate(ids),
        },
        // -- Custom actions --
        {
          id: 'export',
          label: 'Exportar JSON',
          icon: Download,
          onClick: () => handleExport(template),
          separator: 'before' as const,
        },
        {
          id: 'testPrint',
          label: 'Imprimir Teste',
          icon: Printer,
          onClick: () => handleTestPrint(template),
        },
      ];

      // -- Destructive --
      if (!template.isSystem) {
        actions.push({
          id: 'delete',
          label: 'Excluir',
          icon: Trash2,
          onClick: () => handleContextDelete([template.id]),
          variant: 'destructive',
          separator: 'before',
        });
      }

      return actions;
    },
    [handleExport, handleTestPrint]
  );

  const renderGridCard = (item: LabelTemplate, isSelected: boolean) => {
    return (
      <EntityContextMenu
        itemId={item.id}
        showDefaultActions={false}
        actions={getContextActions(item)}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={item.description || `${item.width}mm x ${item.height}mm`}
          icon={Tag}
          iconBgColor="bg-linear-to-br from-blue-500 to-cyan-600"
          thumbnail={resolveThumbnailUrl(item.thumbnailUrl)}
          thumbnailFallback={
            <div className="flex flex-col items-center text-muted-foreground">
              <Tag className="w-8 h-8 mb-2" />
              <span className="text-xs">
                {item.width}mm x {item.height}mm
              </span>
            </div>
          }
          badges={[
            {
              label: item.isSystem ? 'Sistema' : 'Customizado',
              variant: item.isSystem ? 'secondary' : 'outline',
            },
            {
              label: `${item.width}mm x ${item.height}mm`,
              variant: 'outline' as const,
            },
          ]}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: LabelTemplate, isSelected: boolean) => {
    return (
      <EntityContextMenu
        itemId={item.id}
        showDefaultActions={false}
        actions={getContextActions(item)}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.name}
          subtitle={item.description || `${item.width}mm x ${item.height}mm`}
          icon={Tag}
          iconBgColor="bg-linear-to-br from-blue-500 to-cyan-600"
          badges={[
            {
              label: item.isSystem ? 'Sistema' : 'Customizado',
              variant: item.isSystem ? 'secondary' : 'outline',
            },
            {
              label: `${item.width}mm x ${item.height}mm`,
              variant: 'outline' as const,
            },
          ]}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const headerButtons = useMemo<HeaderButton[]>(
    () => [
      {
        id: 'agents',
        title: 'Agentes',
        icon: Router,
        onClick: () => router.push('/devices/remote-prints'),
        variant: 'outline',
      },
      {
        id: 'import-template',
        title: 'Importar',
        icon: Upload,
        onClick: () => fileInputRef.current?.click(),
        variant: 'outline',
      },
      {
        id: 'create-template',
        title: 'Novo Template',
        icon: Plus,
        onClick: () => router.push('/print/studio/label'),
        variant: 'default',
      },
    ],
    [router]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider>
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[{ label: 'Label Studio', href: '/print/studio' }]}
            buttons={headerButtons}
          />

          <Header
            title="Label Studio"
            description="Crie e gerencie templates de etiquetas"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            value={page.searchQuery}
            placeholder={labelTemplatesConfig.display.labels.searchPlaceholder}
            onSearch={value => page.handlers.handleSearch(value)}
            onClear={() => page.handlers.handleSearch('')}
            showClear={true}
            size="md"
          />

          {/* Grid */}
          {page.isLoading ? (
            <GridLoading count={8} layout="grid" size="md" gap="gap-4" />
          ) : page.error ? (
            <GridError
              type="server"
              title="Erro ao carregar templates"
              message="Ocorreu um erro ao tentar carregar os templates. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => crud.refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={labelTemplatesConfig}
              items={filteredBySize}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={page.isLoading}
              isSearching={!!page.searchQuery}
              onItemClick={(item, e) => page.handlers.handleItemClick(item, e)}
              onItemDoubleClick={item =>
                page.handlers.handleItemDoubleClick(item)
              }
              showSorting={true}
              defaultSortField="custom"
              defaultSortDirection="asc"
              customSortOptions={sortOptions}
              customSortFn={(a, b, direction) => {
                const multiplier = direction === 'asc' ? 1 : -1;
                const nameA = a.name?.toLowerCase() ?? '';
                const nameB = b.name?.toLowerCase() ?? '';
                return nameA.localeCompare(nameB, 'pt-BR') * multiplier;
              }}
              toolbarStart={
                <FilterDropdown
                  label="Dimensões"
                  icon={Ruler}
                  options={sizeFilterOptions}
                  selected={selectedSizes}
                  onSelectionChange={setSelectedSizes}
                  activeColor="blue"
                  searchPlaceholder="Buscar dimensões..."
                  emptyText="Nenhuma dimensão encontrada"
                />
              }
            />
          )}

          {/* Hidden file input for import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />

          {/* Rename Modal */}
          <RenameModal
            isOpen={renameOpen}
            onClose={() => {
              setRenameOpen(false);
              setTemplateToRename(null);
            }}
            template={templateToRename}
            isSubmitting={crud.isUpdating}
            onSubmit={handleRename}
          />

          {/* Test Print Modal */}
          {testPrintTemplate &&
            (() => {
              const studioTpl = parseStudioTemplate(
                testPrintTemplate.grapesJsData
              );
              return studioTpl ? (
                <TestPrintModal
                  open={!!testPrintTemplate}
                  onOpenChange={open => {
                    if (!open) setTestPrintTemplate(null);
                  }}
                  template={studioTpl}
                />
              ) : null;
            })()}

          {/* Delete Confirmation */}
          <ConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Excluir Template"
            description={`Tem certeza que deseja excluir o template "${templateToDelete?.name}"? Esta ação não pode ser desfeita.`}
            onConfirm={handleDeleteConfirm}
            confirmLabel="Excluir"
            cancelLabel="Cancelar"
            variant="destructive"
            isLoading={crud.isDeleting}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
