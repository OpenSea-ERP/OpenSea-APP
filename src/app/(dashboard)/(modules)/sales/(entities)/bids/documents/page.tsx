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
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { useBidDocuments } from '@/hooks/sales/use-bids';
import type { BidDocumentType } from '@/types/sales';
import { BID_DOCUMENT_TYPE_LABELS } from '@/types/sales';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  FileText,
  Upload,
} from 'lucide-react';
import { Suspense, useMemo, useState } from 'react';

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function BidDocumentsContent() {
  const [typeFilter, setTypeFilter] = useState<BidDocumentType | ''>('');

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBidDocuments({
    type: typeFilter || undefined,
  });

  const documents = useMemo(
    () => data?.pages.flatMap(p => p.documents) ?? [],
    [data]
  );

  const typeOptions = Object.entries(BID_DOCUMENT_TYPE_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas' },
            { label: 'Licitações', href: '/sales/bids' },
            { label: 'Documentos' },
          ]}
        />
      </PageHeader>
      <PageBody>
        <Header
          title="Documentos de Licitação"
          description="Certidões, atestados e documentos de habilitação"
        />

        <div className="flex gap-2 mb-4">
          <FilterDropdown
            label="Tipo"
            value={typeFilter}
            options={typeOptions}
            onChange={v => setTypeFilter(v as BidDocumentType | '')}
          />
        </div>

        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError message="Erro ao carregar documentos" />
        ) : documents.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            Nenhum documento encontrado
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <Card key={doc.id} className="bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                      <FileText className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {BID_DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.isValid ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" /> Valido
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" /> Vencido
                      </Badge>
                    )}
                    {doc.portalUploaded && (
                      <Badge variant="outline" className="text-xs">
                        <Upload className="h-3 w-3 mr-1" /> Portal
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Emissão:{' '}
                    {formatDate(doc.issueDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Validade:{' '}
                    {formatDate(doc.expirationDate)}
                  </span>
                  {doc.autoRenewable && (
                    <span className="text-indigo-500">Auto-renovavel</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
            </button>
          </div>
        )}
      </PageBody>
    </PageLayout>
  );
}

export default function BidDocumentsPage() {
  return (
    <Suspense fallback={<GridLoading />}>
      <BidDocumentsContent />
    </Suspense>
  );
}
