'use client';

import Link from 'next/link';
import {
  Scan,
  ClipboardCheck,
  PackageOpen,
  Truck,
  Package,
  Clock,
  Layers,
  BoxSelect,
  ChevronRight,
} from 'lucide-react';
import { MobileTopBar } from '@/components/mobile/mobile-top-bar';

const stats = [
  { label: 'Total de Itens', value: '—', icon: Package, color: 'indigo' },
  { label: 'Recebimento Pendente', value: '—', icon: Clock, color: 'amber' },
  { label: 'Conferências Ativas', value: '—', icon: Layers, color: 'sky' },
  { label: 'Volumes Abertos', value: '—', icon: BoxSelect, color: 'green' },
] as const;

const quickActions = [
  {
    label: 'Escanear Item',
    icon: Scan,
    href: '/m/stock/scanner',
    description: 'Consultar, transferir ou dar saída',
  },
  {
    label: 'Nova Conferência',
    icon: ClipboardCheck,
    href: '/m/stock/inventory',
    description: 'Iniciar balanço de estoque',
  },
  {
    label: 'Receber Mercadoria',
    icon: PackageOpen,
    href: '/m/stock/receiving',
    description: 'Conferir pedido de compra',
  },
  {
    label: 'Gerenciar Volumes',
    icon: Truck,
    href: '/m/stock/volumes',
    description: 'Expedição e despacho',
  },
] as const;

const colorMap = {
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  sky: { bg: 'bg-sky-500/10', text: 'text-sky-400' },
  green: { bg: 'bg-green-500/10', text: 'text-green-400' },
} as const;

export default function MobileStockHome() {
  return (
    <div className="min-h-screen bg-slate-950">
      <MobileTopBar title="Estoque" />

      <div className="p-4 space-y-6">
        {/* Stats Grid */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Resumo
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {stats.map(stat => {
              const Icon = stat.icon;
              const colors = colorMap[stat.color];
              return (
                <div
                  key={stat.label}
                  className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4"
                >
                  <div
                    className={`inline-flex items-center justify-center rounded-lg p-2 ${colors.bg} mb-3`}
                  >
                    <Icon className={`h-4 w-4 ${colors.text}`} />
                  </div>
                  <p className="text-2xl font-bold text-slate-100">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Ações Rápidas
          </h2>
          <div className="space-y-2">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-4 rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 active:bg-slate-700/60 transition-colors"
                >
                  <div className="flex-shrink-0 inline-flex items-center justify-center rounded-lg bg-slate-700/60 p-2.5">
                    <Icon className="h-5 w-5 text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-100">
                      {action.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
