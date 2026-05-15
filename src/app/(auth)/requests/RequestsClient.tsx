'use client';

import { useState, useMemo, useEffect, useRef, useCallback, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useRouter } from 'next/navigation';
import { Board, BoardColumn, BoardCard, Skeleton } from '@brikdesigns/bds';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@brikdesigns/bds';
import { Tag, Chip, Button, IconButton, FilterBar, PageHeader, TabBar, Tooltip, useSheetStack } from '@brikdesigns/bds';
import { PriorityBadge } from '@/components/PriorityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { TableSkeleton } from '@/components/TableSkeleton';
import { Menu, MenuItem } from '@brikdesigns/bds';
import type { MenuItemData } from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { useRequests, type RequestRow } from '@/hooks/useRequests';
import { useMembers, type Member } from '@/hooks/useMembers';
import { SubmitRequestSheet, type RequestEditData } from '@/components/SubmitRequestSheet';
import { UserAvatar } from '@/components/UserAvatar';
import { useToast } from '@/components/ToastProvider';
import { color, font, space, gap, border, shadow } from '@/lib/tokens';

// ─── Status pipeline ────────────────────────────────────────────────────────

// Board columns for the "Open" tab. `closed` is intentionally excluded —
// closed requests live on the dedicated "Closed" tab as a table view.
const STATUS_PIPELINE = [
  { key: 'submitted',         label: 'Submitted' },
  { key: 'in_review',         label: 'In Review' },
  { key: 'in_progress',       label: 'In Progress' },
  { key: 'waiting_on_vendor', label: 'Waiting on Vendor' },
  { key: 'resolved',          label: 'Resolved' },
] as const;

type RequestsView = 'open' | 'closed';


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
      <Chip label={selected} variant={isFiltered ? 'primary' : 'secondary'} showDropdown onChipClick={() => setOpen(p => !p)} />
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

const countBadgeStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.xs,
  fontWeight: font.weight.medium,
  color: color.text.secondary,
  backgroundColor: color.surface.secondary,
  padding: `2px ${gap.md}`,
  borderRadius: border.radius.sm,
};

const columnBaseStyle: CSSProperties = {
  backgroundColor: color.surface.primary,
  flex: 1,
  minWidth: 0,
  transition: 'outline 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
  outline: '2px solid transparent',
  outlineOffset: '-2px',
  borderRadius: border.radius.md,
};

/** All columns while any card is being dragged — subtle dropzone hint */
const columnDragActiveStyle: CSSProperties = {
  ...columnBaseStyle,
  backgroundColor: color.surface.secondary,
  outline: `2px dashed ${color.border.muted}`,
};

/** The specific column the card is hovering over */
const columnDropTargetStyle: CSSProperties = {
  ...columnBaseStyle,
  backgroundColor: color.surface.muted,
  outline: `2px solid ${color.border.brand}`,
  boxShadow: shadow.md,
};

// ─── Closed-tab table styles (mirrors MyRequestsList.tableShellStyle) ─────

const closedTableShellStyle: CSSProperties = {
  flex: 1,
  overflowX: 'auto',
  backgroundColor: color.background.primary,
  borderRadius: border.radius.lg,
  boxShadow: shadow.sm,
  padding: space.lg,
};

// TODO(bds-migration): body-cell bg is a local patch matching MyRequestsList.
// Promote to BDS Table.css once the in-flight BDS session reconciles.
const closedBodyCellStyle: CSSProperties = { backgroundColor: color.background.primary };
const closedNameCellStyle: CSSProperties = { fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary };
const closedSecondaryCellStyle: CSSProperties = { fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary };

// ─── Loading skeleton ──────────────────────────────────────────────────────

// Stagger card counts so the loading state looks like a real board, not a grid.
// Five columns now that `closed` lives on its own tab as a table.
const SKELETON_CARDS_PER_COLUMN = [3, 2, 2, 1, 0];

