/**
 * OpenSea OS - Conversation Detail Page
 * Página de detalhes da conversa com thread de mensagens estilo chat
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  useConversation,
  useSendMessage,
  useCloseConversation,
  useArchiveConversation,
} from '@/hooks/sales/use-conversations';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { Conversation, ConversationMessage } from '@/types/sales';
import { CONVERSATION_STATUS_LABELS } from '@/types/sales';
import {
  Archive,
  Calendar,
  Loader2,
  Lock,
  MessageSquare,
  Send,
  User,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// PAGE
// ============================================================================

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const conversationId = params.id as string;

  const {
    data: conversationData,
    isLoading,
    error,
  } = useConversation(conversationId);

  const conversation = conversationData?.conversation as
    | Conversation
    | undefined;

  const sendMutation = useSendMessage();
  const closeMutation = useCloseConversation();
  const archiveMutation = useArchiveConversation();

  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMutation.mutateAsync({
        id: conversationId,
        data: { content: newMessage.trim() },
      });
      setNewMessage('');
    } catch {
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleClose = async () => {
    try {
      await closeMutation.mutateAsync(conversationId);
      toast.success('Conversa fechada com sucesso!');
    } catch {
      toast.error('Erro ao fechar conversa');
    }
  };

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync(conversationId);
      toast.success('Conversa arquivada com sucesso!');
    } catch {
      toast.error('Erro ao arquivar conversa');
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons = [
    ...(conversation?.status === 'OPEN' &&
    hasPermission(SALES_PERMISSIONS.CONVERSATIONS.ADMIN)
      ? [
          {
            id: 'close',
            title: 'Fechar Conversa',
            icon: XCircle,
            onClick: handleClose,
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
    ...(conversation?.status !== 'ARCHIVED' &&
    hasPermission(SALES_PERMISSIONS.CONVERSATIONS.ADMIN)
      ? [
          {
            id: 'archive',
            title: 'Arquivar',
            icon: Archive,
            onClick: handleArchive,
            variant: 'default' as const,
          },
        ]
      : []),
  ];

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Conversas', href: '/sales/conversations' },
    { label: conversation?.subject || '...' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !conversation) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Conversa não encontrada"
            message="A conversa que você está procurando não existe ou foi removida."
            action={{
              label: 'Voltar para Conversas',
              onClick: () => router.push('/sales/conversations'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  const statusLabel =
    CONVERSATION_STATUS_LABELS[conversation.status] || conversation.status;
  const messages = conversation.messages || [];
  const isOpen = conversation.status === 'OPEN';

  const createdDate = new Date(conversation.createdAt).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }
  );

  const getStatusColor = () => {
    switch (conversation.status) {
      case 'OPEN':
        return 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300';
      case 'CLOSED':
        return 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400';
      case 'ARCHIVED':
        return 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300';
      default:
        return '';
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>
      <PageBody>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Thread */}
          <div className="lg:col-span-2 space-y-4">
            {/* Identity Card */}
            <Card className="bg-white/5 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-sky-500 to-blue-600">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Conversa</p>
                  <h1 className="text-xl font-bold truncate">
                    {conversation.subject}
                  </h1>
                </div>
                <div className="hidden sm:flex items-center gap-3 shrink-0">
                  <div
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${getStatusColor()}`}
                  >
                    {statusLabel}
                  </div>
                </div>
              </div>
            </Card>

            {/* Messages */}
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-4 max-h-[500px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-base font-semibold text-muted-foreground">
                      Nenhuma mensagem
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Envie a primeira mensagem para iniciar a conversa.
                    </p>
                  </div>
                ) : (
                  messages.map((msg: ConversationMessage) => {
                    const isAgent = msg.senderType === 'AGENT';
                    const msgTime = new Date(msg.createdAt).toLocaleTimeString(
                      'pt-BR',
                      { hour: '2-digit', minute: '2-digit' }
                    );
                    const msgDate = new Date(msg.createdAt).toLocaleDateString(
                      'pt-BR',
                      {
                        day: '2-digit',
                        month: '2-digit',
                      }
                    );

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isAgent
                              ? 'bg-sky-500 text-white rounded-br-md'
                              : 'bg-gray-100 dark:bg-slate-800 text-foreground rounded-bl-md'
                          }`}
                        >
                          <p className="text-xs font-medium opacity-70 mb-0.5">
                            {msg.senderName}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          <p
                            className={`text-[10px] mt-1 ${isAgent ? 'text-white/60' : 'text-muted-foreground'}`}
                          >
                            {msgDate} {msgTime}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {isOpen &&
              hasPermission(SALES_PERMISSIONS.CONVERSATIONS.REPLY) ? (
                <div className="px-6 py-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMutation.isPending}
                    >
                      {sendMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-3 border-t border-border text-center">
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Lock className="h-4 w-4" />
                    {!isOpen
                      ? 'Esta conversa está fechada.'
                      : 'Você não tem permissão para responder.'}
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar: Customer Info */}
          <div className="space-y-4">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Informações do Cliente
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Dados do cliente vinculado
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                <div className="w-full rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60 space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Cliente</p>
                      <p className="text-sm font-medium truncate">
                        {conversation.customerName || 'Não identificado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Iniciada em
                      </p>
                      <p className="text-sm font-medium">{createdDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Mensagens</p>
                      <p className="text-sm font-medium">
                        {messages.length} mensagem(ns)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageBody>
    </PageLayout>
  );
}
