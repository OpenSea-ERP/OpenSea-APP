'use client';

/**
 * Who's Out Widget
 *
 * Inspirado no BambooHR "Who's Out" — mostra colaboradores em férias ou
 * afastamento nos próximos 14 dias. Renderiza no hub /hr.
 */

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { absencesService } from '@/services/hr/absences.service';
import { vacationsService } from '@/services/hr/vacations.service';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  CalendarOff,
  PalmtreeIcon,
  UserX,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

interface OutItem {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'VACATION' | 'ABSENCE';
  subtype?: string | null;
  startDate: string;
  endDate: string;
}

function formatDateBR(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

function getDaysAway(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
}

const ABSENCE_TYPE_LABEL: Record<string, string> = {
  SICK_LEAVE: 'Atestado médico',
  MATERNITY: 'Licença-maternidade',
  PATERNITY: 'Licença-paternidade',
  BEREAVEMENT: 'Falecimento',
  MARRIAGE: 'Casamento',
  STUDY: 'Estudo',
  PERSONAL: 'Particular',
  VACATION: 'Férias',
  OTHER: 'Outro',
};

function getAbsenceTone(subtype?: string | null) {
  switch (subtype) {
    case 'SICK_LEAVE':
      return {
        bg: 'bg-rose-50 dark:bg-rose-500/10',
        text: 'text-rose-700 dark:text-rose-300',
        icon: CalendarOff,
      };
    case 'MATERNITY':
    case 'PATERNITY':
      return {
        bg: 'bg-violet-50 dark:bg-violet-500/10',
        text: 'text-violet-700 dark:text-violet-300',
        icon: UserX,
      };
    default:
      return {
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        text: 'text-amber-700 dark:text-amber-300',
        icon: CalendarOff,
      };
  }
}

export function WhosOutWidget() {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const horizon = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  }, []);

  const { data: absencesData, isLoading: absLoading } = useQuery({
    queryKey: ['hr-whos-out-absences', today, horizon],
    queryFn: () =>
      absencesService.list({
        startDate: today,
        endDate: horizon,
        status: 'APPROVED',
        perPage: 50,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: vacationsData, isLoading: vacLoading } = useQuery({
    queryKey: ['hr-whos-out-vacations', today, horizon],
    queryFn: () =>
      vacationsService.list({
        status: 'SCHEDULED',
        perPage: 50,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const employeeIds = useMemo(() => {
    const ids: string[] = [];
    for (const a of absencesData?.absences ?? []) ids.push(a.employeeId);
    for (const v of vacationsData?.vacationPeriods ?? []) ids.push(v.employeeId);
    return ids;
  }, [absencesData, vacationsData]);

  const { getName } = useEmployeeMap(employeeIds);

  const items = useMemo<OutItem[]>(() => {
    const list: OutItem[] = [];

    for (const a of absencesData?.absences ?? []) {
      list.push({
        id: a.id,
        employeeId: a.employeeId,
        employeeName: getName(a.employeeId),
        type: 'ABSENCE',
        subtype: a.type,
        startDate: a.startDate,
        endDate: a.endDate,
      });
    }

    for (const v of vacationsData?.vacationPeriods ?? []) {
      const start = v.scheduledStart ?? v.concessionStart;
      const end = v.scheduledEnd ?? v.concessionEnd;
      if (!start || !end) continue;
      const startWithinHorizon = new Date(start) <= new Date(horizon);
      const endAfterToday = new Date(end) >= new Date(today);
      if (!startWithinHorizon || !endAfterToday) continue;

      list.push({
        id: v.id,
        employeeId: v.employeeId,
        employeeName: getName(v.employeeId),
        type: 'VACATION',
        subtype: 'VACATION',
        startDate: start,
        endDate: end,
      });
    }

    return list
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      )
      .slice(0, 8);
  }, [absencesData, vacationsData, today, horizon, getName]);

  const isLoading = absLoading || vacLoading;

  return (
    <Card
      className="bg-white/5 p-5 space-y-4"
      data-testid="hr-whos-out-widget"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-amber-500 to-rose-500 text-white">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Quem está fora</h3>
            <p className="text-xs text-muted-foreground">
              Próximos 14 dias — férias e afastamentos confirmados
            </p>
          </div>
        </div>
        <Link
          href="/hr/vacations"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver todos →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            Ninguém estará fora nos próximos 14 dias.
          </p>
        </div>
      ) : (
        <ul
          className="space-y-2"
          data-testid="hr-whos-out-list"
        >
          {items.map(item => {
            const tone =
              item.type === 'VACATION'
                ? {
                    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
                    text: 'text-emerald-700 dark:text-emerald-300',
                    icon: PalmtreeIcon,
                  }
                : getAbsenceTone(item.subtype);
            const Icon = tone.icon;
            const days = getDaysAway(item.startDate, item.endDate);
            const label =
              item.type === 'VACATION'
                ? 'Férias'
                : ABSENCE_TYPE_LABEL[item.subtype ?? 'OTHER'] ?? 'Afastamento';

            return (
              <li
                key={`${item.type}-${item.id}`}
                data-testid="hr-whos-out-item"
                className="flex items-center gap-3 rounded-lg border border-border bg-card/50 px-3 py-2"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.bg} ${tone.text}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/hr/employees/${item.employeeId}`}
                    className="text-sm font-medium hover:underline truncate block"
                  >
                    {item.employeeName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {label} · {formatDateBR(item.startDate)} →{' '}
                    {formatDateBR(item.endDate)} ({days}{' '}
                    {days === 1 ? 'dia' : 'dias'})
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
