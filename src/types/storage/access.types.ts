// Storage Access Types

export interface FolderAccessRule {
  id: string;
  tenantId: string;
  folderId: string;
  userId: string | null;
  userName: string | null;
  groupId: string | null;
  groupName: string | null;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
  isInherited: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SetFolderAccessRequest {
  userId?: string;
  groupId?: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
}

export interface AccessRuleResponse {
  rule: FolderAccessRule;
}

export interface AccessRulesResponse {
  rules: FolderAccessRule[];
}
