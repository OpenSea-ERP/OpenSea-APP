/**
 * Finance Companies Page - Read-Only
 * Visualizacao somente leitura das empresas via /v1/admin/companies
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCNPJ } from '@/helpers/formatters';
import { useAdminCompanies } from '@/hooks/admin/use-admin-companies';
import type { Company } from '@/types/hr';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

// =============================================================================
// HELPERS
// =============================================================================

function getStatusLabel(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Ativa';
    case 'INACTIVE':
      return 'Inativa';
    case 'SUSPENDED':
      return 'Suspensa';
    default:
      return status;
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'default' as const;
    case 'INACTIVE':
      return 'secondary' as const;
    case 'SUSPENDED':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function FinanceCompaniesPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useAdminCompanies();

  const [searchQuery, setSearchQuery] = useState('');

  const companies = data?.companies ?? [];

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;
    const q = searchQuery.toLowerCase();
    return companies.filter((company: Company) => {
      const legal = company.legalName?.toLowerCase() ?? '';
      const trade = company.tradeName?.toLowerCase() ?? '';
      const cnpj = company.cnpj?.toLowerCase() ?? '';
      return legal.includes(q) || trade.includes(q) || cnpj.includes(q);
    });
  }, [companies, searchQuery]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Empresas', href: '/finance/companies' },
          ]}
        />

        <Header
          title="Empresas"
          description="Empresas cadastradas (somente leitura)"
        />
      </PageHeader>

      <PageBody>
        {/* Search Bar */}
        <SearchBar
          placeholder="Buscar por razao social, nome fantasia ou CNPJ..."
          value={searchQuery}
          onSearch={setSearchQuery}
          onClear={() => setSearchQuery('')}
          showClear
          size="md"
        />

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar empresas"
            message="Ocorreu um erro ao tentar carregar as empresas. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery
              ? 'Nenhuma empresa encontrada com os filtros aplicados.'
              : 'Nenhuma empresa cadastrada.'}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razao Social</TableHead>
                  <TableHead>Nome Fantasia</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company: Company) => (
                  <TableRow
                    key={company.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/finance/companies/${company.id}`)
                    }
                  >
                    <TableCell className="font-medium">
                      {company.legalName}
                    </TableCell>
                    <TableCell>
                      {company.tradeName || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatCNPJ(company.cnpj)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(company.status)}>
                        {getStatusLabel(company.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </PageBody>
    </PageLayout>
  );
}
