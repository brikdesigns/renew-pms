'use client';

import { Sheet } from '@bds/components';
import { Badge, Tag } from '@bds/components';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import {
  sheetBodyStyle,
  sheetSectionTitle,
} from '@/app/(auth)/settings/_sheetStyles';
import type { CSSProperties } from 'react';
import { color, gap } from '@/lib/tokens';
import type { RequestRow } from '@/hooks/useRequests';

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

// ─── Styles ─────────────────────────────────────────────────────────────────

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: gap.lg,
  width: '100%',
};

// ─── Component ──────────────────────────────────────────────────────────────

interface ViewRequestSheetProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestRow | null;
}

export function ViewRequestSheet({ isOpen, onClose, request }: ViewRequestSheetProps) {
  if (!request) return null;

  const statusLabel = STATUS_LABELS[request.status] ?? request.status;
  const statusBadge = STATUS_BADGE[request.status] ?? 'info';
  const priorityLabel = PRIORITY_LABELS[request.urgency] ?? request.urgency;
  const priorityBadge = PRIORITY_BADGE[request.urgency] ?? 'info';
  const categoryLabel = CATEGORY_LABELS[request.category] ?? request.category;

  const createdDate = new Date(request.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={request.title}
      width="600px"
      side="right"
    >
      <div style={sheetBodyStyle}>
        {/* Details */}
        <h3 style={sheetSectionTitle}>Details</h3>
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

        {/* Location & Equipment */}
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

        {/* Assignment */}
        {(request.assignee_name || request.vendor_name) && (
          <>
            <h3 style={sheetSectionTitle}>Assignment</h3>
            <div style={rowStyle}>
              <ReadOnlyField label="Assigned To" value={request.assignee_name} />
              <ReadOnlyField label="Vendor" value={request.vendor_name} />
            </div>
            {request.vendor_contact_name && (
              <div style={rowStyle}>
                <ReadOnlyField label="Vendor Contact" value={request.vendor_contact_name} />
                <ReadOnlyField label="Contact Phone" value={request.vendor_contact_phone} />
              </div>
            )}
          </>
        )}

        {/* Resolution */}
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
    </Sheet>
  );
}
