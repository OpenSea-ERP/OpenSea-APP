'use client';

/**
 * Signature templates — list + CRUD entry points.
 *
 * Infinite-scroll list of reusable signature templates with filters by
 * active/inactive and free-text search. Create/edit goes through the
 * 3-step TemplateWizardDialog; delete requires PIN confirmation.
 *
 * TODO(backend): updateTemplate and deleteTemplate endpoints are not yet
 * implemented in the API. The UI is wired up and will work as soon as the
 * backend exposes those routes. Errors from the service layer are surfaced
 * via toast to make the gap explicit.
 */

import { ProtectedRoute } from '@/components/auth/protected-route';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { TemplateWizardDialog } from '@/components/signature/template-wizard-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { TOOLS_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { signatureTemplatesService } from '@/services/signature';
import type { SignatureTemplate } from '@/types/signature';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { LayoutTemplate, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

const LEVEL_LABEL: Record<string, string> = {
  SIMPLE: 'Simples',
  ADVANCED: 'Avançada',
  QUALIFIED: 'Qualificada',
};

const ROUTING_LABEL: Record<string, string> = {
  SEQUENTIAL: 'Sequencial',
  PARALLEL: 'Paralelo',
  HYBRID: 'Híbrido',
};

const TEMPLATES_PAGE_SIZE = 20;

export default function SignatureTemplatesPage() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const canRegister = hasPermission(
    TOOLS_PERMISSIONS.SIGNATURE.TEMPLATES.REGISTER
  );
  const canModify = hasPermission(TOOLS_PERMISSIONS.SIGNATURE.TEMPLATES.MODIFY);
  const canRemove = hasPermission(TOOLS_PERMISSIONS.SIGNATURE.TEMPLATES.REMOVE);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE'
  >('ALL');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<SignatureTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SignatureTemplate | null>(
    null
  );

  // Debounce search input for server queries.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const templatesQuery = useInfiniteQuery({
    queryKey: [
      'signature',
      'templates',
      { search: debouncedSearch, activeFilter },
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const isActiveFilter =
        activeFilter === 'ACTIVE'
          ? true
          : activeFilter === 'INACTIVE'
            ? false
            : undefined;
      return signatureTemplatesService.listTemplates({
        page: pageParam,
        limit: TEMPLATES_PAGE_SIZE,
        search: debouncedSearch || undefined,
        isActive: isActiveFilter,
      });
    },
    getNextPageParam: lastPage =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    initialPageParam: 1,
  });

  const templates = useMemo(
    () => templatesQuery.data?.pages.flatMap(page => page.templates) ?? [],
    [templatesQuery.data]
  );

  // IntersectionObserver-based infinite scroll sentinel.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(entries => {
      const first = entries[0];
      if (
        first?.isIntersecting &&
        templatesQuery.hasNextPage &&
        !templatesQuery.isFetchingNextPage
      ) {
        templatesQuery.fetchNextPage();
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    templatesQuery.hasNextPage,
    templatesQuery.isFetchingNextPage,
    templatesQuery.fetchNextPage,
  ]);

  const toggleActiveMutation = useMutation({
    mutationFn: async ({
      template,
      nextActive,
    }: {
      template: SignatureTemplate;
      nextActive: boolean;
    }) => {
      return signatureTemplatesService.updateTemplate(template.id, {
        isActive: nextActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature', 'templates'] });
      toast.success('Status do modelo atualizado.');
    },
    onError: error => {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível atualizar o modelo.';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (template: SignatureTemplate) =>
      signatureTemplatesService.deleteTemplate(template.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature', 'templates'] });
      toast.success('Modelo excluído.');
      setDeleteTarget(null);
    },
    onError: error => {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o modelo.';
      toast.error(message);
    },
  });

  const handleCreate = useCallback(() => {
    setEditingTemplate(null);
    setWizardOpen(true);
  }, []);

  const handleEdit = useCallback((template: SignatureTemplate) => {
    setEditingTemplate(template);
    setWizardOpen(true);
  }, []);

  const handleWizardChange = useCallback((open: boolean) => {
    setWizardOpen(open);
    if (!open) setEditingTemplate(null);
  }, []);

  return (
    <ProtectedRoute
      requiredPermission={TOOLS_PERMISSIONS.SIGNATURE.TEMPLATES.ACCESS}
    >
      <div className="flex h-full flex-col">
        <PageActionBar
          breadcrumbItems={[
            { label: 'Assinatura Digital', href: '/signature' },
            { label: 'Modelos' },
          ]}
          buttons={
            canRegister
              ? [
                  {
                    title: 'Novo modelo',
                    icon: Plus,
                    onClick: handleCreate,
                  },
                ]
              : []
          }
        />

        <div
          className="flex-1 space-y-4 overflow-y-auto p-4"
          data-testid="signature-templates-page"
        >
          {/* Toolbar */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar modelos..."
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="h-9 pl-9"
                data-testid="signature-templates-search"
              />
            </div>
            <div className="flex gap-1">
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(option => (
                <Button
                  key={option}
                  variant={activeFilter === option ? 'default' : 'outline'}
                  size="sm"
                  className="h-9 px-2.5 text-xs"
                  onClick={() => setActiveFilter(option)}
                >
                  {option === 'ALL'
                    ? 'Todos'
                    : option === 'ACTIVE'
                      ? 'Ativos'
                      : 'Inativos'}
                </Button>
              ))}
            </div>
          </div>

          {/* Content */}
          {templatesQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card className="p-8 text-center">
              <LayoutTemplate className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
              <h3 className="mb-1 text-sm font-medium">
                Nenhum modelo cadastrado
              </h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Crie modelos reutilizáveis de envelopes para padronizar o envio
                de contratos, recibos e aditivos.
              </p>
              {canRegister && (
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="mr-1 h-4 w-4" />
                  Criar primeiro modelo
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-2">
              {templates.map(template => (
                <Card
                  key={template.id}
                  className="p-4"
                  data-testid="signature-template-row"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-medium">
                          {template.name}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="bg-violet-50 text-xs text-violet-700 dark:bg-violet-500/8 dark:text-violet-300"
                        >
                          {LEVEL_LABEL[template.signatureLevel] ??
                            template.signatureLevel}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 text-xs text-slate-700 dark:bg-slate-500/10 dark:text-slate-300"
                        >
                          {ROUTING_LABEL[template.routingType] ??
                            template.routingType}
                        </Badge>
                      </div>
                      {template.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {template.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {template.signerSlots.length}{' '}
                          {template.signerSlots.length === 1
                            ? 'signatário'
                            : 'signatários'}
                        </span>
                        <span>Lembrete: {template.reminderDays} dia(s)</span>
                        {template.expirationDays !== null && (
                          <span>
                            Validade: {template.expirationDays} dia(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {canModify && (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.isActive}
                            onCheckedChange={checked =>
                              toggleActiveMutation.mutate({
                                template,
                                nextActive: checked,
                              })
                            }
                            disabled={toggleActiveMutation.isPending}
                            aria-label={
                              template.isActive
                                ? 'Desativar modelo'
                                : 'Ativar modelo'
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            {template.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      )}
                      {canModify && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(template)}
                          aria-label="Editar modelo"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canRemove && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(template)}
                          aria-label="Excluir modelo"
                          className="text-rose-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              <div ref={sentinelRef} className="h-8" />
              {templatesQuery.isFetchingNextPage && (
                <p className="py-2 text-center text-xs text-muted-foreground">
                  Carregando mais...
                </p>
              )}
            </div>
          )}
        </div>

        <TemplateWizardDialog
          open={wizardOpen}
          onOpenChange={handleWizardChange}
          initialTemplate={editingTemplate}
        />

        <VerifyActionPinModal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => {
            if (deleteTarget) deleteMutation.mutate(deleteTarget);
          }}
          title="Excluir modelo"
          description={
            deleteTarget
              ? `Digite seu PIN para excluir o modelo "${deleteTarget.name}". Esta ação não pode ser desfeita.`
              : 'Digite seu PIN para confirmar.'
          }
        />
      </div>
    </ProtectedRoute>
  );
}
