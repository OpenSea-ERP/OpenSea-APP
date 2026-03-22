export type AiPersonality =
  | 'PROFESSIONAL'
  | 'FRIENDLY'
  | 'CASUAL'
  | 'FORMAL'
  | 'CUSTOM';
export type AiToneOfVoice = 'NEUTRAL' | 'WARM' | 'DIRECT' | 'ENTHUSIASTIC';

export interface AiTenantConfig {
  tenantId: string;
  assistantName: string;
  assistantAvatar: string | null;
  personality: AiPersonality;
  customPersonality: string | null;
  toneOfVoice: AiToneOfVoice;
  language: string;
  greeting: string | null;
  enableDedicatedChat: boolean;
  enableInlineContext: boolean;
  enableCommandBar: boolean;
  enableVoice: boolean;
  wakeWord: string | null;
  tier1Provider: string;
  tier2Provider: string;
  tier3Provider: string;
  selfHostedEndpoint: string | null;
  tier1ApiKey: string | null;
  tier2ApiKey: string | null;
  tier3ApiKey: string | null;
  canExecuteActions: boolean;
  requireConfirmation: boolean;
  maxActionsPerMinute: number;
  enableProactiveInsights: boolean;
  insightFrequency: string;
  enableScheduledReports: boolean;
  accessibleModules: string[];
}

export interface UpdateAiConfigRequest {
  assistantName?: string;
  assistantAvatar?: string | null;
  personality?: AiPersonality;
  customPersonality?: string | null;
  toneOfVoice?: AiToneOfVoice;
  language?: string;
  greeting?: string | null;
  enableDedicatedChat?: boolean;
  enableInlineContext?: boolean;
  enableCommandBar?: boolean;
  enableVoice?: boolean;
  wakeWord?: string | null;
  tier1Provider?: string;
  tier2Provider?: string;
  tier3Provider?: string;
  selfHostedEndpoint?: string | null;
  tier1ApiKey?: string | null;
  tier2ApiKey?: string | null;
  tier3ApiKey?: string | null;
  canExecuteActions?: boolean;
  requireConfirmation?: boolean;
  maxActionsPerMinute?: number;
  enableProactiveInsights?: boolean;
  insightFrequency?: string;
  enableScheduledReports?: boolean;
  accessibleModules?: string[];
}
