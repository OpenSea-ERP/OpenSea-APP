'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { CreateTrainingProgramData } from '@/types/hr';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  TRAINING_CATEGORY_OPTIONS,
  TRAINING_FORMAT_OPTIONS,
} from '../constants';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (data: CreateTrainingProgramData) => Promise<void>;
}

export function CreateModal({
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
}: CreateModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [format, setFormat] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [instructor, setInstructor] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [validityMonths, setValidityMonths] = useState('');

  const resetForm = () => {
    setStep(1);
    setName('');
    setDescription('');
    setCategory('');
    setFormat('');
    setDurationHours('');
    setInstructor('');
    setMaxParticipants('');
    setIsMandatory(false);
    setValidityMonths('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const canProceedStep1 =
    name.trim().length > 0 &&
    category.length > 0 &&
    format.length > 0 &&
    Number(durationHours) > 0;

  const handleSubmit = async () => {
    const data: CreateTrainingProgramData = {
      name: name.trim(),
      category: category as CreateTrainingProgramData['category'],
      format: format as CreateTrainingProgramData['format'],
      durationHours: Number(durationHours),
      isMandatory,
    };

    if (description.trim()) data.description = description.trim();
    if (instructor.trim()) data.instructor = instructor.trim();
    if (maxParticipants) data.maxParticipants = Number(maxParticipants);
    if (validityMonths) data.validityMonths = Number(validityMonths);

    await onSubmit(data);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Novo Programa de Treinamento</DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Passo 1 de 2 - Informações do programa'
              : 'Passo 2 de 2 - Configurações'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Ex: NR-35 Trabalho em Altura"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o objetivo do treinamento..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAINING_CATEGORY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Formato *</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAINING_FORMAT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="durationHours">Duração (horas) *</Label>
              <Input
                id="durationHours"
                type="number"
                min={1}
                placeholder="Ex: 8"
                value={durationHours}
                onChange={e => setDurationHours(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="instructor">Instrutor</Label>
              <Input
                id="instructor"
                placeholder="Nome do instrutor"
                value={instructor}
                onChange={e => setInstructor(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="maxParticipants">Máximo de Participantes</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min={1}
                  placeholder="Sem limite"
                  value={maxParticipants}
                  onChange={e => setMaxParticipants(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="validityMonths">Validade (meses)</Label>
                <Input
                  id="validityMonths"
                  type="number"
                  min={1}
                  placeholder="Sem validade"
                  value={validityMonths}
                  onChange={e => setValidityMonths(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Switch
                id="isMandatory"
                checked={isMandatory}
                onCheckedChange={setIsMandatory}
              />
              <div>
                <Label htmlFor="isMandatory" className="cursor-pointer">
                  Treinamento Obrigatório
                </Label>
                <p className="text-sm text-muted-foreground">
                  Todos os funcionários devem completar este treinamento
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)}>
              Voltar
            </Button>
          )}
          {step === 1 ? (
            <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
              Próximo
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Criar Programa
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
