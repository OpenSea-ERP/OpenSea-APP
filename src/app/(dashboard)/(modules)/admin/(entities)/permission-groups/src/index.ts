/**
 * Permission Groups Module Index
 * Exportações centralizadas de todo o módulo de grupos de permissões
 */

// API (queries, mutations, keys)
export * from './api';

// Config
export { permissionGroupsConfig } from './config/permission-groups.config';

// Modals
export { ColorModal } from './modals/color-modal';
export { CreateModal } from './modals/create-modal';
export { DetailModal } from './modals/detail-modal';
export { ManagePermissionsModal } from './modals/manage-permissions-modal';
export { RenameModal } from './modals/rename-modal';

// Types
export type {
  CreateModalProps,
  DetailModalProps,
  EditModalProps,
  NewPermissionGroupData,
  PermissionGroupCardProps,
  UpdatePermissionGroupData,
} from './types';

// Components
export { ModuleTabList } from './components/module-tab-list';

// Utils
export {
  createPermissionGroup,
  deletePermissionGroup,
  getPermissionGroup,
  getStatusBadgeVariant,
  getStatusLabel,
  getTypeBadgeVariant,
  getTypeLabel,
  listPermissionGroups,
  updatePermissionGroup,
} from './utils/permission-groups.utils';
