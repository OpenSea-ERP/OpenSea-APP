// ============================================================================
// OFX Bank Reconciliation Types
// ============================================================================

export type ReconciliationStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ReconciliationItemStatus =
  | 'UNMATCHED'
  | 'MATCHED'
  | 'IGNORED'
  | 'CREATED';

export type ReconciliationTransactionType = 'CREDIT' | 'DEBIT';

export interface ReconciliationItem {
  id: string;
  reconciliationId: string;
  date: string;
  description: string;
  amount: number;
  transactionType: ReconciliationTransactionType;
  fitId?: string | null;
  checkNumber?: string | null;
  memo?: string | null;
  status: ReconciliationItemStatus;
  matchedEntryId?: string | null;
  matchedEntryCode?: string | null;
  matchedEntryDescription?: string | null;
  matchConfidence?: number | null;
  ignoredAt?: string | null;
  ignoredReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Reconciliation {
  id: string;
  bankAccountId: string;
  bankAccountName: string;
  fileName: string;
  periodStart: string;
  periodEnd: string;
  status: ReconciliationStatus;
  totalItems: number;
  matchedItems: number;
  unmatchedItems: number;
  ignoredItems: number;
  createdItems: number;
  totalCredits: number;
  totalDebits: number;
  importedAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationDetail extends Reconciliation {
  items: ReconciliationItem[];
}

export interface ReconciliationMatchSuggestion {
  entryId: string;
  entryCode: string;
  entryDescription: string;
  entryAmount: number;
  entryDueDate: string;
  entryType: 'PAYABLE' | 'RECEIVABLE';
  supplierName?: string | null;
  customerName?: string | null;
  confidence: number;
}

export interface ReconciliationImportPreview {
  totalTransactions: number;
  periodStart: string;
  periodEnd: string;
  totalCredits: number;
  totalDebits: number;
  creditCount: number;
  debitCount: number;
}

export interface ReconciliationsQuery {
  page?: number;
  perPage?: number;
  bankAccountId?: string;
  status?: ReconciliationStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const RECONCILIATION_STATUS_LABELS: Record<
  ReconciliationStatus,
  string
> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};

export const RECONCILIATION_ITEM_STATUS_LABELS: Record<
  ReconciliationItemStatus,
  string
> = {
  UNMATCHED: 'Pendente',
  MATCHED: 'Conciliado',
  IGNORED: 'Ignorado',
  CREATED: 'Lançamento Criado',
};
