/**
 * OpenSea OS - Create Category Wizard
 * Modal de criação rápida de categoria
 */

'use client';

import { Button } from '@/components/ui/button';
import { CategoryCombobox } from '@/components/ui/category-combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { categoriesService } from '@/services/stock';
import type { Category } from '@/types/stock';
import { logger } from '@/lib/logger';
import { Loader2, TextCursorInput } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Category>) => Promise<void>;
}

export function CreateModal({ isOpen, onClose, onSubmit }: CreateModalProps) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    categoriesService
      .listCategories()
      .then(r => setCategories(r.categories || []))
      .catch(() => setCategories([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setParentId('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        parentId: parentId || undefined,
        isActive: true,
      });
      setName('');
      setParentId('');
    } catch (error) {
      logger.error(
        'Erro ao criar categoria',
        error instanceof Error ? error : undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: WizardStep[] = useMemo(
    () => [
      {
        title: 'Nova Categoria',
        description: 'Defina o nome e a hierarquia da categoria',
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
                onKeyDown={e => {
                  if (e.key === 'Enter' && name.trim()) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                autoFocus
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria Pai</Label>
              <CategoryCombobox
                categories={categories}
                value={parentId}
                onValueChange={setParentId}
                placeholder="Nenhuma (categoria raiz)"
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para criar uma categoria no nível raiz
              </p>
            </div>
          </div>
        ),
        footer: (
          <div className="flex items-center justify-end gap-2 w-full">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
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
    [name, parentId, isSubmitting, categories, onClose]
  );

  return (
    <StepWizardDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      steps={steps}
      currentStep={1}
      onStepChange={() => {}}
      onClose={onClose}
    />
  );
}
