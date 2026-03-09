/**
 * Use Queue Printing Hook
 * Hook para gerenciar a geração de PDF e impressão da fila
 * Suporte multi-entidade: stock items e employees
 */

'use client';

import { useCallback, useState } from 'react';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { SYSTEM_LABEL_TEMPLATES, LABEL_AVAILABLE_FIELDS } from '../constants';
import { usePrintQueue } from '../context/print-queue-context';
import type {
  LabelData,
  LabelTemplateDefinition,
  PrintGenerationStatus,
  PrintQueueStockItem,
  PrintQueueEmployeeItem,
} from '../types';
import { calculateLayout } from '../utils/page-layout-calculator';
import {
  resolveLabelData,
  resolveLabelDataFromPresenter,
  labelDataToPreviewData,
  itemLabelDataToPreviewData,
  employeeLabelDataToPreviewData,
} from '../utils/label-data-resolver';
import { parseStudioTemplate } from '../components/studio-label-renderer';
import { renderStudioTemplateToPdf } from '../utils/studio-pdf-renderer';
import { labelTemplatesService } from '@/services/stock/label-templates.service';
import { itemsService } from '@/services/stock/items.service';
import { employeesService } from '@/services/hr/employees.service';
import type { ItemLabelData } from '@/types/stock';
import type { EmployeeLabelData } from '@/types/hr';

interface UseQueuePrintingResult {
  /** Status da geração */
  status: PrintGenerationStatus;

  /** Se está gerando PDF */
  isGenerating: boolean;

  /** Progresso da geração (0-100) */
  progress: number;

  /** Erro se houver */
  error: Error | null;

  /** Gerar PDF e abrir diálogo de impressão */
  printQueue: () => Promise<void>;

  /** Gerar PDF e fazer download */
  downloadPdf: (filename?: string) => Promise<void>;

  /** Gerar PDF e retornar blob */
  generatePdf: () => Promise<Blob | null>;
}