function BoardCardSkeleton() {
  return (
    <div
      style={{
        backgroundColor: color.surface.overlay,
        boxShadow: shadow.sm,
        borderRadius: border.radius.md,
        padding: space.md,
        display: 'flex',
        flexDirection: 'column',
        gap: gap.sm,
      }}
    >
      <Skeleton variant="text" width="70%" height={16} />
      <Skeleton variant="text" width="45%" height={12} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: gap.xs }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.xs }}>
          <Skeleton variant="rectangular" width={56} height={20} style={{ borderRadius: border.radius.sm }} />
          <Skeleton variant="rectangular" width={20} height={20} style={{ borderRadius: border.radius.sm }} />
        </div>
        <Skeleton variant="rectangular" width={28} height={28} style={{ borderRadius: border.radius.pill }} />
      </div>
    </div>
  );
}

// ─── Assignee menu constants ────────────────────────────────────────────────

const ASSIGN_MENU_WIDTH = 220;
const ASSIGN_MENU_MAX_H = 280;

const unassignedAvatarStyle: CSSProperties = {
  width: 28, height: 28, borderRadius: border.radius.pill,
  backgroundColor: color.surface.secondary,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};

// ─── Assignee avatar with portal-based reassign menu ────────────────────────

function AssigneeAvatar({
  requestId, assigneeId, assigneeName, members, onAssigned,
}: {
  requestId: string;
  assigneeId: string | null;
  assigneeName: string | null;
  members: Member[];
  onAssigned: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Compute position synchronously on open — no flash
  const openMenu = useCallback(() => {
    if (!avatarRef.current) return;
    const rect = avatarRef.current.getBoundingClientRect();

    // Default: below avatar, left-aligned with avatar left edge
    let top = rect.bottom + 4;
    let left = rect.left;

    // Flip above if it would overflow viewport bottom
    if (top + ASSIGN_MENU_MAX_H > window.innerHeight - 8) {
      top = rect.top - ASSIGN_MENU_MAX_H - 4;
      if (top < 8) top = 8;
    }

    // Clamp right edge to viewport
    if (left + ASSIGN_MENU_WIDTH > window.innerWidth - 8) {
      left = window.innerWidth - ASSIGN_MENU_WIDTH - 8;
    }
    if (left < 8) left = 8;

    setPos({ top, left });
    setOpen(true);
  }, []);

  const close = useCallback(() => { setOpen(false); setPos(null); }, []);

  // Click-outside: close if click is outside both the avatar and the menu
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (avatarRef.current?.contains(target)) return; // avatar toggle handles itself
      if (menuRef.current?.contains(target)) return;   // click inside menu
      close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  // Close on external scroll (board horizontal, column items vertical)
  // but NOT when the user scrolls inside the menu itself
  useEffect(() => {
    if (!open) return;
    const handler = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      close();
    };
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [open, close]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (open) { close(); } else { openMenu(); }
  };

  const handleAssign = async (memberId: string | null, memberName: string | null) => {
    close();
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: memberId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to assign');
      }
      showToast({
        title: memberName ? 'Request assigned' : 'Request unassigned',
        description: memberName ? `Assigned to ${memberName}.` : 'Assignee removed.',
        variant: 'success',
      });
      onAssigned();
    } catch (err) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to assign', variant: 'error' });
    }
  };

  const activeMembers = members.filter(m => m.is_active);

  return (
    <>
      <Tooltip content={assigneeName ?? 'Assign to'} placement="top">
        <IconButton
          ref={avatarRef}
          variant="ghost"
          size="sm"
          label={assigneeName ?? 'Assign to'}
          onClick={handleToggle}
          icon={
            assigneeName ? (
              <UserAvatar name={assigneeName} size="sm" />
            ) : (
              <div style={unassignedAvatarStyle}>
                <Icon icon={icon.profile} style={{ fontSize: font.size.label.sm, color: color.text.muted } as CSSProperties & Record<string, string>} />
              </div>
            )
          }
        />
      </Tooltip>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            width: ASSIGN_MENU_WIDTH,
            maxHeight: ASSIGN_MENU_MAX_H,
            overflowY: 'auto',
            backgroundColor: color.surface.primary,
            borderRadius: border.radius.md,
            border: `1px solid ${color.border.muted}`,
            boxShadow: shadow.lg,
            padding: `${gap.xs} 0`,
          }}
        >
          <MenuItem
            item={{
              id: 'unassigned',
              label: 'Unassigned',
              icon: (
                <div style={{ ...unassignedAvatarStyle, width: 24, height: 24 }}>
                  <Icon icon={icon.profile} style={{ fontSize: font.size.body.xs, color: color.text.muted } as CSSProperties & Record<string, string>} />
                </div>
              ),
            }}
            onClick={(e) => { e.stopPropagation(); handleAssign(null, null); }}
            onMouseDown={(e) => e.stopPropagation()}
            isActive={!assigneeId}
          />
          {activeMembers.map(m => {
            const name = `${m.first_name} ${m.last_name}`.trim();
            return (
              <MenuItem
                key={m.id}
                item={{
                  id: m.id,
                  label: name,
                  icon: <UserAvatar name={name} departmentColorKey={m.department_color} size="sm" />,
                }}
                onClick={(e) => { e.stopPropagation(); handleAssign(m.id, name); }}
                onMouseDown={(e) => e.stopPropagation()}
                isActive={m.id === assigneeId}
              />
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

interface RequestsClientProps {
  /** Reserved for future admin-only actions (assign, change status, resolve) */
  isAdmin: boolean;
}

export default function RequestsClient({ isAdmin: _isAdmin }: RequestsClientProps) {
  const { requests, loading, refetch, updateOptimistic } = useRequests();
  const { members } = useMembers();
  const { openSheet } = useSheetStack();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitCategory, setSubmitCategory] = useState('');
  const [editing, setEditing] = useState<RequestEditData | null>(null);
  const [filterCategory, setFilterCategory] = useState('All Categories');
  const [filterPriority, setFilterPriority] = useState('All Priorities');
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [view, setView] = useState<RequestsView>('open');
  const { showToast: showToastTop } = useToast();

  // Drag-and-drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const isDragging = useRef(false);

  // Open a request in the global sheet stack (supports drill-down into equipment, room, vendor)
  const openRequest = useCallback((req: RequestRow) => {
    openSheet('request', {
      id: req.id,
      onUpdated: refetch,
    }, { title: req.title, variant: 'floating' });
  }, [openSheet, refetch]);

  // Auto-open request sheet from ?open=<id> (e.g., notification click)
  // Auto-open submit form from ?submit=true (e.g., plus button in utility bar)
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

  // Closed-tab list — only `closed` status, newest first.
  const closedRequests = useMemo(
    () => filtered.filter(r => r.status === 'closed').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [filtered]
  );

  // ── Drag-and-drop handlers ──────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, requestId: string) => {
    isDragging.current = true;
    setDraggingId(requestId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', requestId);

    // Apply drag-preview class so browser captures tilted snapshot
    const card = e.currentTarget;
    card.classList.add('bds-board-card--drag-preview');
    requestAnimationFrame(() => {
      card.classList.remove('bds-board-card--drag-preview');
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDropTargetKey(null);
    // Delay clearing so the subsequent click event (if any) is still suppressed
    setTimeout(() => { isDragging.current = false; }, 0);
  }, []);

  const handleColumnDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleColumnDragEnter = useCallback((_e: React.DragEvent<HTMLDivElement>, statusKey: string) => {
    setDropTargetKey(statusKey);
  }, []);

  const handleColumnDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>, statusKey: string) => {
    // Only clear if truly leaving the column, not entering a child element
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setDropTargetKey(prev => prev === statusKey ? null : prev);
  }, []);

  const handleColumnDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, targetStatusKey: string) => {
    e.preventDefault();
    const requestId = e.dataTransfer.getData('text/plain');
    setDraggingId(null);
    setDropTargetKey(null);
    // Reset drag flag here — the optimistic update below unmounts the card from its
    // old column, so React detaches the onDragEnd handler before dragend fires,
    // leaving isDragging.current stuck at true and blocking all future clicks.
    setTimeout(() => { isDragging.current = false; }, 0);

    if (!requestId) return;

    const request = requests.find(r => r.id === requestId);
    if (!request || request.status === targetStatusKey) return;

    const targetLabel = STATUS_PIPELINE.find(s => s.key === targetStatusKey)?.label ?? targetStatusKey;
    const previousStatus = request.status;

    // Optimistic: move card to new column immediately
    updateOptimistic(requestId, { status: targetStatusKey });

    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatusKey }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to update status');
      }
      showToastTop({ title: 'Status updated', description: `Moved to ${targetLabel}.`, variant: 'success' });
      refetch();
    } catch (err) {
      // Revert optimistic update on failure
      updateOptimistic(requestId, { status: previousStatus });
      showToastTop({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update status', variant: 'error' });
    }
  }, [requests, refetch, updateOptimistic, showToastTop]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <PageHeader
        title="Requests"
        actions={
          <div style={{ position: 'relative' }}>
            <Button variant="primary" size="sm" iconAfter={<Icon icon={icon.chevronDown} />} onClick={() => setAddMenuOpen(p => !p)}>
              Add Request
            </Button>
            <Menu
              isOpen={addMenuOpen}
              onClose={() => setAddMenuOpen(false)}
              items={ADD_MENU_CATEGORIES.map(c => ({
                id: c.id,
                label: c.label,
                description: c.desc,
                icon: <Icon icon={c.icon} />,
                onClick: () => { setSubmitCategory(c.id); setSubmitOpen(true); setAddMenuOpen(false); },
              }))}
              style={{ top: '100%', right: 0, marginTop: gap.sm, minWidth: 280 }}
            />
          </div>
        }
        tabs={
          <TabBar
            variant="tab"
            items={[
              { label: 'Open', active: view === 'open', onClick: () => setView('open') },
              { label: 'Closed', active: view === 'closed', onClick: () => setView('closed') },
            ]}
          />
        }
      />

      {/* Filter strip — BDS <FilterBar> sits between PageHeader and the Board.
          Owns the category/priority chip filters + filtered-count counter. */}
      <FilterBar
        total={requests.length}
        filtered={filtered.length}
        label="requests"
        onClear={() => { setFilterCategory('All Categories'); setFilterPriority('All Priorities'); }}
      >
        <ChipFilter options={CATEGORY_FILTER} selected={filterCategory} onChange={setFilterCategory} />
        <ChipFilter options={PRIORITY_FILTER} selected={filterPriority} onChange={setFilterPriority} />
      </FilterBar>

      {view === 'open' ? (
      <Board style={{ flex: 1, minHeight: 0 }}>
        {columns.map((col, colIdx) => {
          const isDropTarget = dropTargetKey === col.key;
          const isDragMode = draggingId !== null;
          const skeletonCount = loading && col.requests.length === 0 ? SKELETON_CARDS_PER_COLUMN[colIdx] ?? 0 : 0;
          const colStyle = isDropTarget
            ? columnDropTargetStyle
            : isDragMode
              ? columnDragActiveStyle
              : columnBaseStyle;

          return (
            <BoardColumn
              key={col.key}
              style={colStyle}
              onDragOver={handleColumnDragOver}
              onDragEnter={(e: React.DragEvent<HTMLDivElement>) => handleColumnDragEnter(e, col.key)}
              onDragLeave={(e: React.DragEvent<HTMLDivElement>) => handleColumnDragLeave(e, col.key)}
              onDrop={(e: React.DragEvent<HTMLDivElement>) => handleColumnDrop(e, col.key)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, padding: `${space.md} 0` }}>
                <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.bold, color: color.text.primary }}>
                  {col.label}
                </span>
                <span style={countBadgeStyle}>{col.requests.length}</span>
              </div>
              {col.requests.map(req => {
                const catLabel = CATEGORY_LABELS[req.category] ?? req.category;
                const isBeingDragged = draggingId === req.id;
                return (
                  <BoardCard
                    key={req.id}
                    title={req.title}
                    subtitle={req.submitter_name ? `${req.submitter_name} \u00b7 ${timeAgo(req.created_at)}` : timeAgo(req.created_at)}
                    onClick={() => { if (!isDragging.current) openRequest(req); }}
                    draggable
                    onDragStart={(e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, req.id)}
                    onDragEnd={handleDragEnd}
                    style={{
                      backgroundColor: color.surface.overlay,
                      boxShadow: isBeingDragged ? 'none' : shadow.sm,
                      cursor: isDragMode ? 'grabbing' : 'grab',
                      ...(isBeingDragged ? { opacity: 0.3, transform: 'scale(0.97)' } : {}),
                      transition: 'opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    tags={
                      <>
                        <Tag size="sm" style={{ backgroundColor: color.background.secondary, color: color.text.secondary, flexShrink: 0 }}>{catLabel}</Tag>
                        <PriorityBadge priority={req.urgency} iconOnly />
                        {req.vendor_name && (
                          <Tooltip content="Has Vendor">
                            <span style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: border.radius.sm, backgroundColor: color.surface.brandPrimary, color: color.text.onColorDark, flexShrink: 0 }}>
                              <Icon icon={icon.wrench} width={14} height={14} />
                            </span>
                          </Tooltip>
                        )}
                      </>
                    }
                    trailingTag={
                      <AssigneeAvatar
                        requestId={req.id}
                        assigneeId={req.assignee_id}
                        assigneeName={req.assignee_name}
                        members={members}
                        onAssigned={refetch}
                      />
                    }
                  />
                );
              })}
              {skeletonCount > 0 && Array.from({ length: skeletonCount }).map((_, i) => (
                <BoardCardSkeleton key={`skeleton-${col.key}-${i}`} />
              ))}
              {!loading && col.requests.length === 0 && !isDragMode && (
                <div style={{ padding: space.lg, textAlign: 'center', color: color.text.muted, fontSize: font.size.body.sm, fontFamily: font.family.body }}>
                  No requests
                </div>
              )}
              {isDragMode && (
                <div style={{
                  padding: space.lg,
                  textAlign: 'center',
                  color: isDropTarget ? color.text.brand : color.text.muted,
                  fontSize: font.size.body.sm,
                  fontFamily: font.family.label,
                  fontWeight: font.weight.medium,
                  border: `2px dashed ${isDropTarget ? color.border.brand : color.border.muted}`,
                  borderRadius: border.radius.md,
                  transition: 'color 0.15s ease, border-color 0.15s ease',
                  marginTop: col.requests.length > 0 ? space.sm : '0',
                }}>
                  Drop to move to {col.label}
                </div>
              )}
            </BoardColumn>
          );
        })}
      </Board>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={closedTableShellStyle}>
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
                ) : closedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell style={closedBodyCellStyle} colSpan={5}>
                      <div style={{ padding: space.lg, textAlign: 'center', color: color.text.muted, fontSize: font.size.body.sm, fontFamily: font.family.body }}>
                        No closed requests
                      </div>
                    </TableCell>
                  </TableRow>
                ) : closedRequests.map(req => (
                  <TableRow key={req.id} onClick={() => openRequest(req)} style={{ cursor: 'pointer' }}>
                    <TableCell style={closedBodyCellStyle}>
                      <span style={closedNameCellStyle}>{req.title}</span>
                    </TableCell>
                    <TableCell style={closedBodyCellStyle}>
                      <Tag size="sm" style={{ backgroundColor: color.background.secondary, color: color.text.secondary }}>
                        {CATEGORY_LABELS[req.category] ?? req.category}
                      </Tag>
                    </TableCell>
                    <TableCell style={closedBodyCellStyle}>
                      <PriorityBadge priority={req.urgency} />
                    </TableCell>
                    <TableCell style={closedBodyCellStyle}>
                      <StatusBadge status={req.status} />
                    </TableCell>
                    <TableCell style={closedBodyCellStyle}>
                      <span style={closedSecondaryCellStyle}>{timeAgo(req.created_at)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

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
