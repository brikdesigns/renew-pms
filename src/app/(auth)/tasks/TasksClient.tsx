'use client';

import { useState, useMemo, useRef, useEffect, type CSSProperties } from 'react';
import { Board, BoardColumn, BoardCard } from '@bds/components';
import { UserAvatar } from '@/components/UserAvatar';
import { Tag, Badge, Dot, AnimatedIcon, Tooltip, IconButton } from '@bds/components';
import checkCompleteAnimation from '@/animations/check-complete.json';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Button } from '@bds/components';
import { TaskFilterBar } from '@/components/TaskFilterBar';
import { ViewTaskSheet, type TaskViewData } from '@/components/ViewTaskSheet';
import { AddTaskSheet } from '@/components/AddTaskSheet';
import { shadow, color, font, space, gap, border, departmentColor } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';
import { useTasks } from '@/hooks/useTasks';
import { usePoolTasks } from '@/hooks/usePoolTasks';

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

const PRIORITY_MAP: Record<string, { status: 'positive' | 'warning' | 'error' | 'info'; label: string; icon: string }> = {
  critical: { status: 'error',   label: 'Critical', icon: icon.priorityCritical },
  error:    { status: 'error',   label: 'High',     icon: icon.priorityHigh },
  warning:  { status: 'warning', label: 'Medium',   icon: icon.priorityWarning },
  info:     { status: 'info',    label: 'Low',      icon: icon.priorityInfo },
};

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

type TaskView = 'all' | 'open';

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

// ─── Segmented control styles (matches Contacts page) ───────────────────────

const segmentBarStyle: CSSProperties = {
  display: 'flex', gap: gap.xs, backgroundColor: color.surface.secondary,
  borderRadius: border.radius.sm, padding: '2px',
};

const segmentBtnStyle = (active: boolean): CSSProperties => ({
  padding: `${space.xs} ${space.md}`,
  borderRadius: border.radius.xs,
  border: 'none',
  cursor: 'pointer',
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: active ? font.weight.semibold : font.weight.medium,
  color: active ? color.text.primary : color.text.secondary,
  backgroundColor: active ? color.surface.primary : 'transparent',
  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
  transition: 'all 0.15s ease',
});

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
      <Tag size="sm" style={{ backgroundColor: color.surface.secondary, color: color.text.secondary, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        <Icon icon={icon.typeChecklist} style={{ fontSize: font.size.body.xs } as React.CSSProperties & Record<string, string>} />
        {completed}/{total}
      </Tag>
    </Tooltip>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface TasksClientProps {
  canAddTask: boolean;
}

const ADD_TASK_TYPES = [
  { id: 'checklist',      label: 'Checklist',  desc: 'Recurring to-do lists',    icon: icon.typeChecklist },
  { id: 'procedure',      label: 'Procedure',  desc: 'Step-by-step workflows',   icon: icon.typeProcedure },
  { id: 'compliance',     label: 'Compliance', desc: 'Regulatory & safety tasks', icon: icon.typeCompliance },
  { id: 'onboarding',     label: 'Onboarding', desc: 'New employee orientation', icon: icon.typeOnboarding },
  { id: 'skill_training', label: 'Training',   desc: 'Continuing education',     icon: icon.typeSkillTraining },
] as const;

export default function TasksClient({ canAddTask }: TasksClientProps) {
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
  const { tasks: assignedTasks, refetch: refetchAssigned } = useTasks(selectedDate);
  const { tasks: poolTasks, refetch: refetchPool } = usePoolTasks(selectedDate);

  const refetchAll = () => { refetchAssigned(); refetchPool(); };

  const deptColorMap = useMemo(
    () => new Map(departments.map((d) => [d.name, d.color])),
    [departments]
  );
  const getDeptColors = (deptName: string) => departmentColor(deptColorMap.get(deptName) ?? 'blue');

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
    const pri = PRIORITY_MAP[task.priority];
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
            <Tag size="sm" style={{ backgroundColor: color.surface.secondary, color: color.text.secondary, flexShrink: 0 }}>{task.freq}</Tag>
            {isOverdue && (
              <Tooltip content="Overdue" placement="top">
                <Badge status="warning" size="xs" variant="dark" icon={<Icon icon={icon.overdue} />} style={{ flexShrink: 0 }} />
              </Tooltip>
            )}
          </>
        ) : (
          <>
            <Tag size="sm" style={{ backgroundColor: taskDeptColors.light, color: taskDeptColors.text, flexShrink: 0 }}>{task.dept}</Tag>
            <Tag size="sm" style={{ backgroundColor: color.surface.secondary, color: color.text.secondary, flexShrink: 0 }}>{task.freq}</Tag>
            <ChecklistProgress completed={task.checklistCompleted} total={task.checklistTotal} />
            {isOverdue && (
              <Tooltip content="Overdue" placement="top">
                <Badge status="warning" size="xs" variant="dark" icon={<Icon icon={icon.overdue} />} style={{ flexShrink: 0 }} />
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
            <div style={{
              width: 28, height: 28, borderRadius: border.radius.pill,
              backgroundColor: color.surface.secondary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon icon={icon.profile} style={{ fontSize: '14px', color: color.text.muted } as React.CSSProperties & Record<string, string>} />
            </div>
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
            <Tooltip content={pri.label} placement="top">
              <Badge status={pri.status} size="xs" variant="dark" icon={<Icon icon={pri.icon} />} style={{ flexShrink: 0 }} />
            </Tooltip>
          )
        )}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 96px)' }}>
      {/* ── Unified toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: space.xl, padding: `${space.sm} ${space.xl} ${space.sm} 0` }}>
        {/* Left: view toggle */}
        <div style={segmentBarStyle}>
          <button type="button" style={segmentBtnStyle(taskView === 'all')} onClick={() => setTaskView('all')}>All Tasks</button>
          <button type="button" style={segmentBtnStyle(taskView === 'open')} onClick={() => setTaskView('open')}>Open Tasks</button>
        </div>

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
      {taskView === 'all' ? (
        /* All Tasks — person-based columns */
        <Board style={{ flex: 1, minHeight: 0 }}>
          {filteredAssignedBoard.map((col) => {
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
        /* Open Tasks — status-based columns for pool tasks */
        <Board style={{ flex: 1, minHeight: 0 }}>
          {filteredPoolBoard.map((col) => {
            const colStyle = STATUS_COLUMN_COLORS[col.id];
            return (
              <BoardColumn key={col.id} style={{ backgroundColor: colStyle.bg } as React.CSSProperties}>
                <div style={{ display: 'flex', alignItems: 'center', gap: gap.sm, padding: `${space.md} 0` }}>
                  <Dot status={colStyle.dot} size="sm" />
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
                {col.tasks.map((task) => renderTaskCard(task, color.surface.secondary, undefined, undefined, true))}
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
      />
      <AddTaskSheet
        isOpen={addSheetOpen}
        onClose={() => { setAddSheetOpen(false); setAddTaskType(''); }}
        onSaved={refetchAll}
      />
    </div>
  );
}
