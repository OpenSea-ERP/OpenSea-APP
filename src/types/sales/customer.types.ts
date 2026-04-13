// Customer Types

import type { PaginatedQuery } from '../pagination';

export type CustomerType = 'INDIVIDUAL' | 'BUSINESS';

export type ContactSource =
  | 'MANUAL'
  | 'IMPORT'
  | 'FORM'
  | 'WHATSAPP'
  | 'INSTAGRAM'
  | 'TELEGRAM'
  | 'SMS'
  | 'WEBCHAT'
  | 'EMAIL'
  | 'PDV'
  | 'MARKETPLACE'
  | 'BID'
  | 'API';

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  INDIVIDUAL: 'Pessoa Física',
  BUSINESS: 'Pessoa Jurídica',
};

export const CONTACT_SOURCE_LABELS: Record<ContactSource, string> = {
  MANUAL: 'Manual',
  IMPORT: 'Importação',
  FORM: 'Formulario',
  WHATSAPP: 'WhatsApp',
  INSTAGRAM: 'Instagram',
  TELEGRAM: 'Telegram',
  SMS: 'SMS',
  WEBCHAT: 'Chat Web',
  EMAIL: 'E-mail',
  PDV: 'Ponto de Venda',
  MARKETPLACE: 'Marketplace',
  BID: 'Licitação',
  API: 'API',
};

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  tradeName?: string;
  stateRegistration?: string;
  website?: string;
  notes?: string;
  tags: string[];
  source: ContactSource;
  assignedToUserId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreateCustomerRequest {
  name: string;
  type: CustomerType;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  tradeName?: string;
  stateRegistration?: string;
  website?: string;
  notes?: string;
  tags?: string[];
  source?: ContactSource;
  assignedToUserId?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  type?: CustomerType;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  tradeName?: string;
  stateRegistration?: string;
  website?: string;
  notes?: string;
  tags?: string[];
  source?: ContactSource;
  assignedToUserId?: string;
  isActive?: boolean;
}

export interface CustomersResponse {
  customers: Customer[];
}

export interface CustomerResponse {
  customer: Customer;
}

export interface PaginatedCustomersResponse {
  customers: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CustomersQuery extends PaginatedQuery {
  search?: string;
  type?: CustomerType;
  source?: ContactSource;
  isActive?: boolean;
  assignedToUserId?: string;
}
