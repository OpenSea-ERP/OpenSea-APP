/**
 * Studio PDF Renderer
 * Renderiza elementos de um LabelStudioTemplate diretamente no jsPDF
 */

import { logger } from '@/lib/logger';
import type {
  BarcodeElement,
  FieldElement,
  LabelStudioTemplate,
  LineElement,
  QRCodeElement,
  ShapeElement,
  TableCell,
  TableElement,
  TextElement,
  TextStyle,
} from '@/core/print-queue/editor';

// ============================================
// HELPERS
// ============================================

function hexToRgb(hex: string | undefined | null): {
  r: number;
  g: number;
  b: number;
} {
  if (!hex || typeof hex !== 'string') return { r: 0, g: 0, b: 0 };
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return { r, g, b };
}

function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function mmToPt(mm: number): number {
  return mm * 2.83465; // 1mm = 2.83465pt
}

/**
 * Garante defaults para todas as propriedades de TextStyle
 */
function safeStyle(style: Partial<TextStyle> | undefined | null): TextStyle {
  return {
    fontFamily: style?.fontFamily ?? 'Arial',
    fontSize: style?.fontSize ?? 3,
    fontWeight: style?.fontWeight ?? 'normal',
    fontStyle: style?.fontStyle ?? 'normal',
    textDecoration: style?.textDecoration ?? 'none',
    color: style?.color ?? '#000000',
    textAlign: style?.textAlign ?? 'left',
    verticalAlign: style?.verticalAlign ?? 'top',
    lineHeight: style?.lineHeight ?? 1.2,
    letterSpacing: style?.letterSpacing ?? 0,
    textTransform: style?.textTransform ?? 'none',
  };
}

/**
 * Resolve o valor de um campo field para PDF
 */
function resolveFieldValue(
  fieldConfig: FieldElement['fieldConfig'],
  previewData: Record<string, unknown>
): string {
  if (!fieldConfig) return '';

  switch (fieldConfig.type) {
    case 'simple':
      if (fieldConfig.dataPath) {
        const value = resolvePath(previewData, fieldConfig.dataPath);
        if (value != null) return String(value);
      }
      return '';

    case 'composite':
      if (fieldConfig.template) {
        return fieldConfig.template.replace(
          /\{([^}]+)\}/g,
          (_, path: string) => {
            const value = resolvePath(previewData, path);
            if (value != null) return String(value);
            return '';
          }
        );
      }
      return '';

    case 'conditional':
      if (fieldConfig.conditions) {
        const primary = resolvePath(
          previewData,
          fieldConfig.conditions.primary
        );
        if (primary) return String(primary);
        for (const fallback of fieldConfig.conditions.fallbacks) {
          const value = resolvePath(previewData, fallback);
          if (value) return String(value);
        }
      }
      return '';

    case 'calculated':
      if (fieldConfig.formula) {
        return `= ${fieldConfig.formula}`;
      }
      return '';

    default:
      return '';
  }
}

/**
 * Resolve conteúdo de célula de tabela
 */
function resolveTableCellContent(
  cellData: TableCell,
  previewData: Record<string, unknown>
): string {
  if (cellData.type === 'text') {
    return cellData.content || '';
  }

  // type === 'field'
  const fieldType = cellData.fieldType || 'simple';

  switch (fieldType) {
    case 'simple':
      if (cellData.dataPath) {
        const value = resolvePath(previewData, cellData.dataPath);
        if (value != null) return String(value);
      }
      return '';

    case 'composite':
      if (cellData.template) {
        return cellData.template.replace(/\{([^}]+)\}/g, (_, path: string) => {
          const value = resolvePath(previewData, path);
          if (value != null) return String(value);
          return '';
        });
      }
      return '';

    case 'conditional':
      if (cellData.conditions) {
        const primary = resolvePath(previewData, cellData.conditions.primary);
        if (primary) return String(primary);
        for (const fallback of cellData.conditions.fallbacks) {
          const value = resolvePath(previewData, fallback);
          if (value) return String(value);
        }
      }
      return '';

    case 'calculated':
      if (cellData.formula) return `= ${cellData.formula}`;
      return '';

    default:
      return '';
  }
}

