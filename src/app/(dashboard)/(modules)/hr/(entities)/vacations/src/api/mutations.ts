/**
 * OpenSea OS - Vacations Mutations (HR)
 *
 * Hooks de mutação para operações de férias.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  VacationPeriod,
  CreateVacationPeriodData,
  ScheduleVacationData,
  CompleteVacationData,
  SellVacationDaysData,
} from '@/types/hr';
import type { UpdateVacationPeriodRequest } from '@/services/hr/vacations.service';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { vacationsApi } from './vacations.api';
import { vacationKeys } from './keys';

/* ===========================================
   CREATE VACATION PERIOD
   =========================================== */

export function useCreateVacation(options?: {
  onSuccess?: (vacation: VacationPeriod) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateVacationPeriodData
    ): Promise<VacationPeriod> => {
      const response = await vacationsApi.create(data);
      return response.vacationPeriod;
    },

    onSuccess: vacation => {
      queryClient.invalidateQueries({ queryKey: vacationKeys.lists() });
      toast.success('Período de férias criado!');
      options?.onSuccess?.(vacation);
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}

/* ===========================================
   SCHEDULE VACATION
   =========================================== */

export function useScheduleVacation(options?: {
  onSuccess?: (vacation: VacationPeriod) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ScheduleVacationData;
    }): Promise<VacationPeriod> => {
      const response = await vacationsApi.schedule(id, data);
      return response.vacationPeriod;
    },

    onSuccess: vacation => {
      queryClient.invalidateQueries({ queryKey: vacationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: vacationKeys.detail(vacation.id),
      });
      toast.success('Férias agendadas!');
      options?.onSuccess?.(vacation);
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}

/* ===========================================
   START VACATION
   =========================================== */

export function useStartVacation(options?: {
  onSuccess?: (vacation: VacationPeriod) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<VacationPeriod> => {
      const response = await vacationsApi.start(id);
      return response.vacationPeriod;
    },

    onSuccess: vacation => {
      queryClient.invalidateQueries({ queryKey: vacationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: vacationKeys.detail(vacation.id),
      });
      toast.success('Férias iniciadas!');
      options?.onSuccess?.(vacation);
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}

/* ===========================================
   COMPLETE VACATION
   =========================================== */

export function useCompleteVacation(options?: {
  onSuccess?: (vacation: VacationPeriod) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: CompleteVacationData;
    }): Promise<VacationPeriod> => {
      const response = await vacationsApi.complete(id, data);
      return response.vacationPeriod;
    },

    onSuccess: vacation => {
      queryClient.invalidateQueries({ queryKey: vacationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: vacationKeys.detail(vacation.id),
      });
      toast.success('Férias concluídas!');
      options?.onSuccess?.(vacation);
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}

/* ===========================================
   SELL VACATION DAYS
   =========================================== */

export function useSellVacationDays(options?: {
  onSuccess?: (vacation: VacationPeriod) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: SellVacationDaysData;
    }): Promise<VacationPeriod> => {
      const response = await vacationsApi.sellDays(id, data);
      return response.vacationPeriod;
    },

    onSuccess: vacation => {
      queryClient.invalidateQueries({ queryKey: vacationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: vacationKeys.detail(vacation.id),
      });
      toast.success('Dias vendidos!');
      options?.onSuccess?.(vacation);
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}

/* ===========================================
   CANCEL VACATION SCHEDULE
   =========================================== */

export function useCancelVacationSchedule(options?: {
  onSuccess?: (vacation: VacationPeriod) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<VacationPeriod> => {
      const response = await vacationsApi.cancelSchedule(id);
      return response.vacationPeriod;
    },

    onSuccess: vacation => {
      queryClient.invalidateQueries({ queryKey: vacationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: vacationKeys.detail(vacation.id),
      });
      toast.success('Agendamento cancelado!');
      options?.onSuccess?.(vacation);
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}
