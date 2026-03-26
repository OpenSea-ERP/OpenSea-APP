/**
 * OpenSea OS - Safety Program Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { safetyProgramsService } from '@/services/hr/safety-programs.service';
import type {
  SafetyProgram,
  CreateSafetyProgramData,
  UpdateSafetyProgramData,
  WorkplaceRisk,
  CreateWorkplaceRiskData,
  UpdateWorkplaceRiskData,
} from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { safetyProgramKeys } from './keys';

/* ===========================================
   CREATE PROGRAM
   =========================================== */

export interface CreateSafetyProgramOptions {
  onSuccess?: (program: SafetyProgram) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreateSafetyProgram(options: CreateSafetyProgramOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreateSafetyProgramData): Promise<SafetyProgram> => {
      const response = await safetyProgramsService.create(data);
      return response.safetyProgram;
    },
    onSuccess: program => {
      queryClient.invalidateQueries({ queryKey: safetyProgramKeys.lists() });
      if (showSuccessToast) {
        toast.success('Programa de segurança criado com sucesso!');
      }
      onSuccess?.(program);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   UPDATE PROGRAM
   =========================================== */

export interface UpdateSafetyProgramOptions {
  onSuccess?: (program: SafetyProgram) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useUpdateSafetyProgram(options: UpdateSafetyProgramOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSafetyProgramData;
    }): Promise<SafetyProgram> => {
      const response = await safetyProgramsService.update(id, data);
      return response.safetyProgram;
    },
    onSuccess: (program, { id }) => {
      queryClient.invalidateQueries({ queryKey: safetyProgramKeys.lists() });
      queryClient.invalidateQueries({ queryKey: safetyProgramKeys.detail(id) });
      if (showSuccessToast) {
        toast.success('Programa de segurança atualizado com sucesso!');
      }
      onSuccess?.(program);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   DELETE PROGRAM
   =========================================== */

export interface DeleteSafetyProgramOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useDeleteSafetyProgram(options: DeleteSafetyProgramOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await safetyProgramsService.delete(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: safetyProgramKeys.lists() });
      queryClient.removeQueries({ queryKey: safetyProgramKeys.detail(id) });
      if (showSuccessToast) {
        toast.success('Programa de segurança excluído com sucesso!');
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
   CREATE RISK
   =========================================== */

export interface CreateRiskOptions {
  onSuccess?: (risk: WorkplaceRisk) => void;
  onError?: (error: Error) => void;
}

export function useCreateWorkplaceRisk(programId: string, options: CreateRiskOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async (data: CreateWorkplaceRiskData): Promise<WorkplaceRisk> => {
      const response = await safetyProgramsService.createRisk(programId, data);
      return response.risk;
    },
    onSuccess: risk => {
      queryClient.invalidateQueries({ queryKey: safetyProgramKeys.risks(programId) });
      toast.success('Risco adicionado com sucesso!');
      onSuccess?.(risk);
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   UPDATE RISK
   =========================================== */

export interface UpdateRiskOptions {
  onSuccess?: (risk: WorkplaceRisk) => void;
  onError?: (error: Error) => void;
}

export function useUpdateWorkplaceRisk(programId: string, options: UpdateRiskOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async ({
      riskId,
      data,
    }: {
      riskId: string;
      data: UpdateWorkplaceRiskData;
    }): Promise<WorkplaceRisk> => {
      const response = await safetyProgramsService.updateRisk(programId, riskId, data);
      return response.risk;
    },
    onSuccess: risk => {
      queryClient.invalidateQueries({ queryKey: safetyProgramKeys.risks(programId) });
      toast.success('Risco atualizado com sucesso!');
      onSuccess?.(risk);
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   DELETE RISK
   =========================================== */

export interface DeleteRiskOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDeleteWorkplaceRisk(programId: string, options: DeleteRiskOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async (riskId: string): Promise<void> => {
      await safetyProgramsService.deleteRisk(programId, riskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: safetyProgramKeys.risks(programId) });
      toast.success('Risco excluído com sucesso!');
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      onError?.(error);
    },
  });
}
