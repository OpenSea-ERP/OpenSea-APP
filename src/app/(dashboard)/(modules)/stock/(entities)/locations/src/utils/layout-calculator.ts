// ============================================
// LAYOUT CALCULATOR
// ============================================

import type { ZoneLayout, AislePosition, ZoneStructure } from '@/types/stock';
import { MAP_DEFAULTS } from '../constants';

/**
 * Gera um layout automático para uma zona
 */
export function generateAutoLayout(
  structure: ZoneStructure,
  canvasWidth?: number,
  canvasHeight?: number
): ZoneLayout {
  const { aisles, shelvesPerAisle, binsPerShelf } = structure;

  // Calcular dimensões necessárias
  const aisleWidth = MAP_DEFAULTS.aisleWidth;
  const aisleSpacing = MAP_DEFAULTS.aisleSpacing;
  const binHeight = MAP_DEFAULTS.binHeight;
  const marginX = MAP_DEFAULTS.marginX;
  const marginY = MAP_DEFAULTS.marginY;

  // Altura de uma prateleira (todos os bins + espaçamento)
  const shelfHeight = binsPerShelf * binHeight + MAP_DEFAULTS.shelfSpacing;

  // Altura total de um corredor
  const aisleHeight = shelvesPerAisle * shelfHeight;

  // Dimensões do canvas
  const calculatedWidth =
    marginX * 2 + aisles * aisleWidth + (aisles - 1) * aisleSpacing;
  const calculatedHeight = marginY * 2 + aisleHeight;

  const finalWidth =
    canvasWidth || Math.max(calculatedWidth, MAP_DEFAULTS.canvasWidth);
  const finalHeight =
    canvasHeight || Math.max(calculatedHeight, MAP_DEFAULTS.canvasHeight);

  // Gerar posições dos corredores
  const aislePositions: AislePosition[] = [];

  for (let i = 1; i <= aisles; i++) {
    aislePositions.push({
      aisleNumber: i,
      x: marginX + (i - 1) * (aisleWidth + aisleSpacing),
      y: marginY,
      rotation: 0,
    });
  }

  return {
    aislePositions,
    canvasWidth: finalWidth,
    canvasHeight: finalHeight,
    gridSize: MAP_DEFAULTS.gridSize,
    annotations: [],
    lastModified: new Date().toISOString(),
    isCustom: false,
  };
}

/**
 * Calcula a posição de um bin específico no canvas
 */
export function calculateBinPosition(
  layout: ZoneLayout,
  structure: ZoneStructure,
  aisle: number,
  shelf: number,
  binIndex: number
): { x: number; y: number; width: number; height: number } | null {
  const aislePosition = layout.aislePositions.find(
    a => a.aisleNumber === aisle
  );
  if (!aislePosition) return null;

  const binHeight = MAP_DEFAULTS.binHeight;
  const binWidth = MAP_DEFAULTS.aisleWidth;
  const shelfHeight =
    structure.binsPerShelf * binHeight + MAP_DEFAULTS.shelfSpacing;

  // Calcular posição Y do bin
  const shelfY = aislePosition.y + (shelf - 1) * shelfHeight;

  // Ajustar para direção (BOTTOM_UP ou TOP_DOWN)
  const direction = structure.codePattern.binDirection;
  const adjustedBinIndex =
    direction.toUpperCase() === 'BOTTOM_UP'
      ? structure.binsPerShelf - 1 - binIndex
      : binIndex;

  const binY = shelfY + adjustedBinIndex * binHeight;

  return {
    x: aislePosition.x,
    y: binY,
    width: binWidth,
    height: binHeight,
  };
}

/**
 * Encontra qual bin está em uma posição do canvas
 */
