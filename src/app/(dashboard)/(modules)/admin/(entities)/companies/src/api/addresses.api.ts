import { companiesService } from '@/services/admin/companies.service';
import type {
  CompanyAddressResponse,
  CompanyAddressesResponse,
} from '@/services/admin/companies.service';
import type {
  CompanyAddress,
  CreateCompanyAddressData,
  UpdateCompanyAddressData,
} from '@/types/hr';

export const companyAddressesApi = {
  async list(
    companyId: string,
    params?: { type?: string; isPrimary?: boolean; includeDeleted?: boolean }
  ): Promise<CompanyAddressesResponse> {
    return companiesService.listAddresses(companyId, params);
  },

  async get(companyId: string, addressId: string): Promise<CompanyAddress> {
    const { address } = await companiesService.getAddress(companyId, addressId);
    return address;
  },

  async create(
    companyId: string,
    data: CreateCompanyAddressData
  ): Promise<CompanyAddress> {
    const { address } = await companiesService.createAddress(companyId, data);
    return address;
  },

  async update(
    companyId: string,
    addressId: string,
    data: UpdateCompanyAddressData
  ): Promise<CompanyAddress> {
    const { address } = await companiesService.updateAddress(
      companyId,
      addressId,
      data
    );
    return address;
  },

  async delete(companyId: string, addressId: string): Promise<void> {
    await companiesService.deleteAddress(companyId, addressId);
  },
};

export type { CompanyAddressResponse, CompanyAddressesResponse };
