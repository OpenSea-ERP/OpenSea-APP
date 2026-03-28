/**
 * OpenSea OS - Workplace Risk Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workplaceRisksService } from '@/services/hr/workplace-risks.service';
import type {
  WorkplaceRisk,
  CreateWorkplaceRiskData,
  UpdateWorkplaceRiskData,
} from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/error-messages';
import { workplaceRiskKeys } from './keys';

/* ===========================================
   CREATE RISK
   =========================================== */

export interface CreateWorkplaceRiskOptions {
  onSuccess?: (risk: WorkplaceRisk) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreateWorkplaceRisk(
  programId: string,
  options: CreateWorkplaceRiskOptions = {}
) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreateWorkplaceRiskData): Promise<WorkplaceRisk> => {
      const response = await workplaceRisksService.create(programId, data);
      return response.workplaceRisk;
    },
    onSuccess: risk => {
      queryClient.invalidateQueries({ queryKey: workplaceRiskKeys.all });
      if (showSuccessToast) {
        toast.success('Risco ocupacional criado com sucesso!');
      }
      onSuccess?.(risk);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   UPDATE RISK
   =========================================== */

export interface UpdateWorkplaceRiskOptions {
  onSuccess?: (risk: WorkplaceRisk) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useUpdateWorkplaceRisk(
  programId: string,
  options: UpdateWorkplaceRiskOptions = {}
) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async ({
      riskId,
      data,
    }: {
      riskId: string;
      data: UpdateWorkplaceRiskData;
    }): Promise<WorkplaceRisk> => {
      const response = await workplaceRisksService.update(
        programId,
        riskId,
        data
      );
      return response.workplaceRisk;
    },
    onSuccess: risk => {
      queryClient.invalidateQueries({ queryKey: workplaceRiskKeys.all });
      if (showSuccessToast) {
        toast.success('Risco ocupacional atualizado com sucesso!');
      }
      onSuccess?.(risk);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   DELETE RISK
   =========================================== */

export interface DeleteWorkplaceRiskOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useDeleteWorkplaceRisk(
  programId: string,
  options: DeleteWorkplaceRiskOptions = {}
) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (riskId: string): Promise<void> => {
      await workplaceRisksService.delete(programId, riskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workplaceRiskKeys.all });
      if (showSuccessToast) {
        toast.success('Risco ocupacional excluído com sucesso!');
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   DELETE RISK (dynamic programId)
   =========================================== */

export function useDeleteWorkplaceRiskDynamic(
  options: DeleteWorkplaceRiskOptions = {}
) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async ({
      programId,
      riskId,
    }: {
      programId: string;
      riskId: string;
    }): Promise<void> => {
      await workplaceRisksService.delete(programId, riskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workplaceRiskKeys.all });
      if (showSuccessToast) {
        toast.success('Risco ocupacional excluído com sucesso!');
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}
