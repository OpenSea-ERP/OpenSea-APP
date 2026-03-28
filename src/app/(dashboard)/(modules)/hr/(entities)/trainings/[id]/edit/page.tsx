/**
 * OpenSea OS - Edit Training Program Page
 * Página de edição de programa de treinamento
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { trainingService } from '@/services/hr/training.service';
import type { UpdateTrainingProgramData } from '@/types/hr';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Loader2, Save, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { TRAINING_CATEGORY_OPTIONS, TRAINING_FORMAT_OPTIONS } from '../../src';

export default function EditTrainingProgramPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const programId = params.id as string;

  const canDelete = hasPermission('hr.training.remove');

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [format, setFormat] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [instructor, setInstructor] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [validityMonths, setValidityMonths] = useState('');

  const {
    data: program,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['training-programs', programId],
    queryFn: async () => {
      const { trainingProgram } = await trainingService.getProgram(programId);
      return trainingProgram;
    },
  });

  useEffect(() => {
    if (program) {
      setName(program.name);
      setDescription(program.description ?? '');
      setCategory(program.category);
      setFormat(program.format);
      setDurationHours(program.durationHours.toString());
      setInstructor(program.instructor ?? '');
      setMaxParticipants(
        program.maxParticipants ? program.maxParticipants.toString() : ''
      );
      setIsMandatory(program.isMandatory);
      setIsActive(program.isActive);
      setValidityMonths(
        program.validityMonths ? program.validityMonths.toString() : ''
      );
    }
  }, [program]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateTrainingProgramData) =>
      trainingService.updateProgram(programId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
      toast.success('Programa de treinamento atualizado com sucesso');
      router.push(`/hr/trainings/${programId}`);
    },
    onError: () => {
      toast.error('Erro ao atualizar programa de treinamento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => trainingService.deleteProgram(programId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
      toast.success('Programa de treinamento excluído com sucesso');
      router.push('/hr/trainings');
    },
  });

  const handleSave = () => {
    const data: UpdateTrainingProgramData = {
      name: name.trim(),
      description: description.trim() || undefined,
      category: category as UpdateTrainingProgramData['category'],
      format: format as UpdateTrainingProgramData['format'],
      durationHours: Number(durationHours),
      instructor: instructor.trim() || undefined,
      maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      isMandatory,
      isActive,
      validityMonths: validityMonths ? Number(validityMonths) : undefined,
    };
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Treinamentos', href: '/hr/trainings' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !program) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Treinamentos', href: '/hr/trainings' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            title="Programa não encontrado"
            message="O programa de treinamento solicitado não foi encontrado."
            action={{
              label: 'Voltar',
              onClick: () => router.push('/hr/trainings'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Treinamentos', href: '/hr/trainings' },
            { label: program.name, href: `/hr/trainings/${programId}` },
            { label: 'Editar' },
          ]}
          buttons={[
            ...(canDelete
              ? [
                  {
                    id: 'delete',
                    title: 'Excluir',
                    icon: Trash2,
                    onClick: () => setIsDeleteOpen(true),
                    variant: 'destructive' as const,
                  },
                ]
              : []),
            {
              id: 'save',
              title: 'Salvar',
              icon: Save,
              onClick: handleSave,
              variant: 'default' as const,
              disabled: updateMutation.isPending || !name.trim(),
            },
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-violet-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{program.name}</h1>
              <p className="text-xs text-muted-foreground">
                Criado em{' '}
                {new Date(program.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <Card className="bg-white/5 py-2 overflow-hidden mt-6">
          <div className="p-6 grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label>Formato</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="durationHours">Duração (horas)</Label>
                <Input
                  id="durationHours"
                  type="number"
                  min={1}
                  value={durationHours}
                  onChange={e => setDurationHours(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="instructor">Instrutor</Label>
                <Input
                  id="instructor"
                  value={instructor}
                  onChange={e => setInstructor(e.target.value)}
                />
              </div>
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

            <div className="flex flex-col gap-4">
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

              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <div>
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Programa Ativo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Novos funcionários podem se inscrever neste programa
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Delete Confirmation */}
        <VerifyActionPinModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onSuccess={() => deleteMutation.mutate()}
          title="Excluir Programa de Treinamento"
          description={`Digite seu PIN de ação para excluir "${program.name}". Esta ação não pode ser desfeita.`}
        />
      </PageBody>
    </PageLayout>
  );
}
