// ============================================
// ADDRESS GENERATOR
// ============================================

import type { CodePattern, AddressComponents, AisleConfig } from '@/types/stock';

/**
 * Gera o endereço completo de um bin
 *
 * @example
 * generateAddress(
 *   { warehouseCode: 'FAB', zoneCode: 'EST', aisle: 1, shelf: 2, bin: 'B' },
 *   { separator: '-', aisleDigits: 1, shelfDigits: 2, binLabeling: 'LETTERS', binDirection: 'BOTTOM_UP' }
 * )
 * // => "FAB-EST-102-B"
 */
export function generateAddress(
  components: AddressComponents,
  pattern: CodePattern
): string {
  const { warehouseCode, zoneCode, aisle, shelf, bin } = components;
  const { separator, aisleDigits, shelfDigits } = pattern;

  const aisleStr = aisle.toString().padStart(aisleDigits, '0');
  const shelfStr = shelf.toString().padStart(shelfDigits, '0');

  // Formato: WAREHOUSE-ZONE-AISLESHELF-BIN
  // Ex: FAB-EST-102-B (corredor 1, prateleira 02, nicho B)
  return [warehouseCode, zoneCode, `${aisleStr}${shelfStr}`, bin].join(
    separator
  );
}

/**
 * Gera o label do bin baseado no índice e configuração
 *
 * @param index - Índice do bin (0-based)
 * @param labeling - Tipo de label ('LETTERS' ou 'NUMBERS')
 * @param direction - Direção ('BOTTOM_UP' ou 'TOP_DOWN')
 * @param totalBins - Total de bins na prateleira
 */
export function generateBinLabel(
  index: number,
  labeling: 'LETTERS' | 'NUMBERS',
  direction: 'BOTTOM_UP' | 'TOP_DOWN',
  totalBins: number
): string {
  // Se BOTTOM_UP, A é o mais baixo (índice 0)
  // Se TOP_DOWN, A é o mais alto (índice totalBins - 1)
  const adjustedIndex =
    direction.toUpperCase() === 'BOTTOM_UP' ? index : totalBins - 1 - index;

  if (labeling.toUpperCase() === 'LETTERS') {
    return String.fromCharCode(65 + adjustedIndex); // A, B, C, ...
  } else {
    return (adjustedIndex + 1).toString(); // 1, 2, 3, ...
  }
}

/**
 * Gera todos os endereços possíveis para uma zona
 *
 * @returns Array de endereços ordenados
 */
export function generateAllAddresses(
  warehouseCode: string,
  zoneCode: string,
  aisles: number,
  shelvesPerAisle: number,
  binsPerShelf: number,
  pattern: CodePattern
): string[] {
  const addresses: string[] = [];

  for (let aisle = 1; aisle <= aisles; aisle++) {
    for (let shelf = 1; shelf <= shelvesPerAisle; shelf++) {
      for (let binIndex = 0; binIndex < binsPerShelf; binIndex++) {
        const bin = generateBinLabel(
          binIndex,
          pattern.binLabeling,
          pattern.binDirection,
          binsPerShelf
        );

        const address = generateAddress(
          { warehouseCode, zoneCode, aisle, shelf, bin },
          pattern
        );

        addresses.push(address);
      }
    }
  }

  return addresses;
}

/**
 * Gera uma amostra de endereços para preview
 *
 * @returns Primeiro, alguns do meio e último endereço
 */
export function generateSampleAddresses(
  warehouseCode: string,
  zoneCode: string,
  aisles: number,
  shelvesPerAisle: number,
  binsPerShelf: number,
  pattern: CodePattern,
  sampleSize: number = 5
): string[] {
  const total = aisles * shelvesPerAisle * binsPerShelf;
  const samples: string[] = [];

  // Primeiro endereço
  const firstBin = generateBinLabel(
    0,
    pattern.binLabeling,
    pattern.binDirection,
    binsPerShelf
  );
  samples.push(
    generateAddress(
      { warehouseCode, zoneCode, aisle: 1, shelf: 1, bin: firstBin },
      pattern
    )
  );

  // Alguns do meio
  if (total > 2) {
    const midAisle = Math.ceil(aisles / 2);
    const midShelf = Math.ceil(shelvesPerAisle / 2);
    const midBinIndex = Math.floor(binsPerShelf / 2);
    const midBin = generateBinLabel(
      midBinIndex,
      pattern.binLabeling,
      pattern.binDirection,
      binsPerShelf
    );
    samples.push(
      generateAddress(
        {
          warehouseCode,
          zoneCode,
          aisle: midAisle,
          shelf: midShelf,
          bin: midBin,
        },
        pattern
      )
    );
  }

  // Último endereço
  const lastBin = generateBinLabel(
    binsPerShelf - 1,
    pattern.binLabeling,
    pattern.binDirection,
    binsPerShelf
  );
  samples.push(
    generateAddress(
      {
        warehouseCode,
        zoneCode,
        aisle: aisles,
        shelf: shelvesPerAisle,
        bin: lastBin,
      },
      pattern
    )
  );

  return samples;
}

