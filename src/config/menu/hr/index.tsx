/**
 * Human Resources Module Menu Configuration
 * Configuração de menu do módulo de recursos humanos
 */

import { HR_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { MenuItem } from '@/types/menu';
import { UserRoundCog } from 'lucide-react';

export const hrMenu: MenuItem = {
  id: 'human-resources',
  label: 'Recursos Humanos',
  icon: <UserRoundCog className="w-6 h-6" />,
  href: '/hr',
  requiredPermission: HR_PERMISSIONS.EMPLOYEES.ACCESS,
  requiredModule: 'HR',
};
