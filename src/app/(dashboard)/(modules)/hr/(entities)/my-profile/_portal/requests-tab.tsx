'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { portalService } from '@/services/hr';
import type {
  EmployeeRequest,
  RequestType,
  RequestStatus,
  CreateEmployeeRequestData,
} from '@/types/hr';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  PalmtreeIcon,
  Plus,
  Send,
  UserCog,
  XCircle,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// CONSTANTS
// ============================================================================

const REQUEST_TYPE_OPTIONS: { value: RequestType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'VACATION', label: 'Ferias', icon: <PalmtreeIcon className="h-5 w-5" />, description: 'Solicitar periodo de ferias' },
  { value: 'ABSENCE', label: 'Ausencia', icon: <Calendar className="h-5 w-5" />, description: 'Registrar ausencia ou atestado medico' },
  { value: 'ADVANCE', label: 'Adiantamento', icon: <FileText className="h-5 w-5" />, description: 'Solicitar adiantamento salarial' },
  { value: 'DATA_CHANGE', label: 'Alteracao de Dados', icon: <UserCog className="h-5 w-5" />, description: 'Solicitar atualizacao de dados cadastrais' },
  { value: 'SUPPORT', label: 'Suporte', icon: <Send className="h-5 w-5" />, description: 'Abrir chamado para o RH' },
];

const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  VACATION: 'Ferias',
  ABSENCE: 'Ausencia',
  ADVANCE: 'Adiantamento',
  DATA_CHANGE: 'Alteracao de Dados',
  SUPPORT: 'Suporte',
};

