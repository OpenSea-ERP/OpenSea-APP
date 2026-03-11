/**
 * OpenSea OS - Create Company Mutation
 *
 * Hook para criar uma nova empresa com suporte a feedback visual
 * e invalidação automática de cache.
 *
 * @example
 * ```tsx
 * const { mutate: createCompany, isPending } = useCreateCompany({
 *   onSuccess: (company) => {
 *     router.push(`/hr/companies/${company.id}`);
 *   },
 * });
 *
 * // Uso
 * createCompany({
 *   legalName: 'Acme Corporation',
 *   cnpj: '12345678000100',
 *   status: 'ACTIVE',
 * });
 * ```
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

/**
 * Opções customizadas para a mutation
 */
export interface CreateCompanyOptions {
  /** Callback executado após sucesso */
  onSuccess?: (company: Company) => void;
  /** Callback executado após erro */
  onError?: (error: Error) => void;
  /** Se deve mostrar toast de sucesso (default: true) */
  showSuccessToast?: boolean;
  /** Se deve mostrar toast de erro (default: true) */
  showErrorToast?: boolean;
  /** Mensagem customizada de sucesso */
  successMessage?: string | ((company: Company) => string);
  /** Mensagem customizada de erro */
  errorMessage?: string;
}

/**
 * Tipo da mutation
 */
export type CreateCompanyMutation = ReturnType<typeof useCreateCompany>;

/* ===========================================
   MUTATION HOOK
   =========================================== */

/**
 * Hook para criar uma nova empresa
 *
 * Características:
 * - Invalidação automática do cache de listagens
 * - Toast de sucesso/erro configurável
 * - Callbacks customizáveis
 *
 * @param options - Opções da mutation
 * @returns Mutation result com mutate, isPending, etc.
 */
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
      // Invalida cache de listagens para mostrar a nova empresa
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });

      // Toast de sucesso
      if (showSuccessToast) {
        const message =
          typeof successMessage === 'function'
            ? successMessage(company)
            : (successMessage ??
              `Empresa "${company.legalName}" criada com sucesso!`);

        toast.success(message);
      }

      // Callback customizado
      onSuccess?.(company);
    },

    onError: (error: Error) => {
      // Toast de erro
      if (showErrorToast) {
        const message = errorMessage ?? translateError(error);
        toast.error(message);
      }

      // Callback customizado
      onError?.(error);
    },
  });
}

export default useCreateCompany;
