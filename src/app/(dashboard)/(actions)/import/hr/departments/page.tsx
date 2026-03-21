'use client';

import { Header } from '@/components/layout/header';
import type { HeaderButton } from '@/components/layout/header';
import { PageLayout } from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Network,
  Play,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ImportProgressDialog } from '../../_shared/components/import-progress-dialog';
import { ImportSpreadsheet } from '../../_shared/components/import-spreadsheet';
import {
  ENTITY_DEFINITIONS,
  getEntityFields,
} from '../../_shared/config/entity-definitions';
import { useImportProcess } from '../../_shared/hooks/use-import-process';
import { useImportSpreadsheet } from '../../_shared/hooks/use-import-spreadsheet';
import type { ImportFieldConfig, ValidationResult } from '../../_shared/types';

export default function ImportDepartmentsPage() {
  const router = useRouter();
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const headersInitialized = useRef(false);

  const entityDef = ENTITY_DEFINITIONS.departments;

  // Build fields - stable reference
  const enabledFields = useMemo(() => {
    const baseFields = getEntityFields('departments');

    const fields: ImportFieldConfig[] = baseFields.map((field, index) => ({
      key: field.key,
      label: field.label,
      type: field.type,
      required: field.required,
      enabled: true,
      order: index,
      options: field.options,
      minLength: field.validation?.minLength,
      maxLength: field.validation?.maxLength,
      min: field.validation?.min,
      max: field.validation?.max,
      pattern: field.validation?.pattern,
      patternMessage: field.validation?.patternMessage,
      defaultValue: field.defaultValue,
      description: field.description,
    }));

    return fields;
  }, []);

  // Spreadsheet hook
  const spreadsheet = useImportSpreadsheet(enabledFields);

  // Stable callbacks
  const handleImportComplete = useCallback(
    (result: { importedRows: number }) => {
      toast.success(
        `Importação concluída! ${result.importedRows} departamentos importados.`
      );
    },
    []
  );

  const handleImportError = useCallback((error: Error) => {
    toast.error(`Erro na importação: ${error.message}`);
  }, []);

  // Import process hook
  const importProcess = useImportProcess({
    entityType: 'departments',
    batchSize: 10,
    delayBetweenBatches: 1000,
    onComplete: handleImportComplete,
    onError: handleImportError,
  });

  // Update headers only once on mount
  useEffect(() => {
    if (enabledFields.length > 0 && !headersInitialized.current) {
      headersInitialized.current = true;
      spreadsheet.updateHeaders(enabledFields);
    }
  }, [enabledFields, spreadsheet]);

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
      router.push('/hr/departments');
    }
  }, [importProcess, spreadsheet, router]);

  const handleBack = useCallback(() => {
    router.push('/hr/departments');
  }, [router]);

  const headerButtons = useMemo<HeaderButton[]>(
    () => [
      {
        id: 'back',
        title: 'Voltar',
        icon: ArrowLeft,
        variant: 'outline',
        onClick: handleBack,
      },
    ],
    [handleBack]
  );

  return (
    <PageLayout backgroundVariant="none" maxWidth="full">
      <Header
        title={`Importar ${entityDef.labelPlural}`}
        description={entityDef.description}
        buttons={headerButtons}
      />

      {/* Info banner */}
      <Card className="mb-4 border-cyan-500/30 bg-cyan-500/5">
        <CardContent className="flex items-center gap-4 py-4">
          <Network className="w-8 h-8 text-cyan-500" />
          <div className="flex-1">
            <h3 className="font-semibold">Importação de Departamentos</h3>
            <p className="text-sm text-muted-foreground">
              Preencha a planilha com os dados dos departamentos ou cole dados
              de outra planilha. Você também pode baixar o template Excel para
              preenchimento.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action bar */}
      <Card className="mb-4">
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1">
              <Layers className="w-3 h-3" />
              {spreadsheet.filledRowCount}{' '}
              {spreadsheet.filledRowCount === 1
                ? 'departamento'
                : 'departamentos'}{' '}
              para importar
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

      {/* Spreadsheet */}
      <ImportSpreadsheet
        data={spreadsheet.data}
        headers={enabledFields}
        onDataChange={spreadsheet.setData}
        onAddRow={spreadsheet.addRow}
        onClearAll={spreadsheet.clearAll}
        validationResult={validationResult}
        entityName="Departamentos"
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
