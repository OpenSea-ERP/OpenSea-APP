'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Bot,
  MessageSquare,
  Lightbulb,
  Star,
  Activity,
  Settings,
} from 'lucide-react';

export type AiView = 'chat' | 'insights' | 'favorites' | 'actions' | 'settings';

interface AiHeroBannerProps {
  activeView: AiView;
  onViewChange: (view: AiView) => void;
}

const VIEW_TABS: {
  id: AiView;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'favorites', label: 'Favoritos', icon: Star },
  { id: 'actions', label: 'Ações', icon: Activity },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export function AiHeroBanner({
  activeView,
  onViewChange,
}: AiHeroBannerProps) {
  return (
    <Card className="relative overflow-hidden px-5 py-4 bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 shrink-0">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-violet-500/10 rounded-full opacity-60 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full opacity-60 translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                Atlas
              </h1>
              <p className="text-sm text-slate-500 dark:text-white/60">
                Assistente inteligente com IA para análise de dados e automação
              </p>
            </div>
          </div>
        </div>

        {/* View toggle toolbar (same pattern as tasks board) */}
        <div className="bg-muted/30 dark:bg-white/5 rounded-md px-3 py-2">
          <div className="flex items-center gap-0.5">
            {VIEW_TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeView === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors relative',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => onViewChange(id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
