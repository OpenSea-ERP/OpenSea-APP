/**
 * Birthday and Anniversary calculation helper tests
 * Pinned reference date so tests are deterministic regardless of when they run.
 */

import { describe, expect, it } from 'vitest';
import {
  calculateAge,
  calculateYearsAtCompany,
  formatDayMonth,
  getAnniversariesThisMonth,
  getAnniversariesToday,
  getBirthdaysThisMonth,
  getBirthdaysToday,
  type MinimalEmployeeForBirthday,
} from '@/lib/hr/calculate-birthdays';

function makeEmployee(
  overrides: Partial<MinimalEmployeeForBirthday> & { id: string }
): MinimalEmployeeForBirthday {
  return {
    id: overrides.id,
    fullName: overrides.fullName ?? `Employee ${overrides.id}`,
    birthDate: overrides.birthDate ?? null,
    hireDate: overrides.hireDate ?? '2020-01-01',
    photoUrl: overrides.photoUrl ?? null,
    department: overrides.department ?? null,
    position: overrides.position ?? null,
  };
}

describe('calculate-birthdays helper', () => {
  // April 16, 2026 as the pinned "today" for all tests
  const reference = new Date('2026-04-16T12:00:00Z');

  describe('getBirthdaysToday', () => {
    it('returns employees whose birthDate matches month and day, ignoring year', () => {
      const employees = [
        makeEmployee({
          id: '1',
          fullName: 'Ana Silva',
          birthDate: '1990-04-16',
        }),
        makeEmployee({
          id: '2',
          fullName: 'Bruno Costa',
          birthDate: '1985-04-16',
        }),
        makeEmployee({
          id: '3',
          fullName: 'Carlos Lima',
          birthDate: '1992-04-15',
        }),
        makeEmployee({ id: '4', fullName: 'Diana Souza', birthDate: null }),
      ];

      const result = getBirthdaysToday(employees, reference);

      expect(result).toHaveLength(2);
      expect(result[0].employee.fullName).toBe('Ana Silva');
      expect(result[1].employee.fullName).toBe('Bruno Costa');
      expect(result[0].day).toBe(16);
      expect(result[0].month).toBe(4);
    });

    it('returns empty array when no birthdays match', () => {
      const employees = [
        makeEmployee({ id: '1', birthDate: '1990-01-01' }),
        makeEmployee({ id: '2', birthDate: '1985-12-25' }),
      ];

      expect(getBirthdaysToday(employees, reference)).toEqual([]);
    });

    it('skips employees with missing or invalid birthDate', () => {
      const employees = [
        makeEmployee({ id: '1', birthDate: null }),
        makeEmployee({ id: '2', birthDate: undefined }),
        makeEmployee({ id: '3', birthDate: 'not-a-date' }),
      ];

      expect(getBirthdaysToday(employees, reference)).toEqual([]);
    });
  });

  describe('getBirthdaysThisMonth', () => {
    it('returns all employees with birthdays in the same month, sorted by day', () => {
      const employees = [
        makeEmployee({ id: '1', fullName: 'Ana', birthDate: '1990-04-25' }),
        makeEmployee({ id: '2', fullName: 'Bruno', birthDate: '1985-04-10' }),
        makeEmployee({ id: '3', fullName: 'Carla', birthDate: '1992-04-16' }),
        makeEmployee({ id: '4', fullName: 'Diana', birthDate: '1988-05-05' }),
      ];

      const result = getBirthdaysThisMonth(employees, { reference });

      expect(result.map(item => item.employee.fullName)).toEqual([
        'Bruno',
        'Carla',
        'Ana',
      ]);
    });

    it('excludes today when excludeToday is true', () => {
      const employees = [
        makeEmployee({ id: '1', fullName: 'Hoje', birthDate: '1990-04-16' }),
        makeEmployee({ id: '2', fullName: 'Outro', birthDate: '1990-04-20' }),
      ];

      const result = getBirthdaysThisMonth(employees, {
        reference,
        excludeToday: true,
      });

      expect(result).toHaveLength(1);
      expect(result[0].employee.fullName).toBe('Outro');
    });

    it('breaks ties on day with alphabetical fullName', () => {
      const employees = [
        makeEmployee({ id: '1', fullName: 'Carlos', birthDate: '1990-04-20' }),
        makeEmployee({ id: '2', fullName: 'Beatriz', birthDate: '1990-04-20' }),
      ];

      const result = getBirthdaysThisMonth(employees, { reference });

      expect(result.map(item => item.employee.fullName)).toEqual([
        'Beatriz',
        'Carlos',
      ]);
    });
  });

  describe('getAnniversariesToday', () => {
    it('returns employees whose hireDate matches today and computes years', () => {
      const employees = [
        makeEmployee({ id: '1', fullName: 'Ana', hireDate: '2020-04-16' }),
        makeEmployee({ id: '2', fullName: 'Bruno', hireDate: '2024-04-16' }),
        makeEmployee({ id: '3', fullName: 'Carla', hireDate: '2025-04-16' }),
      ];

      const result = getAnniversariesToday(employees, reference);

      expect(result).toHaveLength(3);
      const yearsByName = new Map(
        result.map(item => [item.employee.fullName, item.years])
      );
      expect(yearsByName.get('Ana')).toBe(6);
      expect(yearsByName.get('Bruno')).toBe(2);
      expect(yearsByName.get('Carla')).toBe(1);
    });

    it('excludes employees in their first year (years === 0)', () => {
      const employees = [
        makeEmployee({ id: '1', hireDate: '2026-04-16' }), // hired today, 0 years
      ];

      expect(getAnniversariesToday(employees, reference)).toEqual([]);
    });
  });

  describe('getAnniversariesThisMonth', () => {
    it('returns anniversaries in the same month sorted by day', () => {
      const employees = [
        makeEmployee({ id: '1', fullName: 'Ana', hireDate: '2020-04-25' }),
        makeEmployee({ id: '2', fullName: 'Bruno', hireDate: '2022-04-10' }),
        makeEmployee({ id: '3', fullName: 'Carla', hireDate: '2018-05-05' }),
      ];

      const result = getAnniversariesThisMonth(employees, { reference });

      expect(result.map(item => item.employee.fullName)).toEqual([
        'Bruno',
        'Ana',
      ]);
      expect(result[0].years).toBe(4);
      expect(result[1].years).toBe(6);
    });

    it('excludes today when excludeToday is true', () => {
      const employees = [
        makeEmployee({ id: '1', fullName: 'Hoje', hireDate: '2020-04-16' }),
        makeEmployee({ id: '2', fullName: 'Depois', hireDate: '2020-04-20' }),
      ];

      const result = getAnniversariesThisMonth(employees, {
        reference,
        excludeToday: true,
      });

      expect(result).toHaveLength(1);
      expect(result[0].employee.fullName).toBe('Depois');
    });

    it('excludes anniversaries that would be 0 years (still onboarding)', () => {
      const employees = [
        makeEmployee({ id: '1', hireDate: '2026-04-30' }), // hired this month, year 0
      ];

      expect(getAnniversariesThisMonth(employees, { reference })).toEqual([]);
    });
  });

  describe('calculateAge', () => {
    it('returns age based on birth date and current reference', () => {
      expect(calculateAge('1990-04-16', reference)).toBe(36);
      expect(calculateAge('1990-04-17', reference)).toBe(35); // birthday tomorrow
      expect(calculateAge('1990-04-15', reference)).toBe(36); // birthday yesterday
    });

    it('returns null for missing or invalid birth dates', () => {
      expect(calculateAge(null, reference)).toBeNull();
      expect(calculateAge(undefined, reference)).toBeNull();
      expect(calculateAge('not-a-date', reference)).toBeNull();
    });
  });

  describe('calculateYearsAtCompany', () => {
    it('returns full years between hireDate and reference', () => {
      expect(calculateYearsAtCompany('2020-04-16', reference)).toBe(6);
      expect(calculateYearsAtCompany('2020-05-01', reference)).toBe(5);
      expect(calculateYearsAtCompany('2020-04-01', reference)).toBe(6);
    });

    it('returns null for missing or invalid hire dates', () => {
      expect(calculateYearsAtCompany(null, reference)).toBeNull();
      expect(calculateYearsAtCompany('not-a-date', reference)).toBeNull();
    });
  });

  describe('formatDayMonth', () => {
    it('zero-pads day and month and joins with slash', () => {
      expect(formatDayMonth(1, 4)).toBe('01/04');
      expect(formatDayMonth(16, 12)).toBe('16/12');
    });
  });
});
