'use client';

import { useQuery } from '@tanstack/react-query';
import {
  employeesService,
  timeControlService,
  timeBankService,
  overtimeService,
  absencesService,
  vacationsService,
} from '@/services/hr';
import type { Employee, TimeEntry, TimeBank, Overtime, Absence } from '@/types/hr';

// ============================================================================
// TYPES
// ============================================================================

export interface AttendanceEmployee {
  id: string;
  name: string;
  department: string | null;
  clockInTime: string | null;
  clockOutTime: string | null;
  lateMinutes: number;
  status: 'present' | 'late' | 'absent';
  scheduledStart: string | null;
}

export interface AttendanceData {
  // KPIs
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;

  // Employee lists
  presentEmployees: AttendanceEmployee[];
  lateEmployees: AttendanceEmployee[];
  absentEmployees: AttendanceEmployee[];

  // Pending approvals
  pendingOvertime: number;
  pendingAbsences: number;
  pendingVacations: number;

  // Time bank summary
  positiveBankCount: number;
  negativeBankCount: number;
  zeroBankCount: number;

  // Recent entries
  recentEntries: {
    employeeName: string;
    type: string;
    timestamp: string;
  }[];
}

// ============================================================================
// HELPERS
// ============================================================================

function getTodayISO(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getDefaultScheduleStart(): Date {
  const today = new Date();
  today.setHours(8, 0, 0, 0);
  return today;
}

function minutesDiff(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 60000);
}

function buildEmployeeMap(employees: Employee[]): Map<string, Employee> {
  const map = new Map<string, Employee>();
  for (const emp of employees) {
    map.set(emp.id, emp);
  }
  return map;
}

// ============================================================================
// AGGREGATION
// ============================================================================

function aggregate(
  employees: Employee[],
  todayEntries: TimeEntry[],
  timeBanks: TimeBank[],
  overtimeList: Overtime[],
  absences: Absence[],
  pendingVacationsCount: number
): AttendanceData {
  const activeEmployees = employees.filter(
    (e) => e.status !== 'TERMINATED' && e.status !== 'INACTIVE'
  );
  const employeeMap = buildEmployeeMap(activeEmployees);

  // Group today's entries by employee
  const entriesByEmployee = new Map<string, TimeEntry[]>();
  for (const entry of todayEntries) {
    const list = entriesByEmployee.get(entry.employeeId) ?? [];
    list.push(entry);
    entriesByEmployee.set(entry.employeeId, list);
  }

  // Default schedule start: 08:00
  const scheduleStart = getDefaultScheduleStart();
  const TOLERANCE_MINUTES = 10;

  const presentEmployees: AttendanceEmployee[] = [];
  const lateEmployees: AttendanceEmployee[] = [];
  const absentEmployees: AttendanceEmployee[] = [];

  for (const emp of activeEmployees) {
    const entries = entriesByEmployee.get(emp.id) ?? [];
    const clockIns = entries
      .filter((e) => e.entryType === 'CLOCK_IN')
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    const clockOuts = entries
      .filter((e) => e.entryType === 'CLOCK_OUT')
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    const department = emp.department?.name ?? null;

    if (clockIns.length > 0) {
      const firstClockIn = new Date(clockIns[0].timestamp);
      const lastClockOut =
        clockOuts.length > 0 ? clockOuts[0].timestamp : null;
      const late = minutesDiff(firstClockIn, scheduleStart);

      const row: AttendanceEmployee = {
        id: emp.id,
        name: emp.socialName ?? emp.fullName,
        department,
        clockInTime: clockIns[0].timestamp,
        clockOutTime: lastClockOut,
        lateMinutes: Math.max(0, late),
        status: late > TOLERANCE_MINUTES ? 'late' : 'present',
        scheduledStart: scheduleStart.toISOString(),
      };

      if (row.status === 'late') {
        lateEmployees.push(row);
      } else {
        presentEmployees.push(row);
      }
    } else {
      // Check if employee has an active absence today
      const today = getTodayISO();
      const hasAbsence = absences.some(
        (a) =>
          a.employeeId === emp.id &&
          (a.status === 'APPROVED' || a.status === 'IN_PROGRESS') &&
          a.startDate <= today &&
          a.endDate >= today
      );

      if (!hasAbsence) {
        absentEmployees.push({
          id: emp.id,
          name: emp.socialName ?? emp.fullName,
          department,
          clockInTime: null,
          clockOutTime: null,
          lateMinutes: 0,
          status: 'absent',
          scheduledStart: scheduleStart.toISOString(),
        });
      }
    }
  }

  // Sort: present by clock-in time, late by minutes desc, absent by name
  presentEmployees.sort((a, b) => {
    if (!a.clockInTime || !b.clockInTime) return 0;
    return (
      new Date(a.clockInTime).getTime() - new Date(b.clockInTime).getTime()
    );
  });
  lateEmployees.sort((a, b) => b.lateMinutes - a.lateMinutes);
  absentEmployees.sort((a, b) => a.name.localeCompare(b.name));

  // Pending approvals
  const pendingOvertime = overtimeList.filter(
    (o) => o.approved === null
  ).length;
  const pendingAbsences = absences.filter(
    (a) => a.status === 'PENDING'
  ).length;

  // Time bank summary
  let positiveBankCount = 0;
  let negativeBankCount = 0;
  let zeroBankCount = 0;
  for (const tb of timeBanks) {
    if (tb.balance > 0) positiveBankCount++;
    else if (tb.balance < 0) negativeBankCount++;
    else zeroBankCount++;
  }

  // Recent entries (last 20, sorted by timestamp desc)
  const recentEntries = [...todayEntries]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 20)
    .map((entry) => ({
      employeeName:
        employeeMap.get(entry.employeeId)?.fullName ??
        entry.employeeId.slice(0, 8),
      type: entry.entryType,
      timestamp: entry.timestamp,
    }));

  return {
    totalEmployees: activeEmployees.length,
    presentToday: presentEmployees.length,
    lateToday: lateEmployees.length,
    absentToday: absentEmployees.length,
    presentEmployees,
    lateEmployees,
    absentEmployees,
    pendingOvertime,
    pendingAbsences,
    pendingVacations: pendingVacationsCount,
    positiveBankCount,
    negativeBankCount,
    zeroBankCount,
    recentEntries,
  };
}

