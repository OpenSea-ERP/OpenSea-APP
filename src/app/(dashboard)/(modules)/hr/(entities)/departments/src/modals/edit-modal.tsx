'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { translateError } from '@/lib/error-messages';
import { companiesApi } from '@/app/(dashboard)/(modules)/admin/(entities)/companies/src/api';
import type { Company, Department } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  Check,
  Edit,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department | null;
  isSubmitting: boolean;
  onSubmit: (id: string, data: Partial<Department>) => Promise<void>;
}

export function EditModal({
  isOpen,
  onClose,
  department,
  isSubmitting,
  onSubmit,
}: EditModalProps) {
  const router = useRouter();

  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lastDepartmentId, setLastDepartmentId] = useState<string | null>(null);

  // Sync state with department when it changes
  if (department && department.id !== lastDepartmentId) {
    setLastDepartmentId(department.id);
    setDepartmentName(department.name);
    setDepartmentCode(department.code);
    setDepartmentDescription(department.description || '');
    setIsActive(department.isActive);
    setSelectedCompany(department.company || null);
    setShowCompanySelector(false);
    setSearchQuery('');
    setFieldErrors({});
  }

  // Reset when modal closes
  if (!isOpen && lastDepartmentId !== null) {
    setLastDepartmentId(null);
  }

  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies', 'list'],
    queryFn: async () => {
      const response = await companiesApi.list({
        perPage: 100,
        includeDeleted: false,
      });
      // A resposta pode ser um array direto ou um objeto com propriedade 'companies'
      const companies = Array.isArray(response)
        ? response
        : response?.companies || [];
      return companies.filter((company: Company) => !company.deletedAt);
    },
    enabled: isOpen && showCompanySelector,
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
    setShowCompanySelector(false);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!department || !departmentName || !departmentCode) return;

    try {
      await onSubmit(department.id, {
        name: departmentName,
        code: departmentCode,
        description: departmentDescription || undefined,
        companyId: selectedCompany?.id || department.companyId,
        isActive,
      });

      onClose();
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
    setShowCompanySelector(false);
    setSearchQuery('');
    onClose();
  };

  if (!department) return null;

  const companyName =
    selectedCompany?.tradeName ||
    selectedCompany?.legalName ||
    department.company?.tradeName ||
    department.company?.legalName;

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
                <span>Editar Departamento</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {department.name}
                </span>
              </div>
            </div>
          </DialogTitle>
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    handleClose();
                    router.push(`/hr/departments/${department.id}`);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edição avançada</p>
              </TooltipContent>
            </Tooltip>

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

        {showCompanySelector ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Selecionar Empresa</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCompanySelector(false)}
              >
                Cancelar
              </Button>
            </div>

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
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
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
                    {companyName || 'Empresa não definida'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompanySelector(true)}
                >
                  Alterar
                </Button>
              </div>
            </Card>

            {/* Campos do departamento */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Departamento *</Label>
                <div className="relative">
                  <Input
                    id="name"
                    placeholder="Ex: Recursos Humanos"
                    value={departmentName}
                    onChange={e => {
                      setDepartmentName(e.target.value);
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                    required
                    aria-invalid={!!fieldErrors.name}
                  />
                  <FormErrorIcon message={fieldErrors.name} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <div className="relative">
                  <Input
                    id="code"
                    placeholder="Ex: RH"
                    value={departmentCode}
                    onChange={e => {
                      setDepartmentCode(e.target.value.toUpperCase());
                      if (fieldErrors.code) setFieldErrors(prev => ({ ...prev, code: '' }));
                    }}
                    required
                    aria-invalid={!!fieldErrors.code}
                  />
                  <FormErrorIcon message={fieldErrors.code} />
                </div>
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

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {isActive ? 'Departamento ativo' : 'Departamento inativo'}
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
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
                    Salvar
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
