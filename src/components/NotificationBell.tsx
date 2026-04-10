'use client';

import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { IconButton } from '@bds/components';
import { useSheetStack } from '@bds/components';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { color, font, gap, space, border, shadow } from '@/lib/tokens';
import type { SheetType } from '@/lib/sheet-registry';

// ─── Notification link → sheet mapping ─────────────────────────────────────

function parseNotificationLink(link: string | null): { type: SheetType; props: { id: string }; title?: string } | null {
  if (!link) return null;
  try {
    const url = new URL(link, 'http://localhost');
    const openId = url.searchParams.get('open');
    if (!openId) return null;
    const path = url.pathname;
    if (path === '/requests') return { type: 'request', props: { id: openId } };
    if (path === '/tasks') return { type: 'task', props: { id: openId } };
    return null;
  } catch {
    return null;
  }
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { position: 'relative' };

const unreadDotStyle: CSSProperties = {
  position: 'absolute', top: '6px', right: '6px',
  width: '8px', height: '8px', borderRadius: border.radius.circle,
  backgroundColor: color.system.error,
  pointerEvents: 'none',
};

const dropdownStyle: CSSProperties = {
  position: 'absolute', top: '100%', right: 0, marginTop: '4px',
  width: '360px', maxHeight: '480px', overflowY: 'auto',
  backgroundColor: color.surface.primary,
  border: `1px solid ${color.border.muted}`,
  borderRadius: border.radius.md, boxShadow: shadow.lg, zIndex: 200,
};

const headerStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: `${space.sm} ${space.md}`,
  borderBottom: `1px solid ${color.border.muted}`,
};

const headerTitleStyle: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.label.md,
  fontWeight: font.weight.semibold, color: color.text.primary,
};

const markAllStyle: CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontFamily: font.family.label, fontSize: font.size.body.xs,
  fontWeight: font.weight.medium, color: color.text.brand, padding: 0,
};

const itemStyle = (isRead: boolean): CSSProperties => ({
  display: 'flex', gap: gap.md, padding: `${space.sm} ${space.md}`,
  cursor: 'pointer', backgroundColor: isRead ? 'transparent' : color.surface.secondary,
  borderBottom: `1px solid ${color.border.muted}`, transition: 'background-color 0.15s ease',
});

const dotStyle: CSSProperties = {
  width: '8px', height: '8px', borderRadius: border.radius.circle,
  backgroundColor: color.system.link, flexShrink: 0, marginTop: '6px',
};

const itemTitleStyle: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.label.sm,
  fontWeight: font.weight.medium, color: color.text.primary,
  lineHeight: font.lineHeight.snug,
};

const itemBodyStyle: CSSProperties = {
  fontFamily: font.family.body, fontSize: font.size.body.xs,
  color: color.text.secondary, lineHeight: font.lineHeight.normal,
  marginTop: space.tiny,
};

const itemTimeStyle: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.body.tiny,
  color: color.text.muted, marginTop: space.tiny,
};

const emptyStyle: CSSProperties = {
  padding: space.xl, textAlign: 'center', fontFamily: font.family.body,
  fontSize: font.size.body.sm, color: color.text.muted,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Component ──────────────────────────────────────────────────────────────

export function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const prevUnread = useRef(0);
  const ref = useRef<HTMLDivElement>(null);

  // Pulse the dot when a new notification arrives
  useEffect(() => {
    if (unreadCount > prevUnread.current) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 2000);
      return () => clearTimeout(timer);
    }
    prevUnread.current = unreadCount;
  }, [unreadCount]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const { openSheet } = useSheetStack();

  const handleItemClick = (n: Notification) => {
    if (!n.is_read) markRead(n.id);
    setOpen(false);

    // Try to open in a global sheet first (no page navigation)
    const parsed = parseNotificationLink(n.link);
    if (parsed) {
      openSheet(parsed.type, parsed.props, { title: n.title });
    } else if (n.link) {
      router.push(n.link);
    }
  };

  return (
    <div style={wrapStyle} ref={ref}>
      <style>{`
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.8); opacity: 0.5; }
        }
        .dot-pulse { animation: dot-pulse 0.8s ease-in-out 3; }
      `}</style>
      <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.bell} />} label="Notifications" onClick={() => setOpen(prev => !prev)} />
      {unreadCount > 0 && <span className={pulse ? 'dot-pulse' : ''} style={unreadDotStyle} />}

      {open && (
        <div style={dropdownStyle}>
          <div style={headerStyle}>
            <span style={headerTitleStyle}>Notifications</span>
            {unreadCount > 0 && <button type="button" style={markAllStyle} onClick={markAllRead}>Mark all read</button>}
          </div>

          {notifications.length === 0 ? (
            <div style={emptyStyle}>No notifications yet</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} style={itemStyle(n.is_read)} onClick={() => handleItemClick(n)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') handleItemClick(n); }}>
                {!n.is_read && <div style={dotStyle} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={itemTitleStyle}>{n.title}</div>
                  {n.body && <div style={itemBodyStyle}>{n.body}</div>}
                  <div style={itemTimeStyle}>{timeAgo(n.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
