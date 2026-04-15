'use client';

import { useState } from 'react';
import { Modal, Button, TextArea } from '@brikdesigns/bds';
import { useToast } from '@/components/ToastProvider';

interface ResolveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requestTitle: string;
  currentNotes?: string | null;
  onSaved: () => void;
}

export function ResolveRequestModal({
  isOpen,
  onClose,
  requestId,
  requestTitle,
  currentNotes,
  onSaved,
}: ResolveRequestModalProps) {
  const { showToast } = useToast();
  const [notes, setNotes] = useState(currentNotes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          resolution_notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to resolve request');
      }

      showToast({
        title: 'Request resolved',
        description: `"${requestTitle}" has been resolved.`,
        variant: 'success',
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to resolve request',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
      <Button variant="primary" size="md" type="button" onClick={handleSave} disabled={saving}>
        {saving ? 'Resolving...' : 'Resolve Request'}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resolve Request" size="sm" footer={footer}>
      <TextArea
        label="Resolution Notes"
        size="sm"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Describe how this was resolved..."
        rows={4}
      />
    </Modal>
  );
}
