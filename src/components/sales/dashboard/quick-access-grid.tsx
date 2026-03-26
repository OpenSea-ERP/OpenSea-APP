'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { SalesDashboardData } from '@/hooks/sales/use-sales-dashboard';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  ClipboardList,
  FileText,
  GitBranch,
  Globe,
  Handshake,
  Mail,
  MessageSquare,
  Monitor,
  Percent,
  Receipt,
  ShoppingCart,
  Tag,
  Users,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Card definitions
// ---------------------------------------------------------------------------

interface QuickCard {
  id: string;
  title: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
  hoverBg: string;
  permission?: string;
  getSubtitle: (data: SalesDashboardData | undefined) => string | null;
}

const QUICK_CARDS: QuickCard[] = [
  {
    id: 'orders',
    title: 'Pedidos',
    icon: ShoppingCart,
    href: '/sales/orders',
    gradient: 'from-blue-500 to-blue-600',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
    permission: SALES_PERMISSIONS.ORDERS.ACCESS,
    getSubtitle: d => (d ? `${d.pendingOrders} pendentes` : null),
  },
  {
    id: 'customers',
    title: 'Clientes',
    icon: Users,
    href: '/sales/customers',
    gradient: 'from-emerald-500 to-emerald-600',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
    permission: SALES_PERMISSIONS.CUSTOMERS.ACCESS,
    getSubtitle: d =>
      d ? `${d.totalCustomers.toLocaleString('pt-BR')} cadastrados` : null,
  },
  {
    id: 'marketplaces',
    title: 'Marketplace',
    icon: Globe,
    href: '/sales/marketplaces',
    gradient: 'from-sky-500 to-sky-600',
    hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
    permission: SALES_PERMISSIONS.MARKETPLACES.ACCESS,
    getSubtitle: () => 'Integrações externas',
  },
  {
    id: 'pos',
    title: 'PDV',
    icon: Monitor,
    href: '/sales/pos',
    gradient: 'from-indigo-500 to-indigo-600',
    hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
    permission: SALES_PERMISSIONS.POS.ACCESS,
    getSubtitle: () => 'Ponto de venda',
  },
  {
    id: 'contacts',
    title: 'Contatos',
    icon: Users,
    href: '/sales/contacts',
    gradient: 'from-teal-500 to-teal-600',
    hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
    permission: SALES_PERMISSIONS.CONTACTS.ACCESS,
    getSubtitle: () => 'Gestão de contatos',
  },
  {
    id: 'pipelines',
    title: 'Pipeline CRM',
    icon: GitBranch,
    href: '/sales/pipelines',
    gradient: 'from-violet-500 to-violet-600',
    hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
    permission: SALES_PERMISSIONS.PIPELINES.ACCESS,
    getSubtitle: d => (d ? `${d.openDeals} negócios abertos` : null),
  },
  {
    id: 'deals',
    title: 'Negócios',
    icon: Handshake,
    href: '/sales/deals',
    gradient: 'from-emerald-500 to-emerald-600',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
    permission: SALES_PERMISSIONS.DEALS.ACCESS,
    getSubtitle: d => (d ? `${d.openDeals} abertos` : null),
  },
  {
    id: 'catalogs',
    title: 'Catálogos',
    icon: BookOpen,
    href: '/sales/catalogs',
    gradient: 'from-purple-500 to-purple-600',
    hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-500/10',
    permission: SALES_PERMISSIONS.CATALOGS.ACCESS,
    getSubtitle: () => 'Catálogos de produtos',
  },
  {
    id: 'campaigns',
    title: 'Promoções',
    icon: Tag,
    href: '/sales/campaigns',
    gradient: 'from-pink-500 to-pink-600',
    hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-500/10',
    permission: SALES_PERMISSIONS.CAMPAIGNS.ACCESS,
    getSubtitle: () => 'Campanhas e promoções',
  },
  {
    id: 'bids',
    title: 'Licitações',
    icon: FileText,
    href: '/sales/bids',
    gradient: 'from-slate-500 to-slate-600',
    hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-500/10',
    permission: SALES_PERMISSIONS.BIDS.ACCESS,
    getSubtitle: () => 'Processos e editais',
  },
  {
    id: 'quotes',
    title: 'Orçamentos',
    icon: Receipt,
    href: '/sales/quotes',
    gradient: 'from-teal-500 to-teal-600',
    hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
    permission: SALES_PERMISSIONS.QUOTES.ACCESS,
    getSubtitle: () => 'Cotações e orçamentos',
  },
  {
    id: 'proposals',
    title: 'Propostas',
    icon: ClipboardList,
    href: '/sales/proposals',
    gradient: 'from-amber-500 to-amber-600',
    hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
    permission: SALES_PERMISSIONS.PROPOSALS.ACCESS,
    getSubtitle: () => 'Propostas comerciais',
  },
  {
    id: 'discounts',
    title: 'Descontos',
    icon: Percent,
    href: '/sales/discount-rules',
    gradient: 'from-orange-500 to-orange-600',
    hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-500/10',
    permission: SALES_PERMISSIONS.DISCOUNTS.ACCESS,
    getSubtitle: () => 'Regras de desconto',
  },
  {
    id: 'workflows',
    title: 'Automações',
    icon: Workflow,
    href: '/sales/workflows',
    gradient: 'from-cyan-500 to-cyan-600',
    hoverBg: 'hover:bg-cyan-50 dark:hover:bg-cyan-500/10',
    permission: SALES_PERMISSIONS.WORKFLOWS.ACCESS,
    getSubtitle: () => 'Fluxos automatizados',
  },
  {
    id: 'conversations',
    title: 'Conversas',
    icon: MessageSquare,
    href: '/sales/conversations',
    gradient: 'from-rose-500 to-rose-600',
    hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
    permission: SALES_PERMISSIONS.CONVERSATIONS.ACCESS,
    getSubtitle: () => 'Comunicação interna',
  },
  {
    id: 'forms',
    title: 'Formulários',
    icon: FileText,
    href: '/sales/forms',
    gradient: 'from-lime-500 to-lime-600',
    hoverBg: 'hover:bg-lime-50 dark:hover:bg-lime-500/10',
    permission: SALES_PERMISSIONS.FORMS.ACCESS,
    getSubtitle: () => 'Captura de leads',
  },
  {
    id: 'msg-templates',
    title: 'Templates',
    icon: Mail,
    href: '/sales/msg-templates',
    gradient: 'from-fuchsia-500 to-fuchsia-600',
    hoverBg: 'hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/10',
    permission: SALES_PERMISSIONS.MSG_TEMPLATES.ACCESS,
    getSubtitle: () => 'Modelos de mensagem',
  },
  {
    id: 'cashier',
    title: 'Caixa',
    icon: Calculator,
    href: '/sales/cashier',
    gradient: 'from-stone-500 to-stone-600',
    hoverBg: 'hover:bg-stone-50 dark:hover:bg-stone-500/10',
    permission: SALES_PERMISSIONS.CASHIER.ACCESS,
    getSubtitle: () => 'Gestão de caixa',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface QuickAccessGridProps {
  data: SalesDashboardData | undefined;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

export function QuickAccessGrid({
  data,
  isLoading,
  hasPermission,
}: QuickAccessGridProps) {
  const visibleCards = QUICK_CARDS.filter(
    card => !card.permission || hasPermission(card.permission)
  );

  if (visibleCards.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Acesso Rápido
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {visibleCards.map(card => (
          <Link key={card.id} href={card.href}>
            <Card
              className={`p-4 h-full bg-white dark:bg-slate-800/60 border border-border transition-all group cursor-pointer ${card.hoverBg}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-linear-to-br ${card.gradient} flex items-center justify-center shrink-0`}
                >
                  <card.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    {card.title}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-muted-foreground" />
                  </h3>
                  {isLoading ? (
                    <Skeleton className="h-3.5 w-20 mt-1" />
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {card.getSubtitle(data) ?? '--'}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