export function useQueuePrinting(): UseQueuePrintingResult {
  const { state, hasItems, totalLabels } = usePrintQueue();
  const [status, setStatus] = useState<PrintGenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const isGenerating = status === 'generating';

  // Gerar PDF
  const generatePdf = useCallback(async (): Promise<Blob | null> => {
    if (!hasItems) {
      toast.error('Nenhum item na fila');
      return null;
    }

    let template: LabelTemplateDefinition | undefined =
      SYSTEM_LABEL_TEMPLATES.find(t => t.id === state.selectedTemplateId);

    // Fallback to stored dimensions for API templates
    if (!template && state.selectedTemplateDimensions) {
      template = {
        id: state.selectedTemplateId,
        name: '',
        dimensions: state.selectedTemplateDimensions,
        isSystem: false,
        availableFields: LABEL_AVAILABLE_FIELDS,
        createdAt: new Date(),
      };
    }

    if (!template) {
      toast.error('Template nao encontrado');
      return null;
    }

    setStatus('generating');
    setProgress(0);
    setError(null);

    try {
      // 1. Try to fetch Studio template from API (for non-system templates)
      setProgress(5);
      let studioTemplateData = null;
      const isSystemTemplate = SYSTEM_LABEL_TEMPLATES.some(
        t => t.id === state.selectedTemplateId
      );

      if (!isSystemTemplate) {
        try {
          const response = await labelTemplatesService.getTemplate(
            state.selectedTemplateId
          );
          studioTemplateData = parseStudioTemplate(
            response.template.grapesJsData
          );
        } catch (e) {
          logger.warn(
            'Could not fetch template detail, using legacy renderer',
            { error: e }
          );
        }
      }

      // 2. Separar itens por tipo de entidade
      setProgress(10);
      const stockItems = state.items.filter(
        (qi): qi is PrintQueueStockItem => qi.entityType === 'stock-item'
      );
      const employeeItems = state.items.filter(
        (qi): qi is PrintQueueEmployeeItem => qi.entityType === 'employee'
      );

      // 3. Buscar dados do presenter para cada tipo
      const stockLabelDataMap = new Map<string, ItemLabelData>();
      const employeeLabelDataMap = new Map<string, EmployeeLabelData>();

      // Fetch stock item label data
      if (stockItems.length > 0) {
        const stockIds = [...new Set(stockItems.map(qi => qi.item.id))];
        try {
          const response = await itemsService.getLabelData(stockIds);
          for (const ld of response.labelData) {
            stockLabelDataMap.set(ld.item.id, ld);
          }
        } catch (e) {
          logger.warn(
            '[print] Stock label data presenter failed, falling back to legacy',
            { error: e }
          );
        }
      }

      // Fetch employee label data
      if (employeeItems.length > 0) {
        const empIds = [...new Set(employeeItems.map(qi => qi.employee.id))];
        try {
          const response = await employeesService.getLabelData(empIds);
          for (const ld of response.labelData) {
            employeeLabelDataMap.set(ld.employee.id, ld);
          }
        } catch (e) {
          logger.warn('[print] Employee label data presenter failed', {
            error: e,
          });
        }
      }

      setProgress(20);

      // 4. Montar previewData para todos os items (studio path)
      if (studioTemplateData) {
        const previewDataList: Array<{
          previewData: Record<string, unknown>;
          copies: number;
          entityId: string;
        }> = [];

        // Stock items
        for (const queueItem of stockItems) {
          const ld = stockLabelDataMap.get(queueItem.item.id);
          if (ld) {
            previewDataList.push({
              previewData: itemLabelDataToPreviewData(ld),
              copies: queueItem.copies,
              entityId: queueItem.item.id,
            });
          } else {
            const data = resolveLabelData(
              queueItem.item,
              queueItem.variant,
              queueItem.product
            );
            previewDataList.push({
              previewData: labelDataToPreviewData(data),
              copies: queueItem.copies,
              entityId: queueItem.item.id,
            });
          }
        }

        // Employee items
        for (const queueItem of employeeItems) {
          const ld = employeeLabelDataMap.get(queueItem.employee.id);
          if (ld) {
            previewDataList.push({
              previewData: employeeLabelDataToPreviewData(ld),
              copies: queueItem.copies,
              entityId: queueItem.employee.id,
            });
          }
        }

        // Build flat LabelData list for layout calculator (uses stock-item defaults for employees as placeholder)
        const labelDataList: LabelData[] = [];
        for (const queueItem of stockItems) {
          const ld = stockLabelDataMap.get(queueItem.item.id);
          const data = ld
            ? resolveLabelDataFromPresenter(ld)
            : resolveLabelData(
                queueItem.item,
                queueItem.variant,
                queueItem.product
              );
          for (let i = 0; i < queueItem.copies; i++) {
            labelDataList.push(data);
          }
        }
        // For employees, create placeholder LabelData for layout calculation
        for (const queueItem of employeeItems) {
          const ld = employeeLabelDataMap.get(queueItem.employee.id);
          const placeholderData: LabelData = {
            manufacturerName: '',
            stockLocation: '',
            productName: ld
              ? ld.employee.socialName || ld.employee.fullName
              : queueItem.employee.fullName,
            productCode: '',
            variantName: '',
            variantCode: '',
            itemCode: ld
              ? ld.employee.registrationNumber
              : queueItem.employee.registrationNumber,
            itemUid: queueItem.employee.id,
            itemId: queueItem.employee.id,
            itemQuantity: 0,
            itemUnitOfMeasure: '',
            productVariantName: '',
            referenceVariantName: '',
            productAttributes: {},
            variantAttributes: {},
            itemAttributes: {},
            barcodeData: ld
              ? ld.employee.registrationNumber
              : queueItem.employee.registrationNumber,
            qrCodeData: queueItem.employee.id,
          };
          for (let i = 0; i < queueItem.copies; i++) {
            labelDataList.push(placeholderData);
          }
        }

        setProgress(30);

        // 5. Calcular layout
        const layout = calculateLayout(
          labelDataList,
          template,
          state.pageSettings
        );
        setProgress(50);

        // 6. Gerar PDF usando jsPDF
        const { jsPDF } = await import('jspdf');
        const JsBarcode = (await import('jsbarcode')).default;
        const QRCode = await import('qrcode');

        const doc = new jsPDF({
          orientation: state.pageSettings.orientation,
          unit: 'mm',
          format:
            state.pageSettings.paperSize === 'CUSTOM'
              ? [
                  state.pageSettings.customDimensions?.width || 210,
                  state.pageSettings.customDimensions?.height || 297,
                ]
              : state.pageSettings.paperSize.toLowerCase(),
        });

        setProgress(60);

        // Build a map from entity ID to previewData for quick lookup
        const previewDataByEntityId = new Map<
          string,
          Record<string, unknown>
        >();
        for (const { previewData, entityId } of previewDataList) {
          previewDataByEntityId.set(entityId, previewData);
        }

        // 7. Renderizar cada página - studio path
        for (let pageIndex = 0; pageIndex < layout.pages.length; pageIndex++) {
          if (pageIndex > 0) doc.addPage();

          const page = layout.pages[pageIndex];

          for (const { position, data } of page.labels) {
            // Find matching previewData by item ID (itemId stores entityId for employees too)
            const previewData =
              previewDataByEntityId.get(data.itemId) ||
              labelDataToPreviewData(data);

            await renderStudioTemplateToPdf(
              doc,
              studioTemplateData,
              previewData,
              position.x,
              position.y,
              JsBarcode,
              QRCode
            );
          }

          setProgress(60 + Math.round((pageIndex / layout.pages.length) * 30));
        }

        setProgress(95);
        const blob = doc.output('blob');

        setProgress(100);
        setStatus('success');
        return blob;
      } else {
        // === LEGACY PATH (system templates or presenter failed) ===
        // Note: Legacy path only handles stock items meaningfully
        const labelDataList: LabelData[] = [];

        for (const queueItem of stockItems) {
          const ld = stockLabelDataMap.get(queueItem.item.id);
          const data = ld
            ? resolveLabelDataFromPresenter(ld)
            : resolveLabelData(
                queueItem.item,
                queueItem.variant,
                queueItem.product
              );
          for (let i = 0; i < queueItem.copies; i++) {
            labelDataList.push(data);
          }
        }

        // Employees in legacy path: basic label with name and code
        for (const queueItem of employeeItems) {
          const ld = employeeLabelDataMap.get(queueItem.employee.id);
          const placeholderData: LabelData = {
            manufacturerName: '',
            stockLocation: '',
            productName: ld
              ? ld.employee.socialName || ld.employee.fullName
              : queueItem.employee.fullName,
            productCode: '',
            variantName: ld?.position?.name || '',
            variantCode: '',
            itemCode: ld
              ? ld.employee.registrationNumber
              : queueItem.employee.registrationNumber,
            itemUid: queueItem.employee.id,
            itemId: queueItem.employee.id,
            itemQuantity: 0,
            itemUnitOfMeasure: '',
            productVariantName: '',
            referenceVariantName: '',
            productAttributes: {},
            variantAttributes: {},
            itemAttributes: {},
            barcodeData: ld
              ? ld.employee.registrationNumber
              : queueItem.employee.registrationNumber,
            qrCodeData: queueItem.employee.id,
          };
          for (let i = 0; i < queueItem.copies; i++) {
            labelDataList.push(placeholderData);
          }
        }

        setProgress(30);

        // 4. Calcular layout
        const layout = calculateLayout(
          labelDataList,
          template,
          state.pageSettings
        );
        setProgress(50);

        // 5. Gerar PDF usando jsPDF
        const { jsPDF } = await import('jspdf');
        const JsBarcode = (await import('jsbarcode')).default;
        const QRCode = await import('qrcode');

        const doc = new jsPDF({
          orientation: state.pageSettings.orientation,
          unit: 'mm',
          format:
            state.pageSettings.paperSize === 'CUSTOM'
              ? [
                  state.pageSettings.customDimensions?.width || 210,
                  state.pageSettings.customDimensions?.height || 297,
                ]
              : state.pageSettings.paperSize.toLowerCase(),
        });

        setProgress(60);

        // 6. Renderizar cada página - legacy path
        for (let pageIndex = 0; pageIndex < layout.pages.length; pageIndex++) {
          if (pageIndex > 0) doc.addPage();

          const page = layout.pages[pageIndex];

          for (const { position, data } of page.labels) {
            if (studioTemplateData) {
              const previewData = labelDataToPreviewData(data);
              await renderStudioTemplateToPdf(
                doc,
                studioTemplateData,
                previewData,
                position.x,
                position.y,
                JsBarcode,
                QRCode
              );
            } else {
              await renderLabelToPdf(
                doc,
                data,
                position,
                template,
                JsBarcode,
                QRCode
              );
            }
          }

          setProgress(60 + Math.round((pageIndex / layout.pages.length) * 30));
        }

        setProgress(95);
        const blob = doc.output('blob');

        setProgress(100);
        setStatus('success');
        return blob;
      }
    } catch (err) {
      logger.error('Erro ao gerar PDF', err instanceof Error ? err : undefined);
      setError(err as Error);
      setStatus('error');
      toast.error('Erro ao gerar PDF');
      return null;
    }
  }, [hasItems, state, totalLabels]);

  // Imprimir
  const printQueue = useCallback(async () => {
    const blob = await generatePdf();
    if (!blob) return;

    // Abrir em nova aba para impressão
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');

    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      // Fallback se popup bloqueado
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.click();
    }

    // Limpar URL após um tempo
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }, [generatePdf]);

  // Download
  const downloadPdf = useCallback(
    async (filename: string = 'etiquetas.pdf') => {
      const blob = await generatePdf();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('PDF gerado com sucesso');
    },
    [generatePdf]
  );

  return {
    status,
    isGenerating,
    progress,
    error,
    printQueue,
    downloadPdf,
    generatePdf,
  };
}

