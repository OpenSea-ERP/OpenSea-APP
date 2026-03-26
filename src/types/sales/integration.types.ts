// Integration Types (Integration Hub / Central de Integrações)

export type IntegrationCategory =
  | 'CRM'
  | 'MARKETING'
  | 'MESSAGING'
  | 'PAYMENT'
  | 'ECOMMERCE'
  | 'ANALYTICS'
  | 'SOCIAL'
  | 'OTHER';

export const INTEGRATION_CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  CRM: 'CRM',
  MARKETING: 'Marketing',
  MESSAGING: 'Mensagens',
  PAYMENT: 'Pagamentos',
  ECOMMERCE: 'E-commerce',
  ANALYTICS: 'Analytics',
  SOCIAL: 'Redes Sociais',
  OTHER: 'Outros',
};

export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

export const INTEGRATION_STATUS_LABELS: Record<IntegrationStatus, string> = {
  CONNECTED: 'Conectado',
  DISCONNECTED: 'Desconectado',
  ERROR: 'Erro',
};

export interface IntegrationConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'select' | 'toggle';
  required: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  description?: string;
}

export interface Integration {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: IntegrationCategory;
  icon?: string;
  logoUrl?: string;
  status: IntegrationStatus;
  isAvailable: boolean;
  configSchema: IntegrationConfigField[];
  config?: Record<string, unknown>;
  connectedAt?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ConnectIntegrationRequest {
  config: Record<string, unknown>;
}

export interface DisconnectIntegrationRequest {
  integrationId: string;
}

export interface IntegrationResponse {
  integration: Integration;
}

export interface IntegrationsResponse {
  integrations: Integration[];
}

export interface IntegrationsQuery {
  search?: string;
  category?: IntegrationCategory;
  status?: IntegrationStatus;
}
