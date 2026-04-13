'use client';

import {
  invoiceStatusLabel,
  useConfigureFocusNfe,
  useInvoicesInfinite,
  useIssueInvoice,
} from '@/hooks/sales/use-invoicing';
import type { InvoiceStatus } from '@/types/sales';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

function toDateTimeIso(value: string, endOfDay = false): string | undefined {
  if (!value) return undefined;
  const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
  return `${value}${suffix}`;
}

export default function InvoicingPage() {
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const [orderId, setOrderId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [issueOrderId, setIssueOrderId] = useState('');
  const [focusApiKey, setFocusApiKey] = useState('');
  const [focusProductionMode, setFocusProductionMode] = useState(true);
  const [focusAutoIssue, setFocusAutoIssue] = useState(true);

  const filters = useMemo(
    () => ({
      status: status || undefined,
      orderId: orderId || undefined,
      fromDate: toDateTimeIso(fromDate),
      toDate: toDateTimeIso(toDate, true),
    }),
    [status, orderId, fromDate, toDate]
  );

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useInvoicesInfinite(filters);
  const issueInvoice = useIssueInvoice();
  const configureFocus = useConfigureFocusNfe();

  const invoices = data?.pages.flatMap(page => page.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="space-y-6 p-6" data-testid="invoicing-page">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Faturamento Fiscal
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Emissão, consulta e controle de NF-e/NFC-e.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-medium">Filtros</h2>
        <div className="grid gap-3 md:grid-cols-5">
          <select
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={status}
            onChange={e => {
              setStatus(e.target.value as InvoiceStatus | '');
            }}
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="ISSUED">Emitida</option>
            <option value="CANCELLED">Cancelada</option>
            <option value="ERROR">Erro</option>
          </select>

          <input
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="Order ID"
            value={orderId}
            onChange={e => {
              setOrderId(e.target.value);
            }}
          />

          <input
            type="date"
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={fromDate}
            onChange={e => {
              setFromDate(e.target.value);
            }}
          />

          <input
            type="date"
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={toDate}
            onChange={e => {
              setToDate(e.target.value);
            }}
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              onClick={() => {
                setStatus('');
                setOrderId('');
                setFromDate('');
                setToDate('');
              }}
            >
              Limpar
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-medium">Emitir por pedido</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="h-10 min-w-[280px] rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="Order ID para emissão"
            value={issueOrderId}
            onChange={e => setIssueOrderId(e.target.value)}
          />
          <button
            type="button"
            disabled={!issueOrderId || issueInvoice.isPending}
            className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            onClick={() => issueInvoice.mutate({ orderId: issueOrderId })}
          >
            Emitir NF
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-medium">Configuração Focus NFe</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            type="password"
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950 md:col-span-2"
            placeholder="API Key"
            value={focusApiKey}
            onChange={e => setFocusApiKey(e.target.value)}
          />
          <label className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700">
            <input
              type="checkbox"
              checked={focusProductionMode}
              onChange={e => setFocusProductionMode(e.target.checked)}
            />
            Modo produção
          </label>
          <label className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700">
            <input
              type="checkbox"
              checked={focusAutoIssue}
              onChange={e => setFocusAutoIssue(e.target.checked)}
            />
            Emissão automática
          </label>
        </div>
        <div className="mt-3">
          <button
            type="button"
            disabled={!focusApiKey || configureFocus.isPending}
            className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            onClick={() =>
              configureFocus.mutate({
                apiKey: focusApiKey,
                productionMode: focusProductionMode,
                autoIssueOnConfirm: focusAutoIssue,
              })
            }
          >
            Salvar configuração
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Número</th>
                <th className="px-4 py-3 text-left font-medium">Serie</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Pedido</th>
                <th className="px-4 py-3 text-left font-medium">Criada em</th>
                <th className="px-4 py-3 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={7}>
                    Carregando notas fiscais...
                  </td>
                </tr>
              )}

              {!isLoading && invoices.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={7}>
                    Nenhuma nota encontrada para os filtros atuais.
                  </td>
                </tr>
              )}

              {invoices.map(invoice => (
                <tr
                  key={invoice.id}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-3">{invoice.number || '-'}</td>
                  <td className="px-4 py-3">{invoice.series || '-'}</td>
                  <td className="px-4 py-3">{invoice.type}</td>
                  <td className="px-4 py-3">
                    {invoiceStatusLabel(invoice.status)}
                  </td>
                  <td className="px-4 py-3">{invoice.orderId}</td>
                  <td className="px-4 py-3">
                    {new Date(invoice.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/sales/invoicing/${invoice.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div ref={sentinelRef} className="h-1" />

        {isFetchingNextPage && (
          <p className="py-3 text-center text-sm text-zinc-500">
            Carregando mais notas...
          </p>
        )}
      </section>

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Total: {total} registro(s)
        </p>
        {!hasNextPage && invoices.length > 0 && (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Todos os registros carregados
          </p>
        )}
      </div>
    </div>
  );
}
