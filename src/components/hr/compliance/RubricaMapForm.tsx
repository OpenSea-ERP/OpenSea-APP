'use client';

/**
 * OpenSea OS - RubricaMapForm (Phase 06 / Plan 06-06)
 *
 * Configuração do mapeamento conceito CLT → (codRubr / ideTabRubr / indApurIR)
 * por tenant. 6 concepts suportados:
 *   - HE_50, HE_100, DSR  (obrigatórios — D-06-05-07 gate)
 *   - FERIAS, FALTA_JUSTIFICADA, SALARIO_BASE (opcionais)
 *
 * Gaps visíveis no topo: se algum obrigatório ausente → banner amber explícito.
 *
 * Permission: hr.compliance.config.modify.
 */

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cog,
  Loader2,
  Pencil,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GridError } from '@/components/handlers/grid-error';
import {
  useListRubricaMap,
  useUpsertRubricaMap,
} from '@/hooks/hr/use-esocial-rubricas';
import type {
  ComplianceRubricaConcept,
  ComplianceRubricaMapDto,
} from '@/types/hr';
import { toast } from 'sonner';

const ALL_CONCEPTS: Array<{
  key: ComplianceRubricaConcept;
  label: string;
  required: boolean;
}> = [
  { key: 'HE_50', label: 'Hora Extra 50%', required: true },
  { key: 'HE_100', label: 'Hora Extra 100%', required: true },
  { key: 'DSR', label: 'Descanso Semanal Remunerado (DSR)', required: true },
  { key: 'FERIAS', label: 'Férias', required: false },
  { key: 'FALTA_JUSTIFICADA', label: 'Falta Justificada', required: false },
  { key: 'SALARIO_BASE', label: 'Salário Base', required: false },
];

interface RubricaCardProps {
  concept: ComplianceRubricaConcept;
  label: string;
  required: boolean;
  existing: ComplianceRubricaMapDto | undefined;
  missing: boolean;
  onSaved: () => void;
}

function RubricaCard({
  concept,
  label,
  required,
  existing,
  missing,
  onSaved,
}: RubricaCardProps) {
  const upsert = useUpsertRubricaMap();
  const [editing, setEditing] = useState(false);
  const [codRubr, setCodRubr] = useState(existing?.codRubr ?? '');
  const [ideTabRubr, setIdeTabRubr] = useState(existing?.ideTabRubr ?? '');
  const [indApurIR, setIndApurIR] = useState(existing?.indApurIR ?? '0');

  const reset = () => {
    setCodRubr(existing?.codRubr ?? '');
    setIdeTabRubr(existing?.ideTabRubr ?? '');
    setIndApurIR(existing?.indApurIR ?? '0');
    setEditing(false);
  };

  const save = async () => {
    if (!codRubr.trim() || !ideTabRubr.trim()) {
      toast.error('Preencha codRubr e ideTabRubr.');
      return;
    }
    try {
      await upsert.mutateAsync({
        concept,
        body: {
          codRubr: codRubr.trim(),
          ideTabRubr: ideTabRubr.trim(),
          indApurIR: indApurIR.trim() || '0',
        },
      });
      toast.success(`${label} salvo.`);
      setEditing(false);
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar';
      toast.error(msg);
    }
  };

  return (
    <Card
      className={`border-border bg-white p-4 dark:bg-slate-800/60 ${
        missing ? 'border-amber-400 dark:border-amber-500/50' : ''
      }`}
      data-testid={`rubrica-card-${concept}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{label}</h3>
            {required ? (
              <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                Obrigatório
              </span>
            ) : (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-500/20 dark:text-slate-400">
                Opcional
              </span>
            )}
            {existing ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : required ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Concept: <span className="font-mono">{concept}</span>
          </p>
        </div>
        {!editing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
            className="gap-1"
          >
            <Pencil className="h-3 w-3" />
            {existing ? 'Editar' : 'Configurar'}
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor={`rub-${concept}-code`} className="text-xs">
                codRubr *
              </Label>
              <Input
                id={`rub-${concept}-code`}
                value={codRubr}
                onChange={e => setCodRubr(e.target.value)}
                placeholder="Ex.: 1000"
                maxLength={30}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`rub-${concept}-tab`} className="text-xs">
                ideTabRubr *
              </Label>
              <Input
                id={`rub-${concept}-tab`}
                value={ideTabRubr}
                onChange={e => setIdeTabRubr(e.target.value)}
                placeholder="Ex.: 01"
                maxLength={8}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`rub-${concept}-ir`} className="text-xs">
                indApurIR
              </Label>
              <Input
                id={`rub-${concept}-ir`}
                value={indApurIR}
                onChange={e => setIndApurIR(e.target.value)}
                placeholder="0, 1 ou 2"
                maxLength={1}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              disabled={upsert.isPending}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={save}
              disabled={upsert.isPending}
              className="gap-1"
            >
              {upsert.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Salvar
            </Button>
          </div>
        </div>
      ) : existing ? (
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <div className="text-muted-foreground">codRubr</div>
            <div className="font-mono font-medium">{existing.codRubr}</div>
          </div>
          <div>
            <div className="text-muted-foreground">ideTabRubr</div>
            <div className="font-mono font-medium">{existing.ideTabRubr}</div>
          </div>
          <div>
            <div className="text-muted-foreground">indApurIR</div>
            <div className="font-mono font-medium">{existing.indApurIR}</div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {required
            ? 'Configure antes de submeter S-1200 — obrigatório.'
            : 'Não configurado (opcional).'}
        </p>
      )}
    </Card>
  );
}

export function RubricaMapForm() {
  const { data, isLoading, error, refetch } = useListRubricaMap();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <GridError
          type="server"
          title="Falha ao carregar mapeamentos"
          message={
            error instanceof Error ? error.message : 'Erro ao carregar rubricas'
          }
          action={{
            label: 'Tentar novamente',
            onClick: () => {
              void refetch();
            },
          }}
        />
      </div>
    );
  }

  const items = data?.items ?? [];
  const gaps = data?.gaps ?? [];
  const existingByConcept = new Map(items.map(it => [it.clrConcept, it]));

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="border-border bg-white p-5 dark:bg-slate-800/60">
        <div className="flex items-start gap-3">
          <Cog className="mt-0.5 h-5 w-5 text-indigo-500" />
          <div className="space-y-1">
            <h2 className="text-base font-semibold">
              Mapeamento de Rubricas (eSocial S-1010)
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure as rubricas do eSocial S-1010 para cada conceito CLT.
              Estas rubricas serão usadas ao gerar o evento{' '}
              <span className="font-mono">S-1200</span>. Os três primeiros
              conceitos (HE_50, HE_100, DSR) são <strong>obrigatórios</strong>{' '}
              antes de submeter S-1200.
            </p>
          </div>
        </div>
      </Card>

      {gaps.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-500/40 dark:bg-amber-500/10"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-200">
              {gaps.length} mapeamento(s) obrigatório(s) ausente(s)
            </p>
            <p className="mt-1 text-amber-800 dark:text-amber-300">
              Conceito(s) faltante(s):{' '}
              <span className="font-mono">{gaps.join(', ')}</span>. Configure
              abaixo antes de submeter S-1200.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {ALL_CONCEPTS.map(c => (
          <RubricaCard
            key={c.key}
            concept={c.key}
            label={c.label}
            required={c.required}
            existing={existingByConcept.get(c.key)}
            missing={c.required && gaps.includes(c.key)}
            onSaved={() => {
              void refetch();
            }}
          />
        ))}
      </div>
    </div>
  );
}
