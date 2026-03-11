'use client';

import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface DashboardCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
  hoverBg: string;
  permission?: string;
  countKey?: string;
}

export interface DashboardSection {
  title: string;
  cards: DashboardCard[];
}

export interface PageDashboardSectionsProps {
  sections: DashboardSection[];
  counts: Record<string, number | null>;
  countsLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

function CountBadge({
  count,
  loading,
}: {
  count: number | null | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="h-6 w-12 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
    );
  }

  if (count === null || count === undefined) return null;

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70">
      {count.toLocaleString('pt-BR')}
    </span>
  );
}

/**
 * Componente PageDashboardSections reutilizável
 *
 * Renderiza seções de cards do dashboard com:
 * - Filtragem de permissões
 * - Contadores de itens
 * - Grid responsivo
 * - Cards com animações
 *
 * @example
 * <PageDashboardSections
 *   sections={sections}
 *   counts={counts}
 *   countsLoading={countsLoading}
 *   hasPermission={hasPermission}
 * />
 */
export function PageDashboardSections({
  sections,
  counts,
  countsLoading,
  hasPermission,
}: PageDashboardSectionsProps) {
  return (
    <>
      {sections.map(section => {
        const visibleCards = section.cards.filter(
          card => !card.permission || hasPermission(card.permission)
        );

        if (visibleCards.length === 0) return null;

        return (
          <div key={section.title}>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleCards.map(card => (
                <div key={card.id}>
                  <Link href={card.href}>
                    <Card
                      aria-label={
                        card.countKey && counts[card.countKey] != null
                          ? `${card.title} - ${counts[card.countKey]!.toLocaleString('pt-BR')} registros`
                          : card.title
                      }
                      className={`p-3 sm:p-4 md:p-6 h-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 transition-all group ${card.hoverBg}`}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-2 sm:mb-3 md:mb-4">
                          <div
                            className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl bg-linear-to-br ${card.gradient} flex items-center justify-center`}
                          >
                            <card.icon className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                          </div>
                          {card.countKey && (
                            <CountBadge
                              count={counts[card.countKey]}
                              loading={countsLoading}
                            />
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-0.5 sm:mb-1 flex items-center gap-2">
                          {card.title}
                          <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-white/60">
                          {card.description}
                        </p>
                      </div>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
