/**
 * Câmbio — Conversor de Moedas
 * Consulta cotações de câmbio em tempo real via Banco Central do Brasil (PTAX).
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useExchangeRate } from '@/hooks/finance/use-exchange-rates';
import { ArrowRight, CalendarDays, DollarSign, RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

const CURRENCIES = [
  { code: 'USD', name: 'Dólar Americano', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'Libra Esterlina', flag: '🇬🇧' },
] as const;

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRate(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ============================================================================
// RATE CARD COMPONENT
// ============================================================================

interface RateCardProps {
  currency: (typeof CURRENCIES)[number];
  date?: string;
}

function RateCard({ currency, date }: RateCardProps) {
  const { data, isLoading, isError } = useExchangeRate(currency.code, date);

  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{currency.flag}</span>
          <div>
            <p className="font-semibold text-sm text-foreground">
              {currency.name}
            </p>
            <p className="text-xs text-muted-foreground">{currency.code}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : isError ? (
          <div className="text-sm text-rose-500 dark:text-rose-400">
            Erro ao carregar cotação
          </div>
        ) : data ? (
          <div>
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {formatRate(data.rate)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.source} &middot; {formatDateBR(data.date)}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ExchangeRatesPage() {
  const [amount, setAmount] = useState<number>(1);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [date, setDate] = useState<string>(getTodayISO());

  const {
    data: rateData,
    isLoading,
    isError,
    isFetching,
  } = useExchangeRate(selectedCurrency, date);

  const convertedAmount = useMemo(() => {
    if (!rateData?.rate || !amount) return 0;
    return amount * rateData.rate;
  }, [rateData?.rate, amount]);

  const selectedCurrencyInfo = useMemo(
    () => CURRENCIES.find(c => c.code === selectedCurrency),
    [selectedCurrency]
  );

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setAmount(isNaN(value) ? 0 : value);
    },
    []
  );

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Câmbio' },
          ]}
        />
      </PageHeader>

      <PageBody>
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Main Converter Card */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-500/10">
                  <DollarSign className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Conversor de Moedas</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Consulte cotações de câmbio em tempo real via Banco Central
                    do Brasil
                  </p>
                </div>
                {isFetching && (
                  <RefreshCw className="h-4 w-4 ml-auto text-teal-500 animate-spin" />
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Converter Row */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_1fr] gap-4 items-end">
                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={0}
                    step={0.01}
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="1.00"
                  />
                </div>

                {/* Currency Select */}
                <div className="space-y-2">
                  <Label>Moeda de Origem</Label>
                  <Select
                    value={selectedCurrency}
                    onValueChange={setSelectedCurrency}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a moeda" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(curr => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.flag} {curr.code} - {curr.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center h-12">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Target Currency (fixed BRL) */}
                <div className="space-y-2">
                  <Label>Moeda de Destino</Label>
                  <div className="h-12 flex items-center px-4 rounded-lg border border-border bg-muted/50">
                    <span className="text-sm font-medium text-foreground">
                      🇧🇷 BRL - Real Brasileiro
                    </span>
                  </div>
                </div>
              </div>

              {/* Result Display */}
              <div className="rounded-xl bg-teal-50 dark:bg-teal-500/5 border border-teal-200 dark:border-teal-500/20 p-6">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                ) : isError ? (
                  <div className="text-rose-600 dark:text-rose-400">
                    <p className="font-medium">Erro ao buscar cotação</p>
                    <p className="text-sm mt-1">
                      Verifique se a data selecionada é um dia útil. O Banco
                      Central não publica cotações em fins de semana e feriados.
                    </p>
                  </div>
                ) : rateData ? (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedCurrencyInfo?.flag}{' '}
                        {amount.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        {selectedCurrency} =
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-teal-700 dark:text-teal-400 mt-1">
                      {formatCurrencyBRL(convertedAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-3">
                      Cotação: 1 {selectedCurrency} ={' '}
                      {formatRate(rateData.rate)} &middot; Fonte:{' '}
                      {rateData.source} &middot; Data:{' '}
                      {formatDateBR(rateData.date)}
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Date Picker */}
              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="rate-date"
                    className="flex items-center gap-2"
                  >
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    Data da cotação
                  </Label>
                  <DatePicker
                    id="rate-date"
                    value={date}
                    onChange={v => setDate(typeof v === 'string' ? v : '')}
                    toDate={new Date()}
                    className="w-56"
                  />
                </div>
                <p className="text-xs text-muted-foreground pb-3">
                  Cotações disponíveis apenas em dias úteis (PTAX)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Rate Cards */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Cotações do Dia
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {CURRENCIES.map(currency => (
                <RateCard key={currency.code} currency={currency} date={date} />
              ))}
            </div>
          </div>
        </div>
      </PageBody>
    </PageLayout>
  );
}