/**
 * Calcula o total de bins para uma estrutura
 */
export function calculateTotalBins(
  aisles: number,
  shelvesPerAisle: number,
  binsPerShelf: number
): number {
  return aisles * shelvesPerAisle * binsPerShelf;
}

/**
 * Formata um número de bin para exibição amigável
 */
export function formatBinPosition(
  position: string,
  direction: 'BOTTOM_UP' | 'TOP_DOWN'
): string {
  const positionNumber = position.charCodeAt(0) - 64; // A=1, B=2, etc

  if (direction.toUpperCase() === 'BOTTOM_UP') {
    const labels = [
      'inferior',
      '2º de baixo',
      '3º de baixo',
      '4º de baixo',
      'superior',
    ];
    if (positionNumber === 1) return 'inferior';
    if (positionNumber <= 4) return `${positionNumber}º de baixo p/ cima`;
    return 'superior';
  } else {
    if (positionNumber === 1) return 'superior';
    return `${positionNumber}º de cima p/ baixo`;
  }
}

/**
 * Gera uma amostra de endereços para preview com corredores independentes
 *
 * @param warehouseCode - Código do armazém
 * @param zoneCode - Código da zona
 * @param aisles - Array de configurações de corredores independentes
 * @param pattern - Padrão de código
 * @returns Array com endereços de amostra (primeiro, meio e último)
 */
export function generateSampleAddressesFromAisles(
  warehouseCode: string,
  zoneCode: string,
  aisles: AisleConfig[],
  pattern: CodePattern
): string[] {
  if (aisles.length === 0) return [];

  const samples: string[] = [];

  // Primeiro endereço (primeiro corredor, primeira prateleira, primeiro nicho)
  const firstAisle = aisles[0];
  const firstBin = generateBinLabel(
    0,
    pattern.binLabeling,
    pattern.binDirection,
    firstAisle.binsPerShelf
  );
  samples.push(
    generateAddress(
      {
        warehouseCode,
        zoneCode,
        aisle: firstAisle.aisleNumber,
        shelf: 1,
        bin: firstBin,
      },
      pattern
    )
  );

  // Endereço do meio (corredor do meio, prateleira do meio, nicho do meio)
  if (aisles.length > 1) {
    const midAisleIndex = Math.floor(aisles.length / 2);
    const midAisle = aisles[midAisleIndex];
    const midShelf = Math.ceil(midAisle.shelvesCount / 2);
    const midBinIndex = Math.floor(midAisle.binsPerShelf / 2);
    const midBin = generateBinLabel(
      midBinIndex,
      pattern.binLabeling,
      pattern.binDirection,
      midAisle.binsPerShelf
    );
    samples.push(
      generateAddress(
        {
          warehouseCode,
          zoneCode,
          aisle: midAisle.aisleNumber,
          shelf: midShelf,
          bin: midBin,
        },
        pattern
      )
    );
  }

  // Último endereço (último corredor, última prateleira, último nicho)
  const lastAisle = aisles[aisles.length - 1];
  const lastBin = generateBinLabel(
    lastAisle.binsPerShelf - 1,
    pattern.binLabeling,
    pattern.binDirection,
    lastAisle.binsPerShelf
  );
  samples.push(
    generateAddress(
      {
        warehouseCode,
        zoneCode,
        aisle: lastAisle.aisleNumber,
        shelf: lastAisle.shelvesCount,
        bin: lastBin,
      },
      pattern
    )
  );

  return samples;
}

/**
 * Gera todos os endereços para corredores independentes
 *
 * @param warehouseCode - Código do armazém
 * @param zoneCode - Código da zona
 * @param aisles - Array de configurações de corredores independentes
 * @param pattern - Padrão de código
 * @returns Array com todos os endereços
 */
export function generateAllAddressesFromAisles(
  warehouseCode: string,
  zoneCode: string,
  aisles: AisleConfig[],
  pattern: CodePattern
): string[] {
  const addresses: string[] = [];

  for (const aisle of aisles) {
    for (let shelf = 1; shelf <= aisle.shelvesCount; shelf++) {
      for (let binIndex = 0; binIndex < aisle.binsPerShelf; binIndex++) {
        const bin = generateBinLabel(
          binIndex,
          pattern.binLabeling,
          pattern.binDirection,
          aisle.binsPerShelf
        );

        const address = generateAddress(
          { warehouseCode, zoneCode, aisle: aisle.aisleNumber, shelf, bin },
          pattern
        );

        addresses.push(address);
      }
    }
  }

  return addresses;
}

/**
 * Calcula o total de bins para corredores independentes
 */
export function calculateTotalBinsFromAisles(aisles: AisleConfig[]): number {
  return aisles.reduce(
    (sum, aisle) => sum + aisle.shelvesCount * aisle.binsPerShelf,
    0
  );
}
