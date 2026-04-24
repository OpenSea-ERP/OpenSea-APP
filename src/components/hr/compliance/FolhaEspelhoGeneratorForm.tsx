'use client';

/**
 * OpenSea OS - FolhaEspelhoGeneratorForm (Phase 06 / Plan 06-06)
 *
 * Dois modos:
 *   - Individual: employeeId + competencia → POST /folhas-espelho (síncrono)
 *     → toast sucesso + window.open(downloadUrl)
 *   - Em lote:   scope (ALL/DEPARTMENT/CUSTOM) + competencia
 *                → POST /folhas-espelho/bulk → bulkJobId
 *                → Drawer lateral com Socket.IO progress
 *                (compliance.folha_espelho.progress/.completed em tenant:{id}:hr)
 *
 * Permission: hr.compliance.folha-espelho.generate (page-level gate).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  Loader2,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  useGenerateFolhaEspelho,
  useGenerateFolhaEspelhoBulk,
} from '@/hooks/hr/use-generate-folha-espelho';
import { useComplianceBulkProgress } from '@/hooks/hr/use-compliance-bulk-progress';
import type { FolhaEspelhoScope } from '@/types/hr';
import { toast } from 'sonner';

const COMPETENCIA_RE = /^\d{4}-\d{2}$/;

function parseIdList(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

/* -------------------------------------------------------------------------- */
/* Individual                                                                 */
/* -------------------------------------------------------------------------- */

