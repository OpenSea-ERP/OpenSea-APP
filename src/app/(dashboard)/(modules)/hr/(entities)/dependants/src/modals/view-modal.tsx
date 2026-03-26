/**
 * OpenSea OS - View Dependant Modal
 * Modal de visualizacao rapida de dependente
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { EmployeeDependant } from '@/types/hr';
import {
  Calendar,
  CreditCard,
  Heart,
  Shield,
  User,
} from 'lucide-react';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import {
  formatDate,
  formatCpf,
  calculateAge,
  getRelationshipLabel,
  getDependantBadges,
} from '../utils/dependants.utils';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dependant: EmployeeDependant | null;
}

export function ViewModal({ isOpen, onClose, dependant }: ViewModalProps) {
  const employeeIds = dependant ? [dependant.employeeId] : [];
  const { getName } = useEmployeeMap(employeeIds);

  if (!dependant) return null;

  const age = calculateAge(dependant.birthDate);
  const badges = getDependantBadges(dependant);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            {dependant.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge, i) => (
              <Badge key={i} variant={badge.variant}>
                {badge.label}
              </Badge>
            ))}
          </div>

          {/* Info grid */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 shrink-0" />
              <span className="font-medium text-foreground">Funcionário:</span>
              <span>{getName(dependant.employeeId)}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Heart className="h-4 w-4 shrink-0" />
              <span className="font-medium text-foreground">Parentesco:</span>
              <span>{getRelationshipLabel(dependant.relationship)}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="font-medium text-foreground">Nascimento:</span>
              <span>
                {formatDate(dependant.birthDate)}
                {age !== null && ` (${age} anos)`}
              </span>
            </div>

            {dependant.cpf && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4 shrink-0" />
                <span className="font-medium text-foreground">CPF:</span>
                <span>{formatCpf(dependant.cpf)}</span>
              </div>
            )}

            {/* Benefício flags */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-4 w-4 shrink-0" />
              <span className="font-medium text-foreground">Benefícios:</span>
              <span>
                {[
                  dependant.isIrrfDependant && 'IRRF',
                  dependant.isSalarioFamilia && 'Salário Família',
                  dependant.hasDisability && 'PcD',
                ]
                  .filter(Boolean)
                  .join(', ') || 'Nenhum'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground pt-2 border-t">
              <span className="text-xs">
                Cadastrado em {formatDate(dependant.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
