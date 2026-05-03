'use client';

import { useState, useMemo, useEffect, useCallback, type CSSProperties } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@brikdesigns/bds';
import { Tag, Button, Menu, PageHeader, useSheetStack } from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { StatusBadge } from '@/components/StatusBadge';
import { PriorityBadge } from '@/components/PriorityBadge';
import { useRequests, type RequestRow } from '@/hooks/useRequests';
import { SubmitRequestSheet, type RequestEditData } from '@/components/SubmitRequestSheet';
import { TableSkeleton } from '@/components/TableSkeleton';
import { color, font, space, gap, border, shadow } from '@/lib/tokens';

// ─── Display maps ──────────────────────────────────────────────────────────


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

// Surface shell that wraps the table. Mirrors the dashboard card pattern
// (background.primary + shadow.sm + space.lg padding + border.radius.lg) so
// the table reads as a contained display layer instead of floating flat
// against the page. Header / "New Request" button stay outside this shell.
const tableShellStyle: CSSProperties = {
  flex: 1,
  overflowX: 'auto',
  backgroundColor: color.background.primary,
  borderRadius: border.radius.lg,
  boxShadow: shadow.sm,
  padding: space.lg,
};

// TODO(bds-migration): body-cell bg is a local patch. Promote to BDS Table.css
// (.bds-table-cell { background-color: var(--background-primary) }) once the
// in-flight BDS session on the other machine is reconciled, then remove this.
const bodyCellStyle: CSSProperties = { backgroundColor: color.background.primary };

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
      <Menu
        isOpen={open}
        onClose={() => setOpen(false)}
        items={ADD_MENU_CATEGORIES.map(c => ({
          id: c.id,
          label: c.label,
          description: c.desc,
          icon: <Icon icon={c.icon} />,
          onClick: () => { onSelect(c.id); setOpen(false); },
        }))}
        style={{ top: '100%', right: 0, marginTop: gap.sm, minWidth: 280 }}
      />
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────

interface MyRequestsListProps {
  memberId: string;
}

export function MyRequestsList({ memberId }: MyRequestsListProps) {
  const { requests, loading, refetch } = useRequests({ mine: memberId });
  const { openSheet, closeAll } = useSheetStack();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitCategory, setSubmitCategory] = useState('');
  const [editing, setEditing] = useState<RequestEditData | null>(null);

  // Open a request in the global sheet stack (supports drill-down into equipment, room, vendor)
  const openRequest = useCallback((req: RequestRow) => {
    openSheet('request', {
      id: req.id,
      onUpdated: refetch,
    }, { title: req.title, variant: 'floating' });
  }, [openSheet, refetch]);

  // Auto-open request sheet from ?open=<id> or submit from ?submit=true
  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId && requests.length > 0) {
      const match = requests.find(r => r.id === openId);
      if (match) {
        openRequest(match);
        router.replace('/requests', { scroll: false });
      }
    }
    if (searchParams.get('submit') === 'true') {
      setSubmitOpen(true);
      router.replace('/requests', { scroll: false });
    }
  }, [searchParams, requests, router, openRequest]);

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
        <PageHeader
          title="My Requests"
          actions={<AddRequestButton onSelect={handleAddSelect} />}
        />
        <div style={emptyWrapStyle}>
          <h2 style={emptyTitleStyle}>No Requests Yet</h2>
          <p style={emptyDescStyle}>
            Submit a request when something needs attention — equipment issues, device problems, or facility maintenance.
          </p>
          <AddRequestButton onSelect={handleAddSelect} />
        </div>

        <SubmitRequestSheet
          isOpen={submitOpen || editing !== null}
          onClose={() => { setSubmitOpen(false); setSubmitCategory(''); setEditing(null); }}
          onSaved={refetch}
          defaultCategory={submitCategory}
          initialData={editing}
        />
      </div>
    );
  }

  // ── List view ──

  return (
    <div style={wrapStyle}>
      <PageHeader
        title="My Requests"
        actions={<AddRequestButton onSelect={handleAddSelect} />}
      />

      <div style={tableShellStyle}>
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
              <TableSkeleton columns={5} />
            ) : sorted.map(r => {
              return (
                <TableRow key={r.id} onClick={() => openRequest(r)} style={{ cursor: 'pointer' }}>
                  <TableCell style={bodyCellStyle}>
                    <span style={nameCellStyle}>{r.title}</span>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <Tag size="sm" style={{ backgroundColor: color.background.secondary, color: color.text.secondary }}>
                      {CATEGORY_LABELS[r.category] ?? r.category}
                    </Tag>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <PriorityBadge priority={r.urgency} />
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <span style={secondaryCellStyle}>{timeAgo(r.created_at)}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <SubmitRequestSheet
        isOpen={submitOpen || editing !== null}
        onClose={() => { setSubmitOpen(false); setSubmitCategory(''); setEditing(null); }}
        onSaved={refetch}
        defaultCategory={submitCategory}
        initialData={editing}
      />
    </div>
  );
}
