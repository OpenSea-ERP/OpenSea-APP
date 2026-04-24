'use client';

/**
 * OpenSea OS - AfdGeneratorForm (Phase 06 / Plan 06-06)
 *
 * Formulário de geração de AFD (Arquivo Fonte de Dados — oficial Portaria
 * MTP 671/2021). Inputs:
 *   - startDate / endDate (DateRangePicker com validação 0..365 dias)
 *   - cnpj (opcional — default vem do EsocialConfig do tenant)
 *
 * Submit → POST /v1/hr/compliance/afd → toast sucesso + window.open(.txt)
 * + redireciona para /hr/compliance?type=AFD.
 *
 * Sem PIN (geração AFD é rotina, não destrutiva — artefato imutável).
 * Permission: hr.compliance.afd.generate (page-level gate).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { useGenerateAfd } from '@/hooks/hr/use-generate-afd';
import { toast } from 'sonner';

function diffDays(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
}

export interface AfdGeneratorFormProps {
  /** AFD (oficial) ou AFDT (proprietário). Ambos compartilham o mesmo form. */
  kind: 'AFD' | 'AFDT';
}

export function AfdGeneratorForm({ kind }: AfdGeneratorFormProps) {
  const router = useRouter();
  const generateAfd = useGenerateAfd();

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
  const [clientError, setClientError] = useState<string | null>(null);

  const resetErrors = () => setClientError(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

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
        `O período selecionado (${days} dias) excede 365 dias. Divida em lotes menores.`
      );
      return;
    }

    try {
      const body = {
        startDate,
        endDate,
        ...(cnpj ? { cnpj: cnpj.replace(/\D/g, '') } : {}),
      };
      const result = await generateAfd.mutateAsync(body);
      toast.success(
        `${kind} gerado! ${(result.sizeBytes / 1024).toFixed(1)} KB · abrindo em nova aba.`
      );
      if (result.downloadUrl && typeof window !== 'undefined') {
        window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
      }
      router.push(`/hr/compliance`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao gerar o arquivo';
      toast.error(msg);
      setClientError(msg);
    }
  };

  const isPending = generateAfd.isPending;

  return (
    <Card className="mx-auto max-w-2xl border-border bg-white p-6 dark:bg-slate-800/60">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-center gap-2">
          <FilePlus className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-semibold">
            Gerar {kind === 'AFD' ? 'AFD (oficial)' : 'AFDT (conferência)'}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="afd-start">Data inicial *</Label>
            <DatePicker
              id="afd-start"
              value={startDate}
              onChange={value =>
                setStartDate(typeof value === 'string' ? value : '')
              }
              placeholder="AAAA-MM-DD"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="afd-end">Data final *</Label>
            <DatePicker
              id="afd-end"
              value={endDate}
              onChange={value =>
                setEndDate(typeof value === 'string' ? value : '')
              }
              placeholder="AAAA-MM-DD"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="afd-cnpj">CNPJ do empregador (opcional)</Label>
          <Input
            id="afd-cnpj"
            value={cnpj}
            onChange={e => setCnpj(e.target.value)}
            placeholder="Ex.: 00.000.000/0001-00 — deixe em branco para usar o CNPJ do tenant"
            maxLength={18}
            inputMode="numeric"
          />
          <p className="text-xs text-muted-foreground">
            Deixe em branco para usar o CNPJ declarado em{' '}
            <span className="font-mono">EsocialConfig.employerDocument</span>.
          </p>
        </div>

        {startDate && endDate && diffDays(startDate, endDate) >= 0 && (
          <p className="text-xs text-muted-foreground">
            Período: {diffDays(startDate, endDate) + 1} dia(s) selecionados.
          </p>
        )}

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
            Gerar {kind}
          </Button>
        </div>
      </form>
    </Card>
  );
}
