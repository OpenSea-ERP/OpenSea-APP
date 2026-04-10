export type AgentStatus = 'ONLINE' | 'OFFLINE' | 'ERROR';
export type PrinterStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ERROR' | 'UNKNOWN';

export interface PrintAgent {
  id: string;
  name: string;
  status: AgentStatus;
  isPaired: boolean;
  deviceLabel: string | null;
  pairedAt: string | null;
  lastSeenAt: string | null;
  ipAddress: string | null;
  hostname: string | null;
  version: string | null;
  printerCount: number;
  createdAt: string;
}

export interface RemotePrinter {
  id: string;
  name: string;
  type: string;
  status: PrinterStatus;
  isDefault: boolean;
  agentId: string | null;
  agentName?: string;
  osName: string | null;
  lastSeenAt: string | null;
}

export interface RegisterAgentResponse {
  agentId: string;
}

export interface AgentPairingCodeResponse {
  code: string;
  expiresAt: string;
}

export interface PrintAgentsResponse {
  agents: PrintAgent[];
}
