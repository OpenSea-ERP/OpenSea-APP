'use client';

/**
 * OpenSea OS - Create Employee Request Modal (HR)
 *
 * Modal wizard de 2 passos para criar solicitacao do colaborador.
 * Step 1: Selecionar tipo da solicitacao
 * Step 2: Preencher dados conforme o tipo
 */

import { useCallback, useState } from 'react';
import { StepWizardDialog } from '@/components/ui/step-wizard-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RequestType } from '@/types/hr';
import {
  Calendar,
  ClipboardList,
  FileText,
  Loader2,
  PalmtreeIcon,
  Send,
  UserCog,
} from 'lucide-react';
import { useCreateRequest } from '../api';
import { getRequestTypeLabel } from '../utils';

/* ===========================================
   CONSTANTS
   =========================================== */

const REQUEST_TYPES: {
  type: RequestType;
  label: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}[] = [
  {
    type: 'VACATION',
    label: 'Férias',
    description: 'Solicitar período de férias',
    icon: PalmtreeIcon,
    gradient: 'from-green-500 to-green-600',
  },
  {
    type: 'ABSENCE',
    label: 'Ausência',
    description: 'Solicitar ausência justificada',
    icon: Calendar,
    gradient: 'from-rose-500 to-rose-600',
  },
  {
    type: 'ADVANCE',
    label: 'Adiantamento',
    description: 'Solicitar adiantamento salarial',
    icon: FileText,
    gradient: 'from-amber-500 to-amber-600',
  },
  {
    type: 'DATA_CHANGE',
    label: 'Alteração de Dados',
    description: 'Solicitar atualização de dados cadastrais',
    icon: UserCog,
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    type: 'SUPPORT',
    label: 'Suporte',
    description: 'Solicitar suporte ao RH',
    icon: Send,
    gradient: 'from-violet-500 to-violet-600',
  },
];

/* ===========================================
   PROPS
   =========================================== */

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ===========================================
   COMPONENT
   =========================================== */

