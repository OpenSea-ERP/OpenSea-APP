export type CustomFieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'CHECKBOX'
  | 'URL'
  | 'EMAIL';

export interface CustomField {
  id: string;
  boardId: string;
  name: string;
  type: CustomFieldType;
  options: string[] | null;
  isRequired: boolean;
  position: number;
  createdAt: string;
}

export interface CardCustomFieldValue {
  id: string;
  cardId: string;
  fieldId: string;
  value: string | null;
  field?: CustomField;
}

export interface CreateCustomFieldRequest {
  name: string;
  type: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
  position?: number;
}

export interface UpdateCustomFieldRequest {
  name?: string;
  type?: CustomFieldType;
  options?: string[];
  isRequired?: boolean;
  position?: number;
}

export interface SetCustomFieldValueRequest {
  values: { fieldId: string; value: unknown }[];
}

export interface CustomFieldsQuery {
  page?: number;
  limit?: number;
}
