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
import type { DRENode } from '@/services/finance/finance-reports.service';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useCallback } from 'react';

interface DREInteractiveTableProps {
  revenue?: DRENode;
  expenses?: DRENode;
  netResult?: number;
  previousNetResult?: number;
  variationPercent?: number;
  isLoading: boolean;
  onDrillDown?: (categoryId: string, categoryName: string, amount: number) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatVariation(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

interface RowState {
  [categoryId: string]: boolean;
}

function DRERow({
  node,
  expanded,
  toggleExpand,
  onDrillDown,
  isRevenue,
}: {
  node: DRENode;
  expanded: RowState;
  toggleExpand: (id: string) => void;
  onDrillDown?: (categoryId: string, categoryName: string, amount: number) => void;
  isRevenue: boolean;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded[node.categoryId] ?? false;
  const indent = node.level * 24;

  const variationColor =
    node.variationPercent > 0
      ? isRevenue
        ? 'text-green-600'
        : 'text-red-600'
      : node.variationPercent < 0
        ? isRevenue
          ? 'text-red-600'
          : 'text-green-600'
        : '';

  return (
    <>
      <TableRow
        className={`${node.level === 0 ? 'font-semibold bg-muted/50' : ''} ${
          !hasChildren ? 'cursor-pointer hover:bg-muted/30' : ''
        }`}
        onClick={() => {
          if (hasChildren) {
            toggleExpand(node.categoryId);
          } else if (onDrillDown) {
            onDrillDown(node.categoryId, node.categoryName, node.currentPeriod);
          }
        }}
      >
        <TableCell style={{ paddingLeft: `${indent + 16}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                className="p-0.5 hover:bg-muted rounded"
                onClick={e => {
                  e.stopPropagation();
                  toggleExpand(node.categoryId);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}
            <span>{node.categoryName}</span>
          </div>
        </TableCell>
        <TableCell className="text-right font-mono">
          {formatCurrency(node.currentPeriod)}
        </TableCell>
        <TableCell className="text-right font-mono text-muted-foreground">
          {formatCurrency(node.previousPeriod)}
        </TableCell>
        <TableCell className={`text-right font-mono ${variationColor}`}>
          {formatVariation(node.variationPercent)}
        </TableCell>
      </TableRow>

      {hasChildren &&
        isExpanded &&
        node.children.map(child => (
          <DRERow
            key={child.categoryId}
            node={child}
            expanded={expanded}
            toggleExpand={toggleExpand}
            onDrillDown={onDrillDown}
            isRevenue={isRevenue}
          />
        ))}
    </>
  );
}

export function DREInteractiveTable({
  revenue,
  expenses,
  netResult,
  previousNetResult,
  variationPercent,
  isLoading,
  onDrillDown,
}: DREInteractiveTableProps) {
  const [expanded, setExpanded] = useState<RowState>({});

  const toggleExpand = useCallback((id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demonstracao do Resultado do Exercicio (DRE)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!revenue || !expenses) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demonstracao do Resultado do Exercicio (DRE)</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Nenhum dado disponivel para o periodo selecionado
          </p>
        </CardContent>
      </Card>
    );
  }

  const netVariationColor =
    (variationPercent ?? 0) > 0
      ? 'text-green-600'
      : (variationPercent ?? 0) < 0
        ? 'text-red-600'
        : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demonstracao do Resultado do Exercicio (DRE)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table aria-label="Demonstração do Resultado do Exercício">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Categoria</TableHead>
                <TableHead className="text-right">Período Atual</TableHead>
                <TableHead className="text-right">Período Anterior</TableHead>
                <TableHead className="text-right">Variação %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <DRERow
                node={revenue}
                expanded={expanded}
                toggleExpand={toggleExpand}
                onDrillDown={onDrillDown}
                isRevenue={true}
              />

              <TableRow>
                <TableCell colSpan={4} className="h-2" />
              </TableRow>

              <DRERow
                node={expenses}
                expanded={expanded}
                toggleExpand={toggleExpand}
                onDrillDown={onDrillDown}
                isRevenue={false}
              />

              <TableRow>
                <TableCell colSpan={4} className="h-2" />
              </TableRow>

              <TableRow className="font-bold text-lg border-t-2">
                <TableCell className="pl-4">Resultado Líquido</TableCell>
                <TableCell
                  className={`text-right font-mono ${
                    (netResult ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(netResult ?? 0)}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {formatCurrency(previousNetResult ?? 0)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${netVariationColor}`}
                >
                  {formatVariation(variationPercent ?? 0)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
