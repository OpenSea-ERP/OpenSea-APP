'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { portalService } from '@/services/hr';
import type { CompanyAnnouncement, AnnouncementPriority } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  ChevronUp,
  Info,
  Megaphone,
} from 'lucide-react';
import { useState } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

const PRIORITY_CONFIG: Record<
  AnnouncementPriority,
  {
    label: string;
    icon: React.ReactNode;
    borderClass: string;
    badgeClass: string;
    bgClass: string;
  }
> = {
  URGENT: {
    label: 'Urgente',
    icon: <AlertTriangle className="h-4 w-4" />,
    borderClass: 'border-rose-300 dark:border-rose-500/40',
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300',
    bgClass: 'bg-rose-50/50 dark:bg-rose-500/5',
  },
  IMPORTANT: {
    label: 'Importante',
    icon: <Info className="h-4 w-4" />,
    borderClass: 'border-amber-300 dark:border-amber-500/40',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
    bgClass: 'bg-amber-50/50 dark:bg-amber-500/5',
  },
  NORMAL: {
    label: 'Normal',
    icon: <Bell className="h-4 w-4" />,
    borderClass: 'border-gray-200 dark:border-white/10',
    badgeClass: 'bg-gray-50 text-gray-700 dark:bg-white/8 dark:text-gray-300',
    bgClass: 'bg-white/95 dark:bg-white/5',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function AnnouncementsTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['portal-announcements'],
    queryFn: async () => {
      const response = await portalService.listAnnouncements({ perPage: 50 });
      return response.announcements;
    },
  });

  // Sort: URGENT first, then IMPORTANT, then NORMAL, then by date desc
  const sortedAnnouncements = (announcementsData || []).sort((a, b) => {
    const priorityOrder: Record<AnnouncementPriority, number> = {
      URGENT: 0,
      IMPORTANT: 1,
      NORMAL: 2,
    };
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-60 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </Card>
        ))}
      </div>
    );
  }

  if (sortedAnnouncements.length === 0) {
    return (
      <Card className="p-12 text-center bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-lg font-medium mb-1">Nenhum comunicado</p>
        <p className="text-sm text-muted-foreground">
          Nao ha comunicados ativos no momento
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold">Comunicados</h3>
        <p className="text-sm text-muted-foreground">
          Comunicados e avisos da empresa
        </p>
      </div>

      <div className="space-y-3">
        {sortedAnnouncements.map((announcement: CompanyAnnouncement) => {
          const config = PRIORITY_CONFIG[announcement.priority];
          const isExpanded = expandedId === announcement.id;
          const isLongContent = announcement.content.length > 200;

          return (
            <Card
              key={announcement.id}
              className={`p-4 border ${config.borderClass} ${config.bgClass} transition-colors`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm">
                      {announcement.title}
                    </h4>
                    <Badge
                      variant="outline"
                      className={`text-xs border-0 ${config.badgeClass}`}
                    >
                      {config.label}
                    </Badge>
                  </div>

                  <div
                    className={`mt-2 text-sm text-muted-foreground whitespace-pre-wrap ${
                      !isExpanded && isLongContent ? 'line-clamp-3' : ''
                    }`}
                  >
                    {announcement.content}
                  </div>

                  {isLongContent && (
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : announcement.id)
                      }
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          Recolher
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          Ler mais
                        </>
                      )}
                    </button>
                  )}

                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span>
                      {new Date(announcement.publishedAt).toLocaleDateString(
                        'pt-BR',
                        {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        }
                      )}
                    </span>
                    {announcement.authorEmployee && (
                      <span>
                        por {announcement.authorEmployee.fullName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
