'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import type {
  ImportCellData,
  ImportSpreadsheetData,
  ImportFieldConfig,
  ImportRowData,
  ValidationError,
  ValidationResult,
} from '../types';
import {
  cleanCNPJ,
  cleanCPF,
  cleanPhone,
  cleanPostalCode,
} from '../utils/excel-utils';

const INITIAL_ROWS = 50;
const MIN_ROWS = 10;

// ============================================
// NUMBER PARSING WITH DECIMAL SEPARATOR
// ============================================

export type DecimalSeparator = 'comma' | 'dot';

/**
 * Parse a number string with configurable decimal separator
 * @param value - The string value to parse
 * @param decimalSeparator - 'comma' for Brazilian format (1.234,56) or 'dot' for US format (1,234.56)
 */
function parseNumber(
  value: string,
  decimalSeparator: DecimalSeparator = 'comma'
): number {
  if (!value || typeof value !== 'string') {
    return NaN;
  }

  let normalized = value.trim();

  if (decimalSeparator === 'comma') {
    // Brazilian format: 1.234,56 -> 1234.56
    // Remove thousand separators (dots) and replace decimal comma with dot
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    // US format: 1,234.56 -> 1234.56
    // Remove thousand separators (commas)
    normalized = normalized.replace(/,/g, '');
  }

  return parseFloat(normalized);
}

// ============================================
// VALUE CLEANING HELPERS
// ============================================

/**
 * Clean a value based on field key (CNPJ, CPF, phone, postal code)
 * This removes masks before validation and export
 */
function cleanValueByFieldKey(value: string, fieldKey: string): string {
  const key = fieldKey.toLowerCase();

  if (key.includes('cnpj')) {
    return cleanCNPJ(value);
  }
  if (key.includes('cpf')) {
    return cleanCPF(value);
  }
  if (
    key.includes('phone') ||
    key.includes('telefone') ||
    key.includes('celular') ||
    key.includes('whatsapp')
  ) {
    return cleanPhone(value);
  }
  if (
    key.includes('cep') ||
    key.includes('postal') ||
    key.includes('zipcode')
  ) {
    return cleanPostalCode(value);
  }

  return value;
}

/**
 * Check if a field should have its value cleaned (masks removed)
 */
