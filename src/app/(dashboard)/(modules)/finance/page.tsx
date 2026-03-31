/**
 * Finance Module Landing Page
 * Página inicial do módulo financeiro com cards de navegação e contagens reais.
 * Segue o padrão: PageActionBar → PageHeroBanner → PageDashboardSections.
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageDashboardSections } from '@/components/layout/page-dashboard-sections';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import {
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  Banknote,
  BarChart3,
  Building2,
  Calculator,
  FileSpreadsheet,
  FileText,
  FolderTree,
  Landmark,
  Link2,
  PieChart,
  Receipt,
  RefreshCw,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Wifi,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  financeEntriesService,
  bankAccountsService,
  financeCategoriesService,
} from '@/services/finance';

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// SECTIONS — Agrupamento por papel/workflow do gestor financeiro
// ============================================================================

const sections: { title: string; cards: CardItem[] }[] = [
  {
    title: 'Operações do Dia',
    cards: [
      {
        id: 'payable',
        title: 'Contas a Pagar',
        description: 'Gerencie pagamentos a fornecedores e despesas',
        icon: ArrowDownCircle,
        href: '/finance/payable',
        gradient: 'from-rose-500 to-rose-600',
        hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
        countKey: 'payable',
      },
      {
        id: 'receivable',
        title: 'Contas a Receber',
        description: 'Gerencie recebimentos de clientes e receitas',
        icon: ArrowUpCircle,
        href: '/finance/receivable',
        gradient: 'from-emerald-500 to-emerald-600',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
        countKey: 'receivable',
      },
      {
        id: 'recurring',
        title: 'Recorrências',
        description: 'Lançamentos recorrentes automáticos',
        icon: RefreshCw,
        href: '/finance/recurring',
        gradient: 'from-violet-500 to-violet-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
    ],
  },
  {
    title: 'Banco',
    cards: [
      {
        id: 'bank-accounts',
        title: 'Contas Bancárias',
        description: 'Cadastro e saldos das contas bancárias',
        icon: Building2,
        href: '/finance/bank-accounts',
        gradient: 'from-sky-500 to-sky-600',
        hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
        permission: FINANCE_PERMISSIONS.BANK_ACCOUNTS.ACCESS,
        countKey: 'bankAccounts',
      },
      {
        id: 'reconciliation',
        title: 'Conciliação Bancária',
        description: 'Importe OFX e concilie transações',
        icon: RefreshCw,
        href: '/finance/reconciliation',
        gradient: 'from-teal-500 to-teal-600',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
      {
        id: 'bank-connections',
        title: 'Open Finance',
        description: 'Conexões bancárias via Open Finance',
        icon: Wifi,
        href: '/finance/bank-connections',
        gradient: 'from-sky-400 to-sky-500',
        hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
        permission: FINANCE_PERMISSIONS.BANK_ACCOUNTS.ADMIN,
      },
    ],
  },
  {
    title: 'Planejamento',
    cards: [
      {
        id: 'budget',
        title: 'Orçamento',
        description: 'Orçamento vs realizado por categoria',
        icon: PieChart,
        href: '/finance/reports/budget',
        gradient: 'from-violet-500 to-violet-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
      {
        id: 'cashflow',
        title: 'Fluxo de Caixa',
        description: 'Entradas, saídas e saldo acumulado',
        icon: TrendingUp,
        href: '/finance/overview/cashflow',
        gradient: 'from-sky-500 to-sky-600',
        hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
      {
        id: 'forecast',
        title: 'Previsão',
        description: 'Projeção preditiva de fluxo de caixa',
        icon: TrendingUp,
        href: '/finance/reports/forecast',
        gradient: 'from-violet-400 to-violet-500',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
    ],
  },
  {
    title: 'Relatórios',
    cards: [
      {
        id: 'reports',
        title: 'DRE e Relatórios',
        description: 'Demonstrativos, DRE e relatórios contábeis',
        icon: FileText,
        href: '/finance/reports',
        gradient: 'from-indigo-500 to-indigo-600',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
      {
        id: 'balance-sheet',
        title: 'Balanço Patrimonial',
        description: 'Ativo, passivo e patrimônio líquido',
        icon: FileSpreadsheet,
        href: '/finance/reports/balance-sheet',
        gradient: 'from-emerald-500 to-emerald-600',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
      {
        id: 'analytics',
        title: 'Painel Analítico',
        description: 'KPIs, gráficos e indicadores financeiros',
        icon: BarChart3,
        href: '/finance/reports/analytics',
        gradient: 'from-emerald-400 to-emerald-500',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
    ],
  },
  {
    title: 'Obrigações',
    cards: [
      {
        id: 'loans',
        title: 'Empréstimos',
        description: 'Empréstimos, financiamentos e linhas de crédito',
        icon: Landmark,
        href: '/finance/loans',
        gradient: 'from-sky-500 to-sky-600',
        hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
      {
        id: 'consortia',
        title: 'Consórcios',
        description: 'Cotas de consórcio e contemplações',
        icon: Users,
        href: '/finance/consortia',
        gradient: 'from-violet-500 to-violet-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
      {
        id: 'contracts',
        title: 'Contratos',
        description: 'Contratos com fornecedores e pagamentos',
        icon: FileText,
        href: '/finance/contracts',
        gradient: 'from-sky-400 to-sky-500',
        hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
    ],
  },
  {
    title: 'Fiscal',
    cards: [
      {
        id: 'fiscal',
        title: 'Documentos Fiscais',
        description: 'NF-e, NFC-e e emissão de notas fiscais',
        icon: Receipt,
        href: '/finance/fiscal',
        gradient: 'from-teal-500 to-teal-600',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
      {
        id: 'compliance',
        title: 'Compliance Fiscal',
        description: 'Simples Nacional, obrigações e calendário fiscal',
        icon: ShieldCheck,
        href: '/finance/compliance',
        gradient: 'from-indigo-500 to-indigo-600',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
      {
        id: 'payment-links',
        title: 'Links de Pagamento',
        description: 'Crie links de pagamento para clientes',
        icon: Link2,
        href: '/finance/payment-links',
        gradient: 'from-violet-500 to-violet-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
    ],
  },
  {
    title: 'Estrutura Contábil',
    cards: [
      {
        id: 'chart-of-accounts',
        title: 'Plano de Contas',
        description: 'Estrutura contábil hierárquica',
        icon: Calculator,
        href: '/finance/chart-of-accounts',
        gradient: 'from-violet-500 to-violet-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
      {
        id: 'categories',
        title: 'Categorias',
        description: 'Categorias de receita e despesa (DRE)',
        icon: FolderTree,
        href: '/finance/categories',
        gradient: 'from-violet-400 to-violet-500',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
        countKey: 'categories',
      },
      {
        id: 'cost-centers',
        title: 'Centros de Custo',
        description: 'Centros de custo e rateio de despesas',
        icon: Target,
        href: '/finance/cost-centers',
        gradient: 'from-teal-500 to-teal-600',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
      },
    ],
  },
  {
    title: 'Configurações',
    cards: [
      {
        id: 'escalations',
        title: 'Régua de Cobrança',
        description: 'Configure réguas automáticas de cobrança',
        icon: Banknote,
        href: '/finance/escalations',
        gradient: 'from-rose-500 to-rose-600',
        hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ADMIN,
      },
      {
        id: 'approval-rules',
        title: 'Regras de Aprovação',
        description: 'Aprovação por alçada de valores',
        icon: ShieldCheck,
        href: '/finance/approval-rules',
        gradient: 'from-emerald-500 to-emerald-600',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ADMIN,
      },
      {
        id: 'exchange-rates',
        title: 'Câmbio',
        description: 'Consulta de cotações via Banco Central',
        icon: ArrowLeftRight,
        href: '/finance/exchange-rates',
        gradient: 'from-teal-400 to-teal-500',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
      },
      {
        id: 'accountant',
        title: 'Portal do Contador',
        description: 'Compartilhe dados com seu contador',
        icon: Calculator,
        href: '/finance/accountant',
        gradient: 'from-teal-500 to-teal-600',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ADMIN,
      },
      {
        id: 'settings',
        title: 'Configurações Gerais',
        description: 'E-mail, impostos, notificações e exportação',
        icon: Settings,
        href: '/finance/settings',
        gradient: 'from-slate-500 to-slate-600',
        hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-500/10',
        permission: FINANCE_PERMISSIONS.ENTRIES.ADMIN,
      },
    ],
  },
];

// ============================================================================
// HERO BANNER BUTTONS
// ============================================================================

const heroBannerButtons: { id: string; label: string; icon: React.ElementType; href: string; gradient: string; permission?: string }[] = [
  {
    id: 'analytics',
    label: 'Painel Analítico',
    icon: BarChart3,
    href: '/finance/reports/analytics',
    gradient: 'from-emerald-500 to-emerald-600',
    permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
  },
  {
    id: 'quick-payable',
    label: 'Nova Conta a Pagar',
    icon: ArrowDownCircle,
    href: '/finance/payable/new',
    gradient: 'from-rose-500 to-rose-600',
    permission: FINANCE_PERMISSIONS.ENTRIES.REGISTER,
  },
  {
    id: 'quick-receivable',
    label: 'Nova Conta a Receber',
    icon: ArrowUpCircle,
    href: '/finance/receivable/new',
    gradient: 'from-emerald-500 to-emerald-600',
    permission: FINANCE_PERMISSIONS.ENTRIES.REGISTER,
  },
];

// ============================================================================
// PAGE
// ============================================================================

export default function FinanceLandingPage() {
  const { hasPermission } = usePermissions();
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      const [payable, receivable, bankAccounts, categories] =
        await Promise.allSettled([
          financeEntriesService.list({ type: 'PAYABLE', status: 'PENDING', perPage: 1 }),
          financeEntriesService.list({ type: 'RECEIVABLE', status: 'PENDING', perPage: 1 }),
          bankAccountsService.list({ status: 'ACTIVE', perPage: 1 }),
          financeCategoriesService.list({ perPage: 1 }),
        ]);

      const extractCount = (
        result: PromiseSettledResult<unknown>,
      ): number | null => {
        if (result.status !== 'fulfilled') return null;
        const v = result.value as Record<string, unknown>;
        const meta = v?.meta as Record<string, unknown> | undefined;
        return (meta?.total as number) ?? null;
      };

      setCounts({
        payable: extractCount(payable),
        receivable: extractCount(receivable),
        bankAccounts: extractCount(bankAccounts),
        categories: extractCount(categories),
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

      <PageHeroBanner
        title="Financeiro"
        description="Gerencie contas a pagar e receber, fluxo de caixa, orçamento, relatórios contábeis e obrigações fiscais."
        icon={Wallet}
        iconGradient="from-violet-500 to-indigo-600"
        buttons={heroBannerButtons}
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
