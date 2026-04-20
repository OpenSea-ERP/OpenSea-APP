'use client';

/**
 * OpenSea OS - Punch PIN Hooks
 *
 * TanStack Query wrappers over punch-pin.service.ts.
 * Toast copy matches UI-SPEC §Copywriting §Set-PIN / Unlock-PIN.
 *
 * Backend-emitted error messages (e.g. WeakPinError) flow through to
 * the mutation's onError — the calling component is responsible for
 * rendering the inline validation from `error.message`.
 */

import { punchPinService } from '@/services/hr/punch-pin.service';
import type {
  SetPunchPinInput,
  SetPunchPinResponse,
  UnlockPunchPinResponse,
} from '@/types/hr';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Set or change the employee's punch PIN. Requires `hr.punch-devices.admin`
 * plus the VerifyActionPinModal gate on the caller (CLAUDE.md §7).
 */
export function useSetPunchPin(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation<SetPunchPinResponse, Error, Pick<SetPunchPinInput, 'pin'>>(
    {
      mutationFn: ({ pin }) => punchPinService.setPin({ employeeId, pin }),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['employees', employeeId],
        });
        toast.success('PIN de ponto definido com sucesso');
      },
      onError: err => {
        // Backend sends a human-friendly message for weak PINs. Surface it
        // so the form can also render it inline (not only a toast).
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Não foi possível definir o PIN. Tente novamente.';
        toast.error(message);
      },
    }
  );
}

/**
 * Force-unlock a locked PIN. Rare, destructive-adjacent action that
 * bypasses the 15-minute cool-down (D-11). Requires the same gates as set.
 */
export function useUnlockPunchPin(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation<UnlockPunchPinResponse, Error, void>({
    mutationFn: () => punchPinService.unlockPin(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId] });
      toast.success('PIN desbloqueado. Funcionário pode bater ponto.');
    },
    onError: () => {
      toast.error('Não foi possível desbloquear o PIN. Tente novamente.');
    },
  });
}