function shouldCleanValue(fieldKey: string): boolean {
  const key = fieldKey.toLowerCase();
  return (
    key.includes('cnpj') ||
    key.includes('cpf') ||
    key.includes('phone') ||
    key.includes('telefone') ||
    key.includes('celular') ||
    key.includes('whatsapp') ||
    key.includes('cep') ||
    key.includes('postal') ||
    key.includes('zipcode')
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Create an empty row WITHOUT default values (for initial state)
function createBlankRow(headers: ImportFieldConfig[]): ImportCellData[] {
  return headers.map(header => ({
    value: '',
    fieldKey: header.key,
  }));
}

// Apply default values to a row that has user input
function applyDefaultValues(
  row: ImportCellData[],
  headers: ImportFieldConfig[]
): ImportCellData[] {
  return row.map((cell, index) => {
    const header = headers[index];
    // Only apply default if cell is empty and header has a default value
    if (!cell.value && header?.defaultValue !== undefined) {
      return {
        ...cell,
        value: header.defaultValue.toString(),
      };
    }
    return cell;
  });
}

function createHeaderRow(headers: ImportFieldConfig[]): ImportCellData[] {
  return headers.map(header => ({
    value: header.customLabel || header.label,
    fieldKey: header.key,
    isHeader: true,
    readOnly: true,
  }));
}

function createInitialData(
  headers: ImportFieldConfig[],
  rowCount: number = INITIAL_ROWS
): ImportSpreadsheetData {
  const headerRow = createHeaderRow(headers);
  // Create blank rows (no default values)
  const dataRows = Array.from({ length: rowCount }, () =>
    createBlankRow(headers)
  );
  return [headerRow, ...dataRows];
}

// Check if a row has any user-entered data
function rowHasData(row: ImportCellData[]): boolean {
  return row.some(cell => cell.value && cell.value.trim() !== '');
}

// ============================================
// VALIDATION
// ============================================

function validateCell(
  rawValue: string | undefined | null,
  field: ImportFieldConfig,
  rowIndex: number,
  colIndex: number,
  decimalSeparator: DecimalSeparator = 'comma',
  referenceOptions?: { value: string; label: string }[]
): ValidationError | null {
  // Normalize value - treat null/undefined as empty string
  const value = rawValue ?? '';

  // Required check
  if (field.required && value.trim() === '') {
    return {
      row: rowIndex,
      column: colIndex,
      fieldKey: field.key,
      message: `${field.customLabel || field.label} é obrigatório`,
      value,
    };
  }

  // Skip validation for empty optional fields
  if (value.trim() === '') return null;

  // Type-specific validation
  switch (field.type) {
    case 'number': {
      const num = parseNumber(value, decimalSeparator);
      if (isNaN(num)) {
        return {
          row: rowIndex,
          column: colIndex,
          fieldKey: field.key,
          message: `Valor deve ser um número (use ${decimalSeparator === 'comma' ? 'vírgula' : 'ponto'} como decimal)`,
          value,
        };
      }
      if (field.min !== undefined && num < field.min) {
        return {
          row: rowIndex,
          column: colIndex,
          fieldKey: field.key,
          message: `Valor mínimo é ${field.min}`,
          value,
        };
      }
      if (field.max !== undefined && num > field.max) {
        return {
          row: rowIndex,
          column: colIndex,
          fieldKey: field.key,
          message: `Valor máximo é ${field.max}`,
          value,
        };
      }
      break;
    }

    case 'email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return {
          row: rowIndex,
          column: colIndex,
          fieldKey: field.key,
          message: 'E-mail inválido',
          value,
        };
      }
      break;
    }

    case 'date': {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return {
          row: rowIndex,
          column: colIndex,
          fieldKey: field.key,
          message: 'Data inválida. Use formato YYYY-MM-DD',
          value,
        };
      }
      break;
    }

    case 'boolean': {
      const boolValues = [
        'true',
        'false',
        'sim',
        'não',
        'nao',
        'yes',
        'no',
        '1',
        '0',
        's',
        'n',
        'verdadeiro',
        'falso',
      ];
      if (!boolValues.includes(value.toLowerCase())) {
        return {
          row: rowIndex,
          column: colIndex,
          fieldKey: field.key,
          message: 'Valor deve ser Sim/Não, True/False ou 1/0',
          value,
        };
      }
      break;
    }

    case 'select': {
      const validValues = field.options?.map(o => o.value) ?? [];
      if (!validValues.includes(value)) {
        return {
          row: rowIndex,
          column: colIndex,
          fieldKey: field.key,
          message: `Valor inválido. Opções: ${validValues.join(', ')}`,
          value,
        };
      }
      break;
    }

    case 'reference': {
      if (referenceOptions) {
        if (referenceOptions.length === 0) {
          // No options loaded — value can't be validated, flag it
          return {
            row: rowIndex,
            column: colIndex,
            fieldKey: field.key,
            message: `${field.label || field.key}: nenhum registro cadastrado no sistema`,
            value,
          };
        }

        const validIds = new Set(referenceOptions.map(o => o.value));
        const validLabels = new Set(
          referenceOptions.map(o => o.label.toLowerCase())
        );

        // Accept both ID and label (name)
        if (!validIds.has(value) && !validLabels.has(value.toLowerCase())) {
          return {
            row: rowIndex,
            column: colIndex,
            fieldKey: field.key,
            message: `${field.label || field.key} "${value}" não encontrado(a) no sistema`,
            value,
          };
        }
      }
      break;
    }
  }

  // Length validation
  // For CNPJ/CPF/phone/postal fields, use cleaned value for length check
  const valueForLengthCheck = shouldCleanValue(field.key)
    ? cleanValueByFieldKey(value, field.key)
    : value;

  if (
    field.minLength !== undefined &&
    valueForLengthCheck.length < field.minLength
  ) {
    return {
      row: rowIndex,
      column: colIndex,
      fieldKey: field.key,
      message: `Mínimo de ${field.minLength} caracteres`,
      value,
    };
  }

  if (
    field.maxLength !== undefined &&
    valueForLengthCheck.length > field.maxLength
  ) {
    return {
      row: rowIndex,
      column: colIndex,
      fieldKey: field.key,
      message: `Máximo de ${field.maxLength} caracteres`,
      value,
    };
  }

  // Pattern validation
  // For CNPJ/CPF/phone/postal fields, clean the value before pattern validation
  if (field.pattern) {
    const regex = new RegExp(field.pattern);
    const valueToTest = shouldCleanValue(field.key)
      ? cleanValueByFieldKey(value, field.key)
      : value;
    if (!regex.test(valueToTest)) {
      return {
        row: rowIndex,
        column: colIndex,
        fieldKey: field.key,
        message: field.patternMessage || 'Formato inválido',
        value,
      };
    }
  }

  return null;
}

