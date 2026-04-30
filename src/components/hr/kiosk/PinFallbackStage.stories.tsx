import type { Meta, StoryObj } from '@storybook/react';
import { PinFallbackStage } from './PinFallbackStage';

/**
 * Tela de fallback do kiosk de ponto: matrícula → PIN.
 * Numpad 3×4 com botões 72×72px (acima do mínimo WCAG 44px),
 * display em monoespaço com tracking largo.
 *
 * Após PIN válido, parent transita para `FaceCaptureStage`
 * (nunca pula a face — contrato D-10).
 */
const meta = {
  title: 'Modules/HR/Kiosk/PinFallbackStage',
  component: PinFallbackStage,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Estágio de fallback PIN do kiosk de ponto. Numpad large-touch (72px), animação de shake em erro, display de PIN com bullets. Step muda entre matrícula (texto numérico) e PIN (6 dígitos).',
      },
    },
  },
  args: {
    onCancel: () => undefined,
    onSubmit: () => undefined,
  },
} satisfies Meta<typeof PinFallbackStage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PassoMatricula: Story = {
  args: { step: 'matricula' },
};

export const PassoPin: Story = {
  args: { step: 'pin' },
};

export const PinComErro: Story = {
  args: {
    step: 'pin',
    errorMessage: 'PIN incorreto. Tentativa 2 de 5.',
  },
};

export const PinBloqueado: Story = {
  args: {
    step: 'pin',
    errorMessage:
      'PIN bloqueado após 5 tentativas. Procure o RH ou tente novamente em 15 minutos.',
  },
};

export const MatriculaInvalida: Story = {
  args: {
    step: 'matricula',
    errorMessage: 'Matrícula não encontrada. Verifique e tente novamente.',
  },
};
