'use client';

/**
 * JustificationForm — form react-hook-form + Zod do flow self-justify.
 *
 * Phase 8 / Plan 08-03 / Task 2 — D-07 + D-08 + D-09.
 *
 * Campos:
 *   - reason: select (3 enums backend Plan 8-01).
 *   - note: textarea min 10 / max 1000 chars.
 *   - attachments: AttachmentPicker (max 3, 5MB cada, JPG/PNG/PDF).
 *
 * Submissão: invoca `useCreateSelfPunchApproval` que orquestra upload→create
 * (Plan 8-03 Task 2 / D-08-03-01). Em sucesso chama `onSuccess` (parent
 * navega para `/punch`) + toast verde. Em erro: toast vermelho com mensagem
 * real (CLAUDE.md regra 2 — sem silent fallback).
 */

import { Button } from '@/components/ui/button';
import { useCreateSelfPunchApproval } from '@/hooks/hr/use-create-self-punch-approval';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { AttachmentPicker } from './attachment-picker';

const schema = z.object({
  reason: z.enum(
    ['OUT_OF_GEOFENCE', 'FACE_MATCH_LOW', 'EMPLOYEE_SELF_REQUEST'],
    {
      message: 'Selecione um motivo',
    }
  ),
  note: z
    .string()
    .min(10, 'Descreva o motivo com pelo menos 10 caracteres')
    .max(1000, 'Máximo 1000 caracteres'),
});

type FormData = z.infer<typeof schema>;

interface JustificationFormProps {
  /** Time entry id quando justificando uma batida existente (cenário 1). */
  timeEntryId?: string;
  onSuccess: () => void;
}

const REASON_OPTIONS: { value: FormData['reason']; label: string }[] = [
  {
    value: 'EMPLOYEE_SELF_REQUEST',
    label: 'Esqueci ou não pude bater o ponto',
  },
  { value: 'OUT_OF_GEOFENCE', label: 'Estava fora da zona permitida' },
  { value: 'FACE_MATCH_LOW', label: 'Reconhecimento facial não funcionou' },
];

export function JustificationForm({
  timeEntryId,
  onSuccess,
}: JustificationFormProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { reason: 'EMPLOYEE_SELF_REQUEST', note: '' },
  });
  const { mutateAsync, isPending } = useCreateSelfPunchApproval();

  const onSubmit = async (data: FormData) => {
    try {
      await mutateAsync({
        timeEntryId,
        reason: data.reason,
        note: data.note,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      toast.success('Justificativa enviada — gestor avisado.');
      onSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao enviar justificativa';
      toast.error(message);
    }
  };

  const submitting = isPending || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      data-testid="justification-form"
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="reason"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Motivo
        </label>
        <select
          id="reason"
          {...register('reason')}
          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-violet-500/50 dark:focus:ring-violet-500/20"
        >
          {REASON_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.reason && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {errors.reason.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="note"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Descrição
        </label>
        <textarea
          id="note"
          rows={4}
          {...register('note')}
          placeholder="Descreva o que aconteceu (mínimo 10 caracteres)"
          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-violet-500/50 dark:focus:ring-violet-500/20"
        />
        {errors.note && (
          <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
            {errors.note.message}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Anexos (opcional)
        </label>
        <AttachmentPicker
          files={attachments}
          onChange={setAttachments}
          maxFiles={3}
          maxSizeMB={5}
          disabled={submitting}
        />
      </div>

      <Button
        type="submit"
        disabled={submitting}
        data-testid="justification-form-submit"
        className="w-full"
      >
        {submitting ? 'Enviando...' : 'Enviar justificativa'}
      </Button>
    </form>
  );
}
