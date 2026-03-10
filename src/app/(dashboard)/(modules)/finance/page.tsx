/**
 * Finance Module Landing Page
 * Página inicial do módulo financeiro com cards de navegação e contagens reais
 */

'use client';

import { DailySummaryBanner } from '@/components/finance/notifications/daily-summary-banner';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageDashboardSections } from '@/components/layout/page-dashboard-sections';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { useTenant } from '@/contexts/tenant-context';
import { usePermissions } from '@/hooks/use-permissions';
import {
  financeEntriesService,
  bankAccountsService,
  costCentersService,
  loansService,
  consortiaService,
  contractsService,
} from '@/services/finance';
import { companiesService } from '@/services/hr';

import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  DollarSign,
  FileSpreadsheet,
  FileText,
  FolderTree,
  Landmark,
  LayoutDashboard,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
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
    title: 'Lançamentos',
    cards: [
      {
        id: 'payable',
        title: 'Contas a Pagar',
        description: 'Despesas e pagamentos pendentes',
        icon: ArrowDownCircle,
        href: '/finance/payable',
        gradient: 'from-red-500 to-red-600',
        hoverBg: 'hover:bg-red-50 dark:hover:bg-red-500/10',
        countKey: 'payable',
      },
      {
        id: 'receivable',
        title: 'Contas a Receber',
        description: 'Receitas e recebimentos pendentes',
        icon: ArrowUpCircle,
        href: '/finance/receivable',
        gradient: 'from-green-500 to-green-600',
        hoverBg: 'hover:bg-green-50 dark:hover:bg-green-500/10',
        countKey: 'receivable',
      },
      {
        id: 'overdue',
        title: 'Atrasados',
        description: 'Contas vencidas a pagar e receber',
        icon: AlertTriangle,
        href: '/finance/overdue',
        gradient: 'from-amber-500 to-amber-600',
        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
        countKey: 'overdue',
      },
      {
        id: 'recurring',
        title: 'Recorrencias',
        description: 'Lancamentos recorrentes automaticos',
        icon: RefreshCw,
        href: '/finance/recurring',
        gradient: 'from-violet-500 to-violet-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
      },
    ],
  },
  {
    title: 'Cadastros',
    cards: [
      {
        id: 'bank-accounts',
        title: 'Contas Bancárias',
        description: 'Gestão de contas e saldos',
        icon: Building2,
        href: '/finance/bank-accounts',
        gradient: 'from-purple-500 to-purple-600',
        hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-500/10',
        countKey: 'bankAccounts',
      },
      {
        id: 'cost-centers',
        title: 'Centros de Custo',
        description: 'Estrutura de centros de custo',
        icon: Target,
        href: '/finance/cost-centers',
        gradient: 'from-emerald-500 to-emerald-600',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        countKey: 'costCenters',
      },
      {
        id: 'categories',
        title: 'Categorias',
        description: 'Categorias de receitas e despesas',
        icon: FolderTree,
        href: '/finance/categories',
        gradient: 'from-cyan-500 to-cyan-600',
        hoverBg: 'hover:bg-cyan-50 dark:hover:bg-cyan-500/10',
      },
      {
        id: 'companies',
        title: 'Empresas',
        description: 'Cadastro de empresas vinculadas',
        icon: Building2,
        href: '/finance/companies',
        gradient: 'from-indigo-500 to-indigo-600',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
        countKey: 'companies',
      },
    ],
  },
  {
    title: 'Crédito',
    cards: [
      {
        id: 'loans',
        title: 'Empréstimos',
        description: 'Controle de empréstimos e parcelas',
        icon: Landmark,
        href: '/finance/loans',
        gradient: 'from-orange-500 to-orange-600',
        hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-500/10',
        countKey: 'loans',
      },
      {
        id: 'consortia',
        title: 'Consórcios',
        description: 'Acompanhamento de consórcios',
        icon: Users,
        href: '/finance/consortia',
        gradient: 'from-pink-500 to-pink-600',
        hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-500/10',
        countKey: 'consortia',
      },
      {
        id: 'contracts',
        title: 'Contratos',
        description: 'Gestão de contratos com fornecedores',
        icon: FileText,
        href: '/finance/contracts',
        gradient: 'from-teal-500 to-teal-600',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
        countKey: 'contracts',
      },
    ],
  },
  {
    title: 'Relatórios',
    cards: [
      {
        id: 'reports',
        title: 'Relatórios',
        description: 'DRE, balanço patrimonial e exportação',
        icon: FileText,
        href: '/finance/reports',
        gradient: 'from-violet-500 to-violet-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
      },
      {
        id: 'export',
        title: 'Exportação Contábil',
        description: 'Exportar dados para contabilidade',
        icon: FileSpreadsheet,
        href: '/finance/export',
        gradient: 'from-indigo-500 to-indigo-600',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
      },
    ],
  },
];

