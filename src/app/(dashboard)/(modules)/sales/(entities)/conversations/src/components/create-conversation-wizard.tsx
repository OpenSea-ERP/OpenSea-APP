'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { ApiError } from '@/lib/errors/api-error';
import { translateError } from '@/lib/error-messages';
import type { CreateConversationRequest } from '@/types/sales';
import { Check, Loader2, MessageSquare, User } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────

interface CreateConversationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateConversationRequest) => Promise<void>;
  isSubmitting?: boolean;
}

// ─── Step 1: Cliente e Assunto ───────────────────────────────

function StepSelectCustomer({
  customerId,
  onCustomerIdChange,
  subject,
  onSubjectChange,
  fieldErrors,
}: {
  customerId: string;
  onCustomerIdChange: (v: string) => void;
  subject: string;
  onSubjectChange: (v: string) => void;
  fieldErrors: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>ID do Cliente *</Label>
        <div className="relative">
          <Input
            placeholder="ID do cliente (UUID)"
            value={customerId}
            onChange={e => onCustomerIdChange(e.target.value)}
            aria-invalid={!!fieldErrors.customerId}
          />
          <FormErrorIcon message={fieldErrors.customerId} />
        </div>
        <p className="text-xs text-muted-foreground">
          Informe o identificador do cliente para vincular a conversa.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Assunto *</Label>
        <div className="relative">
          <Input
            placeholder="Assunto da conversa"
            value={subject}
            onChange={e => onSubjectChange(e.target.value)}
            aria-invalid={!!fieldErrors.subject}
          />
          <FormErrorIcon message={fieldErrors.subject} />
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Primeira Mensagem ───────────────────────────────

function StepFirstMessage({
  message,
  onMessageChange,
}: {
  message: string;
  onMessageChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Mensagem Inicial</Label>
        <Textarea
          placeholder="Escreva a primeira mensagem da conversa..."
          rows={5}
          value={message}
          onChange={e => onMessageChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Opcional. Você pode enviar mensagens depois de criar a conversa.
        </p>
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreateConversationWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateConversationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [customerId, setCustomerId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setCustomerId('');
    setSubject('');
    setMessage('');
    setFieldErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    const payload: CreateConversationRequest = {
      customerId: customerId.trim(),
      subject: subject.trim(),
      initialMessage: message.trim() || undefined,
    };

    try {
      await onSubmit(payload);
      handleClose();
    } catch (err) {
      const apiError = ApiError.from(err);
      if (apiError.fieldErrors?.length) {
        const errors: Record<string, string> = {};
        for (const fe of apiError.fieldErrors) {
          errors[fe.field] = translateError(fe.message);
        }
        setFieldErrors(errors);
        setCurrentStep(1);
      } else {
        toast.error(translateError(apiError.message));
      }
    }
  }, [customerId, subject, message, onSubmit, handleClose]);

  const steps: WizardStep[] = [
    {
      title: 'Cliente e Assunto',
      description: 'Selecione o cliente e defina o assunto da conversa.',
      icon: <User className="h-16 w-16 text-sky-400" strokeWidth={1.2} />,
      content: (
        <StepSelectCustomer
          customerId={customerId}
          onCustomerIdChange={v => {
            setCustomerId(v);
            setFieldErrors(prev => {
              const { customerId: _, ...rest } = prev;
              return rest;
            });
          }}
          subject={subject}
          onSubjectChange={v => {
            setSubject(v);
            setFieldErrors(prev => {
              const { subject: _, ...rest } = prev;
              return rest;
            });
          }}
          fieldErrors={fieldErrors}
        />
      ),
      isValid: customerId.trim().length > 0 && subject.trim().length > 0,
    },
    {
      title: 'Primeira Mensagem',
      description: 'Escreva a mensagem inicial da conversa.',
      icon: (
        <MessageSquare
          className="h-16 w-16 text-emerald-400"
          strokeWidth={1.2}
        />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <StepFirstMessage message={message} onMessageChange={setMessage} />
      ),
      isValid: true,
      footer: (
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Conversa
        </Button>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