/**
 * Resolve o valor do barcode
 */
function resolveBarcodeValue(
  config: BarcodeElement['barcodeConfig'],
  previewData: Record<string, unknown>
): string {
  switch (config.source) {
    case 'custom':
      return config.customValue || '123456789';
    case 'field':
      if (config.dataPath) {
        const value = resolvePath(previewData, config.dataPath);
        if (value) return String(value);
      }
      return '0000000000000';
    case 'composite':
      if (config.template) {
        return config.template.replace(/\{([^}]+)\}/g, (_, path: string) => {
          const value = resolvePath(previewData, path);
          return value ? String(value) : '000';
        });
      }
      return '0000000000000';
    default:
      return '0000000000000';
  }
}

/**
 * Resolve o conteúdo do QR code
 */
function resolveQRContent(
  config: QRCodeElement['qrConfig'],
  previewData: Record<string, unknown>
): string {
  switch (config.contentType) {
    case 'field':
      if (config.dataPath) {
        const value = resolvePath(previewData, config.dataPath);
        if (value) return String(value);
      }
      return 'ITM-2024-001';
    case 'composite':
      if (config.template) {
        return config.template.replace(/\{([^}]+)\}/g, (_, path: string) => {
          const value = resolvePath(previewData, path);
          return value ? String(value) : 'exemplo';
        });
      }
      return 'composicao';
    case 'url':
      if (config.urlBase) {
        const param = config.urlParam
          ? String(resolvePath(previewData, config.urlParam) || 'ITM-001')
          : 'ITM-001';
        return `${config.urlBase}${param}`;
      }
      return 'https://example.com';
    case 'vcard':
      if (config.vcard) {
        const { name, phone, email } = config.vcard;
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          name ? `FN:${name}` : 'FN:Nome',
          phone ? `TEL:${phone}` : '',
          email ? `EMAIL:${email}` : '',
          'END:VCARD',
        ]
          .filter(Boolean)
          .join('\n');
      }
      return 'QR Code';
    case 'custom':
      return config.customValue || 'QR Code';
    default:
      return 'QR Code';
  }
}

/**
 * Aplica estilo de texto no jsPDF com defaults seguros
 */
function applyTextStyle(doc: import('jspdf').jsPDF, style: TextStyle) {
  const fontSize = style.fontSize || 3;
  doc.setFontSize(mmToPt(fontSize));

  let jsFontStyle: string;
  if (style.fontWeight === 'bold' && style.fontStyle === 'italic') {
    jsFontStyle = 'bolditalic';
  } else if (style.fontWeight === 'bold') {
    jsFontStyle = 'bold';
  } else if (style.fontStyle === 'italic') {
    jsFontStyle = 'italic';
  } else {
    jsFontStyle = 'normal';
  }
  doc.setFont('helvetica', jsFontStyle);

  const color = hexToRgb(style.color);
  doc.setTextColor(color.r, color.g, color.b);
}

/**
 * Renderiza texto em uma posição do PDF
 * Usa doc.text() SEM options object para máxima compatibilidade com jsPDF
 */
