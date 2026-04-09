'use client';

import { useState, useEffect, type FormEvent, type CSSProperties } from 'react';
import { Sheet, Badge, Tag, Button, Select, TextArea } from '@bds/components';
import type { SheetTab } from '@bds/components';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import {
  sheetBodyStyle,
  sheetSectionTitle,
} from '@/app/(auth)/settings/_sheetStyles';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { color, gap, space, font, border } from '@/lib/tokens';
import type { RequestRow } from '@/hooks/useRequests';
import { useToast } from '@/components/ToastProvider';

// ─── Display maps ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  in_review: 'In Review',
  in_progress: 'In Progress',
  waiting_on_vendor: 'Waiting on Vendor',
  resolved: 'Resolved',
  closed: 'Closed',
};

const STATUS_BADGE: Record<string, 'info' | 'warning' | 'positive' | 'error'> = {
  submitted: 'info',
  in_review: 'warning',
  in_progress: 'warning',
  waiting_on_vendor: 'info',
  resolved: 'positive',
  closed: 'positive',
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
};

const PRIORITY_BADGE: Record<string, 'error' | 'warning' | 'info'> = {
  critical: 'error', high: 'error', medium: 'warning', low: 'info',
};

const CATEGORY_LABELS: Record<string, string> = {
  device_issue: 'Device Issue',
  equipment_issue: 'Equipment Issue',
  facility_maintenance: 'Facility / Maintenance',
};

const STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'In Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_on_vendor', label: 'Waiting on Vendor' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

// ─── Styles ─────────────────────────────────────────────────────────────────

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: gap.lg,
  width: '100%',
};

// ─── Component ──────────────────────────────────────────────────────────────

interface MemberOption {
  id: string;
  name: string;
}

interface ViewRequestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestRow | null;
  isAdmin: boolean;
  onUpdated: () => void;
}

