/**
 * Label Data Resolver
 * Resolve dados do Item/Variant/Product para LabelData
 * e converte para previewData usado pelo Label Studio renderer.
 */

import type { EmployeeLabelData } from '@/types/hr';
import type {
  Item,
  ItemLabelData,
  Product,
  Variant,
  TemplateAttribute,
} from '@/types/stock';
import { UNIT_OF_MEASURE_LABELS } from '../constants';
import type { LabelData } from '../types';

// ============================================
// UNIT OF MEASURE HELPERS
// ============================================

const UNIT_OF_MEASURE_FULL_LABELS: Record<string, string> = {
  UNITS: 'unidades',
  KILOGRAMS: 'quilogramas',
  GRAMS: 'gramas',
  LITERS: 'litros',
  MILLILITERS: 'mililitros',
  METERS: 'metros',
  CENTIMETERS: 'centímetros',
  MILLIMETERS: 'milímetros',
  SQUARE_METERS: 'metros quadrados',
  CUBIC_METERS: 'metros cúbicos',
  PIECES: 'peças',
  BOXES: 'caixas',
  PACKAGES: 'pacotes',
  BAGS: 'sacos',
  BOTTLES: 'garrafas',
  CANS: 'latas',
  TUBES: 'tubos',
  ROLLS: 'rolos',
  SHEETS: 'folhas',
  BARS: 'barras',
  COILS: 'bobinas',
  POUNDS: 'libras',
  OUNCES: 'onças',
  GALLONS: 'galões',
  CUSTOM: '',
};

// ============================================
// HELPERS
// ============================================

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  try {
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString('pt-BR');
  } catch {
    return '';
  }
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata um valor para exibição na etiqueta
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toLocaleDateString('pt-BR');
  }

  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR');
  }

  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }

  return String(value);
}

/**
 * Formata atributos adicionando unidade de medida quando disponível
 * Usado para formatar atributos raw que já estão no formato chave→valor
 */
function formatAttributesWithUnit(
  attributes: Record<string, unknown> | undefined,
  templateAttributes: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!attributes) return {};
  if (!templateAttributes) return attributes;

  const formatted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attributes)) {
    const config = templateAttributes[key] as TemplateAttribute | undefined;
    if (config?.unitOfMeasure && value !== null && value !== undefined && value !== '') {
      formatted[key] = `${formatValue(value)} ${config.unitOfMeasure}`;
    } else {
      formatted[key] = value;
    }
  }
  return formatted;
}

/**
 * Extrai atributos marcados para impressão
 * Se o atributo tem unidade de medida, concatena ao valor (ex: "2 m")
 */
function extractPrintableAttributes(
  attributes: Record<string, unknown> | undefined,
  templateAttributes: Record<string, TemplateAttribute> | undefined
): Record<string, unknown> {
  if (!attributes || !templateAttributes) {
    return {};
  }

  const printable: Record<string, unknown> = {};

  for (const [key, config] of Object.entries(templateAttributes)) {
    if (config.enablePrint && key in attributes) {
      const label = config.label || key;
      let value = formatValue(attributes[key]);
      if (value && config.unitOfMeasure) {
        value = `${value} ${config.unitOfMeasure}`;
      }
      printable[label] = value;
    }
  }

  return printable;
}

// ============================================
// RESOLVE LABEL DATA (legacy - from Item/Variant/Product)
// ============================================

/**
 * Resolve os dados de um item para o formato LabelData
 */
