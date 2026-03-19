'use client';

import { Header } from '@/components/layout/header';
import { PageLayout } from '@/components/layout/page-layout';
import { logger } from '@/lib/logger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Play,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ENTITY_DEFINITIONS, getBasePath } from '../config/entity-definitions';
import { useImportConfig } from '../hooks/use-import-config';
import { useImportProcess } from '../hooks/use-import-process';
import { useImportSpreadsheet } from '../hooks/use-import-spreadsheet';
import {
  useCategories,
  useLocations,
  useManufacturers,
  useProducts,
  useSuppliers,
  useTemplateDetails,
  useTemplates,
  useVariants,
} from '../hooks/use-reference-data';
import type {
  FieldOption,
  ImportEntityType,
  ImportFieldConfig,
  ValidationResult,
} from '../types';
import { ImportProgressDialog } from './import-progress-dialog';
import { ImportSpreadsheet } from './import-spreadsheet';

interface EntitySheetsPageProps {
  entityType: ImportEntityType;
  backgroundVariant?: 'default' | 'purple' | 'blue' | 'slate' | 'none';
}

export function EntitySheetsPage({
  entityType,
  backgroundVariant = 'purple',
}: EntitySheetsPageProps) {
  const router = useRouter();
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  const entityDef = ENTITY_DEFINITIONS[entityType];
  const basePath = getBasePath(entityType);

  // Load config
  const { config, getEnabledFields } = useImportConfig(entityType);

  // Get enabled fields sorted by order
  const baseEnabledFields = useMemo(() => {
    if (!config) return [];
    return getEnabledFields();
  }, [config, getEnabledFields]);

  // Check if there's a templateId field with a default value
  const templateDefaultValue = useMemo(() => {
    const templateField = baseEnabledFields.find(f => f.key === 'templateId');
    return templateField?.defaultValue?.toString() || undefined;
  }, [baseEnabledFields]);

  // Fetch template details if a default template is set
  const { data: templateDetails } = useTemplateDetails(templateDefaultValue);

  // Generate dynamic fields from template attributes
  const dynamicAttributeFields = useMemo((): ImportFieldConfig[] => {
    if (!templateDetails) return [];

    const fields: ImportFieldConfig[] = [];
    let order = baseEnabledFields.length + 100; // Start after base fields

    // Determine which attributes to use based on entity type
    let attributes:
      | Record<
          string,
          {
            type?: string;
            label?: string;
            options?: string[];
            required?: boolean;
          }
        >
      | undefined;

    if (entityType === 'products') {
      attributes = templateDetails.productAttributes;
    } else if (entityType === 'variants') {
      attributes = templateDetails.variantAttributes;
    } else if (entityType === 'items') {
      attributes = templateDetails.itemAttributes;
    }

    if (!attributes) return [];

    Object.entries(attributes).forEach(([key, attrConfig]) => {
      const fieldType = attrConfig.type === 'select' ? 'select' : 'text';

      fields.push({
        key: `attributes.${key}`,
        label: attrConfig.label || key,
        customLabel: attrConfig.label,
        type: fieldType,
        required: attrConfig.required || false,
        enabled: true,
        order: order++,
        options: attrConfig.options?.map(opt => ({ value: opt, label: opt })),
      });
    });

    return fields;
  }, [templateDetails, entityType, baseEnabledFields.length]);

  // Combine base fields with dynamic attribute fields
  const enabledFields = useMemo(() => {
    return [...baseEnabledFields, ...dynamicAttributeFields];
  }, [baseEnabledFields, dynamicAttributeFields]);

  // Fetch reference data for dropdowns
  const { data: templates } = useTemplates();
  const { data: suppliers } = useSuppliers();
  const { data: manufacturers } = useManufacturers();
  const { data: categories } = useCategories();
  const { data: products } = useProducts();
  const { data: variants } = useVariants();
  const { data: locations } = useLocations();

  // Build reference data map based on enabled fields
  const referenceDataMap = useMemo(() => {
    const map: Record<string, FieldOption[]> = {};

    enabledFields.forEach(field => {
      if (field.type === 'reference' && field.referenceEntity) {
        switch (field.referenceEntity) {
          case 'templates':
            map[field.key] = templates || [];
            break;
          case 'suppliers':
            map[field.key] = suppliers || [];
            break;
          case 'manufacturers':
            map[field.key] = manufacturers || [];
            break;
          case 'categories':
            map[field.key] = categories || [];
            break;
          case 'products':
            map[field.key] = products || [];
            break;
          case 'variants':
            map[field.key] = variants || [];
            break;
          case 'locations':
            map[field.key] = locations || [];
            break;
        }
      } else if (field.type === 'select' && field.options) {
        map[field.key] = field.options;
      }
    });

    return map;
  }, [
    enabledFields,
    templates,
    suppliers,
    manufacturers,
    categories,
    products,
    variants,
    locations,
  ]);

  // Spreadsheet hook
  const spreadsheet = useImportSpreadsheet(enabledFields, { referenceData: referenceDataMap });

  // Import process hook
  const importProcess = useImportProcess({
    entityType,
    batchSize: 10,
    delayBetweenBatches: 1000,
    onComplete: result => {
      toast.success(
        `Importacao concluida! ${result.importedRows} ${entityDef?.labelPlural.toLowerCase() || 'itens'} importados.`
      );
    },
    onError: error => {
      toast.error(`Erro na importacao: ${error.message}`);
    },
  });

  // Load CSV data if available
  useEffect(() => {
    const stored = sessionStorage.getItem(`import-${entityType}-data`);
    if (stored) {
      try {
        const { data } = JSON.parse(stored);
        spreadsheet.applyPastedData(data);
        sessionStorage.removeItem(`import-${entityType}-data`);
      } catch (e) {
        logger.error(
          'Failed to load CSV data',
          e instanceof Error ? e : undefined
        );
      }
    }
  }, [entityType]);

  // Update headers when config changes
  useEffect(() => {
    if (enabledFields.length > 0) {
      spreadsheet.updateHeaders(enabledFields);
    }
  }, [enabledFields]);

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
    // Validate first
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
      router.push(basePath);
    }
  };

  if (!entityDef) {
    return (
      <PageLayout backgroundVariant={backgroundVariant} maxWidth="full">
        <div className="text-center py-12">
          <p className="text-destructive">
            Entidade nao encontrada: {entityType}
          </p>
        </div>
      </PageLayout>
    );
  }

  if (!config || baseEnabledFields.length === 0) {
    return (
      <PageLayout backgroundVariant={backgroundVariant} maxWidth="full">
        <Header
          title={`Importar ${entityDef.labelPlural}`}
          description="Preencha a planilha com os dados"
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
              Configure os campos de importacao antes de continuar
            </p>
            <Button onClick={() => router.push(`${basePath}/config`)}>
              <Settings className="w-4 h-4 mr-2" />
              Configurar Campos
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout backgroundVariant={backgroundVariant} maxWidth="full">
      <Header
        title={`Importar ${entityDef.labelPlural}`}
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

      {/* Template Attributes Info */}
      {dynamicAttributeFields.length > 0 && templateDetails && (
        <Card className="mb-4 border-blue-500/30 bg-blue-500/5">
          <CardContent className="flex items-center gap-3 py-3">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <div>
              <span className="font-medium">Atributos do Template: </span>
              <span className="text-muted-foreground">
                {templateDetails.name}
              </span>
              <span className="text-muted-foreground"> - </span>
              <span className="text-blue-500">
                {dynamicAttributeFields.length} campos adicionais
              </span>
            </div>
          </CardContent>
        </Card>
      )}

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
        entityName={entityDef?.labelPlural}
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
