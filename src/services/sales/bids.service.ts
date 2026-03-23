import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  BidsQuery,
  PaginatedBidsResponse,
  BidResponse,
  CreateBidRequest,
  UpdateBidRequest,
  PaginatedBidItemsResponse,
  PaginatedBidDocumentsResponse,
  PaginatedBidContractsResponse,
  PaginatedBidHistoryResponse,
  CreateBidDocumentRequest,
  BidDocumentResponse,
  CreateBidContractRequest,
  BidContractResponse,
} from '@/types/sales';

function buildParams(query?: Record<string, unknown>): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}

export const bidsService = {
  async list(query?: BidsQuery): Promise<PaginatedBidsResponse> {
    return apiClient.get<PaginatedBidsResponse>(
      `${API_ENDPOINTS.BIDS.LIST}${buildParams(query as Record<string, unknown>)}`
    );
  },

  async get(id: string): Promise<BidResponse> {
    return apiClient.get<BidResponse>(API_ENDPOINTS.BIDS.GET(id));
  },

  async create(data: CreateBidRequest): Promise<BidResponse> {
    return apiClient.post<BidResponse>(API_ENDPOINTS.BIDS.CREATE, data);
  },

  async update(id: string, data: UpdateBidRequest): Promise<BidResponse> {
    return apiClient.put<BidResponse>(API_ENDPOINTS.BIDS.UPDATE(id), data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(API_ENDPOINTS.BIDS.DELETE(id));
  },

  async listItems(
    bidId: string,
    query?: { page?: number; limit?: number }
  ): Promise<PaginatedBidItemsResponse> {
    return apiClient.get<PaginatedBidItemsResponse>(
      `${API_ENDPOINTS.BIDS.ITEMS(bidId)}${buildParams(query as Record<string, unknown>)}`
    );
  },

  async listHistory(
    bidId: string,
    query?: { page?: number; limit?: number }
  ): Promise<PaginatedBidHistoryResponse> {
    return apiClient.get<PaginatedBidHistoryResponse>(
      `${API_ENDPOINTS.BIDS.HISTORY(bidId)}${buildParams(query as Record<string, unknown>)}`
    );
  },

  async listDocuments(query?: {
    page?: number;
    limit?: number;
    bidId?: string;
    type?: string;
  }): Promise<PaginatedBidDocumentsResponse> {
    return apiClient.get<PaginatedBidDocumentsResponse>(
      `${API_ENDPOINTS.BID_DOCUMENTS.LIST}${buildParams(query as Record<string, unknown>)}`
    );
  },

  async createDocument(
    data: CreateBidDocumentRequest
  ): Promise<BidDocumentResponse> {
    return apiClient.post<BidDocumentResponse>(
      API_ENDPOINTS.BID_DOCUMENTS.CREATE,
      data
    );
  },

  async listContracts(query?: {
    page?: number;
    limit?: number;
    status?: string;
    bidId?: string;
  }): Promise<PaginatedBidContractsResponse> {
    return apiClient.get<PaginatedBidContractsResponse>(
      `${API_ENDPOINTS.BID_CONTRACTS.LIST}${buildParams(query as Record<string, unknown>)}`
    );
  },

  async createContract(
    data: CreateBidContractRequest
  ): Promise<BidContractResponse> {
    return apiClient.post<BidContractResponse>(
      API_ENDPOINTS.BID_CONTRACTS.CREATE,
      data
    );
  },
};