export function resolveLabelData(
  item: Item,
  variant?: Variant,
  product?: Product
): LabelData {
  // Extrair informações básicas
  const productName = product?.name || item.productName || '';
  const productCode = product?.fullCode || item.productCode || '';
  const variantName = variant?.name || item.variantName || '';
  const variantCode = variant?.fullCode || item.variantSku || '';
  const variantSku = variant?.sku || item.variantSku || '';
  const variantReference = variant?.reference || '';
  const manufacturerName = (product?.manufacturer?.name as string) || '';

  // Localização
  const stockLocation = item.resolvedAddress || '';
  const warehouseCode = item.bin?.zone?.warehouseId || '';
  const zoneName = item.bin?.zone?.name || '';
  const binAddress = item.bin?.address || '';

  // Unidade de medida
  const unitOfMeasure = product?.template?.unitOfMeasure || 'UNITS';
  const itemUnitOfMeasure = UNIT_OF_MEASURE_LABELS[unitOfMeasure] || 'un';

  // Atributos para impressão
  const templateData = product?.template as unknown as {
    productAttributes?: Record<string, TemplateAttribute>;
    variantAttributes?: Record<string, TemplateAttribute>;
    itemAttributes?: Record<string, TemplateAttribute>;
  };

  const productAttributes = extractPrintableAttributes(
    product?.attributes as Record<string, unknown>,
    templateData?.productAttributes
  );

  const variantAttributes = extractPrintableAttributes(
    variant?.attributes as Record<string, unknown>,
    templateData?.variantAttributes
  );

  const itemAttributes = extractPrintableAttributes(
    item.attributes as Record<string, unknown>,
    templateData?.itemAttributes
  );

  // Campos combinados
  const productVariantName = variantName
    ? `${productName} - ${variantName}`
    : productName;

  const referenceVariantName = variantReference
    ? `${variantReference} - ${variantName}`
    : variantName;

  // Dados para códigos
  const barcodeData = variant?.barcode || item.uniqueCode || item.id;
  const qrCodeData = item.id;

  return {
    manufacturerName,
    stockLocation,
    warehouseCode,
    zoneName,
    binAddress,
    productName,
    productCode,
    productDescription: product?.description,
    variantName,
    variantCode,
    variantSku,
    variantReference,
    variantBarcode: variant?.barcode,
    itemCode: item.fullCode || item.uniqueCode || '',
    itemUid: item.uniqueCode || item.id,
    itemId: item.id,
    itemQuantity: item.currentQuantity,
    itemUnitOfMeasure,
    itemBatchNumber: item.batchNumber,
    productVariantName,
    referenceVariantName,
    productAttributes,
    variantAttributes,
    itemAttributes,
    barcodeData,
    qrCodeData,
  };
}

/**
 * Resolve dados de múltiplos itens
 */
export function resolveMultipleLabelData(
  items: Array<{
    item: Item;
    variant?: Variant;
    product?: Product;
    copies?: number;
  }>
): LabelData[] {
  const results: LabelData[] = [];

  for (const { item, variant, product, copies = 1 } of items) {
    const labelData = resolveLabelData(item, variant, product);

    for (let i = 0; i < copies; i++) {
      results.push(labelData);
    }
  }

  return results;
}

// ============================================
// RESOLVE LABEL DATA FROM PRESENTER (new - from ItemLabelData)
// ============================================

/**
 * Converte ItemLabelData (do presenter endpoint) para LabelData (formato plano).
 * Usado quando o layout calculator precisa de LabelData mas temos dados do presenter.
 */
export function resolveLabelDataFromPresenter(ld: ItemLabelData): LabelData {
  const unitAbrev = UNIT_OF_MEASURE_LABELS[ld.template.unitOfMeasure] || 'un';
  const productName = ld.product.name;
  const variantName = ld.variant.name;
  const variantRef = ld.variant.reference || '';

  return {
    manufacturerName: ld.manufacturer?.name || '',
    stockLocation: ld.item.resolvedAddress || ld.item.lastKnownAddress || '',
    warehouseCode: ld.location?.warehouseCode || '',
    zoneName: ld.location?.zoneName || '',
    binAddress: ld.location?.binAddress || '',
    productName,
    productCode: ld.product.fullCode || '',
    productDescription: ld.product.description || undefined,
    variantName,
    variantCode: ld.variant.fullCode || '',
    variantSku: ld.variant.sku || undefined,
    variantReference: variantRef || undefined,
    variantBarcode: ld.variant.barcode || undefined,
    itemCode: ld.item.fullCode,
    itemUid: ld.item.uniqueCode || ld.item.id,
    itemId: ld.item.id,
    itemQuantity: ld.item.currentQuantity,
    itemUnitOfMeasure: unitAbrev,
    itemBatchNumber: ld.item.batchNumber || undefined,
    productVariantName: `${productName} - ${variantName}`,
    referenceVariantName: variantRef
      ? `${variantRef} - ${variantName}`
      : variantName,
    productAttributes: {},
    variantAttributes: formatAttributesWithUnit(ld.variant.attributes as Record<string, unknown>, ld.template.variantAttributes),
    itemAttributes: formatAttributesWithUnit(ld.item.attributes as Record<string, unknown>, ld.template.itemAttributes),
    barcodeData: ld.variant.barcode || ld.item.barcode || ld.item.fullCode,
    qrCodeData: ld.item.id,
  };
}

