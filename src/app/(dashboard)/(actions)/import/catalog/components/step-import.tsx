'use client';

// ============================================
// STEP IMPORT COMPONENT
// Passo 6: Validação no servidor + importação em lote
// ============================================

import { useCallback, useRef, useState } from 'react';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Package,
  Layers,
  Play,
  Pause,
  X,
  RefreshCw,
  PartyPopper,
  Building2,
  ShieldCheck,
  ArrowLeft,
  SkipForward,
} from 'lucide-react';
import { useCreateManufacturer } from '@/hooks/stock/use-stock-other';
import { importService } from '@/services/stock/import.service';
import type { Template } from '@/types/stock';
import type {
  BulkValidateResponse,
  BulkCreateProductInput,
  BulkCreateProductsResponse,
} from '@/types/stock';
import type {
  GroupedProduct,
  ImportProgress,
  ValidationResult,
} from '../hooks/use-catalog-import';

// ============================================
// TYPES
// ============================================

interface StepImportProps {
  template: Template;
  groupedProducts: GroupedProduct[];
  validationResult: ValidationResult;
  importProgress: ImportProgress;
  onImportProgressChange: (progress: ImportProgress) => void;
}

type ImportPhase =
  | 'idle'
  | 'validating'
  | 'validation-failed'
  | 'validation-passed'
  | 'creating-manufacturers'
  | 'importing'
  | 'completed';

interface ServerValidation {
  response: BulkValidateResponse;
  blockingErrors: string[];
  warnings: string[];
  categoryNameToId: Map<string, string>;
  manufacturerNameToId: Map<string, string>;
}

interface ImportSummary {
  totalCreated: number;
  totalSkipped: number;
  totalErrors: number;
  allErrors: Array<{ index: number; name: string; message: string }>;
  allSkipped: Array<{ name: string; reason: string }>;
}

// ============================================
// CONSTANTS
// ============================================

const BATCH_SIZE = 100;

// ============================================
// COMPONENT
// ============================================

