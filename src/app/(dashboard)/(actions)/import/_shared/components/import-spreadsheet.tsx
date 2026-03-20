'use client';

import { useCallback, useMemo, useState, useRef } from 'react';
import { logger } from '@/lib/logger';
import Spreadsheet, {
  type CellBase,
  type Matrix,
  type Selection,
  type DataViewerProps,
  RangeSelection,
} from 'react-spreadsheet';
import { useTheme } from 'next-themes';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Plus,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Check,
  Download,
  Upload,
  FileSpreadsheet,
} from 'lucide-react';
import type {
  ImportFieldConfig,
  ImportSpreadsheetData,
  ValidationResult,
  FieldOption,
} from '../types';
import { cn } from '@/lib/utils';
import { parseImportFile, downloadExcelTemplate } from '../utils/excel-utils';
import { toast } from 'sonner';

// Reference data by field key
type ReferenceDataMap = Record<string, FieldOption[]>;

interface ImportSpreadsheetProps {
  data: ImportSpreadsheetData;
  headers: ImportFieldConfig[];
  onDataChange: (data: ImportSpreadsheetData) => void;
  onAddRow: () => void;
  onClearAll: () => void;
  onDownload?: () => void;
  validationResult?: ValidationResult | null;
  referenceData?: ReferenceDataMap;
  className?: string;
  /** Entity name for template download (e.g., "Produtos", "Empresas") */
  entityName?: string;
  /** Show file upload button */
  showFileUpload?: boolean;
  /** Show download template button */
  showDownloadTemplate?: boolean;
}

// Cell type for react-spreadsheet
interface SpreadsheetCell extends CellBase<string> {
  value: string;
  className?: string;
  errorMessage?: string;
}

// Custom cell viewer with error icon + native title tooltip
// Uses native HTML title instead of Radix Tooltip to avoid compose-refs
// setState explosion when hundreds of cells are remounted simultaneously
function CellDataViewer({ cell }: DataViewerProps<SpreadsheetCell>) {
  const value = cell?.value ?? '';
  const errorMessage = cell?.errorMessage;

  if (errorMessage) {
    return (
      <span
        className="flex items-center justify-between gap-1 w-full"
        title={errorMessage}
      >
        <span className="truncate">{value}</span>
        <AlertTriangle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
      </span>
    );
  }

  return <span>{value}</span>;
}

