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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { companiesService } from '@/services/admin/companies.service';
import { useQuery } from '@tanstack/react-query';
import { Building2, Loader2, Unlink } from 'lucide-react';
import { useState } from 'react';

interface LinkCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (companyId: string | null) => void;
  currentCompanyId?: string | null;
  currentCompanyName?: string | null;
  title?: string;
  mode: 'link' | 'unlink';
  isLoading?: boolean;
}

export function LinkCompanyModal({
  isOpen,
  onClose,
  onConfirm,
  currentCompanyId,
  currentCompanyName,
  title,
  mode,
  isLoading = false,
}: LinkCompanyModalProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies-for-link'],
    queryFn: () => companiesService.listCompanies({ perPage: 100 }),
    enabled: isOpen && mode === 'link',
  });

  const companies = companiesData?.companies ?? [];

  const handleConfirm = () => {
    if (mode === 'unlink') {
      onConfirm(null);
    } else {
      if (selectedCompanyId) {
        onConfirm(selectedCompanyId);
      }
    }
  };

  const handleClose = () => {
    setSelectedCompanyId('');
    onClose();
  };

  if (mode === 'unlink') {
    return (
      <Dialog
        open={isOpen}
        onOpenChange={open => {
          if (!open) handleClose();
        }}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlink className="w-5 h-5 text-amber-500" />
              {title || 'Desvincular Empresa'}
            </DialogTitle>
            <DialogDescription>
              Deseja desvincular a empresa{' '}
              <strong>{currentCompanyName || 'atual'}</strong> deste registro?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Desvincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            {title || 'Vincular Empresa'}
          </DialogTitle>
          <DialogDescription>
            Selecione a empresa para vincular a este registro.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select
            value={selectedCompanyId}
            onValueChange={setSelectedCompanyId}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingCompanies ? 'Carregando...' : 'Selecione uma empresa'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {companies.map(company => (
                <SelectItem key={company.id} value={company.id}>
                  {company.tradeName || company.legalName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !selectedCompanyId}
            className="gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
