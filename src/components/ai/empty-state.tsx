// src/components/ai/empty-state.tsx
'use client';

import { Bot } from 'lucide-react';

interface AiEmptyStateProps {
  onSendSuggestion: (text: string) => void;
}

const SUGGESTIONS = [
  { icon: '📦', text: 'Quantos produtos tenho cadastrados?' },
  { icon: '💰', text: 'Resumo financeiro do mês' },
  { icon: '👥', text: 'Funcionários ativos no sistema' },
  { icon: '📋', text: 'Pedidos em aberto' },
  { icon: '📊', text: 'Movimentações de estoque recentes' },
  { icon: '🏢', text: 'Resumo geral da empresa' },
];

export function AiEmptyState({ onSendSuggestion }: AiEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
        <Bot className="h-8 w-8 text-white" />
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        Olá! Sou o Atlas.
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Como posso ajudar você hoje? Pergunte sobre seus dados, solicite
        relatórios ou peça ajuda para navegar pelo sistema.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg">
        {SUGGESTIONS.map(suggestion => (
          <button
            key={suggestion.text}
            onClick={() => onSendSuggestion(suggestion.text)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800/60 border border-border hover:border-violet-300 dark:hover:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/5 transition-colors text-left group"
          >
            <span className="text-base">{suggestion.icon}</span>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
              {suggestion.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
