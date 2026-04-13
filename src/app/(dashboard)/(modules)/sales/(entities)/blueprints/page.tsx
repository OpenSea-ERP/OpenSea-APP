'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useBlueprints,
  useDeleteBlueprint,
} from '@/hooks/sales/use-blueprints';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  FileCode2,
  Plus,
  Search,
  MoreVertical,
  Layers,
  AlertTriangle,
  GitBranch,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Blueprint, BlueprintStatus } from '@/types/sales';
import { BLUEPRINT_STATUS_LABELS } from '@/types/sales';
import { CreateBlueprintWizard } from './src/components/create-blueprint-wizard';

const STATUS_COLORS: Record<BlueprintStatus, string> = {
  ACTIVE:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
  INACTIVE:
    'bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400',
  DRAFT: 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
};

export default function BlueprintsListPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canAccess = hasPermission(SALES_PERMISSIONS.BLUEPRINTS.ACCESS);
  const canAdmin = hasPermission(SALES_PERMISSIONS.BLUEPRINTS.ADMIN);

  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Blueprint | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data, isLoading, isError } = useBlueprints({
    search: search || undefined,
  });

  const deleteBlueprint = useDeleteBlueprint();

  const blueprints = data?.blueprints ?? [];

  function handleDelete() {
    if (!deleteTarget) return;
    deleteBlueprint.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Modelo de processo excluído com sucesso.');
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error('Erro ao excluir modelo de processo.');
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
          Você não tem permissão para acessar os modelos de processo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="blueprints-page">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Vendas', href: '/sales' },
          { label: 'Modelos de Processo' },
        ]}
        buttons={
          canAdmin
            ? [
                {
                  id: 'create',
                  title: 'Novo Modelo',
                  icon: Plus,
                  variant: 'default' as const,
                  onClick: () => setWizardOpen(true),
                },
              ]
            : undefined
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar modelos de processo..."
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
            Erro ao carregar modelos de processo.
          </p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && blueprints.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-500/10">
            <FileCode2 className="h-10 w-10 text-violet-500" />
          </div>
          <h2 className="text-lg font-semibold">
            Nenhum modelo de processo encontrado
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Crie seu primeiro modelo de processo para padronizar as regras de
            cada etapa do pipeline.
          </p>
        </div>
      )}

      {/* Cards Grid */}
      {!isLoading && !isError && blueprints.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blueprints.map(blueprint => (
            <Card
              key={blueprint.id}
              className={cn(
                'relative p-5 cursor-pointer transition-all',
                'bg-white dark:bg-slate-800/60 border border-border',
                'hover:shadow-md hover:border-violet-300 dark:hover:border-violet-500/30',
                blueprint.status === 'INACTIVE' && 'opacity-60'
              )}
              onClick={() => router.push(`/sales/blueprints/${blueprint.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-500/10">
                    <FileCode2 className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{blueprint.name}</h3>
                    {blueprint.pipelineName && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        {blueprint.pipelineName}
                      </p>
                    )}
                  </div>
                </div>

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
                          router.push(`/sales/blueprints/${blueprint.id}`);
                        }}
                      >
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          router.push(`/sales/blueprints/${blueprint.id}/edit`);
                        }}
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400"
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteTarget(blueprint);
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
                  className={cn('text-xs', STATUS_COLORS[blueprint.status])}
                >
                  {BLUEPRINT_STATUS_LABELS[blueprint.status]}
                </Badge>
              </div>

              {/* Stage count */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span>
                    {blueprint.stageRules?.length ?? 0}{' '}
                    {(blueprint.stageRules?.length ?? 0) === 1
                      ? 'regra de etapa'
                      : 'regras de etapa'}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <VerifyActionPinModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={handleDelete}
        title="Confirmar Exclusão"
        description={`Digite seu PIN de ação para excluir o modelo "${deleteTarget?.name}".`}
      />

      {/* Create Wizard */}
      <CreateBlueprintWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
