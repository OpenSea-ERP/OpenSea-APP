'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CreateCipaMandateData, CipaMandateStatus } from '@/types/hr';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Check, Loader2, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CreateMandateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCipaMandateData) => void;
  isSubmitting: boolean;
}

const STATUS_OPTIONS: { value: CipaMandateStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'EXPIRED', label: 'Encerrado' },
];

export function CreateMandateModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateMandateModalProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<CipaMandateStatus>('DRAFT');
  const [electionDate, setElectionDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setStatus('DRAFT');
      setElectionDate('');
      setNotes('');
    }
  }, [isOpen]);

  const canSubmit = name.trim() && startDate && endDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const data: CreateCipaMandateData = {
      name: name.trim(),
      startDate,
      endDate,
      status,
      electionDate: electionDate || undefined,
      notes: notes.trim() || undefined,
    };

    onSubmit(data);
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[800px] max-w-[800px] h-[480px] p-0 gap-0 overflow-hidden flex flex-row"
      >
        <VisuallyHidden>
          <DialogTitle>Novo Mandato CIPA</DialogTitle>
        </VisuallyHidden>

        {/* Left icon column */}
        <div className="w-[200px] shrink-0 bg-slate-50 dark:bg-white/5 flex items-center justify-center border-r border-border/50">
          <Shield
            className="h-16 w-16 text-amber-400"
            strokeWidth={1.2}
          />
        </div>

        {/* Right content column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <h2 className="text-lg font-semibold leading-none">
                Novo Mandato CIPA
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Cadastre um novo mandato da Comissão Interna de Prevenção de Acidentes.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          {/* Body */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0"
          >
            <div
              className="flex-1 overflow-y-auto px-6 py-2 space-y-4"
              onWheel={e => e.stopPropagation()}
            >
              {/* Nome + Status */}
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="mandate-name" className="text-xs">
                    Nome do Mandato <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="mandate-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: CIPA 2026/2027"
                    className="h-9"
                  />
                </div>
                <div className="w-40 space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={status}
                    onValueChange={v => setStatus(v as CipaMandateStatus)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Período */}
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="start-date" className="text-xs">
                    Data de Início <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="end-date" className="text-xs">
                    Data de Término <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Data da Eleição */}
              <div className="w-1/2 space-y-1.5">
                <Label htmlFor="election-date" className="text-xs">
                  Data da Eleição
                </Label>
                <Input
                  id="election-date"
                  type="date"
                  value={electionDate}
                  onChange={e => setElectionDate(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <Label htmlFor="mandate-notes" className="text-xs">
                  Observações
                </Label>
                <Textarea
                  id="mandate-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Informações adicionais sobre o mandato..."
                  rows={2}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-border/50">
              <Button type="submit" disabled={isSubmitting || !canSubmit}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Criar Mandato
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
