/**
 * OpenSea OS - Update Company Mutation (Finance)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesService } from '@/services/admin/companies.service';
import type { Company, UpdateCompanyData } from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { companyKeys } from './keys';

/* ===========================================
   TYPES
   =========================================== */

export interface UpdateCompanyVariables {
  id: string;
  data: UpdateCompanyData;
}

export interface UpdateCompanyOptions {
  onSuccess?: (company: Company) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string | ((company: Company) => string);
  errorMessage?: string;
}

/* ===========================================
   MUTATION HOOK
   =========================================== */

export function useUpdateCompany(options: UpdateCompanyOptions = {}) {
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
    mutationFn: async ({
      id,
      data,
    }: UpdateCompanyVariables): Promise<Company> => {
      const response = await companiesService.updateCompany(id, data);
      return response.company;
    },

    onSuccess: (company, { id }) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(id) });

      if (showSuccessToast) {
        const message =
          typeof successMessage === 'function'
            ? successMessage(company)
            : (successMessage ??
              `Empresa "${company.legalName}" atualizada com sucesso!`);

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

export default useUpdateCompany;
