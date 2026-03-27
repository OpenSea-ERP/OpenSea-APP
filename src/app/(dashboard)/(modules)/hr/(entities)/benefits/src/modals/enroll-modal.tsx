'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { employeesService } from '@/services/hr/employees.service';
import type { Employee } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2, Search, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

interface EnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  isSubmitting: boolean;
  onSubmit: (employeeIds: string[], startDate: string) => Promise<void>;
}

export function EnrollModal({
  isOpen,
  onClose,
  planId,
  planName,
  isSubmitting,
  onSubmit,
}: EnrollModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(
    new Set()
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [wasOpen, setWasOpen] = useState(false);

  // Reset when modal opens
  if (isOpen && !wasOpen) {
    setWasOpen(true);
    setCurrentStep(1);
    setSearchQuery('');
    setSelectedEmployeeIds(new Set());
    setStartDate(new Date().toISOString().split('T')[0]);
  }
  if (!isOpen && wasOpen) {
    setWasOpen(false);
  }

  const { data: employeesData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees', 'for-enrollment', planId],
    queryFn: async () => {
      const response = await employeesService.listEmployees({ perPage: 200 });
      return response.employees;
    },
    enabled: isOpen,
  });

  const employees = employeesData || [];

  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      emp.fullName.toLowerCase().includes(q) ||
      emp.registrationNumber?.toLowerCase().includes(q)
    );
  });

  const toggleEmployee = (id: string) => {
    setSelectedEmployeeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedEmployeeIds.size === filteredEmployees.length) {
      setSelectedEmployeeIds(new Set());
    } else {
      setSelectedEmployeeIds(new Set(filteredEmployees.map(e => e.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedEmployeeIds.size === 0 || !startDate) return;
    await onSubmit(Array.from(selectedEmployeeIds), startDate);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const steps: WizardStep[] = useMemo(
    () => [
      {
        title: 'Selecionar Funcionários',
        description: `Inscrever funcionários no plano "${planName}"`,
        icon: <Users className="h-16 w-16 text-pink-500/60" />,
        isValid: selectedEmployeeIds.size > 0,
        footer: (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              disabled={selectedEmployeeIds.size === 0}
              onClick={() => setCurrentStep(2)}
            >
              Próximo ({selectedEmployeeIds.size} selecionado
              {selectedEmployeeIds.size !== 1 ? 's' : ''})
            </Button>
          </div>
        ),
        content: (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar funcionário por nome ou matrícula..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selectedEmployeeIds.size === filteredEmployees.length
                  ? 'Desmarcar todos'
                  : 'Selecionar todos'}
              </Button>
            </div>

            <ScrollArea className="max-h-[320px]">
              <div className="space-y-1">
                {isLoadingEmployees ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery
                      ? 'Nenhum funcionário encontrado'
                      : 'Nenhum funcionário cadastrado'}
                  </div>
                ) : (
                  filteredEmployees.map((employee: Employee) => {
                    const isSelected = selectedEmployeeIds.has(employee.id);
                    return (
                      <div
                        key={employee.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                          isSelected
                            ? 'bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/30'
                            : 'border border-transparent'
                        }`}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleEmployee(employee.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleEmployee(employee.id);
                          }
                        }}
                      >
                        <div
                          className={`flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${
                            isSelected
                              ? 'bg-pink-500 text-white'
                              : 'bg-linear-to-br from-slate-400 to-slate-500 text-white'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <span className="text-sm font-medium">
                              {employee.fullName.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {employee.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {employee.position?.name || 'Sem cargo'} -{' '}
                            {employee.registrationNumber}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        ),
      },
      {
        title: 'Data de Início',
        description: `Confirme a data de início da inscrição`,
        icon: <UserPlus className="h-16 w-16 text-pink-500/60" />,
        isValid: !!startDate && !isSubmitting,
        onBack: () => setCurrentStep(1),
        content: (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">
                Plano selecionado
              </p>
              <p className="font-medium">{planName}</p>
              <p className="text-sm text-muted-foreground mt-2 mb-1">
                Funcionários a inscrever
              </p>
              <p className="font-medium">
                {selectedEmployeeIds.size} funcionário
                {selectedEmployeeIds.size !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">
                Data de Início <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
          </div>
        ),
        footer: (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Voltar
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || !startDate}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscrevendo...
                </>
              ) : (
                `Inscrever ${selectedEmployeeIds.size} funcionário${selectedEmployeeIds.size !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        ),
      },
    ],
    [
      searchQuery,
      isLoadingEmployees,
      filteredEmployees,
      selectedEmployeeIds,
      startDate,
      planName,
      isSubmitting,
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
