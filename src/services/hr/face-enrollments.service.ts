/**
 * OpenSea OS - Face Enrollments Service
 *
 * Client for the EmployeeFaceEnrollment endpoints (Phase 05 plan 05-03).
 * Embeddings are computed client-side (see src/lib/face-api/compute-descriptor.ts)
 * and posted as number[128] arrays; the server encrypts with AES-256-GCM (D-02).
 */

import { apiClient } from '@/lib/api-client';
import type {
  CreateFaceEnrollmentsInput,
  CreateFaceEnrollmentsResponse,
  ListFaceEnrollmentsResponse,
  RemoveFaceEnrollmentsResponse,
} from '@/types/hr';

export const faceEnrollmentsService = {
  /**
   * POST /v1/hr/employees/:id/face-enrollments
   * Requires permission `hr.face-enrollment.register`.
   * Request body: { embeddings: number[128][], consentTextHash: string }.
   * On success, any previously-active enrollments for the employee are
   * soft-deleted; response includes `replacedCount`.
   */
  async create(
    input: CreateFaceEnrollmentsInput
  ): Promise<CreateFaceEnrollmentsResponse> {
    return apiClient.post<CreateFaceEnrollmentsResponse>(
      `/v1/hr/employees/${input.employeeId}/face-enrollments`,
      {
        embeddings: input.embeddings,
        consentTextHash: input.consentTextHash,
      }
    );
  },

  /**
   * GET /v1/hr/employees/:id/face-enrollments
   * Requires permission `hr.face-enrollment.access`.
   * Returns ONLY metadata (id, photoCount, capturedAt, capturedByUserId).
   * The embedding ciphertext never leaves the server.
   */
  async list(employeeId: string): Promise<ListFaceEnrollmentsResponse> {
    return apiClient.get<ListFaceEnrollmentsResponse>(
      `/v1/hr/employees/${employeeId}/face-enrollments`
    );
  },

  /**
   * DELETE /v1/hr/employees/:id/face-enrollments
   * Requires permission `hr.face-enrollment.remove`.
   * Soft-deletes ALL active enrollments for the employee (batch op).
   */
  async remove(employeeId: string): Promise<RemoveFaceEnrollmentsResponse> {
    return apiClient.delete<RemoveFaceEnrollmentsResponse>(
      `/v1/hr/employees/${employeeId}/face-enrollments`
    );
  },
};

// Named function exports as the plan's <artifacts> contract calls for.
export const createFaceEnrollments = faceEnrollmentsService.create;
export const listFaceEnrollments = faceEnrollmentsService.list;
export const removeFaceEnrollments = faceEnrollmentsService.remove;
