/**
 * HR Generated Employment Contracts service
 * Bridges the frontend with the backend signature envelope endpoints.
 */

import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';

export interface GeneratedContract {
  id: string;
  templateId: string;
  employeeId: string;
  generatedBy: string;
  storageFileId: string | null;
  pdfUrl: string | null;
  pdfKey: string | null;
  variables: Record<string, unknown>;
  signatureEnvelopeId: string | null;
  createdAt: string;
}

export interface ListEmployeeContractsResponse {
  contracts: GeneratedContract[];
}

export interface RequestContractSignaturePayload {
  signerEmail?: string;
  signerName?: string;
  expiresInDays?: number;
}

export interface ContractSignatureEnvelopeResponse {
  envelope: Record<string, unknown>;
  envelopeId: string;
}

export interface ContractSignatureStatusResponse {
  envelope: Record<string, unknown>;
}

export const hrContractsService = {
  async listByEmployee(
    employeeId: string
  ): Promise<ListEmployeeContractsResponse> {
    return apiClient.get<ListEmployeeContractsResponse>(
      API_ENDPOINTS.HR_CONTRACTS.LIST_BY_EMPLOYEE(employeeId)
    );
  },

  async requestSignature(
    contractId: string,
    data?: RequestContractSignaturePayload
  ): Promise<ContractSignatureEnvelopeResponse> {
    return apiClient.post<ContractSignatureEnvelopeResponse>(
      API_ENDPOINTS.HR_CONTRACTS.REQUEST_SIGNATURE(contractId),
      data ?? {}
    );
  },

  async getSignatureStatus(
    contractId: string
  ): Promise<ContractSignatureStatusResponse> {
    return apiClient.get<ContractSignatureStatusResponse>(
      API_ENDPOINTS.HR_CONTRACTS.SIGNATURE_STATUS(contractId)
    );
  },

  async cancelSignature(contractId: string, reason?: string): Promise<void> {
    const trimmed = reason?.trim();
    await apiClient.delete<void>(
      API_ENDPOINTS.HR_CONTRACTS.CANCEL_SIGNATURE(contractId),
      trimmed ? { reason: trimmed } : undefined
    );
  },
};
