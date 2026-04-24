'use client';

/**
 * OpenSea OS - S1200SubmitForm (Phase 06 / Plan 06-06)
 *
 * Submissão regulatória eSocial — REQUER VerifyActionPinModal antes
 * da mutation (CLAUDE.md APP §HR sensitive operations §Send eSocial event).
 *
 * Permission: hr.compliance.s1200.submit.
 *
 * Campos:
 *   - competencia (YYYY-MM)
 *   - scope (ALL / DEPARTMENT / CUSTOM)
 *   - departmentIds / employeeIds conforme scope
 *   - retify? { originalReceiptNumber, originalEsocialEventId }
 *   - transmitImmediately (default false — cria batch em DRAFT)
 *
 * Fluxo:
 *   1. Submit do form → abre VerifyActionPinModal
 *   2. PIN confirmado → mutation buildS1200
 *   3. Sucesso → toast com batchId + eventIds.length + errors.length
 *   4. Errors[] > 0 → exibe lista inline (pode ser expandida para drawer depois)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileCheck, Loader2, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { useBuildS1200 } from '@/hooks/hr/use-build-s1200';
import type {
  BuildS1200Request,
  BuildS1200Response,
  S1200Scope,
} from '@/types/hr';
import { toast } from 'sonner';

const COMPETENCIA_RE = /^\d{4}-\d{2}$/;

function parseIdList(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

export function S1200SubmitForm() {
  const router = useRouter();
  const build = useBuildS1200();

  const [competencia, setCompetencia] = useState('');
  const [scope, setScope] = useState<S1200Scope>('ALL');
  const [departmentIds, setDepartmentIds] = useState('');
  const [employeeIds, setEmployeeIds] = useState('');
  const [retifyEnabled, setRetifyEnabled] = useState(false);
  const [originalReceiptNumber, setOriginalReceiptNumber] = useState('');
  const [originalEsocialEventId, setOriginalEsocialEventId] = useState('');
  const [transmitImmediately, setTransmitImmediately] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [result, setResult] = useState<BuildS1200Response | null>(null);

  const validateAndOpenPin = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    if (!COMPETENCIA_RE.test(competencia)) {
      setClientError('Competência deve estar em formato AAAA-MM.');
      return;
    }
    if (scope === 'DEPARTMENT' && parseIdList(departmentIds).length === 0) {
      setClientError('Informe pelo menos um departamento.');
      return;
    }
    if (scope === 'CUSTOM' && parseIdList(employeeIds).length === 0) {
      setClientError('Informe pelo menos um funcionário.');
      return;
    }
    if (
      retifyEnabled &&
      (!originalReceiptNumber.trim() || !originalEsocialEventId.trim())
    ) {
      setClientError(
        'Retificação exige número do recibo e ID do evento eSocial originais.'
      );
      return;
    }

    setPinOpen(true);
  };

  const executeSubmit = async () => {
    const body: BuildS1200Request = {
      competencia,
      scope,
      ...(scope === 'DEPARTMENT'
        ? { departmentIds: parseIdList(departmentIds) }
        : {}),
      ...(scope === 'CUSTOM' ? { employeeIds: parseIdList(employeeIds) } : {}),
      ...(retifyEnabled
        ? {
            retify: {
              originalReceiptNumber: originalReceiptNumber.trim(),
              originalEsocialEventId: originalEsocialEventId.trim(),
            },
          }
        : {}),
      transmitImmediately,
    };

    try {
      const response = await build.mutateAsync(body);
      setResult(response);
      toast.success(
        `Lote ${response.batchId.slice(0, 8)}… criado com ${response.eventIds.length} evento(s)` +
          (response.errors.length > 0
            ? ` · ${response.errors.length} erro(s) por funcionário`
            : '')
      );
      setPinOpen(false);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao submeter S-1200';
      toast.error(msg);
      setClientError(msg);
      setPinOpen(false);
    }
  };

  return (
    <Card className="mx-auto max-w-3xl border-border bg-white p-6 dark:bg-slate-800/60">
      <div className="mb-4 flex items-center gap-2">
        <FileCheck className="h-5 w-5 text-sky-500" />
        <h2 className="text-lg font-semibold">Submeter eSocial S-1200</h2>
      </div>
      <p className="mb-5 text-xs text-muted-foreground">
        Geração de eventos S-1200 (Remuneração de Trabalhador). Cada funcionário
        produz 1 XML assinado; o lote é enfileirado em{' '}
        <span className="font-mono">DRAFT</span> ou transmitido ao gov.br
        conforme a opção selecionada. O ambiente (produção/homologação) é
        definido no <code className="font-mono text-xs">EsocialConfig</code>.
      </p>

      <form onSubmit={validateAndOpenPin} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="s1200-comp">Competência *</Label>
            <Input
              id="s1200-comp"
              value={competencia}
              onChange={e => setCompetencia(e.target.value)}
              placeholder="AAAA-MM"
              pattern="\d{4}-\d{2}"
              maxLength={7}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s1200-scope">Escopo *</Label>
            <Select
              value={scope}
              onValueChange={v => setScope(v as S1200Scope)}
            >
              <SelectTrigger id="s1200-scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  Todos os funcionários ativos
                </SelectItem>
                <SelectItem value="DEPARTMENT">
                  Filtrar por departamento
                </SelectItem>
                <SelectItem value="CUSTOM">Lista específica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {scope === 'DEPARTMENT' && (
          <div className="space-y-1.5">
            <Label htmlFor="s1200-depts">IDs de departamento *</Label>
            <Input
              id="s1200-depts"
              value={departmentIds}
              onChange={e => setDepartmentIds(e.target.value)}
              placeholder="UUIDs separados por vírgula, espaço ou quebra de linha"
              required
            />
          </div>
        )}

        {scope === 'CUSTOM' && (
          <div className="space-y-1.5">
            <Label htmlFor="s1200-emps">IDs de funcionários *</Label>
            <Input
              id="s1200-emps"
              value={employeeIds}
              onChange={e => setEmployeeIds(e.target.value)}
              placeholder="UUIDs separados por vírgula, espaço ou quebra de linha"
              required
            />
          </div>
        )}

        <div className="space-y-3 rounded-md border border-border bg-slate-50/60 p-4 dark:bg-slate-900/30">
          <div className="flex items-start gap-3">
            <Checkbox
              id="s1200-retify"
              checked={retifyEnabled}
              onCheckedChange={v => setRetifyEnabled(v === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="s1200-retify" className="cursor-pointer">
                Retificar envio anterior
              </Label>
              <p className="text-xs text-muted-foreground">
                Marque para gerar <code className="font-mono">indRetif=2</code>{' '}
                + nrRecibo (exige os dados do envio original).
              </p>
            </div>
          </div>
          {retifyEnabled && (
            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="s1200-orig-receipt">
                  Nº do recibo original *
                </Label>
                <Input
                  id="s1200-orig-receipt"
                  value={originalReceiptNumber}
                  onChange={e => setOriginalReceiptNumber(e.target.value)}
                  placeholder="Ex.: 1.2.0026-00001234/2026"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="s1200-orig-event">
                  ID do evento eSocial original *
                </Label>
                <Input
                  id="s1200-orig-event"
                  value={originalEsocialEventId}
                  onChange={e => setOriginalEsocialEventId(e.target.value)}
                  placeholder="UUID do EsocialEvent já aceito"
                  required
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="s1200-transmit"
            checked={transmitImmediately}
            onCheckedChange={v => setTransmitImmediately(v === true)}
          />
          <div className="space-y-1">
            <Label htmlFor="s1200-transmit" className="cursor-pointer">
              Transmitir imediatamente ao eSocial gov.br
            </Label>
            <p className="text-xs text-muted-foreground">
              Se desmarcado, o lote é salvo em{' '}
              <span className="font-mono">DRAFT</span> e você pode transmitir
              depois pela tela de envios.
            </p>
          </div>
        </div>

        {clientError && (
          <p
            role="alert"
            className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          >
            {clientError}
          </p>
        )}

        {result && (
          <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <p className="font-medium text-emerald-900 dark:text-emerald-200">
              Lote {result.batchId.slice(0, 8)}… criado em{' '}
              <span className="font-mono">{result.environment}</span>.
            </p>
            <p className="text-emerald-800 dark:text-emerald-300">
              {result.eventIds.length} evento(s) gerados.{' '}
              {result.errors.length > 0
                ? `${result.errors.length} erro(s) por funcionário (listados abaixo).`
                : 'Sem erros.'}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs">
                {result.errors.map((err, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-amber-800 dark:text-amber-300"
                  >
                    <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                    <span>
                      <span className="font-mono">
                        {err.employeeId.slice(0, 8)}…
                      </span>
                      : {err.reason}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push('/hr/compliance')}
            disabled={build.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={build.isPending}
            className="gap-2"
          >
            {build.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submeter ao eSocial
          </Button>
        </div>
      </form>

      <VerifyActionPinModal
        isOpen={pinOpen}
        onClose={() => setPinOpen(false)}
        onSuccess={executeSubmit}
        title="Confirmar submissão ao eSocial"
        description="Operação regulatória: esta ação irá gerar eventos S-1200 e registrá-los como aceitos no batch. Digite seu PIN de Ação para prosseguir."
      />
    </Card>
  );
}
