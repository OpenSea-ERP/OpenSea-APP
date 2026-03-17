/**
 * OpenSea OS - Product Detail Page
 * Página de detalhes do produto com listagem de variantes
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
import { productsService, variantsService } from '@/services/stock';
import type { Product } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';
import { Edit, Upload } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { ProductViewer } from '../src/components';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: product,
    isLoading: isLoadingProduct,
    error,
  } = useQuery<Product>({
    queryKey: ['products', productId],
    queryFn: async () => {
      const response = await productsService.getProduct(productId);
      return response.product;
    },
    refetchOnMount: 'always',
  });

  const { data: variantsData, isLoading: isLoadingVariants } = useQuery({
    queryKey: ['variants', 'by-product', productId],
    queryFn: async () => {
      return variantsService.listVariants(productId);
    },
    refetchOnMount: 'always',
  });

  const variants = variantsData?.variants;

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'import',
      title: 'Importar Variantes',
      icon: Upload,
      onClick: () =>
        router.push(`/import/stock/variants/by-product/${productId}`),
      variant: 'outline',
    },
    {
      id: 'edit',
      title: 'Editar Produto',
      icon: Edit,
      onClick: () => router.push(`/stock/products/${productId}/edit`),
      variant: 'default',
    },
  ];

  // ============================================================================
  // BREADCRUMBS
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Estoque', href: '/stock' },
    { label: 'Produtos', href: '/stock/products' },
    { label: product?.name || '...' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoadingProduct) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !product) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Produto não encontrado"
            message="O produto que você está procurando não existe ou foi removido."
            action={{
              label: 'Voltar para Produtos',
              onClick: () => router.push('/stock/products'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>
      <PageBody>
        <ProductViewer
          product={product}
          variants={variants || []}
          isLoadingVariants={isLoadingVariants}
          showHeader={false}
          onDelete={() => router.push('/stock/products')}
        />
      </PageBody>
    </PageLayout>
  );
}
