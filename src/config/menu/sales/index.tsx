/**
 * Sales Module Menu Configuration
 * Configuracao de menu do modulo de vendas
 */

import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { MenuItem } from '@/types/menu';
import { ShoppingCart } from 'lucide-react';

export const salesMenu: MenuItem = {
  id: 'sales',
  label: 'Vendas',
  icon: <ShoppingCart className="w-6 h-6" />,
  href: '/sales',
  requiredPermission: SALES_PERMISSIONS.ORDERS.ACCESS,
};
