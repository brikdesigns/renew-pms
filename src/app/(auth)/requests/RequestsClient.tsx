'use client';

import { useState, useMemo, type CSSProperties } from 'react';
import { Board, BoardColumn, BoardCard } from '@bds/components';
import { Tag, Badge, Chip, Button } from '@bds/components';
import { Menu } from '@bds/components';
import type { MenuItemData } from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { useRequests, type RequestRow } from '@/hooks/useRequests';
import { SubmitRequestSheet } from '@/components/SubmitRequestSheet';
import { ViewRequestSheet } from '@/components/ViewRequestSheet';
import { color, font, space, gap, border, shadow } from '@/lib/tokens';

// ─── Status pipeline ────────────────────────────────────────────────────────

const STATUS_PIPELINE = [
  { key: 'submitted',         label: 'Submitted' },
  { key: 'in_review',         label: 'In Review' },
  { key: 'in_progress',       label: 'In Progress' },
  { key: 'waiting_on_vendor', label: 'Waiting on Vendor' },
  { key: 'resolved',          label: 'Resolved' },
  { key: 'closed',            label: 'Closed' },
] as const;

const PRIORITY_BADGE: Record<string, { status: 'error' | 'warning' | 'info'; label: string; icon: string }> = {
  critical: { status: 'error',   label: 'Critical', icon: icon.priorityCritical },
  high:     { status: 'error',   label: 'High',     icon: icon.priorityHigh },
  medium:   { status: 'warning', label: 'Medium',   icon: icon.priorityWarning },
  low:      { status: 'info',    label: 'Low',      icon: icon.priorityInfo },
};

const CATEGORY_LABELS: Record<string, string> = {
  device_issue:          'Device',
  equipment_issue:       'Equipment',
  facility_maintenance:  'Facility',
};

// ─── Filters ────────────────────────────────────────────────────────────────

const CATEGORY_FILTER = ['All Categories', 'Device Issue', 'Equipment Issue', 'Facility / Maintenance'] as const;
const PRIORITY_FILTER = ['All Priorities', 'Critical', 'High', 'Medium', 'Low'] as const;

const CATEGORY_FILTER_MAP: Record<string, string> = {
  'Device Issue': 'device_issue',
  'Equipment Issue': 'equipment_issue',
  'Facility / Maintenance': 'facility_maintenance',
};

const PRIORITY_FILTER_MAP: Record<string, string> = {
  'Critical': 'critical', 'High': 'high', 'Medium': 'medium', 'Low': 'low',
};

// ─── ChipFilter (reusable) ─────────────────────────────────────────────────

function ChipFilter({ options, selected, onChange }: {
  options: readonly string[];
  selected: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const items: MenuItemData[] = options.map(opt => ({
    id: opt, label: opt,
    onClick: () => { onChange(opt); setOpen(false); },
  }));
  const isFiltered = selected !== options[0];
  return (
    <div style={{ position: 'relative' }}>
      <Chip label={selected} variant={isFiltered ? 'primary' : 'secondary'} appearance={isFiltered ? 'solid' : 'light'} showDropdown onChipClick={() => setOpen(p => !p)} />
      <Menu items={items} isOpen={open} onClose={() => setOpen(false)} activeId={selected} style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 180, zIndex: 100 }} />
    </div>
  );
}

// ─── Time formatting ────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${space.md} 0`,
  paddingRight: space.xl,
};

const headerLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: space.sm,
};

const titleStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.md,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
  margin: 0,
};

const countBadgeStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.xs,
  fontWeight: font.weight.medium,
  color: color.text.secondary,
  backgroundColor: color.surface.secondary,
  padding: `2px ${gap.md}`,
  borderRadius: border.radius.sm,
};

const filterBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
};

const columnStyle: CSSProperties = {
  backgroundColor: color.surface.primary,
  flex: 1,
  minWidth: 0,
};

// ─── Component ──────────────────────────────────────────────────────────────

interface RequestsClientProps {
  /** Reserved for future admin-only actions (assign, change status, resolve) */
  isAdmin: boolean;
}

