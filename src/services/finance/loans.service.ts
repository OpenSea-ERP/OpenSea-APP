import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  Loan,
  LoansQuery,
  CreateLoanData,
  UpdateLoanData,
  PayLoanInstallmentData,
  LoanInstallment,
} from '@/types/finance';
import type { PaginationMeta } from '@/types/pagination';

export interface LoansResponse {
  loans: Loan[];
  meta: PaginationMeta;
}

export interface LoanResponse {
  loan: Loan;
}

export interface LoanPaymentResponse {
  installment: LoanInstallment;
}

export const loansService = {
  async list(params?: LoansQuery): Promise<LoansResponse> {
    const query = new URLSearchParams({
      page: String(params?.page ?? 1),
      limit: String(params?.perPage ?? 20),
    });

    if (params?.search) query.append('search', params.search);
    if (params?.bankAccountId)
      query.append('bankAccountId', params.bankAccountId);
    if (params?.costCenterId) query.append('costCenterId', params.costCenterId);
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    if (params?.sortBy) query.append('sortBy', params.sortBy);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    return apiClient.get<LoansResponse>(
      `${API_ENDPOINTS.LOANS.LIST}?${query.toString()}`
    );
  },

  async get(id: string): Promise<LoanResponse> {
    return apiClient.get<LoanResponse>(API_ENDPOINTS.LOANS.GET(id));
  },

  async create(data: CreateLoanData): Promise<LoanResponse> {
    return apiClient.post<LoanResponse>(API_ENDPOINTS.LOANS.CREATE, data);
  },

  async update(id: string, data: UpdateLoanData): Promise<LoanResponse> {
    return apiClient.put<LoanResponse>(API_ENDPOINTS.LOANS.UPDATE(id), data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.LOANS.DELETE(id));
  },

  async registerPayment(
    loanId: string,
    data: PayLoanInstallmentData
  ): Promise<LoanPaymentResponse> {
    return apiClient.post<LoanPaymentResponse>(
      API_ENDPOINTS.LOANS.REGISTER_PAYMENT(loanId),
      data
    );
  },
};
