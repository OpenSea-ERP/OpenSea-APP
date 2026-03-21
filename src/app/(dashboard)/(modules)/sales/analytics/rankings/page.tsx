'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useSellerRanking,
  useProductRanking,
  useCustomerRanking,
} from '@/hooks/sales/use-analytics';
import type { RankingEntry } from '@/types/sales';
import { Trophy, Users, Package, UserCheck } from 'lucide-react';
import { useMemo, useState } from 'react';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function RankingMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-amber-500 font-bold text-lg">1</span>;
  if (rank === 2) return <span className="text-slate-400 font-bold text-lg">2</span>;
  if (rank === 3) return <span className="text-amber-700 font-bold text-lg">3</span>;
  return <span className="text-muted-foreground font-medium">{rank}</span>;
}

function RankingList({
  rankings,
  isLoading,
  valueLabel = 'Receita',
}: {
  rankings: RankingEntry[];
  isLoading: boolean;
  valueLabel?: string;
}) {
  if (isLoading) return <GridLoading />;

  if (rankings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Trophy className="h-10 w-10 mb-2 opacity-40" />
        <p className="text-sm">Sem dados para o período selecionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rankings.map((entry) => (
        <div
          key={`${entry.rank}-${entry.userId ?? entry.customerId ?? entry.variantId}`}
          className="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-slate-800/40 border border-border"
        >
          <div className="w-8 text-center">
            <RankingMedal rank={entry.rank} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {entry.name ?? entry.productName ?? 'Desconhecido'}
            </p>
            {entry.sku && (
              <p className="text-xs text-muted-foreground">{entry.sku}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatCurrency(entry.totalRevenue)}</p>
            <p className="text-xs text-muted-foreground">
              {entry.orderCount} pedido{entry.orderCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RankingsPage() {
  const [period, setPeriod] = useState<string>('month');

  const params = useMemo(() => ({ period, limit: 10 }), [period]);

  const { data: sellerData, isLoading: sellerLoading } = useSellerRanking(params);
  const { data: productData, isLoading: productLoading } = useProductRanking(params);
  const { data: customerData, isLoading: customerLoading } = useCustomerRanking(params);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbs={[
            { label: 'Vendas' },
            { label: 'Analytics', href: '/sales/analytics' },
            { label: 'Rankings' },
          ]}
        >
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
        </PageActionBar>
      </PageHeader>

      <PageBody>
        <Tabs defaultValue="sellers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
            <TabsTrigger value="sellers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Vendedores
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Clientes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sellers">
            <Card className="bg-white dark:bg-slate-800/60 border border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Ranking de Vendedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RankingList
                  rankings={sellerData?.rankings ?? []}
                  isLoading={sellerLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card className="bg-white dark:bg-slate-800/60 border border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  Ranking de Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RankingList
                  rankings={productData?.rankings ?? []}
                  isLoading={productLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card className="bg-white dark:bg-slate-800/60 border border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-500" />
                  Ranking de Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RankingList
                  rankings={customerData?.rankings ?? []}
                  isLoading={customerLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </PageLayout>
  );
}
