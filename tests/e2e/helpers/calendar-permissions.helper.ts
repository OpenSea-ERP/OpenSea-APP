import { createUserWithPermissions } from './permissions.helper';

export const CALENDAR_PERMISSIONS = {
  EVENTS_CREATE: 'calendar.events.create',
  EVENTS_READ: 'calendar.events.read',
  EVENTS_UPDATE: 'calendar.events.update',
  EVENTS_DELETE: 'calendar.events.delete',
  EVENTS_LIST: 'calendar.events.list',
  EVENTS_MANAGE: 'calendar.events.manage',
  PARTICIPANTS_INVITE: 'calendar.participants.invite',
  PARTICIPANTS_RESPOND: 'calendar.participants.respond',
  PARTICIPANTS_MANAGE: 'calendar.participants.manage',
  REMINDERS_CREATE: 'calendar.reminders.create',
  REMINDERS_DELETE: 'calendar.reminders.delete',
} as const;

export const CORE_PERMISSIONS = {
  USERS_LIST: 'core.users.list',
} as const;

export const CALENDAR_VIEW_ONLY_PERMISSIONS = [
  CALENDAR_PERMISSIONS.EVENTS_LIST,
];

export const CALENDAR_FULL_PERMISSIONS = [
  CALENDAR_PERMISSIONS.EVENTS_CREATE,
  CALENDAR_PERMISSIONS.EVENTS_READ,
  CALENDAR_PERMISSIONS.EVENTS_UPDATE,
  CALENDAR_PERMISSIONS.EVENTS_DELETE,
  CALENDAR_PERMISSIONS.EVENTS_LIST,
  CALENDAR_PERMISSIONS.EVENTS_MANAGE,
  CALENDAR_PERMISSIONS.PARTICIPANTS_INVITE,
  CALENDAR_PERMISSIONS.PARTICIPANTS_RESPOND,
  CALENDAR_PERMISSIONS.PARTICIPANTS_MANAGE,
  CALENDAR_PERMISSIONS.REMINDERS_CREATE,
  CALENDAR_PERMISSIONS.REMINDERS_DELETE,
];

export async function createCalendarUser(
  permissionCodes: string[],
  groupName?: string
) {
  return createUserWithPermissions(permissionCodes, groupName);
}
