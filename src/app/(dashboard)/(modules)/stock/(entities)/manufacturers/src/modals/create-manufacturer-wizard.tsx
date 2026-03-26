/**
 * OpenSea OS - Create Manufacturer Wizard
 * Wizard dual-flow: importação automática via CNPJ ou criação manual.
 *
 * Passo 1: Campo CNPJ com validação automática contra o banco.
 *          Footer: "Criar Manualmente" (outline) | "Criar Automaticamente" (default)
 *
 * Passo 2 (CNPJ):   Preview dos dados importados → "Importar Fabricante"
 * Passo 2 (Manual):  Nome, Razão Social, País (select com bandeira), CNPJ (se Brasil)
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CountrySelect, getCountryName } from '@/components/ui/country-select';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { formatCEP, formatPhone } from '@/helpers/formatters';
import { logger } from '@/lib/logger';
import { translateError } from '@/lib/error-messages';
import { brasilApiService } from '@/services/brasilapi.service';
import type { BrasilAPICompanyData } from '@/types/brasilapi';
import type { Manufacturer } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  CheckCircle,
  Factory,
  Loader2,
  PenLine,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { manufacturersApi } from '../api/manufacturer.api';

// =============================================================================
// TYPES
// =============================================================================

export interface CreateManufacturerWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Manufacturer>) => Promise<void>;
}

type Flow = 'cnpj' | 'manual';
type CnpjValidation = 'idle' | 'validating' | 'valid' | 'duplicate' | 'error';

// =============================================================================
// CNPJ HELPERS
// =============================================================================

function formatCNPJ(value: string) {
  const cleaned = value.replace(/\D/g, '').slice(0, 14);
  return cleaned
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

// =============================================================================
// STEP 1: CNPJ INPUT
// =============================================================================

function StepCnpjInput({
  cnpj,
  cnpjValidation,
  duplicateName,
  onCnpjChange,
}: {
  cnpj: string;
  cnpjValidation: CnpjValidation;
  duplicateName: string | null;
  onCnpjChange: (value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="wizard-cnpj">CNPJ</Label>
        <Input
          id="wizard-cnpj"
          value={cnpj}
          onChange={e => onCnpjChange(e.target.value)}
          placeholder="00.000.000/0000-00"
          maxLength={18}
          autoFocus
        />

        {cnpjValidation === 'validating' && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" />
            Verificando CNPJ...
          </p>
        )}

        {cnpjValidation === 'valid' && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Check className="h-3 w-3" />
            CNPJ disponível
          </p>
        )}
      </div>

      {cnpjValidation === 'duplicate' && (
        <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <p className="text-xs text-rose-700 dark:text-rose-300">
              Este CNPJ já está cadastrado
              {duplicateName ? ` para "${duplicateName}"` : ''}.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
        <p className="text-xs text-muted-foreground">
          Para fabricantes internacionais ou sem CNPJ, utilize a criação manual.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// STEP 2 (CNPJ FLOW): PREVIEW DOS DADOS
// =============================================================================

function StepCnpjPreview({
  companyData,
}: {
  companyData: BrasilAPICompanyData;
}) {
  const address = [
    companyData.descricao_tipo_de_logradouro,
    companyData.logradouro,
    companyData.numero,
  ]
    .filter(Boolean)
    .join(' ');

  const cityUf = [companyData.municipio, companyData.uf]
    .filter(Boolean)
    .join('/');

  const rows: { label: string; value: string | null | undefined }[] = [
    { label: 'Razão Social', value: companyData.razao_social },
    { label: 'Nome Fantasia', value: companyData.nome_fantasia },
    { label: 'CNPJ', value: formatCNPJ(companyData.cnpj) },
    { label: 'Endereço', value: address },
    { label: 'Cidade/UF', value: cityUf },
    { label: 'CEP', value: formatCEP(companyData.cep) },
    { label: 'Telefone', value: formatPhone(companyData.ddd_telefone_1) },
    { label: 'E-mail', value: companyData.email },
  ].filter(r => r.value);

  return (
    <div className="border rounded-lg overflow-hidden w-full">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="bg-muted/50 text-left">
            <th className="px-3 py-2 font-medium w-[35%]">Campo</th>
            <th className="px-3 py-2 font-medium w-[65%]">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.label} className="border-t">
              <td className="px-3 py-2 text-muted-foreground">{row.label}</td>
              <td className="px-3 py-2">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// STEP 2 (MANUAL FLOW): FORMULÁRIO SIMPLIFICADO
// =============================================================================

function StepManualForm({
  name,
  legalName,
  countryCode,
  cnpj,
  cnpjDuplicate,
  nameError,
  onNameChange,
  onLegalNameChange,
  onCountryCodeChange,
  onCnpjChange,
  onNameErrorChange,
  isSubmitting,
}: {
  name: string;
  legalName: string;
  countryCode: string;
  cnpj: string;
  cnpjDuplicate: string | null;
  nameError: string;
  onNameChange: (v: string) => void;
  onLegalNameChange: (v: string) => void;
  onCountryCodeChange: (v: string) => void;
  onCnpjChange: (v: string) => void;
  onNameErrorChange: (v: string) => void;
  isSubmitting: boolean;
}) {
  const isBrasil = countryCode === 'BR';

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="m-name" className="text-xs">
          Nome Fantasia <span className="text-rose-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="m-name"
            value={name}
            onChange={e => {
              if (nameError) onNameErrorChange('');
              onNameChange(e.target.value);
            }}
            placeholder="Ex: Metalúrgica São Paulo"
            autoFocus
            disabled={isSubmitting}
            aria-invalid={!!nameError}
          />
          {nameError && <FormErrorIcon message={nameError} />}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="m-legal" className="text-xs">
          Razão Social
        </Label>
        <Input
          id="m-legal"
          value={legalName}
          onChange={e => onLegalNameChange(e.target.value)}
          placeholder="Razão social completa"
          disabled={isSubmitting}
        />
      </div>

      <div className={isBrasil ? 'grid grid-cols-2 gap-3' : ''}>
        <div className="space-y-1.5">
          <Label htmlFor="m-country" className="text-xs">
            País <span className="text-rose-500">*</span>
          </Label>
          <CountrySelect
            id="m-country"
            value={countryCode}
            onValueChange={onCountryCodeChange}
            disabled={isSubmitting}
          />
        </div>

        {isBrasil && (
          <div className="space-y-1.5">
            <Label htmlFor="m-cnpj" className="text-xs">
              CNPJ
            </Label>
            <Input
              id="m-cnpj"
              value={cnpj}
              onChange={e => onCnpjChange(formatCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              maxLength={18}
              disabled={isSubmitting}
            />
          </div>
        )}
      </div>

      {cnpjDuplicate && (
        <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <p className="text-xs text-rose-700 dark:text-rose-300">
              Este CNPJ já está cadastrado para &ldquo;{cnpjDuplicate}&rdquo;.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN WIZARD
// =============================================================================

export function CreateManufacturerWizard({
  open,
  onOpenChange,
  onSubmit,
}: CreateManufacturerWizardProps) {
  // Flow control
  const [flow, setFlow] = useState<Flow>('cnpj');
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 - CNPJ state
  const [cnpj, setCnpj] = useState('');
  const [cnpjValidation, setCnpjValidation] = useState<CnpjValidation>('idle');
  const [duplicateName, setDuplicateName] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<BrasilAPICompanyData | null>(
    null
  );
  const [cnpjFetchError, setCnpjFetchError] = useState<string | null>(null);
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);

  // Step 2 manual - form state
  const [manualName, setManualName] = useState('');
  const [manualLegalName, setManualLegalName] = useState('');
  const [manualCountryCode, setManualCountryCode] = useState('BR');
  const [manualCnpj, setManualCnpj] = useState('');
  const [nameError, setNameError] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------------------
  // Load existing manufacturers for CNPJ duplicate check
  // -------------------------------------------------------------------------
  const { data: existingManufacturers } = useQuery({
    queryKey: ['manufacturers-cnpj-check'],
    queryFn: async () => {
      const response = await manufacturersApi.list();
      return response.manufacturers.filter(
        (m: Manufacturer) => !m.deletedAt && m.cnpj
      );
    },
    enabled: open,
  });

  // -------------------------------------------------------------------------
  // CNPJ duplicate check helper
  // -------------------------------------------------------------------------

  const findDuplicateCnpj = (rawCnpj: string): string | null => {
    const clean = rawCnpj.replace(/\D/g, '');
    if (clean.length !== 14) return null;
    const dup = existingManufacturers?.find((m: Manufacturer) => {
      const mCnpj = m.cnpj?.replace(/\D/g, '') ?? '';
      return mCnpj === clean;
    });
    return dup?.name ?? null;
  };

  // -------------------------------------------------------------------------
  // Step 1 — CNPJ auto-validation when 14 digits are entered
  // -------------------------------------------------------------------------

  const cleanCnpj = cnpj.replace(/\D/g, '');

  useEffect(() => {
    if (cleanCnpj.length !== 14) {
      setCnpjValidation('idle');
      setDuplicateName(null);
      return;
    }

    setCnpjValidation('validating');

    const timer = setTimeout(() => {
      const dupName = findDuplicateCnpj(cleanCnpj);
      if (dupName) {
        setCnpjValidation('duplicate');
        setDuplicateName(dupName);
      } else {
        setCnpjValidation('valid');
        setDuplicateName(null);
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanCnpj, existingManufacturers]);

  // -------------------------------------------------------------------------
  // Step 2 manual — CNPJ duplicate check
  // -------------------------------------------------------------------------

  const manualCnpjDuplicate = useMemo(() => {
    if (manualCountryCode !== 'BR') return null;
    return findDuplicateCnpj(manualCnpj);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualCnpj, manualCountryCode, existingManufacturers]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleCnpjChange = (value: string) => {
    setCnpj(formatCNPJ(value));
    setCnpjFetchError(null);
  };

  const canAutoCreate =
    cnpjValidation === 'valid' && cleanCnpj.length === 14 && !isFetchingCnpj;

  const handleAutoCreate = async () => {
    if (!canAutoCreate) return;

    setIsFetchingCnpj(true);
    setCnpjFetchError(null);

    try {
      const data = await brasilApiService.getCompanyByCnpj(cleanCnpj);
      setCompanyData(data);
      setCurrentStep(2);
    } catch (err) {
      setCnpjFetchError(
        err instanceof Error ? err.message : 'Erro ao buscar dados do CNPJ.'
      );
    } finally {
      setIsFetchingCnpj(false);
    }
  };

  const handleSwitchToManual = () => {
    // If CNPJ was entered, carry it over to manual form
    if (cleanCnpj.length === 14 && cnpjValidation !== 'duplicate') {
      setManualCnpj(cnpj);
    }
    setNameError('');
    setFlow('manual');
    setCurrentStep(2);
  };

  const handleBackToStep1 = () => {
    setFlow('cnpj');
    setCurrentStep(1);
    setCnpjFetchError(null);
    setNameError('');
  };

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handleSubmitManual = async () => {
    if (!manualName.trim()) return;

    const countryName = getCountryName(manualCountryCode);

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: manualName.trim(),
        legalName: manualLegalName.trim() || undefined,
        country: countryName,
        cnpj:
          manualCountryCode === 'BR' && manualCnpj.trim()
            ? manualCnpj.trim()
            : undefined,
        isActive: true,
      });
      handleClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (
        msg.includes('name already exists') ||
        msg.includes('Manufacturer with this name')
      ) {
        setNameError(translateError(msg));
        return;
      }
      logger.error(
        'Error creating manufacturer',
        error instanceof Error ? error : undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCnpj = async () => {
    if (!companyData) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: companyData.nome_fantasia || companyData.razao_social,
        legalName: companyData.razao_social || undefined,
        cnpj: companyData.cnpj || undefined,
        email: companyData.email || undefined,
        phone: companyData.ddd_telefone_1 || undefined,
        addressLine1: `${companyData.descricao_tipo_de_logradouro} ${companyData.logradouro}, ${companyData.numero}`,
        addressLine2: companyData.complemento || undefined,
        city: companyData.municipio,
        state: companyData.uf,
        postalCode: companyData.cep,
        country: 'Brasil',
        isActive: true,
      });
      handleClose();
    } catch (error) {
      logger.error(
        'Error importing manufacturer from CNPJ',
        error instanceof Error ? error : undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------------
  // Close / Reset
  // -------------------------------------------------------------------------

  const handleClose = () => {
    setFlow('cnpj');
    setCurrentStep(1);
    setCnpj('');
    setCnpjValidation('idle');
    setDuplicateName(null);
    setCompanyData(null);
    setCnpjFetchError(null);
    setIsFetchingCnpj(false);
    setManualName('');
    setManualLegalName('');
    setManualCountryCode('BR');
    setManualCnpj('');
    setNameError('');
    setIsSubmitting(false);
    onOpenChange(false);
  };

  // -------------------------------------------------------------------------
  // Build steps
  // -------------------------------------------------------------------------

  const step1: WizardStep = {
    title: 'Novo Fabricante',
    description: 'Informe o CNPJ do fabricante ou crie manualmente.',
    icon: <Factory className="h-16 w-16 text-violet-400" strokeWidth={1.2} />,
    content: isFetchingCnpj ? (
      <div className="space-y-4 py-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    ) : (
      <>
        <StepCnpjInput
          cnpj={cnpj}
          cnpjValidation={cnpjValidation}
          duplicateName={duplicateName}
          onCnpjChange={handleCnpjChange}
        />
        {cnpjFetchError && (
          <Card className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
              <p className="text-sm text-rose-900 dark:text-rose-100">
                {cnpjFetchError}
              </p>
            </div>
          </Card>
        )}
      </>
    ),
    footer: (
      <>
        <Button
          type="button"
          variant="outline"
          onClick={handleSwitchToManual}
          disabled={isFetchingCnpj}
          className="flex-1 gap-2"
        >
          <PenLine className="h-4 w-4" />
          Criar Manualmente
        </Button>
        <Button
          type="button"
          onClick={handleAutoCreate}
          disabled={!canAutoCreate}
          className="flex-1 gap-2"
        >
          {isFetchingCnpj ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Criar Automaticamente
        </Button>
      </>
    ),
  };

  const step2Cnpj: WizardStep = {
    title: 'Confirmar Importação',
    description: 'Revise os dados antes de importar o fabricante.',
    icon: (
      <CheckCircle className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />
    ),
    content: companyData ? <StepCnpjPreview companyData={companyData} /> : null,
    onBack: handleBackToStep1,
    footer: (
      <Button type="button" onClick={handleSubmitCnpj} disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Check className="h-4 w-4 mr-2" />
        )}
        Importar Fabricante
      </Button>
    ),
  };

  const step2Manual: WizardStep = {
    title: 'Dados do Fabricante',
    description: 'Preencha as informações do novo fabricante.',
    icon: <PenLine className="h-16 w-16 text-sky-400" strokeWidth={1.2} />,
    content: (
      <StepManualForm
        name={manualName}
        legalName={manualLegalName}
        countryCode={manualCountryCode}
        cnpj={manualCnpj}
        cnpjDuplicate={manualCnpjDuplicate}
        nameError={nameError}
        onNameChange={setManualName}
        onLegalNameChange={setManualLegalName}
        onCountryCodeChange={setManualCountryCode}
        onCnpjChange={setManualCnpj}
        onNameErrorChange={setNameError}
        isSubmitting={isSubmitting}
      />
    ),
    onBack: handleBackToStep1,
    footer: (
      <Button
        type="button"
        onClick={handleSubmitManual}
        disabled={isSubmitting || !manualName.trim() || !!manualCnpjDuplicate || !!nameError}
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Check className="h-4 w-4 mr-2" />
        )}
        Criar Fabricante
      </Button>
    ),
  };

  const steps: WizardStep[] = [
    step1,
    flow === 'cnpj' ? step2Cnpj : step2Manual,
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
