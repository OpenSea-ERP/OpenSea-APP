'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useCreateCard } from '@/hooks/tasks/use-cards';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardInlineCreateProps {
  boardId: string;
  columnId: string;
}

export function CardInlineCreate({ boardId, columnId }: CardInlineCreateProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const createCard = useCreateCard(boardId);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed) {
      setIsAdding(false);
      setTitle('');
      return;
    }

    createCard.mutate(
      { title: trimmed, columnId },
      {
        onSuccess: () => {
          setTitle('');
          inputRef.current?.focus();
        },
        onError: () => toast.error('Erro ao criar cartão'),
      }
    );
  }, [title, columnId, createCard]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        setTitle('');
        setIsAdding(false);
      }
    },
    [handleSubmit]
  );

  if (!isAdding) {
    return (
      <button
        type="button"
        className="flex items-center gap-1.5 w-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:bg-white/5 rounded-md transition-colors"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-4 w-4" />
        Adicionar cartão
      </button>
    );
  }

  return (
    <div className="space-y-1.5 px-1">
      <textarea
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!title.trim()) {
            setIsAdding(false);
          }
        }}
        placeholder="Digite o título do cartão..."
        disabled={createCard.isPending}
        rows={2}
        className={cn(
          'w-full resize-none rounded-lg border bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 px-3 py-2 text-sm',
          'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50'
        )}
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          onClick={handleSubmit}
          disabled={createCard.isPending || !title.trim()}
        >
          Adicionar
        </button>
        <button
          type="button"
          className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => {
            setTitle('');
            setIsAdding(false);
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
