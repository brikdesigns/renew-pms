'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { Button, TextArea, Select, Tag, Badge } from '@bds/components';
import { useToast } from '@/components/ToastProvider';
import { color, font, gap, space, border } from '@/lib/tokens';
import type { VendorMessage } from '@/lib/vendor-tokens';

// ─── Types ──────────────────────────────────────────────────────────────────

interface VendorResponseClientProps {
  token: string;
  request: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    urgency: string;
    status: string;
    location_description: string | null;
    created_at: string;
  };
  vendor: { name: string };
  vendorContact: { name: string; email: string | null } | null;
  roomName: string | null;
  equipmentName: string | null;
  messages: VendorMessage[];
  expiresAt: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  device_issue: 'Device Issue',
  equipment_issue: 'Equipment Issue',
  facility_maintenance: 'Facility / Maintenance',
};

const URGENCY_MAP: Record<string, { label: string; status: 'positive' | 'warning' | 'error' | 'info' }> = {
  low: { label: 'Low', status: 'positive' },
  medium: { label: 'Medium', status: 'info' },
  high: { label: 'High', status: 'warning' },
  critical: { label: 'Critical', status: 'error' },
};

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted', in_review: 'In Review', in_progress: 'In Progress',
  waiting_on_vendor: 'Waiting on Vendor', resolved: 'Resolved', closed: 'Closed',
};

const VENDOR_STATUS_OPTIONS = [
  { value: '', label: 'No status update' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'parts_ordered', label: 'Parts Ordered' },
  { value: 'completed', label: 'Completed' },
];

const VENDOR_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  VENDOR_STATUS_OPTIONS.filter(o => o.value).map(o => [o.value, o.label])
);

// ─── Styles ─────────────────────────────────────────────────────────────────

const pageStyle: CSSProperties = {
  maxWidth: '640px',
  margin: '0 auto',
  padding: `${space.xl} ${space.lg}`,
  fontFamily: font.family.body,
};

const headerStyle: CSSProperties = {
  marginBottom: space.xl,
  paddingBottom: space.md,
  borderBottom: `1px solid ${color.border.primary}`,
};

const sectionStyle: CSSProperties = {
  marginBottom: space.xl,
};

const sectionTitleStyle: CSSProperties = {
  fontSize: font.size.label.sm,
  fontFamily: font.family.label,
  fontWeight: 600,
  color: color.text.secondary,
  textTransform: font.transform.label,
  marginBottom: space.sm,
  letterSpacing: '0.04em',
};

const fieldRowStyle: CSSProperties = {
  display: 'flex',
  gap: gap.lg,
  marginBottom: space.sm,
};

const fieldStyle: CSSProperties = {
  flex: 1,
};

const fieldLabelStyle: CSSProperties = {
  fontSize: font.size.label.sm,
  fontFamily: font.family.label,
  color: color.text.muted,
  marginBottom: '2px',
};

const fieldValueStyle: CSSProperties = {
  fontSize: font.size.body.md,
  color: color.text.primary,
};

const threadStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.md,
  marginBottom: space.lg,
};

const messageBubbleBase: CSSProperties = {
  padding: space.md,
  borderRadius: border.radius.md,
  maxWidth: '85%',
};

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.md,
};

const expiryStyle: CSSProperties = {
  textAlign: 'center',
  fontSize: font.size.body.xs,
  color: color.text.muted,
  marginTop: space.xl,
  paddingTop: space.md,
  borderTop: `1px solid ${color.border.primary}`,
};

// ─── Component ──────────────────────────────────────────────────────────────

