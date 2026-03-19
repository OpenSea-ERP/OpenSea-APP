/**
 * Formatters - Utility functions for formatting data
 */

/**
 * Formata um CNPJ no padrão XX.XXX.XXX/XXXX-XX
 * @param cnpj - CNPJ sem formatação (apenas números)
 * @returns CNPJ formatado ou string original se inválido
 */
export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '';

  // Remove caracteres não numéricos
  const numbers = cnpj.replace(/\D/g, '');

  // Verifica se tem 14 dígitos
  if (numbers.length !== 14) return cnpj;

  // Aplica a máscara XX.XXX.XXX/XXXX-XX
  return numbers.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formata um CPF no padrão XXX.XXX.XXX-XX
 * @param cpf - CPF sem formatação (apenas números)
 * @returns CPF formatado ou string original se inválido
 */
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '';

  // Remove caracteres não numéricos
  const numbers = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (numbers.length !== 11) return cpf;

  // Aplica a máscara XXX.XXX.XXX-XX
  return numbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * Formata um telefone no padrão (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * @param phone - Telefone sem formatação (apenas números)
 * @returns Telefone formatado ou string original se inválido
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';

  // Remove caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');

  // Celular com 11 dígitos: (XX) XXXXX-XXXX
  if (numbers.length === 11) {
    return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }

  // Telefone fixo com 10 dígitos: (XX) XXXX-XXXX
  if (numbers.length === 10) {
    return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }

  return phone;
}

/**
 * Formata um CEP no padrão XXXXX-XXX
 * @param cep - CEP sem formatação (apenas números)
 * @returns CEP formatado ou string original se inválido
 */
export function formatCEP(cep: string | null | undefined): string {
  if (!cep) return '';

  // Remove caracteres não numéricos
  const numbers = cep.replace(/\D/g, '');

  // Verifica se tem 8 dígitos
  if (numbers.length !== 8) return cep;

  // Aplica a máscara XXXXX-XXX
  return numbers.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

/**
 * Formata um código CNAE no padrão XXXX-X/XX
 * @param cnae - Código CNAE sem formatação (apenas números)
 * @returns CNAE formatado ou string original se inválido
 */
export function formatCNAE(cnae: string | null | undefined): string {
  if (!cnae) return '';

  // Remove caracteres não numéricos
  const numbers = cnae.replace(/\D/g, '');

  // Verifica se tem 7 dígitos
  if (numbers.length !== 7) return cnae;

  // Aplica a máscara XXXX-X/XX
  return numbers.replace(/^(\d{4})(\d{1})(\d{2})$/, '$1-$2/$3');
}

/**
 * Formata um valor monetário no padrão brasileiro (R$ X.XXX,XX)
 * @param value - Valor numérico
 * @returns Valor formatado em moeda brasileira
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata uma data no padrão brasileiro (DD/MM/YYYY)
 * @param date - Data em string ISO ou objeto Date
 * @returns Data formatada ou string vazia se inválida
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  return dateObj.toLocaleDateString('pt-BR');
}

/**
 * Formata uma data e hora no padrão brasileiro (DD/MM/YYYY HH:MM)
 * @param date - Data em string ISO ou objeto Date
 * @returns Data e hora formatadas ou string vazia se inválida
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return '';

  return dateObj.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata uma unidade de medida para português
 * @param unitOfMeasure - Código da unidade de medida (ex: "METERS", "KILOGRAMS")
 * @returns Nome da unidade em português ou código original se desconhecido
 */
export function formatUnitOfMeasure(
  unitOfMeasure: string | null | undefined
): string {
  if (!unitOfMeasure) return 'Unidade';

  const unitMap: Record<string, string> = {
    UNITS: 'Unidades (un)',
    METERS: 'Metros (m)',
    KILOGRAMS: 'Quilogramas (kg)',
    GRAMS: 'Gramas (g)',
    LITERS: 'Litros (L)',
    MILLILITERS: 'Mililitros (mL)',
    SQUARE_METERS: 'Metros quadrados (m²)',
    PAIRS: 'Pares (par)',
    BOXES: 'Caixas (cx)',
    PACKS: 'Pacotes (pct)',
  };

  return unitMap[unitOfMeasure] || unitOfMeasure;
}

export function formatUnitAbbreviation(
  unitOfMeasure: string | null | undefined
): string {
  if (!unitOfMeasure) return 'un';

  const abbrMap: Record<string, string> = {
    UNITS: 'un',
    METERS: 'm',
    KILOGRAMS: 'kg',
    GRAMS: 'g',
    LITERS: 'L',
    MILLILITERS: 'mL',
    SQUARE_METERS: 'm²',
    PAIRS: 'par',
    BOXES: 'cx',
    PACKS: 'pct',
  };

  return abbrMap[unitOfMeasure] || unitOfMeasure;
}

/**
 * Retorna a abreviação da unidade de medida (ex: "kg", "m", "L")
 * Extrai o conteúdo entre parênteses do formatUnitOfMeasure()
 * @param uom - Código da unidade de medida (ex: "METERS", "KILOGRAMS")
 * @returns Abreviação ou string vazia se não encontrada
 */
export function getUnitAbbreviation(uom: string | null | undefined): string {
  if (!uom) return '';
  const formatted = formatUnitOfMeasure(uom);
  return formatted.match(/\(([^)]+)\)/)?.[1] || '';
}

/**
 * Formata uma quantidade com no máximo 3 casas decimais
 * Remove zeros à direita desnecessários
 * @param value - Valor numérico
 * @returns Valor formatado com máximo de 3 casas decimais
 */
export function formatQuantity(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';

  // Arredonda para 3 casas decimais e remove zeros à direita
  const rounded = Math.round(value * 1000) / 1000;
  return rounded.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

/**
 * Limita a entrada de quantidade a 3 casas decimais
 * @param input - String de entrada do usuário
 * @returns String validada com máximo de 3 casas decimais
 */
export function sanitizeQuantityInput(input: string): string {
  // Substitui vírgula por ponto para parsing
  const normalized = input.replace(',', '.');

  // Permite apenas números e um ponto decimal
  const cleaned = normalized.replace(/[^\d.]/g, '');

  // Garante apenas um ponto decimal
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }

  // Limita a 3 casas decimais
  if (parts.length === 2 && parts[1].length > 3) {
    return parts[0] + '.' + parts[1].substring(0, 3);
  }

  return cleaned;
}

/**
 * Valida se uma quantidade tem no máximo 3 casas decimais
 * @param value - Valor numérico
 * @returns true se válido, false se inválido
 */
export function isValidQuantity(value: number): boolean {
  // Multiplica por 1000 e verifica se é inteiro (máximo 3 casas decimais)
  return Number.isInteger(Math.round(value * 1000));
}
