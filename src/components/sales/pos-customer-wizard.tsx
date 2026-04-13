'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Search,
  UserPlus,
  UserX,
  User,
  Building2,
  Phone,
  Mail,
  Loader2,
} from 'lucide-react';
import { customersService } from '@/services/sales/customers.service';
import type { Customer, CreateCustomerRequest } from '@/types/sales';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

interface PosCustomerWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCustomer: (customerId: string, customerName: string) => void;
  onAnonymous?: () => void;
  allowAnonymous?: boolean;
}

// =============================================================================
// STEP 1: SEARCH / SELECT
// =============================================================================

function StepSearchContent({
  search,
  onSearchChange,
  onSelect,
  onAnonymous,
  allowAnonymous,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (customer: Customer) => void;
  onAnonymous?: () => void;
  allowAnonymous?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['pos-customer-search', search] as const,
    queryFn: async () => {
      const result = await customersService.list({
        search: search || undefined,
        limit: 10,
        page: 1,
      });
      return result.customers;
    },
    enabled: search.length >= 2,
  });

  const customers = data ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pesquisar cliente</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nome, CPF/CNPJ, e-mail ou telefone..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && search.length >= 2 && customers.length === 0 && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          Nenhum cliente encontrado para &quot;{search}&quot;
        </div>
      )}

      {customers.length > 0 && (
        <div className="max-h-[280px] overflow-y-auto space-y-2">
          {customers.map(customer => (
            <Card
              key={customer.id}
              className={cn(
                'flex items-center gap-3 p-3 cursor-pointer transition-colors',
                'hover:bg-violet-50 dark:hover:bg-violet-500/10',
                'bg-white dark:bg-slate-800/60 border border-border'
              )}
              onClick={() => onSelect(customer)}
            >
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg',
                  customer.type === 'BUSINESS'
                    ? 'bg-sky-50 dark:bg-sky-500/10'
                    : 'bg-violet-50 dark:bg-violet-500/10'
                )}
              >
                {customer.type === 'BUSINESS' ? (
                  <Building2 className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                ) : (
                  <User className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{customer.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {customer.document && <span>{customer.document}</span>}
                  {customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {customer.type === 'BUSINESS' ? 'PJ' : 'PF'}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      {allowAnonymous && onAnonymous && (
        <button
          type="button"
          onClick={onAnonymous}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 py-3',
            'text-sm font-medium text-zinc-500 transition-colors',
            'hover:border-zinc-400 hover:text-zinc-700',
            'dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-300'
          )}
        >
          <UserX className="h-4 w-4" />
          Consumidor não identificado
        </button>
      )}
    </div>
  );
}

// =============================================================================
// STEP 2: QUICK CREATE
// =============================================================================

function StepQuickCreateContent({
  name,
  onNameChange,
  phone,
  onPhoneChange,
  email,
  onEmailChange,
  document,
  onDocumentChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
  email: string;
  onEmailChange: (v: string) => void;
  document: string;
  onDocumentChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Cadastro rápido — preencha pelo menos o nome.
      </p>
      <div className="space-y-2">
        <Label>Nome *</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Nome completo"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>CPF/CNPJ</Label>
        <Input
          placeholder="000.000.000-00"
          value={document}
          onChange={e => onDocumentChange(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Telefone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={e => onPhoneChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="email@exemplo.com"
              value={email}
              onChange={e => onEmailChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// WIZARD
// =============================================================================

export function PosCustomerWizard({
  open,
  onOpenChange,
  onSelectCustomer,
  onAnonymous,
  allowAnonymous = false,
}: PosCustomerWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDocument, setNewDocument] = useState('');

  const createCustomer = useMutation({
    mutationFn: (data: CreateCustomerRequest) => customersService.create(data),
    onSuccess: response => {
      const customer = response.customer;
      toast.success('Cliente cadastrado com sucesso.');
      onSelectCustomer(customer.id, customer.name);
      handleClose();
    },
    onError: () => {
      toast.error('Erro ao cadastrar cliente.');
    },
  });

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setSearch('');
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewDocument('');
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    resetForm();
  }, [onOpenChange, resetForm]);

  const handleSelect = useCallback(
    (customer: Customer) => {
      onSelectCustomer(customer.id, customer.name);
      handleClose();
    },
    [onSelectCustomer, handleClose]
  );

  const handleAnonymous = useCallback(() => {
    onAnonymous?.();
    handleClose();
  }, [onAnonymous, handleClose]);

  const steps: WizardStep[] = [
    {
      title: 'Identificar Cliente',
      icon: <Search className="h-5 w-5" />,
      content: (
        <StepSearchContent
          search={search}
          onSearchChange={setSearch}
          onSelect={handleSelect}
          onAnonymous={allowAnonymous ? handleAnonymous : undefined}
          allowAnonymous={allowAnonymous}
        />
      ),
    },
    {
      title: 'Cadastro Rápido',
      icon: <UserPlus className="h-5 w-5" />,
      content: (
        <StepQuickCreateContent
          name={newName}
          onNameChange={setNewName}
          phone={newPhone}
          onPhoneChange={setNewPhone}
          email={newEmail}
          onEmailChange={setNewEmail}
          document={newDocument}
          onDocumentChange={setNewDocument}
        />
      ),
      isValid: newName.trim().length > 0,
      footer: (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={() => {
              if (!newName.trim()) {
                toast.error('Nome é obrigatório.');
                return;
              }
              createCustomer.mutate({
                name: newName.trim(),
                type: 'INDIVIDUAL',
                document: newDocument.trim() || undefined,
                phone: newPhone.trim() || undefined,
                email: newEmail.trim() || undefined,
              });
            }}
            disabled={!newName.trim() || createCustomer.isPending}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg',
              'bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50'
            )}
          >
            {createCustomer.isPending ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={v => {
        if (!v) handleClose();
        else onOpenChange(v);
      }}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
