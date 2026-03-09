/**
 * HR Module Landing Page
 * Página inicial do módulo de recursos humanos com cards de navegação e contagens reais
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageDashboardSections } from '@/components/layout/page-dashboard-sections';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { HR_PERMISSIONS } from '@/config/rbac/permission-codes';
import { useTenant } from '@/contexts/tenant-context';
import { usePermissions } from '@/hooks/use-permissions';
import {
  companiesService,
  departmentsService,
  employeesService,
  positionsService,
} from '@/services/hr';

import {
  BookUser,
  Building2,
  FileUser,
  LayoutList,
  SquareUserRound,
  UserRoundCog,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface CardItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
  hoverBg: string;
  permission?: string;
  countKey?: string;
}

const sections: {
  title: string;
  cards: CardItem[];
}[] = [
  {
    title: 'Cadastros',
    cards: [
      {
        id: 'companies',
        title: 'Empresas',
        description: 'Cadastro de empresas e filiais',
        icon: Building2,
        href: '/hr/companies',
        gradient: 'from-purple-500 to-purple-600',
        hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-500/10',
        permission: HR_PERMISSIONS.COMPANIES.LIST,
        countKey: 'companies',
      },
      {
        id: 'departments',
        title: 'Departamentos',
        description: 'Estrutura organizacional e áreas',
        icon: BookUser,
        href: '/hr/departments',
        gradient: 'from-emerald-500 to-emerald-600',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        permission: HR_PERMISSIONS.DEPARTMENTS.LIST,
        countKey: 'departments',
      },
      {
        id: 'positions',
        title: 'Cargos e Funções',
        description: 'Cadastro de cargos, salários e requisitos',
        icon: FileUser,
        href: '/hr/positions',
        gradient: 'from-amber-500 to-amber-600',
        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
        permission: HR_PERMISSIONS.POSITIONS.LIST,
        countKey: 'positions',
      },
      {
        id: 'employees',
        title: 'Funcionários',
        description: 'Listagem e gestão de colaboradores',
        icon: SquareUserRound,
        href: '/hr/employees',
        gradient: 'from-blue-500 to-blue-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
        countKey: 'employees',
      },
    ],
  },
];

const heroBannerButtons: (CardItem & { label: string })[] = [
  {
    id: 'overview',
    title: 'Visão Geral',
    label: 'Visão Geral',
    description: 'Painel de indicadores do RH',
    icon: LayoutList,
    href: '/hr/overview',
    gradient: 'from-slate-500 to-slate-600',
    hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-500/10',
    permission: HR_PERMISSIONS.EMPLOYEES.LIST,
  },
];

export default function HRLandingPage() {
  const { currentTenant } = useTenant();
  const { hasPermission } = usePermissions();
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  const tenantName = currentTenant?.name || 'Sua Empresa';

  useEffect(() => {
    async function fetchCounts() {
      const [employees, companies, departments, positions] =
        await Promise.allSettled([
          employeesService.listEmployees({ page: 1, perPage: 1 }),
          companiesService.listCompanies({ page: 1, perPage: 100 }),
          departmentsService.listDepartments({ page: 1, perPage: 1 }),
          positionsService.listPositions({ page: 1, perPage: 1 }),
        ]);

      const extractCount = (
        result: PromiseSettledResult<unknown>,
        entityKey: string
      ): number | null => {
        if (result.status !== 'fulfilled') return null;
        const v = result.value as Record<string, unknown> | unknown[];
        if (Array.isArray(v)) return v.length;
        const meta = (v as Record<string, unknown>)?.meta as Record<string, unknown> | undefined;
        const total = (v as Record<string, unknown>)?.total as number | undefined;
        const entityArr = (v as Record<string, unknown>)?.[entityKey] as unknown[] | undefined;
        return meta?.total as number ?? total ?? entityArr?.length ?? null;
      };

      setCounts({
        employees: extractCount(employees, 'employees'),
        companies: extractCount(companies, 'companies'),
        departments: extractCount(departments, 'departments'),
        positions: extractCount(positions, 'positions'),
      });
      setCountsLoading(false);
    }
    fetchCounts();
  }, []);

  return (
    <div className="space-y-8">
      <PageActionBar
        breadcrumbItems={[{ label: 'Recursos Humanos', href: '/hr' }]}
        hasPermission={hasPermission}
      />

      <PageHeroBanner
        title="Recursos Humanos"
        description="Gerencie funcionários, departamentos, cargos e a estrutura organizacional da sua empresa."
        icon={UserRoundCog}
        iconGradient="from-blue-500 to-purple-600"
        buttons={heroBannerButtons.map(btn => ({
          id: btn.id,
          label: btn.label,
          icon: btn.icon,
          href: btn.href,
          gradient: btn.gradient,
          permission: btn.permission,
        }))}
        hasPermission={hasPermission}
      />

      <PageDashboardSections
        sections={sections}
        counts={counts}
        countsLoading={countsLoading}
        hasPermission={hasPermission}
      />
    </div>
  );
}
