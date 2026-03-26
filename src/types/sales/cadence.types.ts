// Cadence Sequence Types

export type CadenceStepType = 'EMAIL' | 'CALL' | 'TASK' | 'LINKEDIN' | 'WHATSAPP' | 'WAIT';

export type CadenceEnrollmentStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'BOUNCED';

export const CADENCE_STEP_TYPE_LABELS: Record<CadenceStepType, string> = {
  EMAIL: 'E-mail',
  CALL: 'Ligação',
  TASK: 'Tarefa',
  LINKEDIN: 'LinkedIn',
  WHATSAPP: 'WhatsApp',
  WAIT: 'Espera',
};

export const CADENCE_ENROLLMENT_STATUS_LABELS: Record<CadenceEnrollmentStatus, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  COMPLETED: 'Concluída',
  BOUNCED: 'Rejeitada',
};

export interface CadenceStep {
  id: string;
  cadenceId: string;
  order: number;
  type: CadenceStepType;
  delayDays: number;
  subject?: string;
  content?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CadenceEnrollment {
  id: string;
  cadenceId: string;
  contactId: string;
  contactName?: string;
  contactEmail?: string;
  currentStepOrder: number;
  status: CadenceEnrollmentStatus;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CadenceSequence {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  totalSteps: number;
  totalEnrollments: number;
  activeEnrollments: number;
  steps?: CadenceStep[];
  enrollments?: CadenceEnrollment[];
  createdAt: string;
  updatedAt: string;
}

export interface CadenceSequenceResponse {
  cadence: CadenceSequence;
}

export interface CadenceSequencesResponse {
  cadences: CadenceSequence[];
}

export interface PaginatedCadenceSequencesResponse {
  cadences: CadenceSequence[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CadencesQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCadenceStepInput {
  type: CadenceStepType;
  delayDays: number;
  subject?: string;
  content?: string;
  notes?: string;
}

export interface CreateCadenceRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  steps?: CreateCadenceStepInput[];
}

export interface UpdateCadenceRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  steps?: CreateCadenceStepInput[];
}
