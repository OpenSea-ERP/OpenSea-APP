/**
 * OpenSea OS - Create Category Wizard
 * Modal de criação de categoria em 2 passos
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { categoriesService } from '@/services/stock';
import type { Category } from '@/types/stock';
import { logger } from '@/lib/logger';
import {
  FolderTree,
  ImageIcon,
  Loader2,
  Sparkles,
  TextCursorInput,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { PiFolderOpenDuotone } from 'react-icons/pi';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Category>) => Promise<void>;
}

export function CreateModal({ isOpen, onClose, onSubmit }: CreateModalProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('none');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [iconError, setIconError] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // ============================================================================
  // LOAD CATEGORIES FOR PARENT SELECT
  // ============================================================================

  useEffect(() => {
    if (!isOpen) return;
    categoriesService
      .listCategories()
      .then(r => setCategories(r.categories || []))
      .catch(() => setCategories([]));
  }, [isOpen]);

  // ============================================================================
  // RESET ON CLOSE
  // ============================================================================

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setName('');
      setParentId('none');
      setDescription('');
      setIconUrl('');
      setIconError(false);
      setIsActive(true);
    }
  }, [isOpen]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        iconUrl: iconUrl.trim() || undefined,
        parentId: parentId === 'none' ? undefined : parentId,
        isActive,
      });
      onClose();
    } catch (error) {
      logger.error(
        'Erro ao criar categoria',
        error instanceof Error ? error : undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasValidIcon = iconUrl.trim() && !iconError;

  // ============================================================================
  // WIZARD STEPS
  // ============================================================================

  const steps: WizardStep[] = useMemo(
    () => [
      // ── Step 1: Informações Essenciais ──
      {
        title: 'Informações da Categoria',
        description: 'Defina o nome e a hierarquia',
        icon: (
          <TextCursorInput className="h-16 w-16 text-blue-400 opacity-50" />
        ),
        isValid: name.trim().length > 0,
        content: (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="wizard-name">
                Nome da Categoria <span className="text-red-500">*</span>
              </Label>
              <Input
                id="wizard-name"
                placeholder="Ex: Eletrônicos, Roupas, Alimentos..."
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wizard-parent">Categoria Pai</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione uma categoria pai" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="flex items-center gap-2">
                      <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                      Nenhuma (categoria raiz)
                    </span>
                  </SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Deixe vazio para criar uma categoria no nível raiz
              </p>
            </div>
          </div>
        ),
      },

      // ── Step 2: Detalhes Opcionais ──
      {
        title: 'Detalhes da Categoria',
        description: 'Personalize com descrição e ícone',
        icon: <Sparkles className="h-16 w-16 text-purple-400 opacity-50" />,
        isValid: true,
        onBack: () => setStep(1),
        content: (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="wizard-description">Descrição</Label>
              <Textarea
                id="wizard-description"
                placeholder="Descreva o propósito desta categoria..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wizard-icon">Ícone (SVG)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="wizard-icon"
                  placeholder="https://exemplo.com/icone.svg"
                  value={iconUrl}
                  onChange={e => {
                    setIconUrl(e.target.value);
                    setIconError(false);
                  }}
                  className="h-11 flex-1"
                />
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border overflow-hidden">
                  {hasValidIcon ? (
                    <Image
                      src={iconUrl}
                      alt="Ícone"
                      width={22}
                      height={22}
                      className="h-[22px] w-[22px] object-contain dark:brightness-0 dark:invert"
                      unoptimized
                      onError={() => setIconError(true)}
                    />
                  ) : (
                    <PiFolderOpenDuotone className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between w-full rounded-lg border border-border bg-white dark:bg-slate-800/60 p-4">
              <div>
                <p className="text-sm font-medium">Categoria Ativa</p>
                <p className="text-xs text-muted-foreground">
                  Categorias inativas não aparecem nas listagens
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        ),
        footer: (
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
            >
              ← Voltar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Criando...
                </>
              ) : (
                'Criar Categoria'
              )}
            </Button>
          </div>
        ),
      },
    ],
    [
      name,
      parentId,
      description,
      iconUrl,
      iconError,
      isActive,
      isSubmitting,
      hasValidIcon,
      categories,
    ]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <StepWizardDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      steps={steps}
      currentStep={step}
      onStepChange={setStep}
      onClose={onClose}
    />
  );
}
