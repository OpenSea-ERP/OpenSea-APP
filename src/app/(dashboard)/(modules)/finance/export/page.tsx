'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useExportAccounting } from '@/hooks/finance';

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function ExportPage() {
  const router = useRouter();
  const defaultRange = getMonthRange();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [format, setFormat] = useState<'CSV' | 'PDF' | 'XLSX' | 'DOCX'>('CSV');
  const [reportType, setReportType] = useState<'ENTRIES' | 'DRE' | 'BALANCE' | 'CASHFLOW'>('ENTRIES');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const { mutate: exportAccounting, isPending } = useExportAccounting();

  const handleExport = () => {
    if (!startDate || !endDate) {
      setMessage({
        type: 'error',
        text: 'Preencha as datas de início e fim.',
      });
      return;
    }

    setMessage(null);
    exportAccounting(
      { startDate, endDate, format, reportType },
      {
        onSuccess: () => {
          setMessage({
            type: 'success',
            text: 'Exportação realizada com sucesso.',
          });
        },
        onError: error => {
          setMessage({
            type: 'error',
            text:
              error instanceof Error
                ? error.message
                : 'Não foi possível exportar os dados.',
          });
        },
      }
    );
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
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Configurar Exportação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Tipo de Relatório</Label>
            <div className="flex flex-wrap gap-4">
              {([
                ['ENTRIES', 'Lançamentos'],
                ['DRE', 'DRE'],
                ['BALANCE', 'Balanço'],
                ['CASHFLOW', 'Fluxo de Caixa'],
              ] as const).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reportType"
                    value={value}
                    checked={reportType === value}
                    onChange={() => setReportType(value)}
                    className="accent-blue-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Formato de Exportação</Label>
            <div className="flex flex-wrap gap-4">
              {([
                ['CSV', 'CSV'],
                ['PDF', 'PDF'],
                ['XLSX', 'Excel (XLSX)'],
                ['DOCX', 'Word (DOCX)'],
              ] as const).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value={value}
                    checked={format === value}
                    onChange={() => setFormat(value)}
                    className="accent-blue-600"
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

      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">
              Informações sobre os formatos
            </h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
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
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
