import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RotatingCodeDisplay } from './rotating-code-display';

function buildExpiresAt(periodSeconds: number) {
  return new Date(Date.now() + periodSeconds * 1000);
}

function nextCode(currentCode: string) {
  const nextValue = (Number(currentCode) + 137) % 1000000;
  return nextValue.toString().padStart(6, '0');
}

function RotatingCodeDisplayRender({
  initialCode,
  label,
  periodSeconds,
  showCopyButton = true,
}: {
  initialCode: string;
  label: string;
  periodSeconds: number;
  showCopyButton?: boolean;
}) {
  const [code, setCode] = useState(initialCode);
  const [expiresAt, setExpiresAt] = useState(() =>
    buildExpiresAt(periodSeconds)
  );

  const handleRotate = () => {
    setCode(currentCode => nextCode(currentCode));
    setExpiresAt(buildExpiresAt(periodSeconds));
  };

  return (
    <fieldset className="w-[360px] space-y-3">
      <legend className="text-sm font-medium">{label}</legend>
      <div aria-label={label}>
        <RotatingCodeDisplay
          code={code}
          expiresAt={expiresAt}
          periodSeconds={periodSeconds}
          onRotate={handleRotate}
          showCopyButton={showCopyButton}
        />
      </div>
    </fieldset>
  );
}

function RotatingCodeDisplayWithLabelRender() {
  return (
    <fieldset className="w-[360px] space-y-2">
      <legend className="text-sm font-medium">Código de autenticação</legend>
      <p className="text-sm text-muted-foreground">
        Compartilhe este código apenas com usuários autorizados.
      </p>
      <div aria-label="Código de autenticação rotativo">
        <RotatingCodeDisplayRender
          initialCode="654321"
          label="Código com contexto"
          periodSeconds={30}
        />
      </div>
    </fieldset>
  );
}

const meta = {
  title: 'UI/RotatingCodeDisplay',
  component: RotatingCodeDisplay,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    code: {
      control: 'text',
      name: 'Código',
    },
    expiresAt: {
      control: 'date',
      name: 'Expira em',
    },
    periodSeconds: {
      control: 'number',
      name: 'Período em segundos',
    },
    onRotate: {
      control: false,
      name: 'Ao rotacionar',
    },
    className: {
      control: 'text',
      name: 'Classe CSS',
    },
    showCopyButton: {
      control: 'boolean',
      name: 'Exibir botão de copiar',
    },
  },
} satisfies Meta<typeof RotatingCodeDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Padrão',
  render: () => (
    <RotatingCodeDisplayRender
      initialCode="123456"
      label="Código rotativo de 6 dígitos"
      periodSeconds={30}
    />
  ),
};

export const WithLabel: Story = {
  name: 'Com rótulo',
  render: () => <RotatingCodeDisplayWithLabelRender />,
};

export const Animated: Story = {
  name: 'Animado',
  render: () => (
    <RotatingCodeDisplayRender
      initialCode="246810"
      label="Código com rotação automática"
      periodSeconds={8}
    />
  ),
};
