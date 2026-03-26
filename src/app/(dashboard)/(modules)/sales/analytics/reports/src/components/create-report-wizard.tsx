'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import type { CreateReportRequest, ReportFormat, ReportType } from '@/types/sales';
import { Check, FileText, Filter, Loader2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface CreateReportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateReportRequest) => Promise<void>;
  isSubmitting?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  SALES_SUMMARY: 'Resumo de Vendas',
  COMMISSION_REPORT: 'Relatório de Comissões',
  PIPELINE_REPORT: 'Relatório de Pipeline',
  PRODUCT_PERFORMANCE: 'Desempenho de Produtos',
  CUSTOMER_ANALYSIS: 'Análise de Clientes',
  BID_REPORT: 'Relatório de Licitações',
  MARKETPLACE_REPORT: 'Relatório de Marketplaces',
  CASHIER_REPORT: 'Relatório de Caixa',
  GOAL_PROGRESS: 'Progresso de Metas',
  CURVA_ABC: 'Curva ABC',
  CUSTOM: 'Personalizado',
};

const REPORT_FORMAT_LABELS: Record<ReportFormat, string> = {
  PDF: 'PDF',
  EXCEL: 'Excel',
  CSV: 'CSV',
};

// ============================================================================
// STEP 1: Nome e Tipo
// ============================================================================

function StepNameAndType({
  name,
  onNameChange,
  type,
  onTypeChange,
  format,
  onFormatChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  type: ReportType;
  onTypeChange: (v: ReportType) => void;
  format: ReportFormat;
  onFormatChange: (v: ReportFormat) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Relatório *</Label>
        <Input
          placeholder="Ex: Vendas do Trimestre"
          value={name}
          onChange={e => onNameChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Tipo de Relatório *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={type}
          onChange={e => onTypeChange(e.target.value as ReportType)}
        >
          {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Formato *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={format}
          onChange={e => onFormatChange(e.target.value as ReportFormat)}
        >
          {Object.entries(REPORT_FORMAT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ============================================================================
// STEP 2: Período e Filtros
// ============================================================================

function StepPeriodAndFilters({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  name,
  type,
  format,
}: {
  startDate: string;
  onStartDateChange: (v: string) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
  name: string;
  type: ReportType;
  format: ReportFormat;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Data Inicial</Label>
          <Input
            type="date"
            value={startDate}
            onChange={e => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Data Final</Label>
          <Input
            type="date"
            value={endDate}
            onChange={e => onEndDateChange(e.target.value)}
          />
        </div>
      </div>

      {/* Review summary */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Resumo</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Nome</p>
            <p className="font-medium">{name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tipo</p>
            <p className="font-medium">{REPORT_TYPE_LABELS[type]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Formato</p>
            <p className="font-medium">{REPORT_FORMAT_LABELS[format]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Período</p>
            <p className="font-medium">
              {startDate && endDate
                ? `${new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} - ${new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
                : 'Sem período definido'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN WIZARD
// ============================================================================

export function CreateReportWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateReportWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [type, setType] = useState<ReportType>('SALES_SUMMARY');
  const [format, setFormat] = useState<ReportFormat>('PDF');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setName('');
    setType('SALES_SUMMARY');
    setFormat('PDF');
    setStartDate('');
    setEndDate('');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    const config: Record<string, unknown> = {};
    if (startDate) config.startDate = new Date(startDate + 'T00:00:00').toISOString();
    if (endDate) config.endDate = new Date(endDate + 'T23:59:59').toISOString();

    const payload: CreateReportRequest = {
      name: name.trim(),
      type,
      format,
      config: Object.keys(config).length > 0 ? config : undefined,
    };

    await onSubmit(payload);
    handleClose();
  }, [name, type, format, startDate, endDate, onSubmit, handleClose]);

  const step1Valid = useMemo(
    () => name.trim().length > 0,
    [name]
  );

  const steps: WizardStep[] = [
    {
      title: 'Nome e Tipo',
      description: 'Defina o nome e o tipo do relatório.',
      icon: (
        <FileText className="h-16 w-16 text-sky-400" strokeWidth={1.2} />
      ),
      content: (
        <StepNameAndType
          name={name}
          onNameChange={setName}
          type={type}
          onTypeChange={setType}
          format={format}
          onFormatChange={setFormat}
        />
      ),
      isValid: step1Valid,
    },
    {
      title: 'Período e Filtros',
      description: 'Configure o período e revise os dados.',
      icon: (
        <Filter className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <StepPeriodAndFilters
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          name={name}
          type={type}
          format={format}
        />
      ),
      isValid: true,
      footer: (
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Relatório
        </Button>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
