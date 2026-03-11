'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FinanceDashboard } from '@/types/finance';

interface BalanceSheetProps {
  data?: FinanceDashboard;
  isLoading: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function BalanceSheet({ data, isLoading }: BalanceSheetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balanço Patrimonial</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balanço Patrimonial</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Nenhum dado disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  const ativo = data.cashBalance + data.totalReceivable;
  const passivo = data.totalPayable;
  const patrimonio = ativo - passivo;

  const sections = [
    {
      title: 'ATIVO',
      items: [
        { label: 'Caixa e Equivalentes', value: data.cashBalance },
        { label: 'Contas a Receber', value: data.totalReceivable },
      ],
      total: ativo,
      totalLabel: 'Total do Ativo',
    },
    {
      title: 'PASSIVO',
      items: [
        { label: 'Contas a Pagar', value: data.totalPayable },
        {
          label: 'Obrigações Vencidas',
          value: data.overduePayable,
          highlight: true,
        },
      ],
      total: passivo,
      totalLabel: 'Total do Passivo',
    },
    {
      title: 'PATRIMÔNIO LÍQUIDO',
      items: [],
      total: patrimonio,
      totalLabel: 'Patrimônio Líquido',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balanço Patrimonial</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table aria-label="Balanço Patrimonial">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section) => (
                <>
                  <TableRow
                    key={section.title}
                    className="bg-muted/50 font-semibold"
                  >
                    <TableCell colSpan={2}>{section.title}</TableCell>
                  </TableRow>
                  {section.items.map((item) => (
                    <TableRow key={item.label}>
                      <TableCell className="pl-8">{item.label}</TableCell>
                      <TableCell
                        className={`text-right font-mono ${
                          item.highlight ? 'text-red-600' : ''
                        }`}
                      >
                        {formatCurrency(item.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow
                    key={`${section.title}-total`}
                    className="font-bold border-t"
                  >
                    <TableCell className="pl-4">{section.totalLabel}</TableCell>
                    <TableCell
                      className={`text-right font-mono ${
                        section.total >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(section.total)}
                    </TableCell>
                  </TableRow>
                  <TableRow key={`${section.title}-spacer`}>
                    <TableCell colSpan={2} className="h-2" />
                  </TableRow>
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
