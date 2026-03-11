'use client';

import { companiesApi } from '@/app/(dashboard)/(modules)/admin/(entities)/companies/src';
import { departmentsApi } from '@/app/(dashboard)/(modules)/hr/(entities)/departments/src';
import { positionsApi } from '@/app/(dashboard)/(modules)/hr/(entities)/positions/src';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { listPermissionGroups } from '@/services/rbac/rbac.service';
import type { Company, Department, Employee, Position } from '@/types/hr';
import type { PermissionGroup } from '@/types/rbac';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (
    data: Partial<Employee> & {
      createUser?: boolean;
      permissionGroupId?: string;
      userEmail?: string;
      userPassword?: string;
    }
  ) => Promise<void>;
}

type Step = 1 | 2 | 3;

export function CreateModal({
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
}: CreateModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [positionId, setPositionId] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [baseSalary, setBaseSalary] = useState<string>('');
  const [cpfError, setCpfError] = useState<string>('');
  const [createUser, setCreateUser] = useState<boolean>(false);
  const [permissionGroupId, setPermissionGroupId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // Buscar departamentos
  const { data: departmentsData } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentsApi.list();
      return response.departments;
    },
    enabled: isOpen,
  });

  // Buscar empresas para fazer o merge com departamentos
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

  // Buscar cargos
  const { data: positionsData } = useQuery<Position[]>({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await positionsApi.list();
      return response.positions;
    },
    enabled: isOpen,
  });

  // Buscar grupos de permissão
  const { data: permissionGroupsData } = useQuery<PermissionGroup[]>({
    queryKey: ['permission-groups'],
    queryFn: async () => {
      return await listPermissionGroups({ isActive: true });
    },
    enabled: isOpen && step >= 3,
  });

  // Criar mapa de empresas
  const companiesMap = useMemo(() => {
    const map = new Map<string, Company>();
    (companiesData || []).forEach(company => {
      map.set(company.id, company);
    });
    return map;
  }, [companiesData]);

  // Criar mapa de departamentos enriquecido com empresas
  const departmentsMap = useMemo(() => {
    const map = new Map<string, Department>();
    (departmentsData || []).forEach(dept => {
      let enrichedDept = dept;
      if (!dept.company && dept.companyId) {
        const company = companiesMap.get(dept.companyId);
        if (company) {
          enrichedDept = { ...dept, company };
        }
      }
      map.set(dept.id, enrichedDept);
    });
    return map;
  }, [departmentsData, companiesMap]);

  // Cargos com departamento e empresa enriquecidos
  const positions = useMemo(() => {
    return (positionsData || [])
      .filter(p => p.isActive)
      .map(pos => {
        let enrichedPos = pos;
        if (pos.departmentId && !pos.department) {
          const dept = departmentsMap.get(pos.departmentId);
          if (dept) {
            enrichedPos = { ...pos, department: dept };
          }
        } else if (
          pos.department &&
          !pos.department.company &&
          pos.department.companyId
        ) {
          const company = companiesMap.get(pos.department.companyId);
          if (company) {
            enrichedPos = {
              ...pos,
              department: { ...pos.department, company },
            };
          }
        }
        return enrichedPos;
      });
  }, [positionsData, departmentsMap, companiesMap]);

  const permissionGroups = permissionGroupsData || [];

  // Cargo selecionado
  const selectedPosition = positions.find(p => p.id === positionId);
  const selectedDepartment = selectedPosition?.department;
  const selectedCompany = selectedDepartment?.company;

  // Função auxiliar para mostrar nome do departamento com empresa
  const getDepartmentDisplayName = (dept: Department | null | undefined) => {
    if (!dept) return '';
    const companyName = dept.company?.tradeName || dept.company?.legalName;
    if (companyName) {
      return `${dept.name} - ${companyName}`;
    }
    return dept.name;
  };

  // Validar CPF
  const validateCPF = (cpfValue: string): boolean => {
    const cleanCpf = cpfValue.replace(/\D/g, '');

    if (cleanCpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

    // Valida primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    const digit1 = remainder >= 10 ? 0 : remainder;

    if (digit1 !== parseInt(cleanCpf.charAt(9))) return false;

    // Valida segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    const digit2 = remainder >= 10 ? 0 : remainder;

    if (digit2 !== parseInt(cleanCpf.charAt(10))) return false;

    return true;
  };

  // Validar Email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate CPF when it changes
  useEffect(() => {
    if (cpf && cpf.replace(/\D/g, '').length === 11) {
      if (!validateCPF(cpf)) {
        setCpfError('CPF inválido');
      } else {
        setCpfError('');
      }
    } else if (cpf && cpf.replace(/\D/g, '').length > 0) {
      setCpfError('');
    }
  }, [cpf]);

  // Validate email when it changes
  useEffect(() => {
    if (userEmail && userEmail.length > 0) {
      if (!validateEmail(userEmail)) {
        setEmailError('Email inválido');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  }, [userEmail]);

  // Validate password when it changes
  useEffect(() => {
    if (userPassword && userPassword.length > 0 && userPassword.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
    } else {
      setPasswordError('');
    }
  }, [userPassword]);

  const handleNext = () => {
    if (step === 1 && positionId) {
      setStep(2);
    } else if (step === 2 && fullName && !cpfError && baseSalary) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async () => {
    if (fullName && cpf && baseSalary) {
      const salaryValue = parseFloat(baseSalary.replace(/\D/g, '')) / 100;
      const cleanCpf = cpf.replace(/\D/g, '');

      await onSubmit({
        fullName,
        companyId: selectedCompany?.id || selectedDepartment?.companyId || null,
        departmentId: selectedDepartment?.id || null,
        positionId: positionId || null,
        registrationNumber: `EMP${Date.now()}`,
        cpf: cleanCpf,
        hireDate: new Date().toISOString(),
        baseSalary: salaryValue,
        contractType: 'CLT',
        workRegime: 'FULL_TIME',
        weeklyHours: 40,
        createUser,
        permissionGroupId: createUser ? permissionGroupId : undefined,
        userEmail: createUser ? userEmail : undefined,
        userPassword: createUser ? userPassword : undefined,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setPositionId('');
    setFullName('');
    setCpf('');
    setBaseSalary('');
    setCpfError('');
    setCreateUser(false);
    setPermissionGroupId('');
    setUserEmail('');
    setUserPassword('');
    setShowPassword(false);
    setEmailError('');
    setPasswordError('');
    onClose();
  };

  const canProceedStep1 = positionId !== '';
  const canProceedStep2 =
    fullName !== '' &&
    cpf.replace(/\D/g, '').length === 11 &&
    !cpfError &&
    baseSalary !== '';
  const canSubmit =
    !createUser ||
    (createUser &&
      permissionGroupId !== '' &&
      userEmail !== '' &&
      !emailError &&
      userPassword !== '' &&
      !passwordError);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-4 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-col flex">
                <span className="text-base">Novo Funcionário</span>
                <span className="text-xs text-slate-500/50 font-normal">
                  Etapa {step} de 3
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
          {/* Etapa 1: Selecionar Cargo */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Selecione o Cargo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Escolha o cargo que o funcionário irá ocupar. O departamento e
                  empresa serão definidos automaticamente.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">
                  Cargo <span className="text-red-500">*</span>
                </Label>
                <Select value={positionId} onValueChange={setPositionId}>
                  <SelectTrigger id="position">
                    <SelectValue placeholder="Selecione um cargo">
                      {positionId && selectedPosition && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedPosition.name}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {positions.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Nenhum cargo encontrado
                      </div>
                    ) : (
                      positions.map(pos => (
                        <SelectItem key={pos.id} value={pos.id}>
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span>{pos.name}</span>
                              {pos.department && (
                                <span className="text-xs text-muted-foreground">
                                  {pos.department.name}
                                  {pos.department.company &&
                                    ` - ${pos.department.company.tradeName || pos.department.company.legalName}`}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground ml-auto">
                              ({pos.code})
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedPosition && (
                <div className="rounded-lg bg-muted p-4 space-y-2 animate-in fade-in-50 duration-300">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Departamento</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedDepartment
                          ? getDepartmentDisplayName(selectedDepartment)
                          : 'Não definido'}
                      </p>
                    </div>
                  </div>
                  {selectedCompany && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Empresa</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedCompany.tradeName ||
                            selectedCompany.legalName}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

          {/* Etapa 2: Informações do Funcionário */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Informações do Funcionário
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Preencha as informações básicas do funcionário
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Cargo</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPosition?.name}
                      </p>
                    </div>
                  </div>
                  {selectedDepartment && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Departamento</p>
                        <p className="text-sm text-muted-foreground">
                          {getDepartmentDisplayName(selectedDepartment)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Nome Completo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">
                    CPF <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cpf"
                    value={cpf}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 11) {
                        const formatted = value
                          .replace(/(\d{3})(\d)/, '$1.$2')
                          .replace(/(\d{3})(\d)/, '$1.$2')
                          .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                        setCpf(formatted);
                      }
                    }}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={
                      cpfError
                        ? 'border-red-500 focus-visible:ring-red-500'
                        : ''
                    }
                  />
                  {cpfError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {cpfError}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseSalary">
                    Salário Base <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="baseSalary"
                    value={baseSalary}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, '');
                      const formatted = (
                        parseInt(value || '0') / 100
                      ).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      });
                      setBaseSalary(formatted);
                    }}
                    placeholder="R$ 0,00"
                  />
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
                    onClick={handleNext}
                    disabled={!canProceedStep2}
                    className="gap-2"
                  >
                    Próximo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Etapa 3: Criar Usuário (Opcional) */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">
                  Criar Usuário do Sistema
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Opcionalmente, crie um usuário de acesso ao sistema para este
                  funcionário
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Funcionário</p>
                      <p className="text-sm text-muted-foreground">
                        {fullName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Cargo</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedPosition?.name}
                      </p>
                    </div>
                  </div>
                  {selectedDepartment && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Departamento</p>
                        <p className="text-sm text-muted-foreground">
                          {getDepartmentDisplayName(selectedDepartment)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="createUser"
                      className="text-base cursor-pointer"
                    >
                      Criar usuário de acesso
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que o funcionário faça login no sistema
                    </p>
                  </div>
                  <Switch
                    id="createUser"
                    checked={createUser}
                    onCheckedChange={setCreateUser}
                  />
                </div>

                {createUser && (
                  <div className="space-y-4 animate-in fade-in-50 duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="userEmail">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="userEmail"
                          type="email"
                          value={userEmail}
                          onChange={e => setUserEmail(e.target.value)}
                          placeholder="email@exemplo.com"
                          className={`pl-10 ${
                            emailError
                              ? 'border-red-500 focus-visible:ring-red-500'
                              : ''
                          }`}
                        />
                      </div>
                      {emailError && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {emailError}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="userPassword">
                        Senha <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="userPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={userPassword}
                          onChange={e => setUserPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className={`pl-10 pr-10 ${
                            passwordError
                              ? 'border-red-500 focus-visible:ring-red-500'
                              : ''
                          }`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                      {passwordError && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {passwordError}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="permissionGroup">
                        Grupo de Permissão{' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={permissionGroupId}
                        onValueChange={setPermissionGroupId}
                      >
                        <SelectTrigger id="permissionGroup">
                          <SelectValue placeholder="Selecione um grupo de permissão">
                            {permissionGroupId && (
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {
                                    permissionGroups.find(
                                      g => g.id === permissionGroupId
                                    )?.name
                                  }
                                </span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {permissionGroups.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Nenhum grupo de permissão disponível
                            </div>
                          ) : (
                            permissionGroups.map(group => (
                              <SelectItem key={group.id} value={group.id}>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{group.name}</p>
                                    {group.description && (
                                      <p className="text-xs text-muted-foreground">
                                        {group.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {!permissionGroupId && (
                        <p className="text-xs text-muted-foreground">
                          Selecione um grupo de permissão para definir o nível
                          de acesso do usuário
                        </p>
                      )}
                    </div>
                  </div>
                )}
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
                    {isSubmitting ? 'Criando...' : 'Criar Funcionário'}
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
