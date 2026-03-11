'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { companiesApi } from '@/app/(dashboard)/(modules)/admin/(entities)/companies/src/api';
import type { Company, Department } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (data: Partial<Department>) => Promise<void>;
}

type Step = 'company' | 'department';

export function CreateModal({
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
}: CreateModalProps) {
  const [step, setStep] = useState<Step>('company');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');
  const [wasOpen, setWasOpen] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Track open state and reset when modal opens
  if (isOpen && !wasOpen) {
    setWasOpen(true);
    setStep('company');
    setSelectedCompany(null);
    setSearchQuery('');
    setDepartmentName('');
    setDepartmentCode('');
    setDepartmentDescription('');
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

      // A resposta pode ser um array direto ou um objeto com propriedade 'companies'
      let companies: Company[] = [];
      if (Array.isArray(response)) {
        companies = response;
      } else if (response && 'companies' in response) {
        companies = response.companies || [];
      } else if (response && 'data' in response) {
        // Pode vir como { data: [...] }
        const data = (response as { data: unknown }).data;
        companies = Array.isArray(data) ? data : [];
      }

      const filtered = companies.filter(
        (company: Company) => !company.deletedAt
      );
      return filtered;
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
    setStep('department');
  };

  const handleBack = () => {
    setStep('company');
  };

  const resetDepartmentFields = () => {
    setDepartmentName('');
    setDepartmentCode('');
    setDepartmentDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompany || !departmentName || !departmentCode) return;

    await onSubmit({
      name: departmentName,
      code: departmentCode,
      description: departmentDescription || undefined,
      companyId: selectedCompany.id,
      isActive: true,
    });

    // Reset apenas os campos do departamento, mantendo a empresa selecionada
    resetDepartmentFields();

    // Foca no campo de nome após o reset
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 100);
  };

  const handleClose = () => {
    onClose();
  };

  // Foca no input de nome quando muda para a etapa de departamento
  useEffect(() => {
    if (step === 'department' && isOpen) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-4 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-blue-500 to-cyan-600 p-2 rounded-lg">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex-col flex">
                <span>Novo Departamento</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {step === 'company'
                    ? 'Etapa 1: Selecione a empresa'
                    : 'Etapa 2: Dados do departamento'}
                </span>
              </div>
            </div>
          </DialogTitle>
          <div className="flex items-center gap-2">
            {step === 'department' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voltar</p>
                </TooltipContent>
              </Tooltip>
            )}
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

        {step === 'company' ? (
          <div className="space-y-4 py-4">
            {/* Barra de pesquisa */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresa por nome ou CNPJ..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Lista de empresas */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
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
                  <Card
                    key={company.id}
                    className="p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleSelectCompany(company)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 shrink-0">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {company.tradeName || company.legalName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {company.cnpj}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Empresa selecionada */}
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 shrink-0">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Empresa</p>
                  <p className="font-medium truncate">
                    {selectedCompany?.tradeName || selectedCompany?.legalName}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                >
                  Alterar
                </Button>
              </div>
            </Card>

            {/* Campos do departamento */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Departamento *</Label>
                <Input
                  ref={nameInputRef}
                  id="name"
                  placeholder="Ex: Recursos Humanos"
                  value={departmentName}
                  onChange={e => setDepartmentName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  placeholder="Ex: RH"
                  value={departmentCode}
                  onChange={e =>
                    setDepartmentCode(e.target.value.toUpperCase())
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Descrição do departamento (opcional)"
                  value={departmentDescription}
                  onChange={e => setDepartmentDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !departmentName || !departmentCode}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Salvar e Criar Outro
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
