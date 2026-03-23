// Bid (Licitacao) Types
import type { PaginatedQuery, PaginationMeta } from '../pagination';

export type BidModality =
  | 'PREGAO_ELETRONICO'
  | 'PREGAO_PRESENCIAL'
  | 'CONCORRENCIA'
  | 'TOMADA_PRECOS'
  | 'CONVITE'
  | 'LEILAO'
  | 'DIALOGO_COMPETITIVO'
  | 'CONCURSO'
  | 'DISPENSA'
  | 'INEXIGIBILIDADE';
export type BidCriterion =
  | 'MENOR_PRECO'
  | 'MAIOR_DESCONTO'
  | 'MELHOR_TECNICA'
  | 'TECNICA_PRECO'
  | 'MAIOR_LANCE'
  | 'MAIOR_RETORNO';
export type BidLegalFramework =
  | 'LEI_14133_2021'
  | 'LEI_8666_1993'
  | 'LEI_10520_2002'
  | 'LEI_12462_2011'
  | 'DECRETO_10024_2019';
export type BidStatus =
  | 'DISCOVERED'
  | 'ANALYZING'
  | 'VIABLE'
  | 'NOT_VIABLE'
  | 'PREPARING'
  | 'PROPOSAL_SENT'
  | 'AWAITING_DISPUTE'
  | 'IN_DISPUTE'
  | 'WON'
  | 'LOST'
  | 'DESERTED'
  | 'REVOKED'
  | 'SUSPENDED'
  | 'MONITORING'
  | 'CONTRACTED'
  | 'COMPLETED'
  | 'ARCHIVED';
export type BidDocumentType =
  | 'CERTIDAO_FEDERAL'
  | 'CERTIDAO_ESTADUAL'
  | 'CERTIDAO_MUNICIPAL'
  | 'CERTIDAO_TRABALHISTA'
  | 'CERTIDAO_FGTS'
  | 'CERTIDAO_FALENCIA'
  | 'BALANCO_PATRIMONIAL'
  | 'CONTRATO_SOCIAL'
  | 'ALVARA'
  | 'ATESTADO_CAPACIDADE'
  | 'PROPOSTA_TECNICA'
  | 'PROPOSTA_COMERCIAL'
  | 'EDITAL'
  | 'ATA_REGISTRO'
  | 'OUTROS';
export type BidContractStatus =
  | 'DRAFT_CONTRACT'
  | 'ACTIVE_CONTRACT'
  | 'SUSPENDED_CONTRACT'
  | 'COMPLETED_CONTRACT'
  | 'TERMINATED_CONTRACT'
  | 'RENEWED_CONTRACT';

export const BID_STATUS_LABELS: Record<BidStatus, string> = {
  DISCOVERED: 'Descoberta',
  ANALYZING: 'Analisando',
  VIABLE: 'Viavel',
  NOT_VIABLE: 'Inviavel',
  PREPARING: 'Preparando',
  PROPOSAL_SENT: 'Proposta Enviada',
  AWAITING_DISPUTE: 'Aguardando Disputa',
  IN_DISPUTE: 'Em Disputa',
  WON: 'Vencida',
  LOST: 'Perdida',
  DESERTED: 'Deserta',
  REVOKED: 'Revogada',
  SUSPENDED: 'Suspensa',
  MONITORING: 'Monitorando',
  CONTRACTED: 'Contratada',
  COMPLETED: 'Concluida',
  ARCHIVED: 'Arquivada',
};

export const BID_MODALITY_LABELS: Record<BidModality, string> = {
  PREGAO_ELETRONICO: 'Pregao Eletronico',
  PREGAO_PRESENCIAL: 'Pregao Presencial',
  CONCORRENCIA: 'Concorrencia',
  TOMADA_PRECOS: 'Tomada de Precos',
  CONVITE: 'Convite',
  LEILAO: 'Leilao',
  DIALOGO_COMPETITIVO: 'Dialogo Competitivo',
  CONCURSO: 'Concurso',
  DISPENSA: 'Dispensa',
  INEXIGIBILIDADE: 'Inexigibilidade',
};

export const BID_CONTRACT_STATUS_LABELS: Record<BidContractStatus, string> = {
  DRAFT_CONTRACT: 'Rascunho',
  ACTIVE_CONTRACT: 'Ativo',
  SUSPENDED_CONTRACT: 'Suspenso',
  COMPLETED_CONTRACT: 'Concluido',
  TERMINATED_CONTRACT: 'Encerrado',
  RENEWED_CONTRACT: 'Renovado',
};

export const BID_DOCUMENT_TYPE_LABELS: Record<BidDocumentType, string> = {
  CERTIDAO_FEDERAL: 'Certidao Federal',
  CERTIDAO_ESTADUAL: 'Certidao Estadual',
  CERTIDAO_MUNICIPAL: 'Certidao Municipal',
  CERTIDAO_TRABALHISTA: 'Certidao Trabalhista',
  CERTIDAO_FGTS: 'Certidao FGTS',
  CERTIDAO_FALENCIA: 'Certidao Falencia',
  BALANCO_PATRIMONIAL: 'Balanco Patrimonial',
  CONTRATO_SOCIAL: 'Contrato Social',
  ALVARA: 'Alvara',
  ATESTADO_CAPACIDADE: 'Atestado Capacidade Tecnica',
  PROPOSTA_TECNICA: 'Proposta Tecnica',
  PROPOSTA_COMERCIAL: 'Proposta Comercial',
  EDITAL: 'Edital',
  ATA_REGISTRO: 'Ata de Registro',
  OUTROS: 'Outros',
};

