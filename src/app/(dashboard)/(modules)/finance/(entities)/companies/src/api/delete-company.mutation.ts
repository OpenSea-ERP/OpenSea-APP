/**
 * OpenSea OS - Delete Company Mutation (Finance)
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

export type DeleteCompanyVariables = string | string[];

export interface DeleteCompanyResult {
  deleted: string[];
  failed: string[];
}

export interface DeleteCompanyOptions {
  onSuccess?: (result: DeleteCompanyResult) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  softDelete?: boolean;
}

/* ===========================================
   MUTATION HOOK
   =========================================== */

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
      const idsArray = Array.isArray(ids) ? ids : [ids];

      const deleted: string[] = [];
      const failed: string[] = [];

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

      if (deleted.length === 0 && failed.length > 0) {
        throw new Error(
          `Falha ao excluir ${failed.length > 1 ? 'as empresas' : 'a empresa'}`
        );
      }

      return { deleted, failed };
    },

    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });

      result.deleted.forEach(id => {
        queryClient.removeQueries({ queryKey: companyKeys.detail(id) });
      });

      if (showSuccessToast) {
        const count = result.deleted.length;

        if (result.failed.length > 0) {
          toast.warning(
            `${count} empresa${count > 1 ? 's excluída' : ' excluída'}s. ` +
              `${result.failed.length} falha${result.failed.length > 1 ? 's' : ''}.`
          );
        } else {
          toast.success(
            count === 1
              ? 'Empresa excluída com sucesso!'
              : `${count} empresas excluídas com sucesso!`
          );
        }
      }

      onSuccess?.(result);
    },

    onError: (error: Error) => {
      if (showErrorToast) {
        toast.error(translateError(error));
      }

      onError?.(error);
    },
  });
}

export default useDeleteCompany;
