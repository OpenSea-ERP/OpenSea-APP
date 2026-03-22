'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiChatService } from '@/services/ai';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, Pin, Archive, Loader2 } from 'lucide-react';
import type { AiConversation } from '@/types/ai';

interface AiConversationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
}

export function AiConversationsDrawer({
  open,
  onOpenChange,
  selectedConversationId,
  onSelectConversation,
}: AiConversationsDrawerProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['ai', 'conversations'],
    queryFn: async () => {
      const response = await aiChatService.listConversations({ limit: 50 });
      return response.conversations;
    },
    enabled: open,
  });

  const archiveMutation = useMutation({
    mutationFn: aiChatService.archiveConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
    },
  });

  const conversations = data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c: AiConversation) => c.title?.toLowerCase().includes(q) ?? false
    );
  }, [conversations, search]);

  const handleSelect = (id: string) => {
    onSelectConversation(id);
    onOpenChange(false);
  };

  const handleNew = () => {
    onSelectConversation(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] sm:w-[420px] flex flex-col">
        <SheetHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <SheetTitle>Conversas</SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {conversations.length} conversa
              {conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Nova
          </Button>
        </SheetHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar conversas..."
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-auto -mx-2 px-2 space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              {search
                ? 'Nenhuma conversa encontrada.'
                : 'Nenhuma conversa ainda.'}
            </p>
          ) : (
            filtered.map((conv: AiConversation) => {
              const isActive = conv.id === selectedConversationId;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelect(conv.id)}
                  className={cn(
                    'w-full text-left rounded-lg px-3 py-3 transition-colors group',
                    isActive
                      ? 'bg-violet-100 dark:bg-violet-500/10 border border-violet-300 dark:border-violet-500/25'
                      : 'hover:bg-accent/50 border border-transparent'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        'text-sm font-medium truncate',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {conv.isPinned && (
                        <Pin className="h-3 w-3 text-violet-500 inline mr-1.5" />
                      )}
                      {conv.title ?? 'Conversa sem título'}
                    </span>
                    {isActive && (
                      <span className="text-[9px] text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/15 px-2 py-0.5 rounded-full font-medium">
                        ativa
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                    <span>
                      {conv.messageCount} msg
                      {conv.messageCount !== 1 ? 's' : ''}
                    </span>
                    {conv.lastMessageAt && (
                      <span>
                        {formatDistanceToNow(new Date(conv.lastMessageAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    )}
                  </div>

                  {!isActive && (
                    <div className="hidden group-hover:flex justify-end mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-muted-foreground"
                        onClick={e => {
                          e.stopPropagation();
                          archiveMutation.mutate(conv.id);
                        }}
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        Arquivar
                      </Button>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