// ============================================
// LABEL DATA TO PREVIEW DATA (legacy - from LabelData)
// ============================================

/**
 * Converte LabelData (formato plano) para o formato nested de previewData
 * usado pelo FieldElementRenderer do Label Studio.
 */
export function labelDataToPreviewData(
  data: LabelData
): Record<string, unknown> {
  return {
    manufacturer: {
      name: data.manufacturerName,
      cnpj: '',
    },
    item: {
      id: data.itemId,
      uniqueCode: data.itemUid,
      fullCode: data.itemCode,
      resolvedAddress: data.stockLocation,
      lastKnownAddress: data.stockLocation,
      currentQuantity: data.itemQuantity,
      quantityWithUnit: `${data.itemQuantity} ${data.itemUnitOfMeasure}`,
      quantityWithUnitFull: `${data.itemQuantity} ${data.itemUnitOfMeasure}`,
      status: 'AVAILABLE',
      batchNumber: data.itemBatchNumber || '',
      entryDate: '',
      expiryDate: '',
      barcode: data.barcodeData,
      eanCode: '',
      barcodeData: data.barcodeData,
      bin: {
        zone: {
          name: data.zoneName || '',
          code: '',
          aisle: { warehouse: { code: data.warehouseCode || '', name: '' } },
          warehouse: { code: data.warehouseCode || '', name: '' },
        },
        aisle: '',
        shelf: '',
        position: '',
      },
    },
    product: {
      name: data.productName,
      fullCode: data.productCode,
      code: data.productCode,
      description: data.productDescription || '',
      unit: data.itemUnitOfMeasure,
      unitFull: data.itemUnitOfMeasure,
      manufacturer: {
        name: data.manufacturerName,
      },
      template: {
        name: '',
      },
    },
    variant: {
      name: data.variantName,
      fullCode: data.variantCode,
      sku: data.variantSku || '',
      barcode: data.variantBarcode || data.barcodeData,
      reference: data.variantReference || '',
      price: '',
      costPrice: '',
      attributes: data.variantAttributes || {},
    },
    combined: {
      productVariant: data.productVariantName,
      productVariantName: data.productVariantName,
      referenceVariant: data.referenceVariantName,
      referenceVariantName: data.referenceVariantName,
      templateProductVariant: data.productVariantName,
    },
    tenant: {
      name: '',
      cnpj: '',
    },
    meta: {
      printDate: new Date().toLocaleDateString('pt-BR'),
      printTime: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      printedBy: '',
      sequenceNumber: '001',
    },
  };
}

// ============================================
// ITEM LABEL DATA TO PREVIEW DATA (new - from presenter endpoint)
// ============================================

/**
 * Converte ItemLabelData (do endpoint /v1/items/label-data) diretamente
 * para o formato previewData do Label Studio.
 *
 * Todos os dataPaths usados no editor (constants.ts LABEL_FIELDS)
 * devem ser resolvíveis a partir deste objeto.
 */
