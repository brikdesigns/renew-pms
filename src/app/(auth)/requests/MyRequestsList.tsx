'use client';

import { useState, useMemo, useEffect, type CSSProperties } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import { Badge, Tag, Button } from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { useRequests, type RequestRow } from '@/hooks/useRequests';
import { SubmitRequestSheet } from '@/components/SubmitRequestSheet';
import { ViewRequestSheet } from '@/components/ViewRequestSheet';
import { color, font, space, gap, border, shadow } from '@/lib/tokens';

// ─── Display maps ──────────────────────────────────────────────────────────

const PRIORITY_BADGE: Record<string, { status: 'error' | 'warning' | 'info'; label: string; icon: string }> = {
  critical: { status: 'error',   label: 'Critical', icon: icon.priorityCritical },
  high:     { status: 'error',   label: 'High',     icon: icon.priorityHigh },
  medium:   { status: 'warning', label: 'Medium',   icon: icon.priorityWarning },
  low:      { status: 'info',    label: 'Low',      icon: icon.priorityInfo },
};

const STATUS_BADGE: Record<string, { status: 'info' | 'warning' | 'positive' | 'error'; label: string }> = {
  submitted:         { status: 'info',    label: 'Submitted' },
  in_review:         { status: 'info',    label: 'In Review' },
  in_progress:       { status: 'warning', label: 'In Progress' },
  waiting_on_vendor: { status: 'warning', label: 'Waiting on Vendor' },
  resolved:          { status: 'positive', label: 'Resolved' },
  closed:            { status: 'positive', label: 'Closed' },
};

const CATEGORY_LABELS: Record<string, string> = {
  device_issue:          'Device',
  equipment_issue:       'Equipment',
  facility_maintenance:  'Facility',
};

const ADD_MENU_CATEGORIES = [
  { id: 'device_issue',         label: 'Device Issue',            desc: 'Computers, tablets, printers',    icon: 'ph:desktop-fill' },
  { id: 'equipment_issue',      label: 'Equipment Issue',         desc: 'Dental chairs, autoclaves, X-ray', icon: 'ph:wrench-fill' },
  { id: 'facility_maintenance', label: 'Facility / Maintenance',  desc: 'Building, plumbing, HVAC',        icon: 'ph:buildings-fill' },
] as const;

// ─── Styles ────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1 };

const subHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: `${space.md} 0`, borderBottom: `1px solid ${color.border.muted}`,
};

const subHeaderLeftStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: space.sm };

const titleStyle: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.semibold, color: color.text.primary, margin: 0,
};

const countBadge: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.body.xs, fontWeight: font.weight.medium,
  color: color.text.secondary, backgroundColor: color.surface.secondary, padding: `2px ${gap.md}`, borderRadius: border.radius.sm,
};

const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto' };

const nameCellStyle: CSSProperties = { fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary };
const secondaryCellStyle: CSSProperties = { fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary };

const emptyWrapStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  flex: 1, gap: gap.lg, padding: space.xl, minHeight: '40vh',
};

const emptyTitleStyle: CSSProperties = {
  fontFamily: font.family.heading, fontSize: font.size.heading.medium, fontWeight: font.weight.bold,
  color: color.text.primary, margin: 0,
};

const emptyDescStyle: CSSProperties = {
  fontFamily: font.family.body, fontSize: font.size.body.md, color: color.text.secondary,
  textAlign: 'center', maxWidth: '400px', lineHeight: font.lineHeight.normal,
};

// ─── Time formatting ───────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Component ─────────────────────────────────────────────────────────────

// ─── Add request button (self-contained menu state) ───────────────────────

