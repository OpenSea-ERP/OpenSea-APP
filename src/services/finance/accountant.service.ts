import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  AccountantAccessesResponse,
  InviteAccountantRequest,
  InviteAccountantResponse,
  AccountantPortalData,
  AccountantDreReport,
  AccountantDataCategory,
} from '@/types/finance';

// ============================================================================
// ADMIN SERVICE (uses normal JWT auth)
// ============================================================================

class AccountantService {
  async list(): Promise<AccountantAccessesResponse> {
    return apiClient.get<AccountantAccessesResponse>(
      API_ENDPOINTS.ACCOUNTANT.LIST
    );
  }

  async invite(
    data: InviteAccountantRequest
  ): Promise<InviteAccountantResponse> {
    return apiClient.post<InviteAccountantResponse>(
      API_ENDPOINTS.ACCOUNTANT.INVITE,
      data
    );
  }

  async revoke(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ACCOUNTANT.REVOKE(id));
  }
}

export const accountantService = new AccountantService();

// ============================================================================
// PORTAL SERVICE (uses token-based auth)
// ============================================================================

function createPortalClient(accessToken: string) {
  const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

  return {
    async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
      const queryString = params
        ? '?' +
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
            .join('&')
        : '';

      const response = await fetch(`${baseURL}${url}${queryString}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(`Portal request failed: ${response.status}`);
      }

      return response.json() as Promise<T>;
    },

    async getBlob(
      url: string,
      params?: Record<string, unknown>
    ): Promise<Blob> {
      const queryString = params
        ? '?' +
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
            .join('&')
        : '';

      const response = await fetch(`${baseURL}${url}${queryString}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(`Portal request failed: ${response.status}`);
      }

      return response.blob();
    },
  };
}

export class AccountantPortalService {
  private client: ReturnType<typeof createPortalClient>;

  constructor(accessToken: string) {
    this.client = createPortalClient(accessToken);
  }

  async getData(year: number, month: number): Promise<AccountantPortalData> {
    return this.client.get<AccountantPortalData>(
      API_ENDPOINTS.ACCOUNTANT_PORTAL.DATA,
      { year, month }
    );
  }

  async getCategories(): Promise<{ categories: AccountantDataCategory[] }> {
    return this.client.get<{ categories: AccountantDataCategory[] }>(
      API_ENDPOINTS.ACCOUNTANT_PORTAL.CATEGORIES
    );
  }

  async getDre(year: number): Promise<AccountantDreReport> {
    return this.client.get<AccountantDreReport>(
      API_ENDPOINTS.ACCOUNTANT_PORTAL.DRE,
      { year }
    );
  }

  async exportSped(params: {
    year: number;
    format?: string;
    startMonth?: number;
    endMonth?: number;
  }): Promise<Blob> {
    return this.client.getBlob(
      API_ENDPOINTS.ACCOUNTANT_PORTAL.EXPORT_SPED,
      params
    );
  }
}
