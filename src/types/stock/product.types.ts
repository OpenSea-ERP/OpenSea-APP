// Product Types

import type { PaginationMeta, PaginatedQuery } from '../pagination';
import type { TemplateAttributes } from './template.types';
import type { Supplier } from './supplier.types';
import type { Manufacturer } from './manufacturer.types';
import type { ProductCategory, ProductTag } from './category.types';

export type ProductStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'DISCONTINUED'
  | 'OUT_OF_STOCK';

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  DISCONTINUED: 'Descontinuado',
  OUT_OF_STOCK: 'Sem Estoque',
};

/**
 * Product - Tipo principal que retorna do backend JA COM DADOS EXPANDIDOS
 * O backend retorna todas as relacoes: template, supplier, manufacturer, variants, categories, tags
 */
export interface Product {
  id: string;
  name: string;
  /** Codigo completo gerado pelo backend (read-only) */
  fullCode?: string;
  /** Codigo sequencial auto-incrementado por tenant (read-only) */
  sequentialCode?: number;
  description?: string;
  status: ProductStatus;
  outOfLine: boolean;
  attributes: Record<string, unknown>;
  templateId: string;
  template?: {
    id: string;
    name: string;
    unitOfMeasure: string;
    sequentialCode?: number;
    productAttributes?: TemplateAttributes;
    variantAttributes?: TemplateAttributes;
    itemAttributes?: TemplateAttributes;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
  };
  supplierId?: string;
  supplier?: Supplier | null;
  manufacturerId?: string;
  manufacturer?: Manufacturer | null;
  /** @deprecated Mapped to tenantId on backend - do not use */
  organizationId?: string;
  variants?: Array<{
    id: string;
    sku?: string;
    fullCode?: string;
    sequentialCode?: number;
    name: string;
    price: number;
    costPrice?: number;
    profitMargin?: number;
    imageUrl?: string;
    barcode?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
  }>;
  productCategories?: ProductCategory[];
  productTags?: ProductTag[];
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface CreateProductRequest {
  name: string;
  // fullCode e sequentialCode sao gerados pelo backend (nao enviar)
  description?: string;
  // status omitido - sera ACTIVE por padrao no backend
  // unitOfMeasure removido - vem do Template
  attributes?: Record<string, unknown>;
  templateId: string;
  supplierId?: string;
  manufacturerId?: string;
}

export interface UpdateProductRequest {
  name?: string;
  // code e fullCode sao IMUTAVEIS apos criacao
  description?: string;
  status?: ProductStatus;
  outOfLine?: boolean;
  // unitOfMeasure removido
  attributes?: Record<string, unknown>;
  supplierId?: string;
  manufacturerId?: string;
  categoryIds?: string[];
}

export interface ProductsResponse {
  products: Product[];
}

export interface ProductResponse {
  product: Product;
}

export interface ProductsQuery extends PaginatedQuery {
  templateId?: string;
  categoryId?: string;
  status?: ProductStatus;
  search?: string;
  manufacturerId?: string;
  supplierId?: string;
}

export interface PaginatedProductsResponse {
  products: Product[];
  pagination: PaginationMeta;
}
