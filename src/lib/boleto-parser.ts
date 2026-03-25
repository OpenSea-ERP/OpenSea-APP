/**
 * Parser de boleto bancário brasileiro.
 * Extrai valor, vencimento e banco a partir da linha digitável (47 dígitos)
 * ou código de barras (44 dígitos).
 *
 * Referência: FEBRABAN - Especificação Técnica de Boleto de Cobrança
 */

// Cycle-reset constants for due date factor calculation
const OLD_BASE = new Date(1997, 9, 7).getTime(); // Oct 7, 1997
const NEW_BASE = new Date(2025, 1, 22).getTime(); // Feb 22, 2025
const CYCLE_BOUNDARY = new Date(2025, 1, 22).getTime();
const MS_PER_DAY = 86_400_000;

// Bank code mapping (synced with backend — 45+ banks)
const BANK_NAMES: Record<string, string> = {
  '001': 'Banco do Brasil',
  '003': 'Banco da Amazônia',
  '004': 'Banco do Nordeste',
  '010': 'Credicoamo',
  '021': 'Banestes',
  '033': 'Santander',
  '036': 'Bradesco BBI',
  '047': 'Banese',
  '065': 'AndBank',
  '070': 'BRB',
  '077': 'Inter',
  '082': 'Topázio',
  '084': 'Uniprime',
  '085': 'AILOS',
  '097': 'CrediSIS',
  '104': 'Caixa Econômica',
  '133': 'Cresol',
  '136': 'Unicred',
  '197': 'Stone',
  '208': 'BTG Pactual',
  '212': 'Original',
  '218': 'BS2',
  '237': 'Bradesco',
  '254': 'Paraná Banco',
  '260': 'Nubank',
  '280': 'Avista',
  '290': 'PagSeguro',
  '318': 'BMG',
  '336': 'C6 Bank',
  '341': 'Itaú',
  '356': 'Banco Real',
  '376': 'J.P. Morgan',
  '389': 'Mercantil do Brasil',
  '399': 'HSBC',
  '403': 'Cora',
  '422': 'Safra',
  '453': 'Banco Rural',
  '623': 'Pan',
  '633': 'Rendimento',
  '637': 'Sofisa',
  '652': 'Itaú Unibanco',
  '655': 'Neon',
  '707': 'Daycoval',
  '741': 'Ribeirão Preto',
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

  const oldDate = OLD_BASE + factor * MS_PER_DAY;

  // Cycle reset: if factor >= 1000 but old-base date falls before boundary,
  // the factor has wrapped — recalculate using new base (Feb 22, 2025).
  if (oldDate < CYCLE_BOUNDARY && factor >= 1000) {
    const newDate = new Date(NEW_BASE + (factor - 1000) * MS_PER_DAY);
    return newDate.toISOString().split('T')[0];
  }

  const date = new Date(oldDate);
  return date.toISOString().split('T')[0];
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

  const bank = digits.substring(0, 3); // AAA
  const currency = digits.substring(3, 4); // B
  const checkDigit = digits.substring(32, 33); // K
  const dueFactor = digits.substring(33, 37); // UUUU
  const amount = digits.substring(37, 47); // VVVVVVVVVV
  const free1 = digits.substring(4, 9); // CCCCC
  const free2 = digits.substring(10, 20); // DDDDDDDDDD
  const free3 = digits.substring(21, 31); // EEEEEEEEEE

  return (
    bank + currency + checkDigit + dueFactor + amount + free1 + free2 + free3
  );
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