function renderText(
  doc: import('jspdf').jsPDF,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  rawStyle: TextStyle | Partial<TextStyle> | undefined
) {
  if (!text) return;

  const style = safeStyle(rawStyle);
  applyTextStyle(doc, style);

  // Aplicar text transform
  let processedText = text;
  if (style.textTransform === 'uppercase') processedText = text.toUpperCase();
  else if (style.textTransform === 'lowercase')
    processedText = text.toLowerCase();
  else if (style.textTransform === 'capitalize') {
    processedText = text.replace(/\b\w/g, c => c.toUpperCase());
  }

  // Calcular posição Y baseado no alinhamento vertical
  const fontSizeMm = style.fontSize || 3;
  let textY: number;
  if (style.verticalAlign === 'middle') {
    textY = y + h / 2 + fontSizeMm * 0.35;
  } else if (style.verticalAlign === 'bottom') {
    textY = y + h - fontSizeMm * 0.3;
  } else {
    // top
    textY = y + fontSizeMm;
  }

  // Calcular posição X baseado no alinhamento horizontal
  // Usar doc.text() sem options para left-aligned, com align para center/right
  if (style.textAlign === 'center') {
    doc.text(processedText, x + w / 2, textY, { align: 'center', maxWidth: w });
  } else if (style.textAlign === 'right') {
    doc.text(processedText, x + w, textY, { align: 'right', maxWidth: w });
  } else {
    // Left aligned - call without align option for maximum compatibility
    doc.text(processedText, x, textY, { maxWidth: w });
  }
}

// ============================================
// TABLE RENDERING
// ============================================

/**
 * Calcula larguras de colunas da tabela em mm
 */
function calculateColumnWidthsMm(
  widths: (number | 'auto')[],
  totalWidth: number,
  columns: number
): number[] {
  const result: number[] = [];
  let autoCount = 0;
  let fixedTotal = 0;

  for (let i = 0; i < columns; i++) {
    const w = widths[i] ?? 'auto';
    if (w === 'auto') {
      autoCount++;
    } else {
      fixedTotal += w;
    }
  }

  const autoWidth = autoCount > 0 ? (totalWidth - fixedTotal) / autoCount : 0;

  for (let i = 0; i < columns; i++) {
    const w = widths[i] ?? 'auto';
    result.push(w === 'auto' ? autoWidth : w);
  }

  return result;
}

/**
 * Calcula alturas das linhas da tabela em mm
 */
function calculateRowHeightsMm(
  heights: (number | 'auto')[],
  totalHeight: number,
  rows: number
): number[] {
  const result: number[] = [];
  let autoCount = 0;
  let fixedTotal = 0;

  for (let i = 0; i < rows; i++) {
    const h = heights[i] ?? 'auto';
    if (h === 'auto') {
      autoCount++;
    } else {
      fixedTotal += h;
    }
  }

  const autoHeight = autoCount > 0 ? (totalHeight - fixedTotal) / autoCount : 0;

  for (let i = 0; i < rows; i++) {
    const h = heights[i] ?? 'auto';
    result.push(h === 'auto' ? autoHeight : h);
  }

  return result;
}

/**
 * Verifica se uma célula está oculta por merge
 */
