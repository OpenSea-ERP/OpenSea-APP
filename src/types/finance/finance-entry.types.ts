export type PayableSubType =
  | 'BOLETO'
  | 'NOTA_FISCAL'
  | 'TRANSFERENCIA'
  | 'CARTAO'
  | 'PIX'
  | 'OUTROS';

export type FinanceEntryType = 'PAYABLE' | 'RECEIVABLE';
export type FinanceEntryRecurrence = 'SINGLE' | 'RECURRING' | 'INSTALLMENT';
export type FinanceEntryStatus =
  | 'PENDING'
  | 'OVERDUE'
  | 'PAID'
  | 'RECEIVED'
  | 'PARTIALLY_PAID'
  | 'CANCELLED'
  | 'SCHEDULED';
export type RecurrenceUnit =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUAL'
  | 'ANNUAL';
export type PaymentMethod =
  | 'PIX'
  | 'BOLETO'
  | 'TRANSFER'
  | 'CASH'
  | 'CHECK'
  | 'CARD';
export type FinanceAttachmentType =
  | 'BOLETO'
  | 'PAYMENT_RECEIPT'
  | 'CONTRACT'
  | 'INVOICE'
  | 'OTHER';
export type OverdueRange = '1-7' | '8-30' | '31-60' | '60+';

