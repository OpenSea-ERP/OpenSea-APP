'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useState, type ComponentType, type ReactNode } from 'react';

/**
 * CollapsibleSection — Card-based collapsible form section.
 *
 * Padrão visual compartilhado em todo o app para seções de formulário com
 * cabeçalho (ícone + título + subtítulo) e conteúdo colapsável. Substitui as
 * cópias locais anteriormente duplicadas em `finance/settings/page.tsx` e
 * `finance/fiscal/config/page.tsx`.
 *
 * Exemplo:
 * ```tsx
 * <CollapsibleSection
 *   icon={Download}
 *   title="Exportação"
 *   subtitle="Preferências de exportação de relatórios"
 * >
 *   <Form />
 * </CollapsibleSection>
 * ```
 */
export interface CollapsibleSectionProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  /** Tonalidade do badge do ícone. Default: violet. */
  accent?: 'violet' | 'sky' | 'emerald' | 'amber' | 'rose' | 'teal' | 'slate';
  /** Classes adicionais aplicadas ao Card raiz. */
  className?: string;
  /** Classes adicionais aplicadas ao CardContent. */
  bodyClassName?: string;
  children: ReactNode;
}

const ACCENT_CLASSES: Record<
  NonNullable<CollapsibleSectionProps['accent']>,
  { bg: string; text: string }
> = {
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-500/8',
    text: 'text-violet-700 dark:text-violet-300',
  },
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-500/8',
    text: 'text-sky-700 dark:text-sky-300',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/8',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-500/8',
    text: 'text-amber-700 dark:text-amber-300',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-500/8',
    text: 'text-rose-700 dark:text-rose-300',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-500/8',
    text: 'text-teal-700 dark:text-teal-300',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-500/8',
    text: 'text-slate-700 dark:text-slate-300',
  },
};

export function CollapsibleSection({
  icon: Icon,
  title,
  subtitle,
  defaultOpen = true,
  accent = 'violet',
  className,
  bodyClassName,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const accentClasses = ACCENT_CLASSES[accent];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card
        className={cn(
          'bg-white dark:bg-slate-800/60 border border-border',
          className
        )}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none hover:bg-muted/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex items-center justify-center h-9 w-9 rounded-lg',
                    accentClasses.bg
                  )}
                >
                  <Icon className={cn('h-4 w-4', accentClasses.text)} />
                </div>
                <div>
                  <p className="text-base font-semibold leading-tight">
                    {title}
                  </p>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className={cn('pt-0', bodyClassName)}>
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
