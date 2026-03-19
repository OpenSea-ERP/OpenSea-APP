// ============================================
// USE ROW GROUPER HOOK
// Hook para agrupar linhas de variantes em produtos
// ============================================

import { useMemo, useCallback } from 'react';
import type { ParsedSheet } from '../../_shared/utils/excel-parser';
import type {
  ColumnMapping,
  GroupedProduct,
  ValidationError,
  ValidationWarning,
} from './use-catalog-import';

// ============================================
// TYPES
// ============================================

export interface UseRowGrouperReturn {
  /** Agrupa as linhas do arquivo em produtos com suas variantes */
  groupRows: (sheet: ParsedSheet, mapping: ColumnMapping) => GroupedProduct[];

  /** Extrai dados de produto de uma linha */
  extractProductData: (
    row: Record<string, string>,
    mapping: ColumnMapping
  ) => Record<string, unknown>;

  /** Extrai dados de variante de uma linha */
  extractVariantData: (
    row: Record<string, string>,
    mapping: ColumnMapping
  ) => Record<string, unknown>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function normalizeValue(value: string | undefined | null): string {
  if (value === undefined || value === null) return '';
  return value.trim();
}

function parseNumber(value: string): number | null {
  if (!value) return null;
  // Remove formatação brasileira (1.234,56 -> 1234.56)
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? null : num;
}

function parseBoolean(value: string): boolean | null {
  if (!value) return null;
  const lower = value.toLowerCase().trim();
  if (['true', 'yes', 'sim', '1', 'verdadeiro'].includes(lower)) return true;
  if (['false', 'no', 'não', 'nao', '0', 'falso'].includes(lower)) return false;
  return null;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useRowGrouper(): UseRowGrouperReturn {
  /**
   * Extrai dados de produto de uma linha baseado no mapeamento
   */
  const extractProductData = useCallback(
    (
      row: Record<string, string>,
      mapping: ColumnMapping
    ): Record<string, unknown> => {
      const data: Record<string, unknown> = {};
      const attributes: Record<string, unknown> = {};

      // Extrair nome do produto da coluna de agrupamento
      if (mapping.groupingColumn) {
        data.name = normalizeValue(row[mapping.groupingColumn]);
      }

      // Extrair campos mapeados
      for (const [fileColumn, systemField] of Object.entries(mapping.product)) {
        const rawValue = normalizeValue(row[fileColumn]);
        if (!rawValue) continue;

        // Campos de atributos do template
        if (systemField.startsWith('attributes.')) {
          const attrKey = systemField.replace('attributes.', '');
          attributes[attrKey] = rawValue;
        } else {
          // Campos do sistema
          switch (systemField) {
            case 'name':
              data.name = rawValue;
              break;
            case 'description':
              data.description = rawValue;
              break;
            case 'manufacturerCnpj':
              data.manufacturerCnpj = rawValue.replace(/\D/g, '');
              break;
            case 'supplierCnpj':
              data.supplierCnpj = rawValue.replace(/\D/g, '');
              break;
            case 'outOfLine':
              data.outOfLine = parseBoolean(rawValue) ?? false;
              break;
            default:
              data[systemField] = rawValue;
          }
        }
      }

      if (Object.keys(attributes).length > 0) {
        data.attributes = attributes;
      }

      return data;
    },
    []
  );

  /**
   * Extrai dados de variante de uma linha baseado no mapeamento
   */
  const extractVariantData = useCallback(
    (
      row: Record<string, string>,
      mapping: ColumnMapping
    ): Record<string, unknown> => {
      const data: Record<string, unknown> = {};
      const attributes: Record<string, unknown> = {};

      for (const [fileColumn, systemField] of Object.entries(mapping.variant)) {
        const rawValue = normalizeValue(row[fileColumn]);
        if (!rawValue) continue;

        // Campos de atributos do template
        if (systemField.startsWith('attributes.')) {
          const attrKey = systemField.replace('attributes.', '');
          attributes[attrKey] = rawValue;
        } else {
          // Campos do sistema
          switch (systemField) {
            case 'name':
              data.name = rawValue;
              break;
            case 'sku':
              data.sku = rawValue;
              break;
            case 'price':
              data.price = parseNumber(rawValue);
              break;
            case 'costPrice':
              data.costPrice = parseNumber(rawValue);
              break;
            case 'barcode':
              data.barcode = rawValue;
              break;
            case 'colorHex':
              // Garantir que começa com #
              data.colorHex = rawValue.startsWith('#')
                ? rawValue
                : `#${rawValue}`;
              break;
            case 'colorPantone':
              data.colorPantone = rawValue;
              break;
            case 'reference':
              data.reference = rawValue;
              break;
            case 'minStock':
              data.minStock = parseNumber(rawValue);
              break;
            case 'maxStock':
              data.maxStock = parseNumber(rawValue);
              break;
            case 'isActive':
              data.isActive = parseBoolean(rawValue) ?? true;
              break;
            case 'outOfLine':
              data.outOfLine = parseBoolean(rawValue) ?? false;
              break;
            default:
              data[systemField] = rawValue;
          }
        }
      }

      if (Object.keys(attributes).length > 0) {
        data.attributes = attributes;
      }

      return data;
    },
    []
  );

  /**
   * Agrupa linhas em produtos com suas variantes
   */
  const groupRows = useCallback(
    (sheet: ParsedSheet, mapping: ColumnMapping): GroupedProduct[] => {
      const groups = new Map<string, GroupedProduct>();

      sheet.rows.forEach((row, rowIndex) => {
        // Obter chave de agrupamento
        const groupKey = normalizeValue(row[mapping.groupingColumn]);
        if (!groupKey) {
          // Linha sem valor de agrupamento - ignorar ou criar erro
          return;
        }

        // Extrair dados
        const productData = extractProductData(row, mapping);
        const variantData = extractVariantData(row, mapping);

        // Verificar se já existe grupo para este produto
        let group = groups.get(groupKey);

        if (!group) {
          // Criar novo grupo
          group = {
            tempId: generateTempId(),
            productData,
            variants: [],
            rowNumbers: [],
            errors: [],
            warnings: [],
          };
          groups.set(groupKey, group);
        }

        // Adicionar variante ao grupo
        group.variants.push({
          tempId: generateTempId(),
          data: variantData,
          rowIndex,
        });
        group.rowNumbers.push(rowIndex + 1); // 1-indexed for display

        // Validações básicas
        if (!variantData.name) {
          group.warnings.push({
            type: 'variant',
            field: 'name',
            message: `Linha ${rowIndex + 1}: Nome da variante vazio`,
            rowIndex,
          });
        }
      });

      // Converter para array e validar produtos
      const products = Array.from(groups.values());

      products.forEach(product => {
        // Validar produto
        if (!product.productData.name) {
          product.errors.push({
            type: 'product',
            field: 'name',
            message: 'Nome do produto é obrigatório',
          });
        }

        // Validar se tem pelo menos uma variante
        if (product.variants.length === 0) {
          product.errors.push({
            type: 'product',
            field: 'variants',
            message: 'Produto deve ter pelo menos uma variante',
          });
        }

        // Verificar variantes duplicadas (mesmo nome)
        const variantNames = new Set<string>();
        product.variants.forEach(variant => {
          const name = String(variant.data.name || '');
          if (variantNames.has(name)) {
            product.warnings.push({
              type: 'variant',
              field: 'name',
              message: `Variante duplicada: "${name}"`,
              rowIndex: variant.rowIndex,
            });
          }
          variantNames.add(name);
        });
      });

      return products;
    },
    [extractProductData, extractVariantData]
  );

  return useMemo(
    () => ({
      groupRows,
      extractProductData,
      extractVariantData,
    }),
    [groupRows, extractProductData, extractVariantData]
  );
}

// ============================================
// STATISTICS HELPER
// ============================================

export interface GroupingStatistics {
  totalProducts: number;
  totalVariants: number;
  averageVariantsPerProduct: number;
  productsWithErrors: number;
  productsWithWarnings: number;
  totalErrors: number;
  totalWarnings: number;
}

export function calculateGroupingStatistics(
  groups: GroupedProduct[]
): GroupingStatistics {
  const totalProducts = groups.length;
  const totalVariants = groups.reduce((sum, g) => sum + g.variants.length, 0);
  const productsWithErrors = groups.filter(g => g.errors.length > 0).length;
  const productsWithWarnings = groups.filter(g => g.warnings.length > 0).length;
  const totalErrors = groups.reduce((sum, g) => sum + g.errors.length, 0);
  const totalWarnings = groups.reduce((sum, g) => sum + g.warnings.length, 0);

  return {
    totalProducts,
    totalVariants,
    averageVariantsPerProduct:
      totalProducts > 0 ? totalVariants / totalProducts : 0,
    productsWithErrors,
    productsWithWarnings,
    totalErrors,
    totalWarnings,
  };
}
