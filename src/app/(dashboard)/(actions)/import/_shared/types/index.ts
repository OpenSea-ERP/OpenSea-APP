// ============================================
// IMPORT MODULE TYPES
// ============================================

import type { CellBase } from 'react-spreadsheet';

// ============================================
// ENTITY TYPES
// ============================================

export type ImportEntityType =
  | 'products'
  | 'variants'
  | 'items'
  | 'suppliers'
  | 'categories'
  | 'product-categories'
  | 'users'
  | 'templates'
  | 'manufacturers'
  | 'companies'
  | 'departments'
  | 'positions'
  | 'employees';

// ============================================
// FIELD CONFIGURATION
// ============================================

export type FieldType =
  | 'text'
  | 'number'
  | 'email'
  | 'date'
  | 'boolean'
  | 'select'
  | 'reference'; // FK to another entity

export interface FieldOption {
  value: string;
  label: string;
  searchText?: string; // Optional text for multi-field search
  // For two-line display in select dialogs
  secondaryLabel?: string; // Secondary line (e.g., variant name)
  badges?: string[]; // Small badges/tags to show (e.g., template, product)
}

export interface ImportFieldConfig {
  // Identificação
  key: string; // Nome do campo no banco (ex: "name", "templateId")
  label: string; // Label padrão do sistema
  description?: string; // Descrição do campo para ajuda

  // Configuração do usuário
  customLabel?: string; // Label customizado pelo usuário
  enabled: boolean; // Se o campo está habilitado para importação
  order: number; // Ordem de exibição

  // Tipo e validação
  type: FieldType;
  required: boolean;

  // Valor padrão (para campos select ou fixos)
  defaultValue?: string | number | boolean;

  // Opções para select
  options?: FieldOption[];

  // Para campos de referência (FK)
  referenceEntity?:
    | ImportEntityType
    | 'templates'
    | 'manufacturers'
    | 'locations';
  referenceDisplayField?: string; // Campo para exibir (ex: "name")

  // Validação
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string; // Regex
  patternMessage?: string;
}

export interface ImportConfig {
  entityType: ImportEntityType;
  fields: ImportFieldConfig[];
  createdAt: Date;
  updatedAt: Date;
  name?: string; // Nome do template de configuração
  templateId?: string; // ID do template (para products/variants/items)
  templateName?: string; // Nome do template
}

// ============================================
// SPREADSHEET TYPES
// ============================================

export interface ImportCellData extends CellBase<string> {
  value: string;
  fieldKey?: string;
  error?: string;
  warning?: string;
  isHeader?: boolean;
}

export type ImportSpreadsheetData = ImportCellData[][];

// ============================================
// VALIDATION TYPES
// ============================================

export interface ValidationError {
  row: number;
  column: number;
  fieldKey: string;
  message: string;
  value?: string;
}

export interface ValidationWarning {
  row: number;
  column: number;
  fieldKey: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// ============================================
// IMPORT PROGRESS TYPES
// ============================================

export type ImportStatus =
  | 'idle'
  | 'validating'
  | 'validated'
  | 'importing'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ImportProgress {
  status: ImportStatus;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  errors: Array<{
    row: number;
    message: string;
    data?: Record<string, unknown>;
  }>;
  startedAt?: Date;
  completedAt?: Date;
}

// ============================================
// IMPORT REQUEST/RESPONSE TYPES
// ============================================

export interface ImportRowData {
  rowIndex: number;
  data: Record<string, unknown>;
}

export interface ImportRequest {
  entityType: ImportEntityType;
  rows: ImportRowData[];
  options?: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    dryRun?: boolean;
    batchSize?: number;
    delayBetweenBatches?: number;
  };
}

export interface ImportResultRow {
  rowIndex: number;
  success: boolean;
  entityId?: string;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  failedRows: number;
  results: ImportResultRow[];
  createdIds: string[];
}

// ============================================
// STORAGE TYPES (LocalStorage)
// ============================================

export interface StoredImportConfig {
  id: string;
  name: string;
  entityType: ImportEntityType;
  fields: ImportFieldConfig[];
  createdAt: string;
  updatedAt: string;
  templateId?: string; // ID do template (para products/variants/items)
  templateName?: string; // Nome do template
}

// ============================================
// ENTITY FIELD DEFINITIONS
// ============================================

export interface EntityFieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  description?: string;
  referenceEntity?: string;
  referenceDisplayField?: string;
  options?: FieldOption[];
  defaultValue?: string | number | boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    patternMessage?: string;
  };
}

export interface EntityImportDefinition {
  entityType: ImportEntityType;
  label: string;
  labelPlural: string;
  description: string;
  icon: string; // Lucide icon name
  color: string;
  fields: EntityFieldDefinition[];
  // Endpoint info
  apiEndpoint: string;
  batchEndpoint?: string;
  // Import path info
  basePath?: string; // Base path for import routes (e.g., '/import/stock/products')
  module: 'stock' | 'admin' | 'hr'; // Module grouping
  permission: string; // Required RBAC permission (e.g., 'stock.products.import')
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UseImportConfigReturn {
  config: ImportConfig | null;
  isLoading: boolean;
  saveConfig: (config: ImportConfig) => void;
  loadConfig: (id?: string) => ImportConfig | null;
  resetConfig: () => void;
  savedConfigs: StoredImportConfig[];
  deleteConfig: (id: string) => void;
}

export interface UseImportSpreadsheetReturn {
  data: ImportSpreadsheetData;
  setData: (data: ImportSpreadsheetData) => void;
  headers: ImportFieldConfig[];
  addRow: () => void;
  removeRow: (index: number) => void;
  clearAll: () => void;
  getRowData: () => ImportRowData[];
  rowCount: number;
  filledRowCount: number;
}

export interface UseImportProcessReturn {
  progress: ImportProgress;
  startImport: (rows: ImportRowData[]) => Promise<ImportResult>;
  pauseImport: () => void;
  resumeImport: () => void;
  cancelImport: () => void;
  reset: () => void;
}

// ============================================
// AI INTEGRATION TYPES
// ============================================

export interface ImportRow {
  [fieldKey: string]: string | number | boolean | null;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  confidence: number;
  transform?: 'none' | 'date' | 'number' | 'boolean' | 'reference-lookup';
}

export interface ImportAIBridge {
  fillFromAI(rows: ImportRow[]): void;
  exportForAI(): {
    entityType: string;
    columns: ImportFieldConfig[];
    rows: ImportRow[];
    referenceData: Record<string, { id: string; label: string }[]>;
  };
  applySuggestedMapping(mapping: ColumnMapping[]): void;
  getEntityDefinition(): EntityImportDefinition;
}
