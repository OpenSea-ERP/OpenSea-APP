/**
 * Finance Module Menu Configuration
 * Configuração de menu do módulo financeiro
 */

import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { MenuItem } from '@/types/menu';
import { DollarSign } from 'lucide-react';

export const financeMenu: MenuItem = {
  id: 'finance',
  label: 'Financeiro',
  icon: <DollarSign className="w-6 h-6" />,
  href: '/finance',
  requiredPermission: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
  requiredModule: 'FINANCE',
};
