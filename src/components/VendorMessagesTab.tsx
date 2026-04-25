'use client';

import { useState, useEffect, type CSSProperties, type FormEvent } from 'react';
import { Button, TextArea, Badge, IconButton } from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { useToast } from '@/components/ToastProvider';
import { color, font, gap, space, border } from '@/lib/tokens';
import {
  sheetBodyStyle,
  sheetSectionTitle,
} from '@/app/(auth)/settings/_sheetStyles';

// ─── Types ──────────────────────────────────────────────────────────────────

interface VendorMessage {
  id: string;
  sender_type: 'vendor' | 'staff';
  sender_name: string;
  body: string;
  vendor_status: string | null;
  created_at: string;
}

interface VendorMessagesTabProps {
  requestId: string;
  vendorName: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const VENDOR_STATUS_LABELS: Record<string, string> = {
  acknowledged: 'Acknowledged', scheduled: 'Scheduled', in_progress: 'In Progress',
  on_hold: 'On Hold', parts_ordered: 'Parts Ordered', completed: 'Completed',
};

const TOKEN_STATUS_LABELS: Record<string, { label: string; status: 'positive' | 'warning' | 'error' | 'info' }> = {
  active: { label: 'Link Active', status: 'positive' },
  expired: { label: 'Link Expired', status: 'warning' },
  revoked: { label: 'Link Revoked', status: 'error' },
  closed: { label: 'Link Closed', status: 'info' },
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const threadStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.sm,
  marginBottom: space.md,
};

const messageBubbleBase: CSSProperties = {
  padding: space.sm,
  borderRadius: border.radius.md,
  maxWidth: '90%',
};

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.sm,
};

// ─── Component ──────────────────────────────────────────────────────────────

export function VendorMessagesTab({ requestId, vendorName }: VendorMessagesTabProps) {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<VendorMessage[]>([]);
  const [tokenStatus, setTokenStatus] = useState<string | null>(null);
  const [tokenValue, setTokenValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/requests/${requestId}/messages`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
      setTokenStatus(data.token_status);
      setTokenValue(data.token ?? null);
    } catch (err) {
      console.error('[VendorMessagesTab] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to send message');
      }

      const newMessage = await res.json();
      setMessages(prev => [...prev, newMessage]);
      setBody('');
      showToast({ title: 'Message sent to vendor', variant: 'success' });
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

  const handleCopyLink = () => {
    if (!tokenValue) return;
    const siteUrl = window.location.origin;
    navigator.clipboard.writeText(`${siteUrl}/vendor/${tokenValue}`).then(() => {
      showToast({ title: 'Vendor link copied', variant: 'success' });
    }).catch(() => {
      showToast({ title: 'Failed to copy link', variant: 'error' });
    });
  };

  if (loading) {
    return (
      <div style={sheetBodyStyle}>
        <p style={{ color: color.text.muted, fontSize: font.size.body.sm }}>Loading messages...</p>
      </div>
    );
  }

  const tokenInfo = tokenStatus ? TOKEN_STATUS_LABELS[tokenStatus] : null;

  return (
    <div style={sheetBodyStyle}>
      {/* ── Token status + copy link ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
          <h3 style={sheetSectionTitle}>{vendorName ?? 'Vendor'}</h3>
          {tokenInfo && (
            <Badge status={tokenInfo.status} size="sm" appearance="solid">{tokenInfo.label}</Badge>
          )}
        </div>
        {tokenStatus === 'active' && tokenValue && (
          <IconButton
            variant="ghost"
            size="sm"
            icon={<Icon icon={icon.copy} />}
            label="Copy vendor link"
            onClick={handleCopyLink}
          />
        )}
      </div>

      {/* ── Message thread ── */}
      {messages.length === 0 ? (
        <p style={{ color: color.text.muted, fontSize: font.size.body.sm, textAlign: 'center', padding: space.md }}>
          No messages yet.{tokenStatus === 'active' ? ' Send a message to the vendor below.' : ''}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px', gap: gap.sm }}>
                  <span style={{ fontSize: font.size.label.sm, fontFamily: font.family.label, fontWeight: 600, color: color.text.primary }}>
                    {msg.sender_name}
                  </span>
                  <span style={{ fontSize: font.size.body.xs, color: color.text.muted, whiteSpace: 'nowrap' }}>
                    {timestamp}
                  </span>
                </div>
                <div style={{ fontSize: font.size.body.sm, color: color.text.primary, whiteSpace: 'pre-wrap' }}>
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
          })}
        </div>
      )}

      {/* ── Reply form (only if token is active) ── */}
      {tokenStatus === 'active' && (
        <>
          <h3 style={{ ...sheetSectionTitle, marginTop: space.md }}>Send Message to Vendor</h3>
          <form onSubmit={handleSubmit} style={formStyle}>
            <TextArea
              label="Message"
              size="sm"
              placeholder="Type a message to the vendor..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!body.trim() || submitting}
              >
                {submitting ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </form>
        </>
      )}

      {tokenStatus && tokenStatus !== 'active' && messages.length > 0 && (
        <p style={{ color: color.text.muted, fontSize: font.size.body.xs, textAlign: 'center', marginTop: space.md }}>
          The vendor link is {tokenStatus}. No new messages can be sent.
        </p>
      )}
    </div>
  );
}
