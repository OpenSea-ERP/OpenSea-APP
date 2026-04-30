import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FileText, Info, Tag } from 'lucide-react';
import type {
  EntityFormConfig,
  EntityViewerConfig,
} from '@/types/entity-config';
import { EntityViewer } from './entity-viewer';

const meta = {
  title: 'Shared/Viewers/EntityViewer',
  component: EntityViewer,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Visualizador genérico de entidade (read-only com modo edit opcional). Recebe `config: EntityViewerConfig` com `entity`, `data`, e `sections` ou `tabs`. Cada `field` tem `label` + `value` + `type` (`text|date|badge|list|custom`). Quando `allowEdit=true` exibe header com botão "Editar"; quando `mode=\'edit\'` e `formConfig` é passado, troca para um `EntityForm` interno (ref-controlled).',
      },
    },
  },
} satisfies Meta<typeof EntityViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode) => (
  <div className="bg-background min-h-[600px] p-6">
    <div className="mx-auto w-full max-w-3xl">{children}</div>
  </div>
);

const productData = {
  name: 'Camiseta Algodão Premium',
  sku: 'CAM-001',
  description: 'Camiseta unissex 100% algodão, modelagem reta.',
  price: 89.9,
  stock: 42,
  releaseAt: '2026-04-01',
  active: true,
};

const baseSections: EntityViewerConfig['sections'] = [
  {
    title: 'Identificação',
    fields: [
      { label: 'Nome', value: productData.name, type: 'text' },
      { label: 'SKU', value: productData.sku, type: 'text' },
      { label: 'Descrição', value: productData.description, type: 'text' },
    ],
  },
  {
    title: 'Comercial',
    fields: [
      {
        label: 'Preço',
        value: `R$ ${productData.price.toFixed(2).replace('.', ',')}`,
        type: 'text',
      },
      { label: 'Estoque', value: String(productData.stock), type: 'text' },
      { label: 'Lançamento', value: productData.releaseAt, type: 'date' },
      { label: 'Status', value: 'Ativo', type: 'badge' },
    ],
  },
];

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Visualização sem tabs e sem botão de edição — apenas seções com campos.',
      },
    },
  },
  render: () =>
    wrap(
      <EntityViewer
        config={{
          entity: 'Produto',
          data: productData,
          sections: baseSections,
        }}
      />
    ),
};

export const WithSections: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`allowEdit=true` exibe header "Produto" + botão "Editar". Layout `grid` distribui campos em duas colunas.',
      },
    },
  },
  render: () =>
    wrap(
      <EntityViewer
        config={{
          entity: 'Produto',
          data: productData,
          sections: baseSections,
          allowEdit: true,
          layout: 'grid',
          editLabel: 'Editar produto',
          onEdit: () => alert('onEdit chamado'),
        }}
      />
    ),
};

export const WithTabs: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Modo tabs — cada tab agrupa suas próprias seções; ícone Lucide opcional ao lado do label.',
      },
    },
  },
  render: () =>
    wrap(
      <EntityViewer
        config={{
          entity: 'Produto',
          data: productData,
          allowEdit: true,
          tabs: [
            {
              id: 'overview',
              label: 'Visão geral',
              icon: Info,
              sections: [baseSections[0]],
            },
            {
              id: 'commercial',
              label: 'Comercial',
              icon: Tag,
              sections: [baseSections[1]],
            },
            {
              id: 'attributes',
              label: 'Atributos',
              icon: FileText,
              sections: [
                {
                  title: 'Características',
                  fields: [
                    {
                      label: 'Tags',
                      value: ['novidade', 'verão', 'unissex'],
                      type: 'list',
                    },
                    {
                      label: 'Categoria',
                      value: 'Vestuário',
                      type: 'badge',
                    },
                  ],
                },
              ],
            },
          ],
        }}
      />
    ),
};

// Edit mode demo — needs to flip controlled `mode` between 'view' and 'edit'.
// Hook lives in a named PascalCase component to satisfy
// react-hooks/rules-of-hooks.
function EditModeDemo() {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const viewerConfig: EntityViewerConfig = {
    entity: 'Produto',
    data: productData,
    sections: baseSections,
    allowEdit: true,
    onEdit: () => setMode('edit'),
  };

  const formConfig: EntityFormConfig = {
    entity: 'Produto',
    sections: [
      {
        title: 'Dados básicos',
        fields: [
          { name: 'name', label: 'Nome', type: 'text', required: true },
          { name: 'sku', label: 'SKU', type: 'text', required: true },
          { name: 'description', label: 'Descrição', type: 'textarea' },
        ],
      },
    ],
    defaultValues: productData as unknown as Record<string, unknown>,
    onSubmit: async data => {
      alert(`Salvar: ${JSON.stringify(data, null, 2)}`);
      setMode('view');
    },
  };

  return (
    <EntityViewer
      config={viewerConfig}
      formConfig={formConfig}
      mode={mode}
      onModeChange={setMode}
      onSave={async data => {
        alert(`onSave: ${JSON.stringify(data, null, 2)}`);
        setMode('view');
      }}
    />
  );
}

export const EditMode: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Toggle controlado view ↔ edit. Em edit, troca o conteúdo por um `EntityForm` interno; botões Cancelar/Salvar acionam o ref do form.',
      },
    },
  },
  render: () => wrap(<EditModeDemo />),
};

export const EmptySections: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Seção com lista vazia — `type: 'list'` com array vazio renderiza um `<ul>` sem itens (componente não tem empty-state próprio; cuide disso no caller).",
      },
    },
  },
  render: () =>
    wrap(
      <EntityViewer
        config={{
          entity: 'Produto',
          data: {},
          sections: [
            {
              title: 'Tags',
              fields: [
                { label: 'Tags atribuídas', value: [], type: 'list' },
                { label: 'Observação', value: undefined, type: 'text' },
              ],
            },
          ],
        }}
      />
    ),
};
