'use client';

import { Header } from '@/components/layout/header';
import { PageLayout } from '@/components/layout/page-layout';
import { logger } from '@/lib/logger';
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
  CheckCircle2,
  HelpCircle,
  Package,
  Play,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ImportProgressDialog } from '../../../_shared/components/import-progress-dialog';
import { ImportSpreadsheet } from '../../../_shared/components/import-spreadsheet';
import {
  ENTITY_DEFINITIONS,
  getBasePath,
} from '../../../_shared/config/entity-definitions';
import { useImportProcess } from '../../../_shared/hooks/use-import-process';
import {
  useImportSpreadsheet,
  type DecimalSeparator,
} from '../../../_shared/hooks/use-import-spreadsheet';
import {
  useCategories,
  useManufacturers,
  useSuppliers,
} from '../../../_shared/hooks/use-reference-data';
import type {
  FieldOption,
  ImportConfig,
  ValidationResult,
} from '../../../_shared/types';

const STORAGE_KEY = 'opensea-import-configs';
const ACTIVE_CONFIG_KEY = 'opensea-import-active-config';

function getActiveConfig(): ImportConfig | null {
  if (typeof window === 'undefined') return null;

  try {
    const sessionConfig = sessionStorage.getItem('import-products-config');
    if (sessionConfig) {
      const parsed = JSON.parse(sessionConfig);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(parsed.updatedAt),
      };
    }

    const activeStored = localStorage.getItem(ACTIVE_CONFIG_KEY);
    if (!activeStored) return null;

    const activeConfigs: Record<string, string> = JSON.parse(activeStored);
    const activeId = activeConfigs['products'];
    if (!activeId) return null;

    const storedConfigs = localStorage.getItem(STORAGE_KEY);
    if (!storedConfigs) return null;

    const configs = JSON.parse(storedConfigs);
    const found = configs.find((c: { id: string }) => c.id === activeId);

    if (found && found.templateId) {
      return {
        entityType: found.entityType,
        templateId: found.templateId,
        templateName: found.templateName,
        fields: found.fields,
        name: found.name,
        createdAt: new Date(found.createdAt),
        updatedAt: new Date(found.updatedAt),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export default function ProductsSheetsPage() {
  const router = useRouter();
  const basePath = getBasePath('products');
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [config, setConfig] = useState<ImportConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decimalSeparator, setDecimalSeparator] =
    useState<DecimalSeparator>('comma');

  const entityDef = ENTITY_DEFINITIONS.products;

  const { data: suppliers } = useSuppliers();
  const { data: manufacturers } = useManufacturers();
  const { data: categories } = useCategories();

  // Carregar config apenas uma vez na montagem
  useEffect(() => {
    const loadedConfig = getActiveConfig();
    setConfig(loadedConfig);
    setIsLoading(false);
  }, []);

  const enabledFields = useMemo(() => {
    if (!config) return [];
    return config.fields
      .filter(f => f.enabled)
      .sort((a, b) => a.order - b.order);
  }, [config]);

  const customAttributeCount = useMemo(() => {
    return enabledFields.filter(f => f.key.startsWith('attributes.')).length;
  }, [enabledFields]);

  const referenceDataMap = useMemo(() => {
    const map: Record<string, FieldOption[]> = {};

    enabledFields.forEach(field => {
      if (field.type === 'reference' && field.referenceEntity) {
        switch (field.referenceEntity) {
          case 'suppliers':
            map[field.key] = suppliers || [];
            break;
          case 'manufacturers':
            map[field.key] = manufacturers || [];
            break;
          case 'categories':
            map[field.key] = categories || [];
            break;
        }
      } else if (field.type === 'select' && field.options) {
        map[field.key] = field.options;
      }
    });

    return map;
  }, [enabledFields, suppliers, manufacturers, categories]);

  const spreadsheet = useImportSpreadsheet(enabledFields, { decimalSeparator, referenceData: referenceDataMap });

  const importProcess = useImportProcess({
    entityType: 'products',
    batchSize: 10,
    delayBetweenBatches: 1000,
    transformRow: config?.templateId
      ? row => {
          const data: Record<string, unknown> = {
            ...row.data,
            templateId: config.templateId,
          };

          // Convert categoryId (single) → categoryIds (array)
          if (data.categoryId) {
            data.categoryIds = [data.categoryId as string];
            delete data.categoryId;
          }

          // Convert careInstructionIds comma-separated string → array
          if (
            typeof data.careInstructionIds === 'string' &&
            data.careInstructionIds.trim()
          ) {
            data.careInstructionIds = (data.careInstructionIds as string)
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean);
          }

          return { ...row, data };
        }
      : undefined,
    onComplete: result => {
      toast.success(
        `Importação concluída! ${result.importedRows} produtos importados.`
      );
    },
    onError: error => {
      toast.error(`Erro na importação: ${error.message}`);
    },
  });

  useEffect(() => {
    const stored = sessionStorage.getItem('import-products-data');
    if (stored) {
      try {
        const { data } = JSON.parse(stored);
        spreadsheet.applyPastedData(data);
        sessionStorage.removeItem('import-products-data');
      } catch (e) {
        logger.error(
          'Failed to load CSV data',
          e instanceof Error ? e : undefined
        );
      }
    }
  }, []);

  useEffect(() => {
    if (enabledFields.length > 0) {
      spreadsheet.updateHeaders(enabledFields);
    }
  }, [enabledFields]);

  // Limpar validacao quando o separador decimal muda
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
      sessionStorage.removeItem('import-products-config');
      router.push(basePath);
    }
  };

  if (isLoading) {
    return (
      <PageLayout backgroundVariant="none" maxWidth="full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!config || !config.templateId || enabledFields.length === 0) {
    return (
      <PageLayout backgroundVariant="none" maxWidth="full">
        <Header
          title="Importar Produtos"
          description="Preencha a planilha com os dados dos produtos"
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
              Configuração Necessária
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Selecione um template e configure os campos de importação
            </p>
            <Button onClick={() => router.push(`${basePath}/config`)}>
              <Settings className="w-4 h-4 mr-2" />
              Configurar Importação
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout backgroundVariant="none" maxWidth="full">
      <Header
        title="Importar Produtos"
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

      <Card className="mb-4 border-blue-500/30 bg-blue-500/5">
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-500" />
            <div>
              <span className="font-medium">Template: </span>
              <span className="text-muted-foreground">
                {config.templateName}
              </span>
            </div>
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
                  Dados válidos
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

      <ImportSpreadsheet
        data={spreadsheet.data}
        headers={enabledFields}
        onDataChange={spreadsheet.setData}
        onAddRow={spreadsheet.addRow}
        onClearAll={spreadsheet.clearAll}
        validationResult={validationResult}
        referenceData={referenceDataMap}
        entityName="Produtos"
        showFileUpload={true}
        showDownloadTemplate={true}
      />

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
