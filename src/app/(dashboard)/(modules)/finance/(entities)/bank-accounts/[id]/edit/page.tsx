/**
 * Edit Bank Account Page
 * Follows pattern: PageLayout > PageActionBar (Delete + Save) > Identity Card > Form Card
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PermissionCodes from '@/config/rbac/permission-codes';
import {
  useBankAccount,
  useDeleteBankAccount,
  useUpdateBankAccount,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import {
  BANK_ACCOUNT_STATUS_LABELS,
  BANK_ACCOUNT_TYPE_LABELS,
  PIX_KEY_TYPE_LABELS,
} from '@/types/finance';
import type {
  BankAccountStatus,
  BankAccountType,
  PixKeyType,
} from '@/types/finance';
import { Building2, Save, Trash, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function EditBankAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useBankAccount(id);
  const updateMutation = useUpdateBankAccount();
  const deleteMutation = useDeleteBankAccount();
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(PermissionCodes.FINANCE.BANK_ACCOUNTS.REMOVE);
  const account = data?.bankAccount;
  const formRef = useRef<HTMLFormElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    bankCode: '',
    bankName: '',
    agency: '',
    agencyDigit: '',
    accountNumber: '',
    accountDigit: '',
    accountType: 'CHECKING' as BankAccountType,
    status: 'ACTIVE' as BankAccountStatus,
    pixKeyType: '' as string,
    pixKey: '',
    color: '',
    isDefault: false,
    description: '',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        bankCode: account.bankCode,
        bankName: account.bankName || '',
        agency: account.agency,
        agencyDigit: account.agencyDigit || '',
        accountNumber: account.accountNumber,
        accountDigit: account.accountDigit || '',
        accountType: account.accountType,
        status: account.status,
        pixKeyType: account.pixKeyType || '',
        pixKey: account.pixKey || '',
        color: account.color || '',
        isDefault: account.isDefault,
        description: '',
      });
    }
  }, [account]);

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Contas Bancárias', href: '/finance/bank-accounts' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!account) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Contas Bancárias', href: '/finance/bank-accounts' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Conta bancária não encontrada
            </h2>
            <Button onClick={() => router.push('/finance/bank-accounts')}>
              Voltar para Contas Bancárias
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          name: formData.name,
          bankCode: formData.bankCode,
          bankName: formData.bankName || undefined,
          agency: formData.agency,
          agencyDigit: formData.agencyDigit || undefined,
          accountNumber: formData.accountNumber,
          accountDigit: formData.accountDigit || undefined,
          accountType: formData.accountType,
          pixKeyType: (formData.pixKeyType as PixKeyType) || undefined,
          pixKey: formData.pixKey || undefined,
          color: formData.color || undefined,
          isDefault: formData.isDefault,
        },
      });
      toast.success('Conta bancária atualizada com sucesso!');
      router.push(`/finance/bank-accounts/${id}`);
    } catch {
      toast.error('Erro ao atualizar conta bancária.');
    }
  };

  const handleDeleteConfirm = async () => {
    await deleteMutation.mutateAsync(id);
    toast.success('Conta bancária excluída com sucesso.');
    router.push('/finance/bank-accounts');
  };

  const buttons = [
    ...(canDelete
      ? [
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash,
            onClick: () => setDeleteModalOpen(true),
            variant: 'outline' as const,
            className: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10',
          },
        ]
      : []),
    {
      id: 'cancel',
      title: 'Cancelar',
      icon: X,
      onClick: () => router.push(`/finance/bank-accounts/${id}`),
      variant: 'outline' as const,
    },
    {
      id: 'save',
      title: 'Salvar',
      icon: Save,
      onClick: () => {
        if (formRef.current) {
          formRef.current.dispatchEvent(
            new Event('submit', { cancelable: true, bubbles: true })
          );
        }
      },
      disabled: updateMutation.isPending,
    },
  ];

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Contas Bancárias', href: '/finance/bank-accounts' },
            {
              label: account.name,
              href: `/finance/bank-accounts/${id}`,
            },
            { label: 'Editar' },
          ]}
          buttons={buttons}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-5">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0"
              style={{
                background: account.color
                  ? `linear-gradient(135deg, ${account.color}, ${account.color}cc)`
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              }}
            >
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                {account.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {account.bankName}
                {account.bankCode ? ` (${account.bankCode})` : ''}
              </p>
            </div>
            <Badge variant="secondary">Editando</Badge>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Básicos */}
            <div>
              <h3 className="text-base font-semibold mb-4">Dados Básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Nome <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={e =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nome da conta bancária"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bankName">Banco</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={e =>
                      setFormData({ ...formData, bankName: e.target.value })
                    }
                    placeholder="Nome do banco"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bankCode">
                    Código do Banco <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bankCode"
                    required
                    value={formData.bankCode}
                    onChange={e =>
                      setFormData({ ...formData, bankCode: e.target.value })
                    }
                    placeholder="Ex: 001, 341, 237"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="accountType">
                    Tipo de Conta <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value: string) =>
                      setFormData({
                        ...formData,
                        accountType: value as BankAccountType,
                      })
                    }
                  >
                    <SelectTrigger id="accountType">
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
              </div>
            </div>

            {/* Dados da Conta */}
            <div>
              <h3 className="text-base font-semibold mb-4">Dados da Conta</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="agency">
                    Agência <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="agency"
                    required
                    value={formData.agency}
                    onChange={e =>
                      setFormData({ ...formData, agency: e.target.value })
                    }
                    placeholder="0001"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="agencyDigit">Dígito da Agência</Label>
                  <Input
                    id="agencyDigit"
                    value={formData.agencyDigit}
                    onChange={e =>
                      setFormData({ ...formData, agencyDigit: e.target.value })
                    }
                    placeholder="0"
                    maxLength={2}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="accountNumber">
                    Número da Conta <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="accountNumber"
                    required
                    value={formData.accountNumber}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        accountNumber: e.target.value,
                      })
                    }
                    placeholder="12345"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="accountDigit">Dígito da Conta</Label>
                  <Input
                    id="accountDigit"
                    value={formData.accountDigit}
                    onChange={e =>
                      setFormData({ ...formData, accountDigit: e.target.value })
                    }
                    placeholder="0"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>

            {/* Status e Configurações */}
            <div>
              <h3 className="text-base font-semibold mb-4">
                Status e Configurações
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: string) =>
                      setFormData({
                        ...formData,
                        status: value as BankAccountStatus,
                      })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BANK_ACCOUNT_STATUS_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 max-w-[200px]">
                  <Label htmlFor="color">Cor</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color || '#3b82f6'}
                    onChange={e =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="h-10 cursor-pointer"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="isDefault">Conta Padrão</Label>
                  <Select
                    value={formData.isDefault ? 'true' : 'false'}
                    onValueChange={value =>
                      setFormData({
                        ...formData,
                        isDefault: value === 'true',
                      })
                    }
                  >
                    <SelectTrigger id="isDefault">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dados PIX */}
            <div>
              <h3 className="text-base font-semibold mb-4">Dados PIX</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="pixKeyType">Tipo de Chave PIX</Label>
                  <Select
                    value={formData.pixKeyType || 'none'}
                    onValueChange={value =>
                      setFormData({
                        ...formData,
                        pixKeyType: value === 'none' ? '' : value,
                      })
                    }
                  >
                    <SelectTrigger id="pixKeyType">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
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

                <div className="grid gap-2">
                  <Label htmlFor="pixKey">Chave PIX</Label>
                  <Input
                    id="pixKey"
                    value={formData.pixKey}
                    onChange={e =>
                      setFormData({ ...formData, pixKey: e.target.value })
                    }
                    placeholder="Chave PIX"
                    disabled={!formData.pixKeyType}
                  />
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Observações sobre a conta bancária"
                rows={3}
              />
            </div>
          </form>
        </Card>
      </PageBody>

      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Conta Bancária"
        description={`Digite seu PIN de ação para excluir "${account.name}".`}
      />
    </PageLayout>
  );
}
