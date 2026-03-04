export interface EmailMessageListItem {
  id: string;
  accountId: string;
  folderId: string;
  subject: string;
  fromAddress: string;
  fromName: string | null;
  snippet: string | null;
  receivedAt: string;
  isRead: boolean;
  hasAttachments: boolean;
}

export interface EmailAttachment {
  id: string;
  messageId: string;
  filename: string;
  contentType: string;
  size: number;
  storageKey: string;
  createdAt: string;
}

export interface EmailMessageDetail {
  id: string;
  tenantId: string;
  accountId: string;
  folderId: string;
  remoteUid: number;
  messageId: string | null;
  threadId: string | null;
  fromAddress: string;
  fromName: string | null;
  toAddresses: string[];
  ccAddresses: string[];
  bccAddresses: string[];
  subject: string;
  snippet: string | null;
  bodyText: string | null;
  bodyHtmlSanitized: string | null;
  receivedAt: string;
  sentAt: string | null;
  isRead: boolean;
  isFlagged: boolean;
  hasAttachments: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: EmailAttachment[];
}

export interface EmailMessagesQuery {
  accountId: string;
  folderId?: string;
  unread?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EmailMessagesResponse {
  data: EmailMessageListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface EmailMessageResponse {
  message: EmailMessageDetail;
}

export interface SendEmailMessageRequest {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  inReplyTo?: string;
  references?: string[];
  attachments?: File[];
}

export interface SendEmailMessageResponse {
  messageId: string;
}

export interface SaveEmailDraftRequest {
  accountId: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  bodyHtml?: string;
}

export interface SaveEmailDraftResponse {
  draftId: string;
}
