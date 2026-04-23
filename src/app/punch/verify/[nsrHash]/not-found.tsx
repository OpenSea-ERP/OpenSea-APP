/**
 * Página 404 da consulta pública de autenticidade de recibo.
 * Phase 06 / Plan 06-03.
 *
 * Renderizada quando:
 *  - nsrHash não bate com nenhum TimeEntry.receiptVerifyHash
 *  - nsrHash tem formato inválido (regex falhou no backend ou frontend)
 *
 * Mensagem amigável em português formal; não revela se o hash é sintaticamente
 * inválido vs inexistente (defesa contra enumeração — todos os erros são um
 * 404 uniforme para o público).
 */

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Batida não encontrada
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            O código consultado não corresponde a nenhum recibo de batida de
            ponto em nossa plataforma, ou o link pode estar inválido. Confirme o
            QR code impresso no recibo físico e tente novamente.
          </p>
          <p className="mt-6 text-xs text-slate-500 dark:text-slate-500">
            Conforme Portaria MTP 671/2021.
          </p>
        </div>
      </div>
    </main>
  );
}
