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
import { companiesService } from '@/services/admin/companies.service';
import type { CreateBankAccountData, PixKeyType } from '@/types/finance';
import {
  BANK_ACCOUNT_TYPE_LABELS,
  PIX_KEY_TYPE_LABELS,
} from '@/types/finance';
import { useQuery } from '@tanstack/react-query';
import { Landmark, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { BankSelect } from '../components/bank-select';

interface CreateBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBankAccountData) => Promise<void>;
  isSubmitting?: boolean;
}

const INITIAL_FORM = {
  name: '',
  bankCode: '',
  bankName: '',
  agency: '',
  agencyDigit: '',
  accountNumber: '',
  accountDigit: '',
  accountType: 'CHECKING' as const,
  pixKeyType: '',
  pixKey: '',
  color: '#3b82f6',
  companyId: '',
};

export function CreateBankAccountModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CreateBankAccountModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);

  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies-for-bank-account'],
    queryFn: () => companiesService.listCompanies({ perPage: 100 }),
    enabled: isOpen,
  });

  const companies = companiesData?.companies ?? [];

  const handleClose = () => {
    setForm(INITIAL_FORM);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: CreateBankAccountData = {
      name: form.name,
      bankCode: form.bankCode,
      agency: form.agency,
      accountNumber: form.accountNumber,
      accountType: form.accountType,
      bankName: form.bankName || undefined,
      agencyDigit: form.agencyDigit || undefined,
      accountDigit: form.accountDigit || undefined,
      pixKeyType: (form.pixKeyType || undefined) as PixKeyType | undefined,
      pixKey: form.pixKey || undefined,
      color: form.color || undefined,
      companyId: form.companyId || undefined,
      isDefault: false,
    };

    await onSubmit(data);
    setForm(INITIAL_FORM);
  };

  const canSubmit =
    form.name.trim() &&
    form.bankCode.trim() &&
    form.agency.trim() &&
    form.accountNumber.trim() &&
    !isSubmitting;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-500" />
            Nova Conta Bancária
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar uma nova conta bancária.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Nome + Cor */}
          <div className="grid grid-cols-[1fr_80px] gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Nome *</Label>
              <Input
                id="create-name"
                placeholder="Ex: Conta Principal"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-color">Cor</Label>
              <Input
                id="create-color"
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-9 p-1 cursor-pointer"
              />
            </div>
          </div>

          {/* Row 2: Banco + Agência/Dígito */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Banco *</Label>
              <BankSelect
                value={form.bankCode}
                onSelect={(bank) =>
                  setForm({
                    ...form,
                    bankCode: bank.bankCode,
                    bankName: bank.bankName,
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Agência *</Label>
              <div className="grid grid-cols-[1fr_60px] gap-2">
                <Input
                  placeholder="0001"
                  value={form.agency}
                  onChange={(e) => setForm({ ...form, agency: e.target.value })}
                  required
                />
                <Input
                  placeholder="Díg"
                  value={form.agencyDigit}
                  onChange={(e) =>
                    setForm({ ...form, agencyDigit: e.target.value })
                  }
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Tipo de Conta + Conta/Dígito */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-accountType">Tipo de Conta *</Label>
              <Select
                value={form.accountType}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    accountType: value as typeof form.accountType,
                  })
                }
              >
                <SelectTrigger id="create-accountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BANK_ACCOUNT_TYPE_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conta *</Label>
              <div className="grid grid-cols-[1fr_60px] gap-2">
                <Input
                  placeholder="12345"
                  value={form.accountNumber}
                  onChange={(e) =>
                    setForm({ ...form, accountNumber: e.target.value })
                  }
                  required
                />
                <Input
                  placeholder="Díg"
                  value={form.accountDigit}
                  onChange={(e) =>
                    setForm({ ...form, accountDigit: e.target.value })
                  }
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          {/* Row 4: Tipo de Chave PIX + Chave PIX */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="create-pixKeyType">Tipo de Chave PIX</Label>
              <Select
                value={form.pixKeyType}
                onValueChange={(value) =>
                  setForm({ ...form, pixKeyType: value })
                }
              >
                <SelectTrigger id="create-pixKeyType">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PIX_KEY_TYPE_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-pixKey">Chave PIX</Label>
              <Input
                id="create-pixKey"
                placeholder="Ex: email@exemplo.com"
                value={form.pixKey}
                onChange={(e) => setForm({ ...form, pixKey: e.target.value })}
              />
            </div>
          </div>

          {/* Row 5: Empresa */}
          <div className="space-y-1.5">
            <Label htmlFor="create-companyId">Empresa</Label>
            <Select
              value={form.companyId}
              onValueChange={(value) =>
                setForm({ ...form, companyId: value })
              }
            >
              <SelectTrigger id="create-companyId">
                <SelectValue
                  placeholder={
                    isLoadingCompanies
                      ? 'Carregando...'
                      : 'Selecione uma empresa (opcional)'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.tradeName || company.legalName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit} className="gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Criando...' : 'Criar Conta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
