'use client';

/**
 * /punch/justify/[id] — formulário de justificativa mobile-first.
 *
 * Phase 8 / Plan 08-03 / Task 2 — D-07 + D-08.
 *
 * Page chrome clonado de `/punch/page.tsx` (sticky header + safe-area-inset).
 * Recebe `id` (TimeEntry.id) via params; passa para `JustificationForm` que
 * resolve o cenário 1 (justificar batida existente). Cenário 2 (esqueci de
 * bater) é coberto por ainda outro entry point — Plan 8-03 cobre apenas o
 * caminho com TimeEntry conhecida.
 */

import { ArrowLeft, Waves } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

import { JustificationForm } from '@/app/punch/components/justification-form';

function JustifyPageContent() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const timeEntryId =
    typeof idParam === 'string'
      ? idParam
      : Array.isArray(idParam)
        ? idParam[0]
        : undefined;

  return (
    <div data-testid="punch-justify-page" className="contents">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-lg dark:border-slate-700/50 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Voltar"
            className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/20">
            <Waves className="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Justificar batida
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Descreva o motivo da exceção. O gestor revisa e aprova ou rejeita.
        </p>
        <JustificationForm
          timeEntryId={timeEntryId}
          onSuccess={() => router.push('/punch')}
        />
      </main>
    </div>
  );
}

export default function JustifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
        </div>
      }
    >
      <JustifyPageContent />
    </Suspense>
  );
}
