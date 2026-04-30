import type { Meta, StoryObj } from '@storybook/react';
import {
  ItemGridCard,
  ItemListCard,
  LocationGridCard,
  ManufacturerGridCard,
  ProductGridCard,
  ProductListCard,
  PurchaseOrderGridCard,
  SupplierGridCard,
  TagGridCard,
  TemplateGridCard,
  TemplateListCard,
  VariantGridCard,
} from './entity-cards';

const meta = {
  title: 'Shared/Cards/EntityCards',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Família de cards para Grid/List view de entidades do estoque (Template, Product, Variant, Item, Manufacturer, Supplier, Location, Tag, PurchaseOrder). Detectam automaticamente badges "Novo" (criado nas últimas 24h) e "Atualizado" (atualizado nas últimas 24h depois da criação).',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Date helpers for fixtures ---
const NOW = new Date();
const HOURS_AGO = (h: number) =>
  new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString();
const DAYS_AGO = (d: number) =>
  new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

const wrapGrid = (children: React.ReactNode) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
    {children}
  </div>
);

const wrapList = (children: React.ReactNode) => (
  <div className="flex flex-col gap-2 max-w-3xl">{children}</div>
);

// ==================== TEMPLATE ====================

export const TemplatesGrid: Story = {
  render: () =>
    wrapGrid(
      <>
        <TemplateGridCard
          name="Camiseta básica"
          attributesCount={5}
          createdAt={HOURS_AGO(2)}
        />
        <TemplateGridCard
          name="Calça jeans"
          attributesCount={8}
          createdAt={DAYS_AGO(30)}
          updatedAt={HOURS_AGO(6)}
        />
        <TemplateGridCard
          name="Tênis esportivo"
          attributesCount={12}
          createdAt={DAYS_AGO(120)}
          isSelected
        />
      </>
    ),
};

export const TemplatesList: Story = {
  render: () =>
    wrapList(
      <>
        <TemplateListCard
          name="Camiseta básica"
          attributesCount={5}
          createdAt={HOURS_AGO(2)}
        />
        <TemplateListCard
          name="Calça jeans"
          attributesCount={8}
          createdAt={DAYS_AGO(30)}
          updatedAt={HOURS_AGO(6)}
        />
      </>
    ),
};

// ==================== PRODUCT ====================

export const ProductsGrid: Story = {
  render: () =>
    wrapGrid(
      <>
        <ProductGridCard
          name="Camiseta Algodão Premium"
          sku="CAM-001"
          price={89.9}
          quantity={42}
          createdAt={HOURS_AGO(3)}
        />
        <ProductGridCard
          name="Calça Jeans Slim"
          sku="CAL-005"
          price={199.9}
          quantity={0}
          createdAt={DAYS_AGO(60)}
          updatedAt={HOURS_AGO(4)}
        />
        <ProductGridCard
          name="Tênis Runner Pro"
          sku="TEN-018"
          price={349.9}
          quantity={15}
          createdAt={DAYS_AGO(200)}
          isSelected
        />
      </>
    ),
};

export const ProductsList: Story = {
  render: () =>
    wrapList(
      <>
        <ProductListCard
          name="Camiseta Algodão Premium"
          sku="CAM-001"
          price={89.9}
          quantity={42}
          createdAt={HOURS_AGO(3)}
        />
        <ProductListCard
          name="Calça Jeans Slim"
          sku="CAL-005"
          price={199.9}
          quantity={0}
          createdAt={DAYS_AGO(60)}
          updatedAt={HOURS_AGO(4)}
        />
      </>
    ),
};

// ==================== VARIANT ====================

export const Variants: Story = {
  render: () =>
    wrapGrid(
      <>
        <VariantGridCard
          name="Camiseta Premium - P / Azul"
          sku="CAM-001-P-AZ"
          options={['P', 'Azul', 'Algodão']}
          quantity={12}
          createdAt={DAYS_AGO(15)}
        />
        <VariantGridCard
          name="Camiseta Premium - M / Preto"
          sku="CAM-001-M-PT"
          options={['M', 'Preto', 'Algodão']}
          quantity={0}
          createdAt={DAYS_AGO(15)}
          updatedAt={HOURS_AGO(2)}
        />
      </>
    ),
};

