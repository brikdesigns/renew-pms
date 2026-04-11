'use client';

import { useState, useEffect, useLayoutEffect, type FormEvent, type CSSProperties } from 'react';
import { Tag, Button, Select, TextArea, useConfigureSheet } from '@bds/components';
import { StatusBadge, statusLabel } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import type { SheetTab } from '@bds/components';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { SheetSkeleton } from '@/components/SheetSkeleton';
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
  onClose: () => void;
  /** Full request data (page-level mode — skips fetch) */
  request?: RequestRow | null;
  /** Request ID (global mode — fetches data) */
  id?: string;
  isAdmin?: boolean;
  onUpdated?: () => void;
  /** Open this request in edit mode */
  onEdit?: (request: RequestRow) => void;
  /** Navigate to a related entity (global sheet stack) */
  onNavigate?: (type: string, props: Record<string, unknown>, opts?: { title?: string }) => void;
}

export function ViewRequestSheet({ onClose, request: requestProp, id, isAdmin = false, onUpdated, onEdit, onNavigate }: ViewRequestSheetProps) {
  const configureSheet = useConfigureSheet();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [status, setStatus] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [fetched, setFetched] = useState<RequestRow | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Global mode: fetch by ID when no data prop is given
  const resolvedId = id ?? requestProp?.id;
  useEffect(() => {
    if (requestProp || !resolvedId) return;
    setFetchLoading(true);
    fetch(`/api/requests/${resolvedId}`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setFetched(data); })
      .catch(err => console.error('[ViewRequestSheet] fetch failed:', err))
      .finally(() => setFetchLoading(false));
  }, [resolvedId, requestProp]);

  const request = requestProp ?? fetched;

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
    if (!isAdmin) return;
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
  }, [isAdmin]);

  const hasChanges = request ? (dirty || status !== request.status || assignedTo !== (request.assignee_id ?? '') || resolutionNotes !== (request.resolution_notes ?? '')) : false;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!request || !hasChanges) return;
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
      onUpdated?.();
      onClose();
    } catch (err: unknown) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────

  useLayoutEffect(() => {
    if (fetchLoading || !request) {
      configureSheet({
        body: <SheetSkeleton />,
        footer: <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>,
      });
      return;
    }

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
            <PriorityBadge priority={request.urgency} />
          } />
          <ReadOnlyField label="Status" value={
            <StatusBadge status={request.status} />
          } />
        </div>
        {request.description && (
          <ReadOnlyField label="Description" value={request.description} />
        )}

        {(request.room_name || request.equipment_name || request.location_description) && (
          <>
            <h3 style={sheetSectionTitle}>Location & Equipment</h3>
            <div style={rowStyle}>
              <ReadOnlyField label="Room" value={
                onNavigate && request.room_id ? (
                  <button type="button" className="bds-sheet__nav-link" onClick={() => { if (request.room_id) onNavigate('room', { id: request.room_id }, { title: request.room_name ?? 'Room' }); }}>
                    {request.room_name}
                  </button>
                ) : request.room_name
              } />
              <ReadOnlyField label="Equipment" value={
                onNavigate && request.equipment_id ? (
                  <button type="button" className="bds-sheet__nav-link" onClick={() => { if (request.equipment_id) onNavigate('inventory', { id: request.equipment_id }, { title: request.equipment_name ?? 'Equipment' }); }}>
                    {request.equipment_name}
                  </button>
                ) : request.equipment_name
              } />
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
              <ReadOnlyField label="Vendor" value={
                onNavigate && request.vendor_id ? (
                  <button type="button" className="bds-sheet__nav-link" onClick={() => { if (request.vendor_id) onNavigate('vendor', { id: request.vendor_id }, { title: request.vendor_name ?? 'Vendor' }); }}>
                    {request.vendor_name}
                  </button>
                ) : request.vendor_name
              } />
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
        <h3 style={sheetSectionTitle}>Status & Assignment</h3>
        <ReadOnlyField label="Status" value={
          <StatusBadge status={request.status} />
        } />
        <ReadOnlyField label="Assigned To" value={request.assignee_name ?? 'Not yet assigned'} />
        <h3 style={sheetSectionTitle}>Resolution</h3>
        {request.resolution_notes ? (
          <ReadOnlyField label="Resolution Notes" value={request.resolution_notes} />
        ) : (
          <ReadOnlyField label="Resolution Notes" value="No resolution notes yet" />
        )}
        {request.resolved_at && (
          <ReadOnlyField label="Resolved At" value={new Date(request.resolved_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
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
    timelineEvents.push({
      icon: icon.plus,
      label: 'Request submitted',
      detail: request.submitter_name ? `by ${request.submitter_name}` : null,
      timestamp: formatTimestamp(request.created_at),
    });
    if (request.assignee_name) {
      timelineEvents.push({
        icon: icon.profile,
        label: 'Assigned',
        detail: `to ${request.assignee_name}`,
        timestamp: formatTimestamp(request.updated_at),
      });
    }
    if (request.status !== 'submitted') {
      timelineEvents.push({
        icon: icon.circleCheck,
        label: `Status changed to ${statusLabel(request.status)}`,
        detail: null,
        timestamp: formatTimestamp(request.updated_at),
      });
    }
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
                        fontSize: font.size.body.sm,
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

    // ── Configure Sheet ──
    const sheetTabs: SheetTab[] = [
      { id: 'details', label: 'Details', content: detailsContent },
      { id: 'manage', label: 'Manage', content: manageContent },
      { id: 'activity', label: 'Activity', content: activityContent },
    ];

    const footerContent = isAdmin && activeTab === 'manage' ? (
      <>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="manage-request-form" disabled={!hasChanges || saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </>
    ) : activeTab === 'details' && onEdit ? (
      <>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>
        <Button variant="outline" size="md" type="button" onClick={() => onEdit(request)}>
          <Icon icon={icon.edit} style={{ marginRight: gap.xs } as React.CSSProperties} />
          Edit Request
        </Button>
      </>
    ) : (
      <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>
    );

    configureSheet({
      title: request.title,
      tabs: sheetTabs,
      activeTab,
      onTabChange: setActiveTab,
      footer: footerContent,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configureSheet, fetchLoading, request?.id, request?.status, activeTab, status, assignedTo, resolutionNotes, saving, members.length, isAdmin, onClose]);

  return null;
}
