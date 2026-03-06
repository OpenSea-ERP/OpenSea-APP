'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';
import { emailService } from '@/services/email';
import { teamsService } from '@/services/core/teams.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Mail, Save } from 'lucide-react';
import { PiUsersThreeDuotone } from 'react-icons/pi';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditTeamPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const teamId = params.id as string;

  const [form, setForm] = useState({
    name: '',
    description: '',
    color: '',
    emailAccountId: '' as string | null,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const { data: teamData, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['teams', teamId],
    queryFn: () => teamsService.getTeam(teamId),
  });

  const { data: accountsData } = useQuery({
    queryKey: ['email', 'accounts'],
    queryFn: () => emailService.listAccounts(),
  });

  const team = teamData?.team;
  const accounts = accountsData?.data ?? [];

  // Sync form with loaded team data
  useEffect(() => {
    if (team) {
      setForm({
        name: team.name,
        description: team.description ?? '',
        color: team.color ?? '',
        emailAccountId: team.emailAccountId ?? null,
      });
      setHasChanges(false);
    }
  }, [team]);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      teamsService.updateTeam(teamId, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        color: form.color.trim() || null,
        emailAccountId: form.emailAccountId || null,
      }),
    onSuccess: async () => {
      showSuccessToast('Equipe atualizada com sucesso');
      setHasChanges(false);
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
    onError: (error: Error) => {
      showErrorToast({
        title: 'Erro ao atualizar equipe',
        description: error.message,
      });
    },
  });

  if (isLoadingTeam) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Administração', href: '/admin' },
              { label: 'Equipes', href: '/admin/teams' },
              { label: '...', href: '#' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <div className="space-y-4 max-w-2xl">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-48 w-full" />
          </div>
        </PageBody>
      </PageLayout>
    );
  }

  if (!team) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Administração', href: '/admin' },
              { label: 'Equipes', href: '/admin/teams' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Equipe não encontrada.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/admin/teams">Voltar para equipes</Link>
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Administração', href: '/admin' },
            { label: 'Equipes', href: '/admin/teams' },
            { label: team.name, href: `/admin/teams/${teamId}` },
            { label: 'Editar', href: '#' },
          ]}
          buttons={[
            {
              id: 'back',
              title: 'Voltar',
              icon: ArrowLeft,
              variant: 'outline',
              onClick: () => router.push(`/admin/teams/${teamId}`),
            },
            {
              id: 'save',
              title: saveMutation.isPending ? 'Salvando...' : 'Salvar',
              icon: saveMutation.isPending ? Loader2 : Save,
              onClick: () => saveMutation.mutate(),
              disabled: !hasChanges || !form.name.trim() || saveMutation.isPending,
            },
          ]}
        />
      </PageHeader>

      <PageBody>
        <div className="max-w-2xl space-y-6">
          {/* General Info */}
          <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <PiUsersThreeDuotone className="h-5 w-5" />
              Informações Gerais
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={e => updateField('name', e.target.value)}
                  placeholder="Nome da equipe"
                  maxLength={128}
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                  placeholder="Descrição da equipe"
                  rows={3}
                  maxLength={2000}
                />
              </div>

              <div>
                <Label htmlFor="color">Cor</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={form.color || '#3b82f6'}
                    onChange={e => updateField('color', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    id="color"
                    value={form.color}
                    onChange={e => updateField('color', e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Email Account */}
          <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5" />
              Conta de E-mail
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Vincule uma conta de e-mail à equipe. Membros terão acesso para
              visualizar e responder. Administradores poderão gerenciar a conta.
            </p>

            <div>
              <Label htmlFor="emailAccount">Conta de e-mail</Label>
              <Select
                value={form.emailAccountId ?? 'none'}
                onValueChange={value =>
                  updateField('emailAccountId', value === 'none' ? null : value)
                }
              >
                <SelectTrigger id="emailAccount" className="w-full">
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.displayName
                        ? `${account.displayName} (${account.address})`
                        : account.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>
      </PageBody>
    </PageLayout>
  );
}
