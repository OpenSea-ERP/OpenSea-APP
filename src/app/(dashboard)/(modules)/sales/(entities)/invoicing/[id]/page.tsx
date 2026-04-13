'use client';

import {
  invoiceStatusLabel,
  useCancelInvoice,
  useInvoice,
} from '@/hooks/sales/use-invoicing';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = params?.id ?? null;

  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const cancelInvoice = useCancelInvoice();
  const [reason, setReason] = useState('');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Detalhe da Nota Fiscal
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Consulta de status, cancelamento e acesso a XML/PDF.
          </p>
        </div>
        <Link
          href="/sales/invoicing"
          className="text-sm text-blue-600 hover:underline"
        >
          Voltar para listagem
        </Link>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          Carregando dados da nota fiscal...
        </div>
      )}

      {!isLoading && !invoice && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800/50 dark:bg-rose-900/20 dark:text-rose-300">
          Nota fiscal não encontrada.
        </div>
      )}

      {invoice && (
        <>
          <section className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
            <Info label="ID" value={invoice.id} />
            <Info label="Pedido" value={invoice.orderId} />
            <Info label="Tipo" value={invoice.type} />
            <Info label="Status" value={invoiceStatusLabel(invoice.status)} />
            <Info label="Número" value={invoice.number || '-'} />
            <Info label="Série" value={invoice.series || '-'} />
            <Info label="Chave de acesso" value={invoice.accessKey} />
            <Info
              label="Emitida em"
              value={
                invoice.issuedAt
                  ? new Date(invoice.issuedAt).toLocaleString('pt-BR')
                  : '-'
              }
            />
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-base font-medium">Arquivos</h2>
            <div className="flex flex-wrap items-center gap-2">
              {invoice.xmlUrl ? (
                <a
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  href={invoice.xmlUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir XML
                </a>
              ) : (
                <span className="text-sm text-zinc-500">XML indisponivel</span>
              )}

              {invoice.pdfUrl ? (
                <a
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  href={invoice.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir DANFE (PDF)
                </a>
              ) : (
                <span className="text-sm text-zinc-500">PDF indisponivel</span>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-base font-medium">Cancelar nota</h2>
            <textarea
              className="min-h-[120px] w-full rounded-md border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Informe o motivo do cancelamento (mínimo 10 caracteres)"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                className="h-10 rounded-md bg-rose-600 px-4 text-sm font-medium text-white disabled:opacity-50"
                disabled={
                  cancelInvoice.isPending ||
                  reason.trim().length < 10 ||
                  invoice.status === 'CANCELLED'
                }
                onClick={() =>
                  cancelInvoice.mutate({
                    invoiceId: invoice.id,
                    data: { reason: reason.trim() },
                  })
                }
              >
                Cancelar nota fiscal
              </button>
              {invoice.status === 'CANCELLED' && (
                <span className="text-sm text-zinc-500">
                  Esta nota ja esta cancelada.
                </span>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}
