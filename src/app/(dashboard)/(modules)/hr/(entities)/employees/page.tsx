/**
 * OpenSea OS - Employees Page
 * Pagina de gerenciamento de funcionarios usando o novo sistema OpenSea OS
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
  SelectionToolbar,
  useEntityCrud,
  useEntityPage,
  type ContextMenuAction,
  type SortDirection,
} from '@/core';
import { usePermissions } from '@/hooks/use-permissions';
import { logger } from '@/lib/logger';
import type { Employee } from '@/types/hr';
import {
  Briefcase,
  Building2,
  CalendarOff,
  Clock,
  ExternalLink,
  GitBranchPlus,
  Loader2,
  LogOut,
  Palmtree,
  Plus,
  Printer,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { useListCompanies } from '@/app/(dashboard)/(modules)/admin/(entities)/companies/src';
import { HR_PERMISSIONS } from '../../_shared/constants/hr-permissions';
import { useListDepartments } from '../departments/src';
import { useListPositions } from '../positions/src';
import {
  createEmployee,
  deleteEmployee,
  duplicateEmployee,
  employeesApi,
  employeesConfig,
  updateEmployee,
  type CreateEmployeeWithUserRequest,
} from './src';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
const QuickAbsenceModal = dynamic(
  () =>
    import('./src/modals/quick-absence-modal').then(m => ({
      default: m.QuickAbsenceModal,
    })),
  { ssr: false }
);
const QuickVacationModal = dynamic(
  () =>
    import('./src/modals/quick-vacation-modal').then(m => ({
      default: m.QuickVacationModal,
    })),
  { ssr: false }
);
const QuickTimeEntryModal = dynamic(
  () =>
    import('./src/modals/quick-time-entry-modal').then(m => ({
      default: m.QuickTimeEntryModal,
    })),
  { ssr: false }
);
const DuplicateConfirmModal = dynamic(
  () =>
    import('./src/modals/duplicate-confirm-modal').then(m => ({
      default: m.DuplicateConfirmModal,
    })),
  { ssr: false }
);

export default function EmployeesPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <EmployeesPageContent />
    </Suspense>
  );
}

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

function EmployeesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // QUICK-ACTION MODAL STATE
  // ============================================================================

  const [absenceTarget, setAbsenceTarget] = useState<{
    id: string;
    fullName: string;
  } | null>(null);
  const [vacationTarget, setVacationTarget] = useState<{
    id: string;
    fullName: string;
  } | null>(null);
  const [timeEntryTarget, setTimeEntryTarget] = useState<{
    id: string;
    fullName: string;
  } | null>(null);

  // ============================================================================
  // URL-BASED FILTERS
  // ============================================================================

  const companyIds = useMemo(() => {
    const raw = searchParams.get('company');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const departmentIds = useMemo(() => {
    const raw = searchParams.get('department');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const positionIds = useMemo(() => {
    const raw = searchParams.get('position');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  // ============================================================================
  // FETCH REFERENCE DATA FOR FILTERS AND ENRICHMENT
  // ============================================================================

  const { data: companiesData } = useListCompanies({ perPage: 100 });
  const { data: departmentsData } = useListDepartments({ perPage: 100 });
  const { data: positionsData } = useListPositions({ perPage: 100 });

  // Build lookup maps for enriching employees and displaying badges
  const companyMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; tradeName: string | null; legalName: string }
    >();
    if (companiesData?.companies) {
      for (const c of companiesData.companies) {
        map.set(c.id, {
          id: c.id,
          tradeName: c.tradeName ?? null,
          legalName: c.legalName,
        });
      }
    }
    return map;
  }, [companiesData?.companies]);

  const departmentMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; companyId: string | null }
    >();
    if (departmentsData?.departments) {
      for (const d of departmentsData.departments) {
        map.set(d.id, {
          id: d.id,
          name: d.name,
          companyId: d.companyId ?? null,
        });
      }
    }
    return map;
  }, [departmentsData?.departments]);

  const positionMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; departmentId: string | null }
    >();
    if (positionsData?.positions) {
      for (const p of positionsData.positions) {
        map.set(p.id, {
          id: p.id,
          name: p.name,
          departmentId: p.departmentId ?? null,
        });
      }
    }
    return map;
  }, [positionsData?.positions]);

  // ============================================================================
  // INFINITE SCROLL DATA FETCHING
  // ============================================================================

  const PAGE_SIZE = 20;

  const {
    data: infiniteData,
    isLoading: infiniteIsLoading,
    error: infiniteError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['employees', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      return employeesApi.list({
        page: pageParam,
        perPage: PAGE_SIZE,
        includeDeleted: false,
      });
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.meta?.page ?? lastPage.page ?? 1;
      const total = lastPage.meta?.totalPages ?? lastPage.totalPages ?? 1;
      return currentPage < total ? currentPage + 1 : undefined;
    },
  });

  const allEmployees = useMemo(
    () =>
      (infiniteData?.pages.flatMap(p => p.employees ?? []) ?? []).filter(
        e => !e.deletedAt
      ),
    [infiniteData]
  );
  const totalEmployees = infiniteData?.pages[0]?.total ?? 0;

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // CRUD SETUP (mutations only — listing comes from useInfiniteQuery above)
  // ============================================================================

  const crud = useEntityCrud<Employee>({
    entityName: 'Funcionário',
    entityNamePlural: 'Funcionários',
    queryKey: ['employees'],
    baseUrl: '/api/v1/hr/employees',
    listFn: async () => {
      // Listing is handled by useInfiniteQuery — return accumulated items for handler lookups
      return allEmployees;
    },
    getFn: (id: string) => employeesApi.get(id),
    createFn: createEmployee,
    updateFn: updateEmployee,
    deleteFn: deleteEmployee,
    duplicateFn: duplicateEmployee,
  });

  // ============================================================================
  // PAGE SETUP
  // ============================================================================

  const page = useEntityPage<Employee>({
    entityName: 'Funcionário',
    entityNamePlural: 'Funcionários',
    queryKey: ['employees'],
    crud,
    viewRoute: id => `/hr/employees/${id}`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      const fullName = item.fullName?.toLowerCase() || '';
      const registration = item.registrationNumber?.toLowerCase() || '';
      const cpf = item.cpf || '';

      return [fullName, registration, cpf].some(value => value.includes(q));
    },
    duplicateConfig: {
      getNewName: item => `${item.fullName} (cópia)`,
      getData: item => ({
        fullName: `${item.fullName} (cópia)`,
        registrationNumber: `${item.registrationNumber}_COPY`,
        cpf: item.cpf,
        hireDate: new Date().toISOString(),
        baseSalary: item.baseSalary,
        contractType: item.contractType,
        workRegime: item.workRegime,
        weeklyHours: item.weeklyHours,
        departmentId: item.departmentId,
        positionId: item.positionId,
      }),
    },
  });

  // ============================================================================
  // CLIENT-SIDE URL FILTERS
  // ============================================================================

  const displayedEmployees = useMemo(() => {
    let items = allEmployees;

    // Apply search filter (mirrors useEntityPage filterFn)
    if (page.searchQuery.trim()) {
      const q = page.searchQuery.toLowerCase();
      items = items.filter(item => {
        const fullName = item.fullName?.toLowerCase() || '';
        const registration = item.registrationNumber?.toLowerCase() || '';
        const cpf = item.cpf || '';
        return [fullName, registration, cpf].some(value => value.includes(q));
      });
    }

    // Apply company filter
    if (companyIds.length > 0) {
      const set = new Set(companyIds);
      items = items.filter(e => {
        if (e.companyId && set.has(e.companyId)) return true;
        const dept = e.departmentId ? departmentMap.get(e.departmentId) : null;
        return dept?.companyId && set.has(dept.companyId);
      });
    }
    // Apply department filter
    if (departmentIds.length > 0) {
      const set = new Set(departmentIds);
      items = items.filter(e => e.departmentId && set.has(e.departmentId));
    }
    // Apply position filter
    if (positionIds.length > 0) {
      const set = new Set(positionIds);
      items = items.filter(e => e.positionId && set.has(e.positionId));
    }
    return items;
  }, [
    allEmployees,
    page.searchQuery,
    companyIds,
    departmentIds,
    positionIds,
    departmentMap,
  ]);

  // Derive filter options from hook data
  const availableCompanies = useMemo(() => {
    if (!companiesData?.companies) return [];
    return companiesData.companies.map(c => ({
      id: c.id,
      name: c.tradeName || c.legalName,
    }));
  }, [companiesData?.companies]);

  const availableDepartments = useMemo(() => {
    if (!departmentsData?.departments) return [];

    // If no company filter, show all departments
    if (companyIds.length === 0) {
      return departmentsData.departments.map(d => ({
        id: d.id,
        name: d.name,
      }));
    }

    // Narrow: only departments belonging to selected companies
    const cmpSet = new Set(companyIds);
    return departmentsData.departments
      .filter(d => d.companyId && cmpSet.has(d.companyId))
      .map(d => ({
        id: d.id,
        name: d.name,
      }));
  }, [departmentsData?.departments, companyIds]);

  const availablePositions = useMemo(() => {
    if (!positionsData?.positions) return [];

    // If no department filter, show all positions
    if (departmentIds.length === 0) {
      return positionsData.positions.map(p => ({
        id: p.id,
        name: p.name,
      }));
    }

    // Narrow: only positions belonging to selected departments
    const deptSet = new Set(departmentIds);
    return positionsData.positions
      .filter(p => p.departmentId && deptSet.has(p.departmentId))
      .map(p => ({
        id: p.id,
        name: p.name,
      }));
  }, [positionsData?.positions, departmentIds]);

  // Build URL preserving all filter params
  const buildFilterUrl = useCallback(
    (params: {
      company?: string[];
      department?: string[];
      position?: string[];
    }) => {
      const cmp = params.company !== undefined ? params.company : companyIds;
      const dept =
        params.department !== undefined ? params.department : departmentIds;
      const pos = params.position !== undefined ? params.position : positionIds;
      const parts: string[] = [];
      if (cmp.length > 0) parts.push(`company=${cmp.join(',')}`);
      if (dept.length > 0) parts.push(`department=${dept.join(',')}`);
      if (pos.length > 0) parts.push(`position=${pos.join(',')}`);
      return parts.length > 0
        ? `/hr/employees?${parts.join('&')}`
        : '/hr/employees';
    },
    [companyIds, departmentIds, positionIds]
  );

  const setCompanyFilter = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ company: ids }));
    },
    [router, buildFilterUrl]
  );

  const setDepartmentFilter = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ department: ids }));
    },
    [router, buildFilterUrl]
  );

  const setPositionFilter = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ position: ids }));
    },
    [router, buildFilterUrl]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/hr/employees/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/hr/employees/${ids[0]}/edit`);
    }
  };

  const handleContextDuplicate = (ids: string[]) => {
    page.handlers.handleItemsDuplicate(ids);
  };

  const handleContextDelete = (ids: string[]) => {
    page.modals.setItemsToDelete(ids);
    page.modals.open('delete');
  };

  const customSortByRegistration = (
    a: Employee,
    b: Employee,
    direction: SortDirection
  ) => {
    const regA = a.registrationNumber?.toLowerCase() ?? '';
    const regB = b.registrationNumber?.toLowerCase() ?? '';
    const sortResult = regA.localeCompare(regB, 'pt-BR');
    return direction === 'asc' ? sortResult : -sortResult;
  };

  // ============================================================================
  // PERMISSION CHECKS
  // ============================================================================

  const canView = hasPermission(HR_PERMISSIONS.EMPLOYEES.VIEW);
  const canEdit = hasPermission(HR_PERMISSIONS.EMPLOYEES.UPDATE);
  const canDelete = hasPermission(HR_PERMISSIONS.EMPLOYEES.DELETE);
  const canDuplicate = hasPermission(HR_PERMISSIONS.EMPLOYEES.CREATE);
  const canCreateAbsence = hasPermission(HR_PERMISSIONS.ABSENCES.CREATE);
  const canCreateVacation = hasPermission(HR_PERMISSIONS.VACATIONS.CREATE);
  const canCreateTimeEntry = hasPermission(HR_PERMISSIONS.TIME_ENTRIES.CREATE);
  const canTerminate = hasPermission(HR_PERMISSIONS.EMPLOYEES.TERMINATE);
  const canPrint = hasPermission(HR_PERMISSIONS.EMPLOYEES.EXPORT);

  // ============================================================================
  // STATUS BADGE HELPER
  // ============================================================================

  const getStatusBadge = (employee: Employee) => {
    const status = employee.status?.toUpperCase();
    if (
      employee.terminationDate ||
      status === 'TERMINATED' ||
      status === 'INACTIVE'
    ) {
      return { label: 'Inativo', variant: 'destructive' as const };
    }
    if (status === 'VACATION' || status === 'ON_VACATION') {
      return { label: 'Férias', variant: 'warning' as const };
    }
    if (status === 'LEAVE' || status === 'ON_LEAVE' || status === 'AWAY') {
      return { label: 'Afastado', variant: 'secondary' as const };
    }
    return { label: 'Ativo', variant: 'default' as const };
  };

  // ============================================================================
  // CONTEXT MENU ACTIONS
  // ============================================================================

  const getContextActions = useCallback((): ContextMenuAction[] => {
    const actions: ContextMenuAction[] = [];

    // Group 2: Custom HR actions (after built-in View/Edit/Duplicate)
    if (canCreateAbsence) {
      actions.push({
        id: 'register-absence',
        label: 'Registrar Ausência',
        icon: CalendarOff,
        separator: 'before',
        onClick: (ids: string[]) => {
          const emp = allEmployees.find(e => e.id === ids[0]);
          if (emp) setAbsenceTarget({ id: emp.id, fullName: emp.fullName });
        },
      });
    }

    if (canCreateVacation) {
      actions.push({
        id: 'request-vacation',
        label: 'Solicitar Férias',
        icon: Palmtree,
        onClick: (ids: string[]) => {
          const emp = allEmployees.find(e => e.id === ids[0]);
          if (emp) setVacationTarget({ id: emp.id, fullName: emp.fullName });
        },
      });
    }

    if (canCreateTimeEntry) {
      actions.push({
        id: 'register-time',
        label: 'Registrar Ponto',
        icon: Clock,
        onClick: (ids: string[]) => {
          const emp = allEmployees.find(e => e.id === ids[0]);
          if (emp) setTimeEntryTarget({ id: emp.id, fullName: emp.fullName });
        },
      });
    }

    if (canPrint) {
      actions.push({
        id: 'print-badge',
        label: 'Imprimir Crachá',
        icon: Printer,
        separator: 'before',
        onClick: (ids: string[]) => {
          if (ids.length > 0) {
            toast.info('Preparando impressão do crachá...');
            // Navigate to label/badge printing
            router.push(`/hr/employees/${ids[0]}?tab=badge`);
          }
        },
      });
    }

    if (canTerminate) {
      actions.push({
        id: 'terminate',
        label: 'Desligar Funcionário',
        icon: LogOut,
        separator: 'before',
        variant: 'destructive',
        onClick: (ids: string[]) => {
          if (ids.length > 0)
            router.push(`/hr/terminations?employeeId=${ids[0]}`);
        },
      });
    }

    if (canDelete) {
      actions.push({
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        separator: canTerminate ? undefined : 'before',
        variant: 'destructive',
        onClick: handleContextDelete,
      });
    }

    return actions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canCreateAbsence,
    canCreateVacation,
    canCreateTimeEntry,
    canPrint,
    canTerminate,
    canDelete,
    router,
    allEmployees,
  ]);

  const contextActions = useMemo(
    () => getContextActions(),
    [getContextActions]
  );

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Employee, isSelected: boolean) => {
    // Get info from lookup maps
    const posInfo = item.positionId ? positionMap.get(item.positionId) : null;
    const deptInfo = item.departmentId
      ? departmentMap.get(item.departmentId)
      : null;
    const companyInfo = item.companyId
      ? companyMap.get(item.companyId)
      : deptInfo?.companyId
        ? companyMap.get(deptInfo.companyId)
        : null;
    const statusBadge = getStatusBadge(item);

    // Subtitle: registration number (matrícula)
    const subtitle = item.registrationNumber
      ? `Matrícula ${item.registrationNumber}`
      : 'Sem matrícula';

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        onDuplicate={canDuplicate ? handleContextDuplicate : undefined}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.fullName}
          subtitle={subtitle}
          icon={Users}
          iconBgColor="bg-linear-to-br from-emerald-500 to-teal-600"
          badges={[
            {
              label: statusBadge.label,
              variant: statusBadge.variant,
            },
            ...(companyInfo
              ? [
                  {
                    label: companyInfo.tradeName || companyInfo.legalName,
                    variant: 'outline' as const,
                  },
                ]
              : []),
            ...(deptInfo
              ? [
                  {
                    label: deptInfo.name,
                    variant: 'outline' as const,
                  },
                ]
              : []),
            ...(posInfo
              ? [
                  {
                    label: posInfo.name,
                    variant: 'outline' as const,
                  },
                ]
              : []),
          ]}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
          customFooter={
            <div className="flex flex-col sm:flex-row rounded-b-xl overflow-hidden">
              <button
                onClick={() => {
                  setTimeEntryTarget({
                    id: item.id,
                    fullName: item.fullName,
                  });
                }}
                className="w-full flex items-center justify-between px-3 py-4 text-xs font-medium text-white transition-colors cursor-pointer bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="truncate">Registrar Ponto</span>
                </div>
              </button>
              <div className="h-px sm:h-auto sm:w-px bg-white/20 dark:bg-white/10" />
              <a
                href={`/hr/employees/${item.id}?tab=badge`}
                className="w-full flex items-center justify-between px-3 py-4 text-xs font-medium text-white transition-colors cursor-pointer bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4" />
                  <span className="truncate">Imprimir Crachá</span>
                </div>
              </a>
            </div>
          }
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Employee, isSelected: boolean) => {
    // Get info from lookup maps
    const posInfo = item.positionId ? positionMap.get(item.positionId) : null;
    const deptInfo = item.departmentId
      ? departmentMap.get(item.departmentId)
      : null;
    const companyInfo = item.companyId
      ? companyMap.get(item.companyId)
      : deptInfo?.companyId
        ? companyMap.get(deptInfo.companyId)
        : null;
    const statusBadge = getStatusBadge(item);

    // Subtitle: registration number (matrícula)
    const subtitle = item.registrationNumber
      ? `Matrícula ${item.registrationNumber}`
      : 'Sem matrícula';

    // Build metadata with styled inline badges
    const metadataContent = (
      <div className="flex items-center gap-2 flex-wrap">
        {companyInfo && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border border-border">
            <Building2 className="h-3 w-3 shrink-0" />
            {companyInfo.tradeName || companyInfo.legalName}
          </span>
        )}
        {deptInfo && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border border-border">
            <Users className="h-3 w-3 shrink-0" />
            {deptInfo.name}
          </span>
        )}
        {posInfo && (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border border-border">
            <Briefcase className="h-3 w-3 shrink-0" />
            {posInfo.name}
          </span>
        )}
      </div>
    );

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        onDuplicate={canDuplicate ? handleContextDuplicate : undefined}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.fullName}
          subtitle={subtitle}
          metadata={metadataContent}
          icon={Users}
          iconBgColor="bg-linear-to-br from-emerald-500 to-teal-600"
          badges={[
            {
              label: statusBadge.label,
              variant: statusBadge.variant,
            },
          ]}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const selectedIds = Array.from(page.selection?.state.selectedIds || []);
  const hasSelection = selectedIds.length > 0;

  const initialIds = useMemo(
    () => displayedEmployees.map(i => i.id),
    [displayedEmployees]
  );

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION
  // ============================================================================

  const handleImport = useCallback(() => {
    router.push('/import/hr/employees');
  }, [router]);

  const handleCreate = useCallback(() => {
    page.modals.open('create');
  }, [page.modals]);

  const handleOpenOrgChart = useCallback(() => {
    router.push('/hr/employees/org-chart');
  }, [router]);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'employees-org-chart',
        title: 'Organograma',
        icon: GitBranchPlus,
        onClick: handleOpenOrgChart,
        variant: 'outline',
      },
      {
        id: 'import-employees',
        title: 'Importar',
        icon: Upload,
        onClick: handleImport,
        variant: 'outline',
        permission: employeesConfig.permissions?.import,
      },
      {
        id: 'create-employee',
        title: 'Novo Funcionário',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: employeesConfig.permissions?.create,
      },
    ],
    [handleOpenOrgChart, handleImport, handleCreate]
  );

  const visibleActionButtons = useMemo<HeaderButton[]>(
    () =>
      actionButtons
        .filter(button =>
          button.permission ? hasPermission(button.permission) : true
        )
        .map(({ permission, ...button }) => button),
    [actionButtons, hasPermission]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'employees',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Funcionários', href: '/hr/employees' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Funcionários"
            description="Gerencie os funcionários da organização"
          />
        </PageHeader>

        <PageBody>
          <div data-testid="employees-page" className="contents" />
          {/* Search Bar */}
          <div data-testid="employees-search">
            <SearchBar
              placeholder={employeesConfig.display.labels.searchPlaceholder}
              value={page.searchQuery}
              onSearch={value => page.setSearchQuery(value)}
              showClear={true}
              size="md"
            />
          </div>

          {/* Grid */}
          {infiniteIsLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : infiniteError ? (
            <GridError
              type="server"
              title="Erro ao carregar funcionários"
              message="Ocorreu um erro ao tentar carregar os funcionários. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => crud.refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={employeesConfig}
              items={displayedEmployees}
              toolbarStart={
                <>
                  <div data-testid="employees-filter-company">
                    <FilterDropdown
                      label="Empresa"
                      icon={Building2}
                      options={availableCompanies.map(c => ({
                        id: c.id,
                        label: c.name,
                      }))}
                      selected={companyIds}
                      onSelectionChange={setCompanyFilter}
                      activeColor="emerald"
                      searchPlaceholder="Buscar empresa..."
                      emptyText="Nenhuma empresa encontrada."
                      footerAction={{
                        icon: ExternalLink,
                        label: 'Ver todas as empresas',
                        onClick: () => router.push('/admin/companies'),
                        color: 'emerald',
                      }}
                    />
                  </div>
                  <div data-testid="employees-filter-department">
                    <FilterDropdown
                      label="Departamento"
                      icon={Building2}
                      options={availableDepartments.map(d => ({
                        id: d.id,
                        label: d.name,
                      }))}
                      selected={departmentIds}
                      onSelectionChange={setDepartmentFilter}
                      activeColor="blue"
                      searchPlaceholder="Buscar departamento..."
                      emptyText="Nenhum departamento encontrado."
                      footerAction={{
                        icon: ExternalLink,
                        label: 'Ver todos os departamentos',
                        onClick: () => router.push('/hr/departments'),
                        color: 'blue',
                      }}
                    />
                  </div>
                  <div data-testid="employees-filter-position">
                    <FilterDropdown
                      label="Cargo"
                      icon={Briefcase}
                      options={availablePositions.map(p => ({
                        id: p.id,
                        label: p.name,
                      }))}
                      selected={positionIds}
                      onSelectionChange={setPositionFilter}
                      activeColor="violet"
                      searchPlaceholder="Buscar cargo..."
                      emptyText="Nenhum cargo encontrado."
                      footerAction={{
                        icon: ExternalLink,
                        label: 'Ver todos os cargos',
                        onClick: () => router.push('/hr/positions'),
                        color: 'violet',
                      }}
                    />
                  </div>
                </>
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={infiniteIsLoading}
              isSearching={!!page.searchQuery}
              onItemClick={(item, e) => page.handlers.handleItemClick(item, e)}
              onItemDoubleClick={item =>
                page.handlers.handleItemDoubleClick(item)
              }
              showSorting={true}
              customSortFn={customSortByRegistration}
              customSortLabel="Matrícula"
            />
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Selection Toolbar */}
          {hasSelection && (
            <SelectionToolbar
              selectedIds={selectedIds}
              totalItems={displayedEmployees.length}
              onClear={() => page.selection?.actions.clear()}
              onSelectAll={() => page.selection?.actions.selectAll()}
              defaultActions={{
                view: canView,
                edit: canEdit,
                duplicate: canDuplicate,
                delete: canDelete,
              }}
              handlers={{
                onView: (ids: string[]) =>
                  ids.length === 1 && router.push(`/hr/employees/${ids[0]}`),
                onEdit: (ids: string[]) =>
                  ids.length === 1 &&
                  router.push(`/hr/employees/${ids[0]}/edit`),
                onDuplicate: page.handlers.handleItemsDuplicate,
                onDelete: page.handlers.handleItemsDelete,
              }}
            />
          )}

          {/* Create Modal */}
          <CreateModal
            isOpen={page.modals.isOpen('create')}
            onClose={() => page.modals.close('create')}
            isSubmitting={crud.isCreating}
            onSubmit={async data => {
              try {
                // Extrair dados especificos do usuario
                const {
                  createUser,
                  permissionGroupId,
                  userEmail,
                  userPassword,
                  enableEmailLogin,
                  enableCpfLogin,
                  enableEnrollmentLogin,
                  ...employeeData
                } = data;

                if (createUser && permissionGroupId && userPassword) {
                  // Usar a nova rota que cria funcionario + usuario automaticamente
                  await employeesApi.createWithUser({
                    ...(employeeData as CreateEmployeeWithUserRequest),
                    permissionGroupId,
                    userEmail,
                    userPassword,
                    enableEmailLogin,
                    enableCpfLogin,
                    enableEnrollmentLogin,
                  });
                  await crud.invalidate();
                  toast.success('Funcionário e usuário criados com sucesso!', {
                    description:
                      'O usuário foi criado automaticamente com as permissões selecionadas.',
                    duration: 5000,
                  });
                } else {
                  // Criar apenas o funcionário (toast é exibido pelo useEntityCrud)
                  await crud.create(employeeData);
                }
              } catch (error) {
                logger.error(
                  'Erro ao criar funcionário',
                  error instanceof Error ? error : undefined
                );
                toast.error('Erro ao criar funcionário');
              }
            }}
          />


          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={page.modals.isOpen('delete')}
            onClose={() => page.modals.close('delete')}
            onSuccess={page.handlers.handleDeleteConfirm}
            title="Excluir Funcionário"
            description={`Digite seu PIN de ação para excluir ${page.modals.itemsToDelete.length} funcionário(s). Esta ação não pode ser desfeita.`}
          />

          {/* Duplicate Confirmation */}
          <DuplicateConfirmModal
            isOpen={page.modals.isOpen('duplicate')}
            onClose={() => page.modals.close('duplicate')}
            itemCount={page.modals.itemsToDuplicate.length}
            onConfirm={page.handlers.handleDuplicateConfirm}
            isLoading={crud.isDuplicating}
          />

          {/* Quick Action Modals */}
          <QuickAbsenceModal
            isOpen={!!absenceTarget}
            onClose={() => setAbsenceTarget(null)}
            employee={absenceTarget}
          />

          <QuickVacationModal
            isOpen={!!vacationTarget}
            onClose={() => setVacationTarget(null)}
            employee={vacationTarget}
          />

          <QuickTimeEntryModal
            isOpen={!!timeEntryTarget}
            onClose={() => setTimeEntryTarget(null)}
            employee={timeEntryTarget}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
