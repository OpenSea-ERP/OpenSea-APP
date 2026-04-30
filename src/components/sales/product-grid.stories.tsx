import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { ProductGrid, type ProductVariant } from './product-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency } from '@/lib/utils';

/**
 * `ProductGrid` — grid touch-first do PDV. Cada tile tem `min-h-[120px]`,
 * imagem aspect-square e price destacado em violet. Search bar `h-14` (56px).
 *
 * **Constraint de Storybook:** o componente real consome `apiClient` direto
 * (`API_ENDPOINTS.VARIANTS.LIST`), `categoriesService.listCategories` e
 * `ordersService.scanVariantByCode`. Sem mock de API, ele fica preso em
 * loading. Por isso usamos uma **réplica visual** das partes
 * apresentacionais (`ProductTile`, `CategoryChip`, skeleton, empty).
 *
 * Detector de leitor de código de barras (rapid keystrokes < 50ms) é lógica
 * runtime — não dá pra storiar visualmente; documentado nos comentários.
 */
const meta = {
  title: 'Modules/Sales/ProductGrid',
  component: ProductGrid,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Grid touch-first do PDV: imagens aspect-square, price em violet, chips de categoria scrolláveis. Stories usam réplica visual porque o componente real depende de `apiClient`/`useInfiniteQuery`.',
      },
    },
  },
} satisfies Meta<typeof ProductGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

// Visual replica of the inner ProductTile.
function ProductTileReplica({ variant }: { variant: ProductVariant }) {
  const categoryInitial = variant.categoryName?.[0]?.toUpperCase() ?? 'P';
  const placeholderColors = [
    'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300',
    'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  ];
  const colorIndex =
    (variant.categoryName ?? '').length % placeholderColors.length;
  const placeholderColor = placeholderColors[colorIndex];

  return (
    <button
      type="button"
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm',
        'cursor-pointer select-none transition-all duration-150',
        'hover:shadow-md active:scale-95',
        'dark:border-zinc-700 dark:bg-zinc-900'
      )}
    >
      {variant.imageUrl ? (
        <div className="aspect-square w-full overflow-hidden bg-zinc-50 dark:bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={variant.imageUrl}
            alt={variant.name}
            className="size-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className={cn(
            'flex aspect-square w-full items-center justify-center text-3xl font-bold',
            placeholderColor
          )}
        >
          {categoryInitial}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="line-clamp-2 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {variant.name}
        </span>
        <span className="text-left text-base font-bold text-violet-600 dark:text-violet-400">
          {formatCurrency(variant.price)}
        </span>
        {variant.stockQuantity <= 5 && variant.stockQuantity > 0 && (
          <span className="text-left text-xs text-amber-600 dark:text-amber-400">
            Restam {variant.stockQuantity}
          </span>
        )}
        {variant.stockQuantity === 0 && (
          <span className="text-left text-xs text-rose-600 dark:text-rose-400">
            Sem estoque
          </span>
        )}
      </div>
    </button>
  );
}

function CategoryChipReplica({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-150',
        'min-h-10 select-none active:scale-95',
        isSelected
          ? 'bg-violet-600 text-white shadow-sm'
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
      )}
    >
      {label}
    </button>
  );
}

