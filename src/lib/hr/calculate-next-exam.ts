/**
 * OpenSea OS - Helpers para cálculo do próximo exame médico ocupacional
 *
 * Define o próximo exame periódico de um funcionário com base no histórico
 * de exames já realizados e no intervalo do PCMSO (padrão: 12 meses; pode
 * ser reduzido para 6 meses em funções com risco grau 3 ou 4).
 *
 * Convenções:
 * - Datas vindas da API são strings ISO; também aceitamos `Date` para uso
 *   em testes/utilitários.
 * - O cálculo trabalha em dias, ignorando horas para evitar drift por
 *   fuso horário.
 */

import {
  addMonths,
  differenceInCalendarDays,
  isAfter,
  isBefore,
  startOfDay,
} from 'date-fns';
import type {
  MedicalExam,
  MedicalExamType,
} from '@/types/hr';

/* ===========================================
   CONSTANTS
   =========================================== */

/**
 * Intervalo padrão do exame periódico (PCMSO — NR-7).
 * Funcionários sem risco específico fazem exame anualmente.
 */
export const DEFAULT_PERIODIC_INTERVAL_MONTHS = 12;

/**
 * Intervalo reduzido do exame periódico para funções com risco
 * elevado (insalubridade, exposição a agentes nocivos, etc.).
 */
export const HIGH_RISK_PERIODIC_INTERVAL_MONTHS = 6;

/**
 * Tipos de exame que servem como ponto de partida para calcular
 * o próximo periódico. Ou seja: após qualquer um destes, o próximo
 * exame periódico deve ser agendado.
 */
const EXAM_TYPES_RESETTING_PERIODIC: ReadonlySet<MedicalExamType> = new Set([
  'ADMISSIONAL',
  'PERIODICO',
  'MUDANCA_FUNCAO',
  'RETORNO',
]);

/* ===========================================
   TYPES
   =========================================== */

/**
 * Status do próximo exame agendado.
 *
 * - `OVERDUE`: data prevista já passou — funcionário em irregularidade.
 * - `DUE_SOON`: faltam 30 dias ou menos — janela de alerta.
 * - `SCHEDULED`: faltam mais de 30 dias — situação regular.
 * - `UNKNOWN`: sem histórico suficiente para calcular.
 */
export type NextExamStatus =
  | 'OVERDUE'
  | 'DUE_SOON'
  | 'SCHEDULED'
  | 'UNKNOWN';

export interface CalculateNextExamParams {
  /** Histórico completo de exames do funcionário (qualquer ordem). */
  exams: MedicalExam[];
  /**
   * Intervalo do exame periódico em meses. Default: 12.
   * Use `HIGH_RISK_PERIODIC_INTERVAL_MONTHS` para risco elevado.
   */
  periodicIntervalMonths?: number;
  /** Data de referência (default: agora). Útil para testes. */
  referenceDate?: Date;
}

export interface NextExamPlan {
  /** Data prevista do próximo exame, ou null se não foi possível calcular. */
  nextExamDate: Date | null;
  /**
   * Dias até o próximo exame. Negativo se vencido. `null` quando
   * `nextExamDate` é `null`.
   */
  daysUntilNextExam: number | null;
  /** Classificação do status do próximo exame. */
  status: NextExamStatus;
  /** Exame mais recente que serviu como base para o cálculo. */
  baseExam: MedicalExam | null;
}

/* ===========================================
   PARSING HELPERS
   =========================================== */

/** Converte string ISO ou Date em Date no início do dia. Retorna null para entradas inválidas. */
function parseDate(input: string | Date | undefined | null): Date | null {
  if (!input) return null;
  const parsed = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(parsed.getTime())) return null;
  return startOfDay(parsed);
}

/* ===========================================
   PUBLIC HELPERS
   =========================================== */

/**
 * Retorna a quantidade de dias entre `referenceDate` e `targetDate`.
 *
 * - Positivo: data ainda no futuro.
 * - Zero: data é hoje.
 * - Negativo: data já passou (vencida).
 *
 * Ignora horas para evitar inconsistências por fuso horário.
 */
