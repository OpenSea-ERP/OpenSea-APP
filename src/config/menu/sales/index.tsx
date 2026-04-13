/**
 * Sales Module Menu Configuration
 * Configuração de menu do módulo de vendas
 */

import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { MenuItem } from '@/types/menu';
import { ShoppingBag } from 'lucide-react';

export const salesMenu: MenuItem = {
  id: 'sales',
  label: 'Vendas',
  icon: <ShoppingBag className="w-6 h-6" />,
  href: '/sales',
  requiredPermission: SALES_PERMISSIONS.CUSTOMERS.ACCESS,
  requiredModule: 'SALES',
};
