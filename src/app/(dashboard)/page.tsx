/**
 * Dashboard Welcome Page
 * Página de boas-vindas do dashboard
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  STOCK_PERMISSIONS,
  FINANCE_PERMISSIONS,
  HR_PERMISSIONS,
  SALES_PERMISSIONS,
  ADMIN_PERMISSIONS,
} from '@/config/rbac/permission-codes';
import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';
import { useModules } from '@/hooks/use-modules';
import { usePermissions } from '@/hooks/use-permissions';

import {
  ArrowRight,
  Building2,
  DollarSign,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  UserRoundCog,
} from 'lucide-react';
import Link from 'next/link';

const moduleCards = [
  {
    id: 'stock',
    title: 'Estoque',
    description:
      'Produtos, movimentações, localizações e cadeia de suprimentos',
    icon: Package,
    href: '/stock',
    gradient: 'from-emerald-500 to-emerald-600',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
    permission: STOCK_PERMISSIONS.PRODUCTS.ACCESS,
    requiredModule: 'STOCK',
  },
  {
    id: 'hr',
    title: 'Recursos Humanos',
    description:
      'Funcionários, departamentos, cargos e estrutura organizacional',
    icon: UserRoundCog,
    href: '/hr',
    gradient: 'from-blue-500 to-purple-600',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
    permission: HR_PERMISSIONS.EMPLOYEES.ACCESS,
    requiredModule: 'HR',
  },
  {
    id: 'sales',
    title: 'Vendas',
    description: 'Clientes, pedidos, promoções e gestão comercial',
    icon: ShoppingBag,
    href: '/sales',
    gradient: 'from-orange-500 to-amber-600',
    hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-500/10',
    permission: SALES_PERMISSIONS.CUSTOMERS.ACCESS,
    requiredModule: 'SALES',
  },
  {
    id: 'finance',
    title: 'Financeiro',
    description: 'Contas a pagar e receber, fluxo de caixa e lançamentos',
    icon: DollarSign,
    href: '/finance',
    gradient: 'from-blue-500 to-emerald-600',
    hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
    permission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
    requiredModule: 'FINANCE',
  },
  {
    id: 'admin',
    title: 'Administração',
    description: 'Usuários, permissões e monitoramento do sistema',
    icon: Settings,
    href: '/admin',
    gradient: 'from-purple-500 to-purple-600',
    hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-500/10',
    permission: ADMIN_PERMISSIONS.USERS.ACCESS,
  },
];

export default function DashboardWelcomePage() {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const { hasPermission } = usePermissions();
  const { hasModule } = useModules();

  // Usa o primeiro nome do perfil, ou fallback para username/email
  const firstName =
    user?.profile?.name ||
    user?.username ||
    user?.email?.split('@')[0] ||
    'Usuário';
  const tenantName = currentTenant?.name || 'Sua Empresa';

  const visibleModules = moduleCards.filter(card => {
    if (card.requiredModule && !hasModule(card.requiredModule)) return false;
    if (card.permission && !hasPermission(card.permission)) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <PageActionBar breadcrumbItems={[]} className="pl-2" />

      {/* Hero Section */}
      <div>
        <Card className="relative overflow-hidden p-8 md:p-12 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-linear-to-br from-blue-500 to-purple-600">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-white/60">
                {tenantName}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Bem-vindo, {firstName}!
            </h1>

            <p className="text-lg text-gray-600 dark:text-white/60">
              Gerencie seu negócio de forma eficiente.
            </p>
            <p className="text-lg text-gray-600 dark:text-white/60">
              Selecione um módulo abaixo para começar.
            </p>
          </div>
        </Card>
      </div>

      {/* Módulos */}
      {visibleModules.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Módulos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleModules.map(card => (
              <Link key={card.id} href={card.href}>
                <Card
                  className={`p-6 h-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 transition-all group ${card.hoverBg}`}
                >
                  <div className="flex flex-col h-full">
                    <div
                      className={`w-12 h-12 rounded-xl bg-linear-to-br ${card.gradient} flex items-center justify-center mb-4`}
                    >
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                      {card.title}
                      <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-white/60">
                      {card.description}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Help Card */}
      <div>
        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="p-3 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 shrink-0">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Precisa de ajuda?
              </h3>
              <p className="text-sm text-gray-600 dark:text-white/60">
                Use o menu superior para navegar entre os módulos. Cada seção
                possui funcionalidades específicas para gerenciar seu negócio.
              </p>
            </div>
            <Link href="/settings">
              <Button variant="ghost" className="gap-2 shrink-0">
                <Settings className="h-4 w-4" />
                Configurações
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