// ==================== ITEM ====================

export const Items: Story = {
  render: () =>
    wrapGrid(
      <>
        <ItemGridCard
          serialNumber="SN-2026-00187"
          condition="Novo"
          status="available"
          location="Galpão A · Prateleira 3"
          createdAt={HOURS_AGO(10)}
        />
        <ItemGridCard
          serialNumber="SN-2026-00188"
          condition="Reembalado"
          status="reserved"
          location="Galpão A · Prateleira 5"
          createdAt={DAYS_AGO(5)}
        />
      </>
    ),
};

export const ItemsListWithBadges: Story = {
  render: () =>
    wrapList(
      <ItemListCard
        serialNumber="SN-2026-00190"
        condition="Novo"
        status="in_transit"
        location="A caminho de Cliente X"
        quantity={1}
        createdAt={HOURS_AGO(8)}
        badges={[
          { label: 'Express', variant: 'default' },
          { label: 'Frágil', variant: 'destructive' },
        ]}
      />
    ),
};

// ==================== MANUFACTURER / SUPPLIER / LOCATION / TAG ====================

export const Partners: Story = {
  render: () =>
    wrapGrid(
      <>
        <ManufacturerGridCard
          name="Têxtil Sul Ltda."
          country="Brasil"
          email="contato@textilsul.com.br"
          phone="(51) 3000-1000"
          rating={4.6}
          isActive
        />
        <SupplierGridCard
          name="Distribuidora Norte"
          country="Brasil"
          cnpj="12.345.678/0001-90"
          email="vendas@distribnorte.com.br"
          rating={4.2}
          isActive
        />
        <LocationGridCard
          name="Centro de Distribuição SP"
          description="Hub principal do Sudeste"
          address="Av. Paulista, 1000 - São Paulo/SP"
          type="CD"
          isActive
        />
        <TagGridCard
          name="Promoção"
          description="Itens com desconto vigente"
          color="#ef4444"
          category="Marketing"
          isActive
        />
      </>
    ),
};

// ==================== PURCHASE ORDER ====================

export const PurchaseOrders: Story = {
  render: () =>
    wrapGrid(
      <>
        <PurchaseOrderGridCard
          orderNumber="PO-2026-0042"
          supplierName="Têxtil Sul Ltda."
          orderDate={DAYS_AGO(7)}
          deliveryDate={DAYS_AGO(-3)}
          status="approved"
          total={12450.9}
        />
        <PurchaseOrderGridCard
          orderNumber="PO-2026-0043"
          supplierName="Distribuidora Norte"
          orderDate={DAYS_AGO(2)}
          status="pending"
          total={3299.0}
        />
        <PurchaseOrderGridCard
          orderNumber="PO-2026-0040"
          supplierName="Têxtil Sul Ltda."
          orderDate={DAYS_AGO(20)}
          deliveryDate={DAYS_AGO(10)}
          status="delivered"
          total={8750.5}
        />
      </>
    ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () =>
    wrapGrid(
      <>
        <ProductGridCard
          name="Camiseta Algodão Premium"
          sku="CAM-001"
          price={89.9}
          quantity={42}
          createdAt={HOURS_AGO(3)}
        />
        <VariantGridCard
          name="Camiseta - M / Preto"
          sku="CAM-001-M-PT"
          options={['M', 'Preto']}
          quantity={5}
          createdAt={DAYS_AGO(15)}
          updatedAt={HOURS_AGO(2)}
        />
        <ItemGridCard
          serialNumber="SN-2026-00187"
          condition="Novo"
          status="available"
          location="Galpão A"
          createdAt={HOURS_AGO(10)}
        />
      </>
    ),
};
