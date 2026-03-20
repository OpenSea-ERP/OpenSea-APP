/**
 * Manufacturer Detail Page
 *
 * TODO: Implementar rota /stock/manufacturers/[id]/historic para
 *       histórico de pedidos do fabricante (botão já na ActionBar).
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { InfoField } from '@/components/shared/info-field';
import { Card } from '@/components/ui/card';
import { COUNTRIES } from '@/components/ui/country-select';
import { formatCNPJ } from '@/lib/masks';
import { productsService } from '@/services/stock';
import type { Manufacturer } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Factory,
  Globe,
  MapPinHouse,
  NotebookText,
  Package,
  Pencil,
  Phone,
  Star,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { CircleFlag } from 'react-circle-flags';
import { useEffect, useMemo, useState } from 'react';
import { RATING_LABELS, manufacturersApi } from '../src';

// ============================================================================
// HELPERS
// ============================================================================

/** Resolve country name → ISO code for flag rendering */
function getCountryCodeFromName(name: string): string | null {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  const match = COUNTRIES.find(c => c.name.toLowerCase() === lower);
  return match?.code ?? null;
}

/** Render star rating as filled/empty stars (no text label) */
function StarRating({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= full
              ? 'fill-amber-400 text-amber-400'
              : 'fill-none text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </span>
  );
}

