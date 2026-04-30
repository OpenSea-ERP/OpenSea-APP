import type { Meta, StoryObj } from '@storybook/react';
import { ResultStage } from './ResultStage';

/**
 * Tela de resultado do kiosk de ponto, exibida após o registro:
 *   - ACCEPT (verde · CheckCircle2)
 *   - APPROVAL_REQUIRED (âmbar · Clock)
 *   - OFFLINE (âmbar · CloudOff)
 *   - REJECT (rose · XCircle)
 *
 * Auto-dismiss em 3s; toda a tela é um botão grande (touch ≥ 48px) e
 * avisa em `aria-live=assertive` para leitores de tela.
 *
 * UI-SPEC §K3 — Phase 5 / Plan 05-10.
 */
const meta = {
  title: 'Modules/HR/Kiosk/ResultStage',
  component: ResultStage,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Tela final do fluxo de bater ponto. Cor e ícone variam pelo status; copy de erro escolhida pelo `errorCode` do backend (INVALID_QR_TOKEN, PIN_INVALID, PIN_LOCKED, FACE_ENROLLMENT_REQUIRED).',
      },
    },
  },
  args: {
    onReset: () => undefined,
  },
} satisfies Meta<typeof ResultStage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Aceito: Story = {
  args: {
    status: 'ACCEPT',
    entryTypeLabel: 'Entrada',
    timeLabel: '08:02',
    firstName: 'Maria',
  },
};

export const AguardandoAprovacao: Story = {
  args: {
    status: 'APPROVAL_REQUIRED',
    entryTypeLabel: 'Saída',
    timeLabel: '17:48',
    firstName: 'João',
  },
};

export const Offline: Story = {
  args: {
    status: 'OFFLINE',
    entryTypeLabel: 'Entrada',
    timeLabel: '07:55',
    firstName: 'Carla',
  },
};

export const PinIncorreto: Story = {
  args: {
    status: 'REJECT',
    errorCode: 'PIN_INVALID',
  },
};

export const PinBloqueado: Story = {
  args: {
    status: 'REJECT',
    errorCode: 'PIN_LOCKED',
  },
};

export const BiometriaPendente: Story = {
  args: {
    status: 'REJECT',
    errorCode: 'FACE_ENROLLMENT_REQUIRED',
  },
};

export const ErroGenerico: Story = {
  args: {
    status: 'REJECT',
    message:
      'Não foi possível registrar o ponto. Aproxime o crachá novamente em alguns segundos.',
  },
};