export function ViewRequestSheet({ isOpen, onClose, request, isAdmin, onUpdated }: ViewRequestSheetProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Reset form state when request changes
  useEffect(() => {
    if (request) {
      setStatus(request.status);
      setAssignedTo(request.assignee_id ?? '');
      setResolutionNotes(request.resolution_notes ?? '');
      setDirty(false);
      setActiveTab('details');
    }
  }, [request]);

  // Fetch practice members for assignment dropdown
  useEffect(() => {
    if (!isAdmin || !isOpen) return;
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
      .catch(err => console.error('[ViewRequestSheet] failed to load members:', err));
  }, [isAdmin, isOpen]);

  if (!request) return null;

  const hasChanges = dirty || status !== request.status || assignedTo !== (request.assignee_id ?? '') || resolutionNotes !== (request.resolution_notes ?? '');

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;
    setSaving(true);

    const updates: Record<string, unknown> = {};
    if (status !== request.status) updates.status = status;
    if (assignedTo !== (request.assignee_id ?? '')) updates.assigned_to = assignedTo || null;
    if (resolutionNotes !== (request.resolution_notes ?? '')) updates.resolution_notes = resolutionNotes || null;

    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to update request');
      }

      showToast({ title: 'Request updated', description: `${request.title} has been updated.`, variant: 'success' });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = STATUS_LABELS[request.status] ?? request.status;
  const statusBadge = STATUS_BADGE[request.status] ?? 'info';
  const priorityLabel = PRIORITY_LABELS[request.urgency] ?? request.urgency;
  const priorityBadge = PRIORITY_BADGE[request.urgency] ?? 'info';
  const categoryLabel = CATEGORY_LABELS[request.category] ?? request.category;

  const createdDate = new Date(request.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  // ── Details tab ──

  const detailsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Request Details</h3>
      <div style={rowStyle}>
        <ReadOnlyField label="Submitted By" value={request.submitter_name} />
        <ReadOnlyField label="Submitted" value={createdDate} />
      </div>
      <ReadOnlyField label="Category" value={
        <Tag size="sm" style={{ backgroundColor: color.surface.secondary, color: color.text.secondary, display: 'inline-flex' }}>
          {categoryLabel}
        </Tag>
      } />
      <div style={rowStyle}>
        <ReadOnlyField label="Priority" value={
          <Badge status={priorityBadge} size="sm" style={{ display: 'inline-flex' }}>{priorityLabel}</Badge>
        } />
        <ReadOnlyField label="Status" value={
          <Badge status={statusBadge} size="sm" style={{ display: 'inline-flex' }}>{statusLabel}</Badge>
        } />
      </div>
      {request.description && (
        <ReadOnlyField label="Description" value={request.description} />
      )}

      {(request.room_name || request.equipment_name || request.location_description) && (
        <>
          <h3 style={sheetSectionTitle}>Location & Equipment</h3>
          <div style={rowStyle}>
            <ReadOnlyField label="Room" value={request.room_name} />
            <ReadOnlyField label="Equipment" value={request.equipment_name} />
          </div>
          {request.location_description && (
            <ReadOnlyField label="Location Details" value={request.location_description} />
          )}
        </>
      )}

      {request.vendor_name && (
        <>
          <h3 style={sheetSectionTitle}>Vendor</h3>
          <div style={rowStyle}>
            <ReadOnlyField label="Vendor" value={request.vendor_name} />
            <ReadOnlyField label="Contact" value={request.vendor_contact_name} />
          </div>
        </>
      )}
    </div>
  );

  // ── Manage tab ──

  const manageContent = isAdmin ? (
    <form id="manage-request-form" onSubmit={handleSave}>
      <div style={sheetBodyStyle}>
        <h3 style={sheetSectionTitle}>Status & Assignment</h3>
        <Select
          label="Status"
          size="sm"
          value={status}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setStatus(e.target.value); setDirty(true); }}
          options={STATUS_OPTIONS}
        />
        <Select
          label="Assign To"
          size="sm"
          value={assignedTo}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setAssignedTo(e.target.value); setDirty(true); }}
          options={[
            { value: '', label: 'Unassigned' },
            ...members.map(m => ({ value: m.id, label: m.name })),
          ]}
        />
        <h3 style={sheetSectionTitle}>Resolution</h3>
        <TextArea
          label="Resolution Notes"
          size="sm"
          value={resolutionNotes}
          onChange={e => { setResolutionNotes(e.target.value); setDirty(true); }}
          placeholder="How was this resolved?"
          rows={3}
        />
      </div>
    </form>
  ) : (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Status</h3>
      <ReadOnlyField label="Status" value={
        <Badge status={statusBadge} size="sm" style={{ display: 'inline-flex' }}>{statusLabel}</Badge>
      } />
      {request.assignee_name && (
        <ReadOnlyField label="Assigned To" value={request.assignee_name} />
      )}
      {(request.resolution_notes || request.resolved_at) && (
        <>
          <h3 style={sheetSectionTitle}>Resolution</h3>
          {request.resolution_notes && (
            <ReadOnlyField label="Resolution Notes" value={request.resolution_notes} />
          )}
          {request.resolved_at && (
            <ReadOnlyField label="Resolved At" value={new Date(request.resolved_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
          )}
        </>
      )}
    </div>
  );

  // ── Activity tab ──

  const formatTimestamp = (ts: string) =>
    new Date(ts).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });

  interface TimelineEvent {
    icon: string;
    label: string;
    detail: string | null;
    timestamp: string;
  }

  const timelineEvents: TimelineEvent[] = [];

  // Created
  timelineEvents.push({
    icon: icon.plus,
    label: 'Request submitted',
    detail: request.submitter_name ? `by ${request.submitter_name}` : null,
    timestamp: formatTimestamp(request.created_at),
  });

  // Assigned
  if (request.assignee_name) {
    timelineEvents.push({
      icon: icon.profile,
      label: 'Assigned',
      detail: `to ${request.assignee_name}`,
      timestamp: formatTimestamp(request.updated_at),
    });
  }

  // Status milestones (only if moved beyond submitted)
  if (request.status !== 'submitted') {
    timelineEvents.push({
      icon: icon.circleCheck,
      label: `Status changed to ${STATUS_LABELS[request.status] ?? request.status}`,
      detail: null,
      timestamp: formatTimestamp(request.updated_at),
    });
  }

  // Resolved
  if (request.resolved_at) {
    timelineEvents.push({
      icon: icon.circleCheck,
      label: 'Resolved',
      detail: request.resolution_notes ? request.resolution_notes : null,
      timestamp: formatTimestamp(request.resolved_at),
    });
  }

  const activityContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Activity Timeline</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {timelineEvents.map((event, idx) => {
          const isLast = idx === timelineEvents.length - 1;
          return (
            <div key={idx} style={{ display: 'flex', gap: gap.md }}>
              {/* Vertical line + dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: border.radius.pill,
                  backgroundColor: idx === 0 ? color.background.brandPrimary : color.surface.secondary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon
                    icon={event.icon}
                    style={{
                      fontSize: '14px',
                      color: idx === 0 ? color.text.onColorDark : color.text.secondary,
                    } as CSSProperties & Record<string, string>}
                  />
                </div>
                {!isLast && (
                  <div style={{
                    width: 2, flex: 1, minHeight: 20,
                    backgroundColor: color.border.muted,
                  }} />
                )}
              </div>
              {/* Content */}
              <div style={{ paddingBottom: isLast ? 0 : space.lg, paddingTop: space.tiny }}>
                <div style={{
                  fontFamily: font.family.label,
                  fontSize: font.size.label.sm,
                  fontWeight: font.weight.semibold,
                  color: color.text.primary,
                  lineHeight: font.lineHeight.tight,
                }}>
                  {event.label}
                </div>
                {event.detail && (
                  <div style={{
                    fontFamily: font.family.body,
                    fontSize: font.size.body.xs,
                    color: color.text.secondary,
                    marginTop: '2px',
                  }}>
                    {event.detail}
                  </div>
                )}
                <div style={{
                  fontFamily: font.family.body,
                  fontSize: font.size.body.xs,
                  color: color.text.muted,
                  marginTop: '2px',
                }}>
                  {event.timestamp}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Tabs ──

  const sheetTabs: SheetTab[] = [
    { id: 'details', label: 'Details', content: detailsContent },
    { id: 'manage', label: 'Manage', content: manageContent },
    { id: 'activity', label: 'Activity', content: activityContent },
  ];

  // ── Footer ──

  const footerContent = isAdmin && activeTab === 'manage' ? (
    <>
      <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
      <Button variant="primary" size="md" type="submit" form="manage-request-form" disabled={!hasChanges || saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </>
  ) : (
    <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>
  );

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={request.title}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={footerContent}
    />
  );
}
