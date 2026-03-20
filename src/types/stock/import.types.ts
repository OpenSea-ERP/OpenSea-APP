// Import Types

export type ImportStatus =
  | 'VALIDATING'
  | 'VALIDATED'
  | 'IMPORTING'
  | 'COMPLETED'
  | 'FAILED';

export interface ImportValidationRequest {
  type: 'PRODUCTS' | 'VARIANTS' | 'ITEMS';
  data: Record<string, unknown>[];
}

export interface ImportValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    value?: unknown;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  preview?: Record<string, unknown>[];
}

export interface ImportRequest {
  type: 'PRODUCTS' | 'VARIANTS' | 'ITEMS';
  data: Record<string, unknown>[];
  options?: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    dryRun?: boolean;
  };
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  failedRows: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
  createdIds?: string[];
}

export interface ImportTemplateResponse {
  headers: string[];
  requiredFields: string[];
  optionalFields: string[];
  sampleData: Record<string, unknown>[];
  instructions: string;
}

// Bulk validation
export interface BulkValidateRequest {
  productNames: string[];
  categoryNames: string[];
  manufacturerNames: string[];
  templateId: string;
}

export interface EntityRef {
  name: string;
  id: string;
}

export interface BulkValidateResponse {
  duplicateProducts: EntityRef[];
  existingCategories: EntityRef[];
  missingCategories: string[];
  existingManufacturers: EntityRef[];
  missingManufacturers: string[];
  templateValid: boolean;
}

// Bulk create
export interface BulkCreateProductInput {
  name: string;
  description?: string;
  status?: string;
  templateId: string;
  manufacturerId?: string;
  supplierId?: string;
  categoryIds?: string[];
  attributes?: Record<string, unknown>;
}

export interface BulkCreateProductsRequest {
  products: BulkCreateProductInput[];
  options: {
    skipDuplicates: boolean;
  };
}

export interface BulkCreateProductsResponse {
  created: Array<{ id: string; name: string; fullCode: string }>;
  skipped: Array<{ name: string; reason: string }>;
  errors: Array<{ index: number; name: string; message: string }>;
}

// Variant bulk validation
export interface BulkValidateVariantsRequest {
  productNames: string[];
  templateId: string;
}

export interface BulkValidateVariantsResponse {
  existingProducts: EntityRef[];
  missingProducts: string[];
  templateValid: boolean;
}

// Variant bulk create
export interface BulkCreateVariantInput {
  name: string;
  productId: string;
  sku?: string;
  price?: number;
  costPrice?: number;
  profitMargin?: number;
  colorHex?: string;
  colorPantone?: string;
  reference?: string;
  minStock?: number;
  maxStock?: number;
  outOfLine?: boolean;
  isActive?: boolean;
  attributes?: Record<string, unknown>;
}

export interface BulkCreateVariantsRequest {
  variants: BulkCreateVariantInput[];
  options: {
    skipDuplicates: boolean;
  };
}

export interface BulkCreateVariantsResponse {
  created: Array<{
    id: string;
    name: string;
    fullCode: string;
    productId: string;
  }>;
  skipped: Array<{ name: string; reason: string }>;
  errors: Array<{ index: number; name: string; message: string }>;
}
