'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Bot,
  MessageSquare,
  Lightbulb,
  Star,
  Activity,
  Settings,
  History,
} from 'lucide-react';

export type AiView = 'chat' | 'insights' | 'favorites' | 'actions' | 'settings';

interface AiHeroBannerProps {
  activeView: AiView;
  onViewChange: (view: AiView) => void;
  onOpenConversations: () => void;
}

const VIEW_BUTTONS: {
  id: AiView;
  label: string;
  icon: React.ElementType;
  gradient: string;
}[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    gradient: 'from-violet-500 to-violet-600',
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: Lightbulb,
    gradient: 'from-teal-500 to-teal-600',
  },
  {
    id: 'favorites',
    label: 'Favoritos',
    icon: Star,
    gradient: 'from-cyan-500 to-cyan-600',
  },
  {
    id: 'actions',
    label: 'Ações',
    icon: Activity,
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    gradient: 'from-slate-500 to-slate-600',
  },
];

export function AiHeroBanner({
  activeView,
  onViewChange,
  onOpenConversations,
}: AiHeroBannerProps) {
  return (
    <Card className="relative overflow-hidden p-8 md:p-12 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Atlas
          </h1>
        </div>

        <p className="text-lg text-gray-600 dark:text-white/60 mb-6">
          Assistente inteligente com IA para análise de dados e automação do
          sistema.
        </p>

        <div className="flex flex-wrap gap-3">
          {VIEW_BUTTONS.map(btn => {
            const isActive = activeView === btn.id;
            return (
              <Button
                key={btn.id}
                onClick={() => onViewChange(btn.id)}
                className={cn(
                  'gap-2 text-white bg-gradient-to-r hover:opacity-90 transition-all',
                  btn.gradient,
                  isActive
                    ? 'ring-2 ring-white/40 opacity-100'
                    : 'opacity-70 hover:opacity-100'
                )}
              >
                <btn.icon className="h-4 w-4" />
                {btn.label}
              </Button>
            );
          })}

          <Button
            variant="outline"
            onClick={onOpenConversations}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            Conversas anteriores
          </Button>
        </div>
      </div>
    </Card>
  );
}
