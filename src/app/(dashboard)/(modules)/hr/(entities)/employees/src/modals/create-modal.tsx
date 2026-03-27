'use client';

import { companiesApi } from '@/app/(dashboard)/(modules)/admin/(entities)/companies/src';
import { departmentsApi } from '@/app/(dashboard)/(modules)/hr/(entities)/departments/src';
import { positionsApi } from '@/app/(dashboard)/(modules)/hr/(entities)/positions/src';
import { Button } from '@/components/ui/button';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Switch } from '@/components/ui/switch';
import { translateError } from '@/lib/error-messages';
import { authLinksService } from '@/services/auth/auth-links.service';
import { listPermissionGroups } from '@/services/rbac/rbac.service';
import type { Company, Department, Employee, Position } from '@/types/hr';
import type { PermissionGroup } from '@/types/rbac';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CreditCard,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
  Search,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
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

export function CreateModal({
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
}: CreateModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [positionId, setPositionId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState<string>('');
  const [createUser, setCreateUser] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // Fetch departments
  const { data: departmentsData } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await departmentsApi.list();
      return response.departments;
    },
    enabled: isOpen,
  });

  // Fetch companies
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

  // Fetch positions
  const { data: positionsData, isLoading: isLoadingPositions } = useQuery<
    Position[]
  >({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await positionsApi.list();
      return response.positions;
    },
    enabled: isOpen,
  });

  // Fetch tenant auth config (to know which auth methods are enabled)
  const { data: authConfig } = useQuery({
    queryKey: ['tenant-auth-config'],
    queryFn: () => authLinksService.getTenantAuthConfig(),
    enabled: isOpen,
  });

  // Fetch permission groups to find default "Usuário" group
  const { data: permissionGroupsData } = useQuery<PermissionGroup[]>({
    queryKey: ['permission-groups'],
    queryFn: async () => {
      return await listPermissionGroups({ isActive: true });
    },
    enabled: isOpen,
  });

  // Auto-select "Usuário" group as default
  const defaultPermissionGroupId = useMemo(() => {
    const groups = permissionGroupsData || [];
    const userGroup = groups.find(g => g.name === 'Usuário');
    return userGroup?.id || '';
  }, [permissionGroupsData]);

  // Companies map
  const companiesMap = useMemo(() => {
    const map = new Map<string, Company>();
    (companiesData || []).forEach(company => map.set(company.id, company));
    return map;
  }, [companiesData]);

  // Departments map enriched with companies
  const departmentsMap = useMemo(() => {
    const map = new Map<string, Department>();
    (departmentsData || []).forEach(dept => {
      let enrichedDept = dept;
      if (!dept.company && dept.companyId) {
        const company = companiesMap.get(dept.companyId);
        if (company) enrichedDept = { ...dept, company };
      }
      map.set(dept.id, enrichedDept);
    });
    return map;
  }, [departmentsData, companiesMap]);

  // Positions enriched with department and company
  const positions = useMemo(() => {
    return (positionsData || [])
      .filter(p => p.isActive)
      .map(pos => {
        let enrichedPos = pos;
        if (pos.departmentId && !pos.department) {
          const dept = departmentsMap.get(pos.departmentId);
          if (dept) enrichedPos = { ...pos, department: dept };
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

  const selectedPosition = positions.find(p => p.id === positionId);
  const selectedDepartment = selectedPosition?.department;
  const selectedCompany = selectedDepartment?.company;

  const filteredPositions = positions.filter(pos => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const deptName = pos.department?.name || '';
    const companyName =
      pos.department?.company?.tradeName ||
      pos.department?.company?.legalName ||
      '';
    return (
      pos.name.toLowerCase().includes(query) ||
      pos.code.toLowerCase().includes(query) ||
      deptName.toLowerCase().includes(query) ||
      companyName.toLowerCase().includes(query)
    );
  });

  const handleSelectPosition = (pos: Position) => {
    setPositionId(pos.id);
    setCurrentStep(2);
  };

  const getDepartmentDisplayName = (dept: Department | null | undefined) => {
    if (!dept) return '';
    const companyName = dept.company?.tradeName || dept.company?.legalName;
    if (companyName) return `${dept.name} - ${companyName}`;
    return dept.name;
  };

  // CPF validation
  const validateCPF = (cpfValue: string): boolean => {
    const cleanCpf = cpfValue.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    const digit1 = remainder >= 10 ? 0 : remainder;
    if (digit1 !== parseInt(cleanCpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    const digit2 = remainder >= 10 ? 0 : remainder;
    if (digit2 !== parseInt(cleanCpf.charAt(10))) return false;

    return true;
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validate CPF
  useEffect(() => {
    if (cpf && cpf.replace(/\D/g, '').length === 11) {
      setCpfError(!validateCPF(cpf) ? 'CPF inválido' : '');
    } else if (cpf && cpf.replace(/\D/g, '').length > 0) {
      setCpfError('');
    }
  }, [cpf]);

  // Validate email
  useEffect(() => {
    if (userEmail && userEmail.length > 0) {
      setEmailError(!validateEmail(userEmail) ? 'Email inválido' : '');
    } else {
      setEmailError('');
    }
  }, [userEmail]);

  // Validate password
  useEffect(() => {
    if (userPassword && userPassword.length > 0 && userPassword.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
    } else {
      setPasswordError('');
    }
  }, [userPassword]);

  const handleSubmit = async () => {
    if (fullName && cpf) {
      const cleanCpf = cpf.replace(/\D/g, '');

      try {
        await onSubmit({
          fullName,
          companyId: selectedCompany?.id || selectedDepartment?.companyId || null,
          departmentId: selectedDepartment?.id || null,
          positionId: positionId || null,
          registrationNumber: `EMP${Date.now()}`,
          cpf: cleanCpf,
          hireDate: new Date().toISOString(),
          contractType: 'CLT',
          workRegime: 'FULL_TIME',
          weeklyHours: 40,
          createUser,
          permissionGroupId: createUser ? defaultPermissionGroupId : undefined,
          userEmail: createUser ? userEmail : undefined,
          userPassword: createUser ? userPassword : undefined,
        });
        handleClose();
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('CPF') || msg.includes('cpf')) {
          setCpfError(translateError(msg));
        } else if (msg.includes('email') || msg.includes('Email')) {
          setEmailError(translateError(msg));
        } else {
          toast.error(translateError(msg));
        }
      }
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setPositionId('');
    setSearchQuery('');
    setFullName('');
    setCpf('');
    setCpfError('');
    setCreateUser(false);
    setUserEmail('');
    setUserPassword('');
    setShowPassword(false);
    setEmailError('');
    setPasswordError('');
    onClose();
  };

  const canProceedStep1 = positionId !== '';
  const canProceedStep2 =
    fullName !== '' && cpf.replace(/\D/g, '').length === 11 && !cpfError;
  const canSubmit =
    !createUser ||
    (createUser &&
      userEmail !== '' &&
      !emailError &&
      userPassword !== '' &&
      !passwordError);

  const steps: WizardStep[] = useMemo(
    () => [
      {
        title: 'Selecione o Cargo',
        description: 'O departamento e empresa serão definidos automaticamente',
        icon: <Briefcase className="h-16 w-16 text-teal-500/60" />,
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
                placeholder="Buscar cargo por nome, código, departamento..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1">
                {isLoadingPositions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredPositions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery
                      ? 'Nenhum cargo encontrado'
                      : 'Nenhum cargo cadastrado'}
                  </div>
                ) : (
                  filteredPositions.map(pos => (
                    <div
                      key={pos.id}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleSelectPosition(pos)}
                    >
                      <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-linear-to-br from-teal-500 to-emerald-600 shrink-0">
                        <Briefcase className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate flex items-center gap-2">
                          {pos.name}
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-500/10 dark:text-slate-400">
                            {pos.code}
                          </span>
                        </p>
                        {pos.department && (
                          <p className="text-xs text-muted-foreground truncate">
                            {pos.department.company
                              ? `${pos.department.company.tradeName || pos.department.company.legalName} — ${pos.department.name}`
                              : pos.department.name}
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
        title: 'Dados do Funcionário',
        description: 'Informações pessoais e contratuais',
        icon: <Users className="h-16 w-16 text-teal-500/60" />,
        isValid: canProceedStep2,
        onBack: () => setCurrentStep(1),
        content: (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Departamento
                    </p>
                    <p className="text-sm font-medium truncate">
                      {selectedDepartment?.name || 'Não definido'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Cargo</p>
                    <p className="text-sm font-medium truncate">
                      {selectedPosition?.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">
                Nome Completo <span className="text-rose-500">*</span>
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
                CPF <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
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
                  aria-invalid={!!cpfError}
                />
                <FormErrorIcon message={cpfError} />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="createUser" className="text-sm cursor-pointer">
                  Criar usuário de acesso
                </Label>
                <p className="text-xs text-muted-foreground">
                  Permite que o funcionário faça login no sistema
                </p>
              </div>
              <Switch
                id="createUser"
                checked={createUser}
                onCheckedChange={setCreateUser}
              />
            </div>
          </div>
        ),
        footer: (
          <Button
            onClick={createUser ? () => setCurrentStep(3) : handleSubmit}
            disabled={!canProceedStep2 || isSubmitting}
          >
            {isSubmitting
              ? 'Criando...'
              : createUser
                ? 'Avançar →'
                : 'Criar Funcionário'}
          </Button>
        ),
      },
      {
        title: 'Dados de Acesso',
        description: 'Defina o email e senha temporária do novo usuário',
        icon: <UserPlus className="h-16 w-16 text-teal-500/60" />,
        isValid: canSubmit && !isSubmitting,
        onBack: () => setCurrentStep(2),
        content: (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userEmail">
                Email <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="userEmail"
                  type="email"
                  value={userEmail}
                  onChange={e => setUserEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  autoFocus
                  className="pl-10"
                  aria-invalid={!!emailError}
                />
                <FormErrorIcon message={emailError} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="userPassword">
                Senha Temporária <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="userPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={userPassword}
                  onChange={e => setUserPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-10 pr-10"
                  aria-invalid={!!passwordError}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`absolute top-1/2 -translate-y-1/2 h-7 w-7 p-0 ${passwordError ? 'right-8' : 'right-1'}`}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <FormErrorIcon message={passwordError} className="right-1" />
              </div>
            </div>

            {/* Auth Link Indicators */}
            {(cpf && authConfig?.allowedMethods?.includes('CPF')) ||
            authConfig?.allowedMethods?.includes('ENROLLMENT') ? (
              <div className="rounded-lg border border-blue-200 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Métodos de login adicionais
                  </p>
                </div>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                  Os seguintes métodos de login serão habilitados
                  automaticamente com base nos dados do funcionário:
                </p>
                <div className="space-y-2">
                  {cpf &&
                    cpf.replace(/\D/g, '').length === 11 &&
                    authConfig?.allowedMethods?.includes('CPF') && (
                      <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-white/60 dark:bg-white/5 border border-blue-100 dark:border-blue-500/10">
                        <div className="flex items-center justify-center h-7 w-7 rounded-md bg-emerald-50 dark:bg-emerald-500/8">
                          <CreditCard className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-300" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Login por CPF
                          </p>
                          <p className="text-xs text-muted-foreground">
                            O funcionário poderá acessar o sistema usando o CPF
                          </p>
                        </div>
                      </div>
                    )}
                  {authConfig?.allowedMethods?.includes('ENROLLMENT') && (
                    <div className="flex items-center gap-2.5 p-2.5 rounded-md bg-white/60 dark:bg-white/5 border border-blue-100 dark:border-blue-500/10">
                      <div className="flex items-center justify-center h-7 w-7 rounded-md bg-violet-50 dark:bg-violet-500/8">
                        <BadgeCheck className="h-3.5 w-3.5 text-violet-700 dark:text-violet-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Login por Matrícula
                        </p>
                        <p className="text-xs text-muted-foreground">
                          O funcionário poderá acessar o sistema usando a
                          matrícula
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ),
        footer: (
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Criando...' : 'Criar Funcionário'}
          </Button>
        ),
      },
    ],
    [
      searchQuery,
      isLoadingPositions,
      filteredPositions,
      selectedPosition,
      selectedDepartment,
      fullName,
      cpf,
      cpfError,
      createUser,
      userEmail,
      emailError,
      userPassword,
      passwordError,
      showPassword,
      defaultPermissionGroupId,
      isSubmitting,
      canProceedStep2,
      canSubmit,
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
