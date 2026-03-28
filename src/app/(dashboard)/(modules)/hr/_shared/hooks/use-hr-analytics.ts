'use client';

import { useQuery } from '@tanstack/react-query';
import {
  employeesService,
  overtimeService,
  absencesService,
  payrollService,
  bonusesService,
  deductionsService,
  vacationsService,
  medicalExamsService,
  terminationsService,
} from '@/services/hr';
import type {
  Employee,
  Overtime,
  Absence,
  Payroll,
  Bonus,
  Deduction,
  VacationPeriod,
  MedicalExam,
  Termination,
} from '@/types/hr';

// ============================================================================
// TYPES
// ============================================================================

export interface ComplianceAlert {
  id: string;
  type: 'medical_exam_expiring' | 'vacation_overdue';
  severity: 'warning' | 'critical';
  employeeId: string;
  employeeName: string;
  description: string;
  detail: string;
  link: string;
}

export interface BirthdayEmployee {
  id: string;
  fullName: string;
  photoUrl?: string | null;
  birthDate: string;
  departmentName: string;
  dayOfMonth: number;
}

export interface ProbationEnding {
  id: string;
  fullName: string;
  hireDate: string;
  departmentName: string;
  daysRemaining: number;
  probationEndDate: string;
}

export interface TurnoverDataPoint {
  month: string;
  rate: number;
  terminations: number;
  avgHeadcount: number;
}

export interface HRAnalyticsData {
  // KPIs
  totalEmployees: number;
  pendingOvertime: number;
  activeAbsences: number;
  currentPayrollNet: number;
  pendingApprovals: number;
  overdueVacations: number;

  // Chart data
  employeesByDepartment: { name: string; count: number }[];
  employeesByContractType: { name: string; count: number }[];
  absencesByType: { name: string; count: number }[];
  payrollTrend: { month: string; bruto: number; liquido: number }[];
  overtimeTrend: { month: string; horas: number; count: number }[];
  bonusesVsDeductions: {
    month: string;
    bonificacoes: number;
    deducoes: number;
  }[];
  turnoverTrend: TurnoverDataPoint[];

  // New widgets data
  complianceAlerts: ComplianceAlert[];
  birthdaysThisMonth: BirthdayEmployee[];
  probationEndings: ProbationEnding[];
}

// ============================================================================
// LABELS
// ============================================================================

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  CLT: 'CLT',
  PJ: 'PJ',
  INTERN: 'Estagiário',
  TEMPORARY: 'Temporário',
  APPRENTICE: 'Aprendiz',
};

const ABSENCE_TYPE_LABELS: Record<string, string> = {
  VACATION: 'Férias',
  SICK_LEAVE: 'Atestado',
  PERSONAL_LEAVE: 'Pessoal',
  MATERNITY_LEAVE: 'Maternidade',
  PATERNITY_LEAVE: 'Paternidade',
  BEREAVEMENT_LEAVE: 'Luto',
  WEDDING_LEAVE: 'Casamento',
  MEDICAL_APPOINTMENT: 'Consulta',
  JURY_DUTY: 'Júri',
  UNPAID_LEAVE: 'S/ Remuneração',
  OTHER: 'Outro',
};

const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

// ============================================================================
// HELPERS
// ============================================================================

function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

function getMonthSortKey(dateStr: string): number {
  const d = new Date(dateStr);
  return d.getFullYear() * 100 + d.getMonth();
}

function getLast6Months(): { key: string; sortKey: number }[] {
  const months: { key: string; sortKey: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      sortKey: d.getFullYear() * 100 + d.getMonth(),
    });
  }
  return months;
}