export function itemLabelDataToPreviewData(
  ld: ItemLabelData
): Record<string, unknown> {
  const unitAbrev = UNIT_OF_MEASURE_LABELS[ld.template.unitOfMeasure] || 'un';
  const unitFull =
    UNIT_OF_MEASURE_FULL_LABELS[ld.template.unitOfMeasure] || 'unidades';

  const productName = ld.product.name;
  const variantName = ld.variant.name;
  const variantRef = ld.variant.reference || '';
  const barcodeData = ld.variant.barcode || ld.item.barcode || ld.item.fullCode;

  return {
    // product.* paths
    product: {
      id: ld.product.id,
      name: productName,
      fullCode: ld.product.fullCode || '',
      code: ld.product.fullCode || '',
      description: ld.product.description || '',
      unit: unitAbrev,
      unitFull: unitFull,
      manufacturer: {
        id: ld.manufacturer?.id || '',
        name: ld.manufacturer?.name || '',
        legalName: ld.manufacturer?.legalName || '',
        cnpj: ld.manufacturer?.cnpj || '',
        country: ld.manufacturer?.country || '',
      },
      supplier: {
        id: ld.supplier?.id || '',
        name: ld.supplier?.name || '',
        cnpj: ld.supplier?.cnpj || '',
      },
      template: {
        id: ld.template.id,
        name: ld.template.name,
        unitOfMeasure: ld.template.unitOfMeasure,
      },
      attributes: formatAttributesWithUnit(ld.product.attributes as Record<string, unknown>, ld.template.productAttributes),
    },

    // manufacturer.* paths (top-level alias)
    manufacturer: {
      id: ld.manufacturer?.id || '',
      name: ld.manufacturer?.name || '',
      legalName: ld.manufacturer?.legalName || '',
      cnpj: ld.manufacturer?.cnpj || '',
      country: ld.manufacturer?.country || '',
    },

    // variant.* paths
    variant: {
      id: ld.variant.id,
      name: variantName,
      sku: ld.variant.sku || '',
      fullCode: ld.variant.fullCode || '',
      barcode: ld.variant.barcode || '',
      reference: variantRef,
      price: formatCurrency(ld.variant.price),
      priceRaw: ld.variant.price,
      costPrice: formatCurrency(ld.variant.costPrice),
      costPriceRaw: ld.variant.costPrice,
      colorHex: ld.variant.colorHex || '',
      attributes: formatAttributesWithUnit(ld.variant.attributes as Record<string, unknown>, ld.template.variantAttributes),
    },

    // item.* paths
    item: {
      id: ld.item.id,
      uniqueCode: ld.item.uniqueCode || '',
      fullCode: ld.item.fullCode,
      sequentialCode: ld.item.sequentialCode,
      currentQuantity: ld.item.currentQuantity,
      initialQuantity: ld.item.initialQuantity,
      unitCost:
        ld.item.unitCost != null ? formatCurrency(ld.item.unitCost) : '',
      unitCostRaw: ld.item.unitCost,
      status: ld.item.status,
      entryDate: formatDate(ld.item.entryDate),
      expiryDate: formatDate(ld.item.expiryDate),
      manufacturingDate: formatDate(ld.item.manufacturingDate),
      batchNumber: ld.item.batchNumber || '',
      barcode: ld.item.barcode,
      eanCode: ld.item.eanCode,
      barcodeData: barcodeData,
      resolvedAddress:
        ld.item.resolvedAddress || ld.item.lastKnownAddress || '',
      lastKnownAddress: ld.item.lastKnownAddress || '',
      quantityWithUnit: `${ld.item.currentQuantity} ${unitAbrev}`,
      quantityWithUnitFull: `${ld.item.currentQuantity} ${unitFull}`,
      attributes: formatAttributesWithUnit(ld.item.attributes as Record<string, unknown>, ld.template.itemAttributes),
      // Nested bin for deep paths like item.bin.zone.name
      bin: {
        zone: {
          id: ld.location?.zoneId || '',
          name: ld.location?.zoneName || '',
          code: ld.location?.zoneCode || '',
          warehouse: {
            id: ld.location?.warehouseId || '',
            code: ld.location?.warehouseCode || '',
            name: ld.location?.warehouseName || '',
          },
          aisle: {
            warehouse: {
              code: ld.location?.warehouseCode || '',
              name: ld.location?.warehouseName || '',
            },
          },
        },
      },
    },

    // location.* paths (convenient top-level)
    location: {
      binAddress: ld.location?.binAddress || '',
      zoneCode: ld.location?.zoneCode || '',
      zoneName: ld.location?.zoneName || '',
      warehouseCode: ld.location?.warehouseCode || '',
      warehouseName: ld.location?.warehouseName || '',
    },

    // combined.* paths
    combined: {
      productVariant: `${productName} - ${variantName}`,
      productVariantName: `${productName} - ${variantName}`,
      referenceVariant: variantRef
        ? `${variantRef} - ${variantName}`
        : variantName,
      referenceVariantName: variantRef
        ? `${variantRef} - ${variantName}`
        : variantName,
      templateProductVariant: `${productName} - ${variantName}`,
    },

    // tenant.* paths
    tenant: {
      id: ld.tenant.id,
      name: ld.tenant.name,
    },

    // meta.* paths (runtime)
    meta: {
      printDate: new Date().toLocaleDateString('pt-BR'),
      printTime: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      printedBy: '',
      sequenceNumber: '001',
    },

    // custom.* paths
    custom: {
      title: '',
    },
  };
}

