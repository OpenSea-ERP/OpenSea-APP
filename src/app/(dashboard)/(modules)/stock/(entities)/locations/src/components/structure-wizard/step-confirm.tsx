'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Warehouse,
  MapPin,
  Layers,
  Grid3X3,
  Box,
  Loader2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  BIN_DIRECTION_LABELS,
  SEPARATOR_LABELS,
  BIN_LABELING_LABELS,
} from '../../constants';
import type {
  ZoneStructureFormData,
  ReconfigurationPreviewResponse,
} from '@/types/stock';

interface StepConfirmProps {
  formData: ZoneStructureFormData;
  warehouseCode: string;
  warehouseName: string;
  zoneCode: string;
  zoneName: string;
  totalBins: number;
  firstAddress: string;
  lastAddress: string;
  reconfigPreview?: ReconfigurationPreviewResponse | null;
  isLoadingPreview?: boolean;
  occupiedBinsAction?: 'block' | 'force';
  onOccupiedBinsActionChange?: (action: 'block' | 'force') => void;
}

export function StepConfirm({
  formData,
  warehouseCode,
  warehouseName,
  zoneCode,
  zoneName,
  totalBins,
  firstAddress,
  lastAddress,
  reconfigPreview,
  isLoadingPreview,
  occupiedBinsAction = 'block',
  onOccupiedBinsActionChange,
}: StepConfirmProps) {
  const isReconfiguration =
    reconfigPreview && !reconfigPreview.isFirstConfiguration;
  const hasAffectedItems =
    isReconfiguration && reconfigPreview.totalAffectedItems > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Confirmar Configuração</h2>
        <p className="text-sm text-muted-foreground">
          Revise as informações antes de{' '}
          {isReconfiguration ? 'reconfigurar' : 'criar'} as localizações
        </p>
      </div>

      {/* Reconfiguration Preview */}
      {isLoadingPreview && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Calculando alterações...</AlertTitle>
          <AlertDescription>
            Comparando estrutura atual com a nova configuração.
          </AlertDescription>
        </Alert>
      )}

      {isReconfiguration && !isLoadingPreview && (
        <>
          {/* Safe reconfiguration */}
          {!hasAffectedItems && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-300">
                Reconfiguração Segura
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                Nenhum item será afetado por esta alteração.
              </AlertDescription>
            </Alert>
          )}

          {/* Diff summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumo das Alterações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">
                    {reconfigPreview.binsToPreserve}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nichos mantidos
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {reconfigPreview.binsToCreate}
                  </p>
                  <p className="text-xs text-muted-foreground">Novos nichos</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">
                    {reconfigPreview.binsToDeleteEmpty}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nichos removidos (vazios)
                  </p>
                </div>
                {reconfigPreview.addressUpdates > 0 && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {reconfigPreview.addressUpdates}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Endereços atualizados
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Warning for affected items */}
          {hasAffectedItems && (
            <>
              <Alert
                variant="destructive"
                className="border-amber-300 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200"
              >
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <AlertTitle>
                  {reconfigPreview.binsWithItems.length} nicho(s) com itens
                  serão afetados
                </AlertTitle>
                <AlertDescription>
                  <p className="mb-3">
                    {reconfigPreview.totalAffectedItems} item(ns) estão em
                    nichos que serão removidos pela nova estrutura.
                  </p>
                  <div className="space-y-1.5 mb-4">
                    {reconfigPreview.binsWithItems.map(bin => (
                      <div
                        key={bin.binId}
                        className="flex items-center justify-between px-3 py-1.5 rounded bg-white/60 dark:bg-black/20 text-sm"
                      >
                        <span className="font-mono">{bin.address}</span>
                        <span>{bin.itemCount} item(ns)</span>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Choice for handling occupied bins */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Como tratar estes nichos?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={occupiedBinsAction}
                    onValueChange={v =>
                      onOccupiedBinsActionChange?.(v as 'block' | 'force')
                    }
                    className="space-y-3"
                  >
                    <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem
                        value="block"
                        id="block"
                        className="mt-0.5"
                      />
                      <Label htmlFor="block" className="cursor-pointer flex-1">
                        <div className="font-medium">
                          Bloquear nichos para realocação manual
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Os nichos ficam bloqueados e os itens permanecem
                          vinculados. Você poderá realocar os itens
                          individualmente pelo mapa da zona.{' '}
                          <strong>Recomendado.</strong>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <RadioGroupItem
                        value="force"
                        id="force"
                        className="mt-0.5"
                      />
                      <Label htmlFor="force" className="cursor-pointer flex-1">
                        <div className="font-medium">
                          Desassociar itens imediatamente
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Os itens perdem a localização atual e ficam com o
                          último endereço conhecido registrado. As movimentações
                          serão registradas no histórico.
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Standard confirmation (first config) */}
      {!isReconfiguration && !isLoadingPreview && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Esta ação irá criar{' '}
            <strong>{totalBins.toLocaleString()} nichos</strong>{' '}
            automaticamente. Após a criação, você poderá visualizar e gerenciar
            cada nicho individualmente.
          </AlertDescription>
        </Alert>
      )}

      {/* Resumo da Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Resumo da Configuração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Localização */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Warehouse className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Armazém</p>
                <p className="font-medium">
                  {warehouseCode} - {warehouseName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Zona</p>
                <p className="font-medium">
                  {zoneCode} - {zoneName}
                </p>
              </div>
            </div>
          </div>

          {/* Estrutura */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Layers className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Corredores</p>
                <p className="text-lg font-bold text-blue-600">
                  {formData.aisles}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <Grid3X3 className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Prateleiras/corredor
                </p>
                <p className="text-lg font-bold text-emerald-600">
                  {formData.shelvesPerAisle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Box className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Nichos/prateleira
                </p>
                <p className="text-lg font-bold text-amber-600">
                  {formData.binsPerShelf}
                </p>
              </div>
            </div>
          </div>

          {/* Configurações do Código */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Padrão de Código</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Separador</span>
                <span className="font-medium">
                  {SEPARATOR_LABELS[formData.separator]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Dígitos do corredor
                </span>
                <span className="font-medium">{formData.aisleDigits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Dígitos da prateleira
                </span>
                <span className="font-medium">{formData.shelfDigits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Identificação do nicho
                </span>
                <span className="font-medium">
                  {BIN_LABELING_LABELS[formData.binLabeling]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Direção dos nichos
                </span>
                <span className="font-medium">
                  {BIN_DIRECTION_LABELS[formData.binDirection]}
                </span>
              </div>
            </div>
          </div>

          {/* Endereços */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">Intervalo de Endereços</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                <p className="text-xs text-muted-foreground mb-1">Primeiro</p>
                <p className="font-mono font-bold text-green-700 dark:text-green-400">
                  {firstAddress}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-center">
                <p className="text-xs text-muted-foreground mb-1">Último</p>
                <p className="font-mono font-bold text-amber-700 dark:text-amber-400">
                  {lastAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
              <span className="text-lg font-medium">
                Total de nichos{' '}
                {isReconfiguration ? 'na nova estrutura' : 'a criar'}
              </span>
              <span className="text-3xl font-bold text-primary">
                {totalBins.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