function daysBetween(d1: Date, d2: Date): number {
  const ms = d2.getTime() - d1.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

// ============================================================================
// AGGREGATION
// ============================================================================

function aggregate(
  employees: Employee[],
  overtime: Overtime[],
  absences: Absence[],
  payrolls: Payroll[],
  bonuses: Bonus[],
  deductions: Deduction[],
  vacationPeriods: VacationPeriod[],
  medicalExams: MedicalExam[],
  terminations: Termination[]
): HRAnalyticsData {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const last6 = getLast6Months();

  // -- KPIs --
  const activeEmployees = employees.filter(
    e => e.status !== 'TERMINATED' && e.status !== 'INACTIVE'
  );
  const pendingOvertime = overtime.filter(o => o.approved === null).length;
  const activeAbsences = absences.filter(
    a => a.status === 'IN_PROGRESS' || a.status === 'APPROVED'
  ).length;
  const currentPayroll = payrolls.find(
    p => p.referenceMonth === currentMonth && p.referenceYear === currentYear
  );

  // -- Pending Approvals (Widget 1) --
  const pendingAbsenceRequests = absences.filter(
    a => a.status === 'PENDING'
  ).length;
  const pendingOvertimeRequests = overtime.filter(
    o => o.approved === null
  ).length;
  const pendingVacationRequests = vacationPeriods.filter(
    v => v.status === 'PENDING'
  ).length;
  const pendingApprovals =
    pendingAbsenceRequests + pendingOvertimeRequests + pendingVacationRequests;

  // -- Compliance Alerts (Widget 2) --
  const complianceAlerts: ComplianceAlert[] = [];
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Medical exams expiring in next 30 days
  const employeeMap = new Map(employees.map(e => [e.id, e]));
  for (const exam of medicalExams) {
    if (!exam.expirationDate) continue;
    const expDate = new Date(exam.expirationDate);
    if (expDate > now && expDate <= thirtyDaysFromNow) {
      const emp = employeeMap.get(exam.employeeId);
      if (!emp || emp.status === 'TERMINATED' || emp.status === 'INACTIVE')
        continue;
      const daysLeft = daysBetween(now, expDate);
      complianceAlerts.push({
        id: `med-${exam.id}`,
        type: 'medical_exam_expiring',
        severity: daysLeft <= 7 ? 'critical' : 'warning',
        employeeId: exam.employeeId,
        employeeName: emp.fullName,
        description: `Exame médico vence em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`,
        detail: `Tipo: ${exam.type} - Vencimento: ${new Date(exam.expirationDate).toLocaleDateString('pt-BR')}`,
        link: `/hr/employees/${exam.employeeId}`,
      });
    }
  }

  // Vacation periods expired (concessionEnd passed without completion)
  const overdueVacationPeriods = vacationPeriods.filter(v => {
    const concessionEnd = new Date(v.concessionEnd);
    return (
      (v.status === 'AVAILABLE' || v.status === 'PENDING') &&
      concessionEnd < now &&
      v.remainingDays > 0
    );
  });

  for (const vp of overdueVacationPeriods) {
    const emp = employeeMap.get(vp.employeeId);
    if (!emp || emp.status === 'TERMINATED' || emp.status === 'INACTIVE')
      continue;
    const daysOverdue = daysBetween(new Date(vp.concessionEnd), now);
    complianceAlerts.push({
      id: `vac-${vp.id}`,
      type: 'vacation_overdue',
      severity: daysOverdue > 60 ? 'critical' : 'warning',
      employeeId: vp.employeeId,
      employeeName: emp.fullName,
      description: `Férias vencidas há ${daysOverdue} dia${daysOverdue !== 1 ? 's' : ''}`,
      detail: `Período aquisitivo: ${new Date(vp.acquisitionStart).toLocaleDateString('pt-BR')} - ${new Date(vp.acquisitionEnd).toLocaleDateString('pt-BR')}`,
      link: `/hr/vacations`,
    });
  }

  // Sort alerts: critical first, then by description
  complianceAlerts.sort((a, b) => {
    if (a.severity !== b.severity)
      return a.severity === 'critical' ? -1 : 1;
    return a.description.localeCompare(b.description);
  });

  // -- Overdue Vacations KPI (Widget 6) --
  const uniqueOverdueEmployees = new Set(
    overdueVacationPeriods
      .filter(vp => {
        const emp = employeeMap.get(vp.employeeId);
        return emp && emp.status !== 'TERMINATED' && emp.status !== 'INACTIVE';
      })
      .map(vp => vp.employeeId)
  );
  const overdueVacations = uniqueOverdueEmployees.size;

  // -- Birthdays This Month (Widget 3) --
  const birthdaysThisMonth: BirthdayEmployee[] = [];
  for (const emp of activeEmployees) {
    if (!emp.birthDate) continue;
    const bd = new Date(emp.birthDate);
    if (bd.getMonth() === now.getMonth()) {
      birthdaysThisMonth.push({
        id: emp.id,
        fullName: emp.fullName,
        photoUrl: emp.photoUrl,
        birthDate: emp.birthDate,
        departmentName: emp.department?.name ?? 'Sem Departamento',
        dayOfMonth: bd.getDate(),
      });
    }
  }
  birthdaysThisMonth.sort((a, b) => a.dayOfMonth - b.dayOfMonth);

  // -- Probation Endings (Widget 4) --
  const probationEndings: ProbationEnding[] = [];
  for (const emp of activeEmployees) {
    const hireDate = new Date(emp.hireDate);
    const probationEnd = new Date(hireDate);
    probationEnd.setDate(probationEnd.getDate() + 90);
    if (probationEnd > now && probationEnd <= thirtyDaysFromNow) {
      const daysRemaining = daysBetween(now, probationEnd);
      probationEndings.push({
        id: emp.id,
        fullName: emp.fullName,
        hireDate: emp.hireDate,
        departmentName: emp.department?.name ?? 'Sem Departamento',
        daysRemaining,
        probationEndDate: probationEnd.toISOString(),
      });
    }
  }
  probationEndings.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // -- Turnover Trend (Widget 5) --
  const terminationsByMonth = new Map<string, number>();
  for (const t of terminations) {
    const key = getMonthKey(t.terminationDate);
    const sortKey = getMonthSortKey(t.terminationDate);
    if (sortKey >= last6[0].sortKey) {
      terminationsByMonth.set(
        key,
        (terminationsByMonth.get(key) ?? 0) + 1
      );
    }
  }
  const avgHeadcount = activeEmployees.length;
  const turnoverTrend: TurnoverDataPoint[] = last6.map(m => {
    const terms = terminationsByMonth.get(m.key) ?? 0;
    const rate =
      avgHeadcount > 0
        ? Number(((terms / avgHeadcount) * 100).toFixed(1))
        : 0;
    return {
      month: m.key,
      terminations: terms,
      avgHeadcount,
      rate,
    };
  });

  // -- Employees by Department --
  const deptGroups = groupBy(
    activeEmployees,
    e => e.department?.name ?? 'Sem Departamento'
  );
  const employeesByDepartment = Object.entries(deptGroups)
    .map(([name, items]) => ({ name, count: items.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // -- Employees by Contract Type --
  const contractGroups = groupBy(activeEmployees, e => e.contractType);
  const employeesByContractType = Object.entries(contractGroups)
    .map(([type, items]) => ({
      name: CONTRACT_TYPE_LABELS[type] ?? type,
      count: items.length,
    }))
    .sort((a, b) => b.count - a.count);

  // -- Absences by Type --
  const absenceGroups = groupBy(absences, a => a.type);
  const absencesByType = Object.entries(absenceGroups)
    .map(([type, items]) => ({
      name: ABSENCE_TYPE_LABELS[type] ?? type,
      count: items.length,
    }))
    .sort((a, b) => b.count - a.count);

  // -- Payroll Trend (last 6 months) --
  const payrollMap = new Map<string, { bruto: number; liquido: number }>();
  for (const p of payrolls) {
    const monthIdx = p.referenceMonth - 1;
    const key = `${MONTH_NAMES[monthIdx]} ${String(p.referenceYear).slice(2)}`;
    const existing = payrollMap.get(key) ?? { bruto: 0, liquido: 0 };
    payrollMap.set(key, {
      bruto: existing.bruto + p.totalGross,
      liquido: existing.liquido + p.totalNet,
    });
  }
  const payrollTrend = last6.map(m => ({
    month: m.key,
    bruto: payrollMap.get(m.key)?.bruto ?? 0,
    liquido: payrollMap.get(m.key)?.liquido ?? 0,
  }));

  // -- Overtime Trend (last 6 months) --
  const overtimeByMonth = new Map<string, { horas: number; count: number }>();
  for (const o of overtime) {
    const key = getMonthKey(o.date);
    const sortKey = getMonthSortKey(o.date);
    if (sortKey >= last6[0].sortKey) {
      const existing = overtimeByMonth.get(key) ?? { horas: 0, count: 0 };
      overtimeByMonth.set(key, {
        horas: existing.horas + o.hours,
        count: existing.count + 1,
      });
    }
  }
  const overtimeTrend = last6.map(m => ({
    month: m.key,
    horas: overtimeByMonth.get(m.key)?.horas ?? 0,
    count: overtimeByMonth.get(m.key)?.count ?? 0,
  }));

  // -- Bonuses vs Deductions (last 6 months) --
  const bonusByMonth = new Map<string, number>();
  for (const b of bonuses) {
    const key = getMonthKey(b.date);
    const sortKey = getMonthSortKey(b.date);
    if (sortKey >= last6[0].sortKey) {
      bonusByMonth.set(key, (bonusByMonth.get(key) ?? 0) + b.amount);
    }
  }
  const deductionByMonth = new Map<string, number>();
  for (const d of deductions) {
    const key = getMonthKey(d.date);
    const sortKey = getMonthSortKey(d.date);
    if (sortKey >= last6[0].sortKey) {
      deductionByMonth.set(key, (deductionByMonth.get(key) ?? 0) + d.amount);
    }
  }
  const bonusesVsDeductions = last6.map(m => ({
    month: m.key,
    bonificacoes: bonusByMonth.get(m.key) ?? 0,
    deducoes: deductionByMonth.get(m.key) ?? 0,
  }));

  return {
    totalEmployees: activeEmployees.length,
    pendingOvertime,
    activeAbsences,
    currentPayrollNet: currentPayroll?.totalNet ?? 0,
    pendingApprovals,
    overdueVacations,
    employeesByDepartment,
    employeesByContractType,
    absencesByType,
    payrollTrend,
    overtimeTrend,
    bonusesVsDeductions,
    turnoverTrend,
    complianceAlerts,
    birthdaysThisMonth,
    probationEndings,
  };
}

// ============================================================================
// HOOK
// ============================================================================

async function fetchAnalyticsData(): Promise<HRAnalyticsData> {
  const [
    employeesResult,
    overtimeResult,
    absencesResult,
    payrollsResult,
    bonusesResult,
    deductionsResult,
    vacationsResult,
    medicalExamsResult,
    terminationsResult,
  ] = await Promise.allSettled([
    employeesService.listEmployees({ page: 1, perPage: 100 }),
    overtimeService.list({ perPage: 100 }),
    absencesService.list({ perPage: 100 }),
    payrollService.list({ perPage: 100 }),
    bonusesService.list({ perPage: 100 }),
    deductionsService.list({ perPage: 100 }),
    vacationsService.list({ perPage: 100 }),
    medicalExamsService.list({ perPage: 100 }),
    terminationsService.list({ perPage: 100 }),
  ]);

  const employees =
    employeesResult.status === 'fulfilled'
      ? employeesResult.value.employees
      : [];
  const overtime =
    overtimeResult.status === 'fulfilled' ? overtimeResult.value.overtime : [];
  const absences =
    absencesResult.status === 'fulfilled' ? absencesResult.value.absences : [];
  const payrolls =
    payrollsResult.status === 'fulfilled' ? payrollsResult.value.payrolls : [];
  const bonuses =
    bonusesResult.status === 'fulfilled' ? bonusesResult.value.bonuses : [];
  const deductions =
    deductionsResult.status === 'fulfilled'
      ? deductionsResult.value.deductions
      : [];
  const vacationPeriods =
    vacationsResult.status === 'fulfilled'
      ? vacationsResult.value.vacationPeriods
      : [];
  const medicalExams =
    medicalExamsResult.status === 'fulfilled'
      ? medicalExamsResult.value.medicalExams
      : [];
  const terminations =
    terminationsResult.status === 'fulfilled'
      ? terminationsResult.value.terminations
      : [];

  return aggregate(
    employees,
    overtime,
    absences,
    payrolls,
    bonuses,
    deductions,
    vacationPeriods,
    medicalExams,
    terminations
  );
}

export function useHRAnalytics() {
  return useQuery({
    queryKey: ['hr', 'analytics'],
    queryFn: fetchAnalyticsData,
    staleTime: 5 * 60 * 1000, // 5 min
    refetchOnWindowFocus: false,
  });
}
