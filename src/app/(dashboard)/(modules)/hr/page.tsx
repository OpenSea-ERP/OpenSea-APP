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
import { teamsService } from '@/services/core/teams.service';

import {
  AlertTriangle,
  ArrowRightLeft,
  Award,
  BookUser,
  BarChart3,
  Briefcase,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileBarChart,
  FileCheck,
  Clock,
  Coffee,
  FileUser,
  FileX2,
  HardHat,
  GraduationCap,
  Heart,
  Hourglass,
  IdCard,
  MessageSquareText,
  Megaphone,
  MinusCircle,
  PalmtreeIcon,
  PlusCircle,
  Settings,
  Shield,
  ShieldCheck,
  SquareUserRound,
  Stethoscope,
  Target,
  Timer,
  UserCircle,
  UserPlus,
  UserRoundCog,
  UserX,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { WhosOutWidget } from './_shared/components/whos-out-widget';
import { BirthdayAnniversaryWidget } from '@/components/hr/birthday-anniversary-widget';

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
  hidden?: boolean;
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
      },
    ],
  },
  {
    title: 'Colaboradores',
    cards: [
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
      {
        id: 'warnings',
        title: 'Advertências',
        description: 'Advertências disciplinares e suspensões',
        icon: AlertTriangle,
        href: '/hr/warnings',
        gradient: 'from-amber-500 to-amber-600',
        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
        permission: HR_PERMISSIONS.WARNINGS.LIST,
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
    ],
  },
  {
    title: 'Estrutura Organizacional',
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
        id: 'teams',
        title: 'Equipes',
        description: 'Gerencie equipes e seus membros',
        icon: Users,
        href: '/hr/teams',
        gradient: 'from-blue-500 to-cyan-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
        permission: HR_PERMISSIONS.TEAMS.LIST,
        countKey: 'teams',
      },
    ],
  },
  {
    title: 'Ciclo de Vida',
    cards: [
      {
        id: 'recruitment',
        title: 'Recrutamento e Seleção',
        description: 'Vagas, candidatos, candidaturas e entrevistas',
        icon: Briefcase,
        href: '/hr/recruitment',
        gradient: 'from-indigo-500 to-indigo-600',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
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
        id: 'onboarding',
        title: 'Onboarding',
        description: 'Checklists de integração para novos colaboradores',
        icon: ClipboardCheck,
        href: '/hr/onboarding',
        gradient: 'from-teal-500 to-teal-600',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
        permission: HR_PERMISSIONS.ONBOARDING.LIST,
      },
      {
        id: 'offboarding',
        title: 'Offboarding',
        description: 'Checklists de desligamento de colaboradores',
        icon: UserX,
        href: '/hr/offboarding',
        gradient: 'from-rose-400 to-rose-500',
        hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
        permission: HR_PERMISSIONS.OFFBOARDING.LIST,
      },
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
        id: 'shifts',
        title: 'Turnos',
        description: 'Turnos fixos, rotativos, flexíveis e sobreaviso',
        icon: Timer,
        href: '/hr/shifts',
        gradient: 'from-sky-500 to-indigo-600',
        hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
        permission: HR_PERMISSIONS.SHIFTS.LIST,
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
        id: 'punch-dashboard',
        title: 'Ponto — Gestor',
        description: 'Heatmap do time, exceções e exports',
        icon: Clock,
        href: '/hr/punch/dashboard',
        gradient: 'from-blue-500 to-indigo-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
        permission: 'hr.punch-approvals.access',
      },
      {
        id: 'crachas',
        title: 'Crachás',
        description: 'Emissão de crachás e rotação de QR code',
        icon: IdCard,
        href: '/hr/crachas',
        gradient: 'from-blue-500 to-indigo-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
        permission: HR_PERMISSIONS.CRACHAS.ACCESS,
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
    title: 'Remuneração e Benefícios',
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
        gradient: 'from-rose-500 to-rose-600',
        hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
        permission: HR_PERMISSIONS.DEDUCTIONS.LIST,
      },
      {
        id: 'benefits',
        title: 'Planos de Benefícios',
        description: 'Planos de benefícios, inscrições e alocações',
        icon: Heart,
        href: '/hr/benefits',
        gradient: 'from-pink-500 to-pink-600',
        hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-500/10',
        permission: HR_PERMISSIONS.BENEFITS.LIST,
      },
    ],
  },
  {
    title: 'Desenvolvimento e Desempenho',
    cards: [
      {
        id: 'reviews',
        title: 'Avaliações de Desempenho',
        description: 'Ciclos de avaliação, autoavaliação e feedback',
        icon: ClipboardCheck,
        href: '/hr/reviews',
        gradient: 'from-violet-500 to-violet-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
      },
      {
        id: 'trainings',
        title: 'Treinamentos',
        description: 'Programas de treinamento e desenvolvimento',
        icon: GraduationCap,
        href: '/hr/trainings',
        gradient: 'from-indigo-500 to-indigo-600',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
      },
      {
        id: 'kudos',
        title: 'Reconhecimento',
        description: 'Reconheça e celebre conquistas dos colegas',
        icon: Award,
        href: '/hr/kudos',
        gradient: 'from-amber-500 to-amber-600',
        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
      },
      {
        id: 'okrs',
        title: 'OKRs',
        description: 'Objetivos e Resultados-Chave da organização',
        icon: Target,
        href: '/hr/okrs',
        gradient: 'from-emerald-500 to-emerald-600',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
      },
      {
        id: 'surveys',
        title: 'Pesquisas',
        description: 'Pesquisas de clima, engajamento e satisfação',
        icon: MessageSquareText,
        href: '/hr/surveys',
        gradient: 'from-cyan-500 to-cyan-600',
        hoverBg: 'hover:bg-cyan-50 dark:hover:bg-cyan-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
      },
      {
        id: 'one-on-ones',
        title: 'Reuniões 1:1',
        description: 'Pautas, anotações e ações compartilhadas com seu time',
        icon: Users,
        href: '/hr/one-on-ones',
        gradient: 'from-violet-500 to-sky-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        permission: HR_PERMISSIONS.ONE_ON_ONES.LIST,
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
      {
        id: 'ppe',
        title: 'EPI',
        description: 'Equipamentos de Proteção Individual',
        icon: HardHat,
        href: '/hr/ppe',
        gradient: 'from-sky-500 to-sky-600',
        hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
        permission: HR_PERMISSIONS.PPE.LIST,
      },
    ],
  },
  {
    title: 'Obrigações e Configurações',
    cards: [
      {
        id: 'reports',
        title: 'Relatórios',
        description:
          'Exportações CSV e relatórios legais (RAIS, DIRF, SEFIP, CAGED)',
        icon: FileBarChart,
        href: '/hr/reports',
        gradient: 'from-teal-500 to-teal-600',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
        permission: HR_PERMISSIONS.EMPLOYEES.LIST,
      },
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
      {
        id: 'compliance',
        title: 'Compliance — Portaria 671',
        description:
          'AFD, AFDT, recibos de ponto, folhas espelho e eSocial S-1200',
        icon: ShieldCheck,
        href: '/hr/compliance',
        gradient: 'from-blue-500 to-indigo-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
        permission: HR_PERMISSIONS.COMPLIANCE.ACCESS,
      },
      {
        id: 'delegations',
        title: 'Delegações de Aprovação',
        description: 'Delegue aprovações temporariamente a outros gestores',
        icon: ArrowRightLeft,
        href: '/hr/delegations',
        gradient: 'from-indigo-500 to-indigo-600',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
        permission: HR_PERMISSIONS.DELEGATIONS.LIST,
      },
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
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [countsLoading, setCountsLoading] = useState(true);
  const [hasEmployee, setHasEmployee] = useState<boolean | null>(null);

  const tenantName = currentTenant?.name || 'Sua Empresa';

  // Check if current user has an employee record linked
  // 404 is expected when user has no linked employee — handled silently
  useEffect(() => {
    if (!user?.id) return;
    employeesService
      .getEmployeeByUserId(user.id)
      .then(() => setHasEmployee(true))
      .catch((err: unknown) => {
        // 404 = no employee linked (expected), other errors = real failure
        setHasEmployee(false);
        void err; // suppress — already handled
      });
  }, [user?.id]);

  // Hide "Meu Perfil" card when user has no linked employee
  const dynamicSections = useMemo(
    () =>
      sections.map(section => ({
        ...section,
        cards: section.cards.map(card =>
          card.id === 'my-profile'
            ? { ...card, hidden: hasEmployee === false }
            : card
        ),
      })),
    [hasEmployee]
  );

  useEffect(() => {
    async function fetchCounts() {
      // Catch each call individually so the browser doesn't log
      // "Failed to load resource: 404" for endpoints that may not exist yet.
      const silenced = <T,>(p: Promise<T>) => p.catch(() => null);

      const [employees, departments, positions, teams] =
        await Promise.allSettled([
          silenced(employeesService.listEmployees({ page: 1, perPage: 1 })),
          silenced(departmentsService.listDepartments({ page: 1, perPage: 1 })),
          silenced(positionsService.listPositions({ page: 1, perPage: 1 })),
          silenced(teamsService.listTeams({ page: 1, limit: 1 })),
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
        teams: extractCount(teams, 'data'),
      });
      setCountsLoading(false);
    }
    fetchCounts();
  }, []);

  return (
    <div className="space-y-8" data-testid="hr-hub-page">
      <PageActionBar
        breadcrumbItems={[{ label: 'RH', href: '/hr' }]}
        actionButtons={[
          {
            id: 'time-control',
            label: 'Bater Ponto',
            icon: Timer,
            href: '/hr/time-control',
            variant: 'default',
            permission: HR_PERMISSIONS.TIME_ENTRIES.LIST,
          },
        ]}
        hasPermission={hasPermission}
      />

      <PageHeroBanner
        title="Recursos Humanos"
        description="Gerencie funcionários, departamentos, cargos e a estrutura organizacional da sua empresa."
        icon={UserRoundCog}
        iconGradient="from-blue-500 to-purple-600"
        buttons={heroBannerButtons
          .filter(btn => btn.id !== 'my-profile' || hasEmployee !== false)
          .map(btn => ({
            id: btn.id,
            label: btn.label,
            icon: btn.icon,
            href: btn.href,
            gradient: btn.gradient,
            permission: btn.permission,
          }))}
        hasPermission={hasPermission}
      />

      {(hasPermission(HR_PERMISSIONS.VACATIONS.LIST) ||
        hasPermission(HR_PERMISSIONS.EMPLOYEES.LIST)) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {hasPermission(HR_PERMISSIONS.VACATIONS.LIST) && <WhosOutWidget />}
          {hasPermission(HR_PERMISSIONS.EMPLOYEES.LIST) && (
            <BirthdayAnniversaryWidget />
          )}
        </div>
      )}

      <PageDashboardSections
        sections={dynamicSections}
        counts={counts}
        countsLoading={countsLoading}
        hasPermission={hasPermission}
      />
    </div>
  );
}
