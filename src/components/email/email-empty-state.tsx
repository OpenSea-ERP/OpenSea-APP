'use client';

import { Button } from '@/components/ui/button';
import { Mail, Plus } from 'lucide-react';

interface EmailEmptyStateProps {
  onAddAccount: () => void;
}

/**
 * Full-body empty state shown when no email accounts are configured.
 * Replaces the entire 3-panel layout (sidebar + list + display).
 */
export function EmailEmptyState({ onAddAccount }: EmailEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm px-6">
        <div className="size-20 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Mail className="size-10 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            Nenhuma conta de e-mail configurada
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Adicione sua primeira conta de e-mail para começar a enviar e
            receber mensagens diretamente pelo sistema.
          </p>
        </div>

        <Button onClick={onAddAccount} className="gap-2 rounded-xl mt-1">
          <Plus className="size-4" />
          Adicionar conta
        </Button>
      </div>
    </div>
  );
}
