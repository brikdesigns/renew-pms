'use client';

import { useState, useRef, useEffect, type CSSProperties, type FormEvent } from 'react';
import { Button, TextArea, Select, Tag, Badge } from '@brikdesigns/bds';
import { useToast } from '@/components/ToastProvider';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { rowStyle } from '@/app/(auth)/settings/_shared';
import { color, font, gap, space, border } from '@/lib/tokens';
import { VendorSidebar } from './VendorSidebar';
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

// ─── Layout styles ──────────────────────────────────────────────────────────

const shellStyle: CSSProperties = {
  display: 'flex',
  height: '100dvh',
  overflow: 'hidden',
  fontFamily: font.family.body,
};

const mainAreaStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  overflow: 'hidden',
};

// ─── Left column ────────────────────────────────────────────────────────────

const leftColStyle: CSSProperties = {
  width: '100%',
  maxWidth: '640px',
  flexShrink: 0,
  backgroundColor: color.surface.primary,
  padding: space.xl,
  overflowY: 'auto',
  borderRight: `1px solid ${color.border.muted}`,
};

// ─── Right column ───────────────────────────────────────────────────────────

const rightColStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  backgroundColor: color.surface.secondary,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const threadHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${space.lg} ${space.xl}`,
  borderBottom: `1px solid ${color.border.muted}`,
  flexShrink: 0,
};

const threadBodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: space.xl,
  display: 'flex',
  flexDirection: 'column',
  gap: gap.md,
};

const messageBubbleBase: CSSProperties = {
  padding: space.md,
  borderRadius: border.radius.md,
  maxWidth: '85%',
};

const formAreaStyle: CSSProperties = {
  flexShrink: 0,
  padding: `${space.lg} ${space.xl}`,
  borderTop: `1px solid ${color.border.muted}`,
  display: 'flex',
  flexDirection: 'column',
  gap: gap.lg,
};

// ─── Profile page ───────────────────────────────────────────────────────────

const profilePageStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflowY: 'auto',
  backgroundColor: color.surface.primary,
  padding: space.xl,
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
  const [activeSection, setActiveSection] = useState('work-order');
  const threadEndRef = useRef<HTMLDivElement>(null);

  const isTerminal = request.status === 'resolved' || request.status === 'closed';

  const createdDate = new Date(request.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

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

  const categoryLabel = CATEGORY_LABELS[request.category] ?? request.category;

  return (
    <div style={shellStyle}>
      <VendorSidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        vendorContactName={vendorContact?.name ?? null}
      />

      <div style={mainAreaStyle}>
        {activeSection === 'work-order' ? (
          <>
            {/* ── Left column: request details (mirrors ViewRequestSheet) ── */}
            <div style={leftColStyle}>
              <div style={sheetBodyStyle}>
                <h3 style={sheetSectionTitle}>{request.title}</h3>

                <div style={rowStyle}>
                  <ReadOnlyField label="Submitted" value={createdDate} />
                  <ReadOnlyField label="Vendor" value={vendorContact ? `${vendorContact.name} — ${vendor.name}` : vendor.name} />
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

                {(roomName || equipmentName || request.location_description) && (
                  <>
                    <h3 style={sheetSectionTitle}>Location & Equipment</h3>
                    <div style={rowStyle}>
                      {roomName && <ReadOnlyField label="Room" value={roomName} />}
                      {equipmentName && <ReadOnlyField label="Equipment" value={equipmentName} />}
                    </div>
                    {request.location_description && (
                      <ReadOnlyField label="Location Details" value={request.location_description} />
                    )}
                  </>
                )}

                <p style={{ fontSize: font.size.body.xs, color: color.text.muted, margin: 0 }}>
                  This vendor link expires on {expiryDate}
                </p>
              </div>
            </div>

            {/* ── Right column: message thread ── */}
            <div style={rightColStyle}>
              <div style={threadHeaderStyle}>
                <h3 style={{ ...sheetSectionTitle, margin: 0 }}>Messages</h3>
                <Button variant="ghost" size="sm" type="button" onClick={handleRefresh}>
                  Refresh
                </Button>
              </div>

              <div style={threadBodyStyle}>
                {messages.length === 0 ? (
                  <p style={{ fontSize: font.size.body.sm, color: color.text.secondary, textAlign: 'center', padding: space.xl }}>
                    No messages yet. Send the first update below.
                  </p>
                ) : (
                  messages.map(msg => {
                    const isVendor = msg.sender_type === 'vendor';
                    const bubbleStyle: CSSProperties = {
                      ...messageBubbleBase,
                      backgroundColor: isVendor ? color.surface.accent : color.surface.primary,
                      alignSelf: isVendor ? 'flex-end' : 'flex-start',
                    };
                    const timestamp = new Date(msg.created_at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                    });

                    return (
                      <div key={msg.id} style={bubbleStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space.xs, gap: gap.md }}>
                          <span style={{ fontSize: font.size.label.sm, fontFamily: font.family.label, fontWeight: font.weight.semibold, color: color.text.primary }}>
                            {msg.sender_name}
                          </span>
                          <span style={{ fontSize: font.size.body.xs, color: color.text.secondary, whiteSpace: 'nowrap' }}>
                            {timestamp}
                          </span>
                        </div>
                        <div style={{ fontSize: font.size.body.md, fontFamily: font.family.body, color: color.text.secondary, whiteSpace: 'pre-wrap' }}>
                          {msg.body}
                        </div>
                        {msg.vendor_status && (
                          <div style={{ marginTop: space.xs }}>
                            <Badge status="info" size="sm" appearance="solid">
                              {VENDOR_STATUS_LABELS[msg.vendor_status] ?? msg.vendor_status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={threadEndRef} />
              </div>

              {/* Reply form */}
              {!isTerminal ? (
                <form onSubmit={handleSubmit} style={formAreaStyle}>
                  <TextArea
                    label="Post an Update"
                    size="sm"
                    placeholder="Share an update, ask a question, or confirm completion..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                  />
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: gap.lg }}>
                    <div style={{ flex: 1 }}>
                      <Select
                        label="Status Update (optional)"
                        size="sm"
                        value={vendorStatus}
                        onChange={(e) => setVendorStatus(e.target.value)}
                        options={VENDOR_STATUS_OPTIONS}
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      type="submit"
                      disabled={!body.trim() || submitting}
                    >
                      {submitting ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div style={{ padding: `${space.lg} ${space.xl}`, borderTop: `1px solid ${color.border.muted}`, textAlign: 'center', color: color.text.secondary, fontSize: font.size.body.sm }}>
                  This request has been {request.status === 'resolved' ? 'resolved' : 'closed'}. No further updates can be posted.
                </div>
              )}
            </div>
          </>
        ) : (
          /* ── Profile section ── */
          <div style={profilePageStyle}>
            <div style={sheetBodyStyle}>
              <h3 style={sheetSectionTitle}>Profile</h3>

              <h3 style={sheetSectionTitle}>Contact</h3>
              <div style={rowStyle}>
                <ReadOnlyField label="Name" value={vendorContact?.name} />
                <ReadOnlyField label="Email" value={vendorContact?.email} />
              </div>

              <h3 style={sheetSectionTitle}>Company</h3>
              <div style={rowStyle}>
                <ReadOnlyField label="Company Name" value={vendor.name} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
