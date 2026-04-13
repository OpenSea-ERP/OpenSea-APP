'use client';

import { useCashierSessionReport } from '@/hooks/sales';
import { useState } from 'react';

function currency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export default function CashierReportsPage() {
  const [sessionIdInput, setSessionIdInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { data, isLoading } = useCashierSessionReport(sessionId);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Relatórios de Caixa
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Consolidado por sessao, metodos de pagamento e vendas por hora.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-medium">Consulta por sessao</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="h-10 min-w-[360px] rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="Informe o sessionId (UUID)"
            value={sessionIdInput}
            onChange={e => setSessionIdInput(e.target.value)}
          />
          <button
            type="button"
            className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            disabled={!sessionIdInput}
            onClick={() => setSessionId(sessionIdInput.trim())}
          >
            Gerar relatório
          </button>
        </div>
      </section>

      {isLoading && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          Carregando relatório da sessao...
        </section>
      )}

      {data && (
        <>
          <section className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900">
            <Card label="Status" value={data.status} />
            <Card
              label="Saldo de abertura"
              value={currency(data.openingBalance)}
            />
            <Card
              label="Saldo de fechamento"
              value={
                data.closingBalance !== undefined
                  ? currency(data.closingBalance)
                  : '-'
              }
            />
            <Card label="Vendas" value={currency(data.totals.sales)} />
            <Card label="Estornos" value={currency(data.totals.refunds)} />
            <Card
              label="Vendas liquidas"
              value={currency(data.totals.netSales)}
            />
            <Card label="Suprimento" value={currency(data.totals.cashIn)} />
            <Card label="Sangria" value={currency(data.totals.cashOut)} />
            <Card label="Transacoes" value={String(data.totals.transactions)} />
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-base font-medium">Metodos de pagamento</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Metodo</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Quantidade
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.paymentMethods.map(item => (
                    <tr
                      key={item.method}
                      className="border-t border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="px-4 py-3">{item.method}</td>
                      <td className="px-4 py-3">{item.count}</td>
                      <td className="px-4 py-3">{currency(item.amount)}</td>
                    </tr>
                  ))}
                  {data.paymentMethods.length === 0 && (
                    <tr>
                      <td className="px-4 py-3 text-zinc-500" colSpan={3}>
                        Sem dados de pagamentos para esta sessao.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-3 text-base font-medium">Vendas por hora</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Hora</th>
                    <th className="px-4 py-3 text-left font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {data.hourlySales.map(item => (
                    <tr
                      key={item.hour}
                      className="border-t border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="px-4 py-3">
                        {String(item.hour).padStart(2, '0')}:00
                      </td>
                      <td className="px-4 py-3">{currency(item.amount)}</td>
                    </tr>
                  ))}
                  {data.hourlySales.length === 0 && (
                    <tr>
                      <td className="px-4 py-3 text-zinc-500" colSpan={2}>
                        Sem vendas por hora nesta sessao.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}
