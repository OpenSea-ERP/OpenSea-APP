import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
import type {
  CompanyStakeholder,
  CreateCompanyStakeholderData,
  UpdateCompanyStakeholderData,
} from '@/types/hr';
import { Users, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export type StakeholderFormData = Partial<
  CreateCompanyStakeholderData | UpdateCompanyStakeholderData
>;

interface StakeholderModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  stakeholder?: CompanyStakeholder | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: StakeholderFormData) => Promise<void>;
}

const STAKEHOLDER_ROLES = [
  { label: 'Sócio Administrador', value: 'SOCIO_ADMINISTRADOR' },
  { label: 'Sócio Diretor', value: 'SOCIO_DIRETOR' },
  { label: 'Sócio Majoritário', value: 'SOCIO_MAJORITARIO' },
  { label: 'Sócio Minoritário', value: 'SOCIO_MINORITARIO' },
  { label: 'Sócio Cotista', value: 'SOCIO_COTISTA' },
  { label: 'Diretor', value: 'DIRETOR' },
  { label: 'Presidente', value: 'PRESIDENTE' },
  { label: 'Vice-Presidente', value: 'VICE_PRESIDENTE' },
  { label: 'Procurador', value: 'PROCURADOR' },
  { label: 'Administrador', value: 'ADMINISTRADOR' },
];

export function StakeholderModal({
  isOpen,
  mode,
  stakeholder,
  isSubmitting,
  onClose,
  onSubmit,
}: StakeholderModalProps) {
  const [form, setForm] = useState<StakeholderFormData>({
    status: 'ACTIVE',
    isLegalRepresentative: false,
  });

  useEffect(() => {
    if (stakeholder) {
      setForm({
        name: stakeholder.name || '',
        role: stakeholder.role || '',
        personDocumentMasked: stakeholder.personDocumentMasked || '',
        isLegalRepresentative: stakeholder.isLegalRepresentative ?? false,
        status: stakeholder.status || 'ACTIVE',
        entryDate: stakeholder.entryDate || '',
        exitDate: stakeholder.exitDate || '',
      });
    } else {
      setForm({ status: 'ACTIVE', isLegalRepresentative: false });
    }
  }, [stakeholder]);

  const title = useMemo(
    () => (mode === 'create' ? 'Novo sócio' : 'Editar sócio'),
    [mode]
  );

  const handleChange = (
    field: keyof StakeholderFormData,
    value: string | boolean
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.role) return;
    await onSubmit(form);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold flex items-center gap-3">
            <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            {title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-2"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2">
            <Label htmlFor="stakeholder-name" className="mb-1.5">
              Nome *
            </Label>
            <Input
              id="stakeholder-name"
              value={form.name || ''}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>

          <div>
            <Label htmlFor="stakeholder-document" className="mb-1.5">
              Documento (CPF/CNPJ)
            </Label>
            <Input
              id="stakeholder-document"
              value={form.personDocumentMasked || ''}
              onChange={e =>
                handleChange('personDocumentMasked', e.target.value)
              }
              placeholder="000.000.000-00"
            />
          </div>

          <div>
            <Label htmlFor="stakeholder-role" className="mb-1.5">
              Cargo *
            </Label>
            <Select
              value={String(form.role || '')}
              onValueChange={value => handleChange('role', value)}
            >
              <SelectTrigger id="stakeholder-role">
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent>
                {STAKEHOLDER_ROLES.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="stakeholder-entry-date" className="mb-1.5">
              Data de Entrada
            </Label>
            <Input
              id="stakeholder-entry-date"
              value={form.entryDate || ''}
              onChange={e => handleChange('entryDate', e.target.value)}
              type="date"
            />
          </div>

          <div>
            <Label htmlFor="stakeholder-exit-date" className="mb-1.5">
              Data de Saída
            </Label>
            <Input
              id="stakeholder-exit-date"
              value={form.exitDate || ''}
              onChange={e => handleChange('exitDate', e.target.value)}
              type="date"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="stakeholder-status" className="mb-1.5">
              Status
            </Label>
            <Select
              value={String(form.status || 'ACTIVE')}
              onValueChange={value => handleChange('status', value)}
            >
              <SelectTrigger id="stakeholder-status">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Ativo</SelectItem>
                <SelectItem value="INACTIVE">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between dark:bg-slate-800 col-span-2 rounded-lg border bg-muted/30 px-4 py-3.5 mt-2">
            <div className="flex-1">
              <Label
                htmlFor="stakeholder-legal-rep"
                className="text-sm font-medium cursor-pointer"
              >
                Representante Legal
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Marcar se este sócio é representante legal da empresa
              </p>
            </div>
            <Switch
              id="stakeholder-legal-rep"
              checked={!!form.isLegalRepresentative}
              onCheckedChange={value =>
                handleChange('isLegalRepresentative', value)
              }
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !form.name || !form.role}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar sócio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
