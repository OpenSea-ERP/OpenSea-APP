/**
 * HR Module Landing Page
 * Página inicial do módulo de recursos humanos com cards de navegação e contagens reais
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageDashboardSections } from '@/components/layout/page-dashboard-sections';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { useTenant } from '@/contexts/tenant-context';
import { usePermissions } from '@/hooks/use-permissions';
import {
  departmentsService,
  employeesService,
  positionsService,
} from '@/services/hr';

import {
  AlertTriangle,
  BookUser,
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileCheck,
  Clock,
  Coffee,
  FileUser,
  FileX2,
  GitBranchPlus,
  Heart,
  Hourglass,
  MapPin,
  Megaphone,
  MinusCircle,
  PalmtreeIcon,
  PlusCircle,
  Settings,
  Shield,
  ShieldCheck,
  SquareUserRound,
  Stethoscope,
  Timer,
  UserCircle,
  UserPlus,
  UserRoundCog,
  UserX,
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
    title: 'Autoatendimento',
    cards: [
      {
        id: 'my-profile',
        title: 'Meu Perfil',
        description: 'Seus dados pessoais, ponto, férias e holerites',
        icon: UserCircle,
        href: '/hr/my-profile',
        gradient: 'from-violet-500 to-violet-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        // No permission required — self-service
      },
    ],
  },
  {
    title: 'Cadastros',
    cards: [
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
      {
        id: 'admissions',
        title: 'Admissão Digital',
        description: 'Convites de admissão com preenchimento online',
        icon: UserPlus,
        href: '/hr/admissions',
        gradient: 'from-blue-500 to-blue-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.CREATE,
      },
      {
        id: 'dependants',
        title: 'Dependentes',
        description: 'Gerencie dependentes dos funcionários',
        icon: Heart,
        href: '/hr/dependants',
        gradient: 'from-pink-500 to-pink-600',
        hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-500/10',
        permission: HR_PERMISSIONS.DEPENDANTS.LIST,
      },
      {
        id: 'org-chart',
        title: 'Organograma',
        description: 'Estrutura hierárquica visual da organização',
        icon: GitBranchPlus,
        href: '/hr/departments/org-chart',
        gradient: 'from-purple-500 to-purple-600',
        hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-500/10',
        permission: HR_PERMISSIONS.DEPARTMENTS.LIST,
      },
    ],
  },
  {
    title: 'Gestão de Tempo',
    cards: [
      {
        id: 'work-schedules',
        title: 'Escalas de Trabalho',
        description: 'Jornadas, horários e turnos',
        icon: Clock,
        href: '/hr/work-schedules',
        gradient: 'from-indigo-500 to-violet-600',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
        permission: HR_PERMISSIONS.WORK_SCHEDULES.LIST,
      },
      {
        id: 'time-control',
        title: 'Controle de Ponto',
        description: 'Registro de entrada, saída e intervalos',
        icon: Timer,
        href: '/hr/time-control',
        gradient: 'from-cyan-500 to-cyan-600',
        hoverBg: 'hover:bg-cyan-50 dark:hover:bg-cyan-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
      },
      {
        id: 'time-bank',
        title: 'Banco de Horas',
        description: 'Saldos, créditos e débitos de horas',
        icon: Hourglass,
        href: '/hr/time-bank',
        gradient: 'from-teal-500 to-teal-600',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
      },
      {
        id: 'geofence-zones',
        title: 'Zonas de Geofencing',
        description: 'Configure zonas de geolocalização para ponto',
        icon: MapPin,
        href: '/hr/geofence-zones',
        gradient: 'from-teal-500 to-teal-600',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
        permission: HR_PERMISSIONS.GEOFENCE_ZONES.LIST,
      },
      {
        id: 'overtime',
        title: 'Horas Extras',
        description: 'Solicitações e aprovações de horas extras',
        icon: Coffee,
        href: '/hr/overtime',
        gradient: 'from-orange-500 to-orange-600',
        hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
      },
    ],
  },
  {
    title: 'Férias e Ausências',
    cards: [
      {
        id: 'vacations',
        title: 'Férias',
        description: 'Períodos aquisitivos, programação e saldo',
        icon: PalmtreeIcon,
        href: '/hr/vacations',
        gradient: 'from-green-500 to-green-600',
        hoverBg: 'hover:bg-green-50 dark:hover:bg-green-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
      },
      {
        id: 'absences',
        title: 'Ausências',
        description: 'Faltas, atestados e afastamentos',
        icon: UserX,
        href: '/hr/absences',
        gradient: 'from-rose-500 to-rose-600',
        hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
      },
    ],
  },
  {
    title: 'Departamento Pessoal',
    cards: [
      {
        id: 'payroll',
        title: 'Folha de Pagamento',
        description: 'Cálculo, conferência e processamento da folha',
        icon: CalendarDays,
        href: '/hr/payroll',
        gradient: 'from-sky-500 to-sky-600',
        hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
      },
      {
        id: 'bonuses',
        title: 'Bonificações',
        description: 'Gratificações, bônus e premiações',
        icon: PlusCircle,
        href: '/hr/bonuses',
        gradient: 'from-lime-500 to-lime-600',
        hoverBg: 'hover:bg-lime-50 dark:hover:bg-lime-500/10',
        permission: HR_PERMISSIONS.BONUSES.LIST,
      },
      {
        id: 'deductions',
        title: 'Deduções',
        description: 'Descontos, adiantamentos e pensões',
        icon: MinusCircle,
        href: '/hr/deductions',
        gradient: 'from-red-500 to-red-600',
        hoverBg: 'hover:bg-red-50 dark:hover:bg-red-500/10',
        permission: HR_PERMISSIONS.DEDUCTIONS.LIST,
      },
    ],
  },
  {
    title: 'Benefícios e Portal',
    cards: [
      {
        id: 'benefits',
        title: 'Benefícios',
        description: 'Planos de benefícios, inscrições e alocações',
        icon: Heart,
        href: '/hr/benefits',
        gradient: 'from-pink-500 to-pink-600',
        hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-500/10',
        permission: HR_PERMISSIONS.BENEFITS.LIST,
      },
      {
        id: 'announcements',
        title: 'Comunicados',
        description: 'Comunicados e avisos para os colaboradores',
        icon: Megaphone,
        href: '/hr/announcements',
        gradient: 'from-violet-500 to-violet-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.MANAGE,
      },
      {
        id: 'requests',
        title: 'Solicitações',
        description: 'Solicitações de férias, ausências e adiantamentos',
        icon: ClipboardList,
        href: '/hr/requests',
        gradient: 'from-blue-500 to-blue-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.MANAGE,
      },
    ],
  },
  {
    title: 'Saúde e Segurança',
    cards: [
      {
        id: 'medical-exams',
        title: 'Exames Médicos',
        description: 'Exames admissionais, periódicos e demissionais',
        icon: Stethoscope,
        href: '/hr/medical-exams',
        gradient: 'from-teal-500 to-teal-600',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
        permission: HR_PERMISSIONS.MEDICAL_EXAMS.LIST,
      },
      {
        id: 'safety-programs',
        title: 'Programas (PCMSO/PGR)',
        description: 'Programas de segurança e saúde ocupacional',
        icon: ShieldCheck,
        href: '/hr/safety-programs',
        gradient: 'from-emerald-500 to-emerald-600',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        permission: HR_PERMISSIONS.SAFETY_PROGRAMS.LIST,
      },
      {
        id: 'workplace-risks',
        title: 'Riscos Ocupacionais',
        description: 'Gerencie riscos e segurança do trabalho',
        icon: AlertTriangle,
        href: '/hr/workplace-risks',
        gradient: 'from-amber-500 to-amber-600',
        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
        permission: HR_PERMISSIONS.WORKPLACE_RISKS.LIST,
      },
      {
        id: 'cipa',
        title: 'CIPA',
        description: 'Comissão Interna de Prevenção de Acidentes',
        icon: Shield,
        href: '/hr/cipa',
        gradient: 'from-amber-500 to-amber-600',
        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
        permission: HR_PERMISSIONS.CIPA.LIST,
      },
    ],
  },
  {
    title: 'Desligamento',
    cards: [
      {
        id: 'terminations',
        title: 'Rescisões',
        description: 'Rescisões de contrato e cálculos de verbas',
        icon: FileX2,
        href: '/hr/terminations',
        gradient: 'from-rose-500 to-rose-600',
        hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
        permission: HR_PERMISSIONS.TERMINATIONS.LIST,
      },
    ],
  },
  {
    title: 'Obrigações Legais',
    cards: [
      {
        id: 'esocial',
        title: 'eSocial',
        description: 'Eventos, transmissão e acompanhamento do eSocial',
        icon: FileCheck,
        href: '/hr/esocial',
        gradient: 'from-sky-500 to-sky-600',
        hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
        permission: HR_PERMISSIONS.CONFIG.VIEW,
      },
    ],
  },
  {
    title: 'Configurações',
    cards: [
      {
        id: 'settings',
        title: 'Configurações Gerais',
        description: 'Empresa Cidadã, contribuições, PAT e banco de horas',
        icon: Settings,
        href: '/hr/settings',
        gradient: 'from-slate-500 to-slate-600',
        hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-500/10',
        permission: HR_PERMISSIONS.CONFIG.VIEW,
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
    icon: BarChart3,
    href: '/hr/overview',
    gradient: 'from-indigo-500 to-blue-600',
    hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
    permission: HR_PERMISSIONS.EMPLOYEES.LIST,
  },
  {
    id: 'my-profile',
    title: 'Meu Perfil',
    label: 'Meu Perfil',
    description: 'Seus dados, ponto e férias',
    icon: UserCircle,
    href: '/hr/my-profile',
    gradient: 'from-violet-500 to-violet-600',
    hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
    // No permission required
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
      const [employees, departments, positions] = await Promise.allSettled([
        employeesService.listEmployees({ page: 1, perPage: 1 }),
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
        const meta = (v as Record<string, unknown>)?.meta as
          | Record<string, unknown>
          | undefined;
        const total = (v as Record<string, unknown>)?.total as
          | number
          | undefined;
        const entityArr = (v as Record<string, unknown>)?.[entityKey] as
          | unknown[]
          | undefined;
        return (meta?.total as number) ?? total ?? entityArr?.length ?? null;
      };

      setCounts({
        employees: extractCount(employees, 'employees'),
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