export interface FinanceEntry {
  id: string;
  type: FinanceEntryType;
  code: string;
  description: string;
  notes?: string | null;
  categoryId: string;
  categoryName?: string;
  costCenterId: string | null;
  costCenterName?: string;
  costCenterAllocations?: CostCenterAllocation[];
  bankAccountId?: string | null;
  bankAccountName?: string;
  supplierName?: string | null;
  customerName?: string | null;
  supplierId?: string | null;
  customerId?: string | null;
  salesOrderId?: string | null;
  expectedAmount: number;
  actualAmount?: number | null;
  discount: number;
  interest: number;
  penalty: number;
  totalDue: number;
  remainingBalance: number;
  issueDate: string;
  dueDate: string;
  competenceDate?: string | null;
  paymentDate?: string | null;
  status: FinanceEntryStatus;
  recurrenceType: FinanceEntryRecurrence;
  recurrenceInterval?: number | null;
  recurrenceUnit?: RecurrenceUnit | null;
  totalInstallments?: number | null;
  currentInstallment?: number | null;
  parentEntryId?: string | null;
  boletoBarcode?: string | null;
  boletoDigitLine?: string | null;
  boletoChargeId?: number | null;
  boletoBarcodeNumber?: string | null;
  boletoDigitableLine?: string | null;
  boletoPdfUrl?: string | null;
  beneficiaryName?: string | null;
  beneficiaryCpfCnpj?: string | null;
  pixKey?: string | null;
  pixKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP' | null;
  pixChargeId?: string | null;
  fiscalDocumentId?: string | null;
  // Multi-currency
  currency?: string;
  exchangeRate?: number | null;
  originalAmount?: number | null;
  isOverdue: boolean;
  tags: string[];
  payments?: FinanceEntryPayment[];
  attachments?: FinanceAttachment[];
  childEntries?: FinanceEntry[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CostCenterAllocation {
  costCenterId: string;
  percentage: number;
  amount?: number;
  costCenterName?: string;
}

export interface CreateFinanceEntryData {
  type: FinanceEntryType;
  description: string;
  categoryId: string;
  costCenterId?: string;
  costCenterAllocations?: CostCenterAllocation[];
  bankAccountId?: string;
  expectedAmount: number;
  discount?: number;
  interest?: number;
  penalty?: number;
  issueDate: string;
  dueDate: string;
  competenceDate?: string;
  supplierName?: string;
  customerName?: string;
  supplierId?: string;
  customerId?: string;
  salesOrderId?: string;
  recurrenceType?: FinanceEntryRecurrence;
  recurrenceInterval?: number;
  recurrenceUnit?: RecurrenceUnit;
  totalInstallments?: number;
  boletoBarcode?: string;
  boletoDigitLine?: string;
  beneficiaryName?: string;
  beneficiaryCpfCnpj?: string;
  pixKey?: string;
  pixKeyType?: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';
  notes?: string;
  tags?: string[];
  // Multi-currency
  currency?: string;
}

export type UpdateFinanceEntryData = Partial<CreateFinanceEntryData>;

export interface RegisterPaymentData {
  bankAccountId?: string;
  amount: number;
  paidAt: string;
  method?: PaymentMethod;
  reference?: string;
  notes?: string;
  interest?: number;
  penalty?: number;
}

export interface FinanceEntryPayment {
  id: string;
  entryId: string;
  bankAccountId?: string | null;
  bankAccountName?: string;
  amount: number;
  paidAt: string;
  method?: string | null;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface FinanceAttachment {
  id: string;
  entryId: string;
  type: FinanceAttachmentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileUrl?: string | null;
  createdAt: string;
}

export interface FinanceEntriesQuery {
  page?: number;
  perPage?: number;
  search?: string;
  type?: FinanceEntryType;
  status?: FinanceEntryStatus | FinanceEntryStatus[];
  categoryId?: string;
  costCenterId?: string;
  bankAccountId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  isOverdue?: boolean;
  customerName?: string;
  supplierName?: string;
  overdueRange?: OverdueRange;
  includeDeleted?: boolean;
  sortBy?:
    | 'createdAt'
    | 'dueDate'
    | 'expectedAmount'
    | 'description'
    | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ParseBoletoRequest {
  barcode: string;
}

export interface ParseBoletoResult {
  bankCode: string;
  bankName: string;
  dueDate: string;
  amount: number;
  boletoBarcode: string;
  boletoDigitLine: string;
}

// Boleto generation (Efi)
export interface CreateBoletoData {
  customerCpfCnpj: string;
  instructions?: string[];
}

export interface BoletoResult {
  chargeId: number;
  barcodeNumber: string;
  digitableLine: string;
  pdfUrl: string;
  dueDate: string;
  amount: number;
}

export interface CreateBoletoResponse {
  entry: FinanceEntry;
  boleto: BoletoResult;
}

// PIX charge generation
export interface CreatePixChargeData {
  expirationSeconds?: number;
  payerCpfCnpj?: string;
  payerName?: string;
}

export interface CreatePixChargeResponse {
  entry: {
    id: string;
    code: string;
    description: string;
    pixChargeId?: string | null;
  };
  txId: string;
  pixCopiaECola: string;
  qrCodeUrl: string;
  expiresAt: string;
  amount: number;
}

// PIX payment
export interface PayViaPixData {
  bankAccountId?: string;
  reference?: string;
  notes?: string;
}

export interface PayViaPixResponse {
  entry: {
    id: string;
    code: string;
    description: string;
    status: string;
  };
  payment: {
    id: string;
    amount: number;
    paidAt: string;
    method: string | null;
    reference?: string | null;
  };
}

export interface ForecastQuery {
  type?: FinanceEntryType;
  startDate: string;
  endDate: string;
  groupBy: 'day' | 'week' | 'month';
  costCenterId?: string;
  categoryId?: string;
}

export interface ForecastDataPoint {
  date: string;
  payable: number;
  receivable: number;
  net: number;
  cumulativeNet: number;
}

export interface CategorySum {
  categoryId: string;
  categoryName: string;
  total: number;
}

export interface CostCenterSum {
  costCenterId: string;
  costCenterName: string;
  total: number;
}

export interface ForecastResponse {
  data: ForecastDataPoint[];
  totals: {
    totalPayable: number;
    totalReceivable: number;
    netBalance: number;
  };
  byCategory: CategorySum[];
  byCostCenter: CostCenterSum[];
}

export const FINANCE_ENTRY_STATUS_LABELS: Record<FinanceEntryStatus, string> = {
  PENDING: 'Pendente',
  OVERDUE: 'Vencido',
  PAID: 'Pago',
  RECEIVED: 'Recebido',
  PARTIALLY_PAID: 'Parcialmente Pago',
  CANCELLED: 'Cancelado',
  SCHEDULED: 'Agendado',
};

export const FINANCE_ENTRY_TYPE_LABELS: Record<FinanceEntryType, string> = {
  PAYABLE: 'A Pagar',
  RECEIVABLE: 'A Receber',
};

export const RECURRENCE_TYPE_LABELS: Record<FinanceEntryRecurrence, string> = {
  SINGLE: 'Única',
  RECURRING: 'Recorrente',
  INSTALLMENT: 'Parcelado',
};

export const RECURRENCE_UNIT_LABELS: Record<RecurrenceUnit, string> = {
  DAILY: 'Diário',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quinzenal',
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: 'PIX',
  BOLETO: 'Boleto',
  TRANSFER: 'Transferência',
  CASH: 'Dinheiro',
  CHECK: 'Cheque',
  CARD: 'Cartão',
};

export const PAYABLE_SUBTYPE_LABELS: Record<PayableSubType, string> = {
  BOLETO: 'Boleto',
  NOTA_FISCAL: 'Nota Fiscal',
  TRANSFERENCIA: 'Transferência',
  CARTAO: 'Cartão',
  PIX: 'Pix',
  OUTROS: 'Outros',
};

export interface ParsePixRequest {
  code: string;
}

export interface ParsePixResult {
  type: 'COPIA_COLA' | 'CHAVE';
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP';
  merchantName?: string;
  merchantCity?: string;
  amount?: number;
}

// NF-e emission from entry
export type FiscalDocumentEmissionType = 'NFE' | 'NFSE';

export interface EmitNfeFromEntryItem {
  description: string;
  quantity: number;
  unitPrice: number;
  ncm?: string;
  cfop?: string;
  issRate?: number;
}

export interface EmitNfeFromEntryData {
  documentType: FiscalDocumentEmissionType;
  items: EmitNfeFromEntryItem[];
  notes?: string;
}

export interface EmitNfeFromEntryResponse {
  fiscalDocument: {
    id: string;
    type: string;
    series: number;
    number: number;
    accessKey?: string;
    status: string;
    danfePdfUrl?: string;
    protocolNumber?: string;
    totalValue: number;
  };
}

export interface OcrBatchResult {
  results: Array<{
    filename: string;
    extractedData: {
      valor?: number;
      vencimento?: string;
      beneficiario?: string;
      codigoBarras?: string;
      linhaDigitavel?: string;
    };
    confidence: number;
    error?: string;
  }>;
}

export interface BatchCreateRequest {
  entries: CreateFinanceEntryData[];
}

export interface BatchCreateResponse {
  created: number;
  entries: FinanceEntry[];
}

export interface BulkResult {
  success: number;
  failed: number;
  errors: { entryId: string; error: string }[];
}

export interface BulkPayData {
  entryIds: string[];
  bankAccountId: string;
  method: PaymentMethod;
  reference?: string;
}

export interface BulkCancelData {
  entryIds: string[];
  reason?: string;
}

export interface BulkDeleteData {
  entryIds: string[];
}

export interface BulkCategorizeData {
  entryIds: string[];
  categoryId: string;
}

// Duplicate detection
export interface CheckDuplicateData {
  supplierName?: string;
  customerName?: string;
  expectedAmount: number;
  dueDate: string;
  description?: string;
}

export interface DuplicateMatch {
  entryId: string;
  description: string;
  supplierName?: string | null;
  customerName?: string | null;
  expectedAmount: number;
  dueDate: string;
  score: number;
  matchReasons: string[];
}

export interface CheckDuplicateResponse {
  duplicates: DuplicateMatch[];
}

// Supplier/Customer Summary Dashboard
export interface SupplierSummaryParams {
  supplierName?: string;
  supplierId?: string;
  customerName?: string;
  customerId?: string;
}

export interface MonthlyTrend {
  month: string;
  total: number;
  count: number;
}

export interface RecentEntrySummary {
  id: string;
  description: string;
  expectedAmount: number;
  dueDate: string;
  status: string;
}

export interface SupplierSummaryResponse {
  summary: {
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    entryCount: number;
    avgAmount: number;
    firstEntryDate: string | null;
    lastEntryDate: string | null;
    monthlyTrend: MonthlyTrend[];
    recentEntries: RecentEntrySummary[];
  };
}