// ============================================================================
// FETCH
// ============================================================================

async function fetchAttendanceData(): Promise<AttendanceData> {
  const today = getTodayISO();
  const currentYear = new Date().getFullYear();

  const [
    employeesResult,
    entriesResult,
    timeBanksResult,
    overtimeResult,
    absencesResult,
    vacationsResult,
  ] = await Promise.allSettled([
    employeesService.listEmployees({ page: 1, perPage: 200 }),
    timeControlService.listTimeEntries({
      startDate: today,
      endDate: today,
      perPage: 500,
    }),
    timeBankService.list({ year: currentYear }),
    overtimeService.list({ perPage: 100 }),
    absencesService.list({ perPage: 200 }),
    vacationsService.list({ status: 'SCHEDULED', perPage: 100 }),
  ]);

  const employees =
    employeesResult.status === 'fulfilled'
      ? employeesResult.value.employees
      : [];
  const entries =
    entriesResult.status === 'fulfilled'
      ? entriesResult.value.timeEntries
      : [];
  const timeBanks =
    timeBanksResult.status === 'fulfilled'
      ? timeBanksResult.value.timeBanks
      : [];
  const overtime =
    overtimeResult.status === 'fulfilled'
      ? overtimeResult.value.overtime
      : [];
  const absences =
    absencesResult.status === 'fulfilled'
      ? absencesResult.value.absences
      : [];
  const pendingVacations =
    vacationsResult.status === 'fulfilled'
      ? vacationsResult.value.vacationPeriods.filter(
          (v) => v.status === 'SCHEDULED' || v.status === 'PENDING'
        ).length
      : 0;

  return aggregate(
    employees,
    entries,
    timeBanks,
    overtime,
    absences,
    pendingVacations
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useAttendanceData() {
  return useQuery({
    queryKey: ['hr', 'attendance-overview'],
    queryFn: fetchAttendanceData,
    staleTime: 2 * 60 * 1000, // 2 min
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
    refetchOnWindowFocus: true,
  });
}
