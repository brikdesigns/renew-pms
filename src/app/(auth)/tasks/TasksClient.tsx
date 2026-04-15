'use client';

import { useState, useMemo, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { Board, BoardColumn, BoardCard } from '@brikdesigns/bds';
import { UserAvatar } from '@/components/UserAvatar';
import { Tag, Badge, Dot, AnimatedIcon, Tooltip, IconButton, SegmentedControl, useSheetStack } from '@brikdesigns/bds';
import checkCompleteAnimation from '@/animations/check-complete.json';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Button } from '@brikdesigns/bds';
import { TaskFilterBar } from '@/components/TaskFilterBar';
import { ViewTaskSheet, type TaskViewData } from '@/components/ViewTaskSheet';
import { AddTaskSheet } from '@/components/AddTaskSheet';
import { shadow, color, font, space, gap, border, departmentColor } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';
import { useTasks } from '@/hooks/useTasks';
import { usePoolTasks } from '@/hooks/usePoolTasks';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/components/ToastProvider';
import { TaskAssigneeAvatar } from '@/components/TaskAssigneeAvatar';
import { FrequencyTag } from '@/components/FrequencyTag';
import { PriorityBadge } from '@/components/PriorityBadge';

// ─── Task shape for the board ────────────────────────────────────────────────

interface MockTask {
  id: string;
  title: string;
  due: string;
  dept: string;
  freq: string;
  priority: 'critical' | 'error' | 'warning' | 'info';
  type: 'checklist' | 'procedure' | 'compliance' | 'skill_training' | 'onboarding' | 'request';
  template: string;
  overdue: boolean;
  status: string;
  assignmentType: 'role' | 'department';
  assignmentValue: string;
  room?: string;
  equipment?: string;
  checklistTotal: number;
  checklistCompleted: number;
}

// ─── Priority map ─────────────────────────────────────────────────────────────


const PRIORITY_FILTER_MAP: Record<string, string> = {
  'Critical': 'critical',
  'High': 'error',
  'Medium': 'warning',
  'Low': 'info',
};

const TYPE_FILTER_MAP: Record<string, string> = {
  'Checklist': 'checklist',
  'Procedure': 'procedure',
  'Compliance': 'compliance',
  'Skill Training': 'skill_training',
  'Onboarding': 'onboarding',
};

// ─── View toggle ─────────────────────────────────────────────────────────────

type TaskView = 'all' | 'mine' | 'open';

// ─── Status columns for Open Tasks view ─────────────────────────────────────

const STATUS_COLUMNS = [
  { id: 'open',            label: 'Open',            statuses: ['not_started'] },
  { id: 'in_progress',     label: 'In Progress',     statuses: ['in_progress'] },
  { id: 'needs_attention', label: 'Needs Attention',  statuses: ['blocked', 'overdue', 'awaiting_approval'] },
  { id: 'complete',        label: 'Complete',         statuses: ['completed', 'skipped'] },
] as const;

const STATUS_COLUMN_COLORS: Record<string, { dot: 'info' | 'positive' | 'warning' | 'error'; bg: string }> = {
  open:            { dot: 'info',    bg: color.surface.primary },
  in_progress:     { dot: 'positive', bg: color.surface.primary },
  needs_attention: { dot: 'warning', bg: color.surface.primary },
  complete:        { dot: 'positive', bg: color.surface.primary },
};

/** When dropping into a multi-status column, map to the primary DB status */
const DROP_STATUS_MAP: Record<string, string> = {
  open:            'not_started',
  in_progress:     'in_progress',
  needs_attention: 'blocked',
  complete:        'completed',
};

// ─── Open Tasks board column styles (drag states) ───────────────────────────

const poolColumnBase: CSSProperties = {
  backgroundColor: color.surface.primary,
  transition: 'outline 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
  outline: '2px solid transparent',
  outlineOffset: '-2px',
  borderRadius: border.radius.md,
};

const poolColumnDragActive: CSSProperties = {
  ...poolColumnBase,
  backgroundColor: color.surface.secondary,
  outline: `2px dashed ${color.border.muted}`,
};

