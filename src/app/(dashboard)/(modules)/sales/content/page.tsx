'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { EntityCard, EntityContextMenu, EntityGrid } from '@/core';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useContentsInfinite,
  useDeleteContent,
  useApproveContent,
} from '@/hooks/sales/use-catalogs';
import { useDebounce } from '@/hooks/use-debounce';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { GeneratedContent } from '@/types/sales';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  FileImage,
  Image,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const TYPE_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Post Social', value: 'SOCIAL_POST' },
  { label: 'Story', value: 'SOCIAL_STORY' },
  { label: 'Reel', value: 'SOCIAL_REEL' },
  { label: 'Página de Catálogo', value: 'FOLDER_PAGE' },
  { label: 'Email', value: 'EMAIL_CAMPAIGN' },
  { label: 'Banner', value: 'BANNER' },
  { label: 'Card de Produto', value: 'PRODUCT_CARD' },
  { label: 'Vídeo', value: 'VIDEO' },
  { label: 'Mockup', value: 'MOCKUP' },
];

const STATUS_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Rascunho', value: 'DRAFT' },
  { label: 'Pronto', value: 'READY' },
  { label: 'Aprovado', value: 'APPROVED' },
  { label: 'Publicado', value: 'PUBLISHED' },
  { label: 'Arquivado', value: 'ARCHIVED' },
];

function getStatusBadge(status: string) {
  switch (status) {
    case 'DRAFT':
      return <Badge variant="secondary">Rascunho</Badge>;
    case 'READY':
      return <Badge className="bg-blue-500">Pronto</Badge>;
    case 'APPROVED':
      return <Badge className="bg-emerald-500">Aprovado</Badge>;
    case 'PUBLISHED':
      return <Badge className="bg-violet-500">Publicado</Badge>;
    case 'ARCHIVED':
      return <Badge variant="outline">Arquivado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'SOCIAL_POST':
    case 'SOCIAL_STORY':
    case 'SOCIAL_REEL':
      return <Image className="h-5 w-5 text-pink-500" />;
    case 'VIDEO':
      return <Video className="h-5 w-5 text-purple-500" />;
    default:
      return <FileImage className="h-5 w-5 text-blue-500" />;
  }
}

export default function ContentPage() {
  const { hasPermission } = usePermissions();

  const canView = hasPermission(SALES_PERMISSIONS.CONTENT.ACCESS);
  const canDelete = hasPermission(SALES_PERMISSIONS.CONTENT.REMOVE);
  const canApprove = hasPermission(SALES_PERMISSIONS.CONTENT.ADMIN);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (debouncedSearch) f.search = debouncedSearch;
    if (typeFilter) f.type = typeFilter;
    if (statusFilter) f.status = statusFilter;
    return f;
  }, [debouncedSearch, typeFilter, statusFilter]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useContentsInfinite(filters);

  const contents = useMemo(
    () => data?.pages.flatMap(p => p.data) ?? [],
    [data]
  );

  const deleteMutation = useDeleteContent();
  const approveMutation = useApproveContent();

  // Sentinel
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const handleDeleteRequest = (ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    for (const id of itemsToDelete) {
      await deleteMutation.mutateAsync(id);
    }
    setDeleteOpen(false);
    setItemsToDelete([]);
  };

  const handleApprove = async (content: GeneratedContent) => {
    try {
      await approveMutation.mutateAsync(content.id);
      toast.success('Conteúdo aprovado com sucesso');
    } catch {
      toast.error('Erro ao aprovar conteúdo');
    }
  };

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas' },
            { label: 'Biblioteca de Conteúdo' },
          ]}
        />
      </PageHeader>

      <PageBody>
        <SearchBar
          value={searchQuery}
          onSearch={setSearchQuery}
          placeholder="Buscar conteúdos..."
        />

        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError message={error?.message} />
        ) : (
          <EntityGrid
            items={contents}
            getKey={c => c.id}
            toolbarStart={
              <>
                <FilterDropdown
                  label="Tipo"
                  options={TYPE_OPTIONS}
                  value={typeFilter}
                  onChange={setTypeFilter}
                />
                <FilterDropdown
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              </>
            }
            renderItem={content => (
              <EntityContextMenu
                key={content.id}
                actions={[
                  ...(canApprove && content.status !== 'APPROVED'
                    ? [
                        {
                          label: 'Aprovar',
                          icon: CheckCircle2,
                          onClick: () => handleApprove(content),
                        },
                      ]
                    : []),
                  ...(canDelete
                    ? [
                        {
                          label: 'Excluir',
                          icon: Trash2,
                          variant: 'destructive' as const,
                          separator: 'before' as const,
                          onClick: () => handleDeleteRequest([content.id]),
                        },
                      ]
                    : []),
                ]}
              >
                <EntityCard className="cursor-pointer">
                  <div className="flex items-start gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-500/10">
                      {getTypeIcon(content.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-medium">
                          {content.title ?? 'Sem título'}
                        </h3>
                        {getStatusBadge(content.status)}
                        {content.aiGenerated && (
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {content.type}
                        {content.channel ? ` / ${content.channel}` : ''}
                      </p>
                      {content.caption && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {content.caption}
                        </p>
                      )}
                    </div>
                  </div>
                </EntityCard>
              </EntityContextMenu>
            )}
            emptyState={{
              icon: FileImage,
              title: 'Nenhum conteúdo encontrado',
              description: 'Gere conteúdo para suas campanhas e catálogos.',
            }}
          />
        )}

        <div ref={sentinelRef} className="h-1" />

        <VerifyActionPinModal
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description={`Digite seu PIN de ação para excluir ${itemsToDelete.length} conteúdo(s).`}
        />
      </PageBody>
    </PageLayout>
  );
}
