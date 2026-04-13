/**
 * BOM Detail Page
 * Página de detalhes da lista de materiais com tabs de itens e roteiro
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PRODUCTION_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { bomsService } from '@/services/production';
import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  Bom,
  BomItem,
  BomStatus,
  OperationRouting,
  OperationRoutingsResponse,
} from '@/types/production';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle,
  LayoutList,
  Loader2,
  Package,
  Route,
  Star,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const BOM_STATUS_LABELS: Record<BomStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativa',
  OBSOLETE: 'Obsoleta',
};

const BOM_STATUS_COLORS: Record<BomStatus, string> = {
  DRAFT:
    'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
  ACTIVE:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  OBSOLETE:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
};

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex items-start justify-between dark:bg-slate-800 p-4 rounded-lg">
      <div className="flex-1 text-xs sm:text-sm">
        <div className="font-bold uppercase text-muted-foreground mb-2">
          {label}
        </div>
        <p className="text-sm sm:text-base text-foreground">
          {value ?? (
            <span className="text-slate-400 dark:text-slate-500/80">
              &mdash;
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export default function BomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const bomId = params.id as string;

  const [isApproving, setIsApproving] = useState(false);

  const {
    data: bomData,
    isLoading: bomLoading,
    error: bomError,
  } = useQuery({
    queryKey: ['boms', bomId],
    queryFn: async () => {
      const res = await bomsService.getById(bomId);
      return res.bom;
    },
    enabled: !!bomId,
  });

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['bom-items', bomId],
    queryFn: async () => {
      const res = await bomsService.listItems(bomId);
      return res.bomItems;
    },
    enabled: !!bomId,
  });

  const { data: routingsData, isLoading: routingsLoading } = useQuery({
    queryKey: ['bom-routings', bomId],
    queryFn: async () => {
      const res = await apiClient.get<OperationRoutingsResponse>(
        API_ENDPOINTS.PRODUCTION.BOMS.ROUTINGS.LIST(bomId),
      );
      return res.operationRoutings;
    },
    enabled: !!bomId,
  });

  const bom = bomData as Bom | undefined;
  const bomItems = (itemsData as BomItem[] | undefined) ?? [];
  const routings = (routingsData as OperationRouting[] | undefined) ?? [];

  const approveMutation = useMutation({
    mutationFn: () => bomsService.approve(bomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      toast.success('BOM aprovada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao aprovar a BOM.');
    },
  });

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveMutation.mutateAsync();
    } finally {
      setIsApproving(false);
    }
  };

  const formatDate = (date: string | null) =>
    date
      ? new Date(date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : null;

  // Loading
  if (bomLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Produção', href: '/production' },
              { label: 'Engenharia' },
              { label: 'BOMs', href: '/production/engineering/boms' },
              { label: '...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  // Error
  if (bomError || !bom) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Produção', href: '/production' },
              { label: 'Engenharia' },
              { label: 'BOMs', href: '/production/engineering/boms' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="BOM não encontrada"
            message="A lista de materiais que você procura não existe ou foi removida."
            action={{
              label: 'Voltar para BOMs',
              onClick: () => router.push('/production/engineering/boms'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const canApprove =
    hasPermission(PRODUCTION_PERMISSIONS.ENGINEERING.ADMIN) &&
    bom.status === 'DRAFT';

  const actionButtons: HeaderButton[] = [];
  if (canApprove) {
    actionButtons.push({
      id: 'approve',
      title: isApproving ? 'Aprovando...' : 'Aprovar BOM',
      icon: isApproving ? Loader2 : CheckCircle,
      onClick: handleApprove,
      variant: 'default',
      disabled: isApproving,
    });
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Produção', href: '/production' },
            { label: 'Engenharia' },
            { label: 'BOMs', href: '/production/engineering/boms' },
            { label: bom.name },
          ]}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5" data-testid="bom-identity-card">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-cyan-600 shadow-lg">
              <LayoutList className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h1 className="truncate text-xl font-bold">{bom.name}</h1>
                <span
                  className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${BOM_STATUS_COLORS[bom.status]}`}
                >
                  {BOM_STATUS_LABELS[bom.status]}
                </span>
                {bom.isDefault && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-amber-600/25 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/8 dark:text-amber-300">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    Padrão
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span>v{bom.version}</span>
                <span>Base: {bom.baseQuantity}</span>
                {bom.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-sky-400" />
                    Criada em {formatDate(bom.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Card className="overflow-hidden bg-white/5 py-2">
          <Tabs defaultValue="items" className="px-6 py-4">
            <TabsList className="grid w-full grid-cols-2 h-12 mb-4">
              <TabsTrigger value="items">
                Materiais ({bomItems.length})
              </TabsTrigger>
              <TabsTrigger value="routings">
                Roteiro ({routings.length})
              </TabsTrigger>
            </TabsList>

            {/* Items Tab */}
            <TabsContent value="items">
              <div className="space-y-5">
                <SectionHeader
                  icon={Package}
                  title="Materiais"
                  subtitle="Itens que compõem esta lista de materiais"
                />
                {itemsLoading ? (
                  <GridLoading count={3} layout="list" size="sm" />
                ) : bomItems.length === 0 ? (
                  <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 text-center">
                    <p className="text-sm text-muted-foreground">
                      Nenhum material adicionado a esta BOM.
                    </p>
                  </div>
                ) : (
                  <div className="w-full rounded-xl border border-border bg-white dark:bg-slate-800/60 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-gray-50 dark:bg-slate-800">
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                            #
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                            Material ID
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                            Quantidade
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                            Unidade
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                            Desperdício %
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                            Opcional
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bomItems
                          .sort((a, b) => a.sequence - b.sequence)
                          .map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-border last:border-0 hover:bg-gray-50/50 dark:hover:bg-slate-700/20"
                            >
                              <td className="px-4 py-3 text-muted-foreground">
                                {item.sequence}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs">
                                {item.materialId}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {item.quantity.toLocaleString('pt-BR')}
                              </td>
                              <td className="px-4 py-3">{item.unit}</td>
                              <td className="px-4 py-3 text-right">
                                {item.wastagePercent}%
                              </td>
                              <td className="px-4 py-3 text-center">
                                {item.isOptional ? (
                                  <span className="inline-flex items-center rounded-full border border-amber-600/25 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/8 dark:text-amber-300">
                                    Sim
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    &mdash;
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Routings Tab */}
            <TabsContent value="routings">
              <div className="space-y-5">
                <SectionHeader
                  icon={Route}
                  title="Roteiro de Operações"
                  subtitle="Sequência de operações para fabricação"
                />
                {routingsLoading ? (
                  <GridLoading count={3} layout="list" size="sm" />
                ) : routings.length === 0 ? (
                  <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 text-center">
                    <p className="text-sm text-muted-foreground">
                      Nenhuma operação definida neste roteiro.
                    </p>
                  </div>
                ) : (
                  <div className="w-full rounded-xl border border-border bg-white dark:bg-slate-800/60 overflow-hidden">
                    <table className="w-full text-sm" data-testid="routings-table">
                      <thead>
                        <tr className="border-b border-border bg-gray-50 dark:bg-slate-800">
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                            #
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                            Operação
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                            Setup (min)
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                            Execução (min)
                          </th>
                          <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                            Espera (min)
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                            Inspeção
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                            Opcional
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                            Habilidade
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {routings
                          .sort((a, b) => a.sequence - b.sequence)
                          .map((r) => (
                            <tr
                              key={r.id}
                              className="border-b border-border last:border-0 hover:bg-gray-50/50 dark:hover:bg-slate-700/20"
                              data-testid={`routing-row-${r.id}`}
                            >
                              <td className="px-4 py-3 text-muted-foreground">
                                {r.sequence}
                              </td>
                              <td className="px-4 py-3 font-medium">
                                {r.operationName}
                                {r.description && (
                                  <span className="block text-xs text-muted-foreground mt-0.5">
                                    {r.description}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums">
                                {r.setupTime}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums">
                                {r.executionTime}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums">
                                {r.waitTime}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {r.isQualityCheck ? (
                                  <span className="inline-flex items-center rounded-full border border-emerald-600/25 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/8 dark:text-emerald-300">
                                    Sim
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    &mdash;
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {r.isOptional ? (
                                  <span className="inline-flex items-center rounded-full border border-sky-600/25 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/8 dark:text-sky-300">
                                    Sim
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">
                                    &mdash;
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {r.skillRequired || '\u2014'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* BOM Details */}
        <Card className="overflow-hidden bg-white/5 py-2">
          <div className="space-y-8 px-6 py-4">
            <div className="space-y-5">
              <SectionHeader
                icon={LayoutList}
                title="Informações da BOM"
                subtitle="Dados gerais da lista de materiais"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-6 md:grid-cols-3">
                  <InfoField label="Nome" value={bom.name} />
                  <InfoField label="ID do Produto" value={bom.productId} />
                  <InfoField label="Versão" value={`v${bom.version}`} />
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  <InfoField
                    label="Quantidade Base"
                    value={bom.baseQuantity}
                  />
                  <InfoField
                    label="Válida de"
                    value={formatDate(bom.validFrom)}
                  />
                  <InfoField
                    label="Válida até"
                    value={formatDate(bom.validUntil)}
                  />
                </div>
                {bom.description && (
                  <div className="mt-6">
                    <InfoField label="Descrição" value={bom.description} />
                  </div>
                )}
                {bom.approvedAt && (
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <InfoField
                      label="Aprovada em"
                      value={formatDate(bom.approvedAt)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </PageBody>
    </PageLayout>
  );
}
