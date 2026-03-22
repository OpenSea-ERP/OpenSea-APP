// src/components/ai/chat-input.tsx
'use client';

import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Paperclip } from 'lucide-react';

interface AiChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isPending: boolean;
}

export function AiChatInput({
  value,
  onChange,
  onSend,
  isPending,
}: AiChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  return (
    <div className="border-t border-border p-4">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-end gap-2 bg-muted border border-border rounded-xl px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            disabled
            title="Anexos (em breve)"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte algo ao Atlas..."
            disabled={isPending}
            rows={1}
            className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground py-1.5 max-h-40"
          />

          <Button
            size="icon"
            onClick={onSend}
            disabled={!value.trim() || isPending}
            className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-sm"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
