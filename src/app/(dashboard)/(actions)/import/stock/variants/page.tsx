'use client';

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  startTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Kbd } from '@/components/ui/kbd';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { logger } from '@/lib/logger';
import {
  AlertTriangle,
  CheckCircle2,
  Columns3,
  Download,
  FileSpreadsheet,
  GripVertical,
  Layers,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { ImportProgressDialog } from '../../_shared/components/import-progress-dialog';
import { ImportSpreadsheet } from '../../_shared/components/import-spreadsheet';
import {
  ENTITY_DEFINITIONS,
  getBasePath,
} from '../../_shared/config/entity-definitions';
import {
  downloadExcelTemplate,
  parseImportFile,
} from '../../_shared/utils/excel-utils';
import { useImportProcess } from '../../_shared/hooks/use-import-process';
import {
  useImportSpreadsheet,
  type DecimalSeparator,
} from '../../_shared/hooks/use-import-spreadsheet';
import {
  useProducts,
  useTemplates,
  useTemplateDetails,
} from '../../_shared/hooks/use-reference-data';
import type {
  FieldOption,
  ImportFieldConfig,
  ValidationResult,
} from '../../_shared/types';

// ============================================
// CONSTANTS
// ============================================

const COLUMNS_STORAGE_KEY = 'opensea-import-variants-columns';

interface ColumnConfig {
  key: string;
  enabled: boolean;
  order: number;
}

interface StoredColumnsConfig {
  templateId: string;
  columns: ColumnConfig[];
}

/** Normalized field definition used internally */
interface NormalizedField {
  key: string;
  label: string;
  type:
    | 'text'
    | 'number'
    | 'email'
    | 'date'
    | 'boolean'
    | 'select'
    | 'reference';
  required: boolean;
  description?: string;
  options?: FieldOption[];
  defaultValue?: string | number | boolean;
  referenceEntity?: string;
  referenceDisplayField?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    patternMessage?: string;
  };
  isAttribute: boolean;
}

// ============================================
// HELPER: Load/Save column config from localStorage
// ============================================

function loadColumnsConfig(templateId: string): ColumnConfig[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (!stored) return null;
    const parsed: StoredColumnsConfig = JSON.parse(stored);
    if (parsed.templateId !== templateId) return null;
    return parsed.columns;
  } catch {
    return null;
  }
}

function saveColumnsConfig(templateId: string, columns: ColumnConfig[]) {
  if (typeof window === 'undefined') return;
  try {
    const data: StoredColumnsConfig = { templateId, columns };
    localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silently fail
  }
}

// ============================================
// SORTABLE COLUMN ITEM
// ============================================

interface SortableColumnItemProps {
  field: {
    key: string;
    label: string;
    enabled: boolean;
    required: boolean;
    isAttribute?: boolean;
  };
  onToggle: () => void;
}

function SortableColumnItem({ field, onToggle }: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 ${isDragging ? 'opacity-50 shadow-lg bg-muted' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Checkbox
        checked={field.enabled}
        onCheckedChange={onToggle}
        disabled={field.required}
      />
      <span className="text-sm flex-1 truncate flex items-center gap-1.5">
        {field.label}
        {field.isAttribute && (
          <Sparkles className="w-3 h-3 text-muted-foreground shrink-0" />
        )}
      </span>
      {field.required && (
        <Badge variant="secondary" className="text-xs shrink-0">
          Obrigatório
        </Badge>
      )}
    </div>
  );
}

// ============================================
// COLUMNS POPOVER CONTENT
// ============================================

interface ColumnsPopoverContentProps {
  columns: Array<{
    key: string;
    label: string;
    enabled: boolean;
    required: boolean;
    isAttribute?: boolean;
  }>;
  onToggle: (key: string) => void;
  onToggleAll: (enabled: boolean) => void;
  onReorder: (activeId: string, overId: string) => void;
}

