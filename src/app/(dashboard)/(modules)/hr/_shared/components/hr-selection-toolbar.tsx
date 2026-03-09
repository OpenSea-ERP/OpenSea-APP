'use client';

import {
  SelectionToolbar,
  useSelectionContext,
  type SelectionAction,
} from '@/core';

interface HRSelectionToolbarProps {
  totalItems: number;
  actions?: SelectionAction[];
  defaultActions?: {
    delete?: boolean;
    export?: boolean;
  };
  handlers?: {
    onDelete?: (ids: string[]) => void;
    onExport?: (ids: string[]) => void;
  };
}

export function HRSelectionToolbar({
  totalItems,
  actions,
  defaultActions,
  handlers,
}: HRSelectionToolbarProps) {
  const { state, actions: selectionActions } = useSelectionContext();
  const selectedIds = Array.from(state.selectedIds);

  if (selectedIds.length === 0) return null;

  return (
    <SelectionToolbar
      selectedIds={selectedIds}
      totalItems={totalItems}
      onClear={() => selectionActions.clear()}
      onSelectAll={() => selectionActions.selectAll()}
      actions={actions}
      defaultActions={defaultActions}
      handlers={handlers}
    />
  );
}
