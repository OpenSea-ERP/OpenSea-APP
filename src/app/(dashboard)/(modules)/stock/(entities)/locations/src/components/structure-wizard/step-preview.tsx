'use client';

import React from 'react';
import { Layers, Grid3X3, Box } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ZoneStructureFormData, AisleConfig } from '@/types/stock';

interface StepPreviewProps {
  formData: ZoneStructureFormData;
  warehouseCode: string;
  zoneCode: string;
  zoneName: string;
  totalBins: number;
  sampleAddresses: string[];
  aisles?: AisleConfig[]; // Nova prop para corredores independentes
}

export function StepPreview({
  formData,
  warehouseCode,
  zoneCode,
  zoneName,
  totalBins,
  sampleAddresses,
  aisles: aisleConfigs,
}: StepPreviewProps) {
  // Usar configurações de corredores independentes se disponível
  const hasIndependentAisles = aisleConfigs && aisleConfigs.length > 0;

  // Calcular totais
  const totalShelves = hasIndependentAisles
    ? aisleConfigs.reduce((sum, a) => sum + a.shelvesCount, 0)
    : formData.aisles * formData.shelvesPerAisle;

  const getBinLabel = (index: number, binsInShelf: number) => {
    if (formData.binLabeling.toUpperCase() === 'LETTERS') {
      return String.fromCharCode(65 + index);
    }
    return (index + 1).toString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Visualização da Estrutura</h2>
        <p className="text-sm text-muted-foreground">
          Veja como ficará a estrutura da zona {zoneName}
        </p>
      </div>

      {/* Resumo Visual */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Layers className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formData.aisles}</p>
                <p className="text-xs text-muted-foreground">Corredores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Grid3X3 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalShelves}</p>
                <p className="text-xs text-muted-foreground">
                  Prateleiras total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Box className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalBins.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Nichos total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualização dos Corredores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Estrutura Visual
            {hasIndependentAisles && aisleConfigs.length > 5 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Mostrando 5 de {aisleConfigs.length} corredores
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {hasIndependentAisles ? (
              // Renderiza com configurações independentes
              <>
                {aisleConfigs.slice(0, 5).map(aisle => {
                  const maxVisibleShelves = Math.min(aisle.shelvesCount, 10);
                  return (
                    <div key={aisle.aisleNumber} className="flex-shrink-0">
                      <div className="text-center mb-2">
                        <Badge variant="outline" className="font-mono">
                          C
                          {aisle.aisleNumber
                            .toString()
                            .padStart(formData.aisleDigits, '0')}
                        </Badge>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {aisle.shelvesCount} prat. × {aisle.binsPerShelf}{' '}
                          nichos
                        </div>
                      </div>

                      {/* Prateleiras do corredor */}
                      <div className="space-y-1">
                        {Array.from({ length: maxVisibleShelves }).map(
                          (_, shelfIndex) => (
                            <div
                              key={shelfIndex}
                              className="flex items-center gap-0.5 bg-muted/50 rounded p-1"
                            >
                              <span className="text-[10px] text-muted-foreground w-5 text-center">
                                {(shelfIndex + 1)
                                  .toString()
                                  .padStart(formData.shelfDigits, '0')}
                              </span>
                              {Array.from({ length: aisle.binsPerShelf }).map(
                                (_, binIndex) => {
                                  const displayIndex =
                                    formData.binDirection.toUpperCase() ===
                                    'BOTTOM_UP'
                                      ? aisle.binsPerShelf - 1 - binIndex
                                      : binIndex;
                                  return (
                                    <div
                                      key={binIndex}
                                      className={cn(
                                        'w-5 h-5 rounded-sm flex items-center justify-center text-[9px] font-medium',
                                        'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                      )}
                                    >
                                      {getBinLabel(
                                        displayIndex,
                                        aisle.binsPerShelf
                                      )}
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )
                        )}

                        {aisle.shelvesCount > maxVisibleShelves && (
                          <div className="text-center text-xs text-muted-foreground py-1">
                            ... +{aisle.shelvesCount - maxVisibleShelves}{' '}
                            prateleiras
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {aisleConfigs.length > 5 && (
                  <div className="flex-shrink-0 flex items-center justify-center w-24 text-muted-foreground text-sm">
                    ... +{aisleConfigs.length - 5} corredores
                  </div>
                )}
              </>
            ) : (
              // Fallback para modo antigo (uniforme)
              <>
                {Array.from({ length: Math.min(formData.aisles, 5) }).map(
                  (_, aisleIndex) => {
                    const maxVisibleShelves = Math.min(
                      formData.shelvesPerAisle,
                      10
                    );
                    return (
                      <div key={aisleIndex} className="flex-shrink-0">
                        <div className="text-center mb-2">
                          <Badge variant="outline" className="font-mono">
                            C
                            {(aisleIndex + 1)
                              .toString()
                              .padStart(formData.aisleDigits, '0')}
                          </Badge>
                        </div>

                        {/* Prateleiras do corredor */}
                        <div className="space-y-1">
                          {Array.from({ length: maxVisibleShelves }).map(
                            (_, shelfIndex) => (
                              <div
                                key={shelfIndex}
                                className="flex items-center gap-0.5 bg-muted/50 rounded p-1"
                              >
                                <span className="text-[10px] text-muted-foreground w-5 text-center">
                                  {(shelfIndex + 1)
                                    .toString()
                                    .padStart(formData.shelfDigits, '0')}
                                </span>
                                {Array.from({
                                  length: formData.binsPerShelf,
                                }).map((_, binIndex) => {
                                  const displayIndex =
                                    formData.binDirection.toUpperCase() ===
                                    'BOTTOM_UP'
                                      ? formData.binsPerShelf - 1 - binIndex
                                      : binIndex;
                                  return (
                                    <div
                                      key={binIndex}
                                      className={cn(
                                        'w-5 h-5 rounded-sm flex items-center justify-center text-[9px] font-medium',
                                        'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                      )}
                                    >
                                      {getBinLabel(
                                        displayIndex,
                                        formData.binsPerShelf
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )
                          )}

                          {formData.shelvesPerAisle > maxVisibleShelves && (
                            <div className="text-center text-xs text-muted-foreground py-1">
                              ... +
                              {formData.shelvesPerAisle - maxVisibleShelves}{' '}
                              prateleiras
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}

                {formData.aisles > 5 && (
                  <div className="flex-shrink-0 flex items-center justify-center w-24 text-muted-foreground text-sm">
                    ... +{formData.aisles - 5} corredores
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Endereços de Exemplo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Endereços de Exemplo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Primeiro endereço */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <span className="text-sm text-muted-foreground">
                Primeiro nicho
              </span>
              <span className="font-mono font-bold text-green-700 dark:text-green-400">
                {sampleAddresses[0]}
              </span>
            </div>

            {/* Endereço do meio */}
            {sampleAddresses.length > 2 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">
                  Exemplo do meio
                </span>
                <span className="font-mono font-bold">
                  {sampleAddresses[1]}
                </span>
              </div>
            )}

            {/* Último endereço */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <span className="text-sm text-muted-foreground">
                Último nicho
              </span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                {sampleAddresses[sampleAddresses.length - 1]}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Direção dos nichos:</strong>{' '}
          {formData.binDirection.toUpperCase() === 'BOTTOM_UP'
            ? 'A é o nicho inferior (mais baixo)'
            : 'A é o nicho superior (mais alto)'}
        </p>
        <p>
          <strong>Formato do código:</strong> {warehouseCode}
          {formData.separator}
          {zoneCode}
          {formData.separator}
          [corredor][prateleira]
          {formData.separator}
          [nicho]
        </p>
      </div>
    </div>
  );
}