// ============================================
// HELPER: RENDER LABEL TO PDF (legacy)
// ============================================

async function renderLabelToPdf(
  doc: import('jspdf').jsPDF,
  data: LabelData,
  position: { x: number; y: number; width: number; height: number },
  _template: LabelTemplateDefinition,
  JsBarcode: (canvas: HTMLCanvasElement, data: string, options: Record<string, unknown>) => void,
  QRCode: typeof import('qrcode')
) {
  const { x, y, width, height } = position;
  const padding = 2;
  const contentX = x + padding;
  const contentY = y + padding;
  const contentWidth = width - padding * 2;
  const contentHeight = height - padding * 2;

  // Definir fonte
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');

  const isSmall = width <= 35;
  const isLarge = width >= 80;

  if (isSmall) {
    // Layout pequeno
    doc.setFontSize(5);
    doc.text(data.itemCode.slice(0, 12), contentX, contentY + 3);
    doc.text(data.stockLocation.slice(0, 10), contentX, contentY + 6);

    // Barcode pequeno
    try {
      const barcodeCanvas = document.createElement('canvas');
      JsBarcode(barcodeCanvas, data.barcodeData, {
        format: 'CODE128',
        width: 1,
        height: 10,
        displayValue: false,
        margin: 0,
      });
      const barcodeDataUrl = barcodeCanvas.toDataURL('image/png');
      doc.addImage(
        barcodeDataUrl,
        'PNG',
        contentX,
        contentY + 8,
        contentWidth,
        8
      );
    } catch (e) {
      logger.error('Erro ao gerar barcode', e instanceof Error ? e : undefined);
    }
  } else if (isLarge) {
    // Layout grande
    doc.setFontSize(6);

    // Manufacturer
    if (data.manufacturerName) {
      doc.setTextColor(128, 128, 128);
      doc.text(data.manufacturerName.slice(0, 30), contentX, contentY + 4);
    }

    // Product name
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(data.productName.slice(0, 25), contentX, contentY + 9);

    // Variant
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(data.variantName.slice(0, 25), contentX, contentY + 14);

    // Reference
    if (data.variantReference) {
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      doc.text(`Ref: ${data.variantReference}`, contentX, contentY + 18);
    }

    // Location & Quantity
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text(data.stockLocation, contentX, contentY + contentHeight - 4);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    const qtyText = `${data.itemQuantity} ${data.itemUnitOfMeasure}`;
    doc.text(
      qtyText,
      contentX + contentWidth - doc.getTextWidth(qtyText),
      contentY + contentHeight - 4
    );

    // QR Code
    try {
      const qrDataUrl = await QRCode.toDataURL(data.qrCodeData, {
        width: 80,
        margin: 0,
      });
      const qrSize = Math.min(contentHeight - 10, 25);
      doc.addImage(
        qrDataUrl,
        'PNG',
        contentX + contentWidth - qrSize - 2,
        contentY + 2,
        qrSize,
        qrSize
      );
    } catch (e) {
      logger.error('Erro ao gerar QR code', e instanceof Error ? e : undefined);
    }

    // Item code
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(
      data.itemCode,
      contentX + contentWidth - 2,
      contentY + contentHeight - 10,
      { align: 'right' }
    );
  } else {
    // Layout médio
    doc.setFontSize(6);

    // Product name
    doc.setFont('helvetica', 'bold');
    doc.text(data.productName.slice(0, 20), contentX, contentY + 4);

    // Location
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const locationText = data.stockLocation.slice(0, 10);
    doc.text(
      locationText,
      contentX + contentWidth - doc.getTextWidth(locationText),
      contentY + 4
    );

    // Variant
    doc.setTextColor(80, 80, 80);
    doc.text(data.variantName.slice(0, 20), contentX, contentY + 8);

    // Barcode
    try {
      const barcodeCanvas = document.createElement('canvas');
      JsBarcode(barcodeCanvas, data.barcodeData, {
        format: 'CODE128',
        width: 1,
        height: 15,
        displayValue: false,
        margin: 0,
      });
      const barcodeDataUrl = barcodeCanvas.toDataURL('image/png');
      doc.addImage(
        barcodeDataUrl,
        'PNG',
        contentX,
        contentY + 10,
        contentWidth,
        10
      );
    } catch (e) {
      logger.error('Erro ao gerar barcode', e instanceof Error ? e : undefined);
    }

    // Item code & Quantity
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(5);
    doc.text(
      data.itemCode.slice(0, 15),
      contentX,
      contentY + contentHeight - 1
    );
    const qtyText = `${data.itemQuantity} ${data.itemUnitOfMeasure}`;
    doc.text(
      qtyText,
      contentX + contentWidth - doc.getTextWidth(qtyText),
      contentY + contentHeight - 1
    );
  }
}
