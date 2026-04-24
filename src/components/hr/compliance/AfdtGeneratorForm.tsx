'use client';

/**
 * OpenSea OS - AfdtGeneratorForm (Phase 06 / Plan 06-06)
 *
 * Wrapper do AfdGeneratorForm com:
 *   - AfdtDisclaimerBanner obrigatório no topo (D-05).
 *   - kind="AFDT" → dispatcha para POST /v1/hr/compliance/afdt.
 *   - Mutation useGenerateAfdt (invalida queryKey ['compliance-artifacts']).
 *
 * Permission: hr.compliance.afdt.generate (gate na page).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Hammer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { AfdtDisclaimerBanner } from './AfdtDisclaimerBanner';
import { useGenerateAfdt } from '@/hooks/hr/use-generate-afdt';
import { toast } from 'sonner';

function diffDays(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
}

export function AfdtGeneratorForm() {
  const router = useRouter();
  const generateAfdt = useGenerateAfdt();

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
  const [clientError, setClientError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (!startDate || !endDate) {
      setClientError('Informe o período (data inicial e final).');
      return;
    }

    const days = diffDays(startDate, endDate);
    if (days < 0) {
      setClientError('A data final precisa ser posterior à inicial.');
      return;
    }
    if (days > 365) {
      setClientError(
        `O período (${days} dias) excede 365 dias. Divida em lotes menores.`
      );
      return;
    }

    try {
      const result = await generateAfdt.mutateAsync({
        startDate,
        endDate,
        ...(cnpj ? { cnpj: cnpj.replace(/\D/g, '') } : {}),
      });
      toast.success(
        `AFDT gerado! ${(result.sizeBytes / 1024).toFixed(1)} KB · abrindo em nova aba.`
      );
      if (result.downloadUrl && typeof window !== 'undefined') {
        window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
      }
      router.push('/hr/compliance');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao gerar AFDT';
      toast.error(msg);
      setClientError(msg);
    }
  };

  const isPending = generateAfdt.isPending;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <AfdtDisclaimerBanner />
      <Card className="border-border bg-white p-6 dark:bg-slate-800/60">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-2">
            <Hammer className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">
              Gerar AFDT (artefato proprietário de conferência)
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="afdt-start">Data inicial *</Label>
              <DatePicker
                id="afdt-start"
                value={startDate}
                onChange={value =>
                  setStartDate(typeof value === 'string' ? value : '')
                }
                placeholder="AAAA-MM-DD"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="afdt-end">Data final *</Label>
              <DatePicker
                id="afdt-end"
                value={endDate}
                onChange={value =>
                  setEndDate(typeof value === 'string' ? value : '')
                }
                placeholder="AAAA-MM-DD"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="afdt-cnpj">CNPJ do empregador (opcional)</Label>
            <Input
              id="afdt-cnpj"
              value={cnpj}
              onChange={e => setCnpj(e.target.value)}
              placeholder="Ex.: 00.000.000/0001-00 — deixe em branco para usar o CNPJ do tenant"
              maxLength={18}
              inputMode="numeric"
            />
          </div>

          {clientError && (
            <p
              role="alert"
              className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
            >
              {clientError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push('/hr/compliance')}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Gerar AFDT
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
