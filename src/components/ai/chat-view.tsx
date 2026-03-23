'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiChatService } from '@/services/ai';
import { useAuth } from '@/contexts/auth-context';
import { AiEmptyState } from './empty-state';
import { AiMessageBubble } from './message-bubble';
import { AiChatInput } from './chat-input';

import { toast } from 'sonner';
import type { AiMessage } from '@/types/ai';

interface AiChatViewProps {
  selectedConversationId: string | null;
  onConversationCreated: (id: string) => void;
}

export function AiChatView({
  selectedConversationId,
  onConversationCreated,
}: AiChatViewProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userInitial =
    user?.profile?.name?.charAt(0)?.toUpperCase() ??
    user?.username?.charAt(0)?.toUpperCase() ??
    'U';
  const [inputValue, setInputValue] = useState('');
  const [localMessages, setLocalMessages] = useState<AiMessage[]>([]);
  const [failedMessageId, setFailedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationDetail } = useQuery({
    queryKey: ['ai', 'conversation', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return null;
      return aiChatService.getConversation(selectedConversationId, {
        limit: 100,
      });
    },
    enabled: !!selectedConversationId,
  });

  const allMessages = selectedConversationId
    ? [
        ...(conversationDetail?.messages ?? []),
        ...localMessages.filter(
          lm =>
            !conversationDetail?.messages?.some(
              (m: AiMessage) => m.id === lm.id
            )
        ),
      ]
    : localMessages;

  const sendMessage = useMutation({
    mutationFn: aiChatService.sendMessage,
    onSuccess: data => {
      setFailedMessageId(null);
      onConversationCreated(data.conversationId);
      // Clear ALL local messages — server query will bring the real ones
      setLocalMessages([]);
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
      queryClient.invalidateQueries({
        queryKey: ['ai', 'conversation', data.conversationId],
      });
    },
    onError: () => {
      setLocalMessages(prev => prev.filter(m => m.contentType !== 'LOADING'));
      const lastUserMsg = localMessages.findLast(m => m.role === 'USER');
      if (lastUserMsg) setFailedMessageId(lastUserMsg.id);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    },
  });

  const handleSend = useCallback(
    (overrideContent?: string) => {
      const content = (overrideContent ?? inputValue).trim();
      if (!content || sendMessage.isPending) return;

      setInputValue('');
      setFailedMessageId(null);

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

      setLocalMessages(prev => [
        ...prev,
        optimisticUserMsg,
        optimisticLoadingMsg,
      ]);

      sendMessage.mutate({
        conversationId: selectedConversationId ?? undefined,
        content,
      });
    },
    [inputValue, selectedConversationId, sendMessage]
  );

  useEffect(() => {
    setLocalMessages([]);
    setFailedMessageId(null);
  }, [selectedConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const hasMessages = allMessages.length > 0;

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!hasMessages ? (
          <AiEmptyState onSendSuggestion={text => handleSend(text)} />
        ) : (
          <div className="max-w-[720px] mx-auto py-6 px-4 space-y-6">
            {allMessages.map(msg => (
              <AiMessageBubble
                key={msg.id}
                message={msg}
                userInitial={userInitial}
                hasError={msg.id === failedMessageId}
                onRetry={
                  msg.id === failedMessageId
                    ? () => handleSend(msg.content ?? '')
                    : undefined
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="shrink-0">
        <AiChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={() => handleSend()}
          isPending={sendMessage.isPending}
        />
      </div>
    </div>
  );
}