export function StepImport({
  template,
  groupedProducts,
  validationResult,
  importProgress,
  onImportProgressChange,
}: StepImportProps) {
  const [phase, setPhase] = useState<ImportPhase>('idle');
  const [serverValidation, setServerValidation] =
    useState<ServerValidation | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(
    null
  );
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [manufacturerProgress, setManufacturerProgress] = useState('');

  const pauseRef = useRef(false);
  const cancelRef = useRef(false);

  const createManufacturerMutation = useCreateManufacturer();

  // ============================================
  // PHASE 1: SERVER-SIDE VALIDATION
  // ============================================

  const runServerValidation = useCallback(async () => {
    setPhase('validating');
    cancelRef.current = false;
    pauseRef.current = false;

    try {
      // Extract unique product names
      const productNames = [
        ...new Set(
          groupedProducts
            .map(p => String(p.productData.name || ''))
            .filter(Boolean)
        ),
      ];

      // Extract unique category names from product data
      const categoryNames = [
        ...new Set(
          groupedProducts
            .map(p => String(p.productData.categoryName || ''))
            .filter(Boolean)
        ),
      ];

      // Extract unique manufacturer names from product data
      const manufacturerNames = [
        ...new Set(
          groupedProducts
            .map(p => String(p.productData.manufacturerName || ''))
            .filter(Boolean)
        ),
      ];

      const response = await importService.bulkValidateProducts({
        productNames,
        categoryNames,
        manufacturerNames,
        templateId: template.id,
      });

      // Build name→ID maps
      const categoryNameToId = new Map<string, string>();
      for (const cat of response.existingCategories) {
        categoryNameToId.set(cat.name, cat.id);
      }

      const manufacturerNameToId = new Map<string, string>();
      for (const mfr of response.existingManufacturers) {
        manufacturerNameToId.set(mfr.name, mfr.id);
      }

      // Process validation results
      const blockingErrors: string[] = [];
      const warnings: string[] = [];

      // Missing categories = BLOCKING
      if (response.missingCategories.length > 0) {
        blockingErrors.push(
          `Categorias não encontradas: ${response.missingCategories.join(', ')}`
        );
      }

      // Template not valid = BLOCKING
      if (!response.templateValid) {
        blockingErrors.push(
          `O template "${template.name}" não foi encontrado ou está inativo.`
        );
      }

      // Missing manufacturers
      if (response.missingManufacturers.length > 0) {
        // Check which ones have CNPJ data in validationResult.manufacturersToCreate
        const manufacturersWithCnpj = new Set(
          validationResult.manufacturersToCreate
            .filter(m => !m.error && m.name)
            .map(m => m.name!)
        );

        const trulyMissing = response.missingManufacturers.filter(
          name => !manufacturersWithCnpj.has(name)
        );

        if (trulyMissing.length > 0) {
          blockingErrors.push(
            `Fabricantes não encontrados e sem dados para criação: ${trulyMissing.join(', ')}`
          );
        }
      }

      // Duplicate products = WARNING
      if (response.duplicateProducts.length > 0) {
        warnings.push(
          `${response.duplicateProducts.length} produto(s) já existem e serão ignorados: ${response.duplicateProducts.map(d => d.name).join(', ')}`
        );
      }

      const validation: ServerValidation = {
        response,
        blockingErrors,
        warnings,
        categoryNameToId,
        manufacturerNameToId,
      };

      setServerValidation(validation);

      if (blockingErrors.length > 0) {
        setPhase('validation-failed');
      } else {
        // Auto-continue if no blocking errors
        setPhase('validation-passed');
      }
    } catch (error) {
      logger.error(
        'Server validation failed',
        error instanceof Error ? error : undefined
      );
      setServerValidation({
        response: {
          duplicateProducts: [],
          existingCategories: [],
          missingCategories: [],
          existingManufacturers: [],
          missingManufacturers: [],
          templateValid: false,
        },
        blockingErrors: [
          `Erro ao validar no servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        ],
        warnings: [],
        categoryNameToId: new Map(),
        manufacturerNameToId: new Map(),
      });
      setPhase('validation-failed');
    }
  }, [groupedProducts, template, validationResult]);

  // ============================================
  // PHASE 2: CREATE MANUFACTURERS
  // ============================================

  const createManufacturers = useCallback(async (): Promise<
    Map<string, string>
  > => {
    if (!serverValidation) return new Map();

    const manufacturerNameToId = new Map(
      serverValidation.manufacturerNameToId
    );

    const manufacturersToCreate = validationResult.manufacturersToCreate.filter(
      m => !m.error && m.name
    );

    if (manufacturersToCreate.length === 0) return manufacturerNameToId;

    setPhase('creating-manufacturers');

    for (let i = 0; i < manufacturersToCreate.length; i++) {
      if (cancelRef.current) break;

      const mfr = manufacturersToCreate[i];
      setManufacturerProgress(
        `Criando fabricante ${i + 1} de ${manufacturersToCreate.length}: ${mfr.name}`
      );

      try {
        const result = await createManufacturerMutation.mutateAsync({
          name: mfr.name || `Fabricante ${mfr.cnpj}`,
          country: 'Brasil',
        });
        if (result?.manufacturer?.id && mfr.name) {
          manufacturerNameToId.set(mfr.name, result.manufacturer.id);
        }
      } catch (error) {
        logger.error(
          'Error creating manufacturer',
          error instanceof Error ? error : undefined
        );
      }
    }

    return manufacturerNameToId;
  }, [
    serverValidation,
    validationResult.manufacturersToCreate,
    createManufacturerMutation,
  ]);

  // ============================================
  // PHASE 3: BATCH IMPORT
  // ============================================

  const runBatchImport = useCallback(async () => {
    if (!serverValidation) return;

    // Phase 2: Create manufacturers first
    const manufacturerNameToId = await createManufacturers();

    if (cancelRef.current) {
      setPhase('idle');
      return;
    }

    // Phase 3: Build product inputs
    setPhase('importing');
    const startedAt = new Date();

    const products: BulkCreateProductInput[] = groupedProducts.map(product => {
      const name = String(product.productData.name || 'Sem nome');
      const description = product.productData.description as
        | string
        | undefined;

      // Map category name to ID
      const categoryName = product.productData.categoryName as
        | string
        | undefined;
      const categoryIds: string[] = [];
      if (categoryName && serverValidation.categoryNameToId.has(categoryName)) {
        categoryIds.push(serverValidation.categoryNameToId.get(categoryName)!);
      }

      // Map manufacturer name to ID (try name first, then CNPJ-based)
      const manufacturerName = product.productData.manufacturerName as
        | string
        | undefined;
      const manufacturerCnpj = product.productData.manufacturerCnpj as
        | string
        | undefined;
      let manufacturerId: string | undefined;

      if (manufacturerName && manufacturerNameToId.has(manufacturerName)) {
        manufacturerId = manufacturerNameToId.get(manufacturerName);
      } else if (manufacturerCnpj) {
        // Look up by CNPJ in the manufacturersToCreate list that was already created
        const mfrEntry = validationResult.manufacturersToCreate.find(
          m => m.cnpj === manufacturerCnpj && m.name
        );
        if (mfrEntry?.name && manufacturerNameToId.has(mfrEntry.name)) {
          manufacturerId = manufacturerNameToId.get(mfrEntry.name);
        }
      }

      const attributes = product.productData.attributes as
        | Record<string, unknown>
        | undefined;

      return {
        name,
        description,
        templateId: template.id,
        manufacturerId,
        categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
        attributes,
      };
    });

    // Split into batches
    const batches: BulkCreateProductInput[][] = [];
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      batches.push(products.slice(i, i + BATCH_SIZE));
    }

    setTotalBatches(batches.length);

    const summary: ImportSummary = {
      totalCreated: 0,
      totalSkipped: 0,
      totalErrors: 0,
      allErrors: [],
      allSkipped: [],
    };

    onImportProgressChange({
      status: 'importing',
      totalProducts: products.length,
      totalVariants: 0,
      importedProducts: 0,
      importedVariants: 0,
      failedProducts: 0,
      failedVariants: 0,
      errors: [],
      startedAt,
    });

    for (let i = 0; i < batches.length; i++) {
      // Check for cancel
      if (cancelRef.current) {
        onImportProgressChange({
          status: 'cancelled',
          totalProducts: products.length,
          totalVariants: 0,
          importedProducts: summary.totalCreated,
          importedVariants: 0,
          failedProducts: summary.totalErrors,
          failedVariants: 0,
          errors: summary.allErrors.map(e => ({
            productName: e.name,
            message: e.message,
          })),
          startedAt,
          completedAt: new Date(),
        });
        setImportSummary(summary);
        setPhase('completed');
        return;
      }

      // Check for pause
      while (pauseRef.current && !cancelRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setCurrentBatch(i + 1);

      try {
        const result: BulkCreateProductsResponse =
          await importService.bulkCreateProducts({
            products: batches[i],
            options: { skipDuplicates: true },
          });

        summary.totalCreated += result.created.length;
        summary.totalSkipped += result.skipped.length;
        summary.totalErrors += result.errors.length;
        summary.allErrors.push(...result.errors);
        summary.allSkipped.push(...result.skipped);
      } catch (error) {
        // Entire batch failed
        const batchSize = batches[i].length;
        summary.totalErrors += batchSize;
        for (const product of batches[i]) {
          summary.allErrors.push({
            index: 0,
            name: product.name,
            message:
              error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      }

      // Update progress after each batch
      onImportProgressChange({
        status: 'importing',
        totalProducts: products.length,
        totalVariants: 0,
        importedProducts: summary.totalCreated,
        importedVariants: 0,
        failedProducts: summary.totalErrors,
        failedVariants: 0,
        errors: summary.allErrors.map(e => ({
          productName: e.name,
          message: e.message,
        })),
        startedAt,
      });
    }

    // Phase 4: Complete
    setImportSummary(summary);

    onImportProgressChange({
      status:
        summary.totalErrors > 0 && summary.totalCreated === 0
          ? 'failed'
          : 'completed',
      totalProducts: products.length,
      totalVariants: 0,
      importedProducts: summary.totalCreated,
      importedVariants: 0,
      failedProducts: summary.totalErrors,
      failedVariants: 0,
      errors: summary.allErrors.map(e => ({
        productName: e.name,
        message: e.message,
      })),
      startedAt,
      completedAt: new Date(),
    });

    setPhase('completed');
  }, [
    serverValidation,
    createManufacturers,
    groupedProducts,
    template,
    validationResult,
    onImportProgressChange,
  ]);

  // ============================================
  // CONTROLS
  // ============================================

  const startImport = useCallback(async () => {
    cancelRef.current = false;
    pauseRef.current = false;
    setIsPaused(false);
    setImportSummary(null);
    setCurrentBatch(0);
    setTotalBatches(0);

    await runServerValidation();
  }, [runServerValidation]);

  const continueToImport = useCallback(async () => {
    cancelRef.current = false;
    pauseRef.current = false;
    setIsPaused(false);

    await runBatchImport();
  }, [runBatchImport]);

  const pauseImport = () => {
    pauseRef.current = true;
    setIsPaused(true);
    onImportProgressChange({
      ...importProgress,
      status: 'paused',
    });
  };

  const resumeImport = () => {
    pauseRef.current = false;
    setIsPaused(false);
    onImportProgressChange({
      ...importProgress,
      status: 'importing',
    });
  };

  const cancelImport = () => {
    cancelRef.current = true;
    pauseRef.current = false;
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const progressPercent =
    importProgress.totalProducts > 0
      ? Math.round(
          ((importProgress.importedProducts + importProgress.failedProducts) /
            importProgress.totalProducts) *
            100
        )
      : 0;

  const isRunning = phase === 'importing' && !isPaused;
  const isPausedState = phase === 'importing' && isPaused;

  // ============================================
  // RENDER: IDLE
  // ============================================

  if (phase === 'idle') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Package className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Pronto para Importar</h3>
              <p className="text-muted-foreground mt-1">
                {validationResult.totalProducts} produtos serão validados no
                servidor e importados em lote.
              </p>
            </div>
            <Button size="lg" onClick={startImport}>
              <Play className="h-5 w-5 mr-2" />
              Importar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // RENDER: VALIDATING
  // ============================================

  if (phase === 'validating') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
            <div className="rounded-full bg-primary/10 p-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Validando dados no servidor...</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Verificando duplicados, categorias, fabricantes e template.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // RENDER: VALIDATION FAILED
  // ============================================

  if (phase === 'validation-failed' && serverValidation) {
    return (
      <div className="space-y-6">
        {/* Error header */}
        <Card className="border-2 border-rose-200 dark:border-rose-900">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-rose-100 dark:bg-rose-900/30 p-3">
                <AlertCircle className="h-8 w-8 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-rose-600 dark:text-rose-400">
                  Validação encontrou problemas
                </h3>
                <p className="text-muted-foreground">
                  Corrija os erros abaixo antes de prosseguir.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blocking errors */}
        <Card className="border-rose-200 dark:border-rose-900">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
              Erros bloqueantes ({serverValidation.blockingErrors.length})
            </CardTitle>
            <CardDescription>
              Estes erros impedem a importação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[250px]">
              <ul className="space-y-2">
                {serverValidation.blockingErrors.map((error, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Warnings (if any) */}
        {serverValidation.warnings.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                Avisos ({serverValidation.warnings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[200px]">
                <ul className="space-y-2">
                  {serverValidation.warnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Action */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPhase('idle')}
            className="h-9 px-2.5"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para corrigir
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: VALIDATION PASSED
  // ============================================

  if (phase === 'validation-passed' && serverValidation) {
    return (
      <div className="space-y-6">
        {/* Success header */}
        <Card className="border-2 border-green-200 dark:border-green-900">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                  Validação concluída com sucesso
                </h3>
                <p className="text-muted-foreground">
                  Os dados estão prontos para importação.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warnings (if any, e.g. duplicates) */}
        {serverValidation.warnings.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                Avisos ({serverValidation.warnings.length})
              </CardTitle>
              <CardDescription>
                Estes avisos não impedem a importação.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[200px]">
                <ul className="space-y-2">
                  {serverValidation.warnings.map((warning, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Summary stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {groupedProducts.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Produtos a importar
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {serverValidation.response.duplicateProducts.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <SkipForward className="h-8 w-8 text-amber-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {serverValidation.response.duplicateProducts.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Serão ignorados (já existem)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {validationResult.manufacturersToCreate.filter(m => !m.error && m.name)
            .length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {
                        validationResult.manufacturersToCreate.filter(
                          m => !m.error && m.name
                        ).length
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Fabricantes a criar
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action */}
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => setPhase('idle')}
            className="h-9 px-2.5"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={continueToImport} className="h-9 px-2.5">
            <Play className="h-4 w-4 mr-2" />
            Continuar importação
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: CREATING MANUFACTURERS
  // ============================================

  if (phase === 'creating-manufacturers') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-4">
              <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Criando fabricantes...</h3>
              {manufacturerProgress && (
                <p className="text-sm text-muted-foreground mt-1">
                  {manufacturerProgress}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // RENDER: IMPORTING
  // ============================================

  if (phase === 'importing') {
    return (
      <div className="space-y-6">
        {/* Progress card */}
        <Card>
          <CardContent className="py-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPausedState ? (
                    <Pause className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  )}
                  <span className="font-medium">
                    {isPausedState
                      ? 'Importação Pausada'
                      : `Importando lote ${currentBatch} de ${totalBatches}...`}
                  </span>
                </div>
                <span className="text-2xl font-bold">{progressPercent}%</span>
              </div>

              <Progress value={progressPercent} className="h-3" />

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {importProgress.importedProducts} de{' '}
                  {importProgress.totalProducts} produtos
                </span>
                {importProgress.failedProducts > 0 && (
                  <span className="text-rose-500">
                    {importProgress.failedProducts} com erro
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex justify-center gap-3">
          {isPausedState ? (
            <Button onClick={resumeImport} className="h-9 px-2.5">
              <Play className="h-4 w-4 mr-2" />
              Continuar
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={pauseImport}
              className="h-9 px-2.5"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </Button>
          )}
          <Button
            variant="outline"
            className="h-9 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-950/30"
            onClick={cancelImport}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>

        {/* Errors during import */}
        {importProgress.errors.length > 0 && (
          <Card className="border-rose-200 dark:border-rose-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-rose-600 dark:text-rose-400">
                Erros durante importação ({importProgress.errors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px]">
                <ul className="space-y-1 text-sm">
                  {importProgress.errors.map((error, idx) => (
                    <li
                      key={idx}
                      className="text-rose-600 dark:text-rose-400"
                    >
                      &bull; {error.productName}: {error.message}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ============================================
  // RENDER: COMPLETED
  // ============================================

  if (phase === 'completed' && importSummary) {
    const hasErrors = importSummary.totalErrors > 0;
    const allFailed =
      importSummary.totalCreated === 0 && importSummary.totalErrors > 0;

    return (
      <div className="space-y-6">
        {/* Result header */}
        <Card
          className={cn(
            'border-2',
            allFailed
              ? 'border-rose-200 dark:border-rose-900'
              : 'border-green-200 dark:border-green-900'
          )}
        >
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-6 text-center">
              {allFailed ? (
                <div className="rounded-full bg-rose-100 dark:bg-rose-900/30 p-4">
                  <AlertCircle className="h-12 w-12 text-rose-600 dark:text-rose-400" />
                </div>
              ) : (
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                  <PartyPopper className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              )}
              <div>
                <h3
                  className={cn(
                    'text-2xl font-bold',
                    allFailed
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-green-600 dark:text-green-400'
                  )}
                >
                  {allFailed
                    ? 'Importação Falhou'
                    : 'Importação Concluída!'}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {allFailed
                    ? 'Ocorreram erros durante a importação. Verifique os detalhes abaixo.'
                    : 'Seus dados foram importados com sucesso.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Created */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {importSummary.totalCreated}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Produtos criados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skipped */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <SkipForward className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {importSummary.totalSkipped}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Produtos pulados (já existiam)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Errors */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-rose-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {importSummary.totalErrors}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Erros
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skipped list */}
        {importSummary.allSkipped.length > 0 && (
          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <SkipForward className="h-5 w-5" />
                Produtos ignorados ({importSummary.allSkipped.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[200px]">
                <ul className="space-y-2 text-sm">
                  {importSummary.allSkipped.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300 flex-shrink-0"
                      >
                        Duplicado
                      </Badge>
                      <span>
                        <strong>{item.name}</strong>: {item.reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Error list */}
        {importSummary.allErrors.length > 0 && (
          <Card className="border-rose-200 dark:border-rose-900">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-5 w-5" />
                Erros ({importSummary.allErrors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[200px]">
                <ul className="space-y-2 text-sm">
                  {importSummary.allErrors.map((error, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300 flex-shrink-0"
                      >
                        Erro
                      </Badge>
                      <span>
                        <strong>{error.name}</strong>: {error.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <Button variant="outline" asChild className="h-9 px-2.5">
            <a href="/stock/products">
              <Package className="h-4 w-4 mr-2" />
              Ver Produtos
            </a>
          </Button>
          <Button asChild className="h-9 px-2.5">
            <a href="/import">
              <RefreshCw className="h-4 w-4 mr-2" />
              Nova Importação
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // Fallback for completed without summary (e.g., cancelled)
  if (importProgress.status === 'cancelled') {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="rounded-full bg-muted p-4">
              <X className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Importação Cancelada</h3>
              <p className="text-muted-foreground mt-1">
                {importProgress.importedProducts} produtos foram importados
                antes do cancelamento.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild className="h-9 px-2.5">
                <a href="/stock/products">Ver Produtos Importados</a>
              </Button>
              <Button onClick={startImport} className="h-9 px-2.5">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
