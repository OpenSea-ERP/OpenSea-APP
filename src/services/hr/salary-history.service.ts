/**
 * OpenSea OS - Salary History Service
 *
 * Acessa o histórico de mudanças salariais de um funcionário e
 * registra novas alterações (PIN obrigatório).
 */

import { apiClient } from '@/lib/api-client';
import type { SalaryChangeReason } from '@/lib/hr/calculate-salary-change';

export interface SalaryHistoryRecord {
  id: string;
  employeeId: string;
  previousSalary: number | null;
  newSalary: number;
  reason: SalaryChangeReason;
  notes: string | null;
  effectiveDate: string;
  changedBy: string;
  createdAt: string;
}

export interface ListSalaryHistoryResponse {
  history: SalaryHistoryRecord[];
}

export interface RegisterSalaryChangeRequest {
  newSalary: number;
  reason: SalaryChangeReason;
  notes?: string;
  effectiveDate: string;
  pin: string;
}

export interface RegisterSalaryChangeResponse {
  salaryHistory: SalaryHistoryRecord;
  appliedToEmployee: boolean;
  previousSalary: number | null;
}

export const salaryHistoryService = {
  /**
   * Lista a timeline salarial de um funcionário em ordem decrescente
   * por data efetiva.
   */
  async listByEmployee(employeeId: string): Promise<ListSalaryHistoryResponse> {
    return apiClient.get<ListSalaryHistoryResponse>(
      `/v1/hr/employees/${employeeId}/salary-history`
    );
  },

  /**
   * Registra uma nova mudança salarial. Requer PIN de ação válido.
   */
  async register(
    employeeId: string,
    payload: RegisterSalaryChangeRequest
  ): Promise<RegisterSalaryChangeResponse> {
    return apiClient.post<RegisterSalaryChangeResponse>(
      `/v1/hr/employees/${employeeId}/salary-history`,
      payload
    );
  },
};