// ============================================================================
// SECTION HEADER
// ============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-foreground" />
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ManufacturerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const manufacturerId = params.id as string;

  const [productCount, setProductCount] = useState<number | null>(null);

  const {
    data: manufacturer,
    isLoading,
    error,
  } = useQuery<Manufacturer>({
    queryKey: ['manufacturers', manufacturerId],
    queryFn: () => manufacturersApi.get(manufacturerId),
    enabled: !!manufacturerId,
  });

  useEffect(() => {
    if (!manufacturer) return;
    productsService
      .listProducts({ manufacturerId })
      .then(r => {
        const count = r.products?.length || 0;
        setProductCount(count);
      })
      .catch(() => setProductCount(0));
  }, [manufacturer, manufacturerId]);

  // Resolve country code for flag
  const countryCode = useMemo(
    () => (manufacturer ? getCountryCodeFromName(manufacturer.country) : null),
    [manufacturer]
  );

  // Format dates
  const formattedCreatedAt = manufacturer?.createdAt
    ? new Date(manufacturer.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;
  const formattedUpdatedAt =
    manufacturer?.updatedAt && manufacturer.updatedAt !== manufacturer.createdAt
      ? new Date(manufacturer.updatedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : null;

  // ── Loading ──
  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Fabricantes', href: '/stock/manufacturers' },
              { label: '...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  // ── Error ──
  if (error || !manufacturer) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Fabricantes', href: '/stock/manufacturers' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Fabricante não encontrado"
            message="O fabricante que você está procurando não existe ou foi removido."
            action={{
              label: 'Voltar para Fabricantes',
              onClick: () => router.push('/stock/manufacturers'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ── Action bar buttons ──
  const actionButtons: HeaderButton[] = [];

  if (productCount !== null && productCount > 0) {
    actionButtons.push({
      id: 'view-products',
      title: `${productCount} Produto${productCount !== 1 ? 's' : ''}`,
      tooltip: `Listar ${productCount} produto${productCount !== 1 ? 's' : ''} deste fabricante`,
      icon: Package,
      onClick: () =>
        router.push(`/stock/products?manufacturer=${manufacturerId}`),
      variant: 'outline',
      className: 'hover:bg-slate-200 dark:hover:bg-slate-800',
    });
  }

  // TODO: implementar /stock/manufacturers/[id]/historic (botão oculto até implementação)

  actionButtons.push({
    id: 'edit',
    title: 'Editar',
    icon: Pencil,
    onClick: () => router.push(`/stock/manufacturers/${manufacturerId}/edit`),
    variant: 'default',
  });

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Fabricantes', href: '/stock/manufacturers' },
            { label: manufacturer.name },
          ]}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* ── Identity Card ── */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 shadow-lg">
              <Factory className="h-6 w-6 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              {/* Title + Status badge */}
              <div className="flex items-center gap-2.5">
                <h1 className="truncate text-xl font-bold">
                  {manufacturer.name}
                </h1>
                {manufacturer.isActive ? (
                  <span className="inline-flex shrink-0 items-center rounded-md border border-emerald-600/25 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/8 dark:text-emerald-300">
                    Ativo
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center rounded-md border border-gray-300 bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-gray-400">
                    Inativo
                  </span>
                )}
              </div>

              {/* Subtitle: country with flag */}
              <div className="mt-1.5 flex items-center gap-2">
                {manufacturer.country && (
                  <div className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-muted-foreground dark:border-white/[0.06] dark:bg-white/[0.02]">
                    {countryCode && countryCode !== 'OTHER' ? (
                      <CircleFlag
                        countryCode={countryCode.toLowerCase()}
                        height={14}
                        width={14}
                        className="shrink-0"
                      />
                    ) : (
                      <Globe className="h-3 w-3 shrink-0" />
                    )}
                    {manufacturer.country}
                  </div>
                )}
              </div>
            </div>

            {/* Metadata (right) */}
            <div className="hidden flex-col items-end gap-0.5 text-right sm:flex">
              {formattedCreatedAt && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 text-sky-400" />
                  Criado em {formattedCreatedAt}
                </p>
              )}
              {formattedUpdatedAt && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 text-amber-400" />
                  Atualizado em {formattedUpdatedAt}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* ── Content Card ── */}
        <Card className="overflow-hidden bg-white/5 py-2">
          <div className="space-y-8 px-6 py-4">
            {/* Section: Dados do Fabricante */}
            <div className="space-y-5">
              <SectionHeader
                icon={Factory}
                title="Dados do Fabricante"
                subtitle="Informações cadastrais"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                {/* Linha 1: Razão Social + Nome Fantasia + CNPJ */}
                <div className="grid gap-6 md:grid-cols-3">
                  <InfoField
                    label="Razão Social"
                    value={manufacturer.legalName}
                    showCopyButton
                    copyTooltip="Copiar Razão Social"
                  />
                  <InfoField
                    label="Nome Fantasia"
                    value={manufacturer.name}
                    showCopyButton
                    copyTooltip="Copiar Nome Fantasia"
                  />
                  <InfoField
                    label="CNPJ"
                    value={
                      manufacturer.cnpj
                        ? formatCNPJ(manufacturer.cnpj)
                        : undefined
                    }
                    showCopyButton
                    copyTooltip="Copiar CNPJ"
                  />
                </div>

                {/* Linha 2: Código + Website + Avaliação */}
                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  <InfoField
                    label="Código"
                    value={manufacturer.code}
                    showCopyButton
                    copyTooltip="Copiar Código"
                  />
                  <InfoField
                    label="Website"
                    value={manufacturer.website}
                    showCopyButton
                    copyTooltip="Copiar Website"
                  />
                  <div className="flex items-start justify-between dark:bg-slate-800 p-4 rounded-lg">
                    <div className="flex-1 items-center text-xs sm:text-sm">
                      <div className="font-bold uppercase text-muted-foreground mb-2">
                        Avaliação
                      </div>
                      {manufacturer.rating ? (
                        <div className="mt-1">
                          <StarRating rating={manufacturer.rating} />
                        </div>
                      ) : (
                        <p className="mt-1 text-sm sm:text-base dark:text-slate-500/80 text-slate-400">
                          Não avaliado
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Contatos (só exibe se tiver dados) */}
            {(manufacturer.email || manufacturer.phone) && (
              <div className="space-y-5">
                <SectionHeader
                  icon={Phone}
                  title="Contatos"
                  subtitle="Informações de contato do fabricante"
                />
                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <div className="grid gap-6 md:grid-cols-2">
                    {manufacturer.email && (
                      <InfoField
                        label="E-mail"
                        value={manufacturer.email}
                        showCopyButton
                        copyTooltip="Copiar E-mail"
                      />
                    )}
                    {manufacturer.phone && (
                      <InfoField
                        label="Telefone"
                        value={manufacturer.phone}
                        showCopyButton
                        copyTooltip="Copiar Telefone"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section: Endereço (só exibe se tiver dados) */}
            {(manufacturer.addressLine1 ||
              manufacturer.city ||
              manufacturer.state) && (
              <div className="space-y-5">
                <SectionHeader
                  icon={MapPinHouse}
                  title="Endereço"
                  subtitle="Localização do fabricante"
                />
                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <div className="grid gap-6 md:grid-cols-3">
                    {manufacturer.addressLine1 && (
                      <InfoField
                        label="Endereço"
                        value={`${manufacturer.addressLine1}${manufacturer.addressLine2 ? `, ${manufacturer.addressLine2}` : ''}`}
                        showCopyButton
                        copyTooltip="Copiar Endereço"
                      />
                    )}
                    {manufacturer.city && (
                      <InfoField
                        label="Cidade - Estado - País"
                        value={[
                          manufacturer.city,
                          manufacturer.state,
                          manufacturer.country,
                        ]
                          .filter(Boolean)
                          .join(' - ')}
                      />
                    )}
                    {manufacturer.postalCode && (
                      <InfoField
                        label="CEP"
                        value={manufacturer.postalCode}
                        showCopyButton
                        copyTooltip="Copiar CEP"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section: Observações (só exibe se tiver dados) */}
            {manufacturer.notes && (
              <div className="space-y-5">
                <SectionHeader
                  icon={NotebookText}
                  title="Observações"
                  subtitle="Notas adicionais sobre o fabricante"
                />
                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {manufacturer.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </PageBody>
    </PageLayout>
  );
}
