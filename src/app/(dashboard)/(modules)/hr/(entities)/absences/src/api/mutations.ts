/**
 * OpenSea OS - Absences Mutations (HR)
 *
 * Hooks de mutação para operações de ausências.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Absence, RequestSickLeaveData } from '@/types/hr';
import type { UpdateAbsenceRequest } from '@/services/hr/absences.service';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { absencesApi } from './absences.api';
import { absenceKeys } from './keys';

/* ===========================================
   REQUEST SICK LEAVE
   =========================================== */

export function useRequestSickLeave(options?: {
  onSuccess?: (absence: Absence) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RequestSickLeaveData): Promise<Absence> => {
      const response = await absencesApi.requestSickLeave(data);
      return response.absence;
    },

    onSuccess: absence => {
      queryClient.invalidateQueries({ queryKey: absenceKeys.all });
      toast.success('Atestado registrado com sucesso!');
      options?.onSuccess?.(absence);
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}

/* ===========================================
   APPROVE ABSENCE
   =========================================== */

export function useApproveAbsence(options?: {
  onSuccess?: (absence: Absence) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Absence> => {
      const response = await absencesApi.approve(id);
      return response.absence;
    },

    onSuccess: absence => {
      queryClient.invalidateQueries({ queryKey: absenceKeys.all });
      queryClient.invalidateQueries({
        queryKey: absenceKeys.detail(absence.id),
      });
      toast.success('Ausência aprovada com sucesso!');
      options?.onSuccess?.(absence);
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}

/* ===========================================
   REJECT ABSENCE
   =========================================== */

export function useRejectAbsence(options?: {
  onSuccess?: (absence: Absence) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason: string;
    }): Promise<Absence> => {
      const response = await absencesApi.reject(id, { reason });
      return response.absence;
    },

    onSuccess: absence => {
      queryClient.invalidateQueries({ queryKey: absenceKeys.all });
      queryClient.invalidateQueries({
        queryKey: absenceKeys.detail(absence.id),
      });
      toast.success('Ausência rejeitada.');
      options?.onSuccess?.(absence);
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}

/* ===========================================
   CANCEL ABSENCE
   =========================================== */

export function useCancelAbsence(options?: {
  onSuccess?: (absence: Absence) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Absence> => {
      const response = await absencesApi.cancel(id);
      return response.absence;
    },

    onSuccess: absence => {
      queryClient.invalidateQueries({ queryKey: absenceKeys.all });
      queryClient.invalidateQueries({
        queryKey: absenceKeys.detail(absence.id),
      });
      toast.success('Ausência cancelada.');
      options?.onSuccess?.(absence);
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}

/* ===========================================
   UPDATE ABSENCE
   =========================================== */

export function useUpdateAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAbsenceRequest;
    }): Promise<Absence> => {
      const response = await absencesApi.update(id, data);
      return response.absence;
    },

    onSuccess: (absence) => {
      queryClient.invalidateQueries({ queryKey: absenceKeys.all });
      queryClient.invalidateQueries({
        queryKey: absenceKeys.detail(absence.id),
      });
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
    },
  });
}

/* ===========================================
   DELETE ABSENCE
   =========================================== */

export function useDeleteAbsence(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await absencesApi.delete(id);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: absenceKeys.all });
      toast.success('Ausência excluída com sucesso!');
      options?.onSuccess?.();
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}
