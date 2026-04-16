'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useExportAccounting } from '@/hooks/finance';
import { useExportSpedEfd } from '@/hooks/finance/use-reports';
import { useListCompanies } from '@/app/(dashboard)/(modules)/admin/(entities)/companies/src/api/list-companies.query';

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

export default function ExportPage() {
  const router = useRouter();
  const defaultRange = getMonthRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [format, setFormat] = useState<'CSV' | 'PDF' | 'XLSX' | 'DOCX'>('CSV');
  const [reportType, setReportType] = useState<
    'ENTRIES' | 'DRE' | 'BALANCE' | 'CASHFLOW'
  >('ENTRIES');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // SPED EFD state
  const now = new Date();
  const [efdYear, setEfdYear] = useState(String(now.getFullYear()));
  const [efdMonth, setEfdMonth] = useState(String(now.getMonth() + 1));
  const [efdCompanyId, setEfdCompanyId] = useState<string>('');
  const [efdExpanded, setEfdExpanded] = useState(false);

  const { mutateAsync: exportAccounting, isPending } = useExportAccounting();
  const { mutateAsync: exportSpedEfd, isPending: efdPending } =
    useExportSpedEfd();
  const { data: companiesData } = useListCompanies();

  const handleExport = async () => {
    if (!startDate || !endDate) {
      setMessage({
        type: 'error',
        text: 'Preencha as datas de início e fim.',
      });
      return;
    }

    setMessage(null);
    try {
      await exportAccounting({ startDate, endDate, format, reportType });
      setMessage({
        type: 'success',
        text: 'Exportação realizada com sucesso.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Não foi possível exportar os dados.',
      });
    }
  };

  const handleExportSpedEfd = async () => {
    setMessage(null);
    try {
      await exportSpedEfd({
        year: Number(efdYear),
        month: Number(efdMonth),
        companyId: efdCompanyId || undefined,
      });
      setMessage({
        type: 'success',
        text: 'SPED EFD-Contribuições exportado com sucesso.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Não foi possível exportar o SPED EFD.',
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/finance')}
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Exportação Contábil</h1>
          <p className="text-muted-foreground">
            Exporte os lançamentos financeiros para integração com sistemas
            contábeis.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Standard Accounting Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportação Padrão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <DatePicker
                id="startDate"
                value={startDate}
                onChange={v => setStartDate(typeof v === 'string' ? v : '')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <DatePicker
                id="endDate"
                value={endDate}
                onChange={v => setEndDate(typeof v === 'string' ? v : '')}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Tipo de Relatório</Label>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ['ENTRIES', 'Lançamentos'],
                  ['DRE', 'DRE'],
                  ['BALANCE', 'Balanço'],
                  ['CASHFLOW', 'Fluxo de Caixa'],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={value}
                    checked={reportType === value}
                    onChange={() => setReportType(value)}
                    className="accent-violet-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Formato de Exportação</Label>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ['CSV', 'CSV'],
                  ['PDF', 'PDF'],
                  ['XLSX', 'Excel (XLSX)'],
                  ['DOCX', 'Word (DOCX)'],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="format"
                    value={value}
                    checked={format === value}
                    onChange={() => setFormat(value)}
                    className="accent-violet-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleExport}
              disabled={isPending}
              size="lg"
              className="min-w-[200px]"
            >
              {isPending ? (
                'Exportando...'
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SPED EFD-Contribuições */}
      <Card>
        <CardHeader>
          <button
            type="button"
            className="flex items-center justify-between w-full"
            onClick={() => setEfdExpanded(!efdExpanded)}
          >
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              EFD-Contribuições (SPED)
            </CardTitle>
            {efdExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          {!efdExpanded && (
            <p className="text-sm text-muted-foreground mt-1">
              Gere o arquivo SPED EFD-Contribuições com apuração de PIS e COFINS
            </p>
          )}
        </CardHeader>
        {efdExpanded && (
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Gere o arquivo texto no formato SPED EFD-Contribuições com os
              blocos 0 (Abertura), M (Apuração PIS/COFINS) e 9 (Controle). Os
              valores de PIS e COFINS são calculados a partir das retenções
              cadastradas nos lançamentos do período.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Ano</Label>
                <Input
                  type="number"
                  min="2020"
                  max="2100"
                  value={efdYear}
                  onChange={e => setEfdYear(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mês</Label>
                <Select value={efdMonth} onValueChange={setEfdMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Empresa (opcional)</Label>
                {/* Radix Select rejects SelectItem value=""; use a sentinel and
                    map back to '' when reading the actual filter value. */}
                <Select
                  value={efdCompanyId || '__all__'}
                  onValueChange={v => setEfdCompanyId(v === '__all__' ? '' : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas as empresas</SelectItem>
                    {companiesData?.companies?.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.tradeName || company.legalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleExportSpedEfd}
                disabled={efdPending}
                size="lg"
                className="min-w-[200px]"
                variant="outline"
              >
                {efdPending ? (
                  'Gerando...'
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar EFD-Contribuições
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Info card */}
      <Card className="border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-900/20">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-violet-900 dark:text-violet-300">
              Informações sobre os formatos
            </h3>
            <ul className="space-y-1 text-sm text-violet-800 dark:text-violet-400">
              <li>
                <strong>CSV:</strong> Formato universal compatível com Excel,
                Google Sheets e sistemas contábeis.
              </li>
              <li>
                <strong>PDF:</strong> Documento formatado para impressão e
                arquivamento.
              </li>
              <li>
                <strong>XLSX:</strong> Planilha Excel com formatação e bordas.
              </li>
              <li>
                <strong>DOCX:</strong> Documento Word com tabelas formatadas.
              </li>
              <li>
                <strong>SPED EFD:</strong> Arquivo texto no padrão da Receita
                Federal para escrituração digital de PIS/COFINS.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
