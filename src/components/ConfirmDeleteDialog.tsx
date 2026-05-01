'use client';

import { Dialog } from '@brikdesigns/bds';

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Name of the item being deleted (shown in description) */
  itemName: string;
  /** Type label — e.g. "department", "template", "team" */
  itemType?: string;
}

export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'item',
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete ${itemType}?`}
      description={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      onConfirm={onConfirm}
      variant="destructive"
    />
  );
}