function IndividualTab() {
  const router = useRouter();
  const generate = useGenerateFolhaEspelho();
  const [employeeId, setEmployeeId] = useState('');
  const [competencia, setCompetencia] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!employeeId) {
      setErr('Informe o ID do funcionário.');
      return;
    }
    if (!COMPETENCIA_RE.test(competencia)) {
      setErr('Competência deve estar em formato AAAA-MM.');
      return;
    }
    try {
      const result = await generate.mutateAsync({ employeeId, competencia });
      toast.success(
        `Folha espelho gerada! ${(result.sizeBytes / 1024).toFixed(1)} KB · abrindo em nova aba.`
      );
      if (result.downloadUrl && typeof window !== 'undefined') {
        window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
      }
      router.push('/hr/compliance');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao gerar folha';
      toast.error(msg);
      setErr(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fe-employee">ID do funcionário *</Label>
        <Input
          id="fe-employee"
          value={employeeId}
          onChange={e => setEmployeeId(e.target.value.trim())}
          placeholder="UUID do funcionário"
          required
        />
        <p className="text-xs text-muted-foreground">
          Cole o UUID exibido em{' '}
          <span className="font-mono">/hr/employees</span>. Em breve um combobox
          de busca será adicionado.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fe-comp">Competência *</Label>
        <Input
          id="fe-comp"
          value={competencia}
          onChange={e => setCompetencia(e.target.value)}
          placeholder="AAAA-MM (ex.: 2026-03)"
          pattern="\d{4}-\d{2}"
          maxLength={7}
          required
        />
      </div>
      {err && (
        <p
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
        >
          {err}
        </p>
      )}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push('/hr/compliance')}
          disabled={generate.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={generate.isPending}
          className="gap-2"
        >
          {generate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Gerar folha
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Bulk                                                                       */
/* -------------------------------------------------------------------------- */

function BulkTab() {
  const bulk = useGenerateFolhaEspelhoBulk();
  const [competencia, setCompetencia] = useState('');
  const [scope, setScope] = useState<FolhaEspelhoScope>('ALL');
  const [departmentIds, setDepartmentIds] = useState('');
  const [employeeIds, setEmployeeIds] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  const { progress, jobDone } = useComplianceBulkProgress(jobId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!COMPETENCIA_RE.test(competencia)) {
      setErr('Competência deve estar em formato AAAA-MM.');
      return;
    }
    if (scope === 'DEPARTMENT' && parseIdList(departmentIds).length === 0) {
      setErr('Informe pelo menos um departamento.');
      return;
    }
    if (scope === 'CUSTOM' && parseIdList(employeeIds).length === 0) {
      setErr('Informe pelo menos um funcionário.');
      return;
    }
    try {
      const body = {
        competencia,
        scope,
        ...(scope === 'DEPARTMENT'
          ? { departmentIds: parseIdList(departmentIds) }
          : {}),
        ...(scope === 'CUSTOM'
          ? { employeeIds: parseIdList(employeeIds) }
          : {}),
      };
      const result = await bulk.mutateAsync(body);
      setJobId(result.bulkJobId);
      setTotal(result.employeeCount);
      toast.success(
        `Lote criado: ${result.employeeCount} funcionário(s). Acompanhe o progresso ao lado.`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao enfileirar';
      toast.error(msg);
      setErr(msg);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fe-bulk-comp">Competência *</Label>
            <Input
              id="fe-bulk-comp"
              value={competencia}
              onChange={e => setCompetencia(e.target.value)}
              placeholder="AAAA-MM"
              pattern="\d{4}-\d{2}"
              maxLength={7}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fe-bulk-scope">Escopo *</Label>
            <Select
              value={scope}
              onValueChange={v => setScope(v as FolhaEspelhoScope)}
            >
              <SelectTrigger id="fe-bulk-scope">
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
            <Label htmlFor="fe-depts">IDs de departamento *</Label>
            <Input
              id="fe-depts"
              value={departmentIds}
              onChange={e => setDepartmentIds(e.target.value)}
              placeholder="UUIDs separados por vírgula, espaço ou quebra de linha"
              required
            />
          </div>
        )}

        {scope === 'CUSTOM' && (
          <div className="space-y-1.5">
            <Label htmlFor="fe-emps">IDs de funcionários *</Label>
            <Input
              id="fe-emps"
              value={employeeIds}
              onChange={e => setEmployeeIds(e.target.value)}
              placeholder="UUIDs separados por vírgula, espaço ou quebra de linha"
              required
            />
            <p className="text-xs text-muted-foreground">
              Máximo de 500 funcionários por lote (limite anti-DoS).
            </p>
          </div>
        )}

        {err && (
          <p
            role="alert"
            className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
          >
            {err}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="submit"
            size="sm"
            disabled={bulk.isPending}
            className="gap-2"
          >
            {bulk.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Enfileirar lote
          </Button>
        </div>
      </form>

      <Drawer
        open={jobId !== null}
        onOpenChange={next => {
          if (!next) setJobId(null);
        }}
        modal={false}
        dismissible
      >
        <DrawerContent
          className="h-[320px]"
          data-testid="folha-espelho-bulk-drawer"
        >
          <DrawerHeader className="relative">
            <DrawerTitle className="flex items-center gap-2">
              {jobDone ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              )}
              {jobDone ? 'Lote concluído' : 'Gerando folhas espelho...'}
            </DrawerTitle>
            <DrawerDescription className="mt-1">
              {jobDone
                ? `${progress?.success ?? 0} folha(s) geradas · ${progress?.failed ?? 0} falha(s) · total ${progress?.total ?? total}.`
                : `${progress?.success ?? 0} de ${progress?.total ?? total} processadas · ${progress?.failed ?? 0} falha(s).`}
            </DrawerDescription>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-3"
                aria-label="Fechar painel"
              >
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pb-6">
            <Progress
              value={
                progress?.total && progress.total > 0
                  ? Math.floor(
                      ((progress.success + progress.failed) / progress.total) *
                        100
                    )
                  : jobDone
                    ? 100
                    : 0
              }
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {progress?.total ?? total} funcionário(s)
              </span>
              {progress?.failed && progress.failed > 0 ? (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  {progress.failed} falha(s) — verifique observações no
                  dashboard.
                </span>
              ) : null}
            </div>
            <div className="mt-auto flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setJobId(null)}
              >
                {jobDone ? 'Fechar' : 'Fechar (lote continua)'}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Container                                                                  */
/* -------------------------------------------------------------------------- */

export function FolhaEspelhoGeneratorForm() {
  const [mode, setMode] = useState<'individual' | 'bulk'>('individual');
  return (
    <Card className="mx-auto max-w-3xl border-border bg-white p-6 dark:bg-slate-800/60">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-semibold">Gerar Folhas Espelho</h2>
      </div>
      <Tabs
        value={mode}
        onValueChange={v => setMode(v as 'individual' | 'bulk')}
      >
        <TabsList className="mb-4 grid h-11 w-full max-w-md grid-cols-2">
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="bulk">Em lote</TabsTrigger>
        </TabsList>
        <TabsContent value="individual">
          <IndividualTab />
        </TabsContent>
        <TabsContent value="bulk">
          <BulkTab />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
