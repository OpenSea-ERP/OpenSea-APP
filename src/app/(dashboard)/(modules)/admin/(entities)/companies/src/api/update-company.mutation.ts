/**
 * OpenSea OS - Update Company Mutation
 *
 * Hook para atualizar uma empresa existente com suporte a feedback visual
 * e invalidação automática de cache.
 *
 * @example
 * ```tsx
 * const { mutate: updateCompany, isPending } = useUpdateCompany({
 *   onSuccess: () => {
 *     router.push('/admin/companies');
 *   },
 * });
 *
 * // Uso
 * updateCompany({
 *   id: 'company-id',
 *   data: { tradeName: 'Novo Nome Fantasia' },
 * });
 * ```
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

/**
 * Variáveis da mutation
 */
export interface UpdateCompanyVariables {
  /** ID da empresa a ser atualizada */
  id: string;
  /** Dados para atualização */
  data: UpdateCompanyData;
}

/**
 * Opções customizadas para a mutation
 */
export interface UpdateCompanyOptions {
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

/* ===========================================
   MUTATION HOOK
   =========================================== */

/**
 * Hook para atualizar uma empresa
 *
 * Características:
 * - Invalidação automática do cache (listagem e detalhes)
 * - Toast de sucesso/erro configurável
 * - Callbacks customizáveis
 *
 * @param options - Opções da mutation
 * @returns Mutation result com mutate, isPending, etc.
 */
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
      // Invalida cache de listagens
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });

      // Invalida cache do detalhe específico
      queryClient.invalidateQueries({ queryKey: companyKeys.detail(id) });

      // Toast de sucesso
      if (showSuccessToast) {
        const message =
          typeof successMessage === 'function'
            ? successMessage(company)
            : (successMessage ??
              `Empresa "${company.legalName}" atualizada com sucesso!`);

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

export default useUpdateCompany;
