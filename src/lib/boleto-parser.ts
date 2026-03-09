/**
 * Parser de boleto bancário brasileiro.
 * Extrai valor, vencimento e banco a partir da linha digitável (47 dígitos)
 * ou código de barras (44 dígitos).
 *
 * Referência: FEBRABAN - Especificação Técnica de Boleto de Cobrança
 */

// Base date for due date factor calculation
const BASE_DATE = new Date(1997, 9, 7); // Oct 7, 1997

// Bank code mapping (most common)
const BANK_NAMES: Record<string, string> = {
  '001': 'Banco do Brasil',
  '033': 'Santander',
  '104': 'Caixa Econômica',
  '237': 'Bradesco',
  '341': 'Itaú',
  '356': 'Banco Real',
  '389': 'Mercantil do Brasil',
  '399': 'HSBC',
  '422': 'Safra',
  '453': 'Banco Rural',
  '633': 'Rendimento',
  '652': 'Itaú Unibanco',
  '745': 'Citibank',
  '756': 'Sicoob',
};

export interface BoletoParseResult {
  /** Valor em reais (ex: 150.75) */
  amount: number | null;
  /** Data de vencimento (ISO string yyyy-MM-dd) */
  dueDate: string | null;
  /** Código do banco (ex: "341") */
  bankCode: string | null;
  /** Nome do banco (ex: "Itaú") */
  bankName: string | null;
  /** Se o parsing foi bem-sucedido (ao menos valor OU data extraídos) */
  success: boolean;
  /** Tipo de entrada detectada */
  inputType: 'linha_digitavel' | 'codigo_barras' | 'unknown';
}

/**
 * Remove caracteres não numéricos (pontos, espaços, hífens).
 */
function cleanDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Converte fator de vencimento para data ISO.
 * Fator 0000 = sem vencimento.
 * Lida com o reset do fator em 22/02/2025 (fator 1000 recomeça).
 */
function factorToDate(factor: number): string | null {
  if (factor === 0) return null;

  // Calculate date from base
  const date = new Date(BASE_DATE);
  date.setDate(date.getDate() + factor);

  // Sanity check: date should be reasonable (between 2000 and 2035)
  const year = date.getFullYear();
  if (year < 2000 || year > 2035) return null;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Converte a linha digitável (47 dígitos) para código de barras (44 dígitos).
 *
 * Linha digitável: AAABC.CCCCX DDDDD.DDDDDY EEEEE.EEEEEZ K UUUUVVVVVVVVVV
 * Código barras:   AAAB KUUUUVVVVVVVVVV CCCCC DDDDDDDDDD EEEEEEEEEE
 */
function linhaDigitavelToBarcode(digits: string): string {
  // positions (0-indexed in the 47-digit string):
  // field 1: [0..9]  = bank(3) + currency(1) + free(5) + check(1)
  // field 2: [10..20] = free(10) + check(1)
  // field 3: [21..31] = free(10) + check(1)
  // field 4: [32]     = general check digit
  // field 5: [33..36] = due date factor
  // field 6: [37..46] = amount

  const bank = digits.substring(0, 3);        // AAA
  const currency = digits.substring(3, 4);     // B
  const checkDigit = digits.substring(32, 33); // K
  const dueFactor = digits.substring(33, 37);  // UUUU
  const amount = digits.substring(37, 47);     // VVVVVVVVVV
  const free1 = digits.substring(4, 9);        // CCCCC
  const free2 = digits.substring(10, 20);      // DDDDDDDDDD
  const free3 = digits.substring(21, 31);      // EEEEEEEEEE

  return bank + currency + checkDigit + dueFactor + amount + free1 + free2 + free3;
}

/**
 * Extrai dados de um código de barras (44 dígitos).
 */
function parseBarcode(barcode: string): Omit<BoletoParseResult, 'inputType'> {
  const bankCode = barcode.substring(0, 3);
  const factor = parseInt(barcode.substring(5, 9), 10);
  const amountCents = parseInt(barcode.substring(9, 19), 10);

  const amount = amountCents > 0 ? amountCents / 100 : null;
  const dueDate = factorToDate(factor);
  const bankName = BANK_NAMES[bankCode] ?? null;

  return {
    amount,
    dueDate,
    bankCode,
    bankName,
    success: amount !== null || dueDate !== null,
  };
}

/**
 * Tenta extrair valor, vencimento e banco de um boleto.
 * Aceita linha digitável (47 dígitos) ou código de barras (44 dígitos).
 */
export function parseBoleto(input: string): BoletoParseResult {
  const digits = cleanDigits(input);

  // Linha digitável: 47 digits
  if (digits.length === 47) {
    const barcode = linhaDigitavelToBarcode(digits);
    const result = parseBarcode(barcode);
    return { ...result, inputType: 'linha_digitavel' };
  }

  // Código de barras: 44 digits
  if (digits.length === 44) {
    const result = parseBarcode(digits);
    return { ...result, inputType: 'codigo_barras' };
  }

  return {
    amount: null,
    dueDate: null,
    bankCode: null,
    bankName: null,
    success: false,
    inputType: 'unknown',
  };
}