const poolColumnDropTarget: CSSProperties = {
  ...poolColumnBase,
  backgroundColor: color.surface.muted,
  outline: `2px solid ${color.border.brand}`,
  boxShadow: shadow.md,
};

const TASK_VIEW_SEGMENTS = [
  { label: 'All Tasks', value: 'all' },
  { label: 'My Tasks', value: 'mine' },
  { label: 'Open Tasks', value: 'open' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapPriority(raw: string): 'critical' | 'error' | 'warning' | 'info' {
  if (raw === 'critical') return 'critical';
  if (raw === 'high') return 'error';
  if (raw === 'medium') return 'warning';
  return 'info';
}

function mapType(typeName: string | null): MockTask['type'] {
  const lower = (typeName ?? '').toLowerCase();
  if (lower === 'checklist') return 'checklist';
  if (lower === 'procedure') return 'procedure';
  if (lower === 'compliance') return 'compliance';
  if (lower === 'skill training') return 'skill_training';
  if (lower === 'onboarding') return 'onboarding';
  return 'checklist';
}

function formatDue(dueDate: string | null, isOverdue: boolean): string {
  if (!dueDate) return 'Due today';
  if (isOverdue) return 'Due yesterday';
  return 'Due today';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function shiftDate(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// ─── Checklist progress tag ──────────────────────────────────────────────────

function ChecklistProgress({ completed, total }: { completed: number; total: number }) {
  if (total === 0) return null;
  return (
    <Tooltip content={`${completed} of ${total} items done`} placement="top">
      <Tag size="sm" icon={<Icon icon={icon.typeChecklist} />} style={{ backgroundColor: color.surface.secondary, color: color.text.secondary, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {completed}/{total}
      </Tag>
    </Tooltip>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface TasksClientProps {
  canAddTask: boolean;
  currentMemberId: string | null;
}

const ADD_TASK_TYPES = [
  { id: 'checklist',      label: 'Checklist',  desc: 'Recurring to-do lists',    icon: icon.typeChecklist },
  { id: 'procedure',      label: 'Procedure',  desc: 'Step-by-step workflows',   icon: icon.typeProcedure },
  { id: 'compliance',     label: 'Compliance', desc: 'Regulatory & safety tasks', icon: icon.typeCompliance },
  { id: 'onboarding',     label: 'Onboarding', desc: 'New employee orientation', icon: icon.typeOnboarding },
  { id: 'skill_training', label: 'Training',   desc: 'Continuing education',     icon: icon.typeSkillTraining },
] as const;

export default function TasksClient({ canAddTask, currentMemberId }: TasksClientProps) {
  const { pushSheet } = useSheetStack();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [taskView, setTaskView] = useState<TaskView>('all');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedFrequency, setSelectedFrequency] = useState('All Frequencies');
  const [selectedPriority, setSelectedPriority] = useState('All Priorities');
  const [selectedType, setSelectedType] = useState('All Types');
  const [showResolved, setShowResolved] = useState(false);
  const [showOverdue, setShowOverdue] = useState(false);
  const [viewingTask, setViewingTask] = useState<TaskViewData | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addTaskType, setAddTaskType] = useState('');
  const addBtnRef = useRef<HTMLDivElement>(null);

  // ── Drag-and-drop state (Open Tasks board) ────────────────────────────────
  const [poolDraggingId, setPoolDraggingId] = useState<string | null>(null);
  const [poolDropTarget, setPoolDropTarget] = useState<string | null>(null);
  const poolIsDragging = useRef(false);

  // Close add menu on outside click
  useEffect(() => {
    if (!addMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (addBtnRef.current && !addBtnRef.current.contains(e.target as Node)) setAddMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addMenuOpen]);

  const { departments } = useDepartments();
  const { members } = useMembers();
  const { tasks: assignedTasks, refetch: refetchAssigned } = useTasks(selectedDate);
  const { tasks: poolTasks, refetch: refetchPool } = usePoolTasks(selectedDate);

  const refetchAll = () => { refetchAssigned(); refetchPool(); };
  const { showToast } = useToast();

  const deptColorMap = useMemo(
    () => new Map(departments.map((d) => [d.name, d.color])),
    [departments]
  );
  const getDeptColors = (deptName: string) => departmentColor(deptColorMap.get(deptName) ?? 'blue');

  // ── Drag-and-drop handlers (Open Tasks board) ─────────────────────────────

  const handlePoolDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    poolIsDragging.current = true;
    setPoolDraggingId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    const card = e.currentTarget;
    card.classList.add('bds-board-card--drag-preview');
    requestAnimationFrame(() => { card.classList.remove('bds-board-card--drag-preview'); });
  }, []);

  const handlePoolDragEnd = useCallback(() => {
    setPoolDraggingId(null);
    setPoolDropTarget(null);
    setTimeout(() => { poolIsDragging.current = false; }, 0);
  }, []);

  const handlePoolDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handlePoolDragEnter = useCallback((_e: React.DragEvent<HTMLDivElement>, colId: string) => {
    setPoolDropTarget(colId);
  }, []);

  const handlePoolDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>, colId: string) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setPoolDropTarget(prev => prev === colId ? null : prev);
  }, []);

  const handlePoolDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    setPoolDraggingId(null);
    setPoolDropTarget(null);

    if (!taskId) return;
    const task = poolTasks.find(t => t.id === taskId);
    if (!task) return;

    const targetStatus = DROP_STATUS_MAP[targetColId];
    const targetCol = STATUS_COLUMNS.find(c => c.id === targetColId);
    if (!targetStatus || !targetCol) return;

    // Skip if already in target column
    if ((targetCol.statuses as readonly string[]).includes(task.status)) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to update status');
      }
      showToast({ title: 'Status updated', description: `Moved to ${targetCol.label}.`, variant: 'success' });
      refetchPool();
    } catch (err) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update status', variant: 'error' });
    }
  }, [poolTasks, refetchPool, showToast]);

  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const hasActiveFilters = selectedDepartment !== 'All Departments'
    || selectedFrequency !== 'All Frequencies'
    || selectedPriority !== 'All Priorities'
    || selectedType !== 'All Types'
    || showResolved
    || showOverdue;

  // ── Map raw task data to MockTask ──────────────────────────────────────────

  function toMockTask(t: typeof assignedTasks[number]): MockTask {
    const isOverdue = t.status === 'overdue';
    return {
      id: t.id,
      title: t.title,
      due: formatDue(t.due_date, isOverdue),
      dept: t.member_department,
      freq: t.frequency ?? 'Daily',
      priority: mapPriority(t.priority),
      type: mapType(t.type_name),
      template: t.type_name ?? 'Task',
      overdue: isOverdue,
      status: t.status,
      assignmentType: t.assigned_role_id ? 'role' : 'department',
      assignmentValue: t.member_role,
      room: t.room_name ?? undefined,
      equipment: t.equipment_name ?? undefined,
      checklistTotal: t.checklist_total ?? 0,
      checklistCompleted: t.checklist_completed ?? 0,
    };
  }

  // ── Build "All Tasks" board (grouped by person) ────────────────────────────

  const assignedBoard = useMemo(() => {
    const byMember = new Map<string, typeof assignedTasks>();
    for (const task of assignedTasks) {
      const existing = byMember.get(task.assigned_to) ?? [];
      existing.push(task);
      byMember.set(task.assigned_to, existing);
    }

    return Array.from(byMember.entries()).map(([, memberTasks]) => {
      const first = memberTasks[0];
      const person = {
        name: `${first.member_first_name} ${first.member_last_name}`.trim(),
        subtitle: first.member_role,
        department: first.member_department,
        departmentColor: first.member_department_color,
      };
      return { person, tasks: memberTasks.map(toMockTask) };
    });
  }, [assignedTasks]);

  // ── Build "Open Tasks" board (grouped by status) ──────────────────────────

  const poolBoard = useMemo(() => {
    const mapped = poolTasks.map(toMockTask);
    return STATUS_COLUMNS.map((col) => {
      const colTasks = mapped.filter((t) => (col.statuses as readonly string[]).includes(t.status));
      return { ...col, tasks: colTasks };
    });
  }, [poolTasks]);

  // ── Apply filters (shared logic) ──────────────────────────────────────────

  function applyFilters(tasks: MockTask[]): MockTask[] {
    return tasks.filter((t) => {
      if (!showResolved && checked[t.id]) return false;
      if (selectedDepartment !== 'All Departments' && t.dept !== selectedDepartment) return false;
      if (selectedFrequency !== 'All Frequencies' && t.freq !== selectedFrequency) return false;
      if (selectedPriority !== 'All Priorities' && t.priority !== PRIORITY_FILTER_MAP[selectedPriority]) return false;
      if (selectedType !== 'All Types' && t.type !== TYPE_FILTER_MAP[selectedType]) return false;
      if (showOverdue && !t.overdue) return false;
      return true;
    });
  }

  // ── Filtered "All Tasks" board ─────────────────────────────────────────────

  const filteredAssignedBoard = assignedBoard
    .map((col) => {
      const colors = getDeptColors(col.person.department);
      const totalTasks = col.tasks.length;
      const completedTasks = col.tasks.filter((t) => checked[t.id]).length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const filtered = applyFilters(col.tasks);
      const sorted = [...filtered].sort((a, b) => {
        if (a.overdue && !b.overdue) return -1;
        if (!a.overdue && b.overdue) return 1;
        return 0;
      });
      return { ...col, deptColors: colors, progress, tasks: sorted };
    })
    .filter((col) => col.tasks.length > 0);

  // ── Filtered "My Tasks" board (current user only) ─────────────────────────

  const filteredMyBoard = filteredAssignedBoard.filter(
    (col) => assignedTasks.some(
      (t) => t.assigned_to === currentMemberId
        && `${t.member_first_name} ${t.member_last_name}`.trim() === col.person.name
    )
  );

  // ── Filtered "Open Tasks" board ────────────────────────────────────────────

  const filteredPoolBoard = poolBoard.map((col) => ({
    ...col,
    tasks: applyFilters(col.tasks),
  }));

  // ── Build task view data for sheet ─────────────────────────────────────────

  function buildTaskViewData(task: MockTask, assignee?: string, assigneeRole?: string): TaskViewData {
    return {
      id: task.id,
      title: task.title,
      templateName: task.template,
      taskType: task.type,
      due: task.due,
      dept: task.dept,
      deptColor: deptColorMap.get(task.dept) ?? 'blue',
      freq: task.freq,
      priority: task.priority,
      assignee: assignee ?? 'Unassigned',
      assigneeRole: assigneeRole ?? '',
      checked: !!checked[task.id],
      assignmentType: task.assignmentType,
      assignmentValue: task.assignmentValue,
      room: task.room,
      equipment: task.equipment,
      checklistTotal: task.checklistTotal,
      checklistCompleted: task.checklistCompleted,
    };
  }

  // ── Render a task card (shared between both views) ─────────────────────────

  function renderTaskCard(task: MockTask, accentColor: string, assignee?: string, assigneeRole?: string, pool = false) {
    const taskDeptColors = getDeptColors(task.dept);
    const isOverdue = task.overdue && !checked[task.id];

    return (
      <BoardCard
        key={task.id}
        title={task.title}
        subtitle={task.due}
        accentColor={accentColor}
        checked={!!checked[task.id]}
        onCheckedChange={() => toggle(task.id)}
        onClick={() => setViewingTask(buildTaskViewData(task, assignee, assigneeRole))}
        style={isOverdue
          ? { backgroundColor: color.surface.warning, '--text-primary': 'var(--color-pure-black)', boxShadow: shadow.sm, cursor: 'pointer' } as React.CSSProperties // token-audit-ignore — CSS custom property override
          : { backgroundColor: color.surface.overlay, boxShadow: shadow.sm, cursor: 'pointer' }
        }
        tags={pool ? (
          <>
            <FrequencyTag value={task.freq} />
            {isOverdue && (
              <Tooltip content="Overdue" placement="top">
                <Badge status="warning" size="xs" variant="dark" icon={<Icon icon={icon.overdue} />} style={{ flexShrink: 0, width: 28, height: 28 }} />
              </Tooltip>
            )}
          </>
        ) : (
          <>
            {task.dept && <Tag size="sm" style={{ backgroundColor: taskDeptColors.light, color: taskDeptColors.text, flexShrink: 0 }}>{task.dept}</Tag>}
            <FrequencyTag value={task.freq} />
            <ChecklistProgress completed={task.checklistCompleted} total={task.checklistTotal} />
            {isOverdue && (
              <Tooltip content="Overdue" placement="top">
                <Badge status="warning" size="xs" variant="dark" icon={<Icon icon={icon.overdue} />} style={{ flexShrink: 0, width: 28, height: 28 }} />
              </Tooltip>
            )}
          </>
        )}
        trailingTag={pool ? (
          checked[task.id] ? (
            <AnimatedIcon
              key={`check-${task.id}-done`}
              animationData={checkCompleteAnimation}
              trigger="once"
              size={20}
              label="Completed"
            />
          ) : (
            <Tooltip content="Unassigned" placement="top">
              <div style={{
                width: 28, height: 28, borderRadius: border.radius.pill,
                backgroundColor: color.surface.secondary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon icon={icon.profile} style={{ fontSize: font.size.body.sm, color: color.text.muted } as React.CSSProperties & Record<string, string>} />
              </div>
            </Tooltip>
          )
        ) : (
          checked[task.id] ? (
            <AnimatedIcon
              key={`check-${task.id}-done`}
              animationData={checkCompleteAnimation}
              trigger="once"
              size={20}
              label="Completed"
            />
          ) : (
            <PriorityBadge priority={task.priority} iconOnly />
          )
        )}
      />
    );
  }

  // ── Render a draggable pool task card ─────────────────────────────────────

  function renderPoolDragCard(task: MockTask, isBeingDragged: boolean, isDragMode: boolean) {
    const isOverdue = task.overdue && !checked[task.id];
    const rawTask = poolTasks.find(t => t.id === task.id);
    const assigneeName = rawTask?.member_first_name
      ? `${rawTask.member_first_name} ${rawTask.member_last_name}`.trim()
      : null;
    return (
      <BoardCard
        key={task.id}
        title={task.title}
        subtitle={task.due}
        accentColor={color.surface.secondary}
        checked={!!checked[task.id]}
        onCheckedChange={() => toggle(task.id)}
        onClick={() => { if (!poolIsDragging.current) setViewingTask(buildTaskViewData(task)); }}
        draggable
        onDragStart={(e: React.DragEvent<HTMLDivElement>) => handlePoolDragStart(e, task.id)}
        onDragEnd={handlePoolDragEnd}
        style={{
          ...(isOverdue
            ? { backgroundColor: color.surface.warning, '--text-primary': 'var(--color-pure-black)' } as React.CSSProperties // token-audit-ignore — CSS custom property override
            : { backgroundColor: color.surface.overlay }
          ),
          boxShadow: isBeingDragged ? 'none' : shadow.sm,
          cursor: isDragMode ? 'grabbing' : 'grab',
          ...(isBeingDragged ? { opacity: 0.3, transform: 'scale(0.97)' } : {}),
          transition: 'opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
        }}
        tags={
          <>
            <FrequencyTag value={task.freq} />
            {isOverdue && (
              <Tooltip content="Overdue" placement="top">
                <Badge status="warning" size="xs" variant="dark" icon={<Icon icon={icon.overdue} />} style={{ flexShrink: 0, width: 28, height: 28 }} />
              </Tooltip>
            )}
          </>
        }
        trailingTag={
          checked[task.id] ? (
            <AnimatedIcon
              key={`check-${task.id}-done`}
              animationData={checkCompleteAnimation}
              trigger="once"
              size={20}
              label="Completed"
            />
          ) : (
            <TaskAssigneeAvatar
              taskId={task.id}
              assigneeName={assigneeName}
              assigneeDepartmentColor={rawTask?.member_department_color}
              members={members}
              onAssigned={refetchPool}
            />
          )
        }
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 96px)' }}>
      {/* ── Unified toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: space.xl, padding: `${space.sm} ${space.xl} ${space.sm} 0` }}>
        {/* Left: view toggle */}
        <SegmentedControl
          items={TASK_VIEW_SEGMENTS}
          value={taskView}
          onChange={(v) => setTaskView(v as TaskView)}
          size="sm"
        />

        {/* Center: date picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm }}>
          <IconButton variant="ghost" size="sm" icon={<Icon icon={icon.chevronLeft} />} label="Previous day" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))} />
          <span style={{
            fontFamily: font.family.label,
            fontSize: font.size.label.md,
            fontWeight: font.weight.semibold,
            color: color.text.primary,
            whiteSpace: 'nowrap',
          }}>
            {formatDate(selectedDate)}
          </span>
          <IconButton variant="ghost" size="sm" icon={<Icon icon={icon.chevronRight} />} label="Next day" onClick={() => setSelectedDate(shiftDate(selectedDate, 1))} />
        </div>

        {/* Right: filter toggle + add task */}
        <div style={{ display: 'flex', alignItems: 'center', gap: gap.md }}>
          <IconButton
            variant="secondary"
            size="sm"
            icon={<Icon icon={icon.filter} />}
            label="Toggle filters"
            onClick={() => setFiltersVisible((p) => !p)}
            style={hasActiveFilters ? { backgroundColor: color.surface.accent, color: color.text.brand } : undefined}
          />
          {canAddTask && (
            <div ref={addBtnRef} style={{ position: 'relative', flexShrink: 0 }}>
              <Button variant="primary" size="sm" iconAfter={<Icon icon={icon.chevronDown} />} onClick={() => setAddMenuOpen(p => !p)}>
                Add Task
              </Button>
              {addMenuOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 100,
                  backgroundColor: color.surface.primary, borderRadius: border.radius.md,
                  border: `1px solid ${color.border.muted}`, boxShadow: shadow.md,
                  minWidth: 260, overflow: 'hidden',
                }}>
                  {ADD_TASK_TYPES.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => { setAddTaskType(t.id); setAddSheetOpen(true); setAddMenuOpen(false); }}
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
                      <Icon icon={t.icon} style={{ width: 16, color: color.text.brand }} />
                      <div>
                        <div style={{ fontWeight: font.weight.semibold }}>{t.label}</div>
                        <div style={{ fontSize: font.size.body.xs, color: color.text.secondary }}>{t.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Collapsible filter chips ── */}
      {filtersVisible && (
        <div style={{ paddingRight: space.xl, paddingBottom: space.sm }}>
          <TaskFilterBar
            selectedDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
            selectedFrequency={selectedFrequency}
            onFrequencyChange={setSelectedFrequency}
            selectedPriority={selectedPriority}
            onPriorityChange={setSelectedPriority}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            showResolved={showResolved}
            onShowResolvedChange={setShowResolved}
            showOverdue={showOverdue}
            onShowOverdueChange={setShowOverdue}
          />
        </div>
      )}

      {/* ── Board ── */}
      {taskView === 'mine' && filteredMyBoard.length === 0 ? (
        /* My Tasks — empty state */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: gap.lg, minHeight: '40vh' }}>
          <h2 style={{ fontFamily: font.family.heading, fontSize: font.size.heading.medium, fontWeight: font.weight.bold, color: color.text.primary, margin: 0 }}>
            No Tasks Assigned
          </h2>
          <p style={{ fontFamily: font.family.body, fontSize: font.size.body.md, color: color.text.secondary, textAlign: 'center', maxWidth: '400px', lineHeight: font.lineHeight.normal, margin: 0 }}>
            You don&apos;t have any tasks assigned for this date. Check back later or switch to All Tasks to see what&apos;s happening across the team.
          </p>
        </div>
      ) : (taskView === 'all' || taskView === 'mine') ? (
        /* All Tasks / My Tasks — person-based columns */
        <Board style={{ flex: 1, minHeight: 0 }}>
          {(taskView === 'mine' ? filteredMyBoard : filteredAssignedBoard).map((col) => {
            const overdueTasks = col.tasks.filter((t) => t.overdue && !checked[t.id]);
            const normalTasks = col.tasks.filter((t) => !t.overdue || checked[t.id]);

            return (
              <BoardColumn key={col.person.name} style={{ backgroundColor: color.surface.primary } as React.CSSProperties}>
                <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, padding: `${space.md} 0` }}>
                  <UserAvatar name={col.person.name} departmentColorKey={col.person.departmentColor} size="lg" />
                  <div>
                    <div style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.bold, lineHeight: 'normal', color: color.text.primary }}>{col.person.name}</div>
                    <div style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.regular, lineHeight: 'normal', color: color.text.primary }}>{col.person.subtitle}</div>
                  </div>
                </div>
                {overdueTasks.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: gap.sm }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: gap.xs, paddingInline: space.sm }}>
                      <Dot status="warning" size="sm" pulse />
                      <span style={{ fontFamily: font.family.subtitle, fontSize: font.size.subtitle.md, fontWeight: font.weight.semibold, color: color.text.negative }}>Overdue</span>
                    </div>
                    {overdueTasks.map((task) => renderTaskCard(task, col.deptColors.light, col.person.name, col.person.subtitle))}
                  </div>
                )}
                {normalTasks.map((task) => renderTaskCard(task, col.deptColors.light, col.person.name, col.person.subtitle))}
              </BoardColumn>
            );
          })}
        </Board>
      ) : (
        /* Open Tasks — status-based columns for pool tasks (drag-and-drop enabled) */
        <Board style={{ flex: 1, minHeight: 0 }}>
          {filteredPoolBoard.map((col) => {
            const colColors = STATUS_COLUMN_COLORS[col.id];
            const isDropTarget = poolDropTarget === col.id;
            const isDragMode = poolDraggingId !== null;
            const colStyle = isDropTarget
              ? poolColumnDropTarget
              : isDragMode
                ? poolColumnDragActive
                : poolColumnBase;

            return (
              <BoardColumn
                key={col.id}
                style={colStyle}
                onDragOver={handlePoolDragOver}
                onDragEnter={(e: React.DragEvent<HTMLDivElement>) => handlePoolDragEnter(e, col.id)}
                onDragLeave={(e: React.DragEvent<HTMLDivElement>) => handlePoolDragLeave(e, col.id)}
                onDrop={(e: React.DragEvent<HTMLDivElement>) => handlePoolDrop(e, col.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm, padding: `${space.md} 0` }}>
                  <Dot status={colColors.dot} size="sm" />
                  <span style={{
                    fontFamily: font.family.label,
                    fontSize: font.size.label.md,
                    fontWeight: font.weight.bold,
                    color: color.text.primary,
                  }}>
                    {col.label}
                  </span>
                  {col.tasks.length > 0 && (
                    <span style={{
                      fontFamily: font.family.label,
                      fontSize: font.size.body.xs,
                      fontWeight: font.weight.medium,
                      color: color.text.secondary,
                      backgroundColor: color.surface.secondary,
                      padding: `2px ${gap.md}`,
                      borderRadius: border.radius.sm,
                    }}>
                      {col.tasks.length}
                    </span>
                  )}
                </div>
                {col.tasks.map((task) => {
                  const isBeingDragged = poolDraggingId === task.id;
                  return renderPoolDragCard(task, isBeingDragged, isDragMode);
                })}
                {col.tasks.length === 0 && !isDragMode && (
                  <div style={{ padding: space.lg, textAlign: 'center', color: color.text.muted, fontSize: font.size.body.sm, fontFamily: font.family.body }}>
                    No tasks
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
                    marginTop: col.tasks.length > 0 ? space.sm : '0',
                  }}>
                    Drop to move to {col.label}
                  </div>
                )}
              </BoardColumn>
            );
          })}
        </Board>
      )}

      <ViewTaskSheet
        isOpen={viewingTask !== null}
        onClose={() => setViewingTask(null)}
        task={viewingTask}
        onTaskCompleted={() => { refetchAll(); setViewingTask(null); }}
        onNavigate={(type, props, opts) => pushSheet(type, props, opts)}
      />
      <AddTaskSheet
        isOpen={addSheetOpen}
        onClose={() => { setAddSheetOpen(false); setAddTaskType(''); }}
        onSaved={refetchAll}
      />
    </div>
  );
}
