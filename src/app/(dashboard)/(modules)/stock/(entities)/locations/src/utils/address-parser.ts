// ============================================
// ADDRESS PARSER
// ============================================

import type { AddressComponents } from '@/types/stock';

/**
 * Resultado do parsing de um endereço
 */
export interface ParsedAddress extends AddressComponents {
  isValid: boolean;
  original: string;
  separator: string;
}

/**
 * Parseia um endereço de localização
 *
 * Suporta diferentes formatos:
 * - FAB-EST-102-B (com hífen)
 * - FAB.EST.102.B (com ponto)
 * - FABEST102B (sem separador)
 *
 * @example
 * parseAddress("FAB-EST-102-B")
 * // => { warehouseCode: 'FAB', zoneCode: 'EST', aisle: 1, shelf: 2, bin: 'B', isValid: true, ... }
 */
export function parseAddress(address: string): ParsedAddress {
  const invalidResult: ParsedAddress = {
    warehouseCode: '',
    zoneCode: '',
    aisle: 0,
    shelf: 0,
    bin: '',
    isValid: false,
    original: address,
    separator: '',
  };

  if (!address || address.length < 6) {
    return invalidResult;
  }

  // Tenta diferentes separadores
  const separators = ['-', '.', ''];

  for (const sep of separators) {
    const result = tryParsWithSeparator(address, sep);
    if (result.isValid) {
      return result;
    }
  }

  return invalidResult;
}

/**
 * Tenta parsear o endereço com um separador específico
 */
function tryParsWithSeparator(
  address: string,
  separator: string
): ParsedAddress {
  const invalidResult: ParsedAddress = {
    warehouseCode: '',
    zoneCode: '',
    aisle: 0,
    shelf: 0,
    bin: '',
    isValid: false,
    original: address,
    separator,
  };

  if (separator) {
    const parts = address.split(separator);

    if (parts.length !== 4) {
      return invalidResult;
    }

    const [warehouse, zone, position, bin] = parts;

    // Validar warehouse e zone (2-5 letras maiúsculas)
    if (!/^[A-Z]{2,5}$/.test(warehouse) || !/^[A-Z]{2,5}$/.test(zone)) {
      return invalidResult;
    }

    // Parsear position (ex: "102" => aisle=1, shelf=02)
    const { aisle, shelf, valid } = parsePosition(position);
    if (!valid) {
      return invalidResult;
    }

    // Validar bin (letra ou número)
    if (!/^[A-Z]$/.test(bin) && !/^\d+$/.test(bin)) {
      return invalidResult;
    }

    return {
      warehouseCode: warehouse,
      zoneCode: zone,
      aisle,
      shelf,
      bin,
      isValid: true,
      original: address,
      separator,
    };
  } else {
    // Sem separador - formato: FABEST102B
    // Tenta identificar as partes pelo padrão
    const match = address.match(
      /^([A-Z]{2,5})([A-Z]{2,5})(\d{2,4})([A-Z]|\d+)$/
    );

    if (!match) {
      return invalidResult;
    }

    const [, warehouse, zone, position, bin] = match;

    const { aisle, shelf, valid } = parsePosition(position);
    if (!valid) {
      return invalidResult;
    }

    return {
      warehouseCode: warehouse,
      zoneCode: zone,
      aisle,
      shelf,
      bin,
      isValid: true,
      original: address,
      separator: '',
    };
  }
}

/**
 * Parseia a posição (corredor + prateleira)
 *
 * Formatos suportados:
 * - "102" => aisle=1, shelf=02 (1 dígito corredor, 2 dígitos prateleira)
 * - "0102" => aisle=01, shelf=02 (2 dígitos cada)
 * - "1002" => aisle=1, shelf=002 (1 dígito corredor, 3 dígitos prateleira)
 */
