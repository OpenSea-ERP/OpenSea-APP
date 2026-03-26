/**
 * OpenSea OS - Safety Program Edit Page
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
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
import type {
  SafetyProgram,
  SafetyProgramType,
  SafetyProgramStatus,
} from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  FileText,
  NotebookText,
  Save,
  ShieldCheck,
  Trash,
  User,
  X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  safetyProgramsApi,
  safetyProgramKeys,
  getProgramTypeLabel,
  getProgramStatusLabel,
  getProgramStatusVariant,
  formatDate,
  useUpdateSafetyProgram,
  useDeleteSafetyProgram,
  PROGRAM_TYPE_LABELS,
  PROGRAM_STATUS_LABELS,
} from '../../src';

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function SafetyProgramEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const programId = params.id as string;

  // ============================================================================
  // STATE
  // ============================================================================

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<SafetyProgramType>('PGR');
  const [status, setStatus] = useState<SafetyProgramStatus>('DRAFT');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [responsibleRegistration, setResponsibleRegistration] = useState('');
  const [description, setDescription] = useState('');

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: program, isLoading } = useQuery<SafetyProgram>({
    queryKey: safetyProgramKeys.detail(programId),
    queryFn: () => safetyProgramsApi.get(programId),
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdateSafetyProgram({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: safetyProgramKeys.lists() });
      router.push(`/hr/safety-programs/${programId}`);
    },
  });

  const deleteMutation = useDeleteSafetyProgram({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: safetyProgramKeys.lists() });
      router.push('/hr/safety-programs');
    },
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (program) {
      setName(program.name || '');
      setType(program.type);
      setStatus(program.status);
      setStartDate(program.validFrom ? program.validFrom.split('T')[0] : '');
      setEndDate(program.validUntil ? program.validUntil.split('T')[0] : '');
      setResponsibleName(program.responsibleName || '');
      setResponsibleRegistration(program.responsibleRegistration || '');
      setDescription(program.notes || '');
    }
  }, [program]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSave = async () => {
    if (!program || !name) return;

    updateMutation.mutate({
      id: programId,
      data: {
        name,
        type,
        status,
        validFrom: startDate || undefined,
        validUntil: endDate || undefined,
        responsibleName: responsibleName || undefined,
        responsibleRegistration: responsibleRegistration || undefined,
        notes: description || undefined,
      },
    });
  };

  const handleDelete = async () => {
    if (!program) return;
    await deleteMutation.mutateAsync(program.id);
    setIsDeleteModalOpen(false);
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              {
                label: 'Programas de Segurança',
                href: '/hr/safety-programs',
              },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!program) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              {
                label: 'Programas de Segurança',
                href: '/hr/safety-programs',
              },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Programa não encontrado
            </h2>
            <Button onClick={() => router.push('/hr/safety-programs')}>
              Voltar para Programas
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const isSaving = updateMutation.isPending;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            {
              label: 'Programas de Segurança',
              href: '/hr/safety-programs',
            },
            {
              label: program.name,
              href: `/hr/safety-programs/${programId}`,
            },
            { label: 'Editar' },
          ]}
          buttons={[
            {
              id: 'delete',
              title: 'Excluir',
              icon: Trash,
              onClick: () => setIsDeleteModalOpen(true),
              variant: 'outline',
              disabled: isSaving || deleteMutation.isPending,
            },
            {
              id: 'cancel',
              title: 'Cancelar',
              icon: X,
              onClick: () => router.push(`/hr/safety-programs/${programId}`),
              variant: 'outline',
              disabled: isSaving,
            },
            {
              id: 'save',
              title: 'Salvar',
              icon: Save,
              onClick: handleSave,
              disabled: isSaving || !name,
            },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-emerald-500 to-emerald-600">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Editar Programa de Segurança
                </h1>
                <Badge variant={getProgramStatusVariant(program.status)}>
                  {getProgramStatusLabel(program.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {getProgramTypeLabel(program.type)} · {program.name}
              </p>
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Informações Gerais */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <SectionHeader
            icon={NotebookText}
            title="Informações Gerais"
            subtitle="Nome, tipo e status do programa"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Ex: PGR 2026"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={type}
                onValueChange={v => setType(v as SafetyProgramType)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROGRAM_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={status}
                onValueChange={v => setStatus(v as SafetyProgramStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROGRAM_STATUS_LABELS).map(
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
        </Card>

        {/* Período de Vigência */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <SectionHeader
            icon={Calendar}
            title="Período de Vigência"
            subtitle="Datas de início e fim do programa"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Término *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>
        </Card>

        {/* Responsável Técnico */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <SectionHeader
            icon={User}
            title="Responsável Técnico"
            subtitle="Profissional responsável pelo programa"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="responsibleName">Nome do Responsável *</Label>
              <Input
                id="responsibleName"
                placeholder="Ex: Eng. Maria Oliveira"
                value={responsibleName}
                onChange={e => setResponsibleName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibleRegistration">
                Registro Profissional *
              </Label>
              <Input
                id="responsibleRegistration"
                placeholder="Ex: CREA/SP 123456"
                value={responsibleRegistration}
                onChange={e => setResponsibleRegistration(e.target.value)}
                required
              />
            </div>
          </div>
        </Card>

        {/* Descrição */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <SectionHeader
            icon={FileText}
            title="Descrição"
            subtitle="Detalhes adicionais sobre o programa"
          />
          <div className="mt-4">
            <Textarea
              id="description"
              placeholder="Descrição do programa de segurança..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </Card>
      </PageBody>

      {/* Delete Confirm Modal */}
      <VerifyActionPinModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDelete}
        title="Excluir Programa de Segurança"
        description="Digite seu PIN de ação para excluir este programa de segurança. Esta ação não pode ser desfeita."
      />
    </PageLayout>
  );
}
