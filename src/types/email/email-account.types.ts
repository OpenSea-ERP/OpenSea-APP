export type EmailAccountVisibility = 'PRIVATE' | 'SHARED';

export interface EmailAccount {
  id: string;
  address: string;
  displayName: string | null;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  tlsVerify: boolean;
  username: string;
  visibility: EmailAccountVisibility;
  isActive: boolean;
  isDefault: boolean;
  signature: string | null;
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Team ID when account is linked to a team (null = personal account) */
  teamId?: string | null;
  /** Team name for grouping in sidebar */
  teamName?: string | null;
}

export interface CreateEmailAccountRequest {
  address: string;
  displayName?: string;
  imapHost: string;
  imapPort: number;
  imapSecure?: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure?: boolean;
  tlsVerify?: boolean;
  username: string;
  secret: string;
  isDefault?: boolean;
  signature?: string;
  visibility?: EmailAccountVisibility;
}

export interface UpdateEmailAccountRequest {
  address?: string;
  displayName?: string;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  tlsVerify?: boolean;
  username?: string;
  secret?: string;
  isDefault?: boolean;
  isActive?: boolean;
  signature?: string;
  visibility?: EmailAccountVisibility;
}

export interface ShareEmailAccountRequest {
  userId: string;
  canRead: boolean;
  canSend: boolean;
  canManage: boolean;
}

export interface EmailAccountAccess {
  userId: string;
  canRead: boolean;
  canSend: boolean;
  canManage: boolean;
}

export interface EmailAccountsResponse {
  data: EmailAccount[];
}

export interface EmailAccountResponse {
  account: EmailAccount;
}