// ============================================
// SAMPLE DATA
// ============================================

/**
 * Gera dados de exemplo para preview
 */
export function getSampleLabelData(): LabelData {
  return {
    manufacturerName: 'Fabricante Exemplo',
    stockLocation: 'A-01-02-B',
    warehouseCode: 'ARM-01',
    zoneName: 'Estoque Principal',
    binAddress: 'A-01-02-B',
    productName: 'Produto Exemplo',
    productCode: 'PROD-001',
    productDescription: 'Descrição do produto exemplo',
    variantName: 'Azul M',
    variantCode: 'VAR-001-AZL-M',
    variantSku: 'SKU-001-AZL-M',
    variantReference: 'REF-001',
    variantBarcode: '7891234567890',
    itemCode: '5.1.1.2.901.23',
    itemUid: 'ITM-00001',
    itemId: 'sample-item-id',
    itemQuantity: 10,
    itemUnitOfMeasure: 'un',
    itemBatchNumber: 'LOTE-2024-001',
    productVariantName: 'Produto Exemplo - Azul M',
    referenceVariantName: 'REF-001 - Azul M',
    productAttributes: {
      Material: 'Algodão',
      Peso: '250g',
    },
    variantAttributes: {
      Cor: 'Azul',
      Tamanho: 'M',
    },
    itemAttributes: {
      Validade: '31/12/2025',
    },
    barcodeData: '7891234567890',
    qrCodeData: 'sample-item-id',
  };
}

/**
 * Gera previewData de exemplo com todos os campos preenchidos
 * para uso no editor de templates
 */
