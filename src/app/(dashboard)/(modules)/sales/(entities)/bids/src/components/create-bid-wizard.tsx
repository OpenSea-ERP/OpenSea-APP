'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCreateBid } from '@/hooks/sales/use-bids';
import type {
  BidModality,
  BidCriterion,
  BidLegalFramework,
  CreateBidRequest,
} from '@/types/sales';
import { BID_MODALITY_LABELS } from '@/types/sales';
import { CalendarDays, Check, FileText, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ─── Local Types ───────────────────────────────────────────────

interface CreateBidWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Step 1: Informações Básicas ──────────────────────────────

function StepBasicInfo({
  editalNumber,
  onEditalNumberChange,
  modality,
  onModalityChange,
  criterionType,
  onCriterionTypeChange,
  legalFramework,
  onLegalFrameworkChange,
  object,
  onObjectChange,
  organName,
  onOrganNameChange,
  portalName,
  onPortalNameChange,
}: {
  editalNumber: string;
  onEditalNumberChange: (v: string) => void;
  modality: BidModality;
  onModalityChange: (v: BidModality) => void;
  criterionType: BidCriterion;
  onCriterionTypeChange: (v: BidCriterion) => void;
  legalFramework: BidLegalFramework;
  onLegalFrameworkChange: (v: BidLegalFramework) => void;
  object: string;
  onObjectChange: (v: string) => void;
  organName: string;
  onOrganNameChange: (v: string) => void;
  portalName: string;
  onPortalNameChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Número do Edital *</Label>
          <Input
            placeholder="Ex: PE 001/2026"
            value={editalNumber}
            onChange={e => onEditalNumberChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Portal *</Label>
          <Input
            placeholder="Ex: ComprasNet, BEC"
            value={portalName}
            onChange={e => onPortalNameChange(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Modalidade *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={modality}
          onChange={e => onModalityChange(e.target.value as BidModality)}
        >
          {Object.entries(BID_MODALITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Critério de Julgamento</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={criterionType}
            onChange={e =>
              onCriterionTypeChange(e.target.value as BidCriterion)
            }
          >
            <option value="MENOR_PRECO">Menor Preço</option>
            <option value="MAIOR_DESCONTO">Maior Desconto</option>
            <option value="MELHOR_TECNICA">Melhor Técnica</option>
            <option value="TECNICA_PRECO">Técnica e Preço</option>
            <option value="MAIOR_LANCE">Maior Lance</option>
            <option value="MAIOR_RETORNO">Maior Retorno</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Regime Legal</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={legalFramework}
            onChange={e =>
              onLegalFrameworkChange(e.target.value as BidLegalFramework)
            }
          >
            <option value="LEI_14133_2021">Lei 14.133/2021</option>
            <option value="LEI_8666_1993">Lei 8.666/1993</option>
            <option value="LEI_10520_2002">Lei 10.520/2002</option>
            <option value="LEI_12462_2011">Lei 12.462/2011</option>
            <option value="DECRETO_10024_2019">Decreto 10.024/2019</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Órgão *</Label>
        <Input
          placeholder="Nome do órgão licitante"
          value={organName}
          onChange={e => onOrganNameChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Objeto *</Label>
        <Textarea
          placeholder="Descrição do objeto da licitação..."
          rows={3}
          value={object}
          onChange={e => onObjectChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Step 2: Datas, Valores e Localização ─────────────────────

function StepDatesAndValues({
  openingDate,
  onOpeningDateChange,
  closingDate,
  onClosingDateChange,
  estimatedValue,
  onEstimatedValueChange,
  organState,
  onOrganStateChange,
  organCity,
  onOrganCityChange,
  notes,
  onNotesChange,
}: {
  openingDate: string;
  onOpeningDateChange: (v: string) => void;
  closingDate: string;
  onClosingDateChange: (v: string) => void;
  estimatedValue: string;
  onEstimatedValueChange: (v: string) => void;
  organState: string;
  onOrganStateChange: (v: string) => void;
  organCity: string;
  onOrganCityChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Abertura *</Label>
          <Input
            type="datetime-local"
            value={openingDate}
            onChange={e => onOpeningDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Data de Encerramento</Label>
          <Input
            type="datetime-local"
            value={closingDate}
            onChange={e => onClosingDateChange(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Valor Estimado (R$)</Label>
        <Input
          type="number"
          min={0}
          step={0.01}
          placeholder="0,00"
          value={estimatedValue}
          onChange={e => onEstimatedValueChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Estado (UF)</Label>
          <Input
            placeholder="Ex: SP"
            maxLength={2}
            value={organState}
            onChange={e => onOrganStateChange(e.target.value.toUpperCase())}
          />
        </div>
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input
            placeholder="Ex: São Paulo"
            value={organCity}
            onChange={e => onOrganCityChange(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          placeholder="Notas adicionais sobre a licitação..."
          rows={3}
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreateBidWizard({ open, onOpenChange }: CreateBidWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [editalNumber, setEditalNumber] = useState('');
  const [portalName, setPortalName] = useState('');
  const [modality, setModality] = useState<BidModality>('PREGAO_ELETRONICO');
  const [criterionType, setCriterionType] =
    useState<BidCriterion>('MENOR_PRECO');
  const [legalFramework, setLegalFramework] =
    useState<BidLegalFramework>('LEI_14133_2021');
  const [object, setObject] = useState('');
  const [organName, setOrganName] = useState('');

  // Step 2 state
  const [openingDate, setOpeningDate] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [organState, setOrganState] = useState('');
  const [organCity, setOrganCity] = useState('');
  const [notes, setNotes] = useState('');

  const createBid = useCreateBid();
  const isSubmitting = createBid.isPending;

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setEditalNumber('');
    setPortalName('');
    setModality('PREGAO_ELETRONICO');
    setCriterionType('MENOR_PRECO');
    setLegalFramework('LEI_14133_2021');
    setObject('');
    setOrganName('');
    setOpeningDate('');
    setClosingDate('');
    setEstimatedValue('');
    setOrganState('');
    setOrganCity('');
    setNotes('');
    onOpenChange(false);
  }, [onOpenChange]);

  async function handleSubmit() {
    const payload: CreateBidRequest = {
      portalName: portalName.trim(),
      editalNumber: editalNumber.trim(),
      modality,
      criterionType,
      legalFramework,
      object: object.trim(),
      organName: organName.trim(),
      openingDate: new Date(openingDate).toISOString(),
      closingDate: closingDate
        ? new Date(closingDate).toISOString()
        : undefined,
      estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
      organState: organState || undefined,
      organCity: organCity || undefined,
      notes: notes || undefined,
    };

    try {
      await createBid.mutateAsync(payload);
      toast.success('Licitação criada com sucesso.');
      handleClose();
    } catch {
      toast.error('Erro ao criar licitação.');
    }
  }

  const step1Valid =
    editalNumber.trim().length > 0 &&
    portalName.trim().length > 0 &&
    object.trim().length > 0 &&
    organName.trim().length > 0;

  const step2Valid = openingDate.length > 0;

  const steps: WizardStep[] = [
    {
      title: 'Informações Básicas',
      description: 'Preencha os dados principais da licitação.',
      icon: (
        <FileText className="h-16 w-16 text-indigo-400" strokeWidth={1.2} />
      ),
      content: (
        <StepBasicInfo
          editalNumber={editalNumber}
          onEditalNumberChange={setEditalNumber}
          modality={modality}
          onModalityChange={setModality}
          criterionType={criterionType}
          onCriterionTypeChange={setCriterionType}
          legalFramework={legalFramework}
          onLegalFrameworkChange={setLegalFramework}
          object={object}
          onObjectChange={setObject}
          organName={organName}
          onOrganNameChange={setOrganName}
          portalName={portalName}
          onPortalNameChange={setPortalName}
        />
      ),
      isValid: step1Valid,
    },
    {
      title: 'Datas e Valores',
      description: 'Defina as datas de abertura, valores e localização.',
      icon: (
        <CalendarDays
          className="h-16 w-16 text-emerald-400"
          strokeWidth={1.2}
        />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <StepDatesAndValues
          openingDate={openingDate}
          onOpeningDateChange={setOpeningDate}
          closingDate={closingDate}
          onClosingDateChange={setClosingDate}
          estimatedValue={estimatedValue}
          onEstimatedValueChange={setEstimatedValue}
          organState={organState}
          onOrganStateChange={setOrganState}
          organCity={organCity}
          onOrganCityChange={setOrganCity}
          notes={notes}
          onNotesChange={setNotes}
        />
      ),
      isValid: step2Valid,
      footer: (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !step2Valid}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Licitação
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