export function ImportSpreadsheet({
  data,
  headers,
  onDataChange,
  onAddRow,
  onClearAll,
  onDownload,
  validationResult,
  referenceData = {},
  className,
  entityName = 'Dados',
  showFileUpload = true,
  showDownloadTemplate = true,
}: ImportSpreadsheetProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const spreadsheetContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Select dialog state
  const [selectDialog, setSelectDialog] = useState<{
    open: boolean;
    row: number;
    col: number;
    fieldKey: string;
    options: FieldOption[];
    currentValue: string;
  } | null>(null);

  // Track current selection
  const [currentSelection, setCurrentSelection] = useState<Selection | null>(
    null
  );

  // Get data rows only (skip header row if it exists)
  const dataRows = useMemo(() => {
    if (data.length === 0) return [];
    const firstRow = data[0];
    const isFirstRowHeader = firstRow?.some(cell => cell.isHeader);
    return isFirstRowHeader ? data.slice(1) : data;
  }, [data]);

  // Convert to react-spreadsheet format
  const spreadsheetData = useMemo((): Matrix<SpreadsheetCell> => {
    return dataRows.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const field = headers[colIndex];
        const value = cell.value || '';

        // For select/reference fields, show the label
        let displayValue = value;
        if (
          (field?.type === 'reference' || field?.type === 'select') &&
          field?.key
        ) {
          const options = referenceData[field.key] || field.options || [];
          const option = options.find(opt => opt.value === value);
          if (option) {
            displayValue = option.label;
          }
        }

        // Check for errors
        const cellError = validationResult?.errors.find(
          e => e.row === rowIndex + 1 && e.fieldKey === field?.key
        );

        return {
          value: displayValue,
          className: cellError ? 'cell-error' : undefined,
          errorMessage: cellError?.message,
        };
      })
    );
  }, [dataRows, headers, referenceData, validationResult]);

  // Column labels
  const columnLabels = useMemo(() => {
    return headers.map(h => {
      const label = h.customLabel || h.label;
      return h.required ? `${label} *` : label;
    });
  }, [headers]);

  // Handle spreadsheet change
  const handleChange = useCallback(
    (newData: Matrix<SpreadsheetCell>) => {
      const hasHeaderRow = data[0]?.some(cell => cell.isHeader);
      const headerRow = hasHeaderRow ? data[0] : null;

      // Convert back to our format, preserving IDs for select fields
      const converted: ImportSpreadsheetData = newData.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const field = headers[colIndex];
          let value = cell?.value?.toString() ?? '';

          // For select/reference fields, convert label back to ID if needed
          if (
            (field?.type === 'reference' || field?.type === 'select') &&
            field?.key
          ) {
            const options = referenceData[field.key] || field.options || [];
            // Check if value is a label and convert to ID
            const optionByLabel = options.find(opt => opt.label === value);
            if (optionByLabel) {
              value = optionByLabel.value;
            } else {
              // Check if value is already an ID
              const optionById = options.find(opt => opt.value === value);
              if (optionById) {
                value = optionById.value;
              }
              // Otherwise keep the typed value (might be invalid)
            }
          }

          // Get original value to preserve if unchanged
          const originalRow = dataRows[rowIndex];
          const originalCell = originalRow?.[colIndex];
          const originalValue = originalCell?.value || '';

          // If the display hasn't changed for select fields, keep original ID
          if (
            (field?.type === 'reference' || field?.type === 'select') &&
            field?.key
          ) {
            const options = referenceData[field.key] || field.options || [];
            const originalOption = options.find(
              opt => opt.value === originalValue
            );
            if (originalOption && originalOption.label === value) {
              value = originalValue;
            }
          }

          return {
            value,
            fieldKey: field?.key,
          };
        })
      );

      if (headerRow) {
        onDataChange([headerRow, ...converted]);
      } else {
        onDataChange(converted);
      }
    },
    [headers, onDataChange, data, dataRows, referenceData]
  );

  // Handle selection change
  const handleSelect = useCallback((selection: Selection) => {
    setCurrentSelection(selection);
  }, []);

  // Get selected cell from selection
  const getSelectedCell = useCallback((): {
    row: number;
    col: number;
  } | null => {
    if (!currentSelection) return null;
    if (currentSelection instanceof RangeSelection) {
      return {
        row: currentSelection.range.start.row,
        col: currentSelection.range.start.column,
      };
    }
    return null;
  }, [currentSelection]);

  // Handle key down for opening select dialog
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Open select dialog on Enter or F2 for select fields
      if (e.key === 'Enter' || e.key === 'F2') {
        const selected = getSelectedCell();
        if (!selected) return;

        const { row, col } = selected;
        const field = headers[col];

        if (
          (field?.type === 'reference' || field?.type === 'select') &&
          field?.key
        ) {
          const options = referenceData[field.key] || field.options || [];
          if (options.length > 0) {
            e.preventDefault();
            e.stopPropagation();

            const currentValue = dataRows[row]?.[col]?.value || '';
            setSelectDialog({
              open: true,
              row,
              col,
              fieldKey: field.key,
              options,
              currentValue,
            });
          }
        }
      }
    },
    [getSelectedCell, headers, referenceData, dataRows]
  );

  // Handle select value from dialog
  const handleSelectValue = useCallback(
    (value: string) => {
      if (!selectDialog) return;

      const { row, col } = selectDialog;
      const hasHeaderRow = data[0]?.some(cell => cell.isHeader);
      const dataRowIndex = hasHeaderRow ? row + 1 : row;

      const newData = [...data];
      if (newData[dataRowIndex]) {
        newData[dataRowIndex] = [...newData[dataRowIndex]];
        newData[dataRowIndex][col] = {
          ...newData[dataRowIndex][col],
          value,
        };
        onDataChange(newData);
      }

      setSelectDialog(null);

      // Restore focus to spreadsheet container after dialog closes
      requestAnimationFrame(() => {
        const container = spreadsheetContainerRef.current;
        if (container) {
          // Find the cell and focus it
          const cells = container.querySelectorAll('.Spreadsheet__cell');
          const cellIndex = row * headers.length + col;
          const targetCell = cells[cellIndex] as HTMLElement;
          if (targetCell) {
            targetCell.click();
            targetCell.focus();
          } else {
            // Fallback: focus the container
            container.focus();
          }
        }
      });
    },
    [selectDialog, data, onDataChange, headers.length]
  );

  // Calculate stats
  const filledRows = useMemo(() => {
    return dataRows.filter(row =>
      row.some(cell => cell.value && cell.value.trim() !== '')
    ).length;
  }, [dataRows]);

  // Handle file upload (Excel or CSV)
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const parsed = await parseImportFile(file);

        if (parsed.rows.length === 0) {
          toast.error('O arquivo está vazio ou não contém dados válidos.');
          return;
        }

        // Map headers from file to field keys
        const headerMapping: Record<number, number> = {};
        parsed.headers.forEach((fileHeader, fileIndex) => {
          const normalizedFileHeader = fileHeader.toLowerCase().trim();
          const matchIndex = headers.findIndex(h => {
            const fieldLabel = (h.customLabel || h.label).toLowerCase().trim();
            const fieldKey = h.key.toLowerCase().trim();
            return (
              fieldLabel === normalizedFileHeader ||
              fieldKey === normalizedFileHeader ||
              fieldLabel.includes(normalizedFileHeader) ||
              normalizedFileHeader.includes(fieldLabel)
            );
          });
          if (matchIndex !== -1) {
            headerMapping[fileIndex] = matchIndex;
          }
        });

        // Convert parsed rows to spreadsheet format
        const newRows: ImportSpreadsheetData = parsed.rows.map(row => {
          const newRow = headers.map(h => ({ value: '', fieldKey: h.key }));
          row.forEach((cellValue, fileIndex) => {
            const mappedIndex = headerMapping[fileIndex];
            if (mappedIndex !== undefined && cellValue) {
              newRow[mappedIndex] = {
                value: cellValue.trim(),
                fieldKey: headers[mappedIndex].key,
              };
            }
          });
          return newRow;
        });

        // Keep header row if exists
        const hasHeaderRow = data[0]?.some(cell => cell.isHeader);
        if (hasHeaderRow) {
          onDataChange([data[0], ...newRows]);
        } else {
          onDataChange(newRows);
        }

        toast.success(`${parsed.totalRows} linhas importadas do arquivo.`);
      } catch (error) {
        logger.error(
          'Error parsing file',
          error instanceof Error ? error : undefined
        );
        toast.error('Erro ao processar o arquivo. Verifique o formato.');
      }

      // Reset input
      event.target.value = '';
    },
    [headers, data, onDataChange]
  );

  // Handle template download
  const handleDownloadTemplate = useCallback(() => {
    downloadExcelTemplate(headers, entityName, { includeExamples: true });
    toast.success('Template baixado com sucesso!');
  }, [headers, entityName]);

  return (
    <div className={cn('overflow-hidden flex flex-col', className)}>
      <div className="flex-1 min-h-0">
        <div
          ref={spreadsheetContainerRef}
          className="overflow-auto max-h-[600px] border-t import-spreadsheet-container"
          onKeyDownCapture={handleKeyDown}
          tabIndex={-1}
        >
          <Spreadsheet
            data={spreadsheetData}
            onChange={handleChange}
            onSelect={handleSelect}
            columnLabels={columnLabels}
            darkMode={isDark}
            className="import-spreadsheet"
            DataViewer={CellDataViewer}
          />
        </div>

        {/* Error legend */}
        {validationResult && validationResult.errors.length > 0 && (
          <div className="p-4 border-t bg-rose-50 dark:bg-rose-900/10">
            <h4 className="text-sm font-medium text-rose-800 dark:text-rose-200 mb-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Erros de Validacao
            </h4>
            <ul className="text-sm text-rose-700 dark:text-rose-300 space-y-1 max-h-32 overflow-y-auto">
              {validationResult.errors.slice(0, 10).map((error, index) => (
                <li key={index}>
                  Linha {error.row},{' '}
                  {headers.find(h => h.key === error.fieldKey)?.label ||
                    error.fieldKey}
                  : {error.message}
                </li>
              ))}
              {validationResult.errors.length > 10 && (
                <li className="font-medium">
                  ...e mais {validationResult.errors.length - 10} erros
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Select Dialog */}
      <Dialog
        open={selectDialog?.open ?? false}
        onOpenChange={open => {
          if (!open) setSelectDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px] p-0">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="text-base">
              {headers[selectDialog?.col ?? 0]?.label || 'Selecionar'}
            </DialogTitle>
          </DialogHeader>
          <Command className="border-t">
            <CommandInput placeholder="Buscar..." autoFocus />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>Nenhuma opcao encontrada.</CommandEmpty>
              <CommandGroup>
                {selectDialog?.options.map((option, index) => (
                  <CommandItem
                    key={`${option.value}-${index}`}
                    value={option.searchText || option.label}
                    onSelect={() => handleSelectValue(option.value)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4 shrink-0',
                        selectDialog.currentValue === option.value
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {option.secondaryLabel || option.badges ? (
                      <div className="flex-1 min-w-0">
                        {option.badges && option.badges.length > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                            {option.badges.map((badge, i) => (
                              <span
                                key={i}
                                className="bg-muted px-1.5 py-0.5 rounded truncate max-w-[120px]"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="font-medium truncate">
                          {option.secondaryLabel || option.label}
                        </div>
                      </div>
                    ) : (
                      option.label
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
}
