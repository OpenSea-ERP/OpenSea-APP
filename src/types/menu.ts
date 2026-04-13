/**
 * Menu Types
 * Tipos para o sistema de navegação
 */

export type MenuItemVariant = 'primary' | 'alert' | 'new' | 'inactive';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  href?: string;
  submenu?: MenuItem[];
  variant?: MenuItemVariant;
  requiredPermission?: string; // Permissão necessária para ver este item
  requiredPermissions?: string[]; // Múltiplas permissões (OR - precisa de pelo menos uma)
  requiredModule?: string; // Módulo do plano necessário para ver este item
}
