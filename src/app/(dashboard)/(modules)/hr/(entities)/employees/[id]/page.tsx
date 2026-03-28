/**
 * OpenSea OS - Employee Detail Page
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { InfoField } from '@/components/shared/info-field';
import dynamic from 'next/dynamic';

const PhotoUploadDialog = dynamic(
  () =>
    import('@/components/shared/photo-upload-dialog').then(m => ({
      default: m.PhotoUploadDialog,
    })),
  { ssr: false }
);
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePrintQueue } from '@/core/print-queue';
import { storageFilesService } from '@/services/storage/files.service';
import { usersService } from '@/services/auth';
import { listPermissionGroups } from '@/services/rbac/rbac.service';
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { benefitsService } from '@/services/hr/benefits.service';
import { absencesService } from '@/services/hr/absences.service';
import { vacationsService } from '@/services/hr/vacations.service';
import { medicalExamsService } from '@/services/hr/medical-exams.service';
import { bonusesService } from '@/services/hr/bonuses.service';
import { deductionsService } from '@/services/hr/deductions.service';
import { timeControlService } from '@/services/hr/time-control.service';
import { timeBankService } from '@/services/hr/time-bank.service';
import { overtimeService } from '@/services/hr/overtime.service';
import type {
  Employee,
  BenefitEnrollment,
  Absence,
  VacationPeriod,
  MedicalExam,
  Bonus,
  Deduction,
  TimeEntry,
  TimeBank,
  Overtime,
} from '@/types/hr';
import type { VacationBalanceResponse } from '@/services/hr/vacations.service';
import type { PermissionGroup } from '@/types/rbac';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Banknote,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Factory,
  FileText,
  FolderOpen,
  Gift,
  Hash,
  Heart,
  HeartPulse,
  Lock,
  Mail,
  Minus,
  Palmtree,
  Plus,
  Printer,
  Shield,
  Stethoscope,
  Timer,
  Trash,
  TrendingDown,
  TrendingUp,
  User,
  UserCircle,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  employeesApi,
  formatCPF,
  formatSalary,
  getCompanyTime,
  getContractTypeLabel,
  getStatusLabel,
  getWorkRegimeLabel,
} from '../src';
import { DependantsSection } from '../src/components/dependants-section';
import { EmployeeDocumentsChecklist } from '../src/components/employee-documents-checklist';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const employeeId = params.id as string;

  // State for create user modal
  const [activeTab, setActiveTab] = useState('details');
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [permissionGroupId, setPermissionGroupId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ['employees', employeeId],
    queryFn: async () => {
      return employeesApi.get(employeeId);
    },
  });

  const { data: userData } = useQuery({
    queryKey: ['users', employee?.userId],
    queryFn: async () => {
      const response = await usersService.getUser(employee!.userId!);
      return response.user;
    },
    enabled: !!employee?.userId,
  });

  const { data: permissionGroupsData } = useQuery<PermissionGroup[]>({
    queryKey: ['permission-groups'],
    queryFn: async () => {
      return await listPermissionGroups({ isActive: true });
    },
    enabled: isCreateUserModalOpen,
  });

  const permissionGroups = permissionGroupsData || [];

  // ============================================================================
  // NEW TAB DATA FETCHING
  // ============================================================================

  // Benefits enrollments
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['benefit-enrollments', 'employee', employeeId],
    queryFn: async () => {
      const response = await benefitsService.listEnrollments({
        employeeId,
        perPage: 10,
      });
      return response.enrollments;
    },
    enabled: activeTab === 'benefits',
  });

  // Absences
  const { data: absencesData, isLoading: isLoadingAbsences } = useQuery({
    queryKey: ['absences', 'employee', employeeId],
    queryFn: async () => {
      const response = await absencesService.list({
        employeeId,
        perPage: 10,
      });
      return response.absences;
    },
    enabled: activeTab === 'timeoff',
  });

  // Vacation periods
  const { data: vacationsData, isLoading: isLoadingVacations } = useQuery({
    queryKey: ['vacation-periods', 'employee', employeeId],
    queryFn: async () => {
      const response = await vacationsService.list({
        employeeId,
        perPage: 10,
      });
      return response.vacationPeriods;
    },
    enabled: activeTab === 'timeoff',
  });

  // Vacation balance
  const { data: vacationBalance } = useQuery<VacationBalanceResponse>({
    queryKey: ['vacation-balance', employeeId],
    queryFn: async () => {
      return vacationsService.getVacationBalance(employeeId);
    },
    enabled: activeTab === 'timeoff',
  });

  // Medical exams
  const { data: medicalExamsData, isLoading: isLoadingExams } = useQuery({
    queryKey: ['medical-exams', 'employee', employeeId],
    queryFn: async () => {
      const response = await medicalExamsService.list({
        employeeId,
        perPage: 10,
      });
      return response.medicalExams;
    },
    enabled: activeTab === 'health',
  });

  // Bonuses
  const { data: bonusesData, isLoading: isLoadingBonuses } = useQuery({
    queryKey: ['bonuses', 'employee', employeeId],
    queryFn: async () => {
      const response = await bonusesService.list({
        employeeId,
        perPage: 10,
      });
      return response.bonuses;
    },
    enabled: activeTab === 'compensation',
  });

  // Deductions
  const { data: deductionsData, isLoading: isLoadingDeductions } = useQuery({
    queryKey: ['deductions', 'employee', employeeId],
    queryFn: async () => {
      const response = await deductionsService.list({
        employeeId,
        perPage: 10,
      });
      return response.deductions;
    },
    enabled: activeTab === 'compensation',
  });

  // Time entries
  const { data: timeEntriesData, isLoading: isLoadingTimeEntries } = useQuery({
    queryKey: ['time-entries', 'employee', employeeId],
    queryFn: async () => {
      const response = await timeControlService.listTimeEntries({
        employeeId,
        perPage: 10,
      });
      return response.timeEntries;
    },
    enabled: activeTab === 'attendance',
  });

  // Time bank
  const { data: timeBankData, isLoading: isLoadingTimeBank } = useQuery({
    queryKey: ['time-bank', 'employee', employeeId],
    queryFn: async () => {
      const response = await timeBankService.getByEmployee(
        employeeId,
        new Date().getFullYear()
      );
      return response.timeBank;
    },
    enabled: activeTab === 'attendance',
  });

  // Overtime
  const { data: overtimeData, isLoading: isLoadingOvertime } = useQuery({
    queryKey: ['overtime', 'employee', employeeId],
    queryFn: async () => {
      const response = await overtimeService.list({
        employeeId,
        perPage: 10,
      });
      return response.overtime;
    },
    enabled: activeTab === 'attendance',
  });

  // Print queue
  const { actions: printActions } = usePrintQueue();
  const isInPrintQueue = employee ? printActions.isInQueue(employee.id) : false;

  const handlePrint = () => {
    if (!employee || isInPrintQueue) return;
    printActions.addToQueue({ entityType: 'employee', employee });
  };

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const createUserMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      permissionGroupId: string;
    }) => {
      return employeesApi.createUserForEmployee(employeeId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId] });
      toast.success('Usuário criado e vinculado com sucesso!');
      handleCloseCreateUserModal();
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar usuário', {
        description: error.message || 'Tente novamente mais tarde',
      });
    },
  });

  // Photo URL resolver
  const photoDisplayUrl = useMemo(() => {
    if (!employee?.photoUrl) return null;
    const match = employee.photoUrl.match(
      /\/v1\/storage\/files\/([^/]+)\/serve/
    );
    if (!match) return null;
    return storageFilesService.getServeUrl(match[1]);
  }, [employee?.photoUrl]);

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({
      file,
      crop,
    }: {
      file: File;
      crop: { x: number; y: number; width: number; height: number };
    }) => {
      return employeesApi.uploadPhoto(employeeId, file, crop);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId] });
      toast.success('Foto atualizada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao enviar foto', {
        description: error.message || 'Tente novamente mais tarde',
      });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async () => {
      return employeesApi.deletePhoto(employeeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees', employeeId] });
      toast.success('Foto removida com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover foto', {
        description: error.message || 'Tente novamente mais tarde',
      });
    },
  });

  const handlePhotoUpload = useCallback(
    async (
      file: File,
      crop: { x: number; y: number; width: number; height: number }
    ) => {
      await uploadPhotoMutation.mutateAsync({ file, crop });
    },
    [uploadPhotoMutation]
  );

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

  useEffect(() => {
    if (userPassword && userPassword.length > 0 && userPassword.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
    } else {
      setPasswordError('');
    }
  }, [userPassword]);

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(HR_PERMISSIONS.EMPLOYEES.UPDATE);
  const canDelete = hasPermission(HR_PERMISSIONS.EMPLOYEES.DELETE);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleEdit = () => {
    router.push(`/hr/employees/${employeeId}/edit`);
  };

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
      toast.error('Erro ao excluir funcionário', {
        description: error.message || 'Tente novamente mais tarde',
      });
    },
  });

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleViewUser = () => {
    if (employee?.userId) {
      router.push(`/admin/users/${employee.userId}`);
    }
  };

  const handleOpenCreateUserModal = () => {
    setIsCreateUserModalOpen(true);
  };

  const handleCloseCreateUserModal = () => {
    setIsCreateUserModalOpen(false);
    setUserEmail('');
    setUserPassword('');
    setPermissionGroupId('');
    setShowPassword(false);
    setEmailError('');
    setPasswordError('');
  };

  const handleCreateUser = async () => {
    if (
      userEmail &&
      userPassword &&
      permissionGroupId &&
      !emailError &&
      !passwordError
    ) {
      await createUserMutation.mutateAsync({
        email: userEmail,
        password: userPassword,
        permissionGroupId,
      });
    }
  };

  const canSubmitUser =
    userEmail !== '' &&
    !emailError &&
    userPassword !== '' &&
    !passwordError &&
    permissionGroupId !== '';

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getCompanyName = () => {
    return (
      employee?.company?.tradeName ||
      employee?.company?.legalName ||
      employee?.department?.company?.tradeName ||
      employee?.department?.company?.legalName ||
      null
    );
  };

  const getStatusVariant = (status?: string) => {
    switch (status) {
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

  // Benefit type labels
  const getBenefitTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      VT: 'Vale Transporte',
      VR: 'Vale Refeição',
      VA: 'Vale Alimentação',
      HEALTH: 'Plano de Saúde',
      DENTAL: 'Plano Odontológico',
      LIFE_INSURANCE: 'Seguro de Vida',
      DAYCARE: 'Auxílio Creche',
      PLR: 'PLR',
      LOAN: 'Empréstimo',
      EDUCATION: 'Auxílio Educação',
      HOME_OFFICE: 'Home Office',
      FLEX: 'Benefício Flexível',
    };
    return map[type] || type;
  };

  const getEnrollmentStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SUSPENDED':
        return 'warning';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getEnrollmentStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'Ativo',
      SUSPENDED: 'Suspenso',
      CANCELLED: 'Cancelado',
    };
    return map[status] || status;
  };

  // Absence type labels
  const getAbsenceTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      VACATION: 'Férias',
      SICK_LEAVE: 'Licença Médica',
      PERSONAL_LEAVE: 'Licença Pessoal',
      MATERNITY_LEAVE: 'Licença Maternidade',
      PATERNITY_LEAVE: 'Licença Paternidade',
      BEREAVEMENT_LEAVE: 'Licença Nojo',
      WEDDING_LEAVE: 'Licença Casamento',
      MEDICAL_APPOINTMENT: 'Consulta Médica',
      JURY_DUTY: 'Júri',
      UNPAID_LEAVE: 'Licença Não Remunerada',
      OTHER: 'Outro',
    };
    return map[type] || type;
  };

  const getAbsenceStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'IN_PROGRESS':
        return 'default';
      case 'REJECTED':
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getAbsenceStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'Pendente',
      APPROVED: 'Aprovado',
      REJECTED: 'Rejeitado',
      CANCELLED: 'Cancelado',
      IN_PROGRESS: 'Em Andamento',
      COMPLETED: 'Concluído',
    };
    return map[status] || status;
  };

  // Vacation status labels
  const getVacationStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'Pendente',
      AVAILABLE: 'Disponível',
      SCHEDULED: 'Agendado',
      IN_PROGRESS: 'Em Andamento',
      COMPLETED: 'Concluído',
      EXPIRED: 'Expirado',
      SOLD: 'Vendido',
    };
    return map[status] || status;
  };

  const getVacationStatusVariant = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'SCHEDULED':
      case 'PENDING':
        return 'warning';
      case 'IN_PROGRESS':
        return 'default';
      case 'COMPLETED':
      case 'SOLD':
        return 'secondary';
      case 'EXPIRED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Medical exam labels
  const getExamTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      ADMISSIONAL: 'Admissional',
      PERIODICO: 'Periódico',
      MUDANCA_FUNCAO: 'Mudança de Função',
      RETORNO: 'Retorno ao Trabalho',
      DEMISSIONAL: 'Demissional',
    };
    return map[type] || type;
  };

  const getExamResultLabel = (result: string) => {
    const map: Record<string, string> = {
      APTO: 'Apto',
      INAPTO: 'Inapto',
      APTO_COM_RESTRICOES: 'Apto com Restrições',
    };
    return map[result] || result;
  };

  const getExamResultVariant = (result: string) => {
    switch (result) {
      case 'APTO':
        return 'success';
      case 'APTO_COM_RESTRICOES':
        return 'warning';
      case 'INAPTO':
        return 'destructive';
      default:
        return 'default';
    }
  };

  // Medical exam expiration status
  const getExamExpirationStatus = (expirationDate?: string) => {
    if (!expirationDate) return { label: 'Sem validade', color: 'text-muted-foreground', icon: null };
    const expDate = new Date(expirationDate);
    const now = new Date();
    const daysUntilExpiration = Math.ceil(
      (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilExpiration < 0) {
      return { label: 'Vencido', color: 'text-rose-500', icon: XCircle };
    }
    if (daysUntilExpiration <= 30) {
      return { label: `Vence em ${daysUntilExpiration} dias`, color: 'text-amber-500', icon: AlertTriangle };
    }
    return { label: `Válido até ${new Date(expirationDate).toLocaleDateString('pt-BR')}`, color: 'text-emerald-500', icon: CheckCircle2 };
  };

  // Time entry type labels
  const getTimeEntryTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      CLOCK_IN: 'Entrada',
      CLOCK_OUT: 'Saída',
      BREAK_START: 'Início Intervalo',
      BREAK_END: 'Fim Intervalo',
      OVERTIME_START: 'Início Extra',
      OVERTIME_END: 'Fim Extra',
    };
    return map[type] || type;
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Format date short
  const formatDateShort = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Format time
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Recursos Humanos', href: '/hr' },
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
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Recursos Humanos', href: '/hr' },
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

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Recursos Humanos', href: '/hr' },
            { label: 'Funcionários', href: '/hr/employees' },
            { label: employee.fullName },
          ]}
          buttons={[
            ...(canDelete
              ? [
                  {
                    id: 'delete',
                    title: 'Excluir',
                    icon: Trash,
                    onClick: handleDelete,
                    variant: 'outline' as const,
                  },
                ]
              : []),
            {
              id: 'print',
              title: isInPrintQueue ? 'Na fila' : 'Imprimir Etiqueta',
              icon: Printer,
              onClick: handlePrint,
              variant: 'outline' as const,
              disabled: isInPrintQueue,
            },
            ...(canEdit
              ? [
                  {
                    id: 'edit',
                    title: 'Editar',
                    icon: Edit,
                    onClick: handleEdit,
                  },
                ]
              : []),
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {photoDisplayUrl ? (
              <img
                src={photoDisplayUrl}
                alt={employee.fullName}
                className="h-14 w-14 rounded-xl shrink-0 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-emerald-500 to-teal-600">
                <Users className="h-7 w-7 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {employee.fullName}
                </h1>
                <Badge variant={getStatusVariant(employee.status)}>
                  {getStatusLabel(employee.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Matrícula: {employee.registrationNumber}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {employee.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>
                    {new Date(employee.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {employee.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    {new Date(employee.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full mb-4 p-2 h-12 overflow-x-auto">
            <TabsTrigger value="details" className="gap-2 flex-shrink-0">
              <User className="h-4 w-4 hidden sm:inline" />
              <span>Detalhes</span>
            </TabsTrigger>
            <TabsTrigger value="dependants" className="gap-2 flex-shrink-0">
              <Users className="h-4 w-4 hidden sm:inline" />
              <span>Dependentes</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2 flex-shrink-0">
              <FolderOpen className="h-4 w-4 hidden sm:inline" />
              <span>Documentos</span>
            </TabsTrigger>
            <TabsTrigger value="benefits" className="gap-2 flex-shrink-0">
              <Gift className="h-4 w-4 hidden sm:inline" />
              <span>Benefícios</span>
            </TabsTrigger>
            <TabsTrigger value="timeoff" className="gap-2 flex-shrink-0">
              <Palmtree className="h-4 w-4 hidden sm:inline" />
              <span>Tempo Livre</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2 flex-shrink-0">
              <HeartPulse className="h-4 w-4 hidden sm:inline" />
              <span>Saúde</span>
            </TabsTrigger>
            <TabsTrigger value="compensation" className="gap-2 flex-shrink-0">
              <DollarSign className="h-4 w-4 hidden sm:inline" />
              <span>Compensação</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2 flex-shrink-0">
              <Timer className="h-4 w-4 hidden sm:inline" />
              <span>Ponto</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="flex flex-col gap-6">
            {/* Informações Pessoais */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-lg uppercase font-semibold mb-4">
                Informações Pessoais
              </h3>
              <div className="grid md:grid-cols-6 gap-6">
                <div className="col-span-1">
                  <div className="relative group flex flex-col items-center justify-center dark:bg-slate-800 rounded-lg h-full overflow-hidden">
                    {photoDisplayUrl ? (
                      <img
                        src={photoDisplayUrl}
                        alt={employee.fullName}
                        className="w-full h-full object-cover aspect-square rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col text-gray-400 gap-2 items-center justify-center p-4 w-full h-full aspect-square">
                        <Camera className="h-10 w-10" />
                        <span className="text-sm">Sem Foto</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 rounded-lg">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                        onClick={() => setIsPhotoDialogOpen(true)}
                      >
                        <Camera className="h-3 w-3 mr-1" />
                        {photoDisplayUrl ? 'Trocar Foto' : 'Enviar Foto'}
                      </Button>
                      {photoDisplayUrl && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs"
                          onClick={() => deletePhotoMutation.mutate()}
                          disabled={deletePhotoMutation.isPending}
                        >
                          <Trash className="h-3 w-3 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6 col-span-5">
                  <InfoField
                    label="Nome Completo"
                    value={employee.fullName}
                    icon={<User className="h-4 w-4" />}
                    showCopyButton
                    copyTooltip="Copiar nome"
                  />
                  <InfoField
                    label="Matrícula"
                    value={employee.registrationNumber}
                    icon={<Hash className="h-4 w-4" />}
                    showCopyButton
                    copyTooltip="Copiar matrícula"
                  />
                  <InfoField
                    label="CPF"
                    value={formatCPF(employee.cpf)}
                    icon={<CreditCard className="h-4 w-4" />}
                    showCopyButton
                    copyTooltip="Copiar CPF"
                  />
                  <InfoField
                    label="Status"
                    value={getStatusLabel(employee.status)}
                    badge={
                      <Badge variant={getStatusVariant(employee.status)}>
                        {getStatusLabel(employee.status)}
                      </Badge>
                    }
                  />
                </div>
              </div>
            </Card>

            {/* Informações Profissionais */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-lg uppercase font-semibold mb-4">
                Informações Profissionais
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <InfoField
                  label="Cargo"
                  value={employee.position?.name}
                  icon={<Briefcase className="h-4 w-4" />}
                />
                <InfoField
                  label="Departamento"
                  value={employee.department?.name}
                  icon={<Building2 className="h-4 w-4" />}
                />
                <InfoField
                  label="Empresa"
                  value={getCompanyName()}
                  icon={<Factory className="h-4 w-4" />}
                />
                <InfoField
                  label="Data de Admissão"
                  value={new Date(employee.hireDate).toLocaleDateString(
                    'pt-BR'
                  )}
                  icon={<Calendar className="h-4 w-4" />}
                />
                <InfoField
                  label="Tempo de Empresa"
                  value={getCompanyTime(employee.hireDate)}
                  icon={<Clock className="h-4 w-4" />}
                />
                <InfoField
                  label="Salário Base"
                  value={formatSalary(employee.baseSalary)}
                />
              </div>
            </Card>

            {/* Informações Contratuais */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-lg uppercase font-semibold mb-4">
                Informações Contratuais
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <InfoField
                  label="Tipo de Contrato"
                  value={getContractTypeLabel(employee.contractType)}
                  icon={<FileText className="h-4 w-4" />}
                />
                <InfoField
                  label="Regime de Trabalho"
                  value={getWorkRegimeLabel(employee.workRegime)}
                />
                <InfoField
                  label="Horas Semanais"
                  value={`${employee.weeklyHours}h`}
                  icon={<Clock className="h-4 w-4" />}
                />
                {employee.terminationDate && (
                  <InfoField
                    label="Data de Desligamento"
                    value={new Date(
                      employee.terminationDate
                    ).toLocaleDateString('pt-BR')}
                    icon={<Calendar className="h-4 w-4" />}
                  />
                )}
              </div>
            </Card>

            {/* Usuário Vinculado */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-lg uppercase font-semibold mb-4">
                Usuário do Sistema
              </h3>
              {employee.userId ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900">
                      <UserCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {userData?.profile
                          ? `${userData.profile.name} ${userData.profile.surname}`.trim()
                          : userData?.username || 'Usuário vinculado'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userData?.email ||
                          'Este funcionário possui acesso ao sistema'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewUser}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Visualizar Usuário
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 border rounded-lg border-dashed">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                      <UserCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">
                        Nenhum usuário vinculado
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Crie um usuário para dar acesso ao sistema
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleOpenCreateUserModal}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Criar Usuário
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Aba Dependentes */}
          <TabsContent value="dependants" className="flex flex-col gap-6">
            <DependantsSection employeeId={employeeId} />
          </TabsContent>

          {/* Aba Documentos */}
          <TabsContent value="documents" className="flex flex-col gap-6">
            <EmployeeDocumentsChecklist
              employeeId={employeeId}
              employeeName={employee.fullName}
              gender={employee.gender}
            />
          </TabsContent>

          {/* ================================================================ */}
          {/* Tab 4: Benefícios                                                */}
          {/* ================================================================ */}
          <TabsContent value="benefits" className="flex flex-col gap-6">
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-violet-500" />
                  <h3 className="text-lg uppercase font-semibold">
                    Benefícios Inscritos
                  </h3>
                </div>
                <Link href="/hr/benefits">
                  <Button size="sm" variant="outline" className="gap-2 h-9 px-2.5">
                    <Plus className="h-4 w-4" />
                    Inscrever em Plano
                  </Button>
                </Link>
              </div>

              {isLoadingEnrollments ? (
                <GridLoading count={3} layout="list" size="sm" />
              ) : !enrollmentsData || enrollmentsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Gift className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum benefício encontrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Inscreva o funcionário em um plano de benefícios
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollmentsData.map((enrollment: BenefitEnrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 shrink-0">
                          <Heart className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {enrollment.benefitPlan?.name || 'Plano'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs">
                              {getBenefitTypeLabel(enrollment.benefitPlan?.type || '')}
                            </Badge>
                            <Badge variant={getEnrollmentStatusVariant(enrollment.status)} className="text-xs">
                              {getEnrollmentStatusLabel(enrollment.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 text-sm">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(enrollment.employeeContribution)}
                          <span className="text-muted-foreground font-normal"> / mês</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Desde {formatDateShort(enrollment.startDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {enrollmentsData.length >= 10 && (
                    <div className="text-center pt-2">
                      <Link href="/hr/benefits">
                        <Button variant="ghost" size="sm" className="gap-2">
                          Ver todos os benefícios
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ================================================================ */}
          {/* Tab 5: Tempo Livre (Férias + Ausências)                          */}
          {/* ================================================================ */}
          <TabsContent value="timeoff" className="flex flex-col gap-6">
            {/* Férias */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Palmtree className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-lg uppercase font-semibold">Férias</h3>
                </div>
                <Link href="/hr/vacations">
                  <Button size="sm" variant="outline" className="gap-2 h-9 px-2.5">
                    Ver todos
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>

              {/* Vacation balance summary */}
              {vacationBalance && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {vacationBalance.totalAvailableDays}
                    </span>
                    <span className="text-xs text-muted-foreground">Dias Disponíveis</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
                    <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                      {vacationBalance.totalUsedDays}
                    </span>
                    <span className="text-xs text-muted-foreground">Dias Usados</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                    <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                      {vacationBalance.totalSoldDays}
                    </span>
                    <span className="text-xs text-muted-foreground">Dias Vendidos</span>
                  </div>
                </div>
              )}

              {isLoadingVacations ? (
                <GridLoading count={2} layout="list" size="sm" />
              ) : !vacationsData || vacationsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Palmtree className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum período de férias registrado
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vacationsData.map((vacation: VacationPeriod) => (
                    <div
                      key={vacation.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {formatDateShort(vacation.acquisitionStart)} — {formatDateShort(vacation.acquisitionEnd)}
                          </p>
                          <Badge variant={getVacationStatusVariant(vacation.status)} className="text-xs">
                            {getVacationStatusLabel(vacation.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {vacation.totalDays} dias totais · {vacation.usedDays} usados · {vacation.remainingDays} restantes
                        </p>
                        {vacation.scheduledStart && (
                          <p className="text-xs text-sky-500 mt-1">
                            Agendado: {formatDateShort(vacation.scheduledStart)} — {vacation.scheduledEnd ? formatDateShort(vacation.scheduledEnd) : '...'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Ausências */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  <h3 className="text-lg uppercase font-semibold">Ausências</h3>
                </div>
                <Link href="/hr/absences">
                  <Button size="sm" variant="outline" className="gap-2 h-9 px-2.5">
                    Ver todos
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>

              {isLoadingAbsences ? (
                <GridLoading count={2} layout="list" size="sm" />
              ) : !absencesData || absencesData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Nenhuma ausência registrada
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {absencesData.map((absence: Absence) => (
                    <div
                      key={absence.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {getAbsenceTypeLabel(absence.type)}
                          </p>
                          <Badge variant={getAbsenceStatusVariant(absence.status)} className="text-xs">
                            {getAbsenceStatusLabel(absence.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {formatDateShort(absence.startDate)} — {formatDateShort(absence.endDate)} · {absence.totalDays} dia{absence.totalDays !== 1 ? 's' : ''}
                        </p>
                        {absence.reason && (
                          <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                            {absence.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {absence.isPaid ? (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                            Remunerada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Não Remunerada
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {absencesData.length >= 10 && (
                    <div className="text-center pt-2">
                      <Link href="/hr/absences">
                        <Button variant="ghost" size="sm" className="gap-2">
                          Ver todas as ausências
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ================================================================ */}
          {/* Tab 6: Saúde e Segurança                                         */}
          {/* ================================================================ */}
          <TabsContent value="health" className="flex flex-col gap-6">
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-rose-500" />
                  <h3 className="text-lg uppercase font-semibold">
                    Exames Médicos Ocupacionais
                  </h3>
                </div>
                <Link href="/hr/medical-exams">
                  <Button size="sm" variant="outline" className="gap-2 h-9 px-2.5">
                    <Plus className="h-4 w-4" />
                    Novo Exame
                  </Button>
                </Link>
              </div>

              {isLoadingExams ? (
                <GridLoading count={3} layout="list" size="sm" />
              ) : !medicalExamsData || medicalExamsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Stethoscope className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum exame registrado
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Registre os exames médicos ocupacionais do funcionário
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {medicalExamsData.map((exam: MedicalExam) => {
                    const expStatus = getExamExpirationStatus(exam.expirationDate);
                    const ExpIcon = expStatus.icon;
                    return (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 shrink-0">
                            <HeartPulse className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {getExamTypeLabel(exam.type)}
                              </p>
                              <Badge variant={getExamResultVariant(exam.result)} className="text-xs">
                                {getExamResultLabel(exam.result)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              Realizado em {formatDateShort(exam.examDate)} · Dr(a). {exam.doctorName} (CRM: {exam.doctorCrm})
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {ExpIcon && <ExpIcon className={`h-4 w-4 ${expStatus.color}`} />}
                          <span className={`text-sm ${expStatus.color}`}>
                            {expStatus.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {medicalExamsData.length >= 10 && (
                    <div className="text-center pt-2">
                      <Link href="/hr/medical-exams">
                        <Button variant="ghost" size="sm" className="gap-2">
                          Ver todos os exames
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ================================================================ */}
          {/* Tab 7: Compensação (Bonificações + Deduções)                     */}
          {/* ================================================================ */}
          <TabsContent value="compensation" className="flex flex-col gap-6">
            {/* Bonificações */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-lg uppercase font-semibold">Bonificações</h3>
                </div>
                <Link href="/hr/bonuses">
                  <Button size="sm" variant="outline" className="gap-2 h-9 px-2.5">
                    Ver todos
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>

              {isLoadingBonuses ? (
                <GridLoading count={2} layout="list" size="sm" />
              ) : !bonusesData || bonusesData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Banknote className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Nenhuma bonificação encontrada
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bonusesData.map((bonus: Bonus) => (
                    <div
                      key={bonus.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{bonus.name}</p>
                          {bonus.isPaid ? (
                            <Badge variant="success" className="text-xs">Pago</Badge>
                          ) : (
                            <Badge variant="warning" className="text-xs">Pendente</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {bonus.reason} · {formatDateShort(bonus.date)}
                        </p>
                      </div>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                        + {formatCurrency(bonus.amount)}
                      </span>
                    </div>
                  ))}
                  {bonusesData.length >= 10 && (
                    <div className="text-center pt-2">
                      <Link href="/hr/bonuses">
                        <Button variant="ghost" size="sm" className="gap-2">
                          Ver todas as bonificações
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Deduções */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-rose-500" />
                  <h3 className="text-lg uppercase font-semibold">Deduções</h3>
                </div>
                <Link href="/hr/deductions">
                  <Button size="sm" variant="outline" className="gap-2 h-9 px-2.5">
                    Ver todos
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>

              {isLoadingDeductions ? (
                <GridLoading count={2} layout="list" size="sm" />
              ) : !deductionsData || deductionsData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Minus className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Nenhuma dedução encontrada
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deductionsData.map((deduction: Deduction) => (
                    <div
                      key={deduction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{deduction.name}</p>
                          {deduction.isRecurring && (
                            <Badge variant="outline" className="text-xs">
                              Recorrente
                              {deduction.installments && ` (${deduction.currentInstallment || 1}/${deduction.installments})`}
                            </Badge>
                          )}
                          {deduction.isApplied ? (
                            <Badge variant="secondary" className="text-xs">Aplicada</Badge>
                          ) : (
                            <Badge variant="warning" className="text-xs">Pendente</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {deduction.reason} · {formatDateShort(deduction.date)}
                        </p>
                      </div>
                      <span className="font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                        - {formatCurrency(deduction.amount)}
                      </span>
                    </div>
                  ))}
                  {deductionsData.length >= 10 && (
                    <div className="text-center pt-2">
                      <Link href="/hr/deductions">
                        <Button variant="ghost" size="sm" className="gap-2">
                          Ver todas as deduções
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ================================================================ */}
          {/* Tab 8: Ponto e Horas (Time Entries + Time Bank + Overtime)        */}
          {/* ================================================================ */}
          <TabsContent value="attendance" className="flex flex-col gap-6">
            {/* Banco de Horas Summary */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-sky-500" />
                  <h3 className="text-lg uppercase font-semibold">
                    Banco de Horas ({new Date().getFullYear()})
                  </h3>
                </div>
              </div>

              {isLoadingTimeBank ? (
                <GridLoading count={1} layout="list" size="sm" />
              ) : !timeBankData ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Sem registro de banco de horas para este ano
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <TrendingUp className="h-5 w-5 text-emerald-500 mb-1" />
                    <span className={`text-2xl font-bold ${
                      timeBankData.balance >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {timeBankData.balance > 0 ? '+' : ''}{timeBankData.balance}h
                    </span>
                    <span className="text-xs text-muted-foreground">Saldo Atual</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
                    <span className="text-sm font-medium text-sky-600 dark:text-sky-400">
                      {timeBankData.hasPositiveBalance ? 'Sim' : 'Não'}
                    </span>
                    <span className="text-xs text-muted-foreground">Saldo Positivo</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                    <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
                      {timeBankData.hasNegativeBalance ? 'Sim' : 'Não'}
                    </span>
                    <span className="text-xs text-muted-foreground">Saldo Negativo</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Registros de Ponto */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-violet-500" />
                  <h3 className="text-lg uppercase font-semibold">
                    Registros de Ponto Recentes
                  </h3>
                </div>
                <Link href="/hr/time-control">
                  <Button size="sm" variant="outline" className="gap-2 h-9 px-2.5">
                    Ver todos
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>

              {isLoadingTimeEntries ? (
                <GridLoading count={3} layout="list" size="sm" />
              ) : !timeEntriesData || timeEntriesData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Timer className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum registro de ponto encontrado
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Data</th>
                        <th className="py-2 pr-4 font-medium">Horário</th>
                        <th className="py-2 pr-4 font-medium">Tipo</th>
                        <th className="py-2 font-medium">Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeEntriesData.map((entry: TimeEntry) => (
                        <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-2.5 pr-4">
                            {formatDateShort(entry.timestamp)}
                          </td>
                          <td className="py-2.5 pr-4 font-medium">
                            {formatTime(entry.timestamp)}
                          </td>
                          <td className="py-2.5 pr-4">
                            <Badge
                              variant={
                                entry.entryType === 'CLOCK_IN'
                                  ? 'success'
                                  : entry.entryType === 'CLOCK_OUT'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className="text-xs"
                            >
                              {getTimeEntryTypeLabel(entry.entryType)}
                            </Badge>
                          </td>
                          <td className="py-2.5 text-muted-foreground truncate max-w-[200px]">
                            {entry.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {timeEntriesData.length >= 10 && (
                    <div className="text-center pt-3">
                      <Link href="/hr/time-control">
                        <Button variant="ghost" size="sm" className="gap-2">
                          Ver todos os registros
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Horas Extras */}
            <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <h3 className="text-lg uppercase font-semibold">
                    Horas Extras Recentes
                  </h3>
                </div>
                <Link href="/hr/overtime">
                  <Button size="sm" variant="outline" className="gap-2 h-9 px-2.5">
                    Ver todos
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>

              {isLoadingOvertime ? (
                <GridLoading count={2} layout="list" size="sm" />
              ) : !overtimeData || overtimeData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    Nenhuma hora extra registrada
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overtimeData.map((ot: Overtime) => (
                    <div
                      key={ot.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {formatDateShort(ot.date)} — {ot.hours}h extra{ot.hours !== 1 ? 's' : ''}
                          </p>
                          {ot.approved === true ? (
                            <Badge variant="success" className="text-xs">Aprovada</Badge>
                          ) : ot.approved === false ? (
                            <Badge variant="destructive" className="text-xs">Rejeitada</Badge>
                          ) : (
                            <Badge variant="warning" className="text-xs">Pendente</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-md">
                          {ot.reason}
                        </p>
                      </div>
                      <span className="font-semibold text-amber-600 dark:text-amber-400 shrink-0">
                        +{ot.hours}h
                      </span>
                    </div>
                  ))}
                  {overtimeData.length >= 10 && (
                    <div className="text-center pt-2">
                      <Link href="/hr/overtime">
                        <Button variant="ghost" size="sm" className="gap-2">
                          Ver todas as horas extras
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>

      {/* Modal para criar usuário */}
      <Dialog
        open={isCreateUserModalOpen}
        onOpenChange={open => !open && handleCloseCreateUserModal()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600">
                <UserCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="block">Criar Usuário</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {employee.fullName}
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
                  className={`pl-10 ${
                    emailError
                      ? 'border-rose-500 focus-visible:ring-rose-500'
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
                Senha <span className="text-rose-500">*</span>
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
                      ? 'border-rose-500 focus-visible:ring-rose-500'
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
                Grupo de Permissão <span className="text-rose-500">*</span>
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
                  Selecione um grupo de permissão para definir o nível de acesso
                  do usuário
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCloseCreateUserModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={!canSubmitUser || createUserMutation.isPending}
            >
              {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de upload de foto */}
      <PhotoUploadDialog
        open={isPhotoDialogOpen}
        onOpenChange={setIsPhotoDialogOpen}
        onUpload={handlePhotoUpload}
        title="Foto do Funcionário"
      />

      {/* Modal de confirmação de exclusão */}
      <VerifyActionPinModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={() => deleteMutation.mutate()}
        title="Excluir Funcionário"
        description={`Digite seu PIN de ação para excluir o funcionário "${employee?.fullName}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
