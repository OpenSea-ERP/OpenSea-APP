'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import type { CreateCustomerRequest, CustomerType } from '@/types/sales';
import { Check, Loader2, MapPin, User } from 'lucide-react';
import { useCallback, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────

interface CreateCustomerWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCustomerRequest) => Promise<void>;
  isSubmitting?: boolean;
}

// ─── Step 1: Informações Básicas ──────────────────────────────

function StepBasicInfo({
  name,
  onNameChange,
  type,
  onTypeChange,
  document,
  onDocumentChange,
  email,
  onEmailChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  type: CustomerType;
  onTypeChange: (v: CustomerType) => void;
  document: string;
  onDocumentChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome *</Label>
        <Input
          placeholder="Nome completo ou razão social"
          value={name}
          onChange={e => onNameChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Tipo de Pessoa *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={type}
          onChange={e => onTypeChange(e.target.value as CustomerType)}
        >
          <option value="INDIVIDUAL">Pessoa Física</option>
          <option value="BUSINESS">Pessoa Jurídica</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label>{type === 'INDIVIDUAL' ? 'CPF' : 'CNPJ'}</Label>
        <Input
          placeholder={
            type === 'INDIVIDUAL' ? '000.000.000-00' : '00.000.000/0000-00'
          }
          value={document}
          onChange={e => onDocumentChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>E-mail</Label>
        <Input
          type="email"
          placeholder="cliente@exemplo.com"
          value={email}
          onChange={e => onEmailChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Step 2: Endereço e Observações ───────────────────────────

function StepAddressAndNotes({
  phone,
  onPhoneChange,
  address,
  onAddressChange,
  city,
  onCityChange,
  state,
  onStateChange,
  zipCode,
  onZipCodeChange,
  country,
  onCountryChange,
  notes,
  onNotesChange,
}: {
  phone: string;
  onPhoneChange: (v: string) => void;
  address: string;
  onAddressChange: (v: string) => void;
  city: string;
  onCityChange: (v: string) => void;
  state: string;
  onStateChange: (v: string) => void;
  zipCode: string;
  onZipCodeChange: (v: string) => void;
  country: string;
  onCountryChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Telefone</Label>
        <Input
          placeholder="(00) 00000-0000"
          value={phone}
          onChange={e => onPhoneChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Endereço</Label>
        <Input
          placeholder="Rua, número, complemento"
          value={address}
          onChange={e => onAddressChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input
            placeholder="Cidade"
            value={city}
            onChange={e => onCityChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <Input
            placeholder="UF"
            value={state}
            onChange={e => onStateChange(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>CEP</Label>
          <Input
            placeholder="00000-000"
            value={zipCode}
            onChange={e => onZipCodeChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>País</Label>
          <Input
            placeholder="Brasil"
            value={country}
            onChange={e => onCountryChange(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          placeholder="Notas adicionais sobre o cliente..."
          rows={3}
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreateCustomerWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateCustomerWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomerType>('INDIVIDUAL');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setName('');
    setType('INDIVIDUAL');
    setDocument('');
    setEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setCountry('');
    setNotes('');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    const payload: CreateCustomerRequest = {
      name: name.trim(),
      type,
      document: document.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zipCode: zipCode.trim() || undefined,
      country: country.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    await onSubmit(payload);
    handleClose();
  }, [
    name,
    type,
    document,
    email,
    phone,
    address,
    city,
    state,
    zipCode,
    country,
    notes,
    onSubmit,
    handleClose,
  ]);

  const steps: WizardStep[] = [
    {
      title: 'Informações Básicas',
      description: 'Preencha os dados principais do cliente.',
      icon: <User className="h-16 w-16 text-sky-400" strokeWidth={1.2} />,
      content: (
        <StepBasicInfo
          name={name}
          onNameChange={setName}
          type={type}
          onTypeChange={setType}
          document={document}
          onDocumentChange={setDocument}
          email={email}
          onEmailChange={setEmail}
        />
      ),
      isValid: name.trim().length > 0,
    },
    {
      title: 'Endereço e Observações',
      description: 'Informe o endereço e dados complementares.',
      icon: <MapPin className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />,
      onBack: () => setCurrentStep(1),
      content: (
        <StepAddressAndNotes
          phone={phone}
          onPhoneChange={setPhone}
          address={address}
          onAddressChange={setAddress}
          city={city}
          onCityChange={setCity}
          state={state}
          onStateChange={setState}
          zipCode={zipCode}
          onZipCodeChange={setZipCode}
          country={country}
          onCountryChange={setCountry}
          notes={notes}
          onNotesChange={setNotes}
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
          Criar Cliente
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
