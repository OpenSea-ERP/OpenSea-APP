/**
 * OpenSea OS - Delete Company Mutation
 *
 * Hook para excluir uma ou mais empresas com suporte a confirmação,
 * feedback visual e invalidação automática de cache.
 *
 * @example
 * ```tsx
 * const { mutate: deleteCompany, isPending } = useDeleteCompany({
 *   onSuccess: () => {
 *     toast.success('Empresa excluída');
 *   },
 * });
 *
 * // Excluir uma empresa
 * deleteCompany('company-id');
 *
 * // Excluir múltiplas
 * deleteCompany(['id-1', 'id-2', 'id-3']);
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesService } from '@/services/admin/companies.service';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { companyKeys } from './keys';

/* ===========================================
   TYPES
   =========================================== */

/**
 * Variáveis da mutation - pode ser um ID ou array de IDs
 */
export type DeleteCompanyVariables = string | string[];

/**
 * Resultado da deleção
 */
export interface DeleteCompanyResult {
  /** IDs das empresas excluídas com sucesso */
  deleted: string[];
  /** IDs das empresas que falharam */
  failed: string[];
}

/**
 * Opções customizadas para a mutation
 */
export interface DeleteCompanyOptions {
  /** Callback executado após sucesso */
  onSuccess?: (result: DeleteCompanyResult) => void;
  /** Callback executado após erro */
  onError?: (error: Error) => void;
  /** Se deve mostrar toast de sucesso (default: true) */
  showSuccessToast?: boolean;
  /** Se deve mostrar toast de erro (default: true) */
  showErrorToast?: boolean;
  /** Se é soft delete (default: true para esta API) */
  softDelete?: boolean;
}

/* ===========================================
   MUTATION HOOK
   =========================================== */

/**
 * Hook para excluir empresas
 *
 * Características:
 * - Suporte a exclusão única ou em lote
 * - Invalidação automática do cache
 * - Toast de sucesso/erro configurável
 * - Callbacks customizáveis
 *
 * @param options - Opções da mutation
 * @returns Mutation result com mutate, isPending, etc.
 */
export function useDeleteCompany(options: DeleteCompanyOptions = {}) {
  const queryClient = useQueryClient();

  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (
      ids: DeleteCompanyVariables
    ): Promise<DeleteCompanyResult> => {
      // Normaliza para array
      const idsArray = Array.isArray(ids) ? ids : [ids];

      const deleted: string[] = [];
      const failed: string[] = [];

      // Processa cada deleção
      // A API atual não suporta batch delete, então fazemos um por um
      for (const id of idsArray) {
        try {
          await companiesService.deleteCompany(id);
          deleted.push(id);
        } catch (error) {
          logger.error(
            `[DeleteCompany] Falha ao excluir ${id}`,
            error instanceof Error ? error : undefined
          );
          failed.push(id);
        }
      }

      // Se todas falharam, lança erro
      if (deleted.length === 0 && failed.length > 0) {
        throw new Error(
          `Falha ao excluir ${failed.length > 1 ? 'as empresas' : 'a empresa'}`
        );
      }

      return { deleted, failed };
    },

    onSuccess: result => {
      // Invalida cache de listagens
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });

      // Invalida cache dos detalhes das empresas excluídas
      result.deleted.forEach(id => {
        queryClient.removeQueries({ queryKey: companyKeys.detail(id) });
      });

      // Toast de sucesso
      if (showSuccessToast) {
        const count = result.deleted.length;

        if (result.failed.length > 0) {
          // Sucesso parcial
          toast.warning(
            `${count} empresa${count > 1 ? 's excluída' : ' excluída'}s. ` +
              `${result.failed.length} falha${result.failed.length > 1 ? 's' : ''}.`
          );
        } else {
          // Sucesso total
          toast.success(
            count === 1
              ? 'Empresa excluída com sucesso!'
              : `${count} empresas excluídas com sucesso!`
          );
        }
      }

      // Callback customizado
      onSuccess?.(result);
    },

    onError: (error: Error) => {
      // Toast de erro
      if (showErrorToast) {
        toast.error(translateError(error));
      }

      // Callback customizado
      onError?.(error);
    },
  });
}

export default useDeleteCompany;
