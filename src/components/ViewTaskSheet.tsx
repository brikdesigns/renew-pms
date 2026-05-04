'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { Sheet, SheetSection, Button, Badge, ChecklistItem, Tag, Skeleton, useConfigureSheet, Field, FieldGrid, EmptyState, ProgressBar, SheetHelperText } from '@brikdesigns/bds';
import type { SheetTab } from '@brikdesigns/bds';
import { SheetSkeleton } from '@/components/SheetSkeleton';
import { useToast } from '@/components/ToastProvider';
import { gap, departmentColor } from '@/lib/tokens';
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
  // Assignment model — discriminator for which FK is set on the underlying
  // task. 'individual' tasks have a member assignee; 'pool' tasks have none.
  assignmentType: 'individual' | 'role' | 'department' | 'pool';
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
  /** When true, uses useConfigureSheet instead of rendering own Sheet (set by AppSheetProvider) */
  headless?: boolean;
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

// ─── Component ───────────────────────────────────────────────────────────────

export function ViewTaskSheet({ isOpen = true, onClose, task: taskProp, id, onTaskCompleted, onNavigate: _onNavigate, headless = false }: ViewTaskSheetProps) {
  const configureSheet = useConfigureSheet();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('details');
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [fetched, setFetched] = useState<TaskViewData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Global mode: fetch task + checklist in parallel when no data prop given
  const resolvedId = id ?? taskProp?.id;
  useEffect(() => {
    if (taskProp || !resolvedId) return;
    setFetchLoading(true);
    setLoadingItems(true);

    const taskFetch = fetch(`/api/tasks/${resolvedId}`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setFetched(data); return data; });

    const checklistFetch = fetch(`/api/tasks/${resolvedId}/checklist`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setItems(data); });

    Promise.allSettled([taskFetch, checklistFetch])
      .finally(() => { setFetchLoading(false); setLoadingItems(false); });
  }, [resolvedId, taskProp]);

  const task = taskProp ?? fetched;

  // Page-level mode: fetch checklist when sheet opens with task prop
  useEffect(() => {
    if (!taskProp || !isOpen) return;
    if (taskProp.checklistTotal === 0) return;

    setLoadingItems(true);
    fetch(`/api/tasks/${taskProp.id}/checklist`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setItems(data); })
      .catch(err => console.error('[ViewTaskSheet] failed to load checklist:', err))
      .finally(() => setLoadingItems(false));
  }, [isOpen, taskProp]);

  // Reset tab when task changes (id is the identity for "different task")
  useEffect(() => {
    if (task?.id) setActiveTab('details');
  }, [task?.id]);

  // ── Derived ──

  const pri = task ? (PRIORITY_DISPLAY[task.priority] ?? PRIORITY_DISPLAY.info) : PRIORITY_DISPLAY.info;
  const deptColors = task ? departmentColor(task.deptColor) : departmentColor('blue');
  const hasChecklist = task ? task.checklistTotal > 0 : false;
  const completedCount = items.filter(i => i.is_completed).length;
  const allDone = hasChecklist && items.length > 0 && completedCount === items.length;
  const progressPct = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  // ── Toggle single item ──

  const toggleItem = async (itemId: string, currentState: boolean) => {
    if (!task) return;
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
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, is_completed: currentState } : i));
      showToast({ title: 'Error', description: 'Failed to update checklist item', variant: 'error' });
    } finally {
      setToggling(prev => { const next = new Set(prev); next.delete(itemId); return next; });
    }
  };

  // ── Complete all remaining items ──

  const completeAll = async () => {
    if (!task) return;
    const remaining = items.filter(i => !i.is_completed);
    if (remaining.length === 0) return;

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
      const res = await fetch(`/api/tasks/${task.id}/checklist`);
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
      showToast({ title: 'Error', description: 'Failed to complete task', variant: 'error' });
    }
  };

  // ── Tab content builders ──

  const buildDetailsContent = (t: TaskViewData) => (
    <SheetSection heading="Task Details">
      {/* Assignment */}
      <FieldGrid columns={2} gap="lg">
        <Field label="Assigned To" empty="—">{t.assignee}</Field>
        {(() => {
          switch (t.assignmentType) {
            case 'role':       return <Field label="Assigned Role"       empty="—">{t.assignmentValue}</Field>;
            case 'department': return <Field label="Assigned Department" empty="—">{t.assignmentValue}</Field>;
            case 'individual': return <Field label="Assignment Type"     empty="—">Individual</Field>;
            case 'pool':
            default:           return <Field label="Assignment Type"     empty="—">Pool (All Staff)</Field>;
          }
        })()}
      </FieldGrid>

      {/* Schedule */}
      <FieldGrid columns={2} gap="lg">
        <Field label="Due" empty="—">{t.due}</Field>
        <Field label="Frequency" empty="—"><FrequencyTag value={t.freq} /></Field>
      </FieldGrid>

      {/* Classification */}
      <FieldGrid columns={2} gap="lg">
        <Field label="Task Type" empty="—">{TASK_TYPE_DISPLAY[t.taskType] ?? t.taskType}</Field>
        <Field label="Department" empty="—">
          {t.dept ? (
            <Tag size="sm" style={{ backgroundColor: deptColors.light, color: deptColors.text }}>{t.dept}</Tag>
          ) : null}
        </Field>
      </FieldGrid>

      {/* Context: Room & Equipment */}
      {(t.room || t.equipment) && (
        <FieldGrid columns={2} gap="lg">
          {t.room && <Field label="Room" empty="—">{t.room}</Field>}
          {t.equipment && <Field label="Equipment" empty="—">{t.equipment}</Field>}
        </FieldGrid>
      )}

      {/* Status & Priority */}
      <FieldGrid columns={2} gap="lg">
        <Field label="Priority" empty="—">
          <Badge status={pri.status} size="sm">{pri.label}</Badge>
        </Field>
        <Field label="Status" empty="—">
          <Badge status={allDone || t.checked ? 'positive' : 'warning'} size="sm">
            {allDone || t.checked ? 'Completed' : 'In Progress'}
          </Badge>
        </Field>
      </FieldGrid>
    </SheetSection>
  );

  const buildChecklistContent = () => (
    <SheetSection heading="Checklist Items">
      {items.length > 0 && (
        <>
          <ProgressBar value={progressPct} label="Checklist progress" />
          <SheetHelperText>{completedCount} of {items.length} completed</SheetHelperText>
        </>
      )}

      {loadingItems ? (
        <SheetHelperText>Loading checklist…</SheetHelperText>
      ) : items.length === 0 ? (
        <EmptyState title="No checklist items" description="This task has no checklist items." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xs }}>
          {items.map(item => (
            <ChecklistItem
              key={item.id}
              label={item.label}
              checked={item.is_completed}
              disabled={toggling.has(item.id)}
              onCheckedChange={() => toggleItem(item.id, item.is_completed)}
            />
          ))}
        </div>
      )}
    </SheetSection>
  );

  // ── Sheet config ──

  const buildTabs = (t: TaskViewData): SheetTab[] => {
    const tabs: SheetTab[] = [
      { id: 'details', label: 'Details', content: buildDetailsContent(t) },
    ];
    if (hasChecklist) {
      tabs.push({
        id: 'checklist',
        label: `Checklist (${completedCount}/${items.length || t.checklistTotal})`,
        content: buildChecklistContent(),
      });
    }
    return tabs;
  };

  const footer = (
    <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, justifyContent: 'flex-end' }}>
      <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>
      {hasChecklist && !allDone && (
        <Button variant="primary" size="md" type="button" onClick={completeAll}>
          Complete All
        </Button>
      )}
    </div>
  );

  // ── Headless mode: configure the stack's Sheet ────────────────────────────

  useLayoutEffect(() => {
    if (!headless) return;
    if (fetchLoading || !task) {
      configureSheet({
        body: <SheetSkeleton />,
        footer: <Button variant="ghost" size="md" onClick={onClose}>Close</Button>,
      });
      return;
    }
    configureSheet({
      title: task.title,
      description: task.templateName,
      tabs: buildTabs(task),
      activeTab,
      onTabChange: setActiveTab,
      footer,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headless, configureSheet, fetchLoading, task?.id, task?.title, activeTab, items.length, completedCount, loadingItems, onClose, onTaskCompleted]);

  if (headless) return null;

  // ── Page-level mode: render own Sheet ─────────────────────────────────────

  if (fetchLoading || !task) {
    return (
      <Sheet variant="floating" isOpen={isOpen} onClose={onClose} title={<Skeleton variant="text" width="160px" height={20} />} width="600px" side="right">
        <SheetSkeleton />
      </Sheet>
    );
  }

  return (
    <Sheet
      variant="floating"
      isOpen={isOpen}
      onClose={onClose}
      title={task.title}
      description={task.templateName}
      width="600px"
      side="right"
      tabs={buildTabs(task)}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={footer}
    />
  );
}
