import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
    CreateEmailAccountRequest,
    EmailAccountResponse,
    EmailAccountsResponse,
    EmailFoldersResponse,
    EmailMessageResponse,
    EmailMessagesQuery,
    EmailMessagesResponse,
    SaveEmailDraftRequest,
    SaveEmailDraftResponse,
    SendEmailMessageRequest,
    SendEmailMessageResponse,
    ShareEmailAccountRequest,
    UpdateEmailAccountRequest,
} from '@/types/email';

export const emailService = {
  async listAccounts(): Promise<EmailAccountsResponse> {
    return apiClient.get<EmailAccountsResponse>(API_ENDPOINTS.EMAIL.ACCOUNTS.LIST);
  },

  async getAccount(id: string): Promise<EmailAccountResponse> {
    return apiClient.get<EmailAccountResponse>(API_ENDPOINTS.EMAIL.ACCOUNTS.GET(id));
  },

  async createAccount(
    data: CreateEmailAccountRequest,
  ): Promise<EmailAccountResponse> {
    return apiClient.post<EmailAccountResponse>(
      API_ENDPOINTS.EMAIL.ACCOUNTS.CREATE,
      data,
    );
  },

  async updateAccount(
    id: string,
    data: UpdateEmailAccountRequest,
  ): Promise<EmailAccountResponse> {
    return apiClient.patch<EmailAccountResponse>(
      API_ENDPOINTS.EMAIL.ACCOUNTS.UPDATE(id),
      data,
    );
  },

  async deleteAccount(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.EMAIL.ACCOUNTS.DELETE(id));
  },

  async testConnection(id: string): Promise<void> {
    await apiClient.post<void>(
      API_ENDPOINTS.EMAIL.ACCOUNTS.TEST(id),
      {},
    );
  },

  async triggerSync(id: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.EMAIL.ACCOUNTS.SYNC(id),
      {},
    );
  },

  async listFolders(accountId: string): Promise<EmailFoldersResponse> {
    return apiClient.get<EmailFoldersResponse>(API_ENDPOINTS.EMAIL.FOLDERS.LIST, {
      params: { accountId },
    });
  },

  async listMessages(query: EmailMessagesQuery): Promise<EmailMessagesResponse> {
    return apiClient.get<EmailMessagesResponse>(API_ENDPOINTS.EMAIL.MESSAGES.LIST, {
      params: {
        accountId: query.accountId,
        ...(query.folderId ? { folderId: query.folderId } : {}),
        ...(query.unread !== undefined ? { unread: String(query.unread) } : {}),
        ...(query.search ? { search: query.search } : {}),
        page: String(query.page ?? 1),
        limit: String(query.limit ?? 20),
      },
    });
  },

  async getMessage(id: string): Promise<EmailMessageResponse> {
    return apiClient.get<EmailMessageResponse>(API_ENDPOINTS.EMAIL.MESSAGES.GET(id));
  },

  async sendMessage(
    data: SendEmailMessageRequest,
  ): Promise<SendEmailMessageResponse> {
    // Use FormData when attachments are present, JSON otherwise
    if (data.attachments?.length) {
      const form = new FormData();
      form.append('accountId', data.accountId);
      data.to.forEach(addr => form.append('to', addr));
      data.cc?.forEach(addr => form.append('cc', addr));
      data.bcc?.forEach(addr => form.append('bcc', addr));
      form.append('subject', data.subject);
      form.append('bodyHtml', data.bodyHtml);
      if (data.inReplyTo) form.append('inReplyTo', data.inReplyTo);
      data.references?.forEach(ref => form.append('references', ref));
      data.attachments.forEach(file => form.append('attachments', file, file.name));
      return apiClient.request<SendEmailMessageResponse>(
        API_ENDPOINTS.EMAIL.MESSAGES.SEND,
        { method: 'POST', body: form as unknown as BodyInit },
      );
    }

    // JSON body (no attachments) — cleaner and avoids FormData edge cases
    const { attachments: _attachments, ...jsonBody } = data;
    return apiClient.post<SendEmailMessageResponse>(
      API_ENDPOINTS.EMAIL.MESSAGES.SEND,
      jsonBody,
    );
  },

  async saveDraft(data: SaveEmailDraftRequest): Promise<SaveEmailDraftResponse> {
    return apiClient.post<SaveEmailDraftResponse>(
      API_ENDPOINTS.EMAIL.MESSAGES.DRAFT,
      data,
    );
  },

  async markAsRead(id: string, isRead: boolean): Promise<void> {
    return apiClient.patch<void>(API_ENDPOINTS.EMAIL.MESSAGES.MARK_READ(id), {
      isRead,
    });
  },

  async moveMessage(id: string, targetFolderId: string): Promise<void> {
    return apiClient.patch<void>(API_ENDPOINTS.EMAIL.MESSAGES.MOVE(id), {
      targetFolderId,
    });
  },

  async deleteMessage(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.EMAIL.MESSAGES.DELETE(id));
  },

  async shareAccount(
    id: string,
    data: ShareEmailAccountRequest,
  ): Promise<void> {
    return apiClient.post<void>(
      API_ENDPOINTS.EMAIL.ACCOUNTS.SHARE(id),
      data,
    );
  },

  async unshareAccount(id: string, userId: string): Promise<void> {
    return apiClient.delete<void>(
      API_ENDPOINTS.EMAIL.ACCOUNTS.UNSHARE(id, userId),
    );
  },

  async getAttachmentDownloadUrl(
    messageId: string,
    attachmentId: string,
  ): Promise<{ url: string; filename: string; contentType: string }> {
    return apiClient.get<{ url: string; filename: string; contentType: string }>(
      API_ENDPOINTS.EMAIL.MESSAGES.ATTACHMENT_DOWNLOAD(messageId, attachmentId),
    );
  },
};
