'use client';

import { Header } from '@/components/layout/header';
import { PageLayout } from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  CheckCircle2,
  HelpCircle,
  Layers,
  ListTree,
  Play,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ImportProgressDialog } from '../../_shared/components/import-progress-dialog';
import { ImportSpreadsheet } from '../../_shared/components/import-spreadsheet';
import {
  ENTITY_DEFINITIONS,
  getBasePath,
} from '../../_shared/config/entity-definitions';
import { useImportProcess } from '../../_shared/hooks/use-import-process';
import {
  useImportSpreadsheet,
  type DecimalSeparator,
} from '../../_shared/hooks/use-import-spreadsheet';
import {
  useVariantsWithDetails,
  useBins,
} from '../../_shared/hooks/use-reference-data';
import type {
  FieldOption,
  ImportConfig,
  ValidationResult,
} from '../../_shared/types';

// Extended config for items
interface ItemImportConfig extends ImportConfig {
  variantId?: string | null;
  variantName?: string;
  productName?: string;
  isAllVariants?: boolean;
}

// Helper to get config from sessionStorage
function getActiveConfig(): ItemImportConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem('import-items-config');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
    };
  } catch {
    return null;
  }
}

export default function ItemsSheetsPage() {
  const router = useRouter();
  const basePath = getBasePath('items');
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [config, setConfig] = useState<ItemImportConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decimalSeparator, setDecimalSeparator] =
    useState<DecimalSeparator>('comma');

  const entityDef = ENTITY_DEFINITIONS.items;

  // Fetch variants for reference data (for "Todos" mode)
  const { data: variants } = useVariantsWithDetails();

  // Fetch bins for bin selection
  const {
    data: bins,
    isLoading: isLoadingBins,
    isError: isBinsError,
  } = useBins();

  // Load config on mount
  useEffect(() => {
    const loadedConfig = getActiveConfig();
    setConfig(loadedConfig);
    setIsLoading(false);
  }, []);

  // Get enabled fields from config
  const enabledFields = useMemo(() => {
    if (!config) return [];
    return config.fields
      .filter(f => f.enabled)
      .sort((a, b) => a.order - b.order);
  }, [config]);

  // Count custom attributes
  const customAttributeCount = useMemo(() => {
    return enabledFields.filter(f => f.key.startsWith('attributes.')).length;
  }, [enabledFields]);

  // Build reference data for dropdowns
  const referenceDataMap = useMemo(() => {
    const map: Record<string, FieldOption[]> = {};

    enabledFields.forEach(field => {
      // For select fields with options
      if (field.type === 'select' && field.options) {
        map[field.key] = field.options;
      }
      // For variantId reference field (in "Todos" mode)
      // Two-line format:
      // Line 1 (badges): [Template] [Produto] [Fabricante]
      // Line 2: [Nome Variante] - ([Referência])
      if (field.key === 'variantId' && field.type === 'reference' && variants) {
        map[field.key] = variants.map(v => {
          // Build badges for first line
          const badges = [
            v.templateName,
            v.productName,
            v.manufacturerName,
          ].filter(Boolean) as string[];

          // Build the variant name line: [Nome Variante] - ([Referência])
          const variantLine = v.reference
            ? `${v.name} - (${v.reference})`
            : v.name;

          // Label for display in cell (single line fallback)
          const label =
            badges.length > 0
              ? `${badges.join(' ')} / ${variantLine}`
              : variantLine;

          return {
            value: v.id,
            label, // Used when displaying in the cell
            secondaryLabel: variantLine, // Main text in dialog
            badges, // Badges shown above the main text
            // Add searchText for multi-field search
            searchText: [
              v.name,
              v.productName,
              v.reference,
              v.sku,
              v.templateName,
              v.manufacturerName,
              v.productCode,
            ]
              .filter(Boolean)
              .join(' '),
          };
        });
      }
      // For binId reference field (storage locations)
      if (field.key === 'binId' && field.type === 'reference' && bins) {
        map[field.key] = bins;
      }
    });

    return map;
  }, [enabledFields, variants, bins]);

  // Check for bins availability when binId field is enabled
  const hasBinField = enabledFields.some(f => f.key === 'binId');
  useEffect(() => {
    if (hasBinField && !isLoadingBins) {
      if (isBinsError) {
        toast.error('Erro ao carregar locais (bins). Verifique sua conexão.');
      } else if (!bins || bins.length === 0) {
        toast.warning(
          'Nenhum local (bin) disponível. Cadastre bins para poder selecionar na planilha.'
        );
      }
    }
  }, [hasBinField, isLoadingBins, isBinsError, bins]);

  // Spreadsheet hook
  const spreadsheet = useImportSpreadsheet(enabledFields, { decimalSeparator });

  // Import process hook
  const importProcess = useImportProcess({
    entityType: 'items',
    batchSize: 10,
    delayBetweenBatches: 1000,
    // Only inject variantId if a specific variant is selected (not "Todos" mode)
    transformRow:
      config?.variantId && !config?.isAllVariants
        ? row => ({
            ...row,
            data: { ...row.data, variantId: config.variantId },
          })
        : undefined,
    onComplete: result => {
      toast.success(
        `Importacao concluida! ${result.importedRows} items importados.`
      );
    },
    onError: error => {
      toast.error(`Erro na importacao: ${error.message}`);
    },
  });

  // Update headers when config changes
  useEffect(() => {
    if (enabledFields.length > 0) {
      spreadsheet.updateHeaders(enabledFields);
    }
  }, [enabledFields]);

  // Clear validation when decimal separator changes
  useEffect(() => {
    setValidationResult(null);
  }, [decimalSeparator]);

  const handleValidate = () => {
    const result = spreadsheet.validate();
    setValidationResult(result);

    if (result.valid) {
      toast.success(`${result.totalRows} linhas validadas com sucesso!`);
    } else {
      toast.error(
        `${result.errors.length} erros encontrados. Corrija antes de importar.`
      );
    }
  };

  const handleImport = async () => {
    const result = spreadsheet.validate();
    setValidationResult(result);

    if (!result.valid) {
      toast.error('Corrija os erros antes de importar.');
      return;
    }

    if (result.totalRows === 0) {
      toast.error('Nenhum dado para importar.');
      return;
    }

    const rowData = spreadsheet.getRowData();
    setShowProgressDialog(true);

    try {
      await importProcess.startImport(rowData);
    } catch {
      // Error handled by onError callback
    }
  };

  const handleProgressClose = () => {
    setShowProgressDialog(false);
    importProcess.reset();

    if (importProcess.isCompleted) {
      spreadsheet.clearAll();
      sessionStorage.removeItem('import-items-config');
      router.push(basePath);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <PageLayout backgroundVariant="none" maxWidth="full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageLayout>
    );
  }

  // No config - need to configure first
  if (!config || enabledFields.length === 0) {
    return (
      <PageLayout backgroundVariant="none" maxWidth="full">
        <Header
          title="Importar Items"
          description="Preencha a planilha com os dados dos items"
          buttons={[
            {
              id: 'back',
              title: 'Voltar',
              icon: ArrowLeft,
              variant: 'outline',
              onClick: () => router.push(basePath),
            },
          ]}
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">
              Configuracao Necessaria
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Selecione uma variante e configure os campos de importacao
            </p>
            <Button onClick={() => router.push(`${basePath}/config`)}>
              <Settings className="w-4 h-4 mr-2" />
              Configurar Importacao
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const isAllVariants = config.isAllVariants;

  return (
    <PageLayout backgroundVariant="none" maxWidth="full">
      <Header
        title="Importar Items"
        description="Preencha a planilha ou cole dados do Excel (Ctrl+V)"
        buttons={[
          {
            id: 'back',
            title: 'Voltar',
            icon: ArrowLeft,
            variant: 'outline',
            onClick: () => router.push(basePath),
          },
          {
            id: 'config',
            title: 'Configurar',
            icon: Settings,
            variant: 'outline',
            onClick: () => router.push(`${basePath}/config`),
          },
        ]}
      />

      {/* Variant/Mode info banner */}
      <Card
        className={`mb-4 ${isAllVariants ? 'border-blue-500/30 bg-blue-500/5' : 'border-green-500/30 bg-green-500/5'}`}
      >
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            {isAllVariants ? (
              <>
                <ListTree className="w-5 h-5 text-blue-500" />
                <div>
                  <span className="font-medium">Modo: </span>
                  <span className="text-muted-foreground">
                    Varias Variantes
                  </span>
                </div>
                <Badge variant="secondary" className="gap-1">
                  Especificar variante por linha
                </Badge>
              </>
            ) : (
              <>
                <Box className="w-5 h-5 text-green-500" />
                <div>
                  <span className="font-medium">Variante: </span>
                  <span className="text-muted-foreground">
                    {config.productName && `${config.productName} - `}
                    {config.variantName}
                  </span>
                </div>
                {config.templateName && (
                  <Badge variant="secondary" className="gap-1">
                    <Layers className="w-3 h-3" />
                    {config.templateName}
                  </Badge>
                )}
              </>
            )}
            {customAttributeCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                {customAttributeCount} atributos personalizados
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="decimal-separator"
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        Decimal:{' '}
                        {decimalSeparator === 'comma'
                          ? 'Virgula (1.234,56)'
                          : 'Ponto (1,234.56)'}
                      </Label>
                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>
                      Escolha o formato de numeros decimais usado na sua
                      planilha.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <strong>Virgula:</strong> Formato brasileiro (1.234,56)
                      <br />
                      <strong>Ponto:</strong> Formato americano (1,234.56)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Switch
                id="decimal-separator"
                checked={decimalSeparator === 'dot'}
                onCheckedChange={checked =>
                  setDecimalSeparator(checked ? 'dot' : 'comma')
                }
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`${basePath}/config`)}
            >
              Alterar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action bar */}
      <Card className="mb-4">
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1">
              {spreadsheet.filledRowCount}{' '}
              {spreadsheet.filledRowCount === 1 ? 'linha' : 'linhas'}{' '}
              preenchidas
            </Badge>
            {validationResult &&
              (validationResult.valid ? (
                <Badge variant="default" className="gap-1 bg-green-600">
                  <CheckCircle2 className="w-3 h-3" />
                  Dados validos
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {validationResult.errors.length} erros
                </Badge>
              ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleValidate}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Validar
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                spreadsheet.filledRowCount === 0 || importProcess.isProcessing
              }
            >
              <Play className="w-4 h-4 mr-2" />
              Importar{' '}
              {spreadsheet.filledRowCount > 0 &&
                `(${spreadsheet.filledRowCount})`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Spreadsheet */}
      <ImportSpreadsheet
        data={spreadsheet.data}
        headers={enabledFields}
        onDataChange={spreadsheet.setData}
        onAddRow={spreadsheet.addRow}
        onClearAll={spreadsheet.clearAll}
        validationResult={validationResult}
        referenceData={referenceDataMap}
        entityName="Items"
        showFileUpload={true}
        showDownloadTemplate={true}
      />

      {/* Progress Dialog */}
      <ImportProgressDialog
        open={showProgressDialog}
        onOpenChange={setShowProgressDialog}
        progress={importProcess.progress}
        onPause={importProcess.pauseImport}
        onResume={importProcess.resumeImport}
        onCancel={importProcess.cancelImport}
        onClose={handleProgressClose}
        entityLabel={entityDef.labelPlural}
      />
    </PageLayout>
  );
}
