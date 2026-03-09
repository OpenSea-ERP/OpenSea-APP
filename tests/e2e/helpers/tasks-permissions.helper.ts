import { createUserWithPermissions } from './permissions.helper';

export const TASKS_PERMISSIONS = {
  BOARDS_CREATE: 'tasks.boards.create',
  BOARDS_READ: 'tasks.boards.read',
  BOARDS_UPDATE: 'tasks.boards.update',
  BOARDS_DELETE: 'tasks.boards.delete',
  BOARDS_LIST: 'tasks.boards.list',
  BOARDS_MANAGE: 'tasks.boards.manage',
  CARDS_CREATE: 'tasks.cards.create',
  CARDS_READ: 'tasks.cards.read',
  CARDS_UPDATE: 'tasks.cards.update',
  CARDS_DELETE: 'tasks.cards.delete',
  CARDS_LIST: 'tasks.cards.list',
  CARDS_MOVE: 'tasks.cards.move',
  CARDS_ASSIGN: 'tasks.cards.assign',
  COMMENTS_CREATE: 'tasks.comments.create',
  COMMENTS_READ: 'tasks.comments.read',
  COMMENTS_UPDATE: 'tasks.comments.update',
  COMMENTS_DELETE: 'tasks.comments.delete',
  LABELS_CREATE: 'tasks.labels.create',
  LABELS_UPDATE: 'tasks.labels.update',
  LABELS_DELETE: 'tasks.labels.delete',
  CUSTOM_FIELDS_CREATE: 'tasks.custom-fields.create',
  CUSTOM_FIELDS_UPDATE: 'tasks.custom-fields.update',
  CUSTOM_FIELDS_DELETE: 'tasks.custom-fields.delete',
  ATTACHMENTS_UPLOAD: 'tasks.attachments.upload',
  ATTACHMENTS_DELETE: 'tasks.attachments.delete',
  WATCHERS_CREATE: 'tasks.watchers.create',
  WATCHERS_READ: 'tasks.watchers.read',
  WATCHERS_DELETE: 'tasks.watchers.delete',
} as const;

export const TASKS_FULL_PERMISSIONS = Object.values(TASKS_PERMISSIONS);

export async function createTasksUser(
  permissionCodes: string[],
  groupName?: string
) {
  return createUserWithPermissions(permissionCodes, groupName);
}
