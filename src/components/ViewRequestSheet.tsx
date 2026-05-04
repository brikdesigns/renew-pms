'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { Tag, Button, Dialog, ActivityTimeline, useConfigureSheet, Field, FieldGrid } from '@brikdesigns/bds';
import { StatusBadge, statusLabel } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import type { SheetTab } from '@brikdesigns/bds';
import { SheetSkeleton } from '@/components/SheetSkeleton';
import { ManageRequestModal } from '@/components/ManageRequestModal';
import { ResolveRequestModal } from '@/components/ResolveRequestModal';
import { VendorMessagesTab } from '@/components/VendorMessagesTab';
import {
  sheetBodyStyle,
  sheetSectionTitle,
} from '@/app/(auth)/settings/_sheetStyles';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { color, gap } from '@/lib/tokens';
import type { RequestRow } from '@/hooks/useRequests';
import { useToast } from '@/components/ToastProvider';

// ─── Display maps ───────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  device_issue: 'Device Issue',
  equipment_issue: 'Equipment Issue',
  facility_maintenance: 'Facility / Maintenance',
};

// ─── Component ──────────────────────────────────────────────────────────────

interface ViewRequestSheetProps {
  onClose: () => void;
  /** Full request data (page-level mode — skips fetch) */
  request?: RequestRow | null;
  /** Request ID (global mode — fetches data) */
  id?: string;
  isAdmin?: boolean;
  /** Current user's practice_members.id — for assignee detection */
  currentMemberId?: string;
  onUpdated?: () => void;
  /** Navigate to a related entity (global sheet stack) */
  onNavigate?: (type: string, props: Record<string, unknown>, opts?: { title?: string }) => void;
}