function isCellHiddenByMerge(
  row: number,
  col: number,
  mergedCells: Array<{
    startRow: number;
    startCol: number;
    rowSpan: number;
    colSpan: number;
  }>
): boolean {
  for (const merge of mergedCells) {
    if (row === merge.startRow && col === merge.startCol) continue;
    if (
      row >= merge.startRow &&
      row < merge.startRow + merge.rowSpan &&
      col >= merge.startCol &&
      col < merge.startCol + merge.colSpan
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Desenha uma linha de borda no PDF
 */
function drawBorderLine(
  doc: import('jspdf').jsPDF,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  border: { width: number; style: string; color: string } | undefined
) {
  if (!border || border.style === 'none' || border.width <= 0) return;
  const bc = hexToRgb(border.color);
  doc.setDrawColor(bc.r, bc.g, bc.b);
  doc.setLineWidth(border.width * 0.265);
  doc.line(x1, y1, x2, y2);
}

/**
 * Renderiza uma tabela no PDF com suporte correto a células mescladas
 */
function renderTableToPdf(
  doc: import('jspdf').jsPDF,
  tableEl: TableElement,
  x: number,
  y: number,
  previewData: Record<string, unknown>
) {
  const { tableConfig, cells, width, height } = tableEl;
  const {
    rows,
    columns,
    mergedCells: merges,
    borders,
    cellPadding,
  } = tableConfig;
  const mergedCells = merges || [];

  const colWidths = calculateColumnWidthsMm(
    tableConfig.columnWidths,
    width,
    columns
  );
  const rowHeights = calculateRowHeightsMm(
    tableConfig.rowHeights,
    height,
    rows
  );

  const padding = cellPadding || 0.5;

  // Posições acumuladas
  const colPositions: number[] = [0];
  for (let i = 0; i < columns; i++) {
    colPositions.push(colPositions[i] + colWidths[i]);
  }
  const rowPositions: number[] = [0];
  for (let i = 0; i < rows; i++) {
    rowPositions.push(rowPositions[i] + rowHeights[i]);
  }

  // Calcular tamanho real de cada célula visível (respeitando merges)
  function getCellBounds(row: number, col: number) {
    const merge = mergedCells.find(
      m => m.startRow === row && m.startCol === col
    );
    const rowSpan = merge?.rowSpan || 1;
    const colSpan = merge?.colSpan || 1;

    let cellWidth = 0;
    for (let i = col; i < col + colSpan && i < columns; i++)
      cellWidth += colWidths[i];
    let cellHeight = 0;
    for (let i = row; i < row + rowSpan && i < rows; i++)
      cellHeight += rowHeights[i];

    return {
      cellX: x + colPositions[col],
      cellY: y + rowPositions[row],
      cellWidth,
      cellHeight,
      rowSpan,
      colSpan,
    };
  }

  // Desenhar bordas por célula (respeita merges)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (isCellHiddenByMerge(row, col, mergedCells)) continue;

      const { cellX, cellY, cellWidth, cellHeight, rowSpan, colSpan } =
        getCellBounds(row, col);

      const isTopEdge = row === 0;
      const isBottomEdge = row + rowSpan >= rows;
      const isLeftEdge = col === 0;
      const isRightEdge = col + colSpan >= columns;

      // Top border
      drawBorderLine(
        doc,
        cellX,
        cellY,
        cellX + cellWidth,
        cellY,
        isTopEdge ? borders?.external : borders?.internalHorizontal
      );
      // Bottom border
      drawBorderLine(
        doc,
        cellX,
        cellY + cellHeight,
        cellX + cellWidth,
        cellY + cellHeight,
        isBottomEdge ? borders?.external : borders?.internalHorizontal
      );
      // Left border
      drawBorderLine(
        doc,
        cellX,
        cellY,
        cellX,
        cellY + cellHeight,
        isLeftEdge ? borders?.external : borders?.internalVertical
      );
      // Right border
      drawBorderLine(
        doc,
        cellX + cellWidth,
        cellY,
        cellX + cellWidth,
        cellY + cellHeight,
        isRightEdge ? borders?.external : borders?.internalVertical
      );
    }
  }

  // Renderizar conteúdo das células
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (isCellHiddenByMerge(row, col, mergedCells)) continue;

      const cellData = cells.find(c => c.row === row && c.col === col);
      if (!cellData) continue;

      const { cellX, cellY, cellWidth, cellHeight } = getCellBounds(row, col);

      const contentX = cellX + padding;
      const contentW = cellWidth - padding * 2;

      // Background da célula
      if (cellData.backgroundColor) {
        const bg = hexToRgb(cellData.backgroundColor);
        doc.setFillColor(bg.r, bg.g, bg.b);
        doc.rect(cellX, cellY, cellWidth, cellHeight, 'F');
      }

      // Resolver conteúdo
      const content = resolveTableCellContent(cellData, previewData);
      if (!content) continue;

      // Estilo da célula
      const cellStyle = safeStyle(cellData.style);
      if (!cellData.style?.fontSize) {
        cellStyle.fontSize = 2.5;
      }

      // Renderizar label se habilitado
      if (cellData.label?.enabled && cellData.type === 'field') {
        const labelText = cellData.label.text || '';
        if (labelText) {
          const labelFontSize =
            cellData.label.style?.fontSize || cellStyle.fontSize * 0.75;
          const labelStyle = safeStyle({
            fontSize: labelFontSize,
            fontWeight:
              (cellData.label.style?.fontWeight as TextStyle['fontWeight']) ||
              'bold',
            color: cellData.label.style?.color || '#666666',
            textAlign: cellStyle.textAlign,
          });

          if (cellData.label.position !== 'left') {
            const labelH = labelFontSize * 1.5;
            renderText(
              doc,
              labelText,
              contentX,
              cellY,
              contentW,
              labelH,
              labelStyle
            );
            renderText(
              doc,
              content,
              contentX,
              cellY + labelH,
              contentW,
              cellHeight - labelH,
              cellStyle
            );
          } else {
            const labelW = contentW * 0.35;
            renderText(
              doc,
              labelText,
              contentX,
              cellY,
              labelW,
              cellHeight,
              labelStyle
            );
            renderText(
              doc,
              content,
              contentX + labelW,
              cellY,
              contentW - labelW,
              cellHeight,
              cellStyle
            );
          }
        } else {
          renderText(
            doc,
            content,
            contentX,
            cellY,
            contentW,
            cellHeight,
            cellStyle
          );
        }
      } else {
        renderText(
          doc,
          content,
          contentX,
          cellY,
          contentW,
          cellHeight,
          cellStyle
        );
      }
    }
  }
}

