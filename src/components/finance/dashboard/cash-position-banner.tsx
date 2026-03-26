'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBankAccounts } from '@/hooks/finance';
import { useFinanceDashboard } from '@/hooks/finance';
import {
  ArrowDown,
  ArrowUp,
  Building2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(value);
}

export function CashPositionBanner() {
  const { data: dashboardData, isLoading: dashboardLoading } =
    useFinanceDashboard();
  const { data: bankAccountsData, isLoading: bankAccountsLoading } =
    useBankAccounts({ status: 'ACTIVE', perPage: 50 });

  const isLoading = dashboardLoading || bankAccountsLoading;

  const bankAccounts = bankAccountsData?.bankAccounts ?? [];

  const totalBalance = useMemo(() => {
    return bankAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
  }, [bankAccounts]);

  const burnRate = useMemo(() => {
    if (!dashboardData) return null;
    const avgMonthlyExpenses = dashboardData.paidThisMonth || 0;
    if (avgMonthlyExpenses <= 0 || totalBalance <= 0) return null;
    return Math.floor(totalBalance / avgMonthlyExpenses);
  }, [dashboardData, totalBalance]);

  const monthlyTrend = useMemo(() => {
    if (!dashboardData) return 0;
    return dashboardData.receivedThisMonth - dashboardData.paidThisMonth;
  }, [dashboardData]);

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <div className="relative p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-32 rounded-full" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative p-6 bg-gradient-to-r from-violet-50 to-transparent dark:from-violet-950/20 dark:to-transparent">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none">
          <Wallet className="w-full h-full" />
        </div>

        <div className="relative flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Main balance section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-medium text-muted-foreground">
                Saldo Total
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-2">
              <span
                className={`text-3xl lg:text-4xl font-bold tracking-tight ${
                  totalBalance >= 0
                    ? 'text-foreground'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatCurrency(totalBalance)}
              </span>

              {monthlyTrend !== 0 && (
                <span
                  className={`inline-flex items-center gap-1 text-sm font-medium ${
                    monthlyTrend >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {monthlyTrend >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {formatCompactCurrency(Math.abs(monthlyTrend))} este mês
                </span>
              )}
            </div>

            {/* Burn rate */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {burnRate !== null && burnRate > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-500" />
                  Com os gastos atuais, seu caixa dura{' '}
                  <span className="font-semibold text-foreground">
                    {burnRate} {burnRate === 1 ? 'mês' : 'meses'}
                  </span>
                </span>
              )}

              {dashboardData && (
                <>
                  <span className="flex items-center gap-1.5">
                    <ArrowDown className="h-3.5 w-3.5 text-rose-500" />
                    Pago: {formatCompactCurrency(dashboardData.paidThisMonth)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ArrowUp className="h-3.5 w-3.5 text-emerald-500" />
                    Recebido:{' '}
                    {formatCompactCurrency(dashboardData.receivedThisMonth)}
                  </span>
                </>
              )}

              <Link
                href="/finance/reports/forecast"
                className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 hover:underline font-medium"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Ver Previsão
              </Link>
            </div>
          </div>

          {/* Bank account chips */}
          {bankAccounts.length > 0 && (
            <div className="flex flex-wrap gap-2 lg:max-w-sm">
              {bankAccounts.slice(0, 6).map((account) => (
                <div
                  key={account.id}
                  className="inline-flex items-center gap-2 rounded-full border bg-white/60 dark:bg-slate-800/60 px-3 py-1.5 text-sm"
                >
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate max-w-[120px]">
                    {account.name}
                  </span>
                  <span
                    className={`font-semibold ${
                      account.currentBalance >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {formatCompactCurrency(account.currentBalance)}
                  </span>
                </div>
              ))}
              {bankAccounts.length > 6 && (
                <div className="inline-flex items-center rounded-full border bg-white/60 dark:bg-slate-800/60 px-3 py-1.5 text-xs text-muted-foreground">
                  +{bankAccounts.length - 6} contas
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
