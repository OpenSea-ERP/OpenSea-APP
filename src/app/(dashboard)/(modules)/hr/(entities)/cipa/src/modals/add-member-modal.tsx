'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EmployeeSelector } from '@/components/shared/employee-selector';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  CreateCipaMemberData,
  CipaMemberRole,
  CipaMemberType,
} from '@/types/hr';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Check, Loader2, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCipaMemberData) => void;
  isSubmitting: boolean;
}

const ROLE_OPTIONS: { value: CipaMemberRole; label: string }[] = [
  { value: 'PRESIDENTE', label: 'Presidente' },
  { value: 'VICE_PRESIDENTE', label: 'Vice-Presidente' },
  { value: 'SECRETARIO', label: 'Secretário' },
  { value: 'MEMBRO_TITULAR', label: 'Membro Titular' },
  { value: 'MEMBRO_SUPLENTE', label: 'Membro Suplente' },
];

const TYPE_OPTIONS: { value: CipaMemberType; label: string }[] = [
  { value: 'EMPREGADOR', label: 'Representante do Empregador' },
  { value: 'EMPREGADO', label: 'Representante dos Empregados' },
];

export function AddMemberModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: AddMemberModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<CipaMemberRole | ''>('');
  const [type, setType] = useState<CipaMemberType | ''>('');
  const [isStable, setIsStable] = useState(false);
  const [stableUntil, setStableUntil] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEmployeeId('');
      setRole('');
      setType('');
      setIsStable(false);
      setStableUntil('');
    }
  }, [isOpen]);

  const canSubmit = employeeId.trim() && role && type;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const data: CreateCipaMemberData = {
      employeeId: employeeId.trim(),
      role: role as CipaMemberRole,
      type: type as CipaMemberType,
      isStable,
      stableUntil: isStable && stableUntil ? stableUntil : undefined,
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
        className="sm:max-w-[700px] max-w-[700px] h-[460px] p-0 gap-0 overflow-hidden flex flex-row"
      >
        <VisuallyHidden>
          <DialogTitle>Adicionar Membro à CIPA</DialogTitle>
        </VisuallyHidden>

        {/* Left icon column */}
        <div className="w-[200px] shrink-0 bg-slate-50 dark:bg-white/5 flex items-center justify-center border-r border-border/50">
          <UserPlus
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
                Adicionar Membro
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Selecione o funcionário e defina seu cargo na CIPA.
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
              {/* Funcionário */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Funcionário <span className="text-rose-500">*</span>
                </Label>
                <EmployeeSelector
                  value={employeeId}
                  onChange={id => setEmployeeId(id)}
                  placeholder="Selecionar funcionário..."
                />
              </div>

              {/* Cargo + Representação */}
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">
                    Cargo na CIPA <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={role}
                    onValueChange={v => setRole(v as CipaMemberRole)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar cargo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">
                    Representação <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={type}
                    onValueChange={v => setType(v as CipaMemberType)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Estabilidade */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={isStable}
                    onCheckedChange={setIsStable}
                  />
                  <Label className="text-xs">
                    Possui estabilidade provisória
                  </Label>
                </div>
                {isStable && (
                  <div className="w-1/2 space-y-1.5">
                    <Label htmlFor="stable-until" className="text-xs">
                      Estabilidade até
                    </Label>
                    <Input
                      id="stable-until"
                      type="date"
                      value={stableUntil}
                      onChange={e => setStableUntil(e.target.value)}
                      className="h-9"
                    />
                  </div>
                )}
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
                Adicionar Membro
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
