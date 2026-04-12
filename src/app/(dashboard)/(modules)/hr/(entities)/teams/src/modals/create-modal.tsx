/**
 * HR Create Team Modal
 * Modal para criar nova equipe no contexto HR
 * Usa StepWizardDialog com 2 etapas
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { useFormErrorHandler } from '@/hooks/use-form-error-handler';
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { PiUsersThreeDuotone } from 'react-icons/pi';
import { createTeam } from '../utils/teams.crud';

const PRESET_COLORS: { hex: string; name: string }[] = [
  { hex: '#3B82F6', name: 'Azul' },
  { hex: '#06B6D4', name: 'Ciano' },
  { hex: '#10B981', name: 'Esmeralda' },
  { hex: '#8B5CF6', name: 'Violeta' },
  { hex: '#F59E0B', name: 'Âmbar' },
  { hex: '#F43F5E', name: 'Rosa' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#F97316', name: 'Laranja' },
  { hex: '#14B8A6', name: 'Teal' },
  { hex: '#6366F1', name: 'Índigo' },
];

interface CreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateModalProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [nameError, setNameError] = useState('');

  const resetForm = () => {
    setStep(1);
    setName('');
    setDescription('');
    setSelectedColor('');
    setNameError('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await createTeam({
        name: name.trim(),
        description: description.trim() || null,
        color: selectedColor || null,
      });
      showSuccessToast('Equipe criada com sucesso');
      onSuccess();
      resetForm();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      if (
        message.toLowerCase().includes('already exists') ||
        message.toLowerCase().includes('já existe')
      ) {
        setNameError('Uma equipe com este nome já existe');
        setStep(1);
      } else {
        showErrorToast({
          title: 'Erro ao criar equipe',
          description: message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const step1Valid = name.trim().length > 0;

  const steps: WizardStep[] = [
    {
      title: 'Informações da Equipe',
      description: 'Defina o nome, descrição e cor da equipe',
      icon: (
        <PiUsersThreeDuotone className="h-16 w-16 text-violet-500 dark:text-violet-400" />
      ),
      isValid: step1Valid,
      content: (
        <div className="space-y-4 p-1">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="hr-team-name">Nome da equipe *</Label>
            <Input
              id="hr-team-name"
              placeholder="Ex: Equipe de Vendas"
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              autoFocus
              aria-invalid={!!nameError}
              className={nameError ? 'border-rose-500' : ''}
            />
            {nameError && <p className="text-sm text-rose-500">{nameError}</p>}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="hr-team-description">Descrição</Label>
            <Textarea
              id="hr-team-description"
              placeholder="Descreva a equipe..."
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(({ hex, name }) => (
                <button
                  key={hex}
                  type="button"
                  className="w-8 h-8 rounded-full border-2 transition-all cursor-pointer"
                  style={{
                    backgroundColor: hex,
                    borderColor:
                      selectedColor === hex ? 'white' : 'transparent',
                    boxShadow:
                      selectedColor === hex ? `0 0 0 2px ${hex}` : 'none',
                  }}
                  onClick={() =>
                    setSelectedColor(selectedColor === hex ? '' : hex)
                  }
                  aria-label={`Selecionar cor ${name}`}
                  title={name}
                />
              ))}
            </div>
            {selectedColor && (
              <p className="text-xs text-muted-foreground">
                Cor selecionada:{' '}
                {PRESET_COLORS.find(c => c.hex === selectedColor)?.name ??
                  selectedColor}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Confirmar Criação',
      description: 'Revise os dados e confirme a criação da equipe',
      icon: (
        <CheckCircle2 className="h-16 w-16 text-violet-500 dark:text-violet-400" />
      ),
      isValid: step1Valid,
      onBack: () => setStep(1),
      content: (
        <div className="space-y-4 p-1">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-3">
              {selectedColor && (
                <div
                  className="w-8 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: selectedColor }}
                />
              )}
              <div>
                <p className="font-medium text-sm">{name || '—'}</p>
                <p className="text-xs text-muted-foreground">Nome da equipe</p>
              </div>
            </div>

            {description.trim() && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                <p className="text-sm">{description}</p>
              </div>
            )}

            {!description.trim() && (
              <div>
                <p className="text-xs text-muted-foreground">
                  Nenhuma descrição informada
                </p>
              </div>
            )}

            {selectedColor && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Cor:</p>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="text-xs text-muted-foreground">
                  {selectedColor}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Após a criação, você poderá adicionar membros à equipe.
          </p>
        </div>
      ),
      footer: (
        <div className="flex justify-end gap-2 p-4 border-t border-border/50">
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!step1Valid || isLoading}>
            {isLoading ? 'Criando...' : 'Criar Equipe'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={step}
      onStepChange={setStep}
      onClose={handleClose}
      heightClass="h-[460px]"
    />
  );
}
