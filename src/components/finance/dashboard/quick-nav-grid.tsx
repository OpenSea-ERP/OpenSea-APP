'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import {
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  Banknote,
  Building2,
  Calculator,
  FileSpreadsheet,
  FileText,
  FolderTree,
  Grid3X3,
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
  Wifi,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// TYPES
// ============================================================================

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  iconColor: string;
  permission?: string;
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

// ============================================================================
// SECTIONS — Agrupamento por papel/workflow do profissional financeiro
// ============================================================================

const navSections: NavSection[] = [
  {
    id: 'daily-ops',
    title: 'Operações do Dia',
    items: [
      {
        id: 'payable',
        label: 'Contas a Pagar',
        icon: ArrowDownCircle,
        href: '/finance/payable',
        iconColor: 'text-rose-500',
      },
      {
        id: 'receivable',
        label: 'Contas a Receber',
        icon: ArrowUpCircle,
        href: '/finance/receivable',
        iconColor: 'text-emerald-500',
      },
      {
        id: 'recurring',
        label: 'Recorrências',
        icon: RefreshCw,
        href: '/finance/recurring',
        iconColor: 'text-violet-500',
      },
    ],
  },
  {
    id: 'banking',
    title: 'Banco',
    items: [
      {
        id: 'bank-accounts',
        label: 'Contas Bancárias',
        icon: Building2,
        href: '/finance/bank-accounts',
        iconColor: 'text-sky-500',
      },
      {
        id: 'reconciliation',
        label: 'Conciliação',
        icon: RefreshCw,
        href: '/finance/reconciliation',
        iconColor: 'text-teal-500',
      },
      {
        id: 'bank-connections',
        label: 'Open Finance',
        icon: Wifi,
        href: '/finance/bank-connections',
        iconColor: 'text-sky-500',
      },
    ],
  },
  {
    id: 'planning',
    title: 'Planejamento',
    items: [
      {
        id: 'budget',
        label: 'Orçamento',
        icon: PieChart,
        href: '/finance/reports/budget',
        iconColor: 'text-violet-500',
      },
      {
        id: 'cashflow',
        label: 'Fluxo de Caixa',
        icon: TrendingUp,
        href: '/finance/overview/cashflow',
        iconColor: 'text-sky-500',
      },
      {
        id: 'forecast',
        label: 'Previsão',
        icon: TrendingUp,
        href: '/finance/reports/forecast',
        iconColor: 'text-violet-500',
      },
    ],
  },
  {
    id: 'reports',
    title: 'Relatórios',
    items: [
      {
        id: 'reports-hub',
        label: 'DRE e Relatórios',
        icon: FileText,
        href: '/finance/reports',
        iconColor: 'text-violet-500',
      },
      {
        id: 'balance-sheet',
        label: 'Balanço Patrimonial',
        icon: FileSpreadsheet,
        href: '/finance/reports/balance-sheet',
        iconColor: 'text-emerald-500',
      },
      {
        id: 'analytics',
        label: 'Painel Analítico',
        icon: TrendingUp,
        href: '/finance/reports/analytics',
        iconColor: 'text-emerald-500',
      },
    ],
  },
  {
    id: 'obligations',
    title: 'Obrigações',
    items: [
      {
        id: 'loans',
        label: 'Empréstimos',
        icon: Landmark,
        href: '/finance/loans',
        iconColor: 'text-sky-500',
      },
      {
        id: 'consortia',
        label: 'Consórcios',
        icon: Users,
        href: '/finance/consortia',
        iconColor: 'text-violet-500',
      },
      {
        id: 'contracts',
        label: 'Contratos',
        icon: FileText,
        href: '/finance/contracts',
        iconColor: 'text-sky-500',
      },
    ],
  },
  {
    id: 'fiscal',
    title: 'Fiscal',
    items: [
      {
        id: 'fiscal-docs',
        label: 'Documentos Fiscais',
        icon: Receipt,
        href: '/finance/fiscal',
        iconColor: 'text-teal-500',
      },
      {
        id: 'compliance',
        label: 'Compliance',
        icon: ShieldCheck,
        href: '/finance/compliance',
        iconColor: 'text-indigo-500',
      },
      {
        id: 'payment-links',
        label: 'Links de Pagamento',
        icon: Link2,
        href: '/finance/payment-links',
        iconColor: 'text-violet-500',
      },
    ],
  },
  {
    id: 'accounting',
    title: 'Estrutura Contábil',
    items: [
      {
        id: 'chart-of-accounts',
        label: 'Plano de Contas',
        icon: Calculator,
        href: '/finance/chart-of-accounts',
        iconColor: 'text-violet-500',
      },
      {
        id: 'categories',
        label: 'Categorias',
        icon: FolderTree,
        href: '/finance/categories',
        iconColor: 'text-violet-500',
      },
      {
        id: 'cost-centers',
        label: 'Centros de Custo',
        icon: Target,
        href: '/finance/cost-centers',
        iconColor: 'text-teal-500',
      },
    ],
  },
  {
    id: 'config',
    title: 'Configurações',
    items: [
      {
        id: 'escalations',
        label: 'Régua de Cobrança',
        icon: Banknote,
        href: '/finance/escalations',
        iconColor: 'text-rose-500',
      },
      {
        id: 'approval-rules',
        label: 'Regras de Aprovação',
        icon: ShieldCheck,
        href: '/finance/approval-rules',
        iconColor: 'text-emerald-500',
      },
      {
        id: 'exchange-rates',
        label: 'Câmbio',
        icon: ArrowLeftRight,
        href: '/finance/exchange-rates',
        iconColor: 'text-teal-500',
      },
      {
        id: 'accountant',
        label: 'Portal do Contador',
        icon: Calculator,
        href: '/finance/accountant',
        iconColor: 'text-teal-500',
      },
      {
        id: 'settings',
        label: 'Configurações',
        icon: Settings,
        href: '/finance/settings',
        iconColor: 'text-slate-500',
      },
    ],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function QuickNavGrid() {
  const { hasPermission } = usePermissions();

  const visibleSections = navSections
    .map(section => ({
      ...section,
      items: section.items.filter(
        item => !item.permission || hasPermission(item.permission)
      ),
    }))
    .filter(section => section.items.length > 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <CardTitle className="text-base">Navegação Rápida</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-4">
        {visibleSections.map(section => (
          <div key={section.id}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
              {section.title}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {section.items.map(item => (
                <Link key={item.id} href={item.href}>
                  <div className="flex flex-col items-center gap-1 p-2 rounded-lg border border-transparent hover:bg-muted/50 hover:border-border/50 transition-colors cursor-pointer text-center">
                    <item.icon
                      className={`h-4 w-4 shrink-0 ${item.iconColor}`}
                    />
                    <span className="text-[11px] font-medium leading-tight text-muted-foreground group-hover:text-foreground">
                      {item.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
