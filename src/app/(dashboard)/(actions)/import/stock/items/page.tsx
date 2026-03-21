'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Kbd } from '@/components/ui/kbd';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  HelpCircle,
  Layers,
  ListTree,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Sparkles,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { ImportProgressDialog } from '../../_shared/components/import-progress-dialog';
import { ImportSpreadsheet } from '../../_shared/components/import-spreadsheet';
import {
  ENTITY_DEFINITIONS,
  getBasePath,
} from '../../_shared/config/entity-definitions';
import {
  downloadExcelTemplate,
  parseImportFile,
} from '../../_shared/utils/excel-utils';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      if (field.key === 'variantId' && field.type === 'reference' && variants) {
        map[field.key] = variants.map(v => {
          const badges = [
            v.templateName,
            v.productName,
            v.manufacturerName,
          ].filter(Boolean) as string[];

          const variantLine = v.reference
            ? `${v.name} - (${v.reference})`
            : v.name;

          const label =
            badges.length > 0
              ? `${badges.join(' ')} / ${variantLine}`
              : variantLine;

          return {
            value: v.id,
            label,
            secondaryLabel: variantLine,
            badges,
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
        `Importação concluída! ${result.importedRows} itens importados.`
      );
    },
    onError: error => {
      toast.error(`Erro na importação: ${error.message}`);
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

  const handleValidate = useCallback(() => {
    const result = spreadsheet.validate();
    setValidationResult(result);

    if (result.valid) {
      toast.success(`${result.totalRows} linhas validadas com sucesso!`);
    } else {
      toast.error(
        `${result.errors.length} erros encontrados. Corrija antes de importar.`
      );
    }
  }, [spreadsheet]);

  const handleImport = useCallback(async () => {
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
  }, [spreadsheet, importProcess]);

  const handleProgressClose = useCallback(() => {
    setShowProgressDialog(false);
    importProcess.reset();

    if (importProcess.isCompleted) {
      spreadsheet.clearAll();
      sessionStorage.removeItem('import-items-config');
      router.push(basePath);
    }
  }, [importProcess, spreadsheet, router, basePath]);

  const handleDownloadTemplate = useCallback(() => {
    if (enabledFields.length === 0) return;
    downloadExcelTemplate(enabledFields, 'Itens', { includeExamples: true });
  }, [enabledFields]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const parsed = await parseImportFile(file);
        if (!parsed || parsed.rows.length === 0) {
          toast.error('Nenhum dado encontrado no arquivo.');
          return;
        }

        const headerMapping: Record<number, number> = {};
        parsed.headers.forEach((header, fileIndex) => {
          const fieldIndex = enabledFields.findIndex(
            h =>
              h.key.toLowerCase() === header.toLowerCase() ||
              h.label.toLowerCase() === header.toLowerCase()
          );
          if (fieldIndex !== -1) headerMapping[fileIndex] = fieldIndex;
        });

        const newRows = parsed.rows.map(row => {
          const newRow = enabledFields.map(h => ({
            value: '',
            fieldKey: h.key,
          }));
          row.forEach((cellValue, fileIndex) => {
            const mappedIndex = headerMapping[fileIndex];
            if (mappedIndex !== undefined && cellValue) {
              newRow[mappedIndex] = {
                value: cellValue.trim(),
                fieldKey: enabledFields[mappedIndex].key,
              };
            }
          });
          return newRow;
        });

        const currentData = spreadsheet.data;
        const hasHeaderRow = currentData[0]?.some(cell => cell.isHeader);
        if (hasHeaderRow) {
          spreadsheet.setData([currentData[0], ...newRows]);
        } else {
          spreadsheet.setData(newRows);
        }

        toast.success(`${parsed.rows.length} linhas importadas do arquivo.`);
      } catch {
        toast.error('Erro ao processar o arquivo. Verifique o formato.');
      }

      event.target.value = '';
    },
    [enabledFields, spreadsheet]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // No config - need to configure first
  if (!config || enabledFields.length === 0) {
    return (
      <div className="flex flex-col gap-3 h-[calc(100vh-10rem)]">
        <PageActionBar
          breadcrumbItems={[
            { label: 'Importação', href: '/import' },
            { label: 'Itens' },
          ]}
          buttons={[]}
        />
        <Card className="flex flex-col items-center justify-center py-12 bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10">
          <Settings className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">
            Configuração Necessária
          </h3>
          <p className="text-muted-foreground text-center mb-4">
            Selecione uma variante e configure os campos de importação
          </p>
          <Button onClick={() => router.push(`${basePath}/config`)}>
            <Settings className="w-4 h-4 mr-2" />
            Configurar Importação
          </Button>
        </Card>
      </div>
    );
  }

  const isAllVariants = config.isAllVariants;

  // Action bar buttons
  const actionBarButtons = [
    {
      id: 'config',
      title: 'Configurar',
      icon: Settings,
      variant: 'outline' as const,
      onClick: () => router.push(`${basePath}/config`),
    },
    {
      id: 'validate',
      title: 'Validar',
      icon: CheckCircle2,
      variant: 'outline' as const,
      onClick: handleValidate,
      disabled: enabledFields.length === 0,
    },
    {
      id: 'import',
      title: `Importar${spreadsheet.filledRowCount > 0 ? ` (${spreadsheet.filledRowCount})` : ''}`,
      icon: Play,
      variant: 'default' as const,
      onClick: handleImport,
      disabled:
        spreadsheet.filledRowCount === 0 ||
        importProcess.isProcessing ||
        !validationResult?.valid,
    },
  ];

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-10rem)]">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[
          { label: 'Importação', href: '/import' },
          { label: 'Itens' },
        ]}
        buttons={actionBarButtons}
      />

      {/* Hero Banner Card */}
      <Card className="relative overflow-hidden px-5 py-4 bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 shrink-0">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-green-500/15 dark:bg-green-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-linear-to-br from-green-500 to-emerald-600">
                <Box className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    Importar Itens
                  </h1>
                  {validationResult &&
                    (validationResult.valid ? (
                      <Badge
                        variant="default"
                        className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Dados válidos
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {validationResult.errors.length} erros
                      </Badge>
                    ))}
                </div>
                <p className="text-sm text-slate-500 dark:text-white/60">
                  Preencha a planilha, faça o upload de um arquivo ou cole dados
                  de outra planilha
                </p>
              </div>
            </div>

            {/* Variant/Mode info */}
            <div className="flex items-center gap-2">
              {isAllVariants ? (
                <>
                  <ListTree className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">
                    Várias Variantes
                  </span>
                </>
              ) : (
                <>
                  <Box className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    {config.productName && `${config.productName} - `}
                    {config.variantName}
                  </span>
                </>
              )}
              {config.templateName && (
                <Badge variant="secondary" className="gap-1">
                  <Layers className="w-3 h-3" />
                  {config.templateName}
                </Badge>
              )}
              {customAttributeCount > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  {customAttributeCount} atributos
                </Badge>
              )}
            </div>
          </div>

          {/* Secondary bar */}
          <div className="bg-muted/30 dark:bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                {spreadsheet.filledRowCount}{' '}
                {spreadsheet.filledRowCount === 1 ? 'linha' : 'linhas'}{' '}
                preenchidas
              </Badge>
              <span className="text-xs text-muted-foreground">
                Pressione <Kbd>Enter</Kbd> em uma célula para ver os valores
                possíveis.
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Decimal separator toggle */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="decimal-separator"
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        {decimalSeparator === 'comma'
                          ? 'Vírgula (1.234,56)'
                          : 'Ponto (1,234.56)'}
                      </Label>
                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>
                      Escolha o formato de números decimais usado na sua
                      planilha.
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      <strong>Vírgula:</strong> Formato brasileiro (1.234,56)
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

              <div className="w-px h-5 bg-border mx-1" />

              {/* File import popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5 gap-1.5"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span className="hidden sm:inline">Arquivo</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 p-3">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">
                        Importar de Arquivo
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Baixe o template ou envie um arquivo preenchido.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-9 px-2.5"
                      onClick={handleDownloadTemplate}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Template Excel
                    </Button>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv,.txt"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start h-9 px-2.5"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Enviar Arquivo
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Add Row + Clear */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5"
                onClick={spreadsheet.addRow}
              >
                <Plus className="h-4 w-4 mr-1" />
                Linha
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5"
                onClick={spreadsheet.clearAll}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Spreadsheet */}
      <Card className="bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 flex-1 min-h-0 flex flex-col overflow-hidden">
        <ImportSpreadsheet
          data={spreadsheet.data}
          headers={enabledFields}
          onDataChange={spreadsheet.setData}
          onAddRow={spreadsheet.addRow}
          onClearAll={spreadsheet.clearAll}
          validationResult={validationResult}
          referenceData={referenceDataMap}
          entityName="Itens"
          showFileUpload={false}
          showDownloadTemplate={false}
        />
      </Card>

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
    </div>
  );
}
