import type { Meta, StoryObj } from '@storybook/react';
import type { WebhookEndpointDTO } from '@/types/system';
import { WebhookAutoDisabledBanner } from './auto-disabled-banner';

const NOW = new Date();
const HOURS_AGO = (h: number) =>
  new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString();
const DAYS_AGO = (d: number) =>
  new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

const baseEndpoint: WebhookEndpointDTO = {
  id: 'whk_dead',
  tenantId: 'tnt_demo',
  url: 'https://broken.example.com/webhook',
  description: 'Endpoint do parceiro X',
  apiVersion: '2026-04-27',
  subscribedEvents: ['punch.time-entry.created'],
  status: 'AUTO_DISABLED',
  autoDisabledReason: 'CONSECUTIVE_DEAD',
  autoDisabledAt: HOURS_AGO(2),
  consecutiveDeadCount: 10,
  secretMasked: 'whsec_••••••••a4f7',
  secretCurrentCreatedAt: DAYS_AGO(40),
  secretRotationActiveUntil: null,
  lastSuccessAt: DAYS_AGO(7),
  lastDeliveryAt: HOURS_AGO(2),
  createdAt: DAYS_AGO(40),
  updatedAt: HOURS_AGO(2),
};

const meta = {
  title: 'Modules/Devices/WebhookAutoDisabledBanner',
  component: WebhookAutoDisabledBanner,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Banner de alerta exibido apenas quando o endpoint está AUTO_DISABLED (Phase 11 D-25). Mostra motivo formal pt-BR (CONSECUTIVE_DEAD ou HTTP_410_GONE) + CTA âmbar "Reativar webhook" (PIN gate fora do banner) + link secundário para o log de entregas falhas. Renderiza `null` para qualquer outro status.',
      },
    },
  },
} satisfies Meta<typeof WebhookAutoDisabledBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConsecutiveDead: Story = {
  args: {
    endpoint: baseEndpoint,
    onReactivateClick: () => {},
    onViewFailedDeliveriesClick: () => {},
  },
};

export const Http410Gone: Story = {
  args: {
    endpoint: { ...baseEndpoint, autoDisabledReason: 'HTTP_410_GONE' },
    onReactivateClick: () => {},
    onViewFailedDeliveriesClick: () => {},
  },
};

export const Reativando: Story = {
  args: {
    endpoint: baseEndpoint,
    reactivating: true,
    onReactivateClick: () => {},
    onViewFailedDeliveriesClick: () => {},
  },
};

export const SemLinkSecundario: Story = {
  args: {
    endpoint: baseEndpoint,
    onReactivateClick: () => {},
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: {
    endpoint: { ...baseEndpoint, autoDisabledReason: 'HTTP_410_GONE' },
    onReactivateClick: () => {},
    onViewFailedDeliveriesClick: () => {},
  },
};