export interface Bid {
  id: string;
  tenantId: string;
  portalName: string;
  portalEditalId: string | null;
  editalNumber: string;
  modality: BidModality;
  criterionType: BidCriterion;
  legalFramework: BidLegalFramework;
  executionRegime: string | null;
  object: string;
  objectSummary: string | null;
  organName: string;
  organCnpj: string | null;
  organState: string | null;
  organCity: string | null;
  estimatedValue: number | null;
  ourProposalValue: number | null;
  finalValue: number | null;
  margin: number | null;
  publicationDate: string | null;
  openingDate: string;
  closingDate: string | null;
  disputeDate: string | null;
  status: BidStatus;
  viabilityScore: number | null;
  viabilityReason: string | null;
  customerId: string | null;
  assignedToUserId: string | null;
  exclusiveMeEpp: boolean;
  deliveryStates: string[];
  tags: string[];
  notes: string | null;
  editalUrl: string | null;
  editalFileId: string | null;
  etpFileId: string | null;
  trFileId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface BidItem {
  id: string;
  tenantId: string;
  bidId: string;
  itemNumber: number;
  lotNumber: number | null;
  lotDescription: string | null;
  description: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number | null;
  ourUnitPrice: number | null;
  finalUnitPrice: number | null;
  status: string;
  variantId: string | null;
  matchConfidence: number | null;
  quotaType: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface BidDocument {
  id: string;
  tenantId: string;
  bidId: string | null;
  type: BidDocumentType;
  name: string;
  description: string | null;
  fileId: string;
  issueDate: string | null;
  expirationDate: string | null;
  isValid: boolean;
  autoRenewable: boolean;
  lastRenewAttempt: string | null;
  renewStatus: string | null;
  portalUploaded: boolean;
  portalUploadedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface BidContract {
  id: string;
  tenantId: string;
  bidId: string;
  contractNumber: string;
  status: BidContractStatus;
  signedDate: string | null;
  startDate: string;
  endDate: string;
  totalValue: number;
  remainingValue: number;
  customerId: string;
  renewalCount: number;
  maxRenewals: number | null;
  renewalDeadline: string | null;
  contractFileId: string | null;
  notes: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface BidHistory {
  id: string;
  bidId: string;
  tenantId: string;
  action: string;
  description: string;
  metadata: Record<string, unknown> | null;
  performedByUserId: string | null;
  performedByAi: boolean;
  isReversible: boolean;
  createdAt: string;
}

// Request/Response types
export interface CreateBidRequest {
  portalName: string;
  editalNumber: string;
  modality: BidModality;
  criterionType: BidCriterion;
  legalFramework: BidLegalFramework;
  object: string;
  organName: string;
  openingDate: string;
  portalEditalId?: string;
  executionRegime?: string;
  objectSummary?: string;
  organCnpj?: string;
  organState?: string;
  organCity?: string;
  estimatedValue?: number;
  publicationDate?: string;
  closingDate?: string;
  disputeDate?: string;
  customerId?: string;
  assignedToUserId?: string;
  exclusiveMeEpp?: boolean;
  deliveryStates?: string[];
  tags?: string[];
  notes?: string;
  editalUrl?: string;
}

export interface UpdateBidRequest {
  object?: string;
  objectSummary?: string;
  status?: BidStatus;
  viabilityScore?: number;
  viabilityReason?: string;
  ourProposalValue?: number;
  finalValue?: number;
  margin?: number;
  customerId?: string | null;
  assignedToUserId?: string | null;
  tags?: string[];
  notes?: string;
}

export interface CreateBidDocumentRequest {
  bidId?: string;
  type: BidDocumentType;
  name: string;
  description?: string;
  fileId: string;
  issueDate?: string;
  expirationDate?: string;
  autoRenewable?: boolean;
}

export interface CreateBidContractRequest {
  bidId: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  customerId: string;
  signedDate?: string;
  maxRenewals?: number;
  renewalDeadline?: string;
  notes?: string;
}

export interface BidsQuery extends PaginatedQuery {
  search?: string;
  status?: BidStatus;
  modality?: BidModality;
  organState?: string;
  assignedToUserId?: string;
  sortBy?: 'createdAt' | 'openingDate' | 'estimatedValue' | 'editalNumber';
}

export interface PaginatedBidsResponse {
  bids: Bid[];
  meta: PaginationMeta;
}
export interface BidResponse {
  bid: Bid;
}
export interface PaginatedBidItemsResponse {
  items: BidItem[];
  meta: PaginationMeta;
}
export interface PaginatedBidDocumentsResponse {
  documents: BidDocument[];
  meta: PaginationMeta;
}
export interface PaginatedBidContractsResponse {
  contracts: BidContract[];
  meta: PaginationMeta;
}
export interface PaginatedBidHistoryResponse {
  history: BidHistory[];
  meta: PaginationMeta;
}
export interface BidDocumentResponse {
  document: BidDocument;
}
export interface BidContractResponse {
  contract: BidContract;
}