// ============================================
// MAIN RENDER FUNCTION
// ============================================

/**
 * Renderiza um template do Label Studio em uma posição específica do jsPDF
 */
export async function renderStudioTemplateToPdf(
  doc: import('jspdf').jsPDF,
  template: LabelStudioTemplate,
  previewData: Record<string, unknown>,
  offsetX: number,
  offsetY: number,
  JsBarcode: (canvas: HTMLCanvasElement, data: string, options: Record<string, unknown>) => void,
  QRCode: typeof import('qrcode')
) {
  // Desenhar fundo do canvas se não for branco
  if (
    template.canvas?.backgroundColor &&
    template.canvas.backgroundColor !== '#ffffff'
  ) {
    const bg = hexToRgb(template.canvas.backgroundColor);
    doc.setFillColor(bg.r, bg.g, bg.b);
    doc.rect(offsetX, offsetY, template.width, template.height, 'F');
  }

  const elements = template.elements
    .filter(el => el.visible !== false)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const element of elements) {
    const x = offsetX + element.x;
    const y = offsetY + element.y;
    const w = element.width;
    const h = element.height;

    try {
      switch (element.type) {
        case 'text': {
          const textEl = element as TextElement;
          renderText(doc, textEl.content || '', x, y, w, h, textEl.style);
          break;
        }

        case 'field': {
          const fieldEl = element as FieldElement;
          const value = resolveFieldValue(fieldEl.fieldConfig, previewData);
          const valueStyle = safeStyle(fieldEl.valueStyle);

          if (fieldEl.label?.enabled) {
            const labelText = fieldEl.label.text || '';

            const labelFontSize =
              fieldEl.label.style?.fontSize || valueStyle.fontSize * 0.75;
            const labelStyle = safeStyle({
              fontFamily:
                fieldEl.label.style?.fontFamily || valueStyle.fontFamily,
              fontSize: labelFontSize,
              fontWeight:
                (fieldEl.label.style?.fontWeight as TextStyle['fontWeight']) ||
                'bold',
              fontStyle:
                (fieldEl.label.style?.fontStyle as TextStyle['fontStyle']) ||
                'normal',
              color: fieldEl.label.style?.color || '#666666',
              textAlign: valueStyle.textAlign,
            });

            if (fieldEl.label.position === 'above') {
              const labelH = labelFontSize * 1.5;
              if (labelText) {
                renderText(doc, labelText, x, y, w, labelH, labelStyle);
              }
              renderText(
                doc,
                value,
                x,
                y + (labelText ? labelH : 0),
                w,
                h - (labelText ? labelH : 0),
                valueStyle
              );
            } else {
              // Label à esquerda
              const labelW = w * 0.35;
              if (labelText) {
                renderText(doc, labelText, x, y, labelW, h, labelStyle);
              }
              renderText(
                doc,
                value,
                x + (labelText ? labelW : 0),
                y,
                w - (labelText ? labelW : 0),
                h,
                valueStyle
              );
            }
          } else {
            renderText(doc, value, x, y, w, h, valueStyle);
          }
          break;
        }

        case 'barcode': {
          const barcodeEl = element as BarcodeElement;
          const barcodeValue = resolveBarcodeValue(
            barcodeEl.barcodeConfig,
            previewData
          );
          const barcodeCanvas = document.createElement('canvas');
          JsBarcode(barcodeCanvas, barcodeValue, {
            format: barcodeEl.barcodeConfig.format || 'CODE128',
            width: 1,
            height: Math.round(h * 3.78),
            displayValue: barcodeEl.barcodeConfig.showText,
            margin: 0,
            background: barcodeEl.barcodeConfig.backgroundColor || '#ffffff',
            lineColor: barcodeEl.barcodeConfig.barColor || '#000000',
          });
          doc.addImage(barcodeCanvas.toDataURL('image/png'), 'PNG', x, y, w, h);
          break;
        }

        case 'qrcode': {
          const qrEl = element as QRCodeElement;
          const qrContent = resolveQRContent(qrEl.qrConfig, previewData);
          const qrDataUrl = await QRCode.toDataURL(qrContent, {
            width: Math.round(Math.min(w, h) * 3.78),
            margin: 0,
            errorCorrectionLevel: qrEl.qrConfig.errorCorrectionLevel || 'M',
            color: {
              dark: qrEl.qrConfig.moduleColor || '#000000',
              light: qrEl.qrConfig.backgroundColor || '#ffffff',
            },
          });
          const size = Math.min(w, h);
          const qrX = x + (w - size) / 2;
          const qrY = y + (h - size) / 2;
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, size, size);
          break;
        }

        case 'shape': {
          const shapeEl = element as ShapeElement;
          const fill = shapeEl.fill || 'transparent';
          const hasFill = fill !== 'transparent' && fill !== 'none';
          const hasStroke =
            shapeEl.stroke &&
            shapeEl.stroke.width > 0 &&
            shapeEl.stroke.style !== 'none';

          if (hasFill) {
            const color = hexToRgb(fill);
            doc.setFillColor(color.r, color.g, color.b);
          }
          if (hasStroke) {
            const color = hexToRgb(shapeEl.stroke.color);
            doc.setDrawColor(color.r, color.g, color.b);
            doc.setLineWidth(shapeEl.stroke.width * 0.265);
          }

          const drawMode =
            hasFill && hasStroke
              ? 'FD'
              : hasFill
                ? 'F'
                : hasStroke
                  ? 'S'
                  : undefined;

          if (drawMode) {
            if (shapeEl.shapeType === 'rectangle') {
              doc.rect(x, y, w, h, drawMode);
            } else if (
              shapeEl.shapeType === 'circle' ||
              shapeEl.shapeType === 'ellipse'
            ) {
              doc.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, drawMode);
            }
          }
          break;
        }

        case 'line': {
          const lineEl = element as LineElement;
          const color = hexToRgb(lineEl.color);
          doc.setDrawColor(color.r, color.g, color.b);
          doc.setLineWidth((lineEl.strokeWidth || 1) * 0.265);

          if (lineEl.orientation === 'horizontal') {
            doc.line(x, y + h / 2, x + w, y + h / 2);
          } else if (lineEl.orientation === 'vertical') {
            doc.line(x + w / 2, y, x + w / 2, y + h);
          } else {
            doc.line(x, y, x + w, y + h);
          }
          break;
        }

        case 'table': {
          const tableEl = element as TableElement;
          renderTableToPdf(doc, tableEl, x, y, previewData);
          break;
        }

        // image, icon, arrow - not rendered in PDF for now
      }
    } catch (e) {
      logger.error(
        `[studio-pdf] Erro ao renderizar elemento ${element.type} (id=${element.id})`,
        e instanceof Error ? e : undefined
      );
    }
  }
}