export function calculateDaysUntil(
  targetDate: string | Date | undefined | null,
  referenceDate: Date = new Date()
): number | null {
  const target = parseDate(targetDate);
  if (!target) return null;
  const reference = startOfDay(referenceDate);
  return differenceInCalendarDays(target, reference);
}

/**
 * Localiza o exame mais recente entre os tipos elegíveis para reset
 * do periódico. Funciona como ponto de partida para projetar o
 * próximo exame.
 */
export function findLatestPeriodicResetExam(
  exams: MedicalExam[]
): MedicalExam | null {
  let latest: MedicalExam | null = null;
  let latestDate: Date | null = null;

  for (const exam of exams) {
    if (!EXAM_TYPES_RESETTING_PERIODIC.has(exam.type)) continue;
    const examDate = parseDate(exam.examDate);
    if (!examDate) continue;
    if (!latestDate || isAfter(examDate, latestDate)) {
      latest = exam;
      latestDate = examDate;
    }
  }

  return latest;
}

/**
 * Calcula o status com base na quantidade de dias até a data prevista.
 */
export function classifyNextExamStatus(
  daysUntilNextExam: number | null
): NextExamStatus {
  if (daysUntilNextExam === null) return 'UNKNOWN';
  if (daysUntilNextExam < 0) return 'OVERDUE';
  if (daysUntilNextExam <= 30) return 'DUE_SOON';
  return 'SCHEDULED';
}

/**
 * Calcula o próximo exame periódico com base no histórico.
 *
 * Regras:
 * 1. Considera apenas exames dos tipos que reiniciam o ciclo periódico
 *    (admissional, periódico, mudança de função, retorno).
 * 2. O exame demissional NÃO entra no cálculo — após desligamento o
 *    funcionário não tem mais ciclo ativo.
 * 3. Se o próprio exame mais recente trouxer `nextExamDate`
 *    explicitamente (definido pelo médico/PCMSO), usamos esse valor
 *    em vez do cálculo automático.
 * 4. Caso contrário: próximo exame = exame mais recente + intervalo (meses).
 */
export function calculateNextExam(
  params: CalculateNextExamParams
): NextExamPlan {
  const {
    exams,
    periodicIntervalMonths = DEFAULT_PERIODIC_INTERVAL_MONTHS,
    referenceDate = new Date(),
  } = params;

  const baseExam = findLatestPeriodicResetExam(exams);
  if (!baseExam) {
    return {
      nextExamDate: null,
      daysUntilNextExam: null,
      status: 'UNKNOWN',
      baseExam: null,
    };
  }

  // Prioriza nextExamDate explícito (definido manualmente pelo médico)
  const explicitNextDate = parseDate(baseExam.nextExamDate);
  const baseDate = parseDate(baseExam.examDate);

  let nextExamDate: Date | null = null;
  if (explicitNextDate) {
    nextExamDate = explicitNextDate;
  } else if (baseDate) {
    nextExamDate = startOfDay(addMonths(baseDate, periodicIntervalMonths));
  }

  if (!nextExamDate) {
    return {
      nextExamDate: null,
      daysUntilNextExam: null,
      status: 'UNKNOWN',
      baseExam,
    };
  }

  const daysUntilNextExam = calculateDaysUntil(nextExamDate, referenceDate);
  const status = classifyNextExamStatus(daysUntilNextExam);

  return {
    nextExamDate,
    daysUntilNextExam,
    status,
    baseExam,
  };
}

/**
 * Ordena uma lista de exames por data de realização — do mais recente
 * para o mais antigo. Útil para renderização da timeline.
 */
export function sortExamsDescByExamDate(exams: MedicalExam[]): MedicalExam[] {
  return [...exams].sort((firstExam, secondExam) => {
    const firstDate = parseDate(firstExam.examDate);
    const secondDate = parseDate(secondExam.examDate);
    if (!firstDate && !secondDate) return 0;
    if (!firstDate) return 1;
    if (!secondDate) return -1;
    if (isBefore(firstDate, secondDate)) return 1;
    if (isAfter(firstDate, secondDate)) return -1;
    return 0;
  });
}
