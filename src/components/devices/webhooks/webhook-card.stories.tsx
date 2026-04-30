import type { Meta, StoryObj } from '@storybook/react';
import type { WebhookEndpointDTO } from '@/types/system';
import { WebhookCard } from './webhook-card';

const NOW = new Date();
const HOURS_AGO = (h: number) =>
  new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString();
const DAYS_AGO = (d: number) =>
  new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

const baseEndpoint: WebhookEndpointDTO = {
  id: 'whk_01HXYZ...',
  tenantId: 'tnt_demo',
  url: 'https://hooks.example.com/punch/events',
  description: 'Webhook do RH para integração de ponto',
  apiVersion: '2026-04-27',
  subscribedEvents: [
    'punch.time-entry.created',
    'punch.approval.requested',
    'punch.approval.resolved',
  ],
  status: 'ACTIVE',
  autoDisabledReason: null,
  autoDisabledAt: null,
  consecutiveDeadCount: 0,
  secretMasked: 'whsec_••••••••a4f7',
  secretCurrentCreatedAt: DAYS_AGO(40),
  secretRotationActiveUntil: null,
  lastSuccessAt: HOURS_AGO(1),
  lastDeliveryAt: HOURS_AGO(1),
  createdAt: DAYS_AGO(40),
  updatedAt: HOURS_AGO(1),
};

const meta = {
  title: 'Modules/Devices/WebhookCard',
  component: WebhookCard,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Card de listagem de Webhook (Phase 11) — exibe status (ACTIVE / PAUSED / AUTO_DISABLED) com paleta semântica dual-theme, URL truncada com tooltip nativo, contagem de eventos inscritos, última entrega relativa em pt-BR e secret mascarado. AUTO_DISABLED ganha ring rose como destaque.',
      },
    },
  },
} satisfies Meta<typeof WebhookCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    webhook: baseEndpoint,
    onClick: () => {},
  },
};

export const Pausado: Story = {
  args: {
    webhook: {
      ...baseEndpoint,
      id: 'whk_paused',
      url: 'https://staging.example.com/webhook',
      description: null,
      status: 'PAUSED',
      lastSuccessAt: DAYS_AGO(2),
      lastDeliveryAt: DAYS_AGO(2),
    },
    onClick: () => {},
  },
};

export const AutoDesativado: Story = {
  args: {
    webhook: {
      ...baseEndpoint,
      id: 'whk_dead',
      url: 'https://broken.example.com/no-longer-exists',
      description: 'Endpoint do parceiro X (descontinuado)',
      status: 'AUTO_DISABLED',
      autoDisabledReason: 'CONSECUTIVE_DEAD',
      autoDisabledAt: HOURS_AGO(3),
      consecutiveDeadCount: 10,
      lastDeliveryAt: HOURS_AGO(3),
      lastSuccessAt: DAYS_AGO(7),
    },
    onClick: () => {},
  },
};

export const SemEntregas: Story = {
  args: {
    webhook: {
      ...baseEndpoint,
      id: 'whk_fresh',
      description: 'Recém-criado',
      lastSuccessAt: null,
      lastDeliveryAt: null,
      createdAt: HOURS_AGO(1),
    },
    onClick: () => {},
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: {
    webhook: {
      ...baseEndpoint,
      status: 'AUTO_DISABLED',
      autoDisabledReason: 'HTTP_410_GONE',
    },
    onClick: () => {},
  },
};
