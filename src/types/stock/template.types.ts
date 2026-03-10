// Template Types

/**
 * Tipo do atributo de template
 */
export type TemplateAttributeType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select';

/**
 * Definicao de um atributo de template
 * Usado em productAttributes, variantAttributes e itemAttributes
 */
export interface TemplateAttribute {
  /** Tipo do dado */
  type: TemplateAttributeType;
  /** Label exibido no formulario (opcional - se nao informado, usa a key) */
  label?: string;
  /** Se e obrigatorio */
  required?: boolean;
  /** Valor padrao */
  defaultValue?: unknown;
  /** Unidade de medida (ex: "kg", "cm", "m2") */
  unitOfMeasure?: string;
  /** Mascara do input (ex: "###.###.###-##" para CPF) */
  mask?: string;
  /** Placeholder do input */
  placeholder?: string;
  /** Habilitar impressao na etiqueta */
  enablePrint?: boolean;
  /** Habilitar visualizacao */
  enableView?: boolean;
  /** Opcoes para tipo select */
  options?: string[];
  /** Descricao do atributo */
  description?: string;
}

/**
 * Mapa de atributos de template
 * Chave e o slug do atributo, valor e a definicao
 */
export type TemplateAttributes = Record<string, TemplateAttribute>;

export type UnitOfMeasure =
  | 'UNITS'
  | 'METERS'
  | 'KILOGRAMS'
  | 'GRAMS'
  | 'LITERS'
  | 'MILLILITERS'
  | 'SQUARE_METERS'
  | 'PAIRS'
  | 'BOXES'
  | 'PACKS';

export const UNIT_OF_MEASURE_LABELS: Record<UnitOfMeasure, string> = {
  UNITS: 'Unidades (un)',
  METERS: 'Metros (m)',
  KILOGRAMS: 'Quilogramas (kg)',
  GRAMS: 'Gramas (g)',
  LITERS: 'Litros (L)',
  MILLILITERS: 'Mililitros (mL)',
  SQUARE_METERS: 'Metros quadrados (m²)',
  PAIRS: 'Pares (par)',
  BOXES: 'Caixas (cx)',
  PACKS: 'Pacotes (pct)',
};

/**
 * Template de produto
 */
export interface Template {
  id: string;
  code?: string; // Codigo hierarquico (3 digitos: 001)
  sequentialCode?: number;
  name: string;
  /** URL do icone SVG do template */
  iconUrl?: string;
  unitOfMeasure: UnitOfMeasure;
  productAttributes?: TemplateAttributes;
  variantAttributes?: TemplateAttributes;
  itemAttributes?: TemplateAttributes;
  specialModules: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export interface CreateTemplateRequest {
  name: string;
  code?: string;
  iconUrl?: string;
  unitOfMeasure: UnitOfMeasure;
  productAttributes?: TemplateAttributes;
  variantAttributes?: TemplateAttributes;
  itemAttributes?: TemplateAttributes;
  specialModules?: string[];
}

export interface UpdateTemplateRequest {
  name?: string;
  code?: string;
  iconUrl?: string;
  unitOfMeasure?: UnitOfMeasure;
  productAttributes?: TemplateAttributes;
  variantAttributes?: TemplateAttributes;
  itemAttributes?: TemplateAttributes;
  specialModules?: string[];
}

export interface TemplatesResponse {
  templates: Template[];
}

export interface TemplateResponse {
  template: Template;
}

// Template Request Types (User requests)
export type TemplateRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export interface TemplateRequest {
  id: string;
  templateName: string;
  category?: string;
  justification: string;
  examples?: string;
  status: TemplateRequestStatus;
  requestedBy: string;
  requestedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  completedTemplateId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateTemplateRequestRequest {
  templateName: string;
  category?: string;
  justification: string;
  examples?: string;
}

export interface UpdateTemplateRequestRequest {
  status?: TemplateRequestStatus;
  reviewNotes?: string;
  completedTemplateId?: string;
}

export interface TemplateRequestsResponse {
  requests: TemplateRequest[];
}

export interface TemplateRequestResponse {
  request: TemplateRequest;
}
