/**
 * Tools Configuration
 * Configuração das ferramentas disponíveis no painel de ferramentas
 */

import { TOOLS_PERMISSIONS } from '@/config/rbac/permission-codes';

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  href?: string;
  disabled?: boolean;
  badge?: string;
  requiredPermission?: string;
}

export const TOOLS: ToolConfig[] = [
  {
    id: 'file-manager',
    name: 'Gerenciador de Arquivos',
    description: 'Gerencie documentos e arquivos da empresa',
    icon: 'FolderOpen',
    href: '/file-manager',
    requiredPermission: TOOLS_PERMISSIONS.STORAGE.FOLDERS.ACCESS,
  },
  {
    id: 'calendar',
    name: 'Calendário',
    description: 'Eventos e compromissos',
    icon: 'Calendar',
    href: '/calendar',
    requiredPermission: TOOLS_PERMISSIONS.CALENDAR.ACCESS,
  },
  {
    id: 'email',
    name: 'E-mail',
    description: 'Caixa de entrada e envio de e-mails',
    icon: 'Mail',
    href: '/email',
    requiredPermission: TOOLS_PERMISSIONS.EMAIL.ACCOUNTS.ACCESS,
  },
  {
    id: 'tasks',
    name: 'Tarefas',
    description: 'Quadros de tarefas e gerenciamento de projetos',
    icon: 'KanbanSquare',
    href: '/tasks',
    requiredPermission: TOOLS_PERMISSIONS.TASKS.BOARDS.ACCESS,
  },
  {
    id: 'signature',
    name: 'Assinatura Digital',
    description: 'Assinatura eletrônica e certificados digitais',
    icon: 'FileSignature',
    href: '/signature',
    requiredPermission: TOOLS_PERMISSIONS.SIGNATURE.ENVELOPES.ACCESS,
  },
  {
    id: 'ai',
    name: 'Assistente IA',
    description: 'Assistente inteligente com IA para análise e automação',
    icon: 'Bot',
    href: '/ai',
    requiredPermission: TOOLS_PERMISSIONS.AI.CHAT.ACCESS,
  },
];