export function VendorResponseClient({
  token,
  request,
  vendor,
  vendorContact,
  roomName,
  equipmentName,
  messages: initialMessages,
  expiresAt,
}: VendorResponseClientProps) {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<VendorMessage[]>(initialMessages);
  const [body, setBody] = useState('');
  const [vendorStatus, setVendorStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isTerminal = request.status === 'resolved' || request.status === 'closed';
  const urgency = URGENCY_MAP[request.urgency] ?? URGENCY_MAP.medium;

  const createdDate = new Date(request.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/vendor/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: body.trim(),
          vendor_status: vendorStatus || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to send message');
      }

      const newMessage = await res.json();
      setMessages(prev => [...prev, newMessage]);
      setBody('');
      setVendorStatus('');
      showToast({ title: 'Message sent', variant: 'success' });
    } catch (err: unknown) {
      showToast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send message',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      const res = await fetch(`/api/vendor/${token}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      // Silently fail — user can try again
    }
  };

  return (
    <div style={pageStyle}>
      {/* ── Header ── */}
      <div style={headerStyle}>
        <p style={{ fontSize: font.size.body.sm, color: color.text.muted, marginBottom: space.xs, fontFamily: font.family.label }}>
          Renew PMS — Vendor Portal
        </p>
        <h1 style={{ fontSize: font.size.heading.small, fontFamily: font.family.heading, fontWeight: 600, margin: 0 }}>
          {request.title}
        </h1>
        {vendorContact && (
          <p style={{ fontSize: font.size.body.sm, color: color.text.secondary, marginTop: space.xs }}>
            {vendorContact.name} — {vendor.name}
          </p>
        )}
      </div>

      {/* ── Request Details ── */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Work Order Details</h2>

        <div style={fieldRowStyle}>
          <div style={fieldStyle}>
            <div style={fieldLabelStyle}>Category</div>
            <Tag size="sm" style={{ display: 'inline-flex' }}>
              {CATEGORY_LABELS[request.category] ?? request.category}
            </Tag>
          </div>
          <div style={fieldStyle}>
            <div style={fieldLabelStyle}>Priority</div>
            <Badge status={urgency.status} size="sm" variant="dark">{urgency.label}</Badge>
          </div>
          <div style={fieldStyle}>
            <div style={fieldLabelStyle}>Status</div>
            <div style={fieldValueStyle}>{STATUS_LABELS[request.status] ?? request.status}</div>
          </div>
        </div>

        {request.description && (
          <div style={{ marginBottom: space.sm }}>
            <div style={fieldLabelStyle}>Description</div>
            <div style={{ ...fieldValueStyle, whiteSpace: 'pre-wrap' }}>{request.description}</div>
          </div>
        )}

        {(roomName || equipmentName || request.location_description) && (
          <div style={fieldRowStyle}>
            {roomName && (
              <div style={fieldStyle}>
                <div style={fieldLabelStyle}>Room</div>
                <div style={fieldValueStyle}>{roomName}</div>
              </div>
            )}
            {equipmentName && (
              <div style={fieldStyle}>
                <div style={fieldLabelStyle}>Equipment</div>
                <div style={fieldValueStyle}>{equipmentName}</div>
              </div>
            )}
            {request.location_description && (
              <div style={fieldStyle}>
                <div style={fieldLabelStyle}>Location</div>
                <div style={fieldValueStyle}>{request.location_description}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: font.size.body.xs, color: color.text.muted }}>
          Submitted {createdDate}
        </div>
      </div>

      {/* ── Message Thread ── */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm }}>
          <h2 style={sectionTitleStyle}>Messages</h2>
          <Button variant="ghost" size="sm" type="button" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>

        {messages.length === 0 ? (
          <p style={{ fontSize: font.size.body.sm, color: color.text.muted, textAlign: 'center', padding: space.lg }}>
            No messages yet. Send the first update below.
          </p>
        ) : (
          <div style={threadStyle}>
            {messages.map(msg => {
              const isVendor = msg.sender_type === 'vendor';
              const bubbleStyle: CSSProperties = {
                ...messageBubbleBase,
                backgroundColor: isVendor ? color.surface.accent : color.surface.secondary,
                alignSelf: isVendor ? 'flex-end' : 'flex-start',
              };
              const timestamp = new Date(msg.created_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              });

              return (
                <div key={msg.id} style={bubbleStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px', gap: gap.md }}>
                    <span style={{ fontSize: font.size.label.sm, fontFamily: font.family.label, fontWeight: 600, color: color.text.primary }}>
                      {msg.sender_name}
                    </span>
                    <span style={{ fontSize: font.size.body.xs, color: color.text.muted, whiteSpace: 'nowrap' }}>
                      {timestamp}
                    </span>
                  </div>
                  <div style={{ fontSize: font.size.body.md, color: color.text.primary, whiteSpace: 'pre-wrap' }}>
                    {msg.body}
                  </div>
                  {msg.vendor_status && (
                    <div style={{ marginTop: space.xs }}>
                      <Badge status="info" size="sm" variant="dark">
                        {VENDOR_STATUS_LABELS[msg.vendor_status] ?? msg.vendor_status}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Response Form ── */}
      {!isTerminal && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Post an Update</h2>
          <form onSubmit={handleSubmit} style={formStyle}>
            <TextArea
              label="Message"
              size="sm"
              placeholder="Share an update, ask a question, or confirm completion..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
            />
            <Select
              label="Status Update (optional)"
              size="sm"
              value={vendorStatus}
              onChange={(e) => setVendorStatus(e.target.value)}
              options={VENDOR_STATUS_OPTIONS}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={!body.trim() || submitting}
              >
                {submitting ? 'Sending...' : 'Send Update'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {isTerminal && (
        <div style={{ textAlign: 'center', padding: space.lg, color: color.text.secondary, fontSize: font.size.body.sm }}>
          This request has been {request.status === 'resolved' ? 'resolved' : 'closed'}. No further updates can be posted.
        </div>
      )}

      {/* ── Expiry ── */}
      <div style={expiryStyle}>
        This link expires on {expiryDate}
      </div>
    </div>
  );
}
