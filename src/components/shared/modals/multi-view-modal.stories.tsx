import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type {
  EntityFormConfig,
  EntityViewerConfig,
  MultiViewModalConfig,
} from '@/types/entity-config';
import { Button } from '@/components/ui/button';
import { MultiViewModal } from './multi-view-modal';

const meta = {
  title: 'Shared/Modals/MultiViewModal',
  component: MultiViewModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MultiViewModal>;

export default meta;
type Story = StoryObj<typeof meta>;

interface SampleProduct {
  id: string;
  name: string;
  sku: string;
  price: string;
  stock: number;
}

const sampleProducts: SampleProduct[] = [
  {
    id: 'p-001',
    name: 'Camiseta básica branca',
    sku: 'CB-WHT-M',
    price: 'R$ 79,90',
    stock: 124,
  },
  {
    id: 'p-002',
    name: 'Calça jeans slim',
    sku: 'CJ-SLM-42',
    price: 'R$ 199,00',
    stock: 38,
  },
  {
    id: 'p-003',
    name: 'Tênis esportivo',
    sku: 'TN-RUN-41',
    price: 'R$ 349,00',
    stock: 17,
  },
  {
    id: 'p-004',
    name: 'Mochila urbana',
    sku: 'MC-URB-01',
    price: 'R$ 159,00',
    stock: 9,
  },
];

const buildViewerConfig = (item: SampleProduct): EntityViewerConfig => ({
  entity: 'Produto',
  data: { ...item } as Record<string, unknown>,
  layout: 'card',
  sections: [
    {
      title: 'Informações gerais',
      fields: [
        { label: 'Nome', value: item.name },
        { label: 'SKU', value: item.sku },
        { label: 'Preço de venda', value: item.price },
        { label: 'Estoque atual', value: String(item.stock) },
      ],
    },
  ],
});

const buildFormConfig = (item: SampleProduct): EntityFormConfig => ({
  entity: 'Produto',
  defaultValues: { ...item } as Record<string, unknown>,
  onSubmit: async () => {
    // no-op in stories
  },
  sections: [
    {
      title: 'Edição rápida',
      fields: [
        { name: 'name', label: 'Nome', type: 'text' },
        { name: 'sku', label: 'SKU', type: 'text' },
        { name: 'price', label: 'Preço', type: 'text' },
      ],
    },
  ],
});

function buildConfig(
  items: SampleProduct[],
  options: {
    activeId: string | null;
    setActiveId: (id: string) => void;
    onClose: (id: string) => void;
    onCloseAll: () => void;
    compareEnabled?: boolean;
    searchEnabled?: boolean;
  }
): MultiViewModalConfig<SampleProduct> {
  return {
    entity: 'Produto',
    entityPlural: 'Produtos',
    items,
    activeId: options.activeId,
    onActiveChange: options.setActiveId,
    onClose: options.onClose,
    onCloseAll: options.onCloseAll,
    viewerConfig: buildViewerConfig,
    formConfig: buildFormConfig,
    compareEnabled: options.compareEnabled,
    compareConfig: { maxItems: 2 },
    searchEnabled: options.searchEnabled,
    searchConfig: options.searchEnabled
      ? {
          onSearch: async () => sampleProducts,
          onSelect: () => {
            // no-op in stories
          },
          placeholder: 'Buscar produtos...',
        }
      : undefined,
    onSave: async () => {
      // no-op in stories
    },
  };
}

function DefaultRender() {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState(sampleProducts.slice(0, 2));
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  const config = buildConfig(items, {
    activeId,
    setActiveId,
    onClose: id => setItems(prev => prev.filter(p => p.id !== id)),
    onCloseAll: () => setItems([]),
    compareEnabled: true,
    searchEnabled: true,
  });

  return <MultiViewModal config={config} open={open} onOpenChange={setOpen} />;
}

function WithEmptyViewRender() {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState<SampleProduct[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const config = buildConfig(items, {
    activeId,
    setActiveId,
    onClose: id => setItems(prev => prev.filter(p => p.id !== id)),
    onCloseAll: () => setItems([]),
    searchEnabled: true,
  });

  return (
    <div>
      <Button
        className="absolute top-4 right-4 z-50"
        onClick={() => setOpen(true)}
      >
        Reabrir
      </Button>
      <MultiViewModal config={config} open={open} onOpenChange={setOpen} />
    </div>
  );
}

function ManyViewsRender() {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState(sampleProducts);
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  const config = buildConfig(items, {
    activeId,
    setActiveId,
    onClose: id => setItems(prev => prev.filter(p => p.id !== id)),
    onCloseAll: () => setItems([]),
    compareEnabled: true,
    searchEnabled: true,
  });

  return <MultiViewModal config={config} open={open} onOpenChange={setOpen} />;
}

// Default state — 2 items open, single view active, compare and search
// enabled. Drives the EntityViewer through `viewerConfig(item)`.
export const Default: Story = {
  render: () => <DefaultRender />,
};

// Empty items array — modal shows the "Nenhum produto selecionado" empty
// state with the search button to add one.
export const WithEmptyView: Story = {
  render: () => <WithEmptyViewRender />,
};

// 4 items open — exercises the horizontal-scroll tab strip and the
// ArrowLeft/ArrowRight keyboard navigation between active items.
export const ManyViews: Story = {
  render: () => <ManyViewsRender />,
};
