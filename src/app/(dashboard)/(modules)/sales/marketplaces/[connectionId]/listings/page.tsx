'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  useMarketplaceConnection,
  useMarketplaceListingsInfinite,
} from '@/hooks/sales/use-marketplaces';
import type { MarketplaceListingDTO } from '@/types/sales';
import { ArrowLeft, Box, ExternalLink } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT: { label: 'Rascunho', variant: 'outline' },
  PENDING: { label: 'Pendente', variant: 'secondary' },
  ACTIVE: { label: 'Ativo', variant: 'default' },
  PAUSED: { label: 'Pausado', variant: 'secondary' },
  ERROR: { label: 'Erro', variant: 'destructive' },
  OUT_OF_STOCK: { label: 'Sem Estoque', variant: 'destructive' },
  BLOCKED: { label: 'Bloqueado', variant: 'destructive' },
  DELETED: { label: 'Excluido', variant: 'outline' },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function ListingRow({ listing }: { listing: MarketplaceListingDTO }) {
  const statusCfg = STATUS_LABELS[listing.status] ?? STATUS_LABELS.ERROR;

  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Box className="h-5 w-5 flex-shrink-0 text-primary/60" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">
                {listing.externalListingId}
              </p>
              {listing.externalUrl && (
                <a
                  href={listing.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-primary hover:text-primary/80"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            {listing.externalCategoryPath && (
              <p className="text-xs text-muted-foreground truncate">
                {listing.externalCategoryPath}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {listing.publishedPrice !== undefined && (
            <span className="text-sm font-medium">
              {formatCurrency(listing.publishedPrice)}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            Estoque: {listing.publishedStock}
          </span>
          <Badge variant={statusCfg.variant} className="text-xs">
            {statusCfg.label}
          </Badge>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span>Vendidos: {listing.totalSold}</span>
        <span>Receita: {formatCurrency(listing.totalRevenue)}</span>
        {listing.averageRating !== undefined && (
          <span>Avaliacao: {listing.averageRating.toFixed(1)}</span>
        )}
        {listing.buyBoxOwner && (
          <Badge variant="default" className="text-xs">Buy Box</Badge>
        )}
      </div>
    </Card>
  );
}

export default function ListingsPage() {
  const router = useRouter();
  const params = useParams();
  const connectionId = params.connectionId as string;
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: connection } = useMarketplaceConnection(connectionId);
  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useMarketplaceListingsInfinite(connectionId);

  const listings = data?.pages.flatMap((page) => page.listings) ?? [];

  // Infinite scroll sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbs={[
            { label: 'Vendas' },
            { label: 'Marketplaces', href: '/sales/marketplaces' },
            { label: connection?.name ?? '...', href: `/sales/marketplaces/${connectionId}` },
            { label: 'Anuncios' },
          ]}
        >
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2.5"
            onClick={() => router.push(`/sales/marketplaces/${connectionId}`)}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </PageActionBar>
      </PageHeader>
      <PageBody>
        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError />
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Box className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-medium">
              Nenhum anuncio publicado
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Publique seus produtos neste marketplace para comecar a vender.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <ListingRow key={listing.id} listing={listing} />
            ))}
            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && <GridLoading />}
          </div>
        )}
      </PageBody>
    </PageLayout>
  );
}
