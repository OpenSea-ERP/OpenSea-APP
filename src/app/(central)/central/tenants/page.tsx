'use client';

import { CentralBadge } from '@/components/central/central-badge';
import { CentralPageHeader } from '@/components/central/central-page-header';
import {
  CentralTable,
  CentralTableBody,
  CentralTableCell,
  CentralTableHead,
  CentralTableHeader,
  CentralTableRow,
} from '@/components/central/central-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminTenants } from '@/hooks/admin/use-admin';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Plus,
  Search,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

// ─── Config ────────────────────────────────────────────────────────────────────

const statusVariants: Record<
  string,
  'emerald' | 'orange' | 'rose' | 'default'
> = {
  ACTIVE: 'emerald',
  INACTIVE: 'orange',
  SUSPENDED: 'rose',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
  SUSPENDED: 'Suspensa',
};

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'ACTIVE', label: 'Ativas' },
  { value: 'INACTIVE', label: 'Inativas' },
  { value: 'SUSPENDED', label: 'Suspensas' },
];

// Mock MRR per tenant (deterministic based on index)
const MOCK_MRR = [89, 199, 349, 499, 149, 299, 79, 599, 249, 189];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TenantsListPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  // Reset page on status filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data, isLoading } = useAdminTenants(
    page,
    20,
    debouncedSearch || undefined,
    statusFilter || undefined
  );

  const tenants = data?.tenants ?? [];

  return (
    <div className="px-6 py-5 space-y-4">
      {/* Header */}
      <CentralPageHeader
        title="Empresas"
        description="Gerencie todas as empresas do sistema"
        action={
          <Link href="/central/tenants/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nova Empresa
            </Button>
          </Link>
        }
      />

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: 'var(--central-text-muted)' }}
            />
            <Input
              placeholder="Buscar por nome ou slug..."
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-10"
              style={{
                background: 'var(--central-card-bg)',
                color: 'var(--central-text-primary)',
                borderColor: 'var(--central-separator)',
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter
            className="h-4 w-4"
            style={{ color: 'var(--central-text-muted)' }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-ring transition-all appearance-none cursor-pointer"
            style={{
              background: 'var(--central-card-bg)',
              borderColor: 'var(--central-separator)',
              color: 'var(--central-text-primary)',
            }}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {(debouncedSearch || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput('');
                setDebouncedSearch('');
                setStatusFilter('');
                setPage(1);
              }}
              className="gap-1"
            >
              <X className="h-3 w-3" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse"
              style={{ background: 'var(--central-card-bg)' }}
            />
          ))}
        </div>
      ) : (
        <CentralTable>
          <CentralTableHeader>
            <CentralTableRow>
              <CentralTableHead>Empresa</CentralTableHead>
              <CentralTableHead>Slug</CentralTableHead>
              <CentralTableHead>MRR</CentralTableHead>
              <CentralTableHead>Status</CentralTableHead>
              <CentralTableHead>Criado em</CentralTableHead>
              <CentralTableHead className="w-[80px]">Ações</CentralTableHead>
            </CentralTableRow>
          </CentralTableHeader>
          <CentralTableBody>
            {tenants.map((tenant, index) => (
              <CentralTableRow key={tenant.id}>
                <CentralTableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                      style={{
                        background: 'var(--central-avatar-bg)',
                        color: 'var(--central-avatar-text)',
                      }}
                    >
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{tenant.name}</span>
                  </div>
                </CentralTableCell>
                <CentralTableCell>
                  <span
                    className="font-mono text-sm"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    {tenant.slug}
                  </span>
                </CentralTableCell>
                <CentralTableCell>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(MOCK_MRR[index % MOCK_MRR.length])}
                  </span>
                </CentralTableCell>
                <CentralTableCell>
                  <CentralBadge
                    variant={statusVariants[tenant.status] ?? 'default'}
                  >
                    {statusLabels[tenant.status] ?? tenant.status}
                  </CentralBadge>
                </CentralTableCell>
                <CentralTableCell>
                  <span style={{ color: 'var(--central-text-secondary)' }}>
                    {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </CentralTableCell>
                <CentralTableCell>
                  <Link href={`/central/tenants/${tenant.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </CentralTableCell>
              </CentralTableRow>
            ))}
            {tenants.length === 0 && (
              <CentralTableRow>
                <CentralTableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Building2
                      className="h-12 w-12"
                      style={{ color: 'var(--central-text-muted)' }}
                    />
                    <p style={{ color: 'var(--central-text-muted)' }}>
                      {debouncedSearch || statusFilter
                        ? 'Nenhuma empresa encontrada com os filtros aplicados'
                        : 'Nenhuma empresa encontrada'}
                    </p>
                  </div>
                </CentralTableCell>
              </CentralTableRow>
            )}
          </CentralTableBody>
        </CentralTable>
      )}

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p
            className="text-sm"
            style={{ color: 'var(--central-text-secondary)' }}
          >
            {data.meta.total} empresas no total — Página {page} de{' '}
            {data.meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="gap-2"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