export function getSamplePreviewData(): Record<string, unknown> {
  const sample: ItemLabelData = {
    item: {
      id: 'sample-item-id',
      uniqueCode: 'ITM-00001',
      fullCode: '5.1.1.2.901.23',
      sequentialCode: 23,
      currentQuantity: 10,
      initialQuantity: 10,
      unitCost: 15.5,
      status: 'AVAILABLE',
      entryDate: '2024-06-15T00:00:00.000Z',
      resolvedAddress: 'FAB-EST-102-B',
      lastKnownAddress: 'FAB-EST-102-B',
      batchNumber: 'LOTE-2024-001',
      manufacturingDate: '2024-05-01T00:00:00.000Z',
      expiryDate: '2025-05-01T00:00:00.000Z',
      barcode: '5112901230001',
      eanCode: '5112901230001',
      attributes: {},
    },
    variant: {
      id: 'sample-variant-id',
      name: 'Azul M',
      sku: 'CAM-AZU-M-001',
      fullCode: '5.1.1.2.901',
      price: 49.9,
      costPrice: 25.0,
      barcode: '7891234567890',
      reference: 'REF-2024-001',
      colorHex: '#2563eb',
      attributes: {
        composicao: '100% Algodão',
        cor: '901 - Azul',
        gramatura: '260 g/m²',
        dimensoes: 'L: 1,62m',
        qualidade: 'Premium',
        nuance: '-',
      },
    },
    product: {
      id: 'sample-product-id',
      name: 'Camiseta Básica',
      fullCode: '5.1.1.2',
      description: 'Camiseta de algodão básica',
      attributes: {},
    },
    manufacturer: {
      id: 'sample-mfr-id',
      name: 'Acme Corp',
      legalName: 'Acme Corporation Ltda',
      cnpj: '12.345.678/0001-90',
      country: 'Brasil',
    },
    supplier: {
      id: 'sample-sup-id',
      name: 'Distribuidora XYZ',
      cnpj: '98.765.432/0001-10',
    },
    template: {
      id: 'sample-tpl-id',
      name: 'Vestuário',
      unitOfMeasure: 'METERS',
      productAttributes: null,
      variantAttributes: null,
      itemAttributes: null,
    },
    location: {
      binId: 'sample-bin-id',
      binAddress: 'FAB-EST-102-B',
      zoneId: 'sample-zone-id',
      zoneCode: 'EST',
      zoneName: 'Estoque Principal',
      warehouseId: 'sample-wh-id',
      warehouseCode: 'FAB',
      warehouseName: 'Fábrica Principal',
    },
    tenant: {
      id: 'sample-tenant-id',
      name: 'Empresa Demo',
    },
  };

  return itemLabelDataToPreviewData(sample);
}

// ============================================
// EMPLOYEE LABEL DATA TO PREVIEW DATA
// ============================================

/**
 * Converte EmployeeLabelData (do endpoint /v1/hr/employees/label-data)
 * para o formato previewData do Label Studio.
 */
export function employeeLabelDataToPreviewData(
  ld: EmployeeLabelData
): Record<string, unknown> {
  const nameParts = ld.employee.fullName.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return {
    employee: {
      id: ld.employee.id,
      fullCode: ld.employee.registrationNumber,
      firstName,
      lastName,
      fullName: ld.employee.socialName || ld.employee.fullName,
      cpf: ld.employee.cpf,
      position: ld.position?.name || '',
      department: ld.department?.name || '',
      admission: formatDate(ld.employee.hireDate),
      status: ld.employee.status,
      photoUrl: ld.employee.photoUrl,
      barcode: ld.employee.registrationNumber,
      qrcode: ld.employee.id,
    },
    company: {
      id: ld.company?.id || '',
      name: ld.company?.name || '',
      cnpj: ld.company?.cnpj || '',
    },
    department: {
      id: ld.department?.id || '',
      name: ld.department?.name || '',
    },
    position: {
      id: ld.position?.id || '',
      name: ld.position?.name || '',
    },
    tenant: { id: ld.tenant.id, name: ld.tenant.name },
    meta: {
      printDate: new Date().toLocaleDateString('pt-BR'),
      printTime: new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      printedBy: 'Sistema',
      sequenceNumber: '001',
    },
  };
}

/**
 * Gera previewData de exemplo para funcionário
 */
export function getEmployeeSamplePreviewData(): Record<string, unknown> {
  const sample: EmployeeLabelData = {
    employee: {
      id: 'sample-emp-id',
      registrationNumber: 'EMP-001',
      fullName: 'João da Silva',
      socialName: null,
      cpf: '123.456.789-00',
      hireDate: '2024-01-15T00:00:00.000Z',
      status: 'ACTIVE',
      photoUrl: null,
    },
    department: {
      id: 'sample-dept-id',
      name: 'Logística',
    },
    position: {
      id: 'sample-pos-id',
      name: 'Analista de Estoque',
    },
    company: {
      id: 'sample-company-id',
      name: 'Empresa Demo Ltda',
      cnpj: '12.345.678/0001-90',
    },
    tenant: {
      id: 'sample-tenant-id',
      name: 'Empresa Demo',
    },
  };

  return employeeLabelDataToPreviewData(sample);
}
