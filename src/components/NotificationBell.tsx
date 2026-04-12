'use client';

import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { IconButton, NotificationPopover } from '@bds/components';
import { useSheetStack } from '@bds/components';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { color, border } from '@/lib/tokens';
import type { SheetType } from '@/lib/sheet-registry';
import type { NotificationItemData } from '@bds/components';

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

// ─── Styles (bell-specific — presentation delegated to BDS) ────────────────

const wrapStyle: CSSProperties = { position: 'relative' };

const unreadDotStyle: CSSProperties = {
  position: 'absolute', top: '6px', right: '6px',
  width: '8px', height: '8px', borderRadius: border.radius.circle,
  backgroundColor: color.system.error,
  pointerEvents: 'none',
};

const dropdownPositionStyle: CSSProperties = {
  position: 'absolute', top: '100%', right: 0, marginTop: '4px',
  zIndex: 200,
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

/** Map product notifications to BDS NotificationItemData */
function toBdsItems(notifications: Notification[]): NotificationItemData[] {
  return notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    time: timeAgo(n.created_at),
    isRead: n.is_read,
  }));
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

  const handleItemClick = (item: NotificationItemData) => {
    const original = notifications.find((n) => n.id === item.id);
    if (original && !original.is_read) markRead(original.id);
    setOpen(false);

    // Try to open in a global sheet first (no page navigation)
    const parsed = original ? parseNotificationLink(original.link) : null;
    if (parsed) {
      openSheet(parsed.type, parsed.props, { title: item.title });
    } else if (original?.link) {
      router.push(original.link);
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
        <div style={dropdownPositionStyle}>
          <NotificationPopover
            notifications={toBdsItems(notifications)}
            onItemClick={handleItemClick}
            onMarkAllRead={markAllRead}
            showMarkAllRead={unreadCount > 0}
          />
        </div>
      )}
    </div>
  );
}
