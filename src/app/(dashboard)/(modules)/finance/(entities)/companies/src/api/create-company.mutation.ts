/**
 * OpenSea OS - Create Company Mutation (Finance)
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { companiesService } from '@/services/admin/companies.service';
import type { Company, CreateCompanyData } from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { companyKeys } from './keys';

/* ===========================================
   TYPES
   =========================================== */

export interface CreateCompanyOptions {
  onSuccess?: (company: Company) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string | ((company: Company) => string);
  errorMessage?: string;
}

export type CreateCompanyMutation = ReturnType<typeof useCreateCompany>;

/* ===========================================
   MUTATION HOOK
   =========================================== */

export function useCreateCompany(options: CreateCompanyOptions = {}) {
  const queryClient = useQueryClient();

  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage,
    errorMessage,
  } = options;

  return useMutation({
    mutationFn: async (data: CreateCompanyData): Promise<Company> => {
      const response = await companiesService.createCompany(data);
      return response.company;
    },

    onSuccess: company => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });

      if (showSuccessToast) {
        const message =
          typeof successMessage === 'function'
            ? successMessage(company)
            : (successMessage ??
              `Empresa "${company.legalName}" criada com sucesso!`);

        toast.success(message);
      }

      onSuccess?.(company);
    },

    onError: (error: Error) => {
      if (showErrorToast) {
        const message = errorMessage ?? translateError(error);
        toast.error(message);
      }

      onError?.(error);
    },
  });
}

export default useCreateCompany;
