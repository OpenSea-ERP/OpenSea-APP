import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import type {
  CreateManufacturerRequest,
  CreateSupplierRequest,
  CreateTagRequest,
  CreateTemplateRequest,
  ManufacturerResponse,
  ManufacturersResponse,
  SupplierResponse,
  SuppliersResponse,
  TagResponse,
  TagsResponse,
  TemplateResponse,
  TemplatesResponse,
  UpdateManufacturerRequest,
  UpdateSupplierRequest,
  UpdateTagRequest,
  UpdateTemplateRequest,
} from '@/types/stock';

/** Shared paginated query params for list endpoints */
interface PaginatedListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

/** Shared paginated response shape from backend */
export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}

/** Fetch all pages from a paginated endpoint */
async function fetchAllPagesFor<T>(
  endpoint: string,
  dataKey: string
): Promise<T[]> {
  const allItems: T[] = [];
  let page = 1;
  const limit = 100;

  while (true) {
    const response = await apiClient.get<Record<string, unknown>>(
      `${endpoint}?page=${page}&limit=${limit}`
    );

    const items = response[dataKey] as T[] | undefined;
    if (items && items.length > 0) {
      allItems.push(...items);
    }

    const meta = response.meta as
      | { total: number; page: number; limit: number; pages: number }
      | undefined;
    if (!meta || page >= meta.pages) break;
    page++;
  }

  return allItems;
}

/** Build URL with query params, skipping undefined values */
function buildPaginatedUrl(base: string, query?: PaginatedListQuery): string {
  if (!query) return base;
  const params = new URLSearchParams();
  if (query.page) params.append('page', query.page.toString());
  if (query.limit) params.append('limit', query.limit.toString());
  if (query.search) params.append('search', query.search);
  if (query.sortBy) params.append('sortBy', query.sortBy);
  if (query.sortOrder) params.append('sortOrder', query.sortOrder);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

// Manufacturers Service
export const manufacturersService = {
  async listManufacturers(): Promise<ManufacturersResponse> {
    const manufacturers = await fetchAllPagesFor<ManufacturersResponse['manufacturers'][number]>(
      API_ENDPOINTS.MANUFACTURERS.LIST,
      'manufacturers'
    );
    return { manufacturers } as ManufacturersResponse;
  },

  async listPaginated(
    query?: PaginatedListQuery
  ): Promise<PaginatedResponse<ManufacturerResponse['manufacturer']>> {
    const url = buildPaginatedUrl(API_ENDPOINTS.MANUFACTURERS.LIST, query);
    return apiClient.get(url);
  },

  async getManufacturer(id: string): Promise<ManufacturerResponse> {
    return apiClient.get<ManufacturerResponse>(
      API_ENDPOINTS.MANUFACTURERS.GET(id)
    );
  },

  async createManufacturer(
    data: CreateManufacturerRequest
  ): Promise<ManufacturerResponse> {
    return apiClient.post<ManufacturerResponse>(
      API_ENDPOINTS.MANUFACTURERS.CREATE,
      data
    );
  },

  async updateManufacturer(
    id: string,
    data: UpdateManufacturerRequest
  ): Promise<ManufacturerResponse> {
    return apiClient.put<ManufacturerResponse>(
      API_ENDPOINTS.MANUFACTURERS.UPDATE(id),
      data
    );
  },

  async deleteManufacturer(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.MANUFACTURERS.DELETE(id));
  },
};

// Suppliers Service
export const suppliersService = {
  async listSuppliers(): Promise<SuppliersResponse> {
    const suppliers = await fetchAllPagesFor<SuppliersResponse['suppliers'][number]>(
      API_ENDPOINTS.SUPPLIERS.LIST,
      'suppliers'
    );
    return { suppliers } as SuppliersResponse;
  },

  async getSupplier(id: string): Promise<SupplierResponse> {
    return apiClient.get<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.GET(id));
  },

  async createSupplier(data: CreateSupplierRequest): Promise<SupplierResponse> {
    return apiClient.post<SupplierResponse>(
      API_ENDPOINTS.SUPPLIERS.CREATE,
      data
    );
  },

  async updateSupplier(
    id: string,
    data: UpdateSupplierRequest
  ): Promise<SupplierResponse> {
    return apiClient.put<SupplierResponse>(
      API_ENDPOINTS.SUPPLIERS.UPDATE(id),
      data
    );
  },

  async deleteSupplier(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.SUPPLIERS.DELETE(id));
  },
};

// Tags Service
export const tagsService = {
  async listTags(): Promise<TagsResponse> {
    const tags = await fetchAllPagesFor<TagsResponse['tags'][number]>(
      API_ENDPOINTS.TAGS.LIST,
      'tags'
    );
    return { tags } as TagsResponse;
  },

  async listPaginated(
    query?: PaginatedListQuery
  ): Promise<PaginatedResponse<TagResponse['tag']>> {
    const url = buildPaginatedUrl(API_ENDPOINTS.TAGS.LIST, query);
    return apiClient.get(url);
  },

  async getTag(id: string): Promise<TagResponse> {
    return apiClient.get<TagResponse>(API_ENDPOINTS.TAGS.GET(id));
  },

  async createTag(data: CreateTagRequest): Promise<TagResponse> {
    return apiClient.post<TagResponse>(API_ENDPOINTS.TAGS.CREATE, data);
  },

  async updateTag(id: string, data: UpdateTagRequest): Promise<TagResponse> {
    return apiClient.put<TagResponse>(API_ENDPOINTS.TAGS.UPDATE(id), data);
  },

  async deleteTag(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.TAGS.DELETE(id));
  },
};

// Templates Service
export const templatesService = {
  async listTemplates(): Promise<TemplatesResponse> {
    const templates = await fetchAllPagesFor<TemplatesResponse['templates'][number]>(
      API_ENDPOINTS.TEMPLATES.LIST,
      'templates'
    );
    return { templates } as TemplatesResponse;
  },

  async listPaginated(
    query?: PaginatedListQuery
  ): Promise<PaginatedResponse<TemplateResponse['template']>> {
    const url = buildPaginatedUrl(API_ENDPOINTS.TEMPLATES.LIST, query);
    return apiClient.get(url);
  },

  async getTemplate(id: string): Promise<TemplateResponse> {
    return apiClient.get<TemplateResponse>(API_ENDPOINTS.TEMPLATES.GET(id));
  },

  async createTemplate(data: CreateTemplateRequest): Promise<TemplateResponse> {
    return apiClient.post<TemplateResponse>(
      API_ENDPOINTS.TEMPLATES.CREATE,
      data
    );
  },

  async updateTemplate(
    id: string,
    data: UpdateTemplateRequest
  ): Promise<TemplateResponse> {
    logger.debug('Updating template', {
      id,
      dataKeys: Object.keys(data || {}),
    });
    const result = await apiClient.put<TemplateResponse>(
      API_ENDPOINTS.TEMPLATES.UPDATE(id),
      data
    );
    logger.info('Template updated successfully', { id });
    return result;
  },

  async deleteTemplate(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.TEMPLATES.DELETE(id));
  },
};

// Note: Purchase Orders Service is in purchase-orders.service.ts
