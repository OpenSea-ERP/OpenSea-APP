import type { Meta, StoryObj } from '@storybook/react';
import { Shirt } from 'lucide-react';
import { ColorPatternSwatch } from './color-pattern-swatch';

const meta = {
  title: 'Shared/ColorPatternSwatch',
  component: ColorPatternSwatch,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Swatch que renderiza a cor primária + secundária + padrão (SOLID, STRIPED, PLAID, GRADIENT, PRINTED, JACQUARD). Quando não há `colorHex`, exibe ícone fallback com fundo azul translúcido.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
    pattern: {
      control: 'select',
      options: ['SOLID', 'STRIPED', 'PLAID', 'GRADIENT', 'PRINTED', 'JACQUARD'],
    },
  },
  args: {
    colorHex: '#3b82f6',
    secondaryColorHex: '#ef4444',
    pattern: 'SOLID',
    size: 'md',
  },
} satisfies Meta<typeof ColorPatternSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SolidNoSecondary: Story = {
  args: {
    colorHex: '#10b981',
    secondaryColorHex: null,
    pattern: 'SOLID',
  },
};

export const AllPatterns: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="grid grid-cols-3 gap-6 p-6">
      {(
        [
          'SOLID',
          'STRIPED',
          'PLAID',
          'GRADIENT',
          'PRINTED',
          'JACQUARD',
        ] as const
      ).map(pattern => (
        <div key={pattern} className="flex flex-col items-center gap-2">
          <ColorPatternSwatch
            colorHex="#6366f1"
            secondaryColorHex="#f59e0b"
            pattern={pattern}
            size="lg"
          />
          <span className="text-xs text-muted-foreground">{pattern}</span>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex items-end gap-4 p-6">
      <ColorPatternSwatch
        colorHex="#8b5cf6"
        secondaryColorHex="#06b6d4"
        pattern="GRADIENT"
        size="xs"
      />
      <ColorPatternSwatch
        colorHex="#8b5cf6"
        secondaryColorHex="#06b6d4"
        pattern="GRADIENT"
        size="sm"
      />
      <ColorPatternSwatch
        colorHex="#8b5cf6"
        secondaryColorHex="#06b6d4"
        pattern="GRADIENT"
        size="md"
      />
      <ColorPatternSwatch
        colorHex="#8b5cf6"
        secondaryColorHex="#06b6d4"
        pattern="GRADIENT"
        size="lg"
      />
    </div>
  ),
};

export const FallbackNoColor: Story = {
  args: {
    colorHex: null,
    secondaryColorHex: null,
    pattern: null,
  },
};

export const FallbackCustomIcon: Story = {
  args: {
    colorHex: null,
    fallbackIcon: <Shirt className="h-4 w-4 text-blue-600" />,
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: {
    colorHex: '#a855f7',
    secondaryColorHex: '#22d3ee',
    pattern: 'STRIPED',
    size: 'lg',
  },
};
