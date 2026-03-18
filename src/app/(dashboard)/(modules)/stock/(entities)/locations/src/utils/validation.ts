// ============================================
// VALIDATION UTILITIES
// ============================================

import { ERROR_MESSAGES, STRUCTURE_LIMITS } from '../constants';
import type {
  ZoneStructureFormData,
  WarehouseFormData,
  ZoneFormData,
} from '@/types/stock';

/**
 * Resultado de validação
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Valida código de armazém/zona
 */
export function validateCode(
  code: string,
  type: 'warehouse' | 'zone'
): string | null {
  const prefix = type === 'warehouse' ? 'WAREHOUSE' : 'ZONE';

  if (!code || code.trim() === '') {
    return ERROR_MESSAGES[
      `${prefix}_CODE_REQUIRED` as keyof typeof ERROR_MESSAGES
    ];
  }

  const trimmed = code.trim();

  if (trimmed.length < 2) {
    return ERROR_MESSAGES[
      `${prefix}_CODE_TOO_SHORT` as keyof typeof ERROR_MESSAGES
    ];
  }

  if (trimmed.length > 5) {
    return ERROR_MESSAGES[
      `${prefix}_CODE_TOO_LONG` as keyof typeof ERROR_MESSAGES
    ];
  }

  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    return ERROR_MESSAGES[
      `${prefix}_CODE_INVALID` as keyof typeof ERROR_MESSAGES
    ];
  }

  return null;
}

/**
 * Valida nome de armazém/zona
 */
export function validateName(
  name: string,
  type: 'warehouse' | 'zone'
): string | null {
  const prefix = type === 'warehouse' ? 'WAREHOUSE' : 'ZONE';

  if (!name || name.trim() === '') {
    return ERROR_MESSAGES[
      `${prefix}_NAME_REQUIRED` as keyof typeof ERROR_MESSAGES
    ];
  }

  return null;
}

/**
 * Valida formulário de armazém
 */
export function validateWarehouseForm(
  data: WarehouseFormData
): ValidationResult {
  const errors: Record<string, string> = {};

  const codeError = validateCode(data.code, 'warehouse');
  if (codeError) errors.code = codeError;

  const nameError = validateName(data.name, 'warehouse');
  if (nameError) errors.name = nameError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida formulário de zona
 */
export function validateZoneForm(data: ZoneFormData): ValidationResult {
  const errors: Record<string, string> = {};

  const codeError = validateCode(data.code, 'zone');
  if (codeError) errors.code = codeError;

  const nameError = validateName(data.name, 'zone');
  if (nameError) errors.name = nameError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida configuração de estrutura
 */
export function validateStructure(
  data: ZoneStructureFormData
): ValidationResult {
  const errors: Record<string, string> = {};

  // Validar corredores
  if (data.aisles < STRUCTURE_LIMITS.minAisles) {
    errors.aisles = ERROR_MESSAGES.STRUCTURE_AISLES_MIN;
  } else if (data.aisles > STRUCTURE_LIMITS.maxAisles) {
    errors.aisles = ERROR_MESSAGES.STRUCTURE_AISLES_MAX;
  }

  // Validar prateleiras
  if (data.shelvesPerAisle < STRUCTURE_LIMITS.minShelvesPerAisle) {
    errors.shelvesPerAisle = ERROR_MESSAGES.STRUCTURE_SHELVES_MIN;
  } else if (data.shelvesPerAisle > STRUCTURE_LIMITS.maxShelvesPerAisle) {
    errors.shelvesPerAisle = ERROR_MESSAGES.STRUCTURE_SHELVES_MAX;
  }

  // Validar nichos
  if (data.binsPerShelf < STRUCTURE_LIMITS.minBinsPerShelf) {
    errors.binsPerShelf = ERROR_MESSAGES.STRUCTURE_BINS_MIN;
  } else if (data.binsPerShelf > STRUCTURE_LIMITS.maxBinsPerShelf) {
    errors.binsPerShelf = ERROR_MESSAGES.STRUCTURE_BINS_MAX;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Normaliza código para maiúsculas
 */
export function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Valida se um código já existe (para uso com API)
 */
export async function checkCodeExists(
  code: string,
  type: 'warehouse' | 'zone',
  checkFn: (code: string) => Promise<boolean>
): Promise<string | null> {
  try {
    const exists = await checkFn(code);
    if (exists) {
      return ERROR_MESSAGES[
        `${type.toUpperCase()}_CODE_EXISTS` as keyof typeof ERROR_MESSAGES
      ] as string;
    }
    return null;
  } catch {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
}

/**
 * Debounce para validação assíncrona
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