function AddRequestButton({ onSelect }: { onSelect: (categoryId: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <Button variant="primary" size="sm" iconAfter={<Icon icon={icon.chevronDown} />} onClick={() => setOpen(p => !p)}>
        New Request
      </Button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 100,
          backgroundColor: color.surface.primary, borderRadius: border.radius.md,
          border: `1px solid ${color.border.muted}`, boxShadow: shadow.md,
          minWidth: 280, overflow: 'hidden',
        }}>
          {ADD_MENU_CATEGORIES.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onSelect(c.id); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: gap.md,
                width: '100%', padding: `${space.sm} ${space.md}`,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: font.family.label, fontSize: font.size.label.sm,
                color: color.text.primary, textAlign: 'left',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = color.surface.accent; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Icon icon={c.icon} style={{ width: 16, color: color.text.brand }} />
              <div>
                <div style={{ fontWeight: font.weight.semibold }}>{c.label}</div>
                <div style={{ fontSize: font.size.body.xs, color: color.text.secondary }}>{c.desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

interface MyRequestsListProps {
  memberId: string;
}

export function MyRequestsList({ memberId }: MyRequestsListProps) {
  const { requests, loading, refetch } = useRequests({ mine: memberId });
  const searchParams = useSearchParams();
  const router = useRouter();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitCategory, setSubmitCategory] = useState('');
  const [viewing, setViewing] = useState<RequestRow | null>(null);

  // Auto-open request sheet from ?open=<id> or submit from ?submit=true
  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId && requests.length > 0) {
      const match = requests.find(r => r.id === openId);
      if (match) {
        setViewing(match);
        router.replace('/requests', { scroll: false });
      }
    }
    if (searchParams.get('submit') === 'true') {
      setSubmitOpen(true);
      router.replace('/requests', { scroll: false });
    }
  }, [searchParams, requests, router]);

  const sorted = useMemo(() =>
    [...requests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  [requests]);

  const handleAddSelect = (categoryId: string) => {
    setSubmitCategory(categoryId);
    setSubmitOpen(true);
  };

  // ── Empty state ──

  if (!loading && requests.length === 0) {
    return (
      <div style={wrapStyle}>
        <div style={subHeaderStyle}>
          <div style={subHeaderLeftStyle}>
            <h3 style={titleStyle}>My Requests</h3>
            <span style={countBadge}>0</span>
          </div>
          <AddRequestButton onSelect={handleAddSelect} />
        </div>
        <div style={emptyWrapStyle}>
          <h2 style={emptyTitleStyle}>No Requests Yet</h2>
          <p style={emptyDescStyle}>
            Submit a request when something needs attention — equipment issues, device problems, or facility maintenance.
          </p>
          <AddRequestButton onSelect={handleAddSelect} />
        </div>

        <SubmitRequestSheet
          isOpen={submitOpen}
          onClose={() => { setSubmitOpen(false); setSubmitCategory(''); }}
          onSaved={refetch}
          defaultCategory={submitCategory}
        />
      </div>
    );
  }

  // ── List view ──

  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <h3 style={titleStyle}>My Requests</h3>
          <span style={countBadge}>{loading ? '–' : sorted.length}</span>
        </div>
        <AddRequestButton onSelect={handleAddSelect} />
      </div>

      <div style={tableWrap}>
        <Table size="default" flush>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} style={{ textAlign: 'center', color: color.text.muted, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                  Loading requests…
                </TableCell>
              </TableRow>
            ) : sorted.map(r => {
              const priority = PRIORITY_BADGE[r.urgency] ?? PRIORITY_BADGE.medium;
              const status = STATUS_BADGE[r.status] ?? STATUS_BADGE.submitted;
              return (
                <TableRow key={r.id} onClick={() => setViewing(r)} style={{ cursor: 'pointer' }}>
                  <TableCell>
                    <span style={nameCellStyle}>{r.title}</span>
                  </TableCell>
                  <TableCell>
                    <Tag size="sm" style={{ backgroundColor: color.surface.secondary, color: color.text.secondary }}>
                      {CATEGORY_LABELS[r.category] ?? r.category}
                    </Tag>
                  </TableCell>
                  <TableCell>
                    <Badge status={priority.status} size="sm" variant="dark" icon={<Icon icon={priority.icon} />}>
                      {priority.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge status={status.status} size="sm">
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span style={secondaryCellStyle}>{timeAgo(r.created_at)}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <SubmitRequestSheet
        isOpen={submitOpen}
        onClose={() => { setSubmitOpen(false); setSubmitCategory(''); }}
        onSaved={refetch}
        defaultCategory={submitCategory}
      />
      <ViewRequestSheet
        isOpen={viewing !== null}
        onClose={() => setViewing(null)}
        request={viewing}
        isAdmin={false}
        onUpdated={refetch}
      />
    </div>
  );
}
