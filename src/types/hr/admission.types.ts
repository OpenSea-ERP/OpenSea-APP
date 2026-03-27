/**
 * Admission Types
 * Tipos para admissão digital de funcionários
 */

export type AdmissionStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

export type AdmissionDocumentType =
  | 'RG'
  | 'CPF'
  | 'CTPS'
  | 'PROOF_ADDRESS'
  | 'PHOTO'
  | 'BIRTH_CERT'
  | 'MARRIAGE_CERT'
  | 'OTHER';

export type AdmissionDocumentStatus =
  | 'PENDING'
  | 'UPLOADED'
  | 'VALIDATED'
  | 'REJECTED';

export type DigitalSignatureType =
  | 'ADMISSION_CONTRACT'
  | 'DOCUMENT_ACKNOWLEDGMENT'
  | 'POLICY_ACCEPTANCE';

export type ContractType =
  | 'CLT'
  | 'PJ'
  | 'TEMPORARY'
  | 'INTERN'
  | 'APPRENTICE';

export type WorkRegime =
  | 'PRESENTIAL'
  | 'REMOTE'
  | 'HYBRID';

export type MaritalStatus =
  | 'SINGLE'
  | 'MARRIED'
  | 'DIVORCED'
  | 'WIDOWED'
  | 'SEPARATED'
  | 'STABLE_UNION';

export type BankAccountType =
  | 'CHECKING'
  | 'SAVINGS';

export type DependantRelationship =
  | 'SPOUSE'
  | 'CHILD'
  | 'STEPCHILD'
  | 'PARENT'
  | 'OTHER';

export interface AdmissionInvite {
  id: string;
  tenantId: string;
  token: string;
  email: string;
  phone?: string;
  fullName: string;
  positionId: string;
  departmentId: string;
  expectedStartDate: string;
  salary?: number;
  contractType: ContractType;
  workRegime: WorkRegime;
  status: AdmissionStatus;
  candidateData?: CandidateData;
  expiresAt: string;
  completedAt?: string;
  employeeId?: string;
  rejectionReason?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Populated relations
  position?: { id: string; name: string };
  department?: { id: string; name: string };
  employee?: { id: string; fullName: string };
  documents?: AdmissionDocument[];
  signature?: DigitalSignature;
}

export interface CandidateData {
  // Dados pessoais
  fullName: string;
  cpf: string;
  rg?: string;
  birthDate: string;
  maritalStatus: MaritalStatus;
  nationality: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };

  // Dados bancários
  bankData?: {
    bankCode: string;
    bankName: string;
    agency: string;
    account: string;
    accountType: BankAccountType;
    pixKey?: string;
  };

  // Dependentes
  dependants?: CandidateDependant[];
}

export interface CandidateDependant {
  id?: string;
  fullName: string;
  cpf: string;
  relationship: DependantRelationship;
  birthDate: string;
}

export interface AdmissionDocument {
  id: string;
  admissionInviteId: string;
  tenantId: string;
  type: AdmissionDocumentType;
  fileName: string;
  fileUrl: string;
  status: AdmissionDocumentStatus;
  rejectionReason?: string;
  validatedBy?: string;
  validatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DigitalSignature {
  id: string;
  tenantId: string;
  documentId?: string;
  signerId?: string;
  signerName: string;
  signerCpf: string;
  signerEmail: string;
  signedAt: string;
  ipAddress: string;
  userAgent: string;
  documentHash: string;
  pinVerified: boolean;
  signatureType: DigitalSignatureType;
}

export interface CreateAdmissionData {
  email: string;
  phone?: string;
  fullName: string;
  positionId: string;
  departmentId: string;
  expectedStartDate: string;
  salary?: number;
  contractType: ContractType;
  workRegime: WorkRegime;
  expiresAt?: string;
}

export interface UpdateAdmissionData {
  email?: string;
  phone?: string;
  fullName?: string;
  positionId?: string;
  departmentId?: string;
  expectedStartDate?: string;
  salary?: number;
  contractType?: ContractType;
  workRegime?: WorkRegime;
  expiresAt?: string;
}

// Public submission data (from candidate wizard)
export interface SubmitCandidateDataPayload {
  candidateData: CandidateData;
}

export interface UploadAdmissionDocumentPayload {
  type: AdmissionDocumentType;
  file: File;
}

export interface SignAdmissionPayload {
  signerName: string;
  signerCpf: string;
  pin: string;
  acceptedTerms: boolean;
}

// Public invite response (minimal info for candidate)
export interface PublicAdmissionInvite {
  id: string;
  fullName: string;
  email: string;
  status: AdmissionStatus;
  expiresAt: string;
  expectedStartDate: string;
  contractType: ContractType;
  workRegime: WorkRegime;
  candidateData?: CandidateData;
  documents?: AdmissionDocument[];
  signature?: DigitalSignature;
  tenant?: {
    name: string;
    logoUrl?: string;
  };
  position?: { id: string; name: string };
  department?: { id: string; name: string };
}
