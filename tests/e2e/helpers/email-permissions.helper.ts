import { createUserWithPermissions } from './permissions.helper';

/**
 * All email permission codes.
 */
export const EMAIL_PERMISSIONS = {
  // Accounts
  ACCOUNTS_CREATE: 'email.accounts.create',
  ACCOUNTS_READ: 'email.accounts.read',
  ACCOUNTS_UPDATE: 'email.accounts.update',
  ACCOUNTS_DELETE: 'email.accounts.delete',
  ACCOUNTS_LIST: 'email.accounts.list',
  ACCOUNTS_SHARE: 'email.accounts.share',

  // Messages
  MESSAGES_READ: 'email.messages.read',
  MESSAGES_LIST: 'email.messages.list',
  MESSAGES_SEND: 'email.messages.send',
  MESSAGES_UPDATE: 'email.messages.update',
  MESSAGES_DELETE: 'email.messages.delete',

  // Sync
  SYNC_EXECUTE: 'email.sync.execute',
} as const;

/** All email permission codes as a flat array */
export const ALL_EMAIL_PERMISSIONS = Object.values(EMAIL_PERMISSIONS);

/** Permissions for account management only */
export const ACCOUNT_MANAGEMENT_PERMISSIONS = [
  EMAIL_PERMISSIONS.ACCOUNTS_CREATE,
  EMAIL_PERMISSIONS.ACCOUNTS_READ,
  EMAIL_PERMISSIONS.ACCOUNTS_UPDATE,
  EMAIL_PERMISSIONS.ACCOUNTS_DELETE,
  EMAIL_PERMISSIONS.ACCOUNTS_LIST,
  EMAIL_PERMISSIONS.ACCOUNTS_SHARE,
  EMAIL_PERMISSIONS.SYNC_EXECUTE,
];

/** Permissions for reading/managing messages (no account management) */
export const MESSAGE_PERMISSIONS = [
  EMAIL_PERMISSIONS.ACCOUNTS_LIST,
  EMAIL_PERMISSIONS.MESSAGES_READ,
  EMAIL_PERMISSIONS.MESSAGES_LIST,
  EMAIL_PERMISSIONS.MESSAGES_SEND,
  EMAIL_PERMISSIONS.MESSAGES_UPDATE,
  EMAIL_PERMISSIONS.MESSAGES_DELETE,
];

/**
 * Create a test user with specified email permissions.
 */
export async function createEmailUser(
  permissions: string[],
  groupPrefix = 'e2e-email'
) {
  return createUserWithPermissions(
    permissions,
    `${groupPrefix}-${Date.now().toString(36)}`
  );
}