export function CreateRequestModal({
  isOpen,
  onClose,
}: CreateRequestModalProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);

  // Form data per type
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [fieldToChange, setFieldToChange] = useState('');
  const [newValue, setNewValue] = useState('');

  const createRequest = useCreateRequest({
    onSuccess: () => {
      resetForm();
      onClose();
    },
  });

  function resetForm() {
    setStep(1);
    setSelectedType(null);
    setStartDate('');
    setEndDate('');
    setAmount('');
    setDescription('');
    setFieldToChange('');
    setNewValue('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  const buildRequestData = useCallback((): Record<string, unknown> => {
    if (!selectedType) return {};

    switch (selectedType) {
      case 'VACATION':
        return { startDate, endDate, description };
      case 'ABSENCE':
        return { startDate, endDate, reason: description };
      case 'ADVANCE':
        return { amount: parseFloat(amount) || 0, reason: description };
      case 'DATA_CHANGE':
        return { field: fieldToChange, newValue, reason: description };
      case 'SUPPORT':
        return { subject: fieldToChange, message: description };
      default:
        return { description };
    }
  }, [
    selectedType,
    startDate,
    endDate,
    amount,
    description,
    fieldToChange,
    newValue,
  ]);

  function handleSubmit() {
    if (!selectedType) return;
    createRequest.mutate({
      type: selectedType,
      data: buildRequestData(),
    });
  }

  const isStep2Valid = (() => {
    if (!selectedType) return false;
    switch (selectedType) {
      case 'VACATION':
      case 'ABSENCE':
        return !!startDate && !!endDate;
      case 'ADVANCE':
        return !!amount && parseFloat(amount) > 0;
      case 'DATA_CHANGE':
        return !!fieldToChange && !!newValue;
      case 'SUPPORT':
        return !!description && description.length >= 10;
      default:
        return !!description;
    }
  })();

  /* ===========================================
     STEP 1: TYPE SELECTION
     =========================================== */

  const step1Content = (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-4">
        Selecione o tipo de solicitação que deseja criar.
      </p>
      <div className="grid gap-3">
        {REQUEST_TYPES.map((rt) => {
          const Icon = rt.icon;
          const isSelected = selectedType === rt.type;

          return (
            <button
              key={rt.type}
              type="button"
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10'
                  : 'border-border hover:border-blue-300 hover:bg-muted/50'
              }`}
              onClick={() => setSelectedType(rt.type)}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 bg-linear-to-br ${rt.gradient}`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">{rt.label}</p>
                <p className="text-xs text-muted-foreground">
                  {rt.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ===========================================
     STEP 2: FORM BY TYPE
     =========================================== */

  const renderFormByType = () => {
    if (!selectedType) return null;

    switch (selectedType) {
      case 'VACATION':
      case 'ABSENCE':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Data Início</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Data Fim</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">
                {selectedType === 'VACATION'
                  ? 'Observações (opcional)'
                  : 'Motivo'}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  selectedType === 'VACATION'
                    ? 'Informações adicionais sobre as férias...'
                    : 'Descreva o motivo da ausência...'
                }
                rows={3}
              />
            </div>
          </div>
        );

      case 'ADVANCE':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do Adiantamento (R$)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Textarea
                id="reason"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o motivo do adiantamento..."
                rows={3}
              />
            </div>
          </div>
        );

      case 'DATA_CHANGE':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field">Campo a Alterar</Label>
              <Input
                id="field"
                value={fieldToChange}
                onChange={(e) => setFieldToChange(e.target.value)}
                placeholder="Ex: Endereço, Telefone, Conta Bancária..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-value">Novo Valor</Label>
              <Input
                id="new-value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Informe o novo valor..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs">Observações (opcional)</Label>
              <Textarea
                id="obs"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Informações adicionais..."
                rows={2}
              />
            </div>
          </div>
        );

      case 'SUPPORT':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                value={fieldToChange}
                onChange={(e) => setFieldToChange(e.target.value)}
                placeholder="Assunto da solicitação..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva sua solicitação de suporte... (min. 10 caracteres)"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/10 caracteres minimos
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const step2Content = (
    <div className="space-y-4">
      {selectedType && (
        <p className="text-sm text-muted-foreground">
          Preencha os dados para a solicitação de{' '}
          <strong>{getRequestTypeLabel(selectedType)}</strong>.
        </p>
      )}
      {renderFormByType()}
    </div>
  );

  /* ===========================================
     WIZARD STEPS
     =========================================== */

  const TypeIcon =
    REQUEST_TYPES.find((rt) => rt.type === selectedType)?.icon || ClipboardList;
  const typeGradient =
    REQUEST_TYPES.find((rt) => rt.type === selectedType)?.gradient ||
    'from-blue-500 to-blue-600';

  const steps = [
    {
      title: 'Tipo da Solicitação',
      description: 'Escolha o tipo',
      icon: (
        <div className="flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-blue-600">
            <ClipboardList className="h-10 w-10 text-white" />
          </div>
        </div>
      ),
      content: step1Content,
      isValid: !!selectedType,
    },
    {
      title: selectedType
        ? getRequestTypeLabel(selectedType)
        : 'Dados da Solicitação',
      description: 'Preencha os dados',
      icon: (
        <div className="flex items-center justify-center">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br ${typeGradient}`}
          >
            <TypeIcon className="h-10 w-10 text-white" />
          </div>
        </div>
      ),
      content: step2Content,
      isValid: isStep2Valid,
      footer: (
        <div className="flex items-center justify-between w-full px-6 pb-4">
          <Button variant="outline" size="sm" onClick={() => setStep(1)}>
            Voltar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!isStep2Valid || createRequest.isPending}
          >
            {createRequest.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            )}
            Enviar Solicitação
          </Button>
        </div>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      steps={steps}
      currentStep={step}
      onStepChange={setStep}
      onClose={handleClose}
      heightClass="h-[540px]"
    />
  );
}

export default CreateRequestModal;
