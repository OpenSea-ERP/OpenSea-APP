/**
 * Production Module Menu Configuration
 * Configuração de menu do módulo de produção
 */

import { PRODUCTION_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { MenuItem } from '@/types/menu';
import { Factory } from 'lucide-react';

export const productionMenu: MenuItem = {
  id: 'production',
  label: 'Produção',
  icon: <Factory className="w-6 h-6" />,
  href: '/production',
  requiredPermission: PRODUCTION_PERMISSIONS.ORDERS.ACCESS,
  requiredModule: 'PRODUCTION',
};
