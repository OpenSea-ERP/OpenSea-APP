'use client';

import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { portalService } from '@/services/hr';
import type { OnboardingChecklist, OnboardingChecklistItem } from '@/types/hr';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Laptop,
  PartyPopper,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  DOCUMENTATION: {
    label: 'Documentacao',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-blue-600 dark:text-blue-400',
  },
  TRAINING: {
    label: 'Treinamentos',
    icon: <BookOpen className="h-4 w-4" />,
    color: 'text-emerald-600 dark:text-emerald-400',
  },
  COMPANY_INTRO: {
    label: 'Conhecendo a Empresa',
    icon: <Laptop className="h-4 w-4" />,
    color: 'text-violet-600 dark:text-violet-400',
  },
  SETTINGS: {
    label: 'Configuracoes',
    icon: <Settings className="h-4 w-4" />,
    color: 'text-amber-600 dark:text-amber-400',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function OnboardingTab() {
  const queryClient = useQueryClient();

  const { data: onboarding, isLoading } = useQuery<OnboardingChecklist | null>({
    queryKey: ['my-onboarding'],
    queryFn: async () => {
      try {
        const response = await portalService.getMyOnboarding();
        return response.onboarding;
      } catch {
        return null;
      }
    },
  });

  const completeMutation = useMutation({
    mutationFn: (itemId: string) =>
      portalService.completeOnboardingItem(itemId),
    onSuccess: () => {
      toast.success('Item concluido!');
      queryClient.invalidateQueries({ queryKey: ['my-onboarding'] });
    },
    onError: () => {
      toast.error('Erro ao marcar item como concluido');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-60" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!onboarding || !onboarding.items || onboarding.items.length === 0) {
    return null; // Don't show tab content if no onboarding
  }

  const progress = onboarding.progress;
  const isComplete = progress === 100;

  // Group items by category
  const groupedItems = onboarding.items.reduce(
    (acc, item) => {
      const cat = item.category || 'DOCUMENTATION';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, OnboardingChecklistItem[]>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Onboarding</h3>
        <p className="text-sm text-muted-foreground">
          Complete as etapas de integracao na empresa
        </p>
      </div>

      {/* Progress */}
      <Card className="p-5 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progresso Geral</span>
          <span className="text-sm font-semibold">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isComplete
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                : 'bg-gradient-to-r from-violet-400 to-violet-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {onboarding.items.filter(i => i.completed).length} de{' '}
          {onboarding.items.length} etapas concluidas
        </div>
      </Card>

      {/* Completion celebration */}
      {isComplete && (
        <Card className="p-6 text-center border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5">
          <PartyPopper className="h-12 w-12 mx-auto mb-3 text-emerald-500" />
          <h4 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
            Parabens! Onboarding Completo!
          </h4>
          <p className="text-sm text-emerald-600 dark:text-emerald-300 mt-1">
            Voce completou todas as etapas de integracao. Bem-vindo a equipe!
          </p>
        </Card>
      )}

      {/* Checklist by Category */}
      {Object.entries(groupedItems).map(([categoryKey, items]) => {
        const config = CATEGORY_CONFIG[categoryKey] || CATEGORY_CONFIG.DOCUMENTATION;
        const completedCount = items.filter(i => i.completed).length;

        return (
          <Card
            key={categoryKey}
            className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={config.color}>{config.icon}</span>
              <h4 className="font-semibold text-sm">{config.label}</h4>
              <span className="ml-auto text-xs text-muted-foreground">
                {completedCount}/{items.length}
              </span>
            </div>

            <div className="space-y-2">
              {items.map(item => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    item.completed
                      ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
                      : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <Checkbox
                    checked={item.completed}
                    disabled={item.completed || completeMutation.isPending}
                    onCheckedChange={() => {
                      if (!item.completed) {
                        completeMutation.mutate(item.id);
                      }
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        item.completed
                          ? 'line-through text-muted-foreground'
                          : ''
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    )}
                    {item.completed && item.completedAt && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        Concluido em{' '}
                        {new Date(item.completedAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
