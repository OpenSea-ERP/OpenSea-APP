'use client';

import { companiesApi } from '@/app/(dashboard)/(modules)/admin/(entities)/companies/src';
import { departmentsApi } from '@/app/(dashboard)/(modules)/hr/(entities)/departments/src';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Company, Department, Position } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Briefcase, Building2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (data: Partial<Position>) => Promise<void>;
}

type Step = 1 | 2;

export function CreateModal({
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
}: CreateModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [departmentId, setDepartmentId] = useState<string>('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  // Buscar departamentos
  const { data: departmentsData } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentsApi.list();
      return response.departments;
    },
    enabled: isOpen,
  });

  // Buscar empresas para fazer o merge
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

  // Merge departamentos com empresas
  const departments = useMemo(() => {
    const depts = departmentsData || [];
    const companies = companiesData || [];

    // Criar mapa de empresas por ID
    const companiesMap = new Map<string, Company>();
    companies.forEach(company => {
      companiesMap.set(company.id, company);
    });

    // Adicionar empresa ao departamento se não existir
    return depts.map(dept => {
      if (!dept.company && dept.companyId) {
        const company = companiesMap.get(dept.companyId);
        if (company) {
          return { ...dept, company };
        }
      }
      return dept;
    });
  }, [departmentsData, companiesData]);

  // Função auxiliar para mostrar nome do departamento com empresa
  const getDepartmentDisplayName = (dept: Department) => {
    const companyName = dept.company?.tradeName || dept.company?.legalName;
    if (companyName) {
      return `${dept.name} - ${companyName}`;
    }
    return dept.name;
  };

  const handleNext = () => {
    if (step === 1 && departmentId) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async () => {
    if (name && code) {
      await onSubmit({
        name,
        code,
        departmentId: departmentId || null,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setDepartmentId('');
    setName('');
    setCode('');
    onClose();
  };

  const canProceedStep1 = departmentId !== '';
  const canSubmit = name !== '' && code !== '';

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-4 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="flex-col flex">
                <span className="text-base">Novo Cargo</span>
                <span className="text-xs text-slate-500/50 font-normal">
                  Etapa {step} de 2
                </span>
              </div>
            </div>
          </DialogTitle>
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Fechar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Etapa 1: Selecionar Departamento */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Selecione o Departamento
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Escolha o departamento ao qual este cargo pertence
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">
                  Departamento <span className="text-red-500">*</span>
                </Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Selecione um departamento">
                      {departmentId && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {getDepartmentDisplayName(
                              departments.find(d => d.id === departmentId)!
                            )}
                          </span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {departments
                      .filter(d => d.isActive)
                      .map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span>{dept.name}</span>
                              {dept.company && (
                                <span className="text-xs text-muted-foreground">
                                  {dept.company.tradeName ||
                                    dept.company.legalName}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground ml-auto">
                              ({dept.code})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!canProceedStep1}
                  className="gap-2"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Etapa 2: Informações do Cargo */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Informações do Cargo
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Preencha as informações básicas do cargo
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nome do Cargo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Gerente de Vendas, Analista de TI"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">
                    Código <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="Ex: GER-VEN, ANA-TI"
                  />
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">
                        Departamento Selecionado
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getDepartmentDisplayName(
                          departments.find(d => d.id === departmentId)!
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="gap-2"
                  >
                    {isSubmitting ? 'Criando...' : 'Criar Cargo'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
