'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCampaign } from '@/hooks/sales/use-campaigns';
import type { CampaignType, CreateCampaignRequest } from '@/types/sales';
import { CAMPAIGN_TYPE_LABELS } from '@/types/sales';
import { CalendarDays, Check, Loader2, Megaphone } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface CreateCampaignWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCampaignWizard({
  open,
  onOpenChange,
}: CreateCampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 — Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CampaignType>('PERCENTAGE');
  const [discountType, setDiscountType] = useState<
    'PERCENTAGE' | 'FIXED_VALUE'
  >('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');

  // Step 2 — Dates & conditions
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxUsageCount, setMaxUsageCount] = useState('');
  const [isActive, setIsActive] = useState(true);

  const createMutation = useCreateCampaign();

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setName('');
    setDescription('');
    setType('PERCENTAGE');
    setDiscountType('PERCENTAGE');
    setDiscountValue('');
    setStartDate('');
    setEndDate('');
    setMinOrderValue('');
    setMaxUsageCount('');
    setIsActive(true);
    onOpenChange(false);
  }, [onOpenChange]);

  async function handleSubmit() {
    const payload: CreateCampaignRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      maxUsageTotal: maxUsageCount ? Number(maxUsageCount) : undefined,
      products: discountValue
        ? [
            {
              discountType,
              discountValue: Number(discountValue),
            },
          ]
        : undefined,
    };

    try {
      await createMutation.mutateAsync(payload);
      toast.success('Campanha criada com sucesso!');
      handleClose();
    } catch {
      toast.error('Erro ao criar campanha. Tente novamente.');
    }
  }

  const step1Valid = name.trim().length > 0;
  const step2Valid = startDate.length > 0 && endDate.length > 0;

  const steps: WizardStep[] = [
    {
      title: 'Informações Básicas',
      description: 'Defina o nome, tipo e desconto da campanha.',
      icon: (
        <Megaphone className="h-16 w-16 text-violet-400" strokeWidth={1.2} />
      ),
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              placeholder="Ex: Black Friday 2026"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descreva a campanha..."
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Campanha</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={type}
              onChange={e => setType(e.target.value as CampaignType)}
            >
              {Object.entries(CAMPAIGN_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Desconto</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={discountType}
                onChange={e =>
                  setDiscountType(
                    e.target.value as 'PERCENTAGE' | 'FIXED_VALUE'
                  )
                }
              >
                <option value="PERCENTAGE">Percentual (%)</option>
                <option value="FIXED_VALUE">Valor Fixo (R$)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Valor do Desconto</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder={
                  discountType === 'PERCENTAGE' ? 'Ex: 10' : 'Ex: 25.00'
                }
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
              />
            </div>
          </div>
        </div>
      ),
      isValid: step1Valid,
    },
    {
      title: 'Datas e Condições',
      description: 'Configure o período de vigência e regras da campanha.',
      icon: (
        <CalendarDays
          className="h-16 w-16 text-emerald-400"
          strokeWidth={1.2}
        />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Término *</Label>
              <Input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Mínimo do Pedido</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="Ex: 100.00"
                value={minOrderValue}
                onChange={e => setMinOrderValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Limite de Usos</Label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 500"
                value={maxUsageCount}
                onChange={e => setMaxUsageCount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                isActive ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <Label
              className="cursor-pointer"
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? 'Campanha ativa' : 'Campanha inativa'}
            </Label>
          </div>
        </div>
      ),
      isValid: step2Valid,
      footer: (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!step2Valid || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Campanha
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