export function ViewRequestSheet({ onClose, request: requestProp, id, isAdmin = false, currentMemberId, onUpdated, onNavigate }: ViewRequestSheetProps) {
  const configureSheet = useConfigureSheet();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [fetched, setFetched] = useState<RequestRow | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);

  // Global mode: fetch by ID when no data prop is given
  const resolvedId = id ?? requestProp?.id;
  const refetch = () => {
    if (!resolvedId) return;
    fetch(`/api/requests/${resolvedId}`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setFetched(data); })
      .catch(err => console.error('[ViewRequestSheet] refetch failed:', err));
  };

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

  // Reset tab when request changes (id is the identity for "different request")
  useEffect(() => {
    if (request?.id) setActiveTab('details');
  }, [request?.id]);

  const handleReject = async () => {
    if (!request) return;
    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to reject request');
      }
      showToast({ title: 'Request rejected', description: `"${request.title}" has been closed.`, variant: 'success' });
      onUpdated?.();
      onClose();
    } catch (err: unknown) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to reject', variant: 'error' });
    } finally {
      setRejectOpen(false);
    }
  };

  const handleManageSaved = () => {
    refetch();
    onUpdated?.();
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
        <FieldGrid columns={2} gap="lg">
          <Field label="Submitted By" empty="—">
            {onNavigate && request.submitter_id ? (
              <button type="button" className="bds-sheet__nav-link" onClick={() => { if (request.submitter_id) onNavigate('user', { id: request.submitter_id }, { title: request.submitter_name ?? 'User' }); }}>
                {request.submitter_name}
              </button>
            ) : request.submitter_name}
          </Field>
          <Field label="Submitted" empty="—">{createdDate}</Field>
        </FieldGrid>
        {request.assignee_name && (
          <Field label="Assigned To" empty="—">
            {onNavigate && request.assignee_id ? (
              <button type="button" className="bds-sheet__nav-link" onClick={() => { if (request.assignee_id) onNavigate('user', { id: request.assignee_id }, { title: request.assignee_name ?? 'User' }); }}>
                {request.assignee_name}
              </button>
            ) : request.assignee_name}
          </Field>
        )}
        <Field label="Category" empty="—">
          <Tag size="sm" style={{ backgroundColor: color.surface.secondary, color: color.text.secondary }}>
            {categoryLabel}
          </Tag>
        </Field>
        <FieldGrid columns={2} gap="lg">
          <Field label="Priority" empty="—"><PriorityBadge priority={request.urgency} /></Field>
          <Field label="Status" empty="—"><StatusBadge status={request.status} /></Field>
        </FieldGrid>
        {request.description && (
          <Field label="Description" empty="—">{request.description}</Field>
        )}

        {(request.room_name || request.equipment_name || request.location_description) && (
          <>
            <h3 style={sheetSectionTitle}>Location & Equipment</h3>
            <FieldGrid columns={2} gap="lg">
              <Field label="Room" empty="—">
                {onNavigate && request.room_id ? (
                  <button type="button" className="bds-sheet__nav-link" onClick={() => { if (request.room_id) onNavigate('room', { id: request.room_id }, { title: request.room_name ?? 'Room' }); }}>
                    {request.room_name}
                  </button>
                ) : request.room_name}
              </Field>
              <Field label="Equipment" empty="—">
                {onNavigate && request.equipment_id ? (
                  <button type="button" className="bds-sheet__nav-link" onClick={() => { if (request.equipment_id) onNavigate('inventory', { id: request.equipment_id }, { title: request.equipment_name ?? 'Equipment' }); }}>
                    {request.equipment_name}
                  </button>
                ) : request.equipment_name}
              </Field>
            </FieldGrid>
            {request.equipment_id && request.equipment_request_count != null && (
              <Field label="Past Requests" empty="—">
                {request.equipment_request_count === 0
                  ? 'None'
                  : `${request.equipment_request_count} past ${request.equipment_request_count === 1 ? 'request' : 'requests'}`}
              </Field>
            )}
            {request.location_description && (
              <Field label="Location Details" empty="—">{request.location_description}</Field>
            )}
          </>
        )}

        {request.vendor_name && (
          <>
            <h3 style={sheetSectionTitle}>Vendor</h3>
            <FieldGrid columns={2} gap="lg">
              <Field label="Vendor" empty="—">
                {onNavigate && request.vendor_id ? (
                  <button type="button" className="bds-sheet__nav-link" onClick={() => { if (request.vendor_id) onNavigate('vendor', { id: request.vendor_id }, { title: request.vendor_name ?? 'Vendor' }); }}>
                    {request.vendor_name}
                  </button>
                ) : request.vendor_name}
              </Field>
              <Field label="Contact" empty="—">
                {onNavigate && request.vendor_contact_id ? (
                  <button type="button" className="bds-sheet__nav-link" onClick={() => { if (request.vendor_contact_id) onNavigate('contact', { id: request.vendor_contact_id }, { title: request.vendor_contact_name ?? 'Contact' }); }}>
                    {request.vendor_contact_name}
                  </button>
                ) : request.vendor_contact_name}
              </Field>
            </FieldGrid>
          </>
        )}
      </div>
    );

    // ── Activity tab ──
    const formatTimestamp = (ts: string) =>
      new Date(ts).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
      });

    const timelineEvents: import('@brikdesigns/bds').TimelineEvent[] = [];
    timelineEvents.push({
      icon: <Icon icon={icon.plus} />,
      label: 'Request submitted',
      detail: request.submitter_name ? `by ${request.submitter_name}` : null,
      timestamp: formatTimestamp(request.created_at),
      isOrigin: true,
    });
    if (request.assignee_name) {
      timelineEvents.push({
        icon: <Icon icon={icon.profile} />,
        label: 'Assigned',
        detail: `to ${request.assignee_name}`,
        timestamp: formatTimestamp(request.updated_at),
      });
    }
    if (request.status !== 'submitted') {
      timelineEvents.push({
        icon: <Icon icon={icon.circleCheck} />,
        label: `Status changed to ${statusLabel(request.status)}`,
        timestamp: formatTimestamp(request.updated_at),
      });
    }
    if (request.resolved_at) {
      timelineEvents.push({
        icon: <Icon icon={icon.circleCheck} />,
        label: 'Resolved',
        detail: request.resolution_notes ?? undefined,
        timestamp: formatTimestamp(request.resolved_at),
      });
    }

    const activityContent = (
      <div style={sheetBodyStyle}>
        <h3 style={sheetSectionTitle}>Activity Timeline</h3>
        <ActivityTimeline events={timelineEvents} />
      </div>
    );

    // ── Configure Sheet ──
    const sheetTabs: SheetTab[] = [
      { id: 'details', label: 'Details', content: detailsContent },
      { id: 'activity', label: 'Activity', content: activityContent },
    ];

    if (request.vendor_id) {
      sheetTabs.push({
        id: 'vendor',
        label: 'Vendor',
        content: <VendorMessagesTab requestId={request.id} vendorName={request.vendor_name} />,
      });
    }

    const isTerminal = request.status === 'resolved' || request.status === 'closed';
    const isAssignee = !!currentMemberId && request.assignee_id === currentMemberId;

    const canAct = !isTerminal && (isAdmin || isAssignee);
    const isSubmitted = request.status === 'submitted';

    const footerContent = canAct ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, justifyContent: 'flex-end', width: '100%' }}>
        <Button variant="secondary" size="md" type="button" onClick={() => setRejectOpen(true)}>
          Reject
        </Button>
        <div style={{ flex: 1 }} />
        {isSubmitted && (
          <Button variant="ghost" size="md" type="button" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button variant={isSubmitted ? 'primary' : 'secondary'} size="md" type="button" onClick={() => setManageOpen(true)}>
          {isSubmitted ? 'Assign' : 'Reassign'}
        </Button>
        {!isSubmitted && (
          <Button variant="primary" size="md" type="button" onClick={() => setResolveOpen(true)}>
            Resolve
          </Button>
        )}
      </div>
    ) : (
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>
      </div>
    );

    configureSheet({
      title: request.title,
      tabs: sheetTabs,
      activeTab,
      onTabChange: setActiveTab,
      footer: footerContent,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configureSheet, fetchLoading, request?.id, request?.status, activeTab, isAdmin, currentMemberId, onClose]);

  return (
    <>
      {request && (
        <ManageRequestModal
          isOpen={manageOpen}
          onClose={() => setManageOpen(false)}
          requestId={request.id}
          requestTitle={request.title}
          currentAssigneeId={request.assignee_id}
          currentVendorId={request.vendor_id}
          currentVendorContactId={request.vendor_contact_id}
          currentNotes={request.resolution_notes}
          isAdmin={isAdmin}
          onSaved={handleManageSaved}
        />
      )}
      {request && (
        <ResolveRequestModal
          isOpen={resolveOpen}
          onClose={() => setResolveOpen(false)}
          requestId={request.id}
          requestTitle={request.title}
          currentNotes={request.resolution_notes}
          onSaved={handleManageSaved}
        />
      )}
      <Dialog
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject request?"
        description={`Are you sure you want to reject "${request?.title ?? 'this request'}"? This will close the request.`}
        confirmLabel="Reject"
        cancelLabel="Cancel"
        onConfirm={handleReject}
        variant="destructive"
      />
    </>
  );
}
