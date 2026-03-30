/**
 * OpenSea OS - Finance Compliance Service
 *
 * Serviço para funcionalidades de compliance fiscal:
 * - Validação Simples Nacional
 * - Calendário Fiscal
 * - Geração de DARFs
 * - Exportação SPED ECD
 */

import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  SimplesNacionalResponse,
  TaxCalendarResponse,
  GenerateDarfsRequest,
  GenerateDarfsResponse,
  TaxObligation,
} from '@/types/finance';

// =============================================================================
// SERVICE
// =============================================================================

export const complianceService = {
  /**
   * Valida enquadramento no Simples Nacional para o ano informado
   */
  async getSimplesNacional(year: number): Promise<SimplesNacionalResponse> {
    return apiClient.get<SimplesNacionalResponse>(
      `${API_ENDPOINTS.FINANCE_COMPLIANCE.SIMPLES_NACIONAL}?year=${year}`
    );
  },

  /**
   * Lista obrigações fiscais do calendário para mês/ano
   */
  async getTaxCalendar(
    year: number,
    month: number
  ): Promise<TaxCalendarResponse> {
    return apiClient.get<TaxCalendarResponse>(
      `${API_ENDPOINTS.FINANCE_COMPLIANCE.TAX_CALENDAR}?year=${year}&month=${month}`
    );
  },

  /**
   * Gera DARFs para o mês/ano informado
   */
  async generateDarfs(
    data: GenerateDarfsRequest
  ): Promise<GenerateDarfsResponse> {
    return apiClient.post<GenerateDarfsResponse>(
      API_ENDPOINTS.FINANCE_COMPLIANCE.GENERATE_DARFS,
      data
    );
  },

  /**
   * Marca uma obrigação tributária como paga
   */
  async payObligation(id: string): Promise<{ obligation: TaxObligation }> {
    return apiClient.patch<{ obligation: TaxObligation }>(
      API_ENDPOINTS.FINANCE_COMPLIANCE.PAY_OBLIGATION(id)
    );
  },

  /**
   * Exporta arquivo SPED ECD para o ano informado
   */
  async exportSpedEcd(
    year: number
  ): Promise<{ blob: Blob; filename: string; contentType: string }> {
    return apiClient.getBlob(
      `${API_ENDPOINTS.FINANCE_COMPLIANCE.EXPORT_SPED_ECD}?year=${year}`
    );
  },
};
