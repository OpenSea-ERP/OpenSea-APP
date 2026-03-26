// Chatbot Config Types (Configuração do Chatbot)

export interface ChatbotConfig {
  id: string;
  greetingMessage: string;
  autoReplyMessage: string;
  primaryColor: string;
  assignToUserId?: string;
  assignToUserName?: string;
  formId?: string;
  formName?: string;
  isActive: boolean;
  widgetPosition: 'BOTTOM_RIGHT' | 'BOTTOM_LEFT';
  embedCode: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateChatbotConfigRequest {
  greetingMessage?: string;
  autoReplyMessage?: string;
  primaryColor?: string;
  assignToUserId?: string;
  formId?: string;
  isActive?: boolean;
  widgetPosition?: 'BOTTOM_RIGHT' | 'BOTTOM_LEFT';
}

export interface ChatbotConfigResponse {
  config: ChatbotConfig;
}
