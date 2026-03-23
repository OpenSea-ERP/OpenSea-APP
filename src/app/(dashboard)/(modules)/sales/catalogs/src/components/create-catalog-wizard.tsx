'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import type {
  CatalogLayout,
  CatalogType,
  CreateCatalogRequest,
} from '@/types/sales';
import { BookOpen, Check, Loader2, Settings } from 'lucide-react';
import { useCallback, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────

interface CreateCatalogWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCatalogRequest) => Promise<void>;
  isSubmitting?: boolean;
}

// ─── Step 1: Informações Básicas ──────────────────────────────

function StepBasicInfo({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  type,
  onTypeChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  type: CatalogType;
  onTypeChange: (v: CatalogType) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome *</Label>
        <Input
          placeholder="Nome do catálogo"
          value={name}
          onChange={e => onNameChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          placeholder="Descrição do catálogo..."
          rows={3}
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Tipo</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={type}
          onChange={e => onTypeChange(e.target.value as CatalogType)}
        >
          <option value="GENERAL">Geral</option>
          <option value="SELLER">Vendedor</option>
          <option value="CAMPAIGN">Campanha</option>
          <option value="CUSTOMER">Cliente</option>
          <option value="AI_GENERATED">Gerado por IA</option>
        </select>
      </div>
    </div>
  );
}

// ─── Step 2: Configurações ────────────────────────────────────

function StepSettings({
  layout,
  onLayoutChange,
  showPrices,
  onShowPricesChange,
  showStock,
  onShowStockChange,
  isPublic,
  onIsPublicChange,
}: {
  layout: CatalogLayout;
  onLayoutChange: (v: CatalogLayout) => void;
  showPrices: boolean;
  onShowPricesChange: (v: boolean) => void;
  showStock: boolean;
  onShowStockChange: (v: boolean) => void;
  isPublic: boolean;
  onIsPublicChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Layout de Exibição</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={layout}
          onChange={e => onLayoutChange(e.target.value as CatalogLayout)}
        >
          <option value="GRID">Grade</option>
          <option value="LIST">Lista</option>
          <option value="MAGAZINE">Revista</option>
        </select>
      </div>

      <div className="space-y-3">
        <Label>Opções de Visibilidade</Label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showPrices}
            onChange={e => onShowPricesChange(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm">Exibir preços</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showStock}
            onChange={e => onShowStockChange(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm">Exibir estoque</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={e => onIsPublicChange(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <span className="text-sm">Catálogo público</span>
        </label>
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreateCatalogWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateCatalogWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CatalogType>('GENERAL');
  const [layout, setLayout] = useState<CatalogLayout>('GRID');
  const [showPrices, setShowPrices] = useState(true);
  const [showStock, setShowStock] = useState(false);
  const [isPublic, setIsPublic] = useState(false);

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setName('');
    setDescription('');
    setType('GENERAL');
    setLayout('GRID');
    setShowPrices(true);
    setShowStock(false);
    setIsPublic(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    const payload: CreateCatalogRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      layout,
      showPrices,
      showStock,
      isPublic,
    };

    await onSubmit(payload);
    handleClose();
  }, [
    name,
    description,
    type,
    layout,
    showPrices,
    showStock,
    isPublic,
    onSubmit,
    handleClose,
  ]);

  const steps: WizardStep[] = [
    {
      title: 'Informações Básicas',
      description: 'Defina o nome, descrição e tipo do catálogo.',
      icon: (
        <BookOpen className="h-16 w-16 text-indigo-400" strokeWidth={1.2} />
      ),
      content: (
        <StepBasicInfo
          name={name}
          onNameChange={setName}
          description={description}
          onDescriptionChange={setDescription}
          type={type}
          onTypeChange={setType}
        />
      ),
      isValid: name.trim().length > 0,
    },
    {
      title: 'Configurações',
      description: 'Defina o layout e as opções de visibilidade.',
      icon: (
        <Settings className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <StepSettings
          layout={layout}
          onLayoutChange={setLayout}
          showPrices={showPrices}
          onShowPricesChange={setShowPrices}
          showStock={showStock}
          onShowStockChange={setShowStock}
          isPublic={isPublic}
          onIsPublicChange={setIsPublic}
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
          Criar Catálogo
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