const heroBannerButtons: (CardItem & { label: string })[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Financeiro',
    label: 'Dashboard',
    description: 'Indicadores e resumo financeiro',
    icon: LayoutDashboard,
    href: '/finance/dashboard',
    gradient: 'from-blue-500 to-blue-600',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
  },
  {
    id: 'analytics',
    title: 'Painel Financeiro',
    label: 'Painel Financeiro',
    description: 'Graficos, KPIs e analise financeira',
    icon: TrendingUp,
    href: '/finance/analytics',
    gradient: 'from-emerald-500 to-emerald-600',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
  },
  {
    id: 'cashflow',
    title: 'Fluxo de Caixa',
    label: 'Fluxo de Caixa',
    description: 'Entradas, saídas e projeções',
    icon: TrendingUp,
    href: '/finance/cashflow',
    gradient: 'from-slate-500 to-slate-600',
    hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-500/10',
  },
];

export default function FinanceLandingPage() {
  const { currentTenant } = useTenant();
  const { hasPermission } = usePermissions();
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  const tenantName = currentTenant?.name || 'Sua Empresa';

  useEffect(() => {
    async function fetchCounts() {
      const [
        payable,
        receivable,
        overdue,
        bankAccounts,
        costCenters,
        loans,
        consortia,
        companies,
        contracts,
      ] = await Promise.allSettled([
        financeEntriesService.list({
          type: 'PAYABLE',
          status: 'PENDING',
          page: 1,
          perPage: 1,
        }),
        financeEntriesService.list({
          type: 'RECEIVABLE',
          status: 'PENDING',
          page: 1,
          perPage: 1,
        }),
        financeEntriesService.list({ isOverdue: true, page: 1, perPage: 1 }),
        bankAccountsService.list({ page: 1, perPage: 1 }),
        costCentersService.list({ page: 1, perPage: 1 }),
        loansService.list({ page: 1, perPage: 1 }),
        consortiaService.list({ page: 1, perPage: 1 }),
        companiesService.listCompanies({ perPage: 1 }),
        contractsService.list({ page: 1, perPage: 1 }),
      ]);

      setCounts({
        payable:
          payable.status === 'fulfilled'
            ? (payable.value.meta?.total ??
              payable.value.entries?.length ??
              null)
            : null,
        receivable:
          receivable.status === 'fulfilled'
            ? (receivable.value.meta?.total ??
              receivable.value.entries?.length ??
              null)
            : null,
        overdue:
          overdue.status === 'fulfilled'
            ? (overdue.value.meta?.total ??
              overdue.value.entries?.length ??
              null)
            : null,
        bankAccounts:
          bankAccounts.status === 'fulfilled'
            ? (bankAccounts.value.meta?.total ??
              bankAccounts.value.bankAccounts?.length ??
              null)
            : null,
        costCenters:
          costCenters.status === 'fulfilled'
            ? (costCenters.value.meta?.total ??
              costCenters.value.costCenters?.length ??
              null)
            : null,
        loans:
          loans.status === 'fulfilled'
            ? (loans.value.meta?.total ?? loans.value.loans?.length ?? null)
            : null,
        consortia:
          consortia.status === 'fulfilled'
            ? (consortia.value.meta?.total ??
              consortia.value.consortia?.length ??
              null)
            : null,
        companies:
          companies.status === 'fulfilled'
            ? (companies.value.meta?.total ??
              companies.value.companies?.length ??
              null)
            : null,
        contracts:
          contracts.status === 'fulfilled'
            ? (contracts.value.meta?.total ??
              contracts.value.contracts?.length ??
              null)
            : null,
      });
      setCountsLoading(false);
    }
    fetchCounts();
  }, []);

  return (
    <div className="space-y-8">
      <PageActionBar
        breadcrumbItems={[{ label: 'Financeiro', href: '/finance' }]}
        hasPermission={hasPermission}
      />

      <DailySummaryBanner />

      <PageHeroBanner
        title="Financeiro"
        description="Gerencie contas a pagar, receber, fluxo de caixa, empréstimos e consórcios da sua empresa."
        icon={DollarSign}
        iconGradient="from-blue-500 to-emerald-600"
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