function ColumnsPopoverContent({
  columns,
  onToggle,
  onToggleAll,
  onReorder,
}: ColumnsPopoverContentProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const enabledCount = columns.filter(c => c.enabled).length;
  const allOptionalEnabled = columns
    .filter(c => !c.required)
    .every(c => c.enabled);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  return (
    <div className="w-80">
      <div className="px-3 py-2 border-b">
        <h4 className="font-semibold text-sm">Gerenciar Colunas</h4>
        <p className="text-xs text-muted-foreground">
          Arraste para reordenar, marque para exibir
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="max-h-80 overflow-y-auto p-2">
          <SortableContext
            items={columns.map(c => c.key)}
            strategy={verticalListSortingStrategy}
          >
            {columns.map(col => (
              <SortableColumnItem
                key={col.key}
                field={col}
                onToggle={() => onToggle(col.key)}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      <div className="px-3 py-2 border-t flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {enabledCount}{' '}
          {enabledCount === 1 ? 'coluna selecionada' : 'colunas selecionadas'}
        </span>
        <button
          type="button"
          className="text-xs text-primary hover:underline"
          onClick={() => onToggleAll(allOptionalEnabled ? false : true)}
        >
          {allOptionalEnabled ? 'Desmarcar opcionais' : 'Selecionar todas'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function VariantsSheetsPage() {
  const router = useRouter();
  const basePath = getBasePath('variants');
  const entityDef = ENTITY_DEFINITIONS.variants;

  // State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [decimalSeparator, setDecimalSeparator] =
    useState<DecimalSeparator>('comma');
  const [columnsConfig, setColumnsConfig] = useState<ColumnConfig[]>([]);

  // Reference data
  const { data: templates } = useTemplates();
  const { data: templateDetails } = useTemplateDetails(
    selectedTemplateId || undefined
  );
  const { data: products } = useProducts();

  // Build system fields — exclude templateId (set automatically)
  // productId always visible (user selects product per row)
  const systemFields = useMemo((): NormalizedField[] => {
    return entityDef.fields
      .filter(f => f.key !== 'templateId')
      .map(f => ({
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
        description: f.description,
        options: f.options,
        defaultValue: f.defaultValue,
        referenceEntity: f.referenceEntity,
        referenceDisplayField: f.referenceDisplayField,
        validation: f.validation,
        isAttribute: false,
      }));
  }, [entityDef.fields]);

  // Build template attribute fields — use variantAttributes
  const templateAttributeFields = useMemo((): NormalizedField[] => {
    if (!templateDetails?.variantAttributes) return [];
    const attrs = templateDetails.variantAttributes;
    if (typeof attrs !== 'object' || Object.keys(attrs).length === 0) return [];
    return Object.entries(attrs).map(([attrKey, attrConfig]) => {
      const fieldType: NormalizedField['type'] =
        attrConfig.type === 'number'
          ? 'number'
          : attrConfig.type === 'boolean'
            ? 'boolean'
            : attrConfig.type === 'select'
              ? 'select'
              : 'text';

      return {
        key: `attributes.${attrKey}`,
        label: attrConfig.label || attrKey,
        type: fieldType,
        required: attrConfig.required || false,
        description: `Atributo: ${attrConfig.label || attrKey}`,
        options: attrConfig.options?.map(o => ({ value: o, label: o })),
        isAttribute: true,
      };
    });
  }, [templateDetails]);

  // All available fields
  const allAvailableFields = useMemo((): NormalizedField[] => {
    return [...systemFields, ...templateAttributeFields];
  }, [systemFields, templateAttributeFields]);

  // Stable key representing the available fields (only changes when actual field keys change)
  const availableFieldKeys = useMemo(
    () => allAvailableFields.map(f => f.key).join(','),
    [allAvailableFields]
  );

  // Track which template+product+fields combo we last initialized for
  const lastInitRef = useRef<string>('');

  // Initialize/update columns config when template, product or fields change
  useEffect(() => {
    if (!selectedTemplateId) {
      setColumnsConfig([]);
      lastInitRef.current = '';
      return;
    }

    // Only initialize once per template+product+fields combo
    const initKey = `${selectedTemplateId}:${availableFieldKeys}`;
    if (initKey === lastInitRef.current) return;
    lastInitRef.current = initKey;

    // Try to load from localStorage
    const stored = loadColumnsConfig(selectedTemplateId);
    if (stored) {
      const storedKeys = new Set(stored.map(c => c.key));
      const availableKeys = new Set(availableFieldKeys.split(','));

      const merged = stored.filter(c => availableKeys.has(c.key));

      let maxOrder = Math.max(...merged.map(c => c.order), 0);
      allAvailableFields.forEach(f => {
        if (!storedKeys.has(f.key)) {
          maxOrder++;
          merged.push({ key: f.key, enabled: f.required, order: maxOrder });
        }
      });

      setColumnsConfig(merged);
    } else {
      const defaultConfig: ColumnConfig[] = allAvailableFields.map((f, i) => ({
        key: f.key,
        enabled: true,
        order: i,
      }));
      setColumnsConfig(defaultConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateId, availableFieldKeys]);

  // Save to localStorage whenever columns config changes
  useEffect(() => {
    if (selectedTemplateId && columnsConfig.length > 0) {
      saveColumnsConfig(selectedTemplateId, columnsConfig);
    }
  }, [selectedTemplateId, columnsConfig]);

  // Build enabled fields for the spreadsheet
  const enabledFields = useMemo((): ImportFieldConfig[] => {
    if (!selectedTemplateId || columnsConfig.length === 0) return [];

    return columnsConfig
      .filter(c => c.enabled)
      .sort((a, b) => a.order - b.order)
      .map((col, index) => {
        const fieldDef = allAvailableFields.find(f => f.key === col.key);
        if (!fieldDef) return null;

        const config: ImportFieldConfig = {
          key: fieldDef.key,
          label: fieldDef.label,
          description: fieldDef.description,
          enabled: true,
          order: index,
          type: fieldDef.type,
          required: fieldDef.required,
          defaultValue: fieldDef.defaultValue,
          options: fieldDef.options,
          referenceEntity:
            fieldDef.referenceEntity as ImportFieldConfig['referenceEntity'],
          referenceDisplayField: fieldDef.referenceDisplayField,
          minLength: fieldDef.validation?.minLength,
          maxLength: fieldDef.validation?.maxLength,
          min: fieldDef.validation?.min,
          max: fieldDef.validation?.max,
          pattern: fieldDef.validation?.pattern,
          patternMessage: fieldDef.validation?.patternMessage,
        };

        return config;
      })
      .filter((f): f is ImportFieldConfig => f !== null);
  }, [columnsConfig, allAvailableFields, selectedTemplateId]);

  // Reference data map for validation
  const referenceDataMap = useMemo(() => {
    const map: Record<string, FieldOption[]> = {};
    enabledFields.forEach(field => {
      if (field.type === 'reference' && field.referenceEntity) {
        switch (field.referenceEntity) {
          case 'products':
            map[field.key] = products || [];
            break;
        }
      } else if (field.type === 'select' && field.options) {
        map[field.key] = field.options;
      }
    });
    return map;
  }, [enabledFields, products]);

  // Spreadsheet hook — initialized with empty headers to avoid re-creation loops.
  // Headers are updated imperatively via updateHeaders() when enabledFields change.
  const emptyHeaders = useRef<ImportFieldConfig[]>([]).current;
  const spreadsheet = useImportSpreadsheet(emptyHeaders, {
    decimalSeparator,
    referenceData: referenceDataMap,
  });

  // Import process
  const importProcess = useImportProcess({
    entityType: 'variants',
    batchSize: 10,
    delayBetweenBatches: 1000,
    onComplete: result => {
      toast.success(
        `Importação concluída! ${result.importedRows} variantes importadas.`
      );
    },
    onError: error => {
      toast.error(`Erro na importação: ${error.message}`);
    },
  });

  // Load CSV data from sessionStorage (from previous paste)
  useEffect(() => {
    const stored = sessionStorage.getItem('import-variants-data');
    if (stored) {
      try {
        const { data } = JSON.parse(stored);
        spreadsheet.applyPastedData(data);
        sessionStorage.removeItem('import-variants-data');
      } catch (e) {
        logger.error(
          'Failed to load CSV data',
          e instanceof Error ? e : undefined
        );
      }
    }
  }, []);

  // Stable key for enabled fields — used to trigger header updates
  const enabledFieldsKey = useMemo(
    () => enabledFields.map(f => f.key).join(','),
    [enabledFields]
  );

  // Track previous key to detect actual changes
  const prevFieldsKeyRef = useRef('');

  // Update spreadsheet headers only when field keys actually change
  useEffect(() => {
    if (enabledFieldsKey && enabledFieldsKey !== prevFieldsKeyRef.current) {
      prevFieldsKeyRef.current = enabledFieldsKey;
      // Use startTransition to avoid blocking the main render and causing state conflicts
      startTransition(() => {
        spreadsheet.updateHeaders(enabledFields);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledFieldsKey]);

  // Clear validation when decimal separator changes
  useEffect(() => {
    setValidationResult(null);
  }, [decimalSeparator]);

  // Columns for the popover
  const columnsForPopover = useMemo(() => {
    return columnsConfig
      .sort((a, b) => a.order - b.order)
      .map(col => {
        const fieldDef = allAvailableFields.find(f => f.key === col.key);
        return {
          key: col.key,
          label: fieldDef?.label || col.key,
          enabled: col.enabled,
          required: fieldDef?.required || false,
          isAttribute: fieldDef?.isAttribute || false,
        };
      });
  }, [columnsConfig, allAvailableFields]);

  // Handlers
  const handleToggleColumn = useCallback((key: string) => {
    setColumnsConfig(prev => {
      const field = prev.find(c => c.key === key);
      if (!field) return prev;
      return prev.map(c => (c.key === key ? { ...c, enabled: !c.enabled } : c));
    });
  }, []);

  const handleToggleAllColumns = useCallback(
    (enabled: boolean) => {
      setColumnsConfig(prev =>
        prev.map(c => {
          const fieldDef = allAvailableFields.find(f => f.key === c.key);
          if (fieldDef?.required) return c;
          return { ...c, enabled };
        })
      );
    },
    [allAvailableFields]
  );

  const handleReorderColumns = useCallback(
    (activeId: string, overId: string) => {
      setColumnsConfig(prev => {
        const sorted = [...prev].sort((a, b) => a.order - b.order);
        const oldIndex = sorted.findIndex(c => c.key === activeId);
        const newIndex = sorted.findIndex(c => c.key === overId);
        if (oldIndex === -1 || newIndex === -1) return prev;

        const reordered = arrayMove(sorted, oldIndex, newIndex);
        return reordered.map((c, i) => ({ ...c, order: i }));
      });
    },
    []
  );

  const handleValidate = useCallback(() => {
    const result = spreadsheet.validate();
    setValidationResult(result);

    if (result.valid) {
      toast.success(`${result.totalRows} linhas validadas com sucesso!`);
    } else {
      toast.error(
        `${result.errors.length} erros encontrados. Corrija antes de importar.`
      );
    }
  }, [spreadsheet]);

  const handleImport = useCallback(async () => {
    const result = spreadsheet.validate();
    setValidationResult(result);

    if (!result.valid) {
      toast.error('Corrija os erros antes de importar.');
      return;
    }

    if (result.totalRows === 0) {
      toast.error('Nenhum dado para importar.');
      return;
    }

    const rowData = spreadsheet.getRowData();
    setShowProgressDialog(true);

    try {
      await importProcess.startImport(rowData);
    } catch {
      // Error handled by onError callback
    }
  }, [spreadsheet, importProcess]);

  const handleProgressClose = useCallback(() => {
    setShowProgressDialog(false);
    importProcess.reset();
    spreadsheet.clearAll();
    router.push('/stock/products');
  }, [importProcess, spreadsheet, router]);

  const handleTemplateChange = useCallback((value: string) => {
    setSelectedTemplateId(value === '__none__' ? '' : value);
    setValidationResult(null);
  }, []);

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = useCallback(() => {
    if (enabledFields.length === 0) return;
    downloadExcelTemplate(enabledFields, 'Variantes', {
      includeExamples: true,
    });
    toast.success('Template baixado com sucesso!');
  }, [enabledFields]);

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const parsed = await parseImportFile(file);
        if (parsed.rows.length === 0) {
          toast.error('O arquivo está vazio ou não contém dados válidos.');
          return;
        }

        // Map file headers to field keys
        const headerMapping: Record<number, number> = {};
        parsed.headers.forEach((fileHeader, fileIndex) => {
          const normalized = fileHeader.toLowerCase().trim();
          const matchIndex = enabledFields.findIndex(h => {
            const fieldLabel = h.label.toLowerCase().trim();
            const fieldKey = h.key.toLowerCase().trim();
            return (
              fieldLabel === normalized ||
              fieldKey === normalized ||
              fieldLabel.includes(normalized) ||
              normalized.includes(fieldLabel)
            );
          });
          if (matchIndex !== -1) {
            headerMapping[fileIndex] = matchIndex;
          }
        });

        const newRows = parsed.rows.map(row => {
          const newRow = enabledFields.map(h => ({
            value: '',
            fieldKey: h.key,
          }));
          row.forEach((cellValue, fileIndex) => {
            const mappedIndex = headerMapping[fileIndex];
            if (mappedIndex !== undefined && cellValue) {
              newRow[mappedIndex] = {
                value: cellValue.trim(),
                fieldKey: enabledFields[mappedIndex].key,
              };
            }
          });
          return newRow;
        });

        // Keep header row
        const currentData = spreadsheet.data;
        const hasHeaderRow = currentData[0]?.some(cell => cell.isHeader);
        if (hasHeaderRow) {
          spreadsheet.setData([currentData[0], ...newRows]);
        } else {
          spreadsheet.setData(newRows);
        }

        toast.success(`${parsed.rows.length} linhas importadas do arquivo.`);
      } catch {
        toast.error('Erro ao processar o arquivo. Verifique o formato.');
      }

      event.target.value = '';
    },
    [enabledFields, spreadsheet]
  );

  // Selected template name
  const selectedTemplateName = useMemo(() => {
    if (!selectedTemplateId || !templates) return null;
    return templates.find(t => t.value === selectedTemplateId)?.label;
  }, [selectedTemplateId, templates]);

  // Action bar buttons
  const actionBarButtons = [
    {
      id: 'validate',
      title: 'Validar',
      icon: CheckCircle2,
      variant: 'outline' as const,
      onClick: handleValidate,
      disabled: !selectedTemplateId || enabledFields.length === 0,
    },
    {
      id: 'import',
      title: `Importar${spreadsheet.filledRowCount > 0 ? ` (${spreadsheet.filledRowCount})` : ''}`,
      icon: Play,
      variant: 'default' as const,
      onClick: handleImport,
      disabled:
        spreadsheet.filledRowCount === 0 ||
        importProcess.isProcessing ||
        !selectedTemplateId ||
        !validationResult?.valid,
    },
  ];

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-10rem)]">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[
          { label: 'Importação', href: '/import' },
          { label: 'Variantes' },
        ]}
        buttons={actionBarButtons}
      />

      {/* Hero Banner Card */}
      <Card className="relative overflow-hidden px-5 py-4 bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 shrink-0">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/15 dark:bg-purple-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-linear-to-br from-purple-500 to-indigo-600">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                    Importar Variantes
                  </h1>
                  {validationResult &&
                    (validationResult.valid ? (
                      <Badge
                        variant="default"
                        className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Dados válidos
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {validationResult.errors.length} erros
                      </Badge>
                    ))}
                </div>
                <p className="text-sm text-slate-500 dark:text-white/60">
                  Preencha a planilha, faça o upload de uma ou cole dados de
                  outra planilha
                </p>
              </div>
            </div>

            {/* Template selector */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">
                Template:
              </Label>
              <Select
                value={selectedTemplateId || '__none__'}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger className="w-56 h-9">
                  <SelectValue placeholder="Selecione um template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecione...</SelectItem>
                  {templates?.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Secondary bar */}
          <div className="bg-muted/30 dark:bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
            {/* Left: badges */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                {spreadsheet.filledRowCount}{' '}
                {spreadsheet.filledRowCount === 1 ? 'linha' : 'linhas'}{' '}
                preenchidas
              </Badge>
              <span className="text-xs text-muted-foreground">
                Pressione <Kbd>Enter</Kbd> em uma célula para ver os valores
                possíveis.
              </span>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              {/* Decimal separator toggle */}
              <div className="flex items-center gap-2 mr-1">
                <Label
                  htmlFor="decimal-separator"
                  className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
                >
                  Decimal: {decimalSeparator === 'comma' ? 'Vírgula' : 'Ponto'}
                </Label>
                <Switch
                  id="decimal-separator"
                  checked={decimalSeparator === 'dot'}
                  onCheckedChange={checked =>
                    setDecimalSeparator(checked ? 'dot' : 'comma')
                  }
                />
              </div>

              {/* Columns popover */}
              {selectedTemplateId && columnsConfig.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-2.5 gap-1.5"
                    >
                      <Columns3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Colunas</span>
                      <Badge
                        variant="secondary"
                        className="text-xs px-1.5 py-0 h-5 min-w-5 justify-center"
                      >
                        {enabledFields.length}
                      </Badge>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="p-0 w-auto">
                    <ColumnsPopoverContent
                      columns={columnsForPopover}
                      onToggle={handleToggleColumn}
                      onToggleAll={handleToggleAllColumns}
                      onReorder={handleReorderColumns}
                    />
                  </PopoverContent>
                </Popover>
              )}

              {/* File import popover */}
              {selectedTemplateId && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-2.5 gap-1.5"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span className="hidden sm:inline">Arquivo</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-64 p-3">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">
                          Importar de Arquivo
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Baixe o template ou envie um arquivo preenchido.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start h-9 px-2.5"
                        onClick={handleDownloadTemplate}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Template Excel
                      </Button>
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv,.txt"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start h-9 px-2.5"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Enviar Arquivo
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Add row + Clear */}
              {selectedTemplateId && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5"
                    onClick={spreadsheet.addRow}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Linha
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-2.5"
                    onClick={spreadsheet.clearAll}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Prompt when no template selected */}
      {!selectedTemplateId && (
        <Card className="bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 flex-1 min-h-0 flex items-center justify-center">
          <div className="text-center py-12">
            <div className="p-4 rounded-full bg-purple-500/10 inline-flex mb-4">
              <Layers className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              Selecione um Template
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Para iniciar a importação, selecione um template de variante no
              campo acima. O template define os atributos disponíveis para
              preenchimento.
            </p>
          </div>
        </Card>
      )}

      {/* Spreadsheet — always mounted, hidden when no template (avoids remount loops) */}
      {selectedTemplateId && enabledFields.length > 0 && (
        <Card className="bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 flex-1 min-h-0 flex flex-col overflow-hidden">
          <ImportSpreadsheet
            data={spreadsheet.data}
            headers={enabledFields}
            onDataChange={spreadsheet.setData}
            onAddRow={spreadsheet.addRow}
            onClearAll={spreadsheet.clearAll}
            validationResult={validationResult}
            referenceData={referenceDataMap}
            entityName="Variantes"
            showFileUpload={false}
            showDownloadTemplate={false}
          />
        </Card>
      )}

      {/* Import Progress Dialog */}
      <ImportProgressDialog
        open={showProgressDialog}
        onOpenChange={setShowProgressDialog}
        progress={importProcess.progress}
        onPause={importProcess.pauseImport}
        onResume={importProcess.resumeImport}
        onCancel={importProcess.cancelImport}
        onClose={handleProgressClose}
        entityLabel={entityDef.labelPlural}
      />
    </div>
  );
}