const REQUEST_STATUS_CONFIG: Record<RequestStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  PENDING: { label: 'Pendente', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
  APPROVED: { label: 'Aprovada', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  REJECTED: { label: 'Rejeitada', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  CANCELLED: { label: 'Cancelada', variant: 'secondary', icon: <AlertCircle className="h-3 w-3" /> },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function RequestsTab() {
  const queryClient = useQueryClient();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [selectedType, setSelectedType] = useState<RequestType | ''>('');
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Fetch requests
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const response = await portalService.listMyRequests({ perPage: 50 });
      return response.requests;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateEmployeeRequestData) =>
      portalService.createRequest(data),
    onSuccess: () => {
      toast.success('Solicitacao criada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      handleCloseWizard();
    },
    onError: () => {
      toast.error('Erro ao criar solicitacao');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => portalService.cancelRequest(id),
    onSuccess: () => {
      toast.success('Solicitacao cancelada');
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    },
    onError: () => {
      toast.error('Erro ao cancelar solicitacao');
    },
  });

  const handleCloseWizard = useCallback(() => {
    setIsWizardOpen(false);
    setCurrentStep(1);
    setSelectedType('');
    setFormData({});
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedType) return;
    createMutation.mutate({
      type: selectedType,
      data: formData,
    });
  }, [selectedType, formData, createMutation]);

  // ============================================================================
  // WIZARD STEPS
  // ============================================================================

  const steps: WizardStep[] = [
    {
      id: 'type',
      title: 'Tipo de Solicitacao',
      isValid: !!selectedType,
    },
    {
      id: 'details',
      title: 'Detalhes',
      isValid: Object.keys(formData).length > 0,
    },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Minhas Solicitacoes</h3>
          <p className="text-sm text-muted-foreground">
            Acompanhe suas solicitacoes ao departamento de RH
          </p>
        </div>
        <Button
          size="sm"
          className="h-9 px-2.5"
          onClick={() => setIsWizardOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Solicitacao
        </Button>
      </div>

      {/* Request List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : !requestsData || requestsData.length === 0 ? (
        <Card className="p-12 text-center bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium mb-1">Nenhuma solicitacao</p>
          <p className="text-sm text-muted-foreground mb-4">
            Voce ainda nao fez nenhuma solicitacao ao RH
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsWizardOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Criar Primeira Solicitacao
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {requestsData.map((request: EmployeeRequest) => {
            const statusConfig = REQUEST_STATUS_CONFIG[request.status];
            return (
              <Card
                key={request.id}
                className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">
                        {REQUEST_TYPE_LABELS[request.type]}
                      </p>
                      <Badge
                        variant={statusConfig.variant}
                        className="gap-1 text-xs"
                      >
                        {statusConfig.icon}
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Criada em{' '}
                      {new Date(request.createdAt).toLocaleDateString('pt-BR')}{' '}
                      {request.approverEmployee
                        ? `- Aprovador: ${request.approverEmployee.fullName}`
                        : ''}
                    </p>
                    {request.rejectionReason && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                        Motivo da rejeicao: {request.rejectionReason}
                      </p>
                    )}
                  </div>
                  {request.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      onClick={() => cancelMutation.mutate(request.id)}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span className="ml-1 hidden sm:inline">Cancelar</span>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Request Wizard */}
      <StepWizardDialog
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        title="Nova Solicitacao"
        description="Selecione o tipo de solicitacao e preencha os detalhes"
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitLabel="Enviar Solicitacao"
      >
        {currentStep === 1 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Tipo de Solicitacao
            </Label>
            <div className="grid gap-2">
              {REQUEST_TYPE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setSelectedType(option.value)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    selectedType === option.value
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      selectedType === option.value
                        ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {option.icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && selectedType === 'VACATION' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data de Inicio</Label>
              <Input
                type="date"
                value={formData.startDate || ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Termino</Label>
              <Input
                type="date"
                value={formData.endDate || ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Observacoes</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Observacoes adicionais (opcional)"
                rows={3}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && selectedType === 'ABSENCE' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data de Inicio</Label>
              <Input
                type="date"
                value={formData.startDate || ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, startDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Termino</Label>
              <Input
                type="date"
                value={formData.endDate || ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Select
                value={formData.reason || ''}
                onValueChange={v =>
                  setFormData(prev => ({ ...prev, reason: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEDICAL">Atestado Medico</SelectItem>
                  <SelectItem value="PERSONAL">Motivo Pessoal</SelectItem>
                  <SelectItem value="BEREAVEMENT">Falecimento</SelectItem>
                  <SelectItem value="WEDDING">Casamento</SelectItem>
                  <SelectItem value="BIRTH">Nascimento de Filho</SelectItem>
                  <SelectItem value="OTHER">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Detalhes</Label>
              <Textarea
                value={formData.details || ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, details: e.target.value }))
                }
                placeholder="Descreva a situacao"
                rows={3}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && selectedType === 'ADVANCE' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Valor do Adiantamento (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount || ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, amount: e.target.value }))
                }
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Justificativa</Label>
              <Textarea
                value={formData.justification || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    justification: e.target.value,
                  }))
                }
                placeholder="Descreva o motivo do adiantamento"
                rows={3}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && selectedType === 'DATA_CHANGE' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Campo a Alterar</Label>
              <Select
                value={formData.field || ''}
                onValueChange={v =>
                  setFormData(prev => ({ ...prev, field: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o campo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADDRESS">Endereco</SelectItem>
                  <SelectItem value="PHONE">Telefone</SelectItem>
                  <SelectItem value="EMAIL">E-mail</SelectItem>
                  <SelectItem value="BANK_ACCOUNT">Dados Bancarios</SelectItem>
                  <SelectItem value="EMERGENCY_CONTACT">Contato de Emergencia</SelectItem>
                  <SelectItem value="OTHER">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor Atual</Label>
              <Input
                value={formData.currentValue || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    currentValue: e.target.value,
                  }))
                }
                placeholder="Valor atual do campo"
              />
            </div>
            <div className="space-y-2">
              <Label>Novo Valor</Label>
              <Input
                value={formData.newValue || ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, newValue: e.target.value }))
                }
                placeholder="Novo valor desejado"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && selectedType === 'SUPPORT' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input
                value={formData.subject || ''}
                onChange={e =>
                  setFormData(prev => ({ ...prev, subject: e.target.value }))
                }
                placeholder="Assunto do chamado"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={formData.category || ''}
                onValueChange={v =>
                  setFormData(prev => ({ ...prev, category: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAYROLL">Folha de Pagamento</SelectItem>
                  <SelectItem value="BENEFITS">Beneficios</SelectItem>
                  <SelectItem value="DOCUMENTS">Documentos</SelectItem>
                  <SelectItem value="SYSTEMS">Sistemas / Acessos</SelectItem>
                  <SelectItem value="OTHER">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea
                value={formData.description || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Descreva detalhadamente sua solicitacao"
                rows={4}
              />
            </div>
          </div>
        )}
      </StepWizardDialog>
    </div>
  );
}
