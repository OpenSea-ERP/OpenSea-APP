'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useApplyRetentions,
  useCalculateRetentions,
  useEntryRetentions,
} from '@/hooks/finance';
import type {
  RetentionConfig,
  RetentionSummary,
  PisCofinsRegime,
  TaxType,
} from '@/types/finance';
import { Calculator, CheckCircle2, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

const TAX_TYPE_LABELS: Record<TaxType, string> = {
  IRRF: 'IRRF',
  ISS: 'ISS',
  INSS: 'INSS',
  PIS: 'PIS',
  COFINS: 'COFINS',
  CSLL: 'CSLL',
};

// ============================================================================
// PROPS
// ============================================================================

interface TaxRetentionPanelProps {
  entryId: string;
  grossAmount: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TaxRetentionPanel({
  entryId,
  grossAmount,
}: TaxRetentionPanelProps) {
  const { data: retentionsData, refetch } = useEntryRetentions(entryId);
  const calculateMutation = useCalculateRetentions();
  const applyMutation = useApplyRetentions();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [preview, setPreview] = useState<RetentionSummary | null>(null);

  // Config state
  const [applyIRRF, setApplyIRRF] = useState(false);
  const [applyISS, setApplyISS] = useState(false);
  const [applyINSS, setApplyINSS] = useState(false);
  const [applyPIS, setApplyPIS] = useState(false);
  const [applyCOFINS, setApplyCOFINS] = useState(false);
  const [applyCSLL, setApplyCSLL] = useState(false);
  const [issRate, setIssRate] = useState('5');
  const [taxRegime, setTaxRegime] = useState<PisCofinsRegime>('CUMULATIVO');

  const existingRetentions = retentionsData?.retentions ?? [];
  const hasRetentions = existingRetentions.length > 0;

  const buildConfig = useCallback((): RetentionConfig => {
    return {
      applyIRRF,
      applyISS,
      applyINSS,
      applyPIS,
      applyCOFINS,
      applyCSLL,
      issRate: applyISS ? Number(issRate) / 100 : undefined,
      taxRegime: applyPIS || applyCOFINS ? taxRegime : undefined,
    };
  }, [
    applyIRRF,
    applyISS,
    applyINSS,
    applyPIS,
    applyCOFINS,
    applyCSLL,
    issRate,
    taxRegime,
  ]);

  const hasAnySelected =
    applyIRRF || applyISS || applyINSS || applyPIS || applyCOFINS || applyCSLL;

  const handleCalculate = useCallback(async () => {
    try {
      const result = await calculateMutation.mutateAsync({
        entryId,
        config: buildConfig(),
      });
      setPreview(result.summary);
    } catch {
      toast.error('Erro ao calcular retenções.');
    }
  }, [entryId, buildConfig, calculateMutation]);

  const handleApply = useCallback(async () => {
    try {
      await applyMutation.mutateAsync({
        entryId,
        config: buildConfig(),
      });
      toast.success('Retenções aplicadas com sucesso.');
      setPreview(null);
      setPopoverOpen(false);
      refetch();
    } catch {
      toast.error('Erro ao aplicar retenções.');
    }
  }, [entryId, buildConfig, applyMutation, refetch]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Retenções Tributárias
            {hasRetentions && (
              <Badge variant="secondary">{existingRetentions.length}</Badge>
            )}
          </CardTitle>

          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Calculator className="h-4 w-4" />
                {hasRetentions ? 'Recalcular' : 'Calcular Retenções'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">
                    Configurar Retenções
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Valor bruto: {formatCurrency(grossAmount)}
                  </p>
                </div>

                {/* Tax checkboxes */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="irrf"
                      checked={applyIRRF}
                      onCheckedChange={v => setApplyIRRF(!!v)}
                    />
                    <Label htmlFor="irrf" className="text-sm">
                      IRRF — Imposto de Renda
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="iss"
                        checked={applyISS}
                        onCheckedChange={v => setApplyISS(!!v)}
                      />
                      <Label htmlFor="iss" className="text-sm">
                        ISS — Imposto Sobre Serviços
                      </Label>
                    </div>
                    {applyISS && (
                      <div className="ml-6">
                        <Label
                          htmlFor="iss-rate"
                          className="text-xs text-muted-foreground"
                        >
                          Alíquota ISS (%)
                        </Label>
                        <Input
                          id="iss-rate"
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={issRate}
                          onChange={e => setIssRate(e.target.value)}
                          className="h-8 w-24 mt-1"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="inss"
                      checked={applyINSS}
                      onCheckedChange={v => setApplyINSS(!!v)}
                    />
                    <Label htmlFor="inss" className="text-sm">
                      INSS — Previdência Social
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="pis"
                      checked={applyPIS}
                      onCheckedChange={v => setApplyPIS(!!v)}
                    />
                    <Label htmlFor="pis" className="text-sm">
                      PIS
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cofins"
                      checked={applyCOFINS}
                      onCheckedChange={v => setApplyCOFINS(!!v)}
                    />
                    <Label htmlFor="cofins" className="text-sm">
                      COFINS
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="csll"
                      checked={applyCSLL}
                      onCheckedChange={v => setApplyCSLL(!!v)}
                    />
                    <Label htmlFor="csll" className="text-sm">
                      CSLL
                    </Label>
                  </div>
                </div>

                {/* Tax regime for PIS/COFINS */}
                {(applyPIS || applyCOFINS) && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Regime Tributário (PIS/COFINS)
                    </Label>
                    <Select
                      value={taxRegime}
                      onValueChange={v => setTaxRegime(v as PisCofinsRegime)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUMULATIVO">Cumulativo</SelectItem>
                        <SelectItem value="NAO_CUMULATIVO">
                          Não-Cumulativo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Preview */}
                {preview && (
                  <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground">
                      Prévia do cálculo
                    </p>
                    {preview.retentions
                      .filter(r => r.amount > 0)
                      .map((r, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{TAX_TYPE_LABELS[r.taxType]}</span>
                          <span className="text-amber-600 dark:text-amber-400 font-mono">
                            -{formatCurrency(r.amount)}
                          </span>
                        </div>
                      ))}
                    <div className="border-t pt-2 mt-2 flex justify-between text-sm font-medium">
                      <span>Total retido</span>
                      <span className="text-amber-600 dark:text-amber-400 font-mono">
                        -{formatCurrency(preview.totalRetained)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Valor líquido</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(preview.netAmount)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={handleCalculate}
                    disabled={!hasAnySelected || calculateMutation.isPending}
                  >
                    {calculateMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Calculator className="h-3 w-3" />
                    )}
                    Calcular
                  </Button>
                  {preview && (
                    <Button
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={handleApply}
                      disabled={applyMutation.isPending}
                    >
                      {applyMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      Aplicar
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <CardContent>
        {hasRetentions ? (
          <div className="space-y-4">
            <Table aria-label="Tabela de retenções tributárias">
              <TableHeader>
                <TableRow>
                  <TableHead>Tributo</TableHead>
                  <TableHead className="text-right">Alíquota</TableHead>
                  <TableHead className="text-right">Valor Retido</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingRetentions.map(retention => (
                  <TableRow key={retention.id}>
                    <TableCell className="text-sm font-medium">
                      {TAX_TYPE_LABELS[retention.taxType as TaxType] ??
                        retention.taxType}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">
                      {formatRate(retention.rate)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono text-amber-600 dark:text-amber-400">
                      -{formatCurrency(retention.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={retention.withheld ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {retention.withheld ? 'Retido' : 'Pendente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Summary footer */}
            <div className="flex flex-col gap-2 pt-2 border-t">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Valor Bruto</span>
                <span className="font-mono text-violet-600 dark:text-violet-400">
                  {formatCurrency(grossAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Retido</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">
                  -{formatCurrency(retentionsData?.totalRetained ?? 0)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span>Valor Líquido</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(
                    grossAmount - (retentionsData?.totalRetained ?? 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhuma retenção tributária aplicada.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
