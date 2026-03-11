import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EntityForm } from '@/core';
import type { Company } from '@/types/hr';
import { Building2, X } from 'lucide-react';
import { companiesConfig } from '../config/companies.config';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (data: Partial<Company>) => Promise<void>;
  initialData?: Partial<Company>;
}

export function CreateModal({
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
  initialData,
}: CreateModalProps) {
  const defaultData: Partial<Company> = {
    status: 'ACTIVE',
    ...initialData,
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-4 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex-col flex">Nova Empresa</div>
            </div>
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <EntityForm
          config={companiesConfig.form! as never}
          mode="create"
          initialData={defaultData}
          onSubmit={async data => {
            await onSubmit(data as Record<string, unknown> as Partial<Company>);
            onClose();
          }}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
