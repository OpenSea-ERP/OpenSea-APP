'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { usePipelines, useDeletePipeline } from '@/hooks/sales/use-pipelines';
import { PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  GitBranch,
  Plus,
  Search,
  MoreVertical,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Pipeline, PipelineType } from '@/types/sales';
import { PIPELINE_TYPE_LABELS } from '@/types/sales';

const TYPE_COLORS: Record<PipelineType, string> = {
  SALES: 'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300',
  SUPPORT:
    'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
  CUSTOM:
    'bg-purple-50 text-purple-700 dark:bg-purple-500/8 dark:text-purple-300',
};

export default function PipelinesListPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canAccess = hasPermission(PERMISSIONS.SALES.PIPELINES.ACCESS);
  const canAdmin = hasPermission(PERMISSIONS.SALES.PIPELINES.ADMIN);

  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Pipeline | null>(null);

  const { data, isLoading, isError } = usePipelines({
    search: search || undefined,
  });

  const deletePipeline = useDeletePipeline();

  const pipelines = data?.pipelines ?? [];

  function handleDelete() {
    if (!deleteTarget) return;
    deletePipeline.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Pipeline excluido com sucesso.');
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error('Erro ao excluir pipeline.');
      },
    });
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold">Acesso negado</h2>
        <p className="text-sm text-muted-foreground">
          Voce nao tem permissao para acessar os pipelines.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Vendas', href: '/sales' },
          { label: 'Pipelines' },
        ]}
        buttons={
          canAdmin
            ? [
                {
                  id: 'create',
                  title: 'Novo Pipeline',
                  icon: Plus,
                  variant: 'default' as const,
                  onClick: () => {
                    // Future: open create modal or navigate to create page
                    toast.info('Funcionalidade de criacao em breve.');
                  },
                },
              ]
            : undefined
        }
      />

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar pipelines..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-muted-foreground">
            Erro ao carregar pipelines.
          </p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && pipelines.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-500/10">
            <GitBranch className="h-10 w-10 text-violet-500" />
          </div>
          <h2 className="text-lg font-semibold">Nenhum pipeline encontrado</h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Crie seu primeiro pipeline para comecar a gerenciar o funil de
            vendas.
          </p>
        </div>
      )}

      {/* Pipeline Cards Grid */}
      {!isLoading && !isError && pipelines.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelines.map(pipeline => (
            <Card
              key={pipeline.id}
              className={cn(
                'relative p-5 cursor-pointer transition-all',
                'bg-white dark:bg-slate-800/60 border border-border',
                'hover:shadow-md hover:border-violet-300 dark:hover:border-violet-500/30',
                !pipeline.isActive && 'opacity-60'
              )}
              onClick={() => router.push(`/sales/pipelines/${pipeline.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: pipeline.color
                        ? `${pipeline.color}15`
                        : '#8b5cf615',
                    }}
                  >
                    <GitBranch
                      className="h-5 w-5"
                      style={{
                        color: pipeline.color || '#8b5cf6',
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{pipeline.name}</h3>
                    {pipeline.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {pipeline.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Context menu */}
                {canAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          router.push(`/sales/pipelines/${pipeline.id}`);
                        }}
                      >
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400"
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteTarget(pipeline);
                        }}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant="secondary"
                  className={cn('text-xs', TYPE_COLORS[pipeline.type])}
                >
                  {PIPELINE_TYPE_LABELS[pipeline.type]}
                </Badge>
                {!pipeline.isActive && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400"
                  >
                    Inativo
                  </Badge>
                )}
                {pipeline.isDefault && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300"
                  >
                    Padrao
                  </Badge>
                )}
              </div>

              {/* Stage count */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span>
                    {pipeline.stages?.length ?? 0}{' '}
                    {(pipeline.stages?.length ?? 0) === 1 ? 'etapa' : 'etapas'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete modal */}
      <VerifyActionPinModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={handleDelete}
        title="Confirmar Exclusao"
        description={`Digite seu PIN de acao para excluir o pipeline "${deleteTarget?.name}".`}
      />
    </div>
  );
}
