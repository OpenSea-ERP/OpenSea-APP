import { UI_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { MenuItem } from '@/types/menu';
import { Calendar } from 'lucide-react';

export const calendarMenu: MenuItem = {
  id: 'calendar',
  label: 'Agenda',
  icon: <Calendar className="w-6 h-6" />,
  href: '/calendar',
  requiredPermission: UI_PERMISSIONS.MENU.CALENDAR,
};