const sampleVariants: ProductVariant[] = [
  {
    id: 'v-1',
    name: 'Coca-Cola 350ml',
    sku: 'BEB-COCA-350',
    barcode: '7894900011517',
    price: 6.5,
    imageUrl: null,
    categoryName: 'Bebidas',
    stockQuantity: 48,
  },
  {
    id: 'v-2',
    name: 'Pão Francês (kg)',
    sku: 'PAD-FR-001',
    barcode: null,
    price: 18.9,
    imageUrl: null,
    categoryName: 'Padaria',
    stockQuantity: 12,
  },
  {
    id: 'v-3',
    name: 'Queijo Mussarela 500g',
    sku: 'LAT-MUSS-500',
    barcode: '7891234567890',
    price: 32.5,
    imageUrl: null,
    categoryName: 'Laticínios',
    stockQuantity: 4,
  },
  {
    id: 'v-4',
    name: 'Camiseta Algodão Premium',
    sku: 'CAM-001',
    barcode: null,
    price: 89.9,
    imageUrl: null,
    categoryName: 'Vestuário',
    stockQuantity: 0,
  },
  {
    id: 'v-5',
    name: 'Sanduíche Natural',
    sku: 'LAN-SN-001',
    barcode: null,
    price: 14.5,
    imageUrl: null,
    categoryName: 'Lanches',
    stockQuantity: 22,
  },
  {
    id: 'v-6',
    name: 'Água Mineral 500ml',
    sku: 'BEB-AGUA-500',
    barcode: '7891910000114',
    price: 3.5,
    imageUrl: null,
    categoryName: 'Bebidas',
    stockQuantity: 95,
  },
  {
    id: 'v-7',
    name: 'Calça Jeans Slim',
    sku: 'CAL-SL-42',
    barcode: null,
    price: 199.9,
    imageUrl: null,
    categoryName: 'Vestuário',
    stockQuantity: 7,
  },
  {
    id: 'v-8',
    name: 'Iogurte Grego 150g',
    sku: 'LAT-IOG-150',
    barcode: '7891000100103',
    price: 7.9,
    imageUrl: null,
    categoryName: 'Laticínios',
    stockQuantity: 30,
  },
];

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'beb', label: 'Bebidas' },
  { id: 'pad', label: 'Padaria' },
  { id: 'lat', label: 'Laticínios' },
  { id: 'lan', label: 'Lanches' },
  { id: 'ves', label: 'Vestuário' },
];

function GridReplica({
  variants,
  isLoading = false,
}: {
  variants: ProductVariant[];
  isLoading?: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar produto, SKU ou código de barras..."
          className={cn(
            'h-14 w-full rounded-xl border border-zinc-200 bg-white pl-11 pr-4 text-base',
            'placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20',
            'dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-violet-400'
          )}
          aria-label="Buscar produtos"
        />
      </div>

      <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <CategoryChipReplica
            key={cat.id}
            label={cat.label}
            isSelected={selectedCategory === cat.id}
            onClick={() => setSelectedCategory(cat.id)}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700"
            >
              <Skeleton className="aspect-square w-full" />
              <div className="flex flex-col gap-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : variants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <Search className="mb-3 size-10 opacity-50" />
          <p className="text-base font-medium">Nenhum produto encontrado</p>
          <p className="text-sm">Tente buscar com outro termo</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {variants.map(v => (
            <ProductTileReplica key={v.id} variant={v} />
          ))}
        </div>
      )}
    </div>
  );
}

export const Default: Story = {
  render: () => <GridReplica variants={sampleVariants} />,
};

export const Loading: Story = {
  render: () => <GridReplica variants={[]} isLoading />,
};

export const Empty: Story = {
  name: 'Empty (nenhum resultado)',
  render: () => <GridReplica variants={[]} />,
};

export const WithStockWarnings: Story = {
  name: 'With stock warnings (estoque baixo + sem estoque)',
  render: () => (
    <GridReplica
      variants={[
        {
          id: 'v-1',
          name: 'Coca-Cola 350ml',
          sku: 'BEB-COCA-350',
          barcode: '7894900011517',
          price: 6.5,
          imageUrl: null,
          categoryName: 'Bebidas',
          stockQuantity: 3,
        },
        {
          id: 'v-2',
          name: 'Camiseta Algodão Premium',
          sku: 'CAM-001',
          barcode: null,
          price: 89.9,
          imageUrl: null,
          categoryName: 'Vestuário',
          stockQuantity: 0,
        },
        {
          id: 'v-3',
          name: 'Pão Francês (kg)',
          sku: 'PAD-FR-001',
          barcode: null,
          price: 18.9,
          imageUrl: null,
          categoryName: 'Padaria',
          stockQuantity: 5,
        },
        {
          id: 'v-4',
          name: 'Queijo Mussarela 500g',
          sku: 'LAT-MUSS-500',
          barcode: '7891234567890',
          price: 32.5,
          imageUrl: null,
          categoryName: 'Laticínios',
          stockQuantity: 50,
        },
      ]}
    />
  ),
};

export const Tablet: Story = {
  name: 'Tablet (PDV touch — 768px)',
  parameters: { viewport: { defaultViewport: 'tablet' } },
  render: () => <GridReplica variants={sampleVariants} />,
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => <GridReplica variants={sampleVariants} />,
};
