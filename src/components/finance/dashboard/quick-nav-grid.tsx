'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-permissions';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  Building2,
  Calculator,
  FileSpreadsheet,
  FileText,
  FolderTree,
  Grid3X3,
  Landmark,
  LayoutDashboard,
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

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  iconColor: string;
  permission?: string;
}

const navItems: NavItem[] = [
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
  {
    id: 'overdue',
    label: 'Vencidos',
    icon: AlertTriangle,
    href: '/finance/overview/overdue',
    iconColor: 'text-rose-500',
  },
  {
    id: 'bank-accounts',
    label: 'Contas Bancárias',
    icon: Building2,
    href: '/finance/bank-accounts',
    iconColor: 'text-sky-500',
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
    id: 'reconciliation',
    label: 'Conciliação Bancária',
    icon: RefreshCw,
    href: '/finance/reconciliation',
    iconColor: 'text-teal-500',
  },
  {
    id: 'bank-connections',
    label: 'Conexões Bancárias',
    icon: Wifi,
    href: '/finance/bank-connections',
    iconColor: 'text-sky-500',
  },
  {
    id: 'payment-links',
    label: 'Links de Pagamento',
    icon: Link2,
    href: '/finance/payment-links',
    iconColor: 'text-violet-500',
  },
  {
    id: 'fiscal',
    label: 'Documentos Fiscais',
    icon: Receipt,
    href: '/finance/fiscal',
    iconColor: 'text-teal-500',
  },
  {
    id: 'exchange-rates',
    label: 'Câmbio',
    icon: ArrowLeftRight,
    href: '/finance/exchange-rates',
    iconColor: 'text-teal-500',
  },
  {
    id: 'contracts',
    label: 'Contratos',
    icon: FileText,
    href: '/finance/contracts',
    iconColor: 'text-sky-500',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/finance/dashboard',
    iconColor: 'text-violet-500',
  },
  {
    id: 'analytics',
    label: 'Painel Financeiro',
    icon: TrendingUp,
    href: '/finance/reports/analytics',
    iconColor: 'text-emerald-500',
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
  {
    id: 'reports',
    label: 'Relatórios',
    icon: FileText,
    href: '/finance/reports',
    iconColor: 'text-violet-500',
  },
  {
    id: 'export',
    label: 'Exportação',
    icon: FileSpreadsheet,
    href: '/finance/reports/export',
    iconColor: 'text-teal-500',
  },
  {
    id: 'budget',
    label: 'Orçamento',
    icon: PieChart,
    href: '/finance/reports/budget',
    iconColor: 'text-violet-500',
  },
  {
    id: 'accountant',
    label: 'Portal do Contador',
    icon: Calculator,
    href: '/finance/accountant',
    iconColor: 'text-teal-500',
  },
  {
    id: 'escalations',
    label: 'Régua de Cobrança',
    icon: AlertTriangle,
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
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    href: '/finance/settings',
    iconColor: 'text-slate-500',
  },
];

export function QuickNavGrid() {
  const { hasPermission } = usePermissions();

  const visibleItems = navItems.filter(
    item => !item.permission || hasPermission(item.permission)
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <CardTitle className="text-base">Navegação Rápida</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-2">
          {visibleItems.map(item => (
            <Link key={item.id} href={item.href}>
              <div className="flex items-center gap-2.5 p-3 rounded-lg border hover:bg-muted/50 hover:border-violet-200 dark:hover:border-violet-800/50 transition-colors cursor-pointer">
                <item.icon className={`h-4 w-4 shrink-0 ${item.iconColor}`} />
                <span className="text-sm font-medium truncate">
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
