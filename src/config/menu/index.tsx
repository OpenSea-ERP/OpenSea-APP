/**
 * Menu Configuration Index
 * Combina todos os menus dos módulos
 */

import type { MenuItem } from '@/types/menu';
import { adminMenu } from './admin';
import { financeMenu } from './finance';
import { hrMenu } from './hr';
import { salesMenu } from './sales';
import { stockMenu } from './stock';

export const menuItems: MenuItem[] = [
  stockMenu,
  salesMenu,
  hrMenu,
  financeMenu,
  adminMenu,
];
