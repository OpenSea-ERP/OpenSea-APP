/**
 * OpenSea OS - EntityForm Validation
 * Lógica de validação para formulários genéricos
 */

import type { BaseEntity, EntityFormConfig } from '@/core/types';
import { toast } from 'sonner';
import type { ValidationResult } from './entity-form.types';

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Valida campos obrigatórios do formulário
 */
export function validateRequiredFields<T extends BaseEntity>(
  data: Partial<T>,
  config: EntityFormConfig<T>
): ValidationResult {
  const allFields = config.sections?.flatMap(s => s.fields) || [];
  const errors: Record<string, string> = {};

  for (const field of allFields) {
    if (field.required) {
      const value = data[field.name as keyof T];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field.name as string] = `${field.label} é obrigatório`;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Mostra toast com erros de validação
 */
export function showValidationErrors(errors: Record<string, string>): void {
  const errorMessages = Object.values(errors);

  if (errorMessages.length === 1) {
    toast.error(errorMessages[0]);
  } else {
    toast.error(
      `Há ${errorMessages.length} campos obrigatórios que precisam ser preenchidos`
    );
  }
}

/**
 * Constrói defaultValues considerando field.defaultValue
 */
export function buildDefaultValues<T extends BaseEntity>(
  initialData: Partial<T> | undefined,
  config: EntityFormConfig<T>
): Record<string, unknown> {
  const values: Record<string, unknown> = { ...(initialData || {}) };
  const allFields = config.sections?.flatMap(s => s.fields) || [];

  for (const field of allFields) {
    if (field.defaultValue && !values.hasOwnProperty(field.name as string)) {
      values[field.name as string] = field.defaultValue;
    }
  }

  return values;
}
