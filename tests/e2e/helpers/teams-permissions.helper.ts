import { createUserWithPermissions } from './permissions.helper';

export const TEAMS_PERMISSIONS = {
  CREATE: 'core.teams.create',
  READ: 'core.teams.read',
  UPDATE: 'core.teams.update',
  DELETE: 'core.teams.delete',
  LIST: 'core.teams.list',
  MANAGE: 'core.teams.manage',
  MEMBERS_ADD: 'core.teams.members.add',
  MEMBERS_REMOVE: 'core.teams.members.remove',
  MEMBERS_MANAGE: 'core.teams.members.manage',
} as const;

export const CORE_PERMISSIONS = {
  USERS_LIST: 'core.users.list',
  USERS_CREATE: 'core.users.create',
} as const;

export const TEAMS_VIEW_ONLY_PERMISSIONS = [
  TEAMS_PERMISSIONS.LIST,
  TEAMS_PERMISSIONS.READ,
];

export const TEAMS_FULL_PERMISSIONS = [
  TEAMS_PERMISSIONS.CREATE,
  TEAMS_PERMISSIONS.READ,
  TEAMS_PERMISSIONS.UPDATE,
  TEAMS_PERMISSIONS.DELETE,
  TEAMS_PERMISSIONS.LIST,
  TEAMS_PERMISSIONS.MANAGE,
  TEAMS_PERMISSIONS.MEMBERS_ADD,
  TEAMS_PERMISSIONS.MEMBERS_REMOVE,
  TEAMS_PERMISSIONS.MEMBERS_MANAGE,
];

export async function createTeamsUser(
  permissionCodes: string[],
  groupName?: string
) {
  return createUserWithPermissions(permissionCodes, groupName);
}
