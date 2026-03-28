/**
 * Send Kudos Modal
 * Modal wizard para enviar reconhecimento a um colega
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { translateError } from '@/lib/error-messages';
import { employeesService } from '@/services/hr';
import type { KudosCategory, SendKudosData } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  Handshake,
  Lightbulb,
  Loader2,
  Search,
  Shield,
  Sparkles,
  Star,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// CATEGORY CONFIG
// ============================================================================

const CATEGORY_CONFIG: Record<
  KudosCategory,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    gradient: string;
  }
> = {
  TEAMWORK: {
    label: 'Trabalho em Equipe',
    description: 'Colaborou de forma excepcional com a equipe',
    icon: Handshake,
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-blue-600',
  },
  INNOVATION: {
    label: 'Inovação',
    description: 'Trouxe ideias criativas e soluções inovadoras',
    icon: Lightbulb,
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-amber-600',
  },
  LEADERSHIP: {
    label: 'Liderança',
    description: 'Demonstrou habilidades de liderança excepcionais',
    icon: Shield,
    color: 'text-purple-500',
    gradient: 'from-purple-500 to-purple-600',
  },
  EXCELLENCE: {
    label: 'Excelência',
    description: 'Entregou resultados acima das expectativas',
    icon: Star,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  HELPFULNESS: {
    label: 'Prestatividade',
    description: 'Sempre disponível para ajudar os colegas',
    icon: Sparkles,
    color: 'text-pink-500',
    gradient: 'from-pink-500 to-pink-600',
  },
};

const CATEGORIES = Object.entries(CATEGORY_CONFIG) as [
  KudosCategory,
  (typeof CATEGORY_CONFIG)[KudosCategory],
][];

// ============================================================================
// COMPONENT
// ============================================================================

interface SendKudosModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (data: SendKudosData) => Promise<void>;
}

export function SendKudosModal({
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
}: SendKudosModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [toEmployeeId, setToEmployeeId] = useState('');
  const [category, setCategory] = useState<KudosCategory | ''>('');
  const [message, setMessage] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [wasOpen, setWasOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Reset when modal opens
  if (isOpen && !wasOpen) {
    setWasOpen(true);
    setCurrentStep(1);
    setToEmployeeId('');
    setCategory('');
    setMessage('');
    setIsPublic(true);
    setFieldErrors({});
    setEmployeeSearch('');
  }
  if (!isOpen && wasOpen) {
    setWasOpen(false);
  }

  // Fetch employees for selection
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['hr-employees-for-kudos'],
    queryFn: async () => {
      const response = await employeesService.listEmployees({
        page: 1,
        perPage: 200,
        status: 'ACTIVE',
      });
      return response.employees;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const employees = employeesData ?? [];

  // Filter employees by search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const q = employeeSearch.toLowerCase();
    return employees.filter(
      emp =>
        emp.fullName.toLowerCase().includes(q) ||
        (emp.department?.name &&
          emp.department.name.toLowerCase().includes(q)) ||
        (emp.position?.name && emp.position.name.toLowerCase().includes(q))
    );
  }, [employees, employeeSearch]);

  const selectedEmployee = useMemo(
    () => employees.find(e => e.id === toEmployeeId),
    [employees, toEmployeeId]
  );

  const selectedCategory = category ? CATEGORY_CONFIG[category] : null;

  // Focus search input on step 1
  useEffect(() => {
    if (currentStep === 1 && isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isOpen]);

  // Focus message textarea on step 2
  useEffect(() => {
    if (currentStep === 2 && isOpen) {
      const timer = setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isOpen]);

  const handleSubmit = async () => {
    if (!toEmployeeId || !category || !message.trim()) return;

    try {
      await onSubmit({
        toEmployeeId,
        message: message.trim(),
        category: category as KudosCategory,
        isPublic,
      });
      handleClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(translateError(msg));
    }
  };

  const handleClose = () => {
    onClose();
  };

  const steps: WizardStep[] = useMemo(
    () => [
      {
        title: 'Destinatário e Categoria',
        description: 'Escolha o colega e o tipo de reconhecimento',
        icon: <Award className="h-16 w-16 text-amber-500/60" />,
        isValid: !!toEmployeeId && !!category,
        content: (
          <div className="flex flex-col h-full space-y-4 overflow-hidden">
            {/* Employee selection */}
            <div className="space-y-2">
              <Label>
                Colaborador <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Buscar colaborador por nome, cargo ou departamento..."
                  value={employeeSearch}
                  onChange={e => setEmployeeSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="max-h-[140px] overflow-y-auto border rounded-md divide-y">
                {employeesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Carregando colaboradores...
                    </span>
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    Nenhum colaborador encontrado
                  </div>
                ) : (
                  filteredEmployees.map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => setToEmployeeId(emp.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent/50 ${
                        toEmployeeId === emp.id
                          ? 'bg-accent border-l-2 border-l-primary'
                          : ''
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {emp.fullName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[emp.position?.name, emp.department?.name]
                            .filter(Boolean)
                            .join(' - ') || 'Sem cargo/departamento'}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Category selection */}
            <div className="space-y-2">
              <Label>
                Categoria <span className="text-rose-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-accent/50 ${
                        category === key
                          ? 'border-primary bg-accent ring-1 ring-primary'
                          : 'border-border'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${config.color}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {config.label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Mensagem e Confirmação',
        description: 'Escreva a mensagem e revise antes de enviar',
        icon: <Award className="h-16 w-16 text-amber-500/60" />,
        isValid: !!message.trim() && !isSubmitting,
        onBack: () => setCurrentStep(1),
        content: (
          <div className="flex flex-col h-full space-y-4">
            {/* Preview card */}
            {selectedEmployee && selectedCategory && (
              <div className="rounded-lg border bg-accent/30 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Para:</span>
                  <span className="font-medium">
                    {selectedEmployee.fullName}
                  </span>
                  <span className="text-muted-foreground">-</span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium ${selectedCategory.color}`}
                  >
                    {(() => {
                      const CatIcon = selectedCategory.icon;
                      return <CatIcon className="h-3 w-3" />;
                    })()}
                    {selectedCategory.label}
                  </span>
                </div>
              </div>
            )}

            {/* Message */}
            <div className="space-y-2 flex-1 flex flex-col">
              <Label htmlFor="kudos-message">
                Mensagem <span className="text-rose-500">*</span>
              </Label>
              <textarea
                ref={messageInputRef}
                id="kudos-message"
                placeholder="Escreva sua mensagem de reconhecimento..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="flex-1 min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/500 caracteres
              </p>
            </div>

            {/* Public toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  isPublic ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <Label
                className="cursor-pointer"
                onClick={() => setIsPublic(!isPublic)}
              >
                {isPublic
                  ? 'Visível no feed público'
                  : 'Apenas para o destinatário'}
              </Label>
            </div>
          </div>
        ),
        footer: (
          <Button
            type="button"
            disabled={isSubmitting || !message.trim()}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Reconhecimento'
            )}
          </Button>
        ),
      },
    ],
    [
      toEmployeeId,
      category,
      message,
      isPublic,
      isSubmitting,
      fieldErrors,
      employeesLoading,
      filteredEmployees,
      employeeSearch,
      selectedEmployee,
      selectedCategory,
    ]
  );

  return (
    <StepWizardDialog
      open={isOpen}
      onOpenChange={open => !open && handleClose()}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