function parsePosition(position: string): {
  aisle: number;
  shelf: number;
  valid: boolean;
} {
  if (!position || position.length < 2) {
    return { aisle: 0, shelf: 0, valid: false };
  }

  // Tenta diferentes combinações de dígitos
  // Prioridade: mais dígitos para prateleira

  if (position.length === 3) {
    // 102 => aisle=1, shelf=02
    const aisle = parseInt(position[0], 10);
    const shelf = parseInt(position.slice(1), 10);
    return {
      aisle,
      shelf,
      valid: !isNaN(aisle) && !isNaN(shelf) && aisle > 0 && shelf > 0,
    };
  }

  if (position.length === 4) {
    // Pode ser 0102 (aisle=01, shelf=02) ou 1002 (aisle=1, shelf=002)
    // Assumimos: se começa com 0, são 2 dígitos cada
    if (position[0] === '0') {
      const aisle = parseInt(position.slice(0, 2), 10);
      const shelf = parseInt(position.slice(2), 10);
      return {
        aisle,
        shelf,
        valid: !isNaN(aisle) && !isNaN(shelf) && aisle > 0 && shelf > 0,
      };
    } else {
      // 1 dígito aisle, 3 dígitos shelf
      const aisle = parseInt(position[0], 10);
      const shelf = parseInt(position.slice(1), 10);
      return {
        aisle,
        shelf,
        valid: !isNaN(aisle) && !isNaN(shelf) && aisle > 0 && shelf > 0,
      };
    }
  }

  if (position.length === 5) {
    // 01002 => aisle=01, shelf=002
    const aisle = parseInt(position.slice(0, 2), 10);
    const shelf = parseInt(position.slice(2), 10);
    return {
      aisle,
      shelf,
      valid: !isNaN(aisle) && !isNaN(shelf) && aisle > 0 && shelf > 0,
    };
  }

  // Fallback: primeiro dígito é o corredor, resto é prateleira
  const aisle = parseInt(position[0], 10);
  const shelf = parseInt(position.slice(1), 10);
  return {
    aisle,
    shelf,
    valid: !isNaN(aisle) && !isNaN(shelf) && aisle > 0 && shelf > 0,
  };
}

/**
 * Valida se um endereço tem o formato correto
 */
export function isValidAddress(address: string): boolean {
  return parseAddress(address).isValid;
}

/**
 * Extrai apenas os códigos de warehouse e zone de um endereço
 */
export function extractCodes(
  address: string
): { warehouse: string; zone: string } | null {
  const parsed = parseAddress(address);
  if (!parsed.isValid) return null;

  return {
    warehouse: parsed.warehouseCode,
    zone: parsed.zoneCode,
  };
}

/**
 * Compara dois endereços para ordenação
 */
export function compareAddresses(a: string, b: string): number {
  const parsedA = parseAddress(a);
  const parsedB = parseAddress(b);

  if (!parsedA.isValid || !parsedB.isValid) {
    return a.localeCompare(b);
  }

  // Ordenar por: warehouse, zone, aisle, shelf, bin
  if (parsedA.warehouseCode !== parsedB.warehouseCode) {
    return parsedA.warehouseCode.localeCompare(parsedB.warehouseCode);
  }

  if (parsedA.zoneCode !== parsedB.zoneCode) {
    return parsedA.zoneCode.localeCompare(parsedB.zoneCode);
  }

  if (parsedA.aisle !== parsedB.aisle) {
    return parsedA.aisle - parsedB.aisle;
  }

  if (parsedA.shelf !== parsedB.shelf) {
    return parsedA.shelf - parsedB.shelf;
  }

  return parsedA.bin.localeCompare(parsedB.bin);
}

/**
 * Formata um endereço para exibição amigável
 */
export function formatAddressForDisplay(address: string): string {
  const parsed = parseAddress(address);
  if (!parsed.isValid) return address;

  return `${parsed.warehouseCode} > ${parsed.zoneCode} > Corredor ${parsed.aisle} > Prateleira ${parsed.shelf.toString().padStart(2, '0')} > Nicho ${parsed.bin}`;
}

/**
 * Obtém o caminho de breadcrumb para um endereço
 */
export function getAddressBreadcrumb(
  address: string
): Array<{ label: string; value: string }> | null {
  const parsed = parseAddress(address);
  if (!parsed.isValid) return null;

  return [
    { label: 'Armazém', value: parsed.warehouseCode },
    { label: 'Zona', value: parsed.zoneCode },
    { label: 'Corredor', value: parsed.aisle.toString() },
    { label: 'Prateleira', value: parsed.shelf.toString().padStart(2, '0') },
    { label: 'Nicho', value: parsed.bin },
  ];
}
