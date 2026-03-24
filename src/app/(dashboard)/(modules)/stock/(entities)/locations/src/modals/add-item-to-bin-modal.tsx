'use client';

import { ItemEntryFormModal } from '@/app/(dashboard)/(modules)/stock/(entities)/products/src/modals/item-entry-form-modal';

interface AddItemToBinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  binId: string;
}

/**
 * Wrapper that opens ItemEntryFormModal with variant search enabled
 * and bin pre-selected. Used from the bin detail drawer.
 */
export function AddItemToBinModal({
  open,
  onOpenChange,
  binId,
}: AddItemToBinModalProps) {
  return (
    <ItemEntryFormModal
      open={open}
      onOpenChange={onOpenChange}
      product={null}
      variant={null}
      initialBinId={binId}
      extraInvalidateKeys={[
        ['bin-detail'],
        ['zone-items'],
        ['warehouse'],
      ]}
    />
  );
}
