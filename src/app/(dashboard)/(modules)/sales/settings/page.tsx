/**
 * OpenSea OS - Sales Settings Hub
 * Página centralizada de configurações do módulo de Vendas.
 * Organiza e direciona para todas as sub-páginas de configuração.
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import {
  Bell,
  Bot,
  CreditCard,
  Link2,
  Paintbrush,
  Printer,
  Settings,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  gradient: string;
  permission?: string;
}

// =============================================================================
// CONFIG SECTIONS
// =============================================================================

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'payment-config',
    title: 'Gateway de Pagamento',
    description:
      'Configure provedores de pagamento (PIX, cartão, boleto) e chaves de API.',
    icon: CreditCard,
    href: '/sales/payment-config',
    gradient: 'from-emerald-500 to-green-600',
    permission: SALES_PERMISSIONS.PAYMENT_CONDITIONS?.ACCESS,
  },
  {
    id: 'payment-conditions',
    title: 'Condições de Pagamento',
    description:
      'Gerencie prazos, parcelas, juros e descontos para vendas.',
    icon: Wallet,
    href: '/sales/payment-conditions',
    gradient: 'from-violet-500 to-purple-600',
    permission: SALES_PERMISSIONS.PAYMENT_CONDITIONS?.ACCESS,
  },
  {
    id: 'brand',
    title: 'Identidade Visual',
    description:
      'Personalize cores, tipografia e logotipo da sua marca.',
    icon: Paintbrush,
    href: '/sales/brand',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'chatbot',
    title: 'Chatbot',
    description:
      'Configure o widget de chat, mensagens automáticas e aparência.',
    icon: Bot,
    href: '/sales/chatbot',
    gradient: 'from-blue-500 to-indigo-600',
    permission: SALES_PERMISSIONS.CHATBOT?.ACCESS,
  },
  {
    id: 'integrations',
    title: 'Integrações',
    description:
      'Conecte CRM, marketing, marketplace e gateways de pagamento.',
    icon: Link2,
    href: '/sales/integrations',
    gradient: 'from-teal-500 to-cyan-600',
    permission: SALES_PERMISSIONS.CONTACTS?.ACCESS,
  },
  {
    id: 'printers',
    title: 'Impressoras',
    description:
      'Cadastre e gerencie impressoras térmicas para recibos e etiquetas.',
    icon: Printer,
    href: '/sales/printers',
    gradient: 'from-slate-500 to-slate-700',
  },
  {
    id: 'notifications',
    title: 'Notificações',
    description:
      'Configure preferências de e-mail, push e SMS por categoria.',
    icon: Bell,
    href: '/sales/notification-preferences',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'lead-scoring',
    title: 'Pontuação de Leads',
    description:
      'Defina regras de scoring para qualificação automática de leads.',
    icon: ShieldCheck,
    href: '/sales/lead-scoring',
    gradient: 'from-indigo-500 to-violet-600',
    permission: SALES_PERMISSIONS.LEAD_SCORING?.ACCESS,
  },
];

// =============================================================================
// PAGE
// =============================================================================

export default function SalesSettingsPage() {
  const { hasPermission } = usePermissions();
  const router = useRouter();

  const visibleSections = SETTINGS_SECTIONS.filter(
    section => !section.permission || hasPermission(section.permission)
  );

  return (
    <PageLayout data-testid="sales-settings-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Configurações', href: '/sales/settings' },
          ]}
        />
      </PageHeader>

      <PageBody>
        <PageHeroBanner
          title="Configurações"
          description="Gerencie todas as configurações do módulo de Vendas em um só lugar."
          icon={Settings}
          iconGradient="from-slate-500 to-slate-700"
          buttons={[]}
          hasPermission={hasPermission}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleSections.map(section => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                data-testid={`settings-card-${section.id}`}
                className="group cursor-pointer rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20"
                onClick={() => router.push(section.href)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white bg-gradient-to-br',
                      section.gradient
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PageBody>
    </PageLayout>
  );
}
