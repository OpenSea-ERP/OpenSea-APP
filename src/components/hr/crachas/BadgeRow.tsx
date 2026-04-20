'use client';

/**
 * OpenSea OS - BadgeRow
 *
 * Single-employee row inside the /hr/crachas listing. Composition:
 *   [ selection checkbox ]
 *   [ Avatar 40px ]
 *   [ fullName (Body) + matrícula (Label uppercase) ]
 *   [ rotation Badge chip: Crachá ativo | Rotacionado recentemente | Nunca emitido ]
 *   [ DropdownMenu ] → Gerar crachá (PDF) | Rotacionar QR
 *
 * Rotation chip copy is locked by UI-SPEC §Copywriting §/hr/crachas.
 *
 * Individual rotation is NOT PIN-gated (UI-SPEC §Destructive — single-employee
 * = low blast radius, AlertDialog-only). Bulk rotation in RotateQrBulkDialog
 * is where the VerifyActionPinModal gate lives.
 */

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { BadgeListRow, CrachaRotationStatus } from '@/types/hr';
import {
  IdCard,
  Loader2,
  MoreVertical,
  Printer,
  RefreshCw,
} from 'lucide-react';
import {
  useDownloadBadgePdf,
  useRotateQrToken,
} from '@/app/(dashboard)/hr/crachas/mutations';
import { RotateQrConfirmDialog } from './RotateQrConfirmDialog';

interface RotationChipConfig {
  label: string;
  variant: 'success' | 'warning' | 'secondary';
}

function getRotationChip(status: CrachaRotationStatus): RotationChipConfig {
  // Copy verbatim from UI-SPEC §Copywriting §/hr/crachas.
  switch (status) {
    case 'active':
      return { label: 'Crachá ativo', variant: 'success' };
    case 'recent':
      return { label: 'Rotacionado recentemente', variant: 'warning' };
    case 'never':
      return { label: 'Nunca emitido', variant: 'secondary' };
  }
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

export interface BadgeRowProps {
  row: BadgeListRow;
  /** Selection checkbox state (bulk toolbar). */
  isSelected: boolean;
  onToggleSelect: (employeeId: string) => void;
  /** Optional gate: hide the menu items when the viewer lacks permission. */
  canPrint: boolean;
  canRotate: boolean;
}

export function BadgeRow({
  row,
  isSelected,
  onToggleSelect,
  canPrint,
  canRotate,
}: BadgeRowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const downloadPdf = useDownloadBadgePdf();
  const rotateQr = useRotateQrToken();

  const chip = getRotationChip(row.rotationStatus);

  const handleDownload = () => {
    downloadPdf.mutate({
      employeeId: row.employeeId,
      registration: row.registration,
    });
  };

  const handleConfirmRotate = () => {
    rotateQr.mutate(row.employeeId);
    setConfirmOpen(false);
  };

  const anyActionAvailable = canPrint || canRotate;

  return (
    <>
      <div
        data-testid={`badge-row-${row.employeeId}`}
        className={cn(
          'flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-slate-800/60 border border-border',
          isSelected && 'ring-2 ring-primary'
        )}
      >
        {/* Selection checkbox */}
        <Checkbox
          aria-label={`Selecionar ${row.fullName}`}
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(row.employeeId)}
        />

        {/* Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          {row.photoUrl ? (
            <AvatarImage src={row.photoUrl} alt={row.fullName} />
          ) : null}
          <AvatarFallback>{initialsFor(row.fullName)}</AvatarFallback>
        </Avatar>

        {/* Identity */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium truncate">{row.fullName}</span>
          <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
            {row.registration
              ? `Matrícula ${row.registration}`
              : 'Sem matrícula'}
          </span>
          {row.departmentName ? (
            <span className="text-xs text-muted-foreground truncate">
              {row.departmentName}
            </span>
          ) : null}
        </div>

        {/* Rotation chip */}
        <Badge
          variant={chip.variant}
          className="shrink-0"
          data-testid={`badge-row-chip-${row.employeeId}`}
        >
          <IdCard className="w-3 h-3" />
          {chip.label}
        </Badge>

        {/* Per-row action menu */}
        {anyActionAvailable ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Ações do crachá"
                disabled={downloadPdf.isPending || rotateQr.isPending}
              >
                {downloadPdf.isPending || rotateQr.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MoreVertical className="w-4 h-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canPrint ? (
                <DropdownMenuItem onClick={handleDownload}>
                  <Printer className="w-4 h-4" />
                  Gerar crachá (PDF)
                </DropdownMenuItem>
              ) : null}
              {canRotate ? (
                <DropdownMenuItem onClick={() => setConfirmOpen(true)}>
                  <RefreshCw className="w-4 h-4" />
                  Rotacionar QR
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <RotateQrConfirmDialog
        isOpen={confirmOpen}
        employeeName={row.fullName}
        isRotating={rotateQr.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmRotate}
      />
    </>
  );
}
