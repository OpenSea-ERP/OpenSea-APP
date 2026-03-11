/**
 * Admin Module Landing Page
 * Página inicial do módulo de administração com cards de navegação e contagens reais
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageDashboardSections } from '@/components/layout/page-dashboard-sections';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import {
  ADMIN_PERMISSIONS,
  AUDIT_PERMISSIONS,
  CORE_PERMISSIONS,
  RBAC_PERMISSIONS,
} from '@/config/rbac/permission-codes';
import { teamsService } from '@/services/core/teams.service';
import { usePermissions } from '@/hooks/use-permissions';
import { usersService } from '@/services/auth/users.service';
import { listPermissionGroups } from '@/services/rbac/rbac.service';
import { companiesService } from '@/services/admin/companies.service';

import { Building2, History, Settings, Shield } from 'lucide-react';
import { PiUserDuotone, PiUsersThreeDuotone } from 'react-icons/pi';
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
    title: 'Gerenciamento',
    cards: [
      {
        id: 'users',
        title: 'Usuários',
        description: 'Gerencie contas, perfis e acessos dos usuários',
        icon: PiUserDuotone,
        href: '/admin/users',
        gradient: 'from-blue-500 to-blue-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
        permission: CORE_PERMISSIONS.USERS.LIST,
        countKey: 'users',
      },
      {
        id: 'teams',
        title: 'Equipes',
        description: 'Gerencie equipes de trabalho e seus membros',
        icon: PiUsersThreeDuotone,
        href: '/admin/teams',
        gradient: 'from-cyan-500 to-blue-600',
        hoverBg: 'hover:bg-cyan-50 dark:hover:bg-cyan-500/10',
        permission: CORE_PERMISSIONS.TEAMS.LIST,
        countKey: 'teams',
      },
      {
        id: 'companies',
        title: 'Empresas',
        description: 'Cadastro de empresas, filiais e configurações fiscais',
        icon: Building2,
        href: '/admin/companies',
        gradient: 'from-emerald-500 to-teal-600',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        permission: ADMIN_PERMISSIONS.COMPANIES.READ,
        countKey: 'companies',
      },
      {
        id: 'permission-groups',
        title: 'Grupos de Permissões',
        description: 'Configure grupos e controle de acesso granular',
        icon: Shield,
        href: '/admin/permission-groups',
        gradient: 'from-purple-500 to-purple-600',
        hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-500/10',
        permission: RBAC_PERMISSIONS.GROUPS.LIST,
        countKey: 'groups',
      },
    ],
  },
];

const heroBannerButtons: (CardItem & { label: string })[] = [
  {
    id: 'audit-logs',
    title: 'Logs de Auditoria',
    label: 'Logs de Auditoria',
    description: 'Histórico de ações e alterações no sistema',
    icon: History,
    href: '/admin/overview/audit-logs',
    gradient: 'from-amber-500 to-amber-600',
    hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
    permission: AUDIT_PERMISSIONS.LOGS.VIEW,
  },
];

export default function AdminLandingPage() {
  const { hasPermission } = usePermissions();
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      const [users, groups, teams, companies] = await Promise.allSettled([
        usersService.listUsers(),
        listPermissionGroups(),
        teamsService.listTeams({ limit: 1 }),
        companiesService.listCompanies({ perPage: 1 }),
      ]);

      setCounts({
        users: users.status === 'fulfilled' ? users.value.users.length : null,
        groups: groups.status === 'fulfilled' ? groups.value.length : null,
        teams: teams.status === 'fulfilled' ? teams.value.meta.total : null,
        companies: companies.status === 'fulfilled' ? companies.value.meta.total : null,
      });
      setCountsLoading(false);
    }
    fetchCounts();
  }, []);

  return (
    <div className="space-y-8">
      <PageActionBar
        breadcrumbItems={[{ label: 'Administração', href: '/admin' }]}
        hasPermission={hasPermission}
      />

      <PageHeroBanner
        title="Administração"
        description="Gerencie usuários, permissões e monitore a atividade do sistema."
        icon={Settings}
        iconGradient="from-purple-500 to-purple-600"
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
