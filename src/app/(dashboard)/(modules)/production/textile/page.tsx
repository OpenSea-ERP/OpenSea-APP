/**
 * Textile Page — Confecção
 * Plano de corte e tickets de pacote para produção têxtil.
 */

'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Scissors,
  Search,
  Layers,
  Ruler,
  Package,
  Loader2,
  Printer,
  Hash,
  BarChart3,
} from 'lucide-react';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { usePermissions } from '@/hooks/use-permissions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { PRODUCTION_PERMISSIONS } from '@/config/rbac/permission-codes';
import { textileService } from '@/services/production';
import type {
  CutPlanResult,
  BundleTicketsResult,
  SizeColorMatrix,
} from '@/services/production/textile.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_MATRIX: SizeColorMatrix = {
  sizes: ['P', 'M', 'G', 'GG'],
  colors: ['Branco', 'Preto'],
  quantities: {
    Branco: { P: 10, M: 20, G: 15, GG: 5 },
    Preto: { P: 8, M: 18, G: 12, GG: 4 },
  },
};

function parseMatrixJson(json: string): SizeColorMatrix | null {
  try {
    const parsed = JSON.parse(json);
    if (parsed.sizes && parsed.colors && parsed.quantities) {
      return parsed as SizeColorMatrix;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TextilePage() {
  const { hasPermission } = usePermissions();
  const [activeTab, setActiveTab] = useState('cut-plan');

  // Cut Plan state
  const [cutOrderId, setCutOrderId] = useState('');
  const [baseConsumption, setBaseConsumption] = useState('');
  const [wastePercentage, setWastePercentage] = useState('5');
  const [cutMatrixJson, setCutMatrixJson] = useState(
    JSON.stringify(DEFAULT_MATRIX, null, 2)
  );

  // Bundle Tickets state
  const [bundleOrderId, setBundleOrderId] = useState('');
  const [bundleSize, setBundleSize] = useState('15');
  const [bundleMatrixJson, setBundleMatrixJson] = useState(
    JSON.stringify(DEFAULT_MATRIX, null, 2)
  );

  const canAccess = hasPermission(PRODUCTION_PERMISSIONS.SHOPFLOOR.ACCESS);

  // ---- Mutations ------------------------------------------------------------

  const cutPlanMutation = useMutation({
    mutationFn: () => {
      const matrix = parseMatrixJson(cutMatrixJson);
      if (!matrix) throw new Error('JSON da matriz inválido');
      return textileService.generateCutPlan(cutOrderId.trim(), {
        matrix,
        baseFabricConsumptionPerPiece: Number(baseConsumption),
        wastePercentage: wastePercentage ? Number(wastePercentage) : undefined,
      });
    },
    onSuccess: () => {
      toast.success('Plano de corte gerado com sucesso');
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Erro ao gerar plano de corte'),
  });

  const bundleTicketsMutation = useMutation({
    mutationFn: () => {
      const matrix = parseMatrixJson(bundleMatrixJson);
      if (!matrix) throw new Error('JSON da matriz inválido');
      return textileService.generateBundleTickets(bundleOrderId.trim(), {
        bundleSize: bundleSize ? Number(bundleSize) : undefined,
        sizes: matrix.sizes,
        colors: matrix.colors,
        quantities: matrix.quantities,
      });
    },
    onSuccess: () => {
      toast.success('Tickets de pacote gerados com sucesso');
    },
    onError: (err: Error) =>
      toast.error(err.message || 'Erro ao gerar tickets de pacote'),
  });

  // ---- Handlers -------------------------------------------------------------

  function handleGenerateCutPlan() {
    if (!cutOrderId.trim()) {
      toast.error('Informe o ID da ordem de produção');
      return;
    }
    if (!baseConsumption || Number(baseConsumption) <= 0) {
      toast.error('Informe o consumo base por peça');
      return;
    }
    cutPlanMutation.mutate();
  }

  function handleGenerateBundleTickets() {
    if (!bundleOrderId.trim()) {
      toast.error('Informe o ID da ordem de produção');
      return;
    }
    bundleTicketsMutation.mutate();
  }

  // ---- Data -----------------------------------------------------------------

  const cutPlan: CutPlanResult | null = cutPlanMutation.data?.cutPlan ?? null;
  const bundleResult: BundleTicketsResult | null =
    bundleTicketsMutation.data?.result ?? null;

  // ---- Render ---------------------------------------------------------------

  if (!canAccess) return null;

  return (
    <div className="space-y-6" data-testid="production-textile-page">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Produção', href: '/production' },
          { label: 'Confecção', href: '/production/textile' },
        ]}
      />

      <PageHeroBanner
        title="Confecção"
        description="Plano de corte e tickets de pacote para produção têxtil"
        icon={Scissors}
        iconGradient="from-pink-500 to-pink-600"
        buttons={[]}
        hasPermission={hasPermission}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-12 mb-4">
          <TabsTrigger value="cut-plan" className="gap-2">
            <Scissors className="h-4 w-4" />
            Plano de Corte
          </TabsTrigger>
          <TabsTrigger value="bundle-tickets" className="gap-2">
            <Package className="h-4 w-4" />
            Tickets de Pacote
          </TabsTrigger>
        </TabsList>

        {/* --- Plano de Corte tab --- */}
        <TabsContent value="cut-plan" className="space-y-4">
          <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ID da Ordem de Produção"
                    value={cutOrderId}
                    onChange={e => setCutOrderId(e.target.value)}
                    className="pl-10"
                    data-testid="textile-cut-order-input"
                  />
                </div>
                <Button
                  size="sm"
                  className="h-9 px-2.5 gap-1"
                  onClick={handleGenerateCutPlan}
                  disabled={cutPlanMutation.isPending}
                >
                  {cutPlanMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Scissors className="h-4 w-4" />
                  )}
                  Gerar Plano de Corte
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-white/60">
                    Consumo base por peça (metros)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1.5"
                    value={baseConsumption}
                    onChange={e => setBaseConsumption(e.target.value)}
                    data-testid="textile-base-consumption-input"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-gray-500 dark:text-white/60">
                    Desperdício (%)
                  </Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="5"
                    value={wastePercentage}
                    onChange={e => setWastePercentage(e.target.value)}
                    data-testid="textile-waste-input"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 dark:text-white/60">
                  Matriz de tamanhos/cores (JSON)
                </Label>
                <textarea
                  className="w-full min-h-[160px] rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-3 text-sm font-mono text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={cutMatrixJson}
                  onChange={e => setCutMatrixJson(e.target.value)}
                  data-testid="textile-cut-matrix-input"
                />
              </div>
            </div>
          </Card>

          {/* Cut Plan Results */}
          {cutPlan && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                  label="Total de Peças"
                  value={String(cutPlan.totalPieces)}
                  icon={Package}
                  from="from-violet-500"
                  to="to-violet-600"
                />
                <StatCard
                  label="Tecido Estimado"
                  value={`${cutPlan.totalEstimatedFabricMeters.toFixed(2)} m`}
                  icon={Ruler}
                  from="from-sky-500"
                  to="to-sky-600"
                />
                <StatCard
                  label="Desperdício"
                  value={`${cutPlan.wastePercentage.toFixed(1)}%`}
                  icon={Scissors}
                  from="from-rose-500"
                  to="to-rose-600"
                />
                <StatCard
                  label="Total c/ Desperdício"
                  value={`${cutPlan.totalWithWaste.toFixed(2)} m`}
                  icon={BarChart3}
                  from="from-emerald-500"
                  to="to-emerald-600"
                />
                <StatCard
                  label="Camadas"
                  value={String(cutPlan.layersNeeded)}
                  icon={Layers}
                  from="from-teal-500"
                  to="to-teal-600"
                />
              </div>

              {/* Pieces per size */}
              {cutPlan.piecesPerSize.length > 0 && (
                <Card className="bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-white/10">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Distribuição por Tamanho
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10">
                          <th className="text-left p-4 font-medium text-gray-500 dark:text-white/60">
                            Tamanho
                          </th>
                          <th className="text-right p-4 font-medium text-gray-500 dark:text-white/60">
                            Peças
                          </th>
                          <th className="text-right p-4 font-medium text-gray-500 dark:text-white/60">
                            Tecido Estimado (m)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cutPlan.piecesPerSize.map(item => (
                          <tr
                            key={item.size}
                            className="border-b border-gray-100 dark:border-white/5 last:border-0"
                          >
                            <td className="p-4 font-medium text-gray-900 dark:text-white">
                              <Badge
                                variant="outline"
                                className="border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/8 dark:text-violet-300"
                              >
                                {item.size}
                              </Badge>
                            </td>
                            <td className="p-4 text-right text-gray-900 dark:text-white">
                              {item.totalPieces}
                            </td>
                            <td className="p-4 text-right text-gray-900 dark:text-white">
                              {item.estimatedFabricMeters.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Pieces per color */}
              {cutPlan.piecesPerColor.length > 0 && (
                <Card className="bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-white/10">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Distribuição por Cor
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10">
                          <th className="text-left p-4 font-medium text-gray-500 dark:text-white/60">
                            Cor
                          </th>
                          <th className="text-right p-4 font-medium text-gray-500 dark:text-white/60">
                            Total de Peças
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {cutPlan.piecesPerColor.map(item => (
                          <tr
                            key={item.color}
                            className="border-b border-gray-100 dark:border-white/5 last:border-0"
                          >
                            <td className="p-4 font-medium text-gray-900 dark:text-white">
                              <Badge
                                variant="outline"
                                className="border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-500/20 dark:bg-pink-500/8 dark:text-pink-300"
                              >
                                {item.color}
                              </Badge>
                            </td>
                            <td className="p-4 text-right text-gray-900 dark:text-white">
                              {item.totalPieces}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}

          {cutPlanMutation.isError && (
            <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-sm text-rose-600 dark:text-rose-400">
                Erro ao gerar plano de corte. Verifique o ID da ordem e o JSON
                da matriz.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* --- Tickets de Pacote tab --- */}
        <TabsContent value="bundle-tickets" className="space-y-4">
          <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ID da Ordem de Produção"
                    value={bundleOrderId}
                    onChange={e => setBundleOrderId(e.target.value)}
                    className="pl-10"
                    data-testid="textile-bundle-order-input"
                  />
                </div>
                <div className="w-40 space-y-1">
                  <Input
                    type="number"
                    placeholder="Tam. pacote"
                    value={bundleSize}
                    onChange={e => setBundleSize(e.target.value)}
                    data-testid="textile-bundle-size-input"
                  />
                </div>
                <Button
                  size="sm"
                  className="h-9 px-2.5 gap-1"
                  onClick={handleGenerateBundleTickets}
                  disabled={bundleTicketsMutation.isPending}
                >
                  {bundleTicketsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  Gerar Tickets
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 dark:text-white/60">
                  Matriz de tamanhos/cores (JSON)
                </Label>
                <textarea
                  className="w-full min-h-[160px] rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-3 text-sm font-mono text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={bundleMatrixJson}
                  onChange={e => setBundleMatrixJson(e.target.value)}
                  data-testid="textile-bundle-matrix-input"
                />
              </div>
            </div>
          </Card>

          {/* Bundle Tickets Summary */}
          {bundleResult && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Total de Pacotes"
                  value={String(bundleResult.totalBundles)}
                  icon={Package}
                  from="from-violet-500"
                  to="to-violet-600"
                />
                <StatCard
                  label="Total de Peças"
                  value={String(bundleResult.totalPieces)}
                  icon={Hash}
                  from="from-sky-500"
                  to="to-sky-600"
                />
                <StatCard
                  label="Tamanho do Pacote"
                  value={String(bundleResult.bundleSize)}
                  icon={Layers}
                  from="from-emerald-500"
                  to="to-emerald-600"
                />
              </div>

              {/* Bundle Tickets Table */}
              {bundleResult.bundles.length > 0 && (
                <Card className="bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-white/10">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Tickets Gerados ({bundleResult.bundles.length})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10">
                          <th className="text-left p-4 font-medium text-gray-500 dark:text-white/60">
                            Pacote
                          </th>
                          <th className="text-left p-4 font-medium text-gray-500 dark:text-white/60">
                            Tamanho
                          </th>
                          <th className="text-left p-4 font-medium text-gray-500 dark:text-white/60">
                            Cor
                          </th>
                          <th className="text-right p-4 font-medium text-gray-500 dark:text-white/60">
                            Quantidade
                          </th>
                          <th className="text-left p-4 font-medium text-gray-500 dark:text-white/60">
                            Código de Barras
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bundleResult.bundles.map(ticket => (
                          <tr
                            key={ticket.bundleNumber}
                            className="border-b border-gray-100 dark:border-white/5 last:border-0"
                          >
                            <td className="p-4 font-medium text-gray-900 dark:text-white">
                              #{ticket.bundleNumber}
                            </td>
                            <td className="p-4">
                              <Badge
                                variant="outline"
                                className="border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/8 dark:text-violet-300"
                              >
                                {ticket.size}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Badge
                                variant="outline"
                                className="border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-500/20 dark:bg-pink-500/8 dark:text-pink-300"
                              >
                                {ticket.color}
                              </Badge>
                            </td>
                            <td className="p-4 text-right text-gray-900 dark:text-white">
                              {ticket.quantity}
                            </td>
                            <td className="p-4 font-mono text-xs text-gray-500 dark:text-white/60">
                              {ticket.barcode}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}

          {bundleTicketsMutation.isError && (
            <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-sm text-rose-600 dark:text-rose-400">
                Erro ao gerar tickets de pacote. Verifique o ID da ordem e o
                JSON da matriz.
              </p>
            </Card>
          )}

          {bundleTicketsMutation.isSuccess &&
            bundleResult &&
            bundleResult.bundles.length === 0 && (
              <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
                <p className="text-sm text-gray-500 dark:text-white/60">
                  Nenhum ticket gerado para esta ordem.
                </p>
              </Card>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  from,
  to,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  from: string;
  to: string;
}) {
  return (
    <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-linear-to-br ${from} ${to} flex items-center justify-center`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-white/60">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}
