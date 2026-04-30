import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import type { Category } from '@/types/stock/category.types';
import { CategoryCombobox } from './category-combobox';

const CATEGORY_BASE_DATE = new Date('2026-01-01T00:00:00.000Z');

const flatCategories: Category[] = [
  {
    id: 'cat-books',
    name: 'Livros',
    slug: 'livros',
    displayOrder: 1,
    isActive: true,
    createdAt: CATEGORY_BASE_DATE,
  },
  {
    id: 'cat-electronics',
    name: 'Eletrônicos',
    slug: 'eletronicos',
    displayOrder: 2,
    isActive: true,
    createdAt: CATEGORY_BASE_DATE,
  },
  {
    id: 'cat-home',
    name: 'Casa',
    slug: 'casa',
    displayOrder: 3,
    isActive: true,
    createdAt: CATEGORY_BASE_DATE,
  },
];

const hierarchicalCategories: Category[] = [
  {
    id: 'cat-electronics',
    name: 'Eletrônicos',
    slug: 'eletronicos',
    displayOrder: 1,
    isActive: true,
    createdAt: CATEGORY_BASE_DATE,
  },
  {
    id: 'cat-smartphones',
    name: 'Smartphones',
    slug: 'smartphones',
    parentId: 'cat-electronics',
    displayOrder: 1,
    isActive: true,
    createdAt: CATEGORY_BASE_DATE,
  },
  {
    id: 'cat-android',
    name: 'Android',
    slug: 'android',
    parentId: 'cat-smartphones',
    displayOrder: 1,
    isActive: true,
    createdAt: CATEGORY_BASE_DATE,
  },
  {
    id: 'cat-ios',
    name: 'iOS',
    slug: 'ios',
    parentId: 'cat-smartphones',
    displayOrder: 2,
    isActive: true,
    createdAt: CATEGORY_BASE_DATE,
  },
  {
    id: 'cat-notebooks',
    name: 'Notebooks',
    slug: 'notebooks',
    parentId: 'cat-electronics',
    displayOrder: 2,
    isActive: true,
    createdAt: CATEGORY_BASE_DATE,
  },
  {
    id: 'cat-home',
    name: 'Casa',
    slug: 'casa',
    displayOrder: 2,
    isActive: true,
    createdAt: CATEGORY_BASE_DATE,
  },
];

function CategoryComboboxRender({
  categories,
  initialValue,
  legend,
  ...props
}: Omit<ComponentProps<typeof CategoryCombobox>, 'value' | 'onValueChange'> & {
  initialValue?: string;
  legend: string;
}) {
  const [value, setValue] = useState(initialValue ?? '');

  return (
    <fieldset className="w-80 space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <CategoryCombobox
        categories={categories}
        value={value}
        onValueChange={setValue}
        {...props}
      />
    </fieldset>
  );
}

const meta = {
  title: 'UI/CategoryCombobox',
  component: CategoryCombobox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    categories: {
      control: false,
      name: 'Categorias',
    },
    value: {
      control: 'text',
      name: 'Valor selecionado',
    },
    onValueChange: {
      control: false,
      name: 'Ao alterar valor',
    },
    placeholder: {
      control: 'text',
      name: 'Placeholder',
    },
    emptyText: {
      control: 'text',
      name: 'Texto vazio',
    },
    searchPlaceholder: {
      control: 'text',
      name: 'Placeholder da busca',
    },
    disabled: {
      control: 'boolean',
      name: 'Desabilitado',
    },
    excludeId: {
      control: 'text',
      name: 'ID excluído',
    },
    excludeDescendants: {
      control: 'boolean',
      name: 'Excluir descendentes',
    },
  },
} satisfies Meta<typeof CategoryCombobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Padrão',
  render: () => (
    <CategoryComboboxRender
      legend="Categoria do produto"
      categories={flatCategories}
    />
  ),
};

export const WithHierarchy: Story = {
  name: 'Com hierarquia',
  render: () => (
    <CategoryComboboxRender
      legend="Categoria com níveis"
      categories={hierarchicalCategories}
      initialValue="cat-smartphones"
    />
  ),
};

export const Disabled: Story = {
  name: 'Desabilitado',
  render: () => (
    <CategoryComboboxRender
      legend="Categoria bloqueada"
      categories={flatCategories}
      initialValue="cat-home"
      disabled
    />
  ),
};

export const Empty: Story = {
  name: 'Vazio',
  render: () => (
    <CategoryComboboxRender
      legend="Categoria sem opções"
      categories={[]}
      emptyText="Nenhuma categoria disponível."
      searchPlaceholder="Buscar categoria indisponível"
    />
  ),
};
