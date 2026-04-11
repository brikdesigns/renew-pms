'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { Sheet, Button, Badge, Tag, Skeleton } from '@bds/components';
import type { SheetTab } from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { SheetSkeleton } from '@/components/SheetSkeleton';
import { useToast } from '@/components/ToastProvider';
import {
  sheetBodyStyle,
  sheetSectionTitle,
} from '@/app/(auth)/settings/_sheetStyles';
import { color, font, gap, space, border, departmentColor } from '@/lib/tokens';
import { FrequencyTag } from '@/components/FrequencyTag';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TaskViewData {
  id: string;
  title: string;
  templateName: string;
  taskType: string;
  due: string;
  dept: string;
  /** DB-stored color key from departments.color */
  deptColor: string;
  freq: string;
  priority: string;
  assignee: string;
  assigneeRole: string;
  checked: boolean;
  // Assignment model
  assignmentType: 'role' | 'department';
  assignmentValue: string;
  // Context relations
  room?: string;
  equipment?: string;
  // Checklist counts (from board data)
  checklistTotal: number;
  checklistCompleted: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  sort_order: number;
  is_completed: boolean;
  completed_at: string | null;
}

interface ViewTaskSheetProps {
  /** Whether the sheet is open (page-level mode). Defaults to true for global mode. */
  isOpen?: boolean;
  onClose: () => void;
  /** Full task data (page-level mode — skips fetch) */
  task?: TaskViewData | null;
  /** Task ID (global mode — fetches data) */
  id?: string;
  onTaskCompleted?: () => void;
  /** Navigate to a related entity (global sheet stack) */
  onNavigate?: (type: string, props: Record<string, unknown>, opts?: { title?: string }) => void;
}

// ─── Priority display ────────────────────────────────────────────────────────

const PRIORITY_DISPLAY: Record<string, { status: 'error' | 'warning' | 'info'; label: string }> = {
  critical: { status: 'error', label: 'Critical' },
  error: { status: 'error', label: 'High' },
  warning: { status: 'warning', label: 'Medium' },
  info: { status: 'info', label: 'Low' },
};

const TASK_TYPE_DISPLAY: Record<string, string> = {
  checklist: 'Checklist',
  procedure: 'Procedure',
  compliance: 'Compliance',
  skill_training: 'Skill Training',
  onboarding: 'Onboarding',
  request: 'Request',
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const rowStyle: CSSProperties = { display: 'flex', gap: gap.lg, width: '100%' };
const halfStyle: CSSProperties = { flex: 1, minWidth: 0 };
const tagRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: gap.md, flexWrap: 'wrap' };

const checklistItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
  padding: `${space.sm} ${space.md}`,
  borderRadius: border.radius.sm,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
};

const checkboxStyle = (checked: boolean): CSSProperties => ({
  width: 20,
  height: 20,
  borderRadius: border.radius.xs,
  border: checked ? 'none' : `2px solid ${color.border.primary}`,
  backgroundColor: checked ? color.background.brandPrimary : 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'all 0.15s ease',
});

const checklistLabelStyle = (checked: boolean): CSSProperties => ({
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.medium,
  color: checked ? color.text.muted : color.text.primary,
  textDecoration: checked ? 'line-through' : 'none',
  flex: 1,
});

const progressBarOuter: CSSProperties = {
  width: '100%',
  height: 6,
  backgroundColor: color.surface.secondary,
  borderRadius: border.radius.pill,
  overflow: 'hidden',
};

const progressTextStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.body.xs,
  fontWeight: font.weight.medium,
  color: color.text.secondary,
  textAlign: 'right',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ViewTaskSheet({ isOpen = true, onClose, task: taskProp, id, onTaskCompleted, onNavigate }: ViewTaskSheetProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [fetched, setFetched] = useState<TaskViewData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Global mode: fetch by ID when no data prop is given
  const resolvedId = id ?? taskProp?.id;
  useEffect(() => {
    if (taskProp || !resolvedId) return;
    setFetchLoading(true);
    fetch(`/api/tasks/${resolvedId}`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setFetched(data); })
      .catch(err => console.error('[ViewTaskSheet] fetch failed:', err))
      .finally(() => setFetchLoading(false));
  }, [resolvedId, taskProp]);

  const task = taskProp ?? fetched;

  // Fetch checklist items when sheet opens
  useEffect(() => {
    if (!isOpen || !task) { setItems([]); return; }
    if (task.checklistTotal === 0) return;

    setLoadingItems(true);
    fetch(`/api/tasks/${task.id}/checklist`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setItems(data); })
      .catch(err => console.error('[ViewTaskSheet] failed to load checklist:', err))
      .finally(() => setLoadingItems(false));
  }, [isOpen, task?.id]);

  // Reset tab when task changes
  useEffect(() => {
    if (task) setActiveTab('details');
  }, [task?.id]);

  if (fetchLoading || !task) {
    return (
      <Sheet variant="floating" isOpen={isOpen} onClose={onClose} title={<Skeleton variant="text" width="160px" height={20} />} width="600px" side="right">
        <SheetSkeleton />
      </Sheet>
    );
  }

  const pri = PRIORITY_DISPLAY[task.priority] ?? PRIORITY_DISPLAY.info;
  const deptColors = departmentColor(task.deptColor);
  const hasChecklist = task.checklistTotal > 0;
  const completedCount = items.filter(i => i.is_completed).length;
  const allDone = hasChecklist && items.length > 0 && completedCount === items.length;
  const progressPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  // ── Toggle single item ──

  const toggleItem = async (itemId: string, currentState: boolean) => {
    setToggling(prev => new Set(prev).add(itemId));

    // Optimistic update
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, is_completed: !currentState } : i));

    try {
      const res = await fetch(`/api/tasks/${task.id}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: itemId, is_completed: !currentState }] }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      if (Array.isArray(updated)) setItems(updated);
    } catch (err) {
      console.error('[ViewTaskSheet] toggle failed:', err);
      // Revert optimistic update
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, is_completed: currentState } : i));
      showToast({ title: 'Error', description: 'Failed to update checklist item', variant: 'error' });
    } finally {
      setToggling(prev => { const next = new Set(prev); next.delete(itemId); return next; });
    }
  };

  // ── Complete all remaining items ──

  const completeAll = async () => {
    const remaining = items.filter(i => !i.is_completed);
    if (remaining.length === 0) return;

    // Optimistic
    setItems(prev => prev.map(i => ({ ...i, is_completed: true })));

    try {
      const res = await fetch(`/api/tasks/${task.id}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: remaining.map(i => ({ id: i.id, is_completed: true })) }),
      });
      if (!res.ok) throw new Error('Failed to complete all');
      const updated = await res.json();
      if (Array.isArray(updated)) setItems(updated);
      showToast({ title: 'Task complete', description: `All ${items.length} items marked done.`, variant: 'success' });
      onTaskCompleted?.();
    } catch (err) {
      console.error('[ViewTaskSheet] completeAll failed:', err);
      // Refetch to get true state
      const res = await fetch(`/api/tasks/${task.id}/checklist`);
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
      showToast({ title: 'Error', description: 'Failed to complete task', variant: 'error' });
    }
  };

  // ── Sheet title ──

  const sheetTitle = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: gap.tiny }}>
      <span>{task.title}</span>
      <span style={{
        fontFamily: font.family.label,
        fontSize: font.size.label.sm,
        fontWeight: font.weight.regular,
        color: color.text.secondary,
      }}>
        {task.templateName}
      </span>
    </div>
  );

  // ── Details tab ──

  const detailsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Task Details</h3>

      {/* Assignment */}
      <div style={rowStyle}>
        <div style={halfStyle}>
          <ReadOnlyField label="Assigned To" value={task.assignee} />
        </div>
        <div style={halfStyle}>
          <ReadOnlyField
            label={task.assignmentType === 'role' ? 'Assigned Role' : 'Assigned Department'}
            value={task.assignmentValue}
          />
        </div>
      </div>

      {/* Schedule */}
      <div style={rowStyle}>
        <div style={halfStyle}>
          <ReadOnlyField label="Due" value={task.due} />
        </div>
        <div style={halfStyle}>
          <ReadOnlyField label="Frequency" value={<FrequencyTag value={task.freq} />} />
        </div>
      </div>

      {/* Classification */}
      <div style={rowStyle}>
        <div style={halfStyle}>
          <ReadOnlyField label="Task Type" value={TASK_TYPE_DISPLAY[task.taskType] ?? task.taskType} />
        </div>
        <div style={halfStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>
              Department
            </span>
            <div style={tagRowStyle}>
              {task.dept && <Tag size="sm" style={{ backgroundColor: deptColors.light, color: deptColors.text }}>{task.dept}</Tag>}
            </div>
          </div>
        </div>
      </div>

      {/* Context: Room & Equipment */}
      {(task.room || task.equipment) && (
        <div style={rowStyle}>
          {task.room && (
            <div style={halfStyle}>
              <ReadOnlyField label="Room" value={task.room} />
            </div>
          )}
          {task.equipment && (
            <div style={halfStyle}>
              <ReadOnlyField label="Equipment" value={task.equipment} />
            </div>
          )}
        </div>
      )}

      {/* Status & Priority */}
      <div style={rowStyle}>
        <div style={halfStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>
              Priority
            </span>
            <div style={{ display: 'inline-flex' }}>
              <Badge status={pri.status} size="sm">{pri.label}</Badge>
            </div>
          </div>
        </div>
        <div style={halfStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>
              Status
            </span>
            <div style={{ display: 'inline-flex' }}>
              <Badge status={allDone || task.checked ? 'positive' : 'warning'} size="sm">
                {allDone || task.checked ? 'Completed' : 'In Progress'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Checklist tab ──

  const checklistContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>Checklist Items</h3>

      {/* Progress bar */}
      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.sm }}>
          <div style={progressBarOuter}>
            <div style={{
              width: `${progressPct}%`,
              height: '100%',
              backgroundColor: allDone ? color.surface.positive : color.background.brandPrimary,
              borderRadius: border.radius.pill,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <span style={progressTextStyle}>{completedCount} of {items.length} completed</span>
        </div>
      )}

      {/* Items */}
      {loadingItems ? (
        <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.muted, textAlign: 'center', padding: space.lg }}>
          Loading checklist…
        </span>
      ) : items.length === 0 ? (
        <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.muted, textAlign: 'center', padding: space.lg }}>
          No checklist items for this task.
        </span>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xs }}>
          {items.map(item => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => !toggling.has(item.id) && toggleItem(item.id, item.is_completed)}
              onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleItem(item.id, item.is_completed); } }}
              style={{
                ...checklistItemStyle,
                opacity: toggling.has(item.id) ? 0.6 : 1,
                backgroundColor: item.is_completed ? color.surface.secondary : 'transparent',
              }}
            >
              <div style={checkboxStyle(item.is_completed)}>
                {item.is_completed && (
                  <Icon icon={icon.check} style={{ color: color.text.onColorDark, fontSize: font.size.body.sm } as CSSProperties & Record<string, string>} />
                )}
              </div>
              <span style={checklistLabelStyle(item.is_completed)}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── Tabs ──

  const sheetTabs: SheetTab[] = hasChecklist
    ? [
        { id: 'details', label: 'Details', content: detailsContent },
        { id: 'checklist', label: `Checklist (${completedCount}/${items.length || task.checklistTotal})`, content: checklistContent },
      ]
    : [
        { id: 'details', label: 'Details', content: detailsContent },
      ];

  // ── Footer ──

  const footerContent = (
    <>
      <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>
      {hasChecklist && !allDone && (
        <Button variant="primary" size="md" type="button" onClick={completeAll}>
          Complete All
        </Button>
      )}
    </>
  );

  return (
    <Sheet
      variant="floating"
      isOpen={isOpen}
      onClose={onClose}
      title={sheetTitle}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={footerContent}
    />
  );
}
