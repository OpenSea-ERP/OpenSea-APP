'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Kbd } from '@/components/ui/kbd';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LayoutTemplate,
  Play,
  Plus,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { ImportProgressDialog } from '../../_shared/components/import-progress-dialog';
import { ImportSpreadsheet } from '../../_shared/components/import-spreadsheet';
import {
  ENTITY_DEFINITIONS,
  getEntityFields,
} from '../../_shared/config/entity-definitions';
import {
  downloadExcelTemplate,
  parseImportFile,
} from '../../_shared/utils/excel-utils';
import { useImportProcess } from '../../_shared/hooks/use-import-process';
import { useImportSpreadsheet } from '../../_shared/hooks/use-import-spreadsheet';
import type { ImportFieldConfig, ValidationResult } from '../../_shared/types';

const ENTITY_TYPE = 'templates';

export default function ImportTemplatesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const headersInitialized = useRef(false);

  const entityDef = ENTITY_DEFINITIONS[ENTITY_TYPE];

  // Build fields
  const enabledFields = useMemo<ImportFieldConfig[]>(() => {
    const baseFields = getEntityFields(ENTITY_TYPE);
    return baseFields.map((field, index) => ({
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
  }, []);

  // Spreadsheet hook
  const spreadsheet = useImportSpreadsheet(enabledFields);

  // Import process
  const handleImportComplete = useCallback(
    (result: { importedRows: number }) => {
      toast.success(
        `Importação concluída! ${result.importedRows} templates importados.`
      );
    },
    []
  );

  const handleImportError = useCallback((error: Error) => {
    toast.error(`Erro na importação: ${error.message}`);
  }, []);

  const importProcess = useImportProcess({
    entityType: ENTITY_TYPE,
    batchSize: 10,
    delayBetweenBatches: 1000,
    onComplete: handleImportComplete,
    onError: handleImportError,
  });

  // Initialize headers once
  useEffect(() => {
    if (enabledFields.length > 0 && !headersInitialized.current) {
      headersInitialized.current = true;
      spreadsheet.updateHeaders(enabledFields);
    }
  }, [enabledFields, spreadsheet]);

  // Handlers
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
      router.push('/stock/templates');
    }
  }, [importProcess, spreadsheet, router]);

  const handleDownloadTemplate = useCallback(() => {
    downloadExcelTemplate(enabledFields, entityDef.labelPlural);
  }, [enabledFields, entityDef]);

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
          const newRow = enabledFields.map((h) => ({
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

  // Action bar buttons
  const actionBarButtons = [
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
          { label: entityDef.labelPlural },
        ]}
        buttons={actionBarButtons}
      />

      {/* Hero Banner Card */}
      <Card className="relative overflow-hidden px-5 py-4 bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 shrink-0">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-violet-500/15 dark:bg-violet-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-linear-to-br from-violet-500 to-purple-600">
                <LayoutTemplate className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    Importar {entityDef.labelPlural}
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
          entityName={entityDef.labelPlural}
          showFileUpload={false}
          showDownloadTemplate={false}
        />
      </Card>

      {/* Import Progress Dialog */}
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
