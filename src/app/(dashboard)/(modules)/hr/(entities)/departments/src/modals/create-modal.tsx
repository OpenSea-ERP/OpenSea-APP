'use client';

import { companiesApi } from '@/app/(dashboard)/(modules)/admin/(entities)/companies/src/api';
import { Card } from '@/components/ui/card';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { translateError } from '@/lib/error-messages';
import type { Company, Department } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import { formatCNPJ } from '@/helpers/formatters';
import {
  BookUser,
  Building2,
  Check,
  Loader2,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (data: Partial<Department>) => Promise<void>;
}

export function CreateModal({
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
}: CreateModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [wasOpen, setWasOpen] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset when modal opens
  if (isOpen && !wasOpen) {
    setWasOpen(true);
    setCurrentStep(1);
    setSelectedCompany(null);
    setSearchQuery('');
    setDepartmentName('');
    setDepartmentCode('');
    setDepartmentDescription('');
    setFieldErrors({});
  }
  if (!isOpen && wasOpen) {
    setWasOpen(false);
  }

  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies', 'list'],
    queryFn: async () => {
      const response = await companiesApi.list({
        perPage: 100,
        includeDeleted: false,
      });

      let companies: Company[] = [];
      if (Array.isArray(response)) {
        companies = response;
      } else if (response && 'companies' in response) {
        companies = response.companies || [];
      } else if (response && 'data' in response) {
        const data = (response as { data: unknown }).data;
        companies = Array.isArray(data) ? data : [];
      }

      return companies.filter((company: Company) => !company.deletedAt);
    },
    enabled: isOpen,
  });

  const companies = companiesData || [];

  const filteredCompanies = companies.filter(company => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      company.legalName.toLowerCase().includes(query) ||
      company.tradeName?.toLowerCase().includes(query) ||
      company.cnpj.includes(query)
    );
  });

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setCurrentStep(2);
  };

  const resetDepartmentFields = () => {
    setDepartmentName('');
    setDepartmentCode('');
    setDepartmentDescription('');
  };

  const handleSubmit = async () => {
    if (!selectedCompany || !departmentName || !departmentCode) return;

    try {
      await onSubmit({
        name: departmentName,
        code: departmentCode,
        description: departmentDescription || undefined,
        companyId: selectedCompany.id,
        isActive: true,
      });

      handleClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('name already') || msg.includes('already exists') || msg.includes('nome')) {
        setFieldErrors(prev => ({ ...prev, name: translateError(msg) }));
      } else if (msg.includes('code') || msg.includes('código')) {
        setFieldErrors(prev => ({ ...prev, code: translateError(msg) }));
      } else {
        toast.error(translateError(msg));
      }
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Focus name input when entering step 2
  useEffect(() => {
    if (currentStep === 2 && isOpen) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isOpen]);

  const steps: WizardStep[] = useMemo(
    () => [
      {
        title: 'Selecione a Empresa',
        description: 'Escolha a empresa para o novo departamento',
        icon: <Building2 className="h-16 w-16 text-emerald-500/60" />,
        isValid: false,
        footer: (
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
        ),
        content: (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresa por nome ou CNPJ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1">
                {isLoadingCompanies ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCompanies.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery
                      ? 'Nenhuma empresa encontrada'
                      : 'Nenhuma empresa cadastrada'}
                  </div>
                ) : (
                  filteredCompanies.map(company => (
                    <div
                      key={company.id}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectCompany(company)}
                    >
                      <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 shrink-0">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {company.tradeName || company.legalName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatCNPJ(company.cnpj)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        ),
      },
      {
        title: 'Dados do Departamento',
        description: 'Preencha as informações do novo departamento',
        icon: <BookUser className="h-16 w-16 text-emerald-500/60" />,
        isValid: !!departmentName && !!departmentCode && !isSubmitting,
        onBack: () => setCurrentStep(1),
        content: (
          <div className="flex flex-col h-full space-y-4">
            {/* Selected company */}
            <Card className="p-3 bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 shrink-0">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Empresa</p>
                  <p className="font-medium text-sm truncate">
                    {selectedCompany?.tradeName || selectedCompany?.legalName}
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-[1fr_20%] gap-3">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome do Departamento <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    ref={nameInputRef}
                    id="name"
                    placeholder="Ex: Recursos Humanos"
                    value={departmentName}
                    onChange={e => {
                      setDepartmentName(e.target.value);
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                    aria-invalid={!!fieldErrors.name}
                  />
                  <FormErrorIcon message={fieldErrors.name || ''} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">
                  Código <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="code"
                    placeholder="Ex: RH"
                    value={departmentCode}
                    onChange={e => {
                      setDepartmentCode(e.target.value.toUpperCase());
                      if (fieldErrors.code) setFieldErrors(prev => ({ ...prev, code: '' }));
                    }}
                    aria-invalid={!!fieldErrors.code}
                  />
                  <FormErrorIcon message={fieldErrors.code || ''} />
                </div>
              </div>
            </div>

            <div className="space-y-2 flex-1 flex flex-col">
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                placeholder="Descrição do departamento (opcional)"
                value={departmentDescription}
                onChange={e => setDepartmentDescription(e.target.value)}
                className="flex-1 min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>
        ),
        footer: (
          <Button
            type="button"
            disabled={isSubmitting || !departmentName || !departmentCode}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Departamento'
            )}
          </Button>
        ),
      },
    ],
    [
      searchQuery,
      isLoadingCompanies,
      filteredCompanies,
      selectedCompany,
      departmentName,
      departmentCode,
      departmentDescription,
      isSubmitting,
    ]
  );

  return (
    <StepWizardDialog
      open={isOpen}
      onOpenChange={open => !open && handleClose()}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