export default function RequestsClient({ isAdmin: _isAdmin }: RequestsClientProps) {
  const { requests, refetch } = useRequests();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [viewing, setViewing] = useState<RequestRow | null>(null);
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [filterPriority, setFilterPriority] = useState('All Priorities');

  const filtered = useMemo(() => {
    return requests.filter(r => {
      if (filterCategory !== 'All Categories' && r.category !== CATEGORY_FILTER_MAP[filterCategory]) return false;
      if (filterPriority !== 'All Priorities' && r.urgency !== PRIORITY_FILTER_MAP[filterPriority]) return false;
      return true;
    });
  }, [requests, filterCategory, filterPriority]);

  const columns = useMemo(() => {
    const byStatus = new Map<string, RequestRow[]>();
    for (const r of filtered) {
      const existing = byStatus.get(r.status) ?? [];
      existing.push(r);
      byStatus.set(r.status, existing);
    }
    return STATUS_PIPELINE
      .map(s => ({
        ...s,
        requests: byStatus.get(s.key) ?? [],
      }));
  }, [filtered]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 96px)' }}>
      <div style={headerStyle}>
        <div style={headerLeftStyle}>
          <h3 style={titleStyle}>Requests</h3>
          <span style={countBadgeStyle}>{filtered.length}</span>
        </div>
        <div style={filterBarStyle}>
          <ChipFilter options={CATEGORY_FILTER} selected={filterCategory} onChange={setFilterCategory} />
          <ChipFilter options={PRIORITY_FILTER} selected={filterPriority} onChange={setFilterPriority} />
          <Button variant="primary" size="sm" onClick={() => setSubmitOpen(true)}>
            Add Request
          </Button>
        </div>
      </div>

      <Board style={{ flex: 1, minHeight: 0 }}>
        {columns.map(col => (
          <BoardColumn key={col.key} style={columnStyle as CSSProperties}>
            <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, padding: `${space.md} 0` }}>
              <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.bold, color: color.text.primary }}>
                {col.label}
              </span>
              <span style={countBadgeStyle}>{col.requests.length}</span>
            </div>
            {col.requests.map(req => {
              const priority = PRIORITY_BADGE[req.urgency] ?? PRIORITY_BADGE.medium;
              const catLabel = CATEGORY_LABELS[req.category] ?? req.category;
              return (
                <BoardCard
                  key={req.id}
                  title={req.title}
                  subtitle={req.submitter_name ? `${req.submitter_name} \u00b7 ${timeAgo(req.created_at)}` : timeAgo(req.created_at)}
                  onClick={() => setViewing(req)}
                  style={{ backgroundColor: color.surface.overlay, boxShadow: shadow.sm, cursor: 'pointer' }}
                  tags={
                    <>
                      <Tag size="sm" style={{ backgroundColor: color.surface.secondary, color: color.text.secondary, flexShrink: 0 }}>{catLabel}</Tag>
                      <Badge status={priority.status} size="xs" variant="dark" icon={<Icon icon={priority.icon} />} style={{ flexShrink: 0 }}>
                        {priority.label}
                      </Badge>
                    </>
                  }
                  trailingTag={
                    req.vendor_name ? (
                      <Tag size="sm" style={{ backgroundColor: color.surface.brandPrimary, color: color.text.onColorDark, flexShrink: 0 }}>
                        {req.vendor_name}
                      </Tag>
                    ) : undefined
                  }
                />
              );
            })}
            {col.requests.length === 0 && (
              <div style={{ padding: space.lg, textAlign: 'center', color: color.text.muted, fontSize: font.size.body.sm, fontFamily: font.family.body }}>
                No requests
              </div>
            )}
          </BoardColumn>
        ))}
      </Board>

      <SubmitRequestSheet
        isOpen={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onSaved={refetch}
      />
      <ViewRequestSheet
        isOpen={viewing !== null}
        onClose={() => setViewing(null)}
        request={viewing}
      />
    </div>
  );
}
