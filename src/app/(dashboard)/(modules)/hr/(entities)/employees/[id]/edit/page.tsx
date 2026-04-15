/**
 * OpenSea OS - Employee Edit Page
 * Comprehensive edit page with tabs, dependants, emergency contact,
 * linked users, active/inactive switch, and delete action.
 */

'use client';

import { companiesApi } from '@/app/(dashboard)/(modules)/admin/(entities)/companies/src';
import { departmentsApi } from '@/app/(dashboard)/(modules)/hr/(entities)/departments/src';
import { positionsApi } from '@/app/(dashboard)/(modules)/hr/(entities)/positions/src';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '../../../../_shared/constants/hr-permissions';
import { logger } from '@/lib/logger';
import { formatPhone } from '@/lib/masks';
import { translateError } from '@/lib/errors';
import { usersService } from '@/services/auth';
import type { Company, Department, Employee, Position } from '@/types/hr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  FileText,
  Heart,
  Link2,
  Loader2,
  Mail,
  Phone,
  Save,
  Search,
  Shield,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { employeesApi, getStatusLabel } from '../../src';
import { DependantsSection } from '../../src/components/dependants-section';
import { EmployeeDocumentsChecklist } from '../../src/components/employee-documents-checklist';

export default function EmployeeEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const employeeId = params.id as string;
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(HR_PERMISSIONS.EMPLOYEES.DELETE);

  // Tab state
  const [activeTab, setActiveTab] = useState('personal');

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selector states
  const [showDepartmentSelector, setShowDepartmentSelector] = useState(false);
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );
  const [fullName, setFullName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [cpf, setCpf] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [baseSalary, setBaseSalary] = useState<string>('');
  const [contractType, setContractType] = useState<string>('CLT');
  const [workRegime, setWorkRegime] = useState<string>('FULL_TIME');
  const [weeklyHours, setWeeklyHours] = useState<string>('44');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Emergency contact states
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyPhoneAlt, setEmergencyPhoneAlt] = useState('');

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ['employees', employeeId],
    queryFn: async () => {
      return employeesApi.get(employeeId);
    },
  });

  // Linked user data
  const { data: linkedUser } = useQuery({
    queryKey: ['users', employee?.userId],
    queryFn: async () => {
      const response = await usersService.getUser(employee!.userId!);
      return response.user;
    },
    enabled: !!employee?.userId && activeTab === 'linked-user',
  });

  // Departments list for selector
  const { data: departmentsData, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments', 'list'],
    queryFn: async () => {
      const response = await departmentsApi.list();
      return response.departments.filter(
        (dept: Department) => !dept.deletedAt && dept.isActive
      );
    },
    enabled: showDepartmentSelector,
  });

  // Companies list for merge
  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies', 'list'],
    queryFn: async () => {
      const response = await companiesApi.list();
      return response.companies;
    },
    enabled: showDepartmentSelector,
  });

  // Positions list for selector
  const { data: positionsData, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['positions', 'list'],
    queryFn: async () => {
      const response = await positionsApi.list();
      return response.positions.filter(
        (pos: Position) => !pos.deletedAt && pos.isActive
      );
    },
    enabled: showPositionSelector,
  });

  // Merge departments with companies
  const departments = (() => {
    const depts = departmentsData || [];
    const companies = companiesData || [];
    const companiesMap = new Map<string, Company>();
    companies.forEach(company => companiesMap.set(company.id, company));
    return depts.map(dept => {
      if (!dept.company && dept.companyId) {
        const company = companiesMap.get(dept.companyId);
        if (company) return { ...dept, company };
      }
      return dept;
    });
  })();

  const positions = positionsData || [];

  // Department filter
  const filteredDepartments = departments.filter(department => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const companyName =
      department.company?.tradeName || department.company?.legalName || '';
    return (
      department.name.toLowerCase().includes(query) ||
      department.code.toLowerCase().includes(query) ||
      companyName.toLowerCase().includes(query)
    );
  });

  // Position filter
  const filteredPositions = positions.filter(position => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      position.name.toLowerCase().includes(query) ||
      position.code.toLowerCase().includes(query)
    );
  });

  // Sync state with employee on load
  useEffect(() => {
    if (employee) {
      setFullName(employee.fullName);
      setRegistrationNumber(employee.registrationNumber);
      setCpf(employee.cpf);
      setHireDate(employee.hireDate?.split('T')[0] || '');
      setBaseSalary(employee.baseSalary?.toString() || '');
      setContractType(employee.contractType || 'CLT');
      setWorkRegime(employee.workRegime || 'FULL_TIME');
      setWeeklyHours(employee.weeklyHours?.toString() || '44');
      setIsActive(employee.status === 'ACTIVE');
      if (employee.department) {
        setSelectedDepartment(employee.department);
      }
      if (employee.position) {
        setSelectedPosition(employee.position);
      }
      // Emergency contact
      const ec = employee.emergencyContactInfo;
      if (ec) {
        setEmergencyName(ec.name || '');
        setEmergencyRelationship(ec.relationship || '');
        setEmergencyPhone(ec.phone ? formatPhone(ec.phone) : '');
        setEmergencyPhoneAlt(
          ec.alternativePhone ? formatPhone(ec.alternativePhone) : ''
        );
      }
      // Legacy emergency fields fallback
      if (!ec?.name && employee.emergencyContact) {
        setEmergencyName(employee.emergencyContact);
      }
      if (!ec?.phone && employee.emergencyPhone) {
        setEmergencyPhone(formatPhone(employee.emergencyPhone));
      }
    }
  }, [employee]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getDepartmentDisplayName = (dept: Department) => {
    const companyName = dept.company?.tradeName || dept.company?.legalName;
    if (companyName) return `${dept.name} - ${companyName}`;
    return dept.name;
  };

  const getStatusVariant = (s?: string) => {
    switch (s) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'secondary';
      case 'ON_LEAVE':
        return 'warning';
      case 'TERMINATED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await employeesApi.delete(employeeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Funcionário excluído com sucesso!');
      router.push('/hr/employees');
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (active: boolean) => {
      return employeesApi.update(employeeId, {
        status: active ? 'ACTIVE' : 'INACTIVE',
      });
    },
    onSuccess: (_data, active) => {
      setIsActive(active);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(
        active
          ? 'Funcionário ativado com sucesso!'
          : 'Funcionário desativado com sucesso!'
      );
    },
    onError: (error: Error) => {
      // Revert optimistic state
      setIsActive(!isActive);
      toast.error(translateError(error));
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setShowDepartmentSelector(false);
    setSearchQuery('');
  };

  const handleSelectPosition = (position: Position) => {
    setSelectedPosition(position);
    setShowPositionSelector(false);
    setSearchQuery('');
  };

  const validateField = (field: string, value: string) => {
    if (!value.trim()) {
      const labels: Record<string, string> = {
        fullName: 'Nome completo',
        registrationNumber: 'Matrícula',
        cpf: 'CPF',
      };
      return `${labels[field] || field} é obrigatório`;
    }
    if (field === 'cpf' && value.replace(/\D/g, '').length < 11) {
      return 'CPF deve ter 11 dígitos';
    }
    return '';
  };

  const handleBlur = (field: string, value: string) => {
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    newErrors.fullName = validateField('fullName', fullName);
    newErrors.registrationNumber = validateField(
      'registrationNumber',
      registrationNumber
    );
    newErrors.cpf = validateField('cpf', cpf);

    const filtered = Object.fromEntries(
      Object.entries(newErrors).filter(([, v]) => v)
    );
    setErrors(filtered);
    return Object.keys(filtered).length === 0;
  };

  const handleToggleActive = (checked: boolean) => {
    setIsActive(checked);
    statusMutation.mutate(checked);
  };

  const handleSave = async () => {
    if (!employee || !validateAll()) return;

    setIsSaving(true);
    try {
      await employeesApi.update(employeeId, {
        fullName,
        registrationNumber,
        cpf,
        hireDate,
        baseSalary: baseSalary ? parseFloat(baseSalary) : undefined,
        contractType: contractType as
          | 'CLT'
          | 'PJ'
          | 'INTERN'
          | 'TEMPORARY'
          | 'APPRENTICE',
        workRegime: workRegime as
          | 'FULL_TIME'
          | 'PART_TIME'
          | 'HOURLY'
          | 'SHIFT'
          | 'FLEXIBLE',
        weeklyHours: weeklyHours ? parseInt(weeklyHours) : undefined,
        status: isActive ? 'ACTIVE' : 'INACTIVE',
        departmentId: selectedDepartment?.id || employee.departmentId,
        positionId: selectedPosition?.id || employee.positionId,
        companyId: selectedDepartment?.companyId || employee.companyId,
        emergencyContact: emergencyName || undefined,
        emergencyPhone: emergencyPhone
          ? emergencyPhone.replace(/\D/g, '')
          : undefined,
        emergencyContactInfo:
          emergencyName ||
          emergencyPhone ||
          emergencyRelationship ||
          emergencyPhoneAlt
            ? {
                name: emergencyName || undefined,
                phone: emergencyPhone
                  ? emergencyPhone.replace(/\D/g, '')
                  : undefined,
                alternativePhone: emergencyPhoneAlt
                  ? emergencyPhoneAlt.replace(/\D/g, '')
                  : undefined,
                relationship: emergencyRelationship || undefined,
              }
            : undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Funcionário atualizado com sucesso!');
      router.push(`/hr/employees/${employeeId}`);
    } catch (error) {
      logger.error(
        'Erro ao salvar funcionário',
        error instanceof Error ? error : undefined
      );
      toast.error('Erro ao salvar funcionário');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout data-testid="employees-edit-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Funcionários', href: '/hr/employees' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!employee) {
    return (
      <PageLayout data-testid="employees-edit-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Funcionários', href: '/hr/employees' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Funcionário não encontrado
            </h2>
            <Button onClick={() => router.push('/hr/employees')}>
              Voltar para Funcionários
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const departmentName = selectedDepartment
    ? getDepartmentDisplayName(selectedDepartment)
    : null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="employees-edit-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Funcionários', href: '/hr/employees' },
            {
              label: employee.fullName,
              href: `/hr/employees/${employeeId}`,
            },
            { label: 'Editar' },
          ]}
          buttons={
            [
              canDelete && {
                id: 'delete',
                title: 'Excluir',
                icon: Trash2,
                onClick: () => setIsDeleteOpen(true),
                variant: 'default' as const,
                className:
                  'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
                disabled: isSaving,
              },
              {
                id: 'save',
                title: isSaving ? 'Salvando...' : 'Salvar',
                icon: isSaving ? Loader2 : Save,
                onClick: handleSave,
                disabled: isSaving || !fullName.trim(),
              },
            ].filter(Boolean) as HeaderButton[]
          }
        />

        {/* Identity Card with Active/Inactive Switch */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-emerald-500 to-teal-600">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                Editar Funcionário
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {employee.fullName} - {employee.registrationNumber}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Status</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isActive ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={handleToggleActive}
                  disabled={statusMutation.isPending}
                  aria-label="Alternar status ativo/inativo"
                />
              </div>
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="flex-col gap-6 w-full">
        {/* Department/Position Selectors (overlay) */}
        {showDepartmentSelector ? (
          <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Selecionar Departamento
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowDepartmentSelector(false);
                    setSearchQuery('');
                  }}
                >
                  Cancelar
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar departamento por nome, código ou empresa..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {isLoadingDepartments || isLoadingCompanies ? (
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
                  filteredDepartments.map(department => (
                    <Card
                      key={department.id}
                      className="p-4 cursor-pointer hover:bg-accent transition-colors"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectDepartment(department)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectDepartment(department);
                        }
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-linear-to-br from-blue-500 to-cyan-600 shrink-0">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {department.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {department.company?.tradeName ||
                              department.company?.legalName ||
                              department.code}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </Card>
        ) : showPositionSelector ? (
          <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Selecionar Cargo</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPositionSelector(false);
                    setSearchQuery('');
                  }}
                >
                  Cancelar
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cargo por nome ou código..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
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
                  filteredPositions.map(position => (
                    <Card
                      key={position.id}
                      className="p-4 cursor-pointer hover:bg-accent transition-colors"
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectPosition(position)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectPosition(position);
                        }
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 shrink-0">
                          <Briefcase className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {position.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {position.code}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 h-12 mb-4">
                <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="dependants">Dependentes</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
                <TabsTrigger value="linked-user">Usuário Vinculado</TabsTrigger>
              </TabsList>

              {/* ============================================================ */}
              {/* TAB: Dados Pessoais */}
              {/* ============================================================ */}
              <TabsContent value="personal" className="flex-col gap-6 w-full">
                {/* Departamento e Cargo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Departamento */}
                  <Card className="bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 overflow-hidden py-0">
                    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                      <Building2 className="h-5 w-5 text-foreground" />
                      <div className="flex-1">
                        <h3 className="text-base font-semibold">
                          Departamento
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Vínculo organizacional
                        </p>
                      </div>
                    </div>
                    <div className="border-b border-border" />
                    <div className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-linear-to-br from-blue-500 to-cyan-600 shrink-0">
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {departmentName ||
                              'Nenhum departamento selecionado'}
                          </p>
                          {selectedDepartment?.code && (
                            <p className="text-sm text-muted-foreground">
                              {selectedDepartment.code}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDepartmentSelector(true)}
                        >
                          Alterar
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Cargo */}
                  <Card className="bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 overflow-hidden py-0">
                    <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                      <Briefcase className="h-5 w-5 text-foreground" />
                      <div className="flex-1">
                        <h3 className="text-base font-semibold">Cargo</h3>
                        <p className="text-sm text-muted-foreground">
                          Função desempenhada
                        </p>
                      </div>
                    </div>
                    <div className="border-b border-border" />
                    <div className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 shrink-0">
                          <Briefcase className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {selectedPosition?.name ||
                              'Nenhum cargo selecionado'}
                          </p>
                          {selectedPosition?.code && (
                            <p className="text-sm text-muted-foreground">
                              {selectedPosition.code}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPositionSelector(true)}
                        >
                          Alterar
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Dados Pessoais Card */}
                <Card className="bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 overflow-hidden py-0">
                  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <User className="h-5 w-5 text-foreground" />
                    <div className="flex-1">
                      <h3 className="text-base font-semibold">
                        Dados Pessoais
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Informações básicas do funcionário
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Nome Completo *</Label>
                        <Input
                          id="fullName"
                          placeholder="Ex: João da Silva"
                          value={fullName}
                          onChange={e => {
                            setFullName(e.target.value);
                            if (errors.fullName)
                              setErrors(prev => ({ ...prev, fullName: '' }));
                          }}
                          onBlur={() => handleBlur('fullName', fullName)}
                          className={
                            errors.fullName
                              ? 'border-rose-500 focus-visible:ring-rose-500'
                              : ''
                          }
                          required
                        />
                        {errors.fullName && (
                          <p className="text-xs text-rose-500">
                            {errors.fullName}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="registrationNumber">Matrícula *</Label>
                        <Input
                          id="registrationNumber"
                          placeholder="Ex: 00001"
                          value={registrationNumber}
                          onChange={e => {
                            setRegistrationNumber(e.target.value);
                            if (errors.registrationNumber)
                              setErrors(prev => ({
                                ...prev,
                                registrationNumber: '',
                              }));
                          }}
                          onBlur={() =>
                            handleBlur('registrationNumber', registrationNumber)
                          }
                          className={
                            errors.registrationNumber
                              ? 'border-rose-500 focus-visible:ring-rose-500'
                              : ''
                          }
                          required
                        />
                        {errors.registrationNumber && (
                          <p className="text-xs text-rose-500">
                            {errors.registrationNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF *</Label>
                        <Input
                          id="cpf"
                          placeholder="Ex: 000.000.000-00"
                          value={cpf}
                          onChange={e => {
                            setCpf(e.target.value);
                            if (errors.cpf)
                              setErrors(prev => ({ ...prev, cpf: '' }));
                          }}
                          onBlur={() => handleBlur('cpf', cpf)}
                          className={
                            errors.cpf
                              ? 'border-rose-500 focus-visible:ring-rose-500'
                              : ''
                          }
                          required
                        />
                        {errors.cpf && (
                          <p className="text-xs text-rose-500">{errors.cpf}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Dados Contratuais Card */}
                <Card className="bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 overflow-hidden py-0">
                  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <FileText className="h-5 w-5 text-foreground" />
                    <div className="flex-1">
                      <h3 className="text-base font-semibold">
                        Dados Contratuais
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Contrato, regime e remuneração
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="hireDate">Data de Admissão</Label>
                        <Input
                          id="hireDate"
                          type="date"
                          value={hireDate}
                          onChange={e => setHireDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contractType">Tipo de Contrato</Label>
                        <Select
                          value={contractType}
                          onValueChange={setContractType}
                        >
                          <SelectTrigger id="contractType">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CLT">CLT</SelectItem>
                            <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                            <SelectItem value="INTERN">Estagiário</SelectItem>
                            <SelectItem value="TEMPORARY">
                              Temporário
                            </SelectItem>
                            <SelectItem value="APPRENTICE">Aprendiz</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="workRegime">Regime de Trabalho</Label>
                        <Select
                          value={workRegime}
                          onValueChange={setWorkRegime}
                        >
                          <SelectTrigger id="workRegime">
                            <SelectValue placeholder="Selecione o regime" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FULL_TIME">
                              Tempo Integral
                            </SelectItem>
                            <SelectItem value="PART_TIME">
                              Meio Período
                            </SelectItem>
                            <SelectItem value="HOURLY">Por Hora</SelectItem>
                            <SelectItem value="SHIFT">Turnos</SelectItem>
                            <SelectItem value="FLEXIBLE">Flexível</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="baseSalary">Salário Base</Label>
                        <Input
                          id="baseSalary"
                          type="number"
                          placeholder="Ex: 3000"
                          value={baseSalary}
                          onChange={e => setBaseSalary(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="weeklyHours">Horas Semanais</Label>
                        <Input
                          id="weeklyHours"
                          type="number"
                          placeholder="Ex: 44"
                          value={weeklyHours}
                          onChange={e => setWeeklyHours(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Contato de Emergência Card */}
                <Card className="bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 overflow-hidden py-0">
                  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <AlertTriangle className="h-5 w-5 text-foreground" />
                    <div className="flex-1">
                      <h3 className="text-base font-semibold">
                        Contato de Emergência
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Pessoa para contato em caso de emergência
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyName">Nome do Contato</Label>
                        <Input
                          id="emergencyName"
                          placeholder="Ex: Maria da Silva"
                          value={emergencyName}
                          onChange={e => setEmergencyName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergencyRelationship">
                          Parentesco
                        </Label>
                        <Select
                          value={emergencyRelationship}
                          onValueChange={setEmergencyRelationship}
                        >
                          <SelectTrigger id="emergencyRelationship">
                            <SelectValue placeholder="Selecione o parentesco" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SPOUSE">Cônjuge</SelectItem>
                            <SelectItem value="PARENT">Pai/Mãe</SelectItem>
                            <SelectItem value="SIBLING">Irmão(ã)</SelectItem>
                            <SelectItem value="CHILD">Filho(a)</SelectItem>
                            <SelectItem value="FRIEND">Amigo(a)</SelectItem>
                            <SelectItem value="OTHER">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyPhone">Telefone</Label>
                        <Input
                          id="emergencyPhone"
                          placeholder="Ex: (11) 99999-0000"
                          value={emergencyPhone}
                          maxLength={15}
                          onChange={e =>
                            setEmergencyPhone(formatPhone(e.target.value))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergencyPhoneAlt">
                          Telefone Alternativo
                        </Label>
                        <Input
                          id="emergencyPhoneAlt"
                          placeholder="Ex: (11) 3333-0000"
                          value={emergencyPhoneAlt}
                          maxLength={15}
                          onChange={e =>
                            setEmergencyPhoneAlt(formatPhone(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* ============================================================ */}
              {/* TAB: Dependentes */}
              {/* ============================================================ */}
              <TabsContent value="dependants" className="flex-col gap-6 w-full">
                <DependantsSection employeeId={employeeId} />
              </TabsContent>

              {/* ============================================================ */}
              {/* TAB: Documentos */}
              {/* ============================================================ */}
              <TabsContent value="documents" className="flex-col gap-6 w-full">
                <Card className="bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 overflow-hidden py-0">
                  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <FileText className="h-5 w-5 text-foreground" />
                    <div className="flex-1">
                      <h3 className="text-base font-semibold">
                        Documentos do Funcionário
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Anexe documentos como RG, CPF, comprovantes e
                        certificados
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                  <div className="p-4 space-y-4">
                    {/* Document identification fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rg">RG</Label>
                        <Input
                          id="rg"
                          placeholder="Ex: 12.345.678-9"
                          defaultValue={employee.rg || ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rgIssuer">Órgão Emissor</Label>
                        <Input
                          id="rgIssuer"
                          placeholder="Ex: SSP/SP"
                          defaultValue={employee.rgIssuer || ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pis">PIS/PASEP</Label>
                        <Input
                          id="pis"
                          placeholder="Ex: 000.00000.00-0"
                          defaultValue={employee.pis || ''}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ctpsNumber">CTPS - Número</Label>
                        <Input
                          id="ctpsNumber"
                          placeholder="Ex: 1234567"
                          defaultValue={employee.ctpsNumber || ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ctpsSeries">CTPS - Série</Label>
                        <Input
                          id="ctpsSeries"
                          placeholder="Ex: 0001"
                          defaultValue={employee.ctpsSeries || ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ctpsState">CTPS - UF</Label>
                        <Input
                          id="ctpsState"
                          placeholder="Ex: SP"
                          defaultValue={employee.ctpsState || ''}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="voterTitle">Título de Eleitor</Label>
                        <Input
                          id="voterTitle"
                          placeholder="Ex: 0000 0000 0000"
                          defaultValue={employee.voterTitle || ''}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="militaryDoc">Certificado Militar</Label>
                        <Input
                          id="militaryDoc"
                          placeholder="Ex: 000000000000"
                          defaultValue={employee.militaryDoc || ''}
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Document checklist with upload/delete capabilities */}
                <EmployeeDocumentsChecklist
                  employeeId={employeeId}
                  employeeName={employee.fullName}
                  gender={employee.gender}
                />
              </TabsContent>

              {/* ============================================================ */}
              {/* TAB: Usuário Vinculado */}
              {/* ============================================================ */}
              <TabsContent
                value="linked-user"
                className="flex-col gap-6 w-full"
              >
                <Card className="bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 overflow-hidden py-0">
                  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <Link2 className="h-5 w-5 text-foreground" />
                    <div className="flex-1">
                      <h3 className="text-base font-semibold">
                        Usuário Vinculado
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Conta de acesso ao sistema vinculada a este funcionário
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                  <div className="p-4">
                    {employee.userId && linkedUser ? (
                      <div className="space-y-4">
                        {/* User info */}
                        <div className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/10 shrink-0">
                            <User className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {linkedUser.username || linkedUser.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground truncate">
                                {linkedUser.email}
                              </span>
                            </div>
                          </div>
                          <Badge variant="success">Vinculado</Badge>
                        </div>

                        {/* Login methods */}
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">
                            Métodos de login habilitados
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant="outline"
                              className="bg-sky-50 text-sky-700 dark:bg-sky-500/8 dark:text-sky-300 border-sky-200 dark:border-sky-500/20"
                            >
                              <Mail className="h-3 w-3 mr-1.5" />
                              E-mail
                            </Badge>
                            {employee.cpf && (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20"
                              >
                                <Shield className="h-3 w-3 mr-1.5" />
                                CPF
                              </Badge>
                            )}
                            {employee.registrationNumber && (
                              <Badge
                                variant="outline"
                                className="bg-violet-50 text-violet-700 dark:bg-violet-500/8 dark:text-violet-300 border-violet-200 dark:border-violet-500/20"
                              >
                                <FileText className="h-3 w-3 mr-1.5" />
                                Matrícula
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Last login */}
                        {linkedUser.lastLoginAt && (
                          <div className="text-sm text-muted-foreground">
                            Último acesso:{' '}
                            {new Date(linkedUser.lastLoginAt).toLocaleString(
                              'pt-BR'
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                          <UserPlus className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h4 className="text-lg font-medium mb-1">
                          Nenhum usuário vinculado
                        </h4>
                        <p className="text-sm text-muted-foreground max-w-sm mb-4">
                          Este funcionário não possui uma conta de acesso ao
                          sistema. Vincule um usuário para permitir o login.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() =>
                            router.push(`/hr/employees/${employeeId}`)
                          }
                          className="gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          Vincular Usuário
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Disponível na página de detalhes do funcionário
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </PageBody>

      {/* Delete Confirmation Modal */}
      <VerifyActionPinModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={() => deleteMutation.mutate()}
        title="Excluir Funcionário"
        description={`Digite seu PIN de ação para excluir o funcionário "${employee.fullName}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
