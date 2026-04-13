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
import { useBlueprint } from '@/hooks/sales/use-blueprints';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  ArrowLeft,
  FileCode2,
  Pencil,
  Layers,
  GitBranch,
  CheckCircle2,
  Circle,
  ShieldCheck,
} from 'lucide-react';
import type { BlueprintStatus } from '@/types/sales';
import { BLUEPRINT_STATUS_LABELS } from '@/types/sales';

const STATUS_COLORS: Record<BlueprintStatus, string> = {
  ACTIVE:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
  INACTIVE:
    'bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400',
  DRAFT: 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
};

function BlueprintDetailContent() {
  const params = useParams();
  const router = useRouter();
  const blueprintId = params.id as string;

  const { hasPermission } = usePermissions();
  const canAdmin = hasPermission(SALES_PERMISSIONS.BLUEPRINTS.ADMIN);

  const { data, isLoading, isError } = useBlueprint(blueprintId);
  const blueprint = data?.blueprint;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !blueprint) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold">
          Modelo de processo não encontrado
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          O modelo solicitado não existe ou você não tem permissão para
          acessá-lo.
        </p>
        <Link href="/sales/blueprints">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Modelos
          </Button>
        </Link>
      </div>
    );
  }

  const sortedRules = [...(blueprint.stageRules ?? [])].sort(
    (a, b) => a.position - b.position
  );

  return (
    <div className="flex flex-col gap-4" data-testid="blueprint-detail">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Vendas', href: '/sales' },
          { label: 'Modelos de Processo', href: '/sales/blueprints' },
          { label: blueprint.name },
        ]}
        buttons={
          canAdmin
            ? [
                {
                  id: 'edit',
                  title: 'Editar',
                  icon: Pencil,
                  variant: 'default' as const,
                  onClick: () =>
                    router.push(`/sales/blueprints/${blueprintId}/edit`),
                },
              ]
            : undefined
        }
      />

      {/* Identity Card */}
      <Card className="bg-white/5 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/10">
              <FileCode2 className="h-6 w-6 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{blueprint.name}</h1>
              {blueprint.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {blueprint.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <GitBranch className="h-3.5 w-3.5" />
                <span>{blueprint.pipelineName || 'Pipeline'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className={cn('text-xs', STATUS_COLORS[blueprint.status])}
            >
              {BLUEPRINT_STATUS_LABELS[blueprint.status]}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Stage Rules */}
      <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-violet-500" />
          <h2 className="text-base font-semibold">Regras por Etapa</h2>
          <Badge variant="secondary" className="text-xs ml-2">
            {sortedRules.length} {sortedRules.length === 1 ? 'etapa' : 'etapas'}
          </Badge>
        </div>

        {sortedRules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma regra configurada para este modelo.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {sortedRules.map((rule, idx) => (
            <div
              key={rule.id}
              className="border border-border rounded-lg p-4 relative"
            >
              {/* Connector line */}
              {idx < sortedRules.length - 1 && (
                <div className="absolute left-8 top-full w-0.5 h-4 bg-border" />
              )}

              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold">
                  {idx + 1}
                </div>
                <h3 className="text-sm font-semibold">{rule.stageName}</h3>
              </div>

              {rule.requiredFields.length === 0 ? (
                <p className="text-xs text-muted-foreground ml-10">
                  Nenhum campo obrigatório nesta etapa.
                </p>
              ) : (
                <div className="ml-10 space-y-2">
                  {rule.requiredFields.map((field, fieldIdx) => (
                    <div
                      key={fieldIdx}
                      className="flex items-center gap-2 text-sm"
                    >
                      {field.isRequired ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span>{field.fieldName}</span>
                      {field.isRequired && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300"
                        >
                          Obrigatório
                        </Badge>
                      )}
                      {field.validationType && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-sky-50 text-sky-700 dark:bg-sky-500/8 dark:text-sky-300"
                        >
                          {field.validationType}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function BlueprintDetailPage() {
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
      <BlueprintDetailContent />
    </Suspense>
  );
}
