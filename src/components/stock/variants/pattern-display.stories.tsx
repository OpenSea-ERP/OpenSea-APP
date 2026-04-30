import type { Meta, StoryObj } from '@storybook/react';
import { PATTERN_LABELS, type Pattern } from '@/types/stock';
import { PatternDisplay } from './pattern-display';

/**
 * `PatternDisplay` exibe um preview circular do padrão visual de uma variante
 * (ex: liso, listrado, xadrez) usando apenas gradientes CSS — sem assets.
 *
 * Pure visual: recebe `pattern`, `colorHex`, `secondaryColorHex` e `size`.
 * Sem hooks, sem dependências externas — replicável fielmente em catálogo.
 */
const meta = {
  title: 'Modules/Stock/PatternDisplay',
  component: PatternDisplay,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Bolinha (círculo) que representa o padrão de cor/estampa de uma variante. Suporta 6 padrões via gradientes CSS: SOLID, STRIPED, PLAID, PRINTED, GRADIENT, JACQUARD. Tamanhos: sm (24px), md (32px), lg (48px).',
      },
    },
  },
  argTypes: {
    pattern: {
      control: 'select',
      options: ['SOLID', 'STRIPED', 'PLAID', 'PRINTED', 'GRADIENT', 'JACQUARD'],
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
    },
    colorHex: { control: 'color' },
    secondaryColorHex: { control: 'color' },
  },
} satisfies Meta<typeof PatternDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    pattern: 'SOLID',
    colorHex: '#6366f1',
    secondaryColorHex: '#d1d5db',
    size: 'md',
  },
};

export const AllPatterns: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Galeria com os 6 padrões suportados, mesmas cores primária/secundária. Demonstra como o gradiente CSS é gerado a partir do enum `Pattern`.',
      },
    },
  },
  render: () => {
    const patterns: Pattern[] = [
      'SOLID',
      'STRIPED',
      'PLAID',
      'PRINTED',
      'GRADIENT',
      'JACQUARD',
    ];
    return (
      <div className="flex flex-wrap gap-6 p-6 bg-background">
        {patterns.map(pattern => (
          <div
            key={pattern}
            className="flex flex-col items-center gap-2 min-w-[80px]"
          >
            <PatternDisplay
              pattern={pattern}
              colorHex="#1d4ed8"
              secondaryColorHex="#fbbf24"
              size="lg"
            />
            <span className="text-xs font-medium text-muted-foreground">
              {PATTERN_LABELS[pattern]}
            </span>
          </div>
        ))}
      </div>
    );
  },
};

export const Sizes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Comparação dos três tamanhos disponíveis (sm, md, lg).',
      },
    },
  },
  render: () => (
    <div className="flex items-end gap-6 p-6 bg-background">
      {(['sm', 'md', 'lg'] as const).map(size => (
        <div key={size} className="flex flex-col items-center gap-2">
          <PatternDisplay
            pattern="STRIPED"
            colorHex="#0f766e"
            secondaryColorHex="#fef3c7"
            size={size}
          />
          <span className="text-xs text-muted-foreground">{size}</span>
        </div>
      ))}
    </div>
  ),
};

export const VariantPalette: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Caso de uso real: linha de variantes "Camiseta básica" — várias cores com mesmo padrão SOLID, próximas em uma listagem de catálogo.',
      },
    },
  },
  render: () => {
    const colors = [
      { hex: '#0f172a', name: 'Preto' },
      { hex: '#dc2626', name: 'Vermelho' },
      { hex: '#1d4ed8', name: 'Azul' },
      { hex: '#16a34a', name: 'Verde' },
      { hex: '#fbbf24', name: 'Amarelo' },
      { hex: '#f8fafc', name: 'Branco' },
    ];
    return (
      <div className="flex gap-3 p-6 bg-background">
        {colors.map(c => (
          <div key={c.hex} className="flex flex-col items-center gap-1">
            <PatternDisplay pattern="SOLID" colorHex={c.hex} size="md" />
            <span className="text-[10px] text-muted-foreground">{c.name}</span>
          </div>
        ))}
      </div>
    );
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: {
    pattern: 'JACQUARD',
    colorHex: '#a78bfa',
    secondaryColorHex: '#1e293b',
    size: 'lg',
  },
};
