'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { aiChatService } from '@/services/ai';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Bot,
  Send,
  Plus,
  MessageSquare,
  Archive,
  Pin,
  Loader2,
  User,
  Sparkles,
} from 'lucide-react';
import type { AiConversation, AiMessage } from '@/types/ai';

export default function AiChatPage() {
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [localMessages, setLocalMessages] = useState<AiMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // List conversations
  const { data: conversationsData, isLoading: loadingConversations } = useQuery({
    queryKey: ['ai', 'conversations'],
    queryFn: async () => {
      const response = await aiChatService.listConversations({ limit: 50 });
      return response.conversations;
    },
  });

  // Get conversation messages
  const { data: conversationDetail, isLoading: loadingMessages } = useQuery({
    queryKey: ['ai', 'conversation', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return null;
      return aiChatService.getConversation(selectedConversationId, { limit: 100 });
    },
    enabled: !!selectedConversationId,
  });

  // Merge server messages with local optimistic messages
  const allMessages = selectedConversationId
    ? [
        ...(conversationDetail?.messages ?? []),
        ...localMessages.filter(
          (lm) =>
            !conversationDetail?.messages?.some((m: AiMessage) => m.id === lm.id),
        ),
      ]
    : localMessages;

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: aiChatService.sendMessage,
    onSuccess: (data) => {
      setSelectedConversationId(data.conversationId);
      setLocalMessages((prev) => [
        ...prev.filter((m) => m.role !== 'ASSISTANT' || m.content !== null),
        data.assistantMessage,
      ]);
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
      queryClient.invalidateQueries({
        queryKey: ['ai', 'conversation', data.conversationId],
      });
    },
  });

  // Archive conversation
  const archiveMutation = useMutation({
    mutationFn: aiChatService.archiveConversation,
    onSuccess: () => {
      setSelectedConversationId(null);
      setLocalMessages([]);
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
    },
  });

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || sendMessage.isPending) return;

    const content = inputValue.trim();
    setInputValue('');

    // Optimistic: add user message locally
    const optimisticUserMsg: AiMessage = {
      id: `temp-${Date.now()}`,
      role: 'USER',
      content,
      contentType: 'TEXT',
      createdAt: new Date().toISOString(),
    };

    const optimisticLoadingMsg: AiMessage = {
      id: `loading-${Date.now()}`,
      role: 'ASSISTANT',
      content: null,
      contentType: 'LOADING',
      createdAt: new Date().toISOString(),
    };

    setLocalMessages((prev) => [...prev, optimisticUserMsg, optimisticLoadingMsg]);

    sendMessage.mutate({
      conversationId: selectedConversationId ?? undefined,
      content,
    });
  }, [inputValue, selectedConversationId, sendMessage]);

  const handleNewConversation = () => {
    setSelectedConversationId(null);
    setLocalMessages([]);
    inputRef.current?.focus();
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const conversations = conversationsData ?? [];

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <PageActionBar
        breadcrumbs={[
          { label: 'Ferramentas' },
          { label: 'Assistente IA' },
        ]}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Conversations */}
        <div className="w-80 border-r border-border flex flex-col bg-background/50">
          <div className="p-3 border-b border-border">
            <Button
              onClick={handleNewConversation}
              className="w-full"
              variant="outline"
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova conversa
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma conversa ainda.
                  <br />
                  Comece uma nova conversa!
                </div>
              ) : (
                conversations.map((conv: AiConversation) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversationId(conv.id);
                      setLocalMessages([]);
                    }}
                    className={cn(
                      'w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors',
                      'hover:bg-accent/50',
                      selectedConversationId === conv.id
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {conv.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
                      <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate font-medium">
                        {conv.title ?? 'Conversa sem titulo'}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground/70">
                      <span>{conv.messageCount} msgs</span>
                      {conv.lastMessageAt && (
                        <>
                          <span>-</span>
                          <span>
                            {formatDistanceToNow(new Date(conv.lastMessageAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          {selectedConversationId && conversationDetail?.conversation && (
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <span className="font-medium text-sm">
                  {conversationDetail.conversation.title ?? 'Conversa'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => archiveMutation.mutate(selectedConversationId)}
                disabled={archiveMutation.isPending}
              >
                <Archive className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {allMessages.length === 0 && !loadingMessages ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="rounded-full bg-primary/10 p-6 mb-4">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  Assistente IA
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Pergunte qualquer coisa sobre seus dados, solicite relatorios,
                  analise tendencias ou execute acoes. Como posso ajudar?
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {allMessages.map((msg: AiMessage) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-3',
                      msg.role === 'USER' ? 'justify-end' : 'justify-start',
                    )}
                  >
                    {msg.role !== 'USER' && (
                      <div className="shrink-0 rounded-full bg-primary/10 p-2 h-8 w-8 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <Card
                      className={cn(
                        'max-w-[75%] px-4 py-3 text-sm',
                        msg.role === 'USER'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted',
                      )}
                    >
                      {msg.contentType === 'LOADING' ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-muted-foreground">Pensando...</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                      {msg.aiModel && msg.aiModel !== 'placeholder' && (
                        <div className="mt-1 text-xs opacity-50">
                          {msg.aiModel}
                          {msg.aiLatencyMs ? ` - ${msg.aiLatencyMs}ms` : ''}
                        </div>
                      )}
                    </Card>
                    {msg.role === 'USER' && (
                      <div className="shrink-0 rounded-full bg-foreground/10 p-2 h-8 w-8 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input area */}
          <div className="border-t border-border p-4">
            <div className="max-w-3xl mx-auto flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Digite sua pergunta ou comando..."
                className="flex-1"
                disabled={sendMessage.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || sendMessage.isPending}
                size="icon"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
