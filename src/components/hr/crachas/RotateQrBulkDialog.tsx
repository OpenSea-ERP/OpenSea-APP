'use client';

/**
 * OpenSea OS - RotateQrBulkDialog
 *
 * Bulk QR rotation form. Regular Dialog (NOT AlertDialog — it's a form, not a
 * pure confirmation). Scope picker: Todos | Departamento | Personalizado.
 * Final submit goes through `VerifyActionPinModal` (BulkAbuse-01 mitigation).
 *
 * Copy is locked verbatim to UI-SPEC §Copywriting §/hr/crachas (Rotate bulk).
 *
 * When scope=CUSTOM the selected employees are pre-filled from the page-level
 * selection (disabled, shows count). When scope=DEPARTMENT the admin picks
 * department IDs from the shared list.
 *
 * On server response { jobId, total }, this component closes and hands the
 * jobId back to the page via onSuccess — the page opens the
 * BulkJobProgressDrawer in the parent.
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw } from 'lucide-react';
import { useRotateQrTokensBulk } from '@/app/(dashboard)/hr/crachas/mutations';
import { useListDepartments } from '@/app/(dashboard)/(modules)/hr/(entities)/departments/src';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import type { RotateBulkScope } from '@/types/hr';

export interface RotateQrBulkDialogProps {
  isOpen: boolean;
  /** Employees currently selected on the page (scope=CUSTOM input). */
  selectedEmployeeIds: string[];
  /** Total number of employees (used in the "Todos" scope label). */
  totalEmployees: number;
  onClose: () => void;
  /** Fired after the server enqueues the job — the page opens the Drawer. */
  onSuccess: (result: { jobId: string; total: number }) => void;
}

type Scope = RotateBulkScope;

export function RotateQrBulkDialog({
  isOpen,
  selectedEmployeeIds,
  totalEmployees,
  onClose,
  onSuccess,
}: RotateQrBulkDialogProps) {
  const hasCustomSelection = selectedEmployeeIds.length > 0;
  const [scope, setScope] = useState<Scope>(
    hasCustomSelection ? 'CUSTOM' : 'ALL'
  );
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [generatePdfs, setGeneratePdfs] = useState(true);
  const [pinGateOpen, setPinGateOpen] = useState(false);

  const rotateBulk = useRotateQrTokensBulk();

  // Reset form state when the dialog opens.
  useEffect(() => {
    if (isOpen) {
      setScope(hasCustomSelection ? 'CUSTOM' : 'ALL');
      setSelectedDepartments([]);
      setGeneratePdfs(true);
      setPinGateOpen(false);
    }
  }, [isOpen, hasCustomSelection]);

  const { data: departmentsData } = useListDepartments({ perPage: 100 });
  const departments = departmentsData?.departments ?? [];

  const canSubmit =
    scope === 'ALL' ||
    (scope === 'DEPARTMENT' && selectedDepartments.length > 0) ||
    (scope === 'CUSTOM' && selectedEmployeeIds.length > 0);

  const handleStart = () => {
    // Open the PIN gate; the PIN modal's onSuccess triggers the mutation.
    setPinGateOpen(true);
  };

  const handlePinSuccess = async () => {
    try {
      const result = await rotateBulk.mutateAsync({
        scope,
        employeeIds: scope === 'CUSTOM' ? selectedEmployeeIds : undefined,
        departmentIds: scope === 'DEPARTMENT' ? selectedDepartments : undefined,
        generatePdfs,
      });
      if (result.jobId !== null) {
        onSuccess({ jobId: result.jobId, total: result.total });
        onClose();
      } else {
        // Empty scope: mutation helper already toasted; just stay open so the
        // admin can adjust the scope.
      }
    } catch {
      // The mutation helper toasts the error; keep the dialog open so the
      // admin can retry without losing the scope picker state.
    }
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={next => {
          if (!next && !rotateBulk.isPending) onClose();
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              Rotacionar QR em lote
            </DialogTitle>
            <DialogDescription>Quais funcionários?</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <RadioGroup
              value={scope}
              onValueChange={value => setScope(value as Scope)}
              className="gap-3"
            >
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30">
                <RadioGroupItem value="ALL" id="scope-all" />
                <Label htmlFor="scope-all" className="flex-1 cursor-pointer">
                  Todos os funcionários ({totalEmployees})
                </Label>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30">
                <RadioGroupItem value="DEPARTMENT" id="scope-department" />
                <div className="flex-1">
                  <Label htmlFor="scope-department" className="cursor-pointer">
                    Por departamento
                  </Label>
                  {scope === 'DEPARTMENT' ? (
                    <div className="mt-3 flex flex-col gap-2 max-h-40 overflow-y-auto">
                      {departments.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Nenhum departamento cadastrado.
                        </p>
                      ) : (
                        departments.map(dept => {
                          const checked = selectedDepartments.includes(dept.id);
                          return (
                            <label
                              key={dept.id}
                              className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={next => {
                                  setSelectedDepartments(prev =>
                                    next
                                      ? [...prev, dept.id]
                                      : prev.filter(id => id !== dept.id)
                                  );
                                }}
                              />
                              {dept.name}
                            </label>
                          );
                        })
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30">
                <RadioGroupItem
                  value="CUSTOM"
                  id="scope-custom"
                  disabled={!hasCustomSelection}
                />
                <Label
                  htmlFor="scope-custom"
                  className={`flex-1 ${hasCustomSelection ? 'cursor-pointer' : 'opacity-60'}`}
                >
                  Seleção personalizada
                  {hasCustomSelection ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({selectedEmployeeIds.length} selecionado(s))
                    </span>
                  ) : (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (selecione funcionários na lista primeiro)
                    </span>
                  )}
                </Label>
              </div>
            </RadioGroup>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={generatePdfs}
                onCheckedChange={next => setGeneratePdfs(Boolean(next))}
              />
              Gerar PDFs dos novos crachás
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={rotateBulk.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStart}
              disabled={!canSubmit || rotateBulk.isPending}
              className="gap-2"
            >
              {rotateBulk.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Iniciar rotação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VerifyActionPinModal
        isOpen={pinGateOpen}
        onClose={() => setPinGateOpen(false)}
        onSuccess={handlePinSuccess}
        title="Confirmar rotação em lote"
        description="Digite seu PIN de ação para autorizar a rotação de QR em lote. Esta operação invalida os crachás atuais dos funcionários selecionados."
      />
    </>
  );
}
