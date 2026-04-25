/**
 * Devices Module Landing Page
 * Página inicial do módulo de dispositivos com cards de navegação
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageDashboardSections } from '@/components/layout/page-dashboard-sections';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { usePermissions } from '@/hooks/use-permissions';
import { Monitor, Printer, MonitorSmartphone, Smartphone } from 'lucide-react';

const sections = [
  {
    title: 'Gerenciamento',
    cards: [
      {
        id: 'remote-prints',
        title: 'Impressoras Remotas',
        description: 'Gerencie impressoras conectadas via Print Server',
        icon: Printer,
        href: '/devices/remote-prints',
        gradient: 'from-blue-500 to-indigo-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
      },
      {
        id: 'pos-terminals',
        title: 'Terminais POS',
        description: 'Configure e monitore terminais de ponto de venda',
        icon: MonitorSmartphone,
        href: '/devices/pos-terminals',
        gradient: 'from-violet-500 to-purple-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
      },
      {
        id: 'punch-pwa',
        title: 'Punch PWA',
        description:
          'Distribua a PWA de ponto pessoal aos colaboradores (QR + cartaz)',
        icon: Smartphone,
        href: '/devices/downloads/punch-pwa',
        gradient: 'from-violet-500 to-purple-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
      },
    ],
  },
];

export default function DevicesLandingPage() {
  const { hasPermission } = usePermissions();

  return (
    <div className="space-y-8">
      <PageActionBar
        breadcrumbItems={[{ label: 'Dispositivos', href: '/devices' }]}
        hasPermission={hasPermission}
      />

      <PageHeroBanner
        title="Dispositivos"
        description="Gerencie impressoras remotas, terminais POS e outros dispositivos conectados ao seu sistema."
        icon={Monitor}
        iconGradient="from-blue-500 to-indigo-600"
        buttons={[]}
        hasPermission={hasPermission}
      />

      <PageDashboardSections
        sections={sections}
        counts={{}}
        countsLoading={false}
        hasPermission={hasPermission}
      />
    </div>
  );
}
