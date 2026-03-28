// ============================================================================
// TRAINING PROGRAM
// ============================================================================

export type TrainingCategory =
  | 'ONBOARDING'
  | 'SAFETY'
  | 'TECHNICAL'
  | 'COMPLIANCE'
  | 'LEADERSHIP'
  | 'SOFT_SKILLS';

export type TrainingFormat = 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO';

export type TrainingEnrollmentStatus =
  | 'ENROLLED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export interface TrainingProgram {
  id: string;
  name: string;
  description: string | null;
  category: TrainingCategory;
  format: TrainingFormat;
  durationHours: number;
  instructor: string | null;
  maxParticipants: number | null;
  isActive: boolean;
  isMandatory: boolean;
  validityMonths: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    enrollments: number;
  };
}

export interface CreateTrainingProgramData {
  name: string;
  description?: string;
  category: TrainingCategory;
  format: TrainingFormat;
  durationHours: number;
  instructor?: string;
  maxParticipants?: number;
  isMandatory?: boolean;
  validityMonths?: number;
}

export interface UpdateTrainingProgramData {
  name?: string;
  description?: string;
  category?: TrainingCategory;
  format?: TrainingFormat;
  durationHours?: number;
  instructor?: string;
  maxParticipants?: number;
  isActive?: boolean;
  isMandatory?: boolean;
  validityMonths?: number;
}

// ============================================================================
// TRAINING ENROLLMENT
// ============================================================================

export interface TrainingEnrollment {
  id: string;
  trainingProgramId: string;
  employeeId: string;
  status: TrainingEnrollmentStatus;
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  score: number | null;
  certificateUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollInTrainingData {
  trainingProgramId: string;
  employeeId: string;
  notes?: string;
}

export interface CompleteTrainingData {
  score?: number;
  certificateUrl?: string;
}
