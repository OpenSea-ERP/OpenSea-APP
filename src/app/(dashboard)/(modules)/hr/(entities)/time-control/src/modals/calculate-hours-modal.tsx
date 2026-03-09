'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EmployeeSelector } from '@/components/shared/employee-selector';
import type { WorkedHoursResponse } from '@/services/hr/time-control.service';
import { Calculator, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDate, formatHours } from '../utils';
import { timeControlApi } from '../api';

interface CalculateHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: string;
}

export function CalculateHoursModal({
  isOpen,
  onClose,
  employeeId,
}: CalculateHoursModalProps) {
  const [employee, setEmployee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WorkedHoursResponse | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmployee(employeeId ?? '');
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      setStartDate(weekAgo);
      setEndDate(today);
      setResult(null);
    }
  }, [isOpen, employeeId]);

  async function handleCalculate() {
    if (!employee || !startDate || !endDate) return;

    setIsLoading(true);
    try {
      const data = await timeControlApi.calculateWorkedHours({
        employeeId: employee,
        startDate,
        endDate,
      });
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  const canCalculate = employee.trim().length > 0 && startDate && endDate;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-violet-500 to-violet-600 p-2 rounded-lg">
              <Calculator className="h-5 w-5" />
            </div>
            Calcular Horas Trabalhadas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>
              Funcionário <span className="text-red-500">*</span>
            </Label>
            <EmployeeSelector
              value={employee}
              onChange={id => setEmployee(id)}
              placeholder="Selecionar funcionário..."
              disabled={!!employeeId}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calc-start">Data Início</Label>
              <Input
                id="calc-start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calc-end">Data Fim</Label>
              <Input
                id="calc-end"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={!canCalculate || isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Calcular
          </Button>

          {result && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40">
                  <p className="text-xs text-muted-foreground">
                    Horas Trabalhadas
                  </p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    {formatHours(result.totalWorkedHours)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/40">
                  <p className="text-xs text-muted-foreground">Horas Líquidas</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {formatHours(result.totalNetHours)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40">
                  <p className="text-xs text-muted-foreground">Intervalos</p>
                  <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                    {formatHours(result.totalBreakHours)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-900/40">
                  <p className="text-xs text-muted-foreground">Horas Extras</p>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                    {formatHours(result.totalOvertimeHours)}
                  </p>
                </div>
              </div>

              {result.dailyBreakdown.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Detalhamento Diário
                  </h4>
                  <div className="space-y-1">
                    {result.dailyBreakdown.map(day => (
                      <div
                        key={day.date}
                        className="flex items-center justify-between py-2 px-3 rounded-lg border text-sm"
                      >
                        <span className="font-medium">
                          {formatDate(day.date)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {formatHours(day.totalHours)}
                          </Badge>
                          {day.overtimeHours > 0 && (
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                              +{formatHours(day.overtimeHours)} extra
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
