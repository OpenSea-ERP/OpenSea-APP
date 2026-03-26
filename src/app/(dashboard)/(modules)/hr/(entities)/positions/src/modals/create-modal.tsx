'use client';

import { companiesApi } from '@/app/(dashboard)/(modules)/admin/(entities)/companies/src';
import { departmentsApi } from '@/app/(dashboard)/(modules)/hr/(entities)/departments/src';
import { Button } from '@/components/ui/button';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { translateError } from '@/lib/error-messages';
import type { Company, Department, Position } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookUser,
  Briefcase,
  Building2,
  Loader2,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (data: Partial<Position>) => Promise<void>;
}

export function CreateModal({
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
}: CreateModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [departmentId, setDepartmentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch departments
  const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery<
    Department[]
  >({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentsApi.list();
      return response.departments;
    },
    enabled: isOpen,
  });

  // Fetch companies for merge
  const { data: companiesData } = useQuery<Company[]>({
    queryKey: ['companies', 'list-for-departments'],
    queryFn: async () => {
      const response = await companiesApi.list({ perPage: 100 });
      const companies = Array.isArray(response)
        ? response
        : response?.companies || [];
      return companies;
    },
    enabled: isOpen,
  });

  // Merge departments with companies
  const departments = useMemo(() => {
    const depts = departmentsData || [];
    const companies = companiesData || [];
    const companiesMap = new Map<string, Company>();
    companies.forEach(company => companiesMap.set(company.id, company));

    return depts
      .filter(d => d.isActive)
      .map(dept => {
        if (!dept.company && dept.companyId) {
          const company = companiesMap.get(dept.companyId);
          if (company) return { ...dept, company };
        }
        return dept;
      });
  }, [departmentsData, companiesData]);

  const filteredDepartments = departments.filter(dept => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const companyName =
      dept.company?.tradeName || dept.company?.legalName || '';
    return (
      dept.name.toLowerCase().includes(query) ||
      dept.code.toLowerCase().includes(query) ||
      companyName.toLowerCase().includes(query)
    );
  });

  const selectedDepartment = departments.find(d => d.id === departmentId);

  const handleSelectDepartment = (dept: Department) => {
    setDepartmentId(dept.id);
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    if (name && code) {
      try {
        await onSubmit({
          name,
          code,
          departmentId: departmentId || null,
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
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setDepartmentId('');
    setSearchQuery('');
    setName('');
    setCode('');
    setFieldErrors({});
    onClose();
  };

  const steps: WizardStep[] = useMemo(
    () => [
      {
        title: 'Selecione o Departamento',
        description: 'Escolha o departamento ao qual este cargo pertence',
        icon: <BookUser className="h-16 w-16 text-indigo-500/60" />,
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
                placeholder="Buscar departamento por nome, código ou empresa..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1">
                {isLoadingDepartments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredDepartments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery
                      ? 'Nenhum departamento encontrado'
                      : 'Nenhum departamento cadastrado'}
                  </div>
                ) : (
                  filteredDepartments.map(dept => (
                    <div
                      key={dept.id}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectDepartment(dept)}
                    >
                      <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 shrink-0">
                        <BookUser className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate flex items-center gap-2">
                          {dept.name}
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-500/10 dark:text-slate-400">
                            {dept.code}
                          </span>
                        </p>
                        {dept.company && (
                          <p className="text-xs text-muted-foreground truncate">
                            {dept.company.tradeName || dept.company.legalName}
                          </p>
                        )}
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
        title: 'Informações do Cargo',
        description: 'Preencha as informações básicas do cargo',
        icon: <Briefcase className="h-16 w-16 text-indigo-500/60" />,
        isValid: name !== '' && code !== '' && !isSubmitting,
        onBack: () => setCurrentStep(1),
        content: (
          <div className="space-y-4">
            {selectedDepartment && (
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 shrink-0">
                    <BookUser className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Departamento
                    </p>
                    <p className="font-medium text-sm truncate">
                      {selectedDepartment.name}
                      {selectedDepartment.company && (
                        <span className="ml-1 text-xs text-muted-foreground font-normal">
                          —{' '}
                          {selectedDepartment.company.tradeName ||
                            selectedDepartment.company.legalName}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome do Cargo <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="name"
                    value={name}
                    onChange={e => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="Ex: Gerente de Vendas, Analista de TI"
                    autoFocus
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
                    value={code}
                    onChange={e => {
                      setCode(e.target.value);
                      if (fieldErrors.code) setFieldErrors(prev => ({ ...prev, code: '' }));
                    }}
                    placeholder="Ex: GER-VEN, ANA-TI"
                    aria-invalid={!!fieldErrors.code}
                  />
                  <FormErrorIcon message={fieldErrors.code || ''} />
                </div>
              </div>
            </div>
          </div>
        ),
        footer: (
          <Button
            onClick={handleSubmit}
            disabled={!name || !code || isSubmitting}
          >
            {isSubmitting ? 'Criando...' : 'Criar Cargo'}
          </Button>
        ),
      },
    ],
    [
      searchQuery,
      isLoadingDepartments,
      filteredDepartments,
      selectedDepartment,
      departments,
      name,
      code,
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
