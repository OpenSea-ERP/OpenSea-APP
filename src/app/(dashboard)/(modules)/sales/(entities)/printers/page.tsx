'use client';

import {
  useDeletePrinter,
  usePrinters,
  useRegisterPrinter,
} from '@/hooks/sales/use-printing';
import type { PrinterConnection, PrinterType } from '@/types/sales';
import { useState } from 'react';

export default function PrintersPage() {
  const { data, isLoading } = usePrinters();
  const registerPrinter = useRegisterPrinter();
  const deletePrinter = useDeletePrinter();

  const [name, setName] = useState('');
  const [type, setType] = useState<PrinterType>('THERMAL');
  const [connection, setConnection] = useState<PrinterConnection>('NETWORK');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('9100');
  const [paperWidth, setPaperWidth] = useState<80 | 58>(80);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Impressoras
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cadastro e gerenciamento de impressoras térmicas para recibos POS.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-medium">Cadastrar impressora</h2>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="Nome"
            value={name}
            onChange={e => setName(e.target.value)}
          />

          <select
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={type}
            onChange={e => setType(e.target.value as PrinterType)}
          >
            <option value="THERMAL">Termica</option>
            <option value="INKJET">Jato de tinta</option>
            <option value="LABEL">Etiqueta</option>
          </select>

          <select
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={connection}
            onChange={e => setConnection(e.target.value as PrinterConnection)}
          >
            <option value="NETWORK">Rede</option>
            <option value="USB">USB</option>
            <option value="BLUETOOTH">Bluetooth</option>
            <option value="SERIAL">Serial</option>
          </select>

          <input
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="IP (se rede)"
            value={ipAddress}
            onChange={e => setIpAddress(e.target.value)}
          />

          <input
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="Porta"
            type="number"
            value={port}
            onChange={e => setPort(e.target.value)}
          />

          <select
            className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            value={paperWidth}
            onChange={e => setPaperWidth(Number(e.target.value) as 80 | 58)}
          >
            <option value={80}>80 mm</option>
            <option value={58}>58 mm</option>
          </select>
        </div>

        <div className="mt-3">
          <button
            type="button"
            disabled={!name || registerPrinter.isPending}
            className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            onClick={() =>
              registerPrinter.mutate({
                name,
                type,
                connection,
                ipAddress:
                  connection === 'NETWORK' ? ipAddress || undefined : undefined,
                port:
                  connection === 'NETWORK' ? Number(port) || 9100 : undefined,
                paperWidth,
              })
            }
          >
            Salvar impressora
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Conexao</th>
                <th className="px-4 py-3 text-left font-medium">Destino</th>
                <th className="px-4 py-3 text-left font-medium">Papel</th>
                <th className="px-4 py-3 text-left font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={6}>
                    Carregando impressoras...
                  </td>
                </tr>
              )}

              {!isLoading && (data?.printers.length ?? 0) === 0 && (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={6}>
                    Nenhuma impressora cadastrada.
                  </td>
                </tr>
              )}

              {data?.printers.map(printer => (
                <tr
                  key={printer.id}
                  className="border-t border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-3">{printer.name}</td>
                  <td className="px-4 py-3">{printer.type}</td>
                  <td className="px-4 py-3">{printer.connection}</td>
                  <td className="px-4 py-3">
                    {printer.ipAddress
                      ? `${printer.ipAddress}:${printer.port ?? 9100}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3">{printer.paperWidth} mm</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="text-rose-600 hover:underline"
                      onClick={() => deletePrinter.mutate(printer.id)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
