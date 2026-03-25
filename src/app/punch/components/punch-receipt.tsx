'use client';

import { useCallback } from 'react';
import { CheckCircle2, Download, MapPin, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimeEntry } from '@/types/hr';

type PunchType = 'CLOCK_IN' | 'CLOCK_OUT';

interface PunchReceiptProps {
  entry: TimeEntry;
  type: PunchType;
  timestamp: Date;
  employeeName: string;
  employeeCpf?: string;
  tenantName?: string;
  tenantCnpj?: string;
  zoneName?: string;
  latitude?: number | null;
  longitude?: number | null;
  selfieData?: string | null;
  onReset: () => void;
}

function maskCpf(cpf?: string): string {
  if (!cpf) return '---';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return '***.***.***-**';
  return `***.***.***.${clean.slice(9, 11)}`;
}

export function PunchReceipt({
  entry,
  type,
  timestamp,
  employeeName,
  employeeCpf,
  tenantName,
  tenantCnpj,
  zoneName,
  latitude,
  longitude,
  selfieData,
  onReset,
}: PunchReceiptProps) {
  const label = type === 'CLOCK_IN' ? 'ENTRADA' : 'SAÍDA';
  const time = timestamp.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const date = timestamp.toLocaleDateString('pt-BR');
  const nsr = entry.id.slice(0, 8).toUpperCase();

  const handleDownloadReceipt = useCallback(() => {
    const lines = [
      '═══════════════════════════════════════════',
      '         COMPROVANTE DE REGISTRO DE PONTO  ',
      '═══════════════════════════════════════════',
      '',
    ];

    if (tenantName) {
      lines.push(`  Empresa:      ${tenantName}`);
    }
    if (tenantCnpj) {
      lines.push(`  CNPJ:         ${tenantCnpj}`);
    }
    if (zoneName) {
      lines.push(`  Local:        ${zoneName}`);
    }

    lines.push('');
    lines.push(`  Funcionário:  ${employeeName || 'N/A'}`);
    lines.push(`  CPF:          ${maskCpf(employeeCpf)}`);
    lines.push('');
    lines.push(`  Tipo:         ${label}`);
    lines.push(`  Data/Hora:    ${date} ${time}`);
    lines.push(`  NSR:          #${nsr}`);
    lines.push('');

    if (latitude != null && longitude != null) {
      lines.push(`  Lat: ${latitude.toFixed(6)}  Lng: ${longitude.toFixed(6)}`);
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════');
    lines.push('         OpenSea Ponto Digital             ');
    lines.push('═══════════════════════════════════════════');

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprovante-ponto-${date.replace(/\//g, '-')}-${time.replace(/:/g, '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [
    tenantName,
    tenantCnpj,
    zoneName,
    employeeName,
    employeeCpf,
    label,
    date,
    time,
    nsr,
    latitude,
    longitude,
  ]);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'rounded-2xl p-5 border',
          'bg-emerald-50 dark:bg-emerald-950/30',
          'border-emerald-200 dark:border-emerald-800'
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <CheckCircle2 className="size-7 text-emerald-500" />
          <div>
            <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
              Ponto Registrado
            </h2>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              NSR #{nsr}
            </p>
          </div>
        </div>

        {/* Receipt details */}
        <div className="space-y-3">
          {/* Company info */}
          {(tenantName || tenantCnpj) && (
            <div className="space-y-1.5 pb-3 border-b border-emerald-200/50 dark:border-emerald-800/50">
              {tenantName && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600/80 dark:text-emerald-400/80">
                    Empresa
                  </span>
                  <span className="font-medium text-emerald-800 dark:text-emerald-200 text-right">
                    {tenantName}
                  </span>
                </div>
              )}
              {tenantCnpj && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600/80 dark:text-emerald-400/80">
                    CNPJ
                  </span>
                  <span className="font-mono text-xs text-emerald-700 dark:text-emerald-300">
                    {tenantCnpj}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Employee info */}
          <div className="space-y-1.5 pb-3 border-b border-emerald-200/50 dark:border-emerald-800/50">
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600/80 dark:text-emerald-400/80">
                Funcionário
              </span>
              <span className="font-medium text-emerald-800 dark:text-emerald-200 text-right">
                {employeeName || 'N/A'}
              </span>
            </div>
            {employeeCpf && (
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600/80 dark:text-emerald-400/80">
                  CPF
                </span>
                <span className="font-mono text-xs text-emerald-700 dark:text-emerald-300">
                  {maskCpf(employeeCpf)}
                </span>
              </div>
            )}
          </div>

          {/* Punch details */}
          <div className="space-y-1.5 pb-3 border-b border-emerald-200/50 dark:border-emerald-800/50">
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600/80 dark:text-emerald-400/80">
                Tipo
              </span>
              <span
                className={cn(
                  'font-semibold',
                  type === 'CLOCK_IN'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-rose-700 dark:text-rose-300'
                )}
              >
                {type === 'CLOCK_IN' ? 'Entrada' : 'Saída'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600/80 dark:text-emerald-400/80">
                Data/Hora
              </span>
              <span className="font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">
                {date} {time}
              </span>
            </div>
          </div>

          {/* Location */}
          {latitude != null && longitude != null && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-sm">
                <MapPin className="size-3.5 text-emerald-500" />
                <span className="text-emerald-600/80 dark:text-emerald-400/80">
                  Localização
                </span>
              </div>
              <p className="font-mono text-xs text-emerald-700 dark:text-emerald-300 tabular-nums pl-5">
                Lat: {latitude.toFixed(6)} &nbsp; Lng: {longitude.toFixed(6)}
              </p>
              {zoneName && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 pl-5">
                  Zona: {zoneName}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Selfie thumbnail */}
        {selfieData && (
          <div className="mt-4 rounded-xl overflow-hidden">
            <img
              src={selfieData}
              alt="Foto do registro"
              className="w-full h-32 object-cover"
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleDownloadReceipt}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 rounded-2xl h-14',
            'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
            'text-slate-700 dark:text-slate-200 font-semibold text-sm',
            'active:scale-[0.98] transition-all'
          )}
        >
          <Download className="size-4" />
          Baixar Comprovante
        </button>
        <button
          type="button"
          onClick={onReset}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 rounded-2xl h-14',
            'bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm',
            'active:scale-[0.98] transition-all shadow-sm'
          )}
        >
          <RotateCcw className="size-4" />
          Novo Registro
        </button>
      </div>
    </div>
  );
}
