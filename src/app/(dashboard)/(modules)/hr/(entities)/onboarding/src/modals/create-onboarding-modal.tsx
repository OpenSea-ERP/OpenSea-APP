'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { useCreateOnboarding } from '../api/mutations';
import { ClipboardCheck, ListTodo, Plus, Trash2, UserPlus } from 'lucide-react';
import { useCallback, useState } from 'react';

// Simple employee selector (just an ID input for now)
interface CreateOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
}

interface ChecklistItemDraft {
  title: string;
  description: string;
}

export function CreateOnboardingModal({
  open,
  onOpenChange,
  onClose,
}: CreateOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [employeeId, setEmployeeId] = useState('');
  const [title, setTitle] = useState('Onboarding');
  const [draftItems, setDraftItems] = useState<ChecklistItemDraft[]>([
    { title: '', description: '' },
  ]);

  const createOnboarding = useCreateOnboarding({
    onSuccess: () => {
      handleReset();
      onClose();
    },
  });

  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setEmployeeId('');
    setTitle('Onboarding');
    setDraftItems([{ title: '', description: '' }]);
  }, []);

  const handleAddItem = useCallback(() => {
    setDraftItems(prev => [...prev, { title: '', description: '' }]);
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setDraftItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleItemChange = useCallback(
    (index: number, field: 'title' | 'description', value: string) => {
      setDraftItems(prev =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  const handleSubmit = useCallback(() => {
    const validItems = draftItems.filter(item => item.title.trim() !== '');
    createOnboarding.mutate({
      employeeId,
      title: title.trim() || 'Onboarding',
      items:
        validItems.length > 0
          ? validItems.map(item => ({
              title: item.title.trim(),
              description: item.description.trim() || undefined,
            }))
          : undefined,
    });
  }, [employeeId, title, draftItems, createOnboarding]);

  const hasValidItems = draftItems.some(item => item.title.trim() !== '');

  const steps: WizardStep[] = [
    {
      title: 'Funcionário e Título',
      description: 'Selecione o funcionário e defina o título do checklist',
      icon: <UserPlus className="h-16 w-16 text-blue-500 dark:text-blue-400" />,
      isValid: employeeId.trim().length > 0,
      content: (
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">ID do Funcionário</Label>
            <Input
              id="employeeId"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              placeholder="Insira o ID do funcionário"
            />
            <p className="text-xs text-muted-foreground">
              Cole o ID do funcionário para o qual deseja criar o checklist de
              onboarding.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Título do Checklist</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Onboarding Engenharia"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Itens do Checklist',
      description:
        'Adicione as tarefas do onboarding (deixe vazio para usar o padrão)',
      icon: (
        <ListTodo className="h-16 w-16 text-emerald-500 dark:text-emerald-400" />
      ),
      isValid: true,
      content: (
        <div className="space-y-3 p-4 max-h-[320px] overflow-y-auto">
          {draftItems.map((item, index) => (
            <div
              key={index}
              className="flex gap-2 items-start border border-border rounded-lg p-3 bg-white dark:bg-slate-800/60"
            >
              <div className="flex-1 space-y-2">
                <Input
                  value={item.title}
                  onChange={e =>
                    handleItemChange(index, 'title', e.target.value)
                  }
                  placeholder="Título da tarefa"
                  className="text-sm"
                />
                <Input
                  value={item.description}
                  onChange={e =>
                    handleItemChange(index, 'description', e.target.value)
                  }
                  placeholder="Descrição (opcional)"
                  className="text-sm"
                />
              </div>
              {draftItems.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 shrink-0 mt-1"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Item
          </Button>
          {!hasValidItems && (
            <p className="text-xs text-muted-foreground text-center">
              Se nenhum item for preenchido, serão usados os itens padrão do
              sistema.
            </p>
          )}
        </div>
      ),
      footer: (
        <div className="flex justify-between w-full">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            Voltar
          </Button>
          <Button onClick={handleSubmit} disabled={createOnboarding.isPending}>
            <ClipboardCheck className="h-4 w-4 mr-1" />
            {createOnboarding.isPending ? 'Criando...' : 'Criar Checklist'}
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
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={() => {
        handleReset();
        onClose();
      }}
    />
  );
}