export function findBinAtPosition(
  layout: ZoneLayout,
  structure: ZoneStructure,
  x: number,
  y: number
): { aisle: number; shelf: number; binIndex: number } | null {
  const { shelvesPerAisle, binsPerShelf } = structure;
  const binHeight = MAP_DEFAULTS.binHeight;
  const binWidth = MAP_DEFAULTS.aisleWidth;
  const shelfHeight = binsPerShelf * binHeight + MAP_DEFAULTS.shelfSpacing;

  // Encontrar o corredor
  for (const aislePos of layout.aislePositions) {
    if (x >= aislePos.x && x < aislePos.x + binWidth) {
      // Está dentro deste corredor
      const relativeY = y - aislePos.y;

      if (relativeY < 0) continue;

      // Encontrar a prateleira
      const shelf = Math.floor(relativeY / shelfHeight) + 1;

      if (shelf > shelvesPerAisle) continue;

      // Encontrar o bin
      const shelfStartY = (shelf - 1) * shelfHeight;
      const binRelativeY = relativeY - shelfStartY;
      const binIndex = Math.floor(binRelativeY / binHeight);

      if (binIndex >= binsPerShelf) continue;

      return {
        aisle: aislePos.aisleNumber,
        shelf,
        binIndex,
      };
    }
  }

  return null;
}

/**
 * Move um corredor para uma nova posição
 */
export function moveAisle(
  layout: ZoneLayout,
  aisleNumber: number,
  newX: number,
  newY: number,
  snapToGrid: boolean = true
): ZoneLayout {
  const gridSize = layout.gridSize;

  // Snap to grid se habilitado
  const finalX = snapToGrid ? Math.round(newX / gridSize) * gridSize : newX;
  const finalY = snapToGrid ? Math.round(newY / gridSize) * gridSize : newY;

  return {
    ...layout,
    aislePositions: layout.aislePositions.map(pos =>
      pos.aisleNumber === aisleNumber ? { ...pos, x: finalX, y: finalY } : pos
    ),
    lastModified: new Date().toISOString(),
    isCustom: true,
  };
}

/**
 * Rotaciona um corredor
 */
export function rotateAisle(
  layout: ZoneLayout,
  aisleNumber: number,
  rotation: 0 | 90 | 180 | 270
): ZoneLayout {
  return {
    ...layout,
    aislePositions: layout.aislePositions.map(pos =>
      pos.aisleNumber === aisleNumber ? { ...pos, rotation } : pos
    ),
    lastModified: new Date().toISOString(),
    isCustom: true,
  };
}

/**
 * Calcula os limites do canvas necessários para o layout atual
 */
export function calculateLayoutBounds(
  layout: ZoneLayout,
  structure: ZoneStructure
): { minX: number; minY: number; maxX: number; maxY: number } {
  const { binsPerShelf, shelvesPerAisle } = structure;
  const binHeight = MAP_DEFAULTS.binHeight;
  const binWidth = MAP_DEFAULTS.aisleWidth;
  const shelfHeight = binsPerShelf * binHeight + MAP_DEFAULTS.shelfSpacing;
  const aisleHeight = shelvesPerAisle * shelfHeight;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const aislePos of layout.aislePositions) {
    minX = Math.min(minX, aislePos.x);
    minY = Math.min(minY, aislePos.y);
    maxX = Math.max(maxX, aislePos.x + binWidth);
    maxY = Math.max(maxY, aislePos.y + aisleHeight);
  }

  // Incluir anotações
  for (const annotation of layout.annotations) {
    minX = Math.min(minX, annotation.x);
    minY = Math.min(minY, annotation.y);
    maxX = Math.max(maxX, annotation.x + annotation.width);
    maxY = Math.max(maxY, annotation.y + annotation.height);
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Centraliza o layout no canvas
 */
export function centerLayout(
  layout: ZoneLayout,
  structure: ZoneStructure
): ZoneLayout {
  const bounds = calculateLayoutBounds(layout, structure);
  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;

  const offsetX = (layout.canvasWidth - contentWidth) / 2 - bounds.minX;
  const offsetY = (layout.canvasHeight - contentHeight) / 2 - bounds.minY;

  return {
    ...layout,
    aislePositions: layout.aislePositions.map(pos => ({
      ...pos,
      x: pos.x + offsetX,
      y: pos.y + offsetY,
    })),
    annotations: layout.annotations.map(ann => ({
      ...ann,
      x: ann.x + offsetX,
      y: ann.y + offsetY,
    })),
    lastModified: new Date().toISOString(),
    isCustom: true,
  };
}
