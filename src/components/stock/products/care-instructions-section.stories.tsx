import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CareCategory, CareOption } from '@/types/stock';
import { MdAdd, MdClose } from 'react-icons/md';
import { CareInstructionsSection } from './care-instructions-section';

/**
 * `CareInstructionsSection` exibe e edita as instruções de cuidado têxtil
 * (símbolos ISO 3758 / NBR 16365) de um produto.
 *
 * **Constraint de Storybook:** o componente real depende de:
 * - `useProductCareInstructions(productId)` — fetch de instruções do produto
 * - `useCareOptions()` — fetch global das opções disponíveis
 * - `useAddProductCareInstruction()` / `useDeleteProductCareInstruction()` — mutações
 * - `template.specialModules` precisa incluir `'CARE_INSTRUCTIONS'` para renderizar
 *
 * Sem QueryClient com dados pré-populados nem auth, o componente real
 * fica em loading skeleton (3 placeholders cinzas) ou retorna `null`.
 *
 * Por isso usamos **réplicas visuais** com o mesmo DOM (mesmos componentes UI:
 * `Select`, `Button`, grid 4/6/8 cols com cards, ícone de remoção no hover) e
 * estados sintéticos para storiar Default/Empty/Loading sem provider de dados.
 */
const meta = {
  title: 'Modules/Stock/CareInstructionsSection',
  component: CareInstructionsSection,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Seção de instruções de cuidado em página de detalhe de produto. Render visual: header com título + descrição (NBR 16365), grid de símbolos selecionados (cada um com botão remover no hover) e Select agrupado por categoria (Lavagem/Alvejamento/Secagem/Passagem/Limpeza Profissional) + botão Adicionar.',
      },
    },
  },
} satisfies Meta<typeof CareInstructionsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode) => (
  <div className="bg-background min-h-[400px] p-6 max-w-3xl">{children}</div>
);

const CATEGORY_LABELS: Record<CareCategory, string> = {
  WASH: 'Lavagem',
  BLEACH: 'Alvejamento',
  DRY: 'Secagem',
  IRON: 'Passagem',
  PROFESSIONAL: 'Limpeza Profissional',
};

interface PreviewProps {
  selectedOptions: CareOption[];
  availableOptions: CareOption[];
  loading?: boolean;
}

/**
 * Réplica visual fiel do `CareInstructionsSection` — mesmo DOM, sem hooks de dados.
 * Mantém: header, grid responsivo (4/6/8 cols), cards com hover-to-delete,
 * Select agrupado por categoria, botão Adicionar.
 */
function CareInstructionsPreview({
  selectedOptions,
  availableOptions,
  loading = false,
}: PreviewProps) {
  const [selectedCareId, setSelectedCareId] = useState('');
  const [items, setItems] = useState(selectedOptions);

  const existingIds = new Set(items.map(o => o.id));
  const remaining = availableOptions.filter(o => !existingIds.has(o.id));

  const handleAdd = () => {
    const opt = availableOptions.find(o => o.id === selectedCareId);
    if (opt) {
      setItems([...items, opt]);
      setSelectedCareId('');
    }
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(o => o.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Instruções de Conservação
          </h3>
          <p className="text-xs text-muted-foreground">
            Símbolos ISO 3758 para etiqueta de conservação têxtil
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {items.map(option => (
            <div
              key={option.id}
              className="relative group flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <button
                type="button"
                onClick={() => handleDelete(option.id)}
                className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                title="Remover"
                aria-label={`Remover ${option.label}`}
              >
                <MdClose className="h-3 w-3" />
              </button>
              <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-mono">
                {option.code}
              </div>
              <span className="text-[10px] text-center text-muted-foreground leading-tight">
                {option.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Nenhuma instrução de cuidado adicionada
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Select value={selectedCareId} onValueChange={setSelectedCareId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione uma instrução..." />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(CATEGORY_LABELS) as CareCategory[]).map(category => {
              const opts = remaining.filter(o => o.category === category);
              if (opts.length === 0) return null;
              return (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {CATEGORY_LABELS[category]}
                  </div>
                  {opts.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </div>
              );
            })}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={!selectedCareId}
          className="gap-1"
        >
          <MdAdd className="h-4 w-4" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}

const allOptions: CareOption[] = [
  // WASH
  {
    id: 'w-1',
    code: 'W30',
    category: 'WASH',
    assetPath: '',
    label: 'Lavar à máquina a 30°C',
  },
  {
    id: 'w-2',
    code: 'W40',
    category: 'WASH',
    assetPath: '',
    label: 'Lavar à máquina a 40°C',
  },
  {
    id: 'w-3',
    code: 'WH',
    category: 'WASH',
    assetPath: '',
    label: 'Lavar à mão',
  },
  // BLEACH
  {
    id: 'b-1',
    code: 'NB',
    category: 'BLEACH',
    assetPath: '',
    label: 'Não usar alvejante',
  },
  {
    id: 'b-2',
    code: 'NC',
    category: 'BLEACH',
    assetPath: '',
    label: 'Alvejante sem cloro',
  },
  // DRY
  {
    id: 'd-1',
    code: 'TL',
    category: 'DRY',
    assetPath: '',
    label: 'Secadora em baixa temperatura',
  },
  {
    id: 'd-2',
    code: 'LD',
    category: 'DRY',
    assetPath: '',
    label: 'Secar à sombra',
  },
  // IRON
  {
    id: 'i-1',
    code: 'IL',
    category: 'IRON',
    assetPath: '',
    label: 'Passar em temperatura baixa',
  },
  {
    id: 'i-2',
    code: 'IM',
    category: 'IRON',
    assetPath: '',
    label: 'Passar em temperatura média',
  },
  // PROFESSIONAL
  {
    id: 'p-1',
    code: 'DC',
    category: 'PROFESSIONAL',
    assetPath: '',
    label: 'Limpeza a seco',
  },
  {
    id: 'p-2',
    code: 'NDC',
    category: 'PROFESSIONAL',
    assetPath: '',
    label: 'Não fazer limpeza a seco',
  },
];

export const Default: Story = {
  name: 'Default (com instruções)',
  render: () => (
    <CareInstructionsPreview
      selectedOptions={[
        allOptions[0], // W30
        allOptions[3], // NB
        allOptions[6], // LD
        allOptions[7], // IL
      ]}
      availableOptions={allOptions}
    />
  ),
};

export const Empty: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Produto sem instruções: empty state com borda tracejada e Select vazio aguardando seleção.',
      },
    },
  },
  render: () => (
    <CareInstructionsPreview
      selectedOptions={[]}
      availableOptions={allOptions}
    />
  ),
};

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado de loading: 3 cards skeleton animados enquanto `useProductCareInstructions` ou `useCareOptions` resolvem.',
      },
    },
  },
  render: () => (
    <CareInstructionsPreview
      selectedOptions={[]}
      availableOptions={[]}
      loading
    />
  ),
};

export const FullySpecified: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Produto com instruções de todas as 5 categorias preenchidas — caso comum em peça de vestuário comercial.',
      },
    },
  },
  render: () => (
    <CareInstructionsPreview
      selectedOptions={[
        allOptions[1], // W40
        allOptions[4], // NC
        allOptions[5], // TL
        allOptions[8], // IM
        allOptions[9], // DC
      ]}
      availableOptions={allOptions}
    />
  ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => (
    <CareInstructionsPreview
      selectedOptions={[allOptions[0], allOptions[3], allOptions[7]]}
      availableOptions={allOptions}
    />
  ),
};
