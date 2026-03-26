/**
 * OpenSea OS - Medical Exam Edit Page
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
import { useEmployeeMap } from '@/hooks/use-employee-map';
import type { MedicalExam, MedicalExamType, MedicalExamResult } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  NotebookText,
  Save,
  Stethoscope,
  Trash,
  User,
  X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  medicalExamsApi,
  medicalExamKeys,
  getExamTypeLabel,
  getExamResultLabel,
  getExamResultVariant,
  formatDate,
  useUpdateMedicalExam,
  useDeleteMedicalExam,
  EXAM_TYPE_LABELS,
  EXAM_RESULT_LABELS,
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

export default function MedicalExamEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const examId = params.id as string;

  // ============================================================================
  // STATE
  // ============================================================================

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [type, setType] = useState<MedicalExamType>('ADMISSIONAL');
  const [scheduledDate, setScheduledDate] = useState('');
  const [examDate, setExamDate] = useState('');
  const [result, setResult] = useState<MedicalExamResult>('APTO');
  const [observations, setObservations] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorCrm, setDoctorCrm] = useState('');
  const [clinicName, setClinicName] = useState('');

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: exam, isLoading } = useQuery<MedicalExam>({
    queryKey: medicalExamKeys.detail(examId),
    queryFn: () => medicalExamsApi.get(examId),
  });

  const { getName } = useEmployeeMap(exam ? [exam.employeeId] : []);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdateMedicalExam({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicalExamKeys.lists() });
      router.push(`/hr/medical-exams/${examId}`);
    },
  });

  const deleteMutation = useDeleteMedicalExam({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicalExamKeys.lists() });
      router.push('/hr/medical-exams');
    },
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (exam) {
      setType(exam.type);
      setExamDate(exam.examDate ? exam.examDate.split('T')[0] : '');
      setResult(exam.result);
      setObservations(exam.observations || '');
      setDoctorName(exam.doctorName || '');
      setDoctorCrm(exam.doctorCrm || '');
    }
  }, [exam]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSave = async () => {
    if (!exam) return;

    updateMutation.mutate({
      id: examId,
      data: {
        type,
        examDate: examDate || undefined,
        result,
        observations: observations || undefined,
        doctorName: doctorName || undefined,
        doctorCrm: doctorCrm || undefined,
      },
    });
  };

  const handleDelete = async () => {
    if (!exam) return;
    await deleteMutation.mutateAsync(exam.id);
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
              { label: 'Exames Médicos', href: '/hr/medical-exams' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!exam) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Exames Médicos', href: '/hr/medical-exams' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Stethoscope className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Exame médico não encontrado
            </h2>
            <Button onClick={() => router.push('/hr/medical-exams')}>
              Voltar para Exames Médicos
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
            { label: 'Exames Médicos', href: '/hr/medical-exams' },
            {
              label: getExamTypeLabel(exam.type),
              href: `/hr/medical-exams/${examId}`,
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
              onClick: () => router.push(`/hr/medical-exams/${examId}`),
              variant: 'outline',
              disabled: isSaving,
            },
            {
              id: 'save',
              title: 'Salvar',
              icon: Save,
              onClick: handleSave,
              disabled: isSaving,
            },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-teal-500 to-teal-600">
              <Stethoscope className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Editar Exame Médico
                </h1>
                <Badge variant={getExamResultVariant(exam.result)}>
                  {getExamResultLabel(exam.result)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {getName(exam.employeeId)} · {formatDate(exam.examDate)}
              </p>
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados do Exame */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <SectionHeader
            icon={NotebookText}
            title="Dados do Exame"
            subtitle="Tipo, datas e resultado do exame"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Exame *</Label>
              <Select
                value={type}
                onValueChange={v => setType(v as MedicalExamType)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXAM_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="result">Resultado *</Label>
              <Select
                value={result}
                onValueChange={v => setResult(v as MedicalExamResult)}
              >
                <SelectTrigger id="result">
                  <SelectValue placeholder="Selecione o resultado" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXAM_RESULT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Data Agendada</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="examDate">Data do Exame *</Label>
              <Input
                id="examDate"
                type="date"
                value={examDate}
                onChange={e => setExamDate(e.target.value)}
                required
              />
            </div>
          </div>
        </Card>

        {/* Profissional/Clínica */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <SectionHeader
            icon={User}
            title="Profissional / Clínica"
            subtitle="Dados do médico e clínica responsável"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="doctorName">Nome do Médico *</Label>
              <Input
                id="doctorName"
                placeholder="Ex: Dr. João Silva"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctorCrm">CRM *</Label>
              <Input
                id="doctorCrm"
                placeholder="Ex: CRM/SP 123456"
                value={doctorCrm}
                onChange={e => setDoctorCrm(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicName">Nome da Clínica</Label>
              <Input
                id="clinicName"
                placeholder="Ex: Clínica Saúde Ocupacional"
                value={clinicName}
                onChange={e => setClinicName(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Observações */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <SectionHeader
            icon={FileText}
            title="Observações"
            subtitle="Anotações adicionais sobre o exame"
          />
          <div className="mt-4">
            <Textarea
              id="observations"
              placeholder="Observações sobre o exame médico..."
              value={observations}
              onChange={e => setObservations(e.target.value)}
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
        title="Excluir Exame Médico"
        description="Digite seu PIN de ação para excluir este exame médico. Esta ação não pode ser desfeita."
      />
    </PageLayout>
  );
}
