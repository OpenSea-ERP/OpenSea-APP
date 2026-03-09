'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { InfoField } from '@/components/shared/info-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { TimeBank } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Hourglass,
  NotebookText,
  FileText,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import {
  timeBankApi,
  timeBankKeys,
  formatBalance,
  getBalanceColor,
  formatYear,
} from '../src';

export default function TimeBankDetailPage() {
  const params = useParams();
  const router = useRouter();
  const timeBankId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: timeBank, isLoading } = useQuery<TimeBank | undefined>({
    queryKey: ['time-banks', 'detail', timeBankId],
    queryFn: async () => {
      const response = await timeBankApi.list();
      const timeBanks =
        (response as { timeBanks?: TimeBank[] }).timeBanks ?? [];
      return timeBanks.find((tb) => tb.id === timeBankId);
    },
  });

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Banco de Horas', href: '/hr/time-bank' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!timeBank) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Banco de Horas', href: '/hr/time-bank' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Hourglass className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Registro não encontrado
            </h2>
            <p className="text-muted-foreground mb-6">
              O registro de banco de horas solicitado não foi encontrado.
            </p>
            <Button onClick={() => router.push('/hr/time-bank')}>
              Voltar para Banco de Horas
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const balanceColor = getBalanceColor(timeBank.balance);
  const balanceVariant =
    timeBank.balance > 0 ? 'success' : timeBank.balance < 0 ? 'destructive' : 'secondary';

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Banco de Horas', href: '/hr/time-bank' },
            { label: `Funcionário ${timeBank.employeeId.slice(0, 8)}...` },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-teal-500 to-teal-600">
              <Hourglass className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Banco de Horas — {formatYear(timeBank.year)}
                </h1>
                <Badge variant={balanceVariant}>
                  {formatBalance(timeBank.balance)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 font-mono">
                Funcionário: {timeBank.employeeId.slice(0, 8)}...
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {timeBank.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-teal-500" />
                  <span>
                    {new Date(timeBank.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {timeBank.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    {new Date(timeBank.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Resumo */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <NotebookText className="h-5 w-5" />
            Resumo do Banco de Horas
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <InfoField
              label="Funcionário"
              value={timeBank.employeeId}
              showCopyButton
              copyTooltip="Copiar ID do funcionário"
            />
            <InfoField
              label="Ano"
              value={formatYear(timeBank.year)}
            />
            <InfoField
              label="Saldo"
              value={formatBalance(timeBank.balance)}
              badge={
                <Badge variant={balanceVariant} className="gap-1">
                  <Hourglass className="h-3 w-3" />
                  {formatBalance(timeBank.balance)}
                </Badge>
              }
            />
          </div>
        </Card>

        {/* Detalhes */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <FileText className="h-5 w-5" />
            Detalhes
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Histórico de Saldo</p>
              <div className="flex gap-2 mt-2">
                {timeBank.hasPositiveBalance && (
                  <Badge className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    <ArrowUpCircle className="h-3 w-3" />
                    Possui saldo positivo
                  </Badge>
                )}
                {timeBank.hasNegativeBalance && (
                  <Badge className="gap-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                    <ArrowDownCircle className="h-3 w-3" />
                    Possui saldo negativo
                  </Badge>
                )}
                {!timeBank.hasPositiveBalance && !timeBank.hasNegativeBalance && (
                  <Badge variant="secondary">
                    Sem movimentações
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Saldo Atual</p>
              <p className={`text-3xl font-bold font-mono ${balanceColor}`}>
                {formatBalance(timeBank.balance)}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
            <InfoField
              label="Criado em"
              value={new Date(timeBank.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            />
            <InfoField
              label="Atualizado em"
              value={new Date(timeBank.updatedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            />
          </div>
        </Card>
      </PageBody>
    </PageLayout>
  );
}
