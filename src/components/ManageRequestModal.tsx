'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { Modal, Button, Radio, Select, TextArea } from '@bds/components';
import { color, font, gap, space } from '@/lib/tokens';
import { useToast } from '@/components/ToastProvider';

// ─── Types ──────────────────────────────────────────────────────────────────

type AssignType = 'internal' | 'vendor';

interface MemberOption { id: string; name: string }
interface VendorOption { id: string; name: string }
interface ContactOption { id: string; name: string }

interface ManageRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requestTitle: string;
  /** Current assignee member ID (pre-fill) */
  currentAssigneeId?: string | null;
  /** Current vendor ID (pre-fill) */
  currentVendorId?: string | null;
  /** Current vendor contact ID (pre-fill) */
  currentVendorContactId?: string | null;
  /** Current resolution notes (pre-fill) */
  currentNotes?: string | null;
  isAdmin: boolean;
  onSaved: () => void;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const fieldGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.lg,
};

const radioGroupStyle: CSSProperties = {
  display: 'flex',
  gap: gap.xl,
};

const sectionLabel: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.md,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
  margin: 0,
};

// ─── Component ──────────────────────────────────────────────────────────────

export function ManageRequestModal({
  isOpen,
  onClose,
  requestId,
  requestTitle,
  currentAssigneeId,
  currentVendorId,
  currentVendorContactId,
  currentNotes,
  isAdmin,
  onSaved,
}: ManageRequestModalProps) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  // Assignment type
  const initialType: AssignType = currentVendorId ? 'vendor' : 'internal';
  const [assignType, setAssignType] = useState<AssignType>(initialType);

  // Internal assignment
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [assigneeId, setAssigneeId] = useState(currentAssigneeId ?? '');

  // Vendor assignment
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [vendorId, setVendorId] = useState(currentVendorId ?? '');
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [contactId, setContactId] = useState(currentVendorContactId ?? '');

  // Notes
  const [notes, setNotes] = useState(currentNotes ?? '');

  // Reset form when modal opens with new data
  useEffect(() => {
    if (!isOpen) return;
    setAssignType(currentVendorId ? 'vendor' : 'internal');
    setAssigneeId(currentAssigneeId ?? '');
    setVendorId(currentVendorId ?? '');
    setContactId(currentVendorContactId ?? '');
    setNotes(currentNotes ?? '');
  }, [isOpen, currentAssigneeId, currentVendorId, currentVendorContactId, currentNotes]);

  // Fetch members for internal assignment
  useEffect(() => {
    if (!isOpen || !isAdmin) return;
    fetch('/api/members')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMembers(data.map((m: { id: string; first_name: string; last_name: string }) => ({
            id: m.id,
            name: `${m.first_name} ${m.last_name}`.trim(),
          })));
        }
      })
      .catch(err => console.error('[ManageRequestModal] members fetch failed:', err));
  }, [isOpen, isAdmin]);

  // Fetch vendors
  useEffect(() => {
    if (!isOpen || !isAdmin) return;
    fetch('/api/vendors')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setVendors(data.filter((v: { is_active: boolean }) => v.is_active).map((v: { id: string; name: string }) => ({
            id: v.id,
            name: v.name,
          })));
        }
      })
      .catch(err => console.error('[ManageRequestModal] vendors fetch failed:', err));
  }, [isOpen, isAdmin]);

  // Fetch contacts when vendor changes
  useEffect(() => {
    if (!vendorId) { setContacts([]); setContactId(''); return; }
    fetch(`/api/vendors/${vendorId}/contacts`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setContacts(data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
        }
      })
      .catch(err => console.error('[ManageRequestModal] contacts fetch failed:', err));
  }, [vendorId]);

  // Clear vendor fields when switching to internal, and vice versa
  const handleTypeChange = (type: AssignType) => {
    setAssignType(type);
    if (type === 'internal') {
      setVendorId('');
      setContactId('');
    } else {
      setAssigneeId('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const updates: Record<string, unknown> = {};

    if (assignType === 'internal') {
      if (assigneeId) updates.assigned_to = assigneeId;
      updates.status = 'in_progress';
      // Clear vendor assignment
      updates.vendor_id = null;
      updates.vendor_contact_id = null;
    } else {
      if (vendorId) updates.vendor_id = vendorId;
      if (contactId) updates.vendor_contact_id = contactId;
      updates.status = 'waiting_on_vendor';
      // Clear internal assignment
      updates.assigned_to = null;
    }

    if (notes !== (currentNotes ?? '')) {
      updates.resolution_notes = notes || null;
    }

    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to update request');
      }

      const statusLabel = assignType === 'internal' ? 'In Progress' : 'Waiting on Vendor';
      showToast({
        title: 'Request updated',
        description: `"${requestTitle}" moved to ${statusLabel}.`,
        variant: 'success',
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update request',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const hasAssignment = assignType === 'internal' ? !!assigneeId : !!vendorId;

  const footer = (
    <>
      <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
      <Button variant="primary" size="md" type="button" onClick={handleSave} disabled={!hasAssignment || saving}>
        {saving ? 'Saving...' : 'Assign & Update'}
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Request" size="sm" footer={footer}>
      <div style={fieldGroupStyle}>
        <p style={sectionLabel}>Assign To</p>
        <div style={radioGroupStyle}>
          <Radio
            name="assign-type"
            value="internal"
            label="Internal Staff"
            checked={assignType === 'internal'}
            onChange={() => handleTypeChange('internal')}
          />
          <Radio
            name="assign-type"
            value="vendor"
            label="Vendor"
            checked={assignType === 'vendor'}
            onChange={() => handleTypeChange('vendor')}
          />
        </div>

        {assignType === 'internal' ? (
          <Select
            label="Staff Member"
            size="sm"
            value={assigneeId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAssigneeId(e.target.value)}
            options={[
              { value: '', label: 'Select a staff member...' },
              ...members.map(m => ({ value: m.id, label: m.name })),
            ]}
          />
        ) : (
          <>
            <Select
              label="Vendor"
              size="sm"
              value={vendorId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setVendorId(e.target.value); setContactId(''); }}
              options={[
                { value: '', label: 'Select a vendor...' },
                ...vendors.map(v => ({ value: v.id, label: v.name })),
              ]}
            />
            {vendorId && (
              <Select
                label="Vendor Contact"
                size="sm"
                value={contactId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setContactId(e.target.value)}
                options={[
                  { value: '', label: 'Select a contact...' },
                  ...contacts.map(c => ({ value: c.id, label: c.name })),
                ]}
              />
            )}
          </>
        )}

        <TextArea
          label="Notes"
          size="sm"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Internal notes about this request..."
          rows={3}
        />
      </div>
    </Modal>
  );
}
