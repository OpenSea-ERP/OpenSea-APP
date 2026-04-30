import type { Meta, StoryObj } from '@storybook/react';
import { MessagePreview } from './message-preview';

const meta = {
  title: 'Modules/Finance/MessagePreview',
  component: MessagePreview,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Pré-visualização de mensagem de cobrança em quatro canais (WhatsApp, E-mail, Nota Interna, Alerta do Sistema). Cada canal usa um layout próprio (bolha estilo WhatsApp, card de e-mail, nota com timbre interno, alerta de sistema com prioridade). Placeholders `{customerName}`, `{amount}`, `{dueDate}`, etc. são substituídos por dados de exemplo no preview.',
      },
    },
  },
} satisfies Meta<typeof MessagePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Templates de mensagem
// ============================================================================

const friendlyTemplate = `Olá {customerName},

Identificamos que o lançamento {entryCode} ({description}) no valor de {amount} venceu em {dueDate} ({daysPastDue} dias atrás).

Caso o pagamento já tenha sido efetuado, por favor desconsidere esta mensagem.

Atenciosamente,
Equipe Financeira`;

const formalTemplate = `Prezado(a) {customerName},

Comunicamos que o título {entryCode} encontra-se em aberto há {daysPastDue} dias. Solicitamos a regularização do débito de {amount} com vencimento original em {dueDate}.

Pedimos a gentileza de entrar em contato em até 48 horas.`;

const urgentTemplate = `URGENTE: {customerName}, débito de {amount} ({entryCode}) vencido há {daysPastDue} dias. Vencimento: {dueDate}. Regularize hoje para evitar negativação.`;

// ============================================================================
// Stories
// ============================================================================

export const WhatsApp: Story = {
  args: {
    message: friendlyTemplate,
    channel: 'WHATSAPP',
    showChannelToggle: false,
  },
};

export const Email: Story = {
  args: {
    message: formalTemplate,
    subject: 'Lembrete de pagamento — {entryCode}',
    channel: 'EMAIL',
    showChannelToggle: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Layout de e-mail com cabeçalho De/Para/Assunto, similar a clientes de e-mail clássicos (Outlook/Gmail).',
      },
    },
  },
};

export const InternalNote: Story = {
  args: {
    message:
      'Cliente entrou em contato confirmando dificuldades temporárias. Acordo verbal: pagamento até 30/05/2025 com isenção de multa. Aguardando retorno por escrito.',
    channel: 'INTERNAL_NOTE',
    showChannelToggle: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Nota interna automatizada — exibida no histórico do lançamento com timestamp do registro.',
      },
    },
  },
};

export const SystemAlert: Story = {
  args: {
    message: urgentTemplate,
    subject: 'Cobrança em fase final — {entryCode}',
    channel: 'SYSTEM_ALERT',
    showChannelToggle: false,
  },
};

export const WithChannelToggle: Story = {
  args: {
    message: friendlyTemplate,
    subject: 'Pendência financeira — {entryCode}',
    channel: 'WHATSAPP',
    showChannelToggle: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Quando `showChannelToggle` está ativo, o componente expõe um toggle interno para alternar entre canais — ideal para configuração de templates de cobrança onde o usuário compara o mesmo texto entre formatos.',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    message: '',
    channel: 'WHATSAPP',
    showChannelToggle: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Sem texto digitado — componente exibe placeholder italic indicando que o usuário deve digitar uma mensagem.',
      },
    },
  },
};
