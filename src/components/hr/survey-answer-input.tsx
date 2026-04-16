'use client';

/**
 * SurveyAnswerInput
 *
 * Renderizador unificado de inputs por tipo de pergunta de pesquisa.
 * Reusado em modal de resposta e na página dedicada `/hr/surveys/respond/[id]`.
 *
 * Tipos suportados:
 *   - RATING_1_5   → 5 estrelas grandes
 *   - RATING_1_10  → 10 botões em linha
 *   - YES_NO       → 2 botões grandes (Sim/Não)
 *   - TEXT         → textarea
 *   - MULTIPLE_CHOICE → radio cards (single ou multi conforme `multi`)
 *   - NPS          → 0-10 colorido (rose/amber/emerald)
 */

import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { SurveyAnswer, SurveyQuestionType } from '@/types/hr';
import { Star, ThumbsDown, ThumbsUp } from 'lucide-react';

export interface SurveyAnswerInputProps {
  type: SurveyQuestionType;
  options?: string[] | null;
  value: SurveyAnswer | undefined;
  onChange: (partial: Partial<SurveyAnswer>) => void;
  /** Quando MULTIPLE_CHOICE deve aceitar múltiplas marcações. Padrão true. */
  multi?: boolean;
  testId?: string;
}

export function SurveyAnswerInput({
  type,
  options,
  value,
  onChange,
  multi = true,
  testId,
}: SurveyAnswerInputProps) {
  const ratingValue = value?.ratingValue ?? null;
  const textValue = value?.textValue ?? '';
  const selectedOptions = value?.selectedOptions ?? [];

  if (type === 'RATING_1_5') {
    return (
      <div
        className="flex items-center justify-center gap-3 py-4"
        data-testid={testId}
      >
        {[1, 2, 3, 4, 5].map(star => {
          const filled = ratingValue !== null && star <= ratingValue;
          return (
            <button
              key={star}
              type="button"
              aria-label={`${star} de 5`}
              onClick={() => onChange({ ratingValue: star })}
              className={`group flex h-14 w-14 items-center justify-center rounded-xl border-2 transition-all ${
                filled
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/8'
                  : 'border-border hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-500/5'
              }`}
            >
              <Star
                className={`h-7 w-7 transition-all ${
                  filled
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground group-hover:text-amber-400'
                }`}
              />
            </button>
          );
        })}
      </div>
    );
  }

  if (type === 'RATING_1_10') {
    return (
      <div
        className="flex flex-wrap justify-center gap-2 py-4"
        data-testid={testId}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onChange({ ratingValue: num })}
            className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-base font-semibold transition-all ${
              ratingValue === num
                ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/8 dark:text-violet-300'
                : 'border-border hover:border-violet-300 hover:bg-accent'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    );
  }

  if (type === 'YES_NO') {
    return (
      <div className="flex justify-center gap-4 py-4" data-testid={testId}>
        <button
          type="button"
          onClick={() => onChange({ ratingValue: 1 })}
          className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-10 py-6 transition-all ${
            ratingValue === 1
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300'
              : 'border-border hover:border-emerald-300 hover:bg-accent'
          }`}
        >
          <ThumbsUp className="h-8 w-8" />
          <span className="text-base font-semibold">Sim</span>
        </button>
        <button
          type="button"
          onClick={() => onChange({ ratingValue: 0 })}
          className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-10 py-6 transition-all ${
            ratingValue === 0
              ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300'
              : 'border-border hover:border-rose-300 hover:bg-accent'
          }`}
        >
          <ThumbsDown className="h-8 w-8" />
          <span className="text-base font-semibold">Não</span>
        </button>
      </div>
    );
  }

  if (type === 'TEXT') {
    return (
      <Textarea
        data-testid={testId}
        placeholder="Digite sua resposta..."
        value={textValue}
        onChange={event => onChange({ textValue: event.target.value })}
        rows={5}
      />
    );
  }

  if (type === 'MULTIPLE_CHOICE' && options && options.length > 0) {
    return (
      <div className="space-y-2" data-testid={testId}>
        {options.map((option, index) => {
          const isChecked = selectedOptions.includes(option);
          return (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (multi) {
                  const next = isChecked
                    ? selectedOptions.filter(opt => opt !== option)
                    : [...selectedOptions, option];
                  onChange({ selectedOptions: next });
                } else {
                  onChange({ selectedOptions: [option] });
                }
              }}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                isChecked
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/8'
                  : 'border-border hover:border-violet-300 hover:bg-accent'
              }`}
            >
              <Checkbox
                checked={isChecked}
                className="pointer-events-none"
              />
              <span className="text-sm font-medium">{option}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (type === 'NPS') {
    return (
      <div data-testid={testId}>
        <div className="flex flex-wrap justify-center gap-2 py-4">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
            const isSelected = ratingValue === num;
            let palette = 'border-border hover:bg-accent';
            if (isSelected) {
              if (num <= 6) {
                palette =
                  'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300';
              } else if (num <= 8) {
                palette =
                  'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300';
              } else {
                palette =
                  'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300';
              }
            }
            return (
              <button
                key={num}
                type="button"
                onClick={() => onChange({ ratingValue: num })}
                className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-base font-semibold transition-all ${palette}`}
              >
                {num}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between px-2 text-xs text-muted-foreground">
          <span>Nada provável</span>
          <span>Extremamente provável</span>
        </div>
      </div>
    );
  }

  return null;
}
