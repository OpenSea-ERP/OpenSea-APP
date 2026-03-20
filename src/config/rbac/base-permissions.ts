/**
 * OpenSea OS - Base Permissions
 *
 * Gera a lista de permissões base automaticamente a partir dos PermissionCodes.
 * O backend seed agora usa PermissionCodes diretamente, mas este arquivo
 * é mantido para compatibilidade com o script rbac-setup.ts do frontend.
 */

import type { CreatePermissionDTO } from '@/types/rbac';
import { PermissionCodes } from './permission-codes';

// =============================================================================
// AUTO-GENERATED FROM PermissionCodes
// =============================================================================

/**
 * Extrai todas as permissões de um módulo permission object
 * Percorre o objeto recursivamente e gera CreatePermissionDTO[]
 */
function extractPermissions(
  moduleKey: string,
  moduleObj: Record<string, Record<string, string>>
): CreatePermissionDTO[] {
  const permissions: CreatePermissionDTO[] = [];

  for (const [, resourcePerms] of Object.entries(moduleObj)) {
    if (typeof resourcePerms === 'string') continue; // skip non-object entries

    for (const [, code] of Object.entries(resourcePerms)) {
      if (typeof code !== 'string') continue;

      // Parse: module.resource.action
      const parts = code.split('.');
      if (parts.length !== 3) continue;

      const [mod, resource, action] = parts;

      permissions.push({
        code,
        name: `${action} ${resource}`,
        description: `Permissão ${action} para ${resource} (${mod})`,
        module: mod,
        resource,
        action,
      });
    }
  }

  return permissions;
}

// =============================================================================
// WILDCARD
// =============================================================================

export const wildcardPermissions: CreatePermissionDTO[] = [
  {
    code: '*.*.*',
    name: 'Acesso Total',
    description: 'Acesso total ao sistema (Super Admin)',
    module: '*',
    resource: '*',
    action: '*',
    metadata: {
      critical: true,
      dangerous: true,
    },
  },
];

// =============================================================================
// ALL PERMISSIONS (auto-generated)
// =============================================================================

const modulePermissions: CreatePermissionDTO[] = [];

for (const [moduleKey, moduleObj] of Object.entries(PermissionCodes)) {
  if (moduleKey === 'WILDCARD') continue;
  modulePermissions.push(
    ...extractPermissions(
      moduleKey,
      moduleObj as Record<string, Record<string, string>>
    )
  );
}

/**
 * Todas as permissões base do sistema
 */
export const allBasePermissions: CreatePermissionDTO[] = [
  ...modulePermissions,
  ...wildcardPermissions,
];

/**
 * Permissões agrupadas por módulo
 */
export const permissionsByModule = Object.fromEntries(
  Object.entries(PermissionCodes)
    .filter(([key]) => key !== 'WILDCARD')
    .map(([key, obj]) => [
      key.toLowerCase(),
      extractPermissions(
        key,
        obj as Record<string, Record<string, string>>
      ),
    ])
);
