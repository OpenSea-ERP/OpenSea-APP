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
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommentsSection } from '@/components/sales/comments-section';
import { useBid, useBidItems, useBidHistory } from '@/hooks/sales/use-bids';
import { BID_STATUS_LABELS, BID_MODALITY_LABELS } from '@/types/sales';
import {
  Building2,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Gavel,
  Hash,
  MapPin,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function BidDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bidId = params.id as string;

  const { data: bid, isLoading, error } = useBid(bidId);
  const { data: itemsData } = useBidItems(bidId);
  const { data: historyData } = useBidHistory(bidId);

  const items = itemsData?.pages.flatMap(p => p.items) ?? [];
  const history = historyData?.pages.flatMap(p => p.history) ?? [];

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas' },
              { label: 'Licitações', href: '/sales/bids' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !bid) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas' },
              { label: 'Licitações', href: '/sales/bids' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError message="Licitação não encontrada" />
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout data-testid="bid-detail">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas' },
            { label: 'Licitações', href: '/sales/bids' },
            { label: bid.editalNumber },
          ]}
          actions={[
            {
              label: 'Editar',
              onClick: () => router.push(`/sales/bids/${bidId}/edit`),
              variant: 'default',
            },
          ]}
        />
      </PageHeader>
      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
              <Gavel className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold">{bid.editalNumber}</h1>
                <Badge>{BID_STATUS_LABELS[bid.status] ?? bid.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {bid.organName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Criado em {formatDate(bid.createdAt)}
              </p>
            </div>
          </div>
        </Card>

        {/* Info Grid */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" /> Valor Estimado
            </div>
            <p className="mt-1 text-sm font-medium">
              {formatCurrency(bid.estimatedValue)}
            </p>
          </Card>
          <Card className="bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" /> Nossa Proposta
            </div>
            <p className="mt-1 text-sm font-medium">
              {formatCurrency(bid.ourProposalValue)}
            </p>
          </Card>
          <Card className="bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" /> Abertura
            </div>
            <p className="mt-1 text-sm font-medium">
              {formatDate(bid.openingDate)}
            </p>
          </Card>
          <Card className="bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" /> Modalidade
            </div>
            <p className="mt-1 text-sm font-medium">
              {BID_MODALITY_LABELS[bid.modality] ?? bid.modality}
            </p>
          </Card>
        </div>

        {/* Object description */}
        <Card className="mt-4 bg-white/5 p-4">
          <h3 className="text-sm font-medium mb-2">Objeto</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {bid.object}
          </p>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="items" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
            <TabsTrigger value="items">Itens ({items.length})</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="history">
              Histórico ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum item cadastrado
              </p>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <Card key={item.id} className="bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Item {item.itemNumber}
                          </span>
                          {item.lotNumber && (
                            <span className="text-xs text-muted-foreground">
                              Lote {item.lotNumber}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm">{item.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">
                          {item.quantity} {item.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ref: {formatCurrency(item.estimatedUnitPrice)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="details">
            <Card className="bg-white/5 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Portal:</span>{' '}
                  <span className="ml-2">{bid.portalName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Framework Legal:
                  </span>{' '}
                  <span className="ml-2">
                    {bid.legalFramework.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Criterio:</span>{' '}
                  <span className="ml-2">
                    {bid.criterionType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">CNPJ Orgao:</span>{' '}
                  <span className="ml-2">{bid.organCnpj ?? '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cidade/UF:</span>{' '}
                  <span className="ml-2">
                    {[bid.organCity, bid.organState]
                      .filter(Boolean)
                      .join('/') || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Exclusivo ME/EPP:
                  </span>{' '}
                  <span className="ml-2">
                    {bid.exclusiveMeEpp ? 'Sim' : 'Nao'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Viabilidade:</span>{' '}
                  <span className="ml-2">
                    {bid.viabilityScore != null
                      ? `${bid.viabilityScore}/100`
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Margem:</span>{' '}
                  <span className="ml-2">
                    {bid.margin != null ? `${bid.margin}%` : '-'}
                  </span>
                </div>
              </div>
              {bid.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {bid.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {bid.notes && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Notas</p>
                  <p className="text-sm mt-1 whitespace-pre-wrap">
                    {bid.notes}
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="history">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum histórico
              </p>
            ) : (
              <div className="space-y-2">
                {history.map(h => (
                  <Card key={h.id} className="bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm">{h.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {h.action.replace(/^BID_/, '').replace(/_/g, ' ')}
                          </Badge>
                          {h.performedByAi && (
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 text-xs">
                              IA
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(h.createdAt)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Comments */}
        <CommentsSection entityType="bid" entityId={bidId} defaultCollapsed />
      </PageBody>
    </PageLayout>
  );
}
