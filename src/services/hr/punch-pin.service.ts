/**
 * OpenSea OS - Punch PIN Service
 *
 * Client for the Employee.punchPin* endpoints (Phase 05 plan 05-05).
 * The verify-PIN endpoint is intentionally NOT exposed — it lives behind
 * the kiosk clock flow (plan 05-07) which requires PIN + face match (D-10).
 */

import { apiClient } from '@/lib/api-client';
import type {
  SetPunchPinInput,
  SetPunchPinResponse,
  UnlockPunchPinResponse,
} from '@/types/hr';

export const punchPinService = {
  /**
   * POST /v1/hr/employees/:id/punch-pin
   * Requires permission `hr.punch-devices.admin` + action PIN gate on client.
   * Body: { pin: string(6 digits, non-sequential) }.
   * Backend bcrypts + rejects weak PINs (WeakPinError → HTTP 400).
   */
  async setPin(input: SetPunchPinInput): Promise<SetPunchPinResponse> {
    return apiClient.post<SetPunchPinResponse>(
      `/v1/hr/employees/${input.employeeId}/punch-pin`,
      { pin: input.pin }
    );
  },

  /**
   * POST /v1/hr/employees/:id/unlock-punch-pin
   * Requires permission `hr.punch-devices.admin` + action PIN gate on client.
   * Idempotent: clears punchPinLockedUntil + failedAttempts.
   */
  async unlockPin(employeeId: string): Promise<UnlockPunchPinResponse> {
    return apiClient.post<UnlockPunchPinResponse>(
      `/v1/hr/employees/${employeeId}/unlock-punch-pin`,
      {}
    );
  },
};

export const setPunchPin = punchPinService.setPin;
export const unlockPunchPin = punchPinService.unlockPin;
