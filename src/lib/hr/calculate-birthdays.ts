/**
 * Birthday and work-anniversary calculation helpers
 *
 * Used by the BambooHR-style birthday widget on the /hr hub.
 * All comparisons use month/day only (year ignored) so dates from any year match.
 *
 * Conventions:
 * - We compare against the user's local "today" (browser timezone).
 * - We never compute the actual age unless the caller explicitly asks for it,
 *   to avoid leaking sensitive PII without permission.
 */

export interface MinimalEmployeeForBirthday {
  id: string;
  fullName: string;
  birthDate?: string | null;
  hireDate: string;
  photoUrl?: string | null;
  department?: { name: string } | null;
  position?: { name: string } | null;
}

export interface BirthdayMatch<T extends MinimalEmployeeForBirthday> {
  employee: T;
  /** Day of month (1-31) extracted from birthDate */
  day: number;
  /** Month (1-12) extracted from birthDate */
  month: number;
}

export interface AnniversaryMatch<T extends MinimalEmployeeForBirthday> {
  employee: T;
  day: number;
  month: number;
  /** How many full years the employee will complete on the anniversary date */
  years: number;
}

/**
 * Parse an ISO date string to its UTC components.
 * Falls back to null when the string is missing or invalid.
 */
function extractMonthDay(
  isoDate: string | null | undefined
): { month: number; day: number; year: number } | null {
  if (!isoDate) return null;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return null;
  // Use UTC accessors so that a date stored as "1990-05-12" (no time) does not
  // shift one day backwards in negative-offset timezones.
  return {
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
    year: parsed.getUTCFullYear(),
  };
}

function getReferenceToday(reference: Date = new Date()): {
  month: number;
  day: number;
  year: number;
} {
  return {
    month: reference.getMonth() + 1,
    day: reference.getDate(),
    year: reference.getFullYear(),
  };
}

/**
 * Returns employees whose birthday matches today's month and day.
 * Result is sorted alphabetically by fullName.
 */
export function getBirthdaysToday<T extends MinimalEmployeeForBirthday>(
  employees: readonly T[],
  reference: Date = new Date()
): BirthdayMatch<T>[] {
  const today = getReferenceToday(reference);
  const matches: BirthdayMatch<T>[] = [];

  for (const employee of employees) {
    const parts = extractMonthDay(employee.birthDate);
    if (!parts) continue;
    if (parts.month === today.month && parts.day === today.day) {
      matches.push({ employee, day: parts.day, month: parts.month });
    }
  }

  return matches.sort((left, right) =>
    left.employee.fullName.localeCompare(right.employee.fullName, 'pt-BR')
  );
}

/**
 * Returns employees whose birthday falls in the same calendar month as the
 * reference date, sorted by day ascending. Today's birthdays are included
 * unless `excludeToday` is true.
 */
export function getBirthdaysThisMonth<T extends MinimalEmployeeForBirthday>(
  employees: readonly T[],
  options: { excludeToday?: boolean; reference?: Date } = {}
): BirthdayMatch<T>[] {
  const reference = options.reference ?? new Date();
  const today = getReferenceToday(reference);
  const matches: BirthdayMatch<T>[] = [];

  for (const employee of employees) {
    const parts = extractMonthDay(employee.birthDate);
    if (!parts) continue;
    if (parts.month !== today.month) continue;
    if (options.excludeToday && parts.day === today.day) continue;
    matches.push({ employee, day: parts.day, month: parts.month });
  }

  return matches.sort((left, right) => {
    if (left.day !== right.day) return left.day - right.day;
    return left.employee.fullName.localeCompare(
      right.employee.fullName,
      'pt-BR'
    );
  });
}

/**
 * Returns employees celebrating a work anniversary today.
 * Excludes employees in their first year (years === 0) — those are still
 * onboarding, not anniversaries.
 */
export function getAnniversariesToday<T extends MinimalEmployeeForBirthday>(
  employees: readonly T[],
  reference: Date = new Date()
): AnniversaryMatch<T>[] {
  const today = getReferenceToday(reference);
  const matches: AnniversaryMatch<T>[] = [];

  for (const employee of employees) {
    const parts = extractMonthDay(employee.hireDate);
    if (!parts) continue;
    if (parts.month !== today.month || parts.day !== today.day) continue;
    const years = today.year - parts.year;
    if (years <= 0) continue;
    matches.push({ employee, day: parts.day, month: parts.month, years });
  }

  return matches.sort((left, right) =>
    left.employee.fullName.localeCompare(right.employee.fullName, 'pt-BR')
  );
}

/**
 * Returns employees with a work anniversary this calendar month, sorted by day.
 * Excludes today (handled by getAnniversariesToday) when `excludeToday` is true.
 * Excludes anniversaries that would be year 0 (still in first year of company).
 */
export function getAnniversariesThisMonth<T extends MinimalEmployeeForBirthday>(
  employees: readonly T[],
  options: { excludeToday?: boolean; reference?: Date } = {}
): AnniversaryMatch<T>[] {
  const reference = options.reference ?? new Date();
  const today = getReferenceToday(reference);
  const matches: AnniversaryMatch<T>[] = [];

  for (const employee of employees) {
    const parts = extractMonthDay(employee.hireDate);
    if (!parts) continue;
    if (parts.month !== today.month) continue;
    if (options.excludeToday && parts.day === today.day) continue;
    const years = today.year - parts.year;
    if (years <= 0) continue;
    matches.push({ employee, day: parts.day, month: parts.month, years });
  }

  return matches.sort((left, right) => {
    if (left.day !== right.day) return left.day - right.day;
    return left.employee.fullName.localeCompare(
      right.employee.fullName,
      'pt-BR'
    );
  });
}

/**
 * Calculates current age in completed years.
 * Returns null when birthDate is missing or invalid.
 *
 * NOTE: PII-sensitive. Only display when the viewer has explicit permission.
 */
export function calculateAge(
  birthDate: string | null | undefined,
  reference: Date = new Date()
): number | null {
  const parts = extractMonthDay(birthDate);
  if (!parts) return null;
  const today = getReferenceToday(reference);
  let age = today.year - parts.year;
  if (
    today.month < parts.month ||
    (today.month === parts.month && today.day < parts.day)
  ) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

/**
 * Calculates how many full years an employee has been at the company.
 * Returns null when hireDate is missing or invalid.
 */
export function calculateYearsAtCompany(
  hireDate: string | null | undefined,
  reference: Date = new Date()
): number | null {
  const parts = extractMonthDay(hireDate);
  if (!parts) return null;
  const today = getReferenceToday(reference);
  let years = today.year - parts.year;
  if (
    today.month < parts.month ||
    (today.month === parts.month && today.day < parts.day)
  ) {
    years -= 1;
  }
  return years >= 0 ? years : null;
}

/**
 * Formats a (day, month) pair as "DD/MM" for compact display.
 */
export function formatDayMonth(day: number, month: number): string {
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${dd}/${mm}`;
}
