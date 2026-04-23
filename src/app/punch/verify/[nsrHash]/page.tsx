/**
 * Consulta pública de autenticidade de batida de ponto.
 * Phase 06 / Plan 06-03 (PUNCH-COMPLIANCE-04).
 *
 * Server Component PURO — sem 'use client'. Tudo server-side:
 *   - fetch na API com cache: 'no-store' (dados fiscais; nunca cachear)
 *   - renderização server
 *   - zero JavaScript no browser (mínima superfície de ataque LGPD)
 *
 * Esta página é PÚBLICA (auth-context.tsx tem /punch/verify em publicRoutes).
 * Backend retorna apenas whitelist LGPD — nome, razão social, CNPJ mascarado,
 * data/hora, NSR, tipo, status. Nunca CPF/matrícula/e-mail/GPS.
 */

import { notFound } from 'next/navigation';

import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic'; // nunca cachear resultado
export const revalidate = 0;

interface PublicReceiptData {
  employeeName: string;
  tenantRazaoSocial: string;
  tenantCnpjMasked: string;
  nsrNumber: number;
  timestamp: string;
  entryType: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';
  entryTypeLabel: string;
  status: 'APPROVED' | 'PENDING_APPROVAL';
}

async function fetchVerification(
  nsrHash: string
): Promise<PublicReceiptData | null> {
  const apiBase =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://127.0.0.1:3333';

  const url = `${apiBase.replace(/\/$/, '')}/v1/public/punch/verify/${nsrHash}`;

  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) {
    throw new Error(`Erro ao consultar autenticidade (HTTP ${res.status})`);
  }
  return (await res.json()) as PublicReceiptData;
}

function formatDateTimeBR(iso: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function VerifyPunchPage({
  params,
}: {
  params: Promise<{ nsrHash: string }>;
}) {
  const { nsrHash } = await params;

  // Defense-in-depth — backend também valida com Zod.
  if (!/^[a-f0-9]{64}$/.test(nsrHash)) {
    notFound();
  }

  const data = await fetchVerification(nsrHash);
  if (!data) {
    notFound();
  }

  const isApproved = data.status === 'APPROVED';
  const statusLabel = isApproved
    ? 'Ponto registrado'
    : 'Aguardando aprovação do gestor';
  const statusColor = isApproved
    ? 'text-emerald-700 dark:text-emerald-300'
    : 'text-amber-700 dark:text-amber-300';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-xl">
        <Card className="p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Consulta pública de autenticidade
            </p>
            <h1
              className={`mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100 ${statusColor}`}
            >
              {statusLabel}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Recibo de batida de ponto — Portaria MTP 671/2021
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-[max-content_1fr]">
            <dt className="text-slate-500">Funcionário</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">
              {data.employeeName}
            </dd>

            <dt className="text-slate-500">Empresa</dt>
            <dd className="text-slate-900 dark:text-slate-100">
              {data.tenantRazaoSocial}
            </dd>

            <dt className="text-slate-500">CNPJ</dt>
            <dd className="font-mono text-slate-900 dark:text-slate-100">
              {data.tenantCnpjMasked}
            </dd>

            <dt className="text-slate-500">Data/hora</dt>
            <dd className="text-slate-900 dark:text-slate-100">
              {formatDateTimeBR(data.timestamp)}
            </dd>

            <dt className="text-slate-500">NSR</dt>
            <dd className="font-mono text-slate-900 dark:text-slate-100">
              {String(data.nsrNumber).padStart(9, '0')}
            </dd>

            <dt className="text-slate-500">Tipo</dt>
            <dd className="text-slate-900 dark:text-slate-100">
              {data.entryTypeLabel}
            </dd>
          </dl>

          <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <p>
              Esta consulta é pública e auditada. Não exibimos CPF, matrícula,
              endereço, telefone ou dados pessoais do funcionário — apenas os
              campos necessários para verificar a autenticidade do recibo.
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
