/**
 * OpenSea OS - Work Schedule Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workSchedulesService } from '@/services/hr/work-schedules.service';
import type {
  WorkSchedule,
  CreateWorkScheduleData,
  UpdateWorkScheduleData,
} from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { workScheduleKeys } from './keys';

/* ===========================================
   CREATE
   =========================================== */

export interface CreateWorkScheduleOptions {
  onSuccess?: (workSchedule: WorkSchedule) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreateWorkSchedule(options: CreateWorkScheduleOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreateWorkScheduleData): Promise<WorkSchedule> => {
      const response = await workSchedulesService.createWorkSchedule(data);
      return response.workSchedule;
    },
    onSuccess: workSchedule => {
      queryClient.invalidateQueries({ queryKey: workScheduleKeys.all });
      if (showSuccessToast) {
        toast.success(`Escala "${workSchedule.name}" criada com sucesso!`);
      }
      onSuccess?.(workSchedule);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   UPDATE
   =========================================== */

export interface UpdateWorkScheduleVariables {
  id: string;
  data: UpdateWorkScheduleData;
}

export interface UpdateWorkScheduleOptions {
  onSuccess?: (workSchedule: WorkSchedule) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useUpdateWorkSchedule(options: UpdateWorkScheduleOptions = {}) {
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
    }: UpdateWorkScheduleVariables): Promise<WorkSchedule> => {
      const response = await workSchedulesService.updateWorkSchedule(id, data);
      return response.workSchedule;
    },
    onSuccess: (workSchedule, { id }) => {
      queryClient.invalidateQueries({ queryKey: workScheduleKeys.all });
      queryClient.invalidateQueries({
        queryKey: workScheduleKeys.detail(id),
      });
      if (showSuccessToast) {
        toast.success(`Escala "${workSchedule.name}" atualizada!`);
      }
      onSuccess?.(workSchedule);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   DELETE
   =========================================== */

export interface DeleteWorkScheduleOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useDeleteWorkSchedule(options: DeleteWorkScheduleOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await workSchedulesService.deleteWorkSchedule(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: workScheduleKeys.all });
      queryClient.removeQueries({ queryKey: workScheduleKeys.detail(id) });
      if (showSuccessToast) {
        toast.success('Escala excluída com sucesso!');
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}