// ============================================
// HOOK OPTIONS
// ============================================

export interface UseImportSpreadsheetOptions {
  decimalSeparator?: DecimalSeparator;
  referenceData?: Record<string, { value: string; label: string }[]>;
}

// ============================================
// HOOK
// ============================================

export function useImportSpreadsheet(
  headers: ImportFieldConfig[],
  options: UseImportSpreadsheetOptions = {}
) {
  const { decimalSeparator = 'comma', referenceData } = options;

  const [data, setData] = useState<ImportSpreadsheetData>(() =>
    createInitialData(headers)
  );
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  // Ref to access current data without causing re-renders
  const dataRef = useRef<ImportSpreadsheetData>(data);
  const headersRef = useRef<ImportFieldConfig[]>(headers);
  const decimalSeparatorRef = useRef<DecimalSeparator>(decimalSeparator);
  const referenceDataRef = useRef(referenceData);

  // Keep refs synchronized
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    headersRef.current = headers;
  }, [headers]);

  useEffect(() => {
    decimalSeparatorRef.current = decimalSeparator;
  }, [decimalSeparator]);

  useEffect(() => {
    referenceDataRef.current = referenceData;
  }, [referenceData]);

  // Atualizar quando headers mudam
  const updateHeaders = useCallback((newHeaders: ImportFieldConfig[]) => {
    headersRef.current = newHeaders;
    setData(prevData => {
      // Manter dados existentes e adaptar as novas colunas
      const headerRow = createHeaderRow(newHeaders);
      const existingRows = prevData.slice(1);

      const newRows = existingRows.map(row => {
        return newHeaders.map(header => {
          const existingCell = row.find(cell => cell.fieldKey === header.key);
          // Keep existing value, don't apply defaults here
          return (
            existingCell || {
              value: '',
              fieldKey: header.key,
            }
          );
        });
      });

      // Garantir minimo de linhas
      while (newRows.length < MIN_ROWS) {
        newRows.push(createBlankRow(newHeaders));
      }

      return [headerRow, ...newRows];
    });
  }, []);

  // Adicionar linha - uses ref for stable reference
  const addRow = useCallback(() => {
    setData(prev => [...prev, createBlankRow(headersRef.current)]);
  }, []);

  // Adicionar multiplas linhas - uses ref for stable reference
  const addRows = useCallback((count: number) => {
    setData(prev => [
      ...prev,
      ...Array.from({ length: count }, () =>
        createBlankRow(headersRef.current)
      ),
    ]);
  }, []);

  // Remover linha - uses ref for stable reference
  const removeRow = useCallback((index: number) => {
    if (index === 0) return; // Nao remover header
    setData(prev => {
      const newData = prev.filter((_, i) => i !== index);
      // Garantir minimo de linhas
      while (newData.length <= MIN_ROWS) {
        newData.push(createBlankRow(headersRef.current));
      }
      return newData;
    });
  }, []);

  // Limpar todos os dados (manter headers) - uses ref for stable reference
  const clearAll = useCallback(() => {
    setData(createInitialData(headersRef.current));
    setValidationErrors([]);
  }, []);

  // Handler para mudanca de dados do spreadsheet - uses refs for stable reference
  const handleDataChange = useCallback((newData: ImportSpreadsheetData) => {
    setData(prevData => {
      // Preservar a linha de header
      const headerRow = prevData[0];
      const dataRows = newData.slice(1);
      const currentHeaders = headersRef.current;

      // Adicionar mais linhas se necessario (quando usuario cola muitos dados)
      const lastFilledRowIndex = dataRows.findLastIndex(row =>
        row.some(cell => cell.value && cell.value.trim() !== '')
      );

      // Se preencheu ate perto do final, adicionar mais linhas
      if (lastFilledRowIndex >= dataRows.length - 5) {
        const additionalRows = Array.from({ length: 20 }, () =>
          createBlankRow(currentHeaders)
        );
        return [headerRow, ...dataRows, ...additionalRows];
      } else {
        return [headerRow, ...dataRows];
      }
    });
  }, []);

  // Validar todos os dados - uses refs to avoid dependency on data/headers state
  const validate = useCallback((): ValidationResult => {
    const currentData = dataRef.current;
    const currentHeaders = headersRef.current;
    const currentDecimalSeparator = decimalSeparatorRef.current;
    const currentReferenceData = referenceDataRef.current;
    const errors: ValidationError[] = [];
    const dataRows = currentData.slice(1); // Excluir header

    let validRows = 0;
    let invalidRows = 0;
    let totalRows = 0;

    // Track values of 'name' fields for duplicate detection
    const nameFieldIndex = currentHeaders.findIndex(
      h => h.key === 'name' && h.required
    );
    // For entities like variants, duplicates are scoped by parent (e.g. productId)
    const parentFieldIndex = currentHeaders.findIndex(
      h => h.key === 'productId'
    );
    const seenNames = new Map<string, number>(); // duplicate key → first row

    dataRows.forEach((row, rowIndex) => {
      // Verificar se a linha tem algum dado
      const hasData = row.some(cell => cell.value && cell.value.trim() !== '');
      if (!hasData) return; // Pular linhas vazias

      totalRows++;
      let rowHasError = false;

      row.forEach((cell, colIndex) => {
        const field = currentHeaders[colIndex];
        if (!field) return;

        // Get reference options for this field if it's a reference type
        const refOptions =
          field.type === 'reference' && currentReferenceData
            ? currentReferenceData[field.key]
            : undefined;

        const error = validateCell(
          cell.value,
          field,
          rowIndex + 1,
          colIndex,
          currentDecimalSeparator,
          refOptions
        );
        if (error) {
          errors.push(error);
          rowHasError = true;
        }
      });

      // Check for duplicate names within the spreadsheet
      // For variants, scope by productId (same name in different products is OK)
      if (nameFieldIndex >= 0) {
        const nameValue = row[nameFieldIndex]?.value?.trim();
        if (nameValue) {
          const nameLower = nameValue.toLowerCase();
          const parentValue =
            parentFieldIndex >= 0
              ? (row[parentFieldIndex]?.value?.trim()?.toLowerCase() ?? '')
              : '';
          const duplicateKey = parentValue
            ? `${parentValue}::${nameLower}`
            : nameLower;
          const firstRow = seenNames.get(duplicateKey);
          if (firstRow !== undefined) {
            errors.push({
              row: rowIndex + 1,
              column: nameFieldIndex,
              fieldKey: 'name',
              message: `Nome duplicado na planilha (mesmo que linha ${firstRow})`,
              value: nameValue,
            });
            rowHasError = true;
          } else {
            seenNames.set(duplicateKey, rowIndex + 1);
          }
        }
      }

      if (rowHasError) {
        invalidRows++;
      } else {
        validRows++;
      }
    });

    setValidationErrors(errors);

    // Atualizar celulas com erros
    setData(prevData => {
      return prevData.map((row, rowIndex) => {
        if (rowIndex === 0) return row; // Header

        return row.map((cell, colIndex) => {
          const error = errors.find(
            e => e.row === rowIndex && e.column === colIndex
          );
          return {
            ...cell,
            error: error?.message,
            className: error ? 'bg-red-100 dark:bg-red-900/30' : undefined,
          };
        });
      });
    });

    return {
      valid: errors.length === 0,
      totalRows,
      validRows,
      invalidRows,
      errors,
      warnings: [],
    };
  }, []);

  // Converter dados para formato de importacao
  // Apply default values only at export time for rows that have data
  // Uses refs to avoid dependency on data/headers state
  const getRowData = useCallback((): ImportRowData[] => {
    const currentData = dataRef.current;
    const currentHeaders = headersRef.current;
    const currentDecimalSeparator = decimalSeparatorRef.current;
    const currentReferenceData = referenceDataRef.current;
    const dataRows = currentData.slice(1); // Excluir header
    const result: ImportRowData[] = [];

    dataRows.forEach((row, rowIndex) => {
      // Verificar se a linha tem algum dado preenchido pelo usuario
      if (!rowHasData(row)) return;

      // Apply default values to this row before exporting
      const rowWithDefaults = applyDefaultValues(row, currentHeaders);
      const rowData: Record<string, unknown> = {};

      // First, check if all required fields have values
      const missingRequired = currentHeaders.filter((field, colIndex) => {
        if (!field.required) return false;
        const cell = rowWithDefaults[colIndex];
        return !cell?.value || cell.value.trim() === '';
      });

      if (missingRequired.length > 0) {
        logger.warn(`Row ${rowIndex + 1} missing required fields`, {
          fields: missingRequired.map(f => f.key),
        });
        // Skip this row - validation should have caught this
        return;
      }

      rowWithDefaults.forEach((cell, colIndex) => {
        const field = currentHeaders[colIndex];
        if (!field || !cell.value || cell.value.trim() === '') return;

        let value: unknown = cell.value.trim();

        // Clean CNPJ/CPF/phone/postal values (remove masks)
        if (shouldCleanValue(field.key)) {
          value = cleanValueByFieldKey(value as string, field.key);
        }

        // Converter tipos
        switch (field.type) {
          case 'number':
            value = parseNumber(value as string, currentDecimalSeparator);
            break;
          case 'boolean':
            const boolValue = (value as string).toLowerCase();
            value = ['true', 'sim', 'yes', '1', 's', 'verdadeiro'].includes(
              boolValue
            );
            break;
          case 'date':
            value = new Date(value as string).toISOString();
            break;
          case 'reference': {
            // Resolve name → ID (case-insensitive)
            const refOptions = currentReferenceData?.[field.key];
            if (refOptions && refOptions.length > 0) {
              const strValue = (value as string).toLowerCase();
              // If it's already a valid ID, keep it
              const byId = refOptions.find(o => o.value === value);
              if (!byId) {
                const byLabel = refOptions.find(
                  o => o.label.toLowerCase() === strValue
                );
                if (byLabel) {
                  value = byLabel.value;
                }
              }
            }
            break;
          }
        }

        // Handle nested keys (e.g., "profile.name")
        const keys = field.key.split('.');
        if (keys.length > 1) {
          let current = rowData;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]] as Record<string, unknown>;
          }
          current[keys[keys.length - 1]] = value;
        } else {
          rowData[field.key] = value;
        }
      });

      result.push({
        rowIndex: rowIndex + 1,
        data: rowData,
      });
    });

    return result;
  }, []);

  // Contagem de linhas
  const rowCount = data.length - 1; // Excluir header

  const filledRowCount = useMemo(() => {
    return data
      .slice(1)
      .filter(row => row.some(cell => cell.value && cell.value.trim() !== ''))
      .length;
  }, [data]);

  // Aplicar dados de CSV/paste - uses refs to avoid stale closure issues
  const applyPastedData = useCallback((pastedData: string[][]) => {
    const currentHeaders = headersRef.current;
    const newRows: ImportCellData[][] = pastedData.map(row => {
      return currentHeaders.map((header, colIndex) => ({
        // Use pasted value or empty (not default)
        value: row[colIndex] ?? '',
        fieldKey: header.key,
      }));
    });

    // Adicionar linhas extras vazias
    while (newRows.length < MIN_ROWS) {
      newRows.push(createBlankRow(currentHeaders));
    }

    setData(prevData => [prevData[0], ...newRows]);
  }, []);

  return {
    data,
    setData: handleDataChange,
    headers,
    updateHeaders,
    addRow,
    addRows,
    removeRow,
    clearAll,
    validate,
    validationErrors,
    getRowData,
    rowCount,
    filledRowCount,
    applyPastedData,
  };
}
