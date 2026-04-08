'use client';

import { useState, useMemo } from 'react';
import { Board, BoardColumn, BoardCard } from '@bds/components';
import { UserAvatar } from '@/components/UserAvatar';
import { Tag, Badge, Dot, AnimatedIcon, Tooltip } from '@bds/components';
import checkCompleteAnimation from '@/animations/check-complete.json';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Button } from '@bds/components';
import { TaskFilterBar } from '@/components/TaskFilterBar';
import { ViewTaskSheet, type TaskViewData } from '@/components/ViewTaskSheet';
import { AddTaskSheet } from '@/components/AddTaskSheet';
import { shadow, color, font, space, gap, departmentColor } from '@/lib/tokens';
import { useDepartments } from '@/hooks/useDepartments';
import { useTasks } from '@/hooks/useTasks';

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
  // Assignment (one of these — mirrors DB: assigned_to, assigned_role, assigned_department)
  assignmentType: 'role' | 'department';
  assignmentValue: string;
  // Context relations (nullable — mirrors DB FKs)
  room?: string;
  equipment?: string;
  // Checklist progress (nested subtasks)
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

// Map filter labels back to task data values
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

export default function TasksClient({ canAddTask }: TasksClientProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedFrequency, setSelectedFrequency] = useState('All Frequencies');
  const [selectedPriority, setSelectedPriority] = useState('All Priorities');
  const [selectedType, setSelectedType] = useState('All Types');
  const [showResolved, setShowResolved] = useState(false);
  const [showOverdue, setShowOverdue] = useState(false);
  const [viewingTask, setViewingTask] = useState<TaskViewData | null>(null);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const { departments } = useDepartments();
  const { tasks, refetch } = useTasks(selectedDate);

  const deptColorMap = useMemo(
    () => new Map(departments.map((d) => [d.name, d.color])),
    [departments]
  );
  const getDeptColors = (deptName: string) => departmentColor(deptColorMap.get(deptName) ?? 'blue');

  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Build board columns from real task data ──────────────────────────────

  const board = useMemo(() => {
    // Group by assigned_to member ID
    const byMember = new Map<string, typeof tasks>();
    for (const task of tasks) {
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
      const mappedTasks: MockTask[] = memberTasks.map((t) => {
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
          assignmentType: t.assigned_role_id ? 'role' : 'department',
          assignmentValue: t.member_role,
          room: t.room_name ?? undefined,
          equipment: t.equipment_name ?? undefined,
          checklistTotal: t.checklist_total ?? 0,
          checklistCompleted: t.checklist_completed ?? 0,
        };
      });
      return { person, tasks: mappedTasks };
    });
  }, [tasks]);

  // ── Apply filters ─────────────────────────────────────────────────────────

  const filteredBoard = board
    .map((col) => {
      const colors = getDeptColors(col.person.department);
      const totalTasks = col.tasks.length;
      const completedTasks = col.tasks.filter((t) => checked[t.id]).length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const filtered = col.tasks.filter((t) => {
        if (!showResolved && checked[t.id]) return false;
        if (selectedDepartment !== 'All Departments' && t.dept !== selectedDepartment) return false;
        if (selectedFrequency !== 'All Frequencies' && t.freq !== selectedFrequency) return false;
        if (selectedPriority !== 'All Priorities' && t.priority !== PRIORITY_FILTER_MAP[selectedPriority]) return false;
        if (selectedType !== 'All Types' && t.type !== TYPE_FILTER_MAP[selectedType]) return false;
        if (showOverdue && !t.overdue) return false;
        return true;
      });
      // Sort overdue tasks to top
      const sorted = [...filtered].sort((a, b) => {
        if (a.overdue && !b.overdue) return -1;
        if (!a.overdue && b.overdue) return 1;
        return 0;
      });
      return { ...col, deptColors: colors, progress, tasks: sorted };
    })
    .filter((col) => col.tasks.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 96px)' }}>
      <div style={{ paddingRight: space.xl, display: 'flex', alignItems: 'center', gap: gap.md }}>
      <TaskFilterBar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
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
      {canAddTask && <Button variant="primary" size="sm" onClick={() => setAddSheetOpen(true)} style={{ flexShrink: 0 }}>Add Task</Button>}
      </div>
      <Board style={{ flex: 1, minHeight: 0 }}>
      {filteredBoard.map((col) => {
        const overdueTasks = col.tasks.filter((t) => t.overdue && !checked[t.id]);
        const normalTasks = col.tasks.filter((t) => !t.overdue || checked[t.id]);

        return (
          <BoardColumn key={col.person.name} style={{ backgroundColor: color.surface.primary } as React.CSSProperties}>
            {/* Title block — matches TrainingCard person row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: gap.md, padding: `${space.md} 0` }}>
              <UserAvatar
                name={col.person.name}
                departmentColorKey={col.person.departmentColor}
                size="lg"
              />
              <div>
                <div style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.bold, lineHeight: 'normal', color: color.text.primary }}>{col.person.name}</div>
                <div style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.regular, lineHeight: 'normal', color: color.text.primary }}>{col.person.subtitle}</div>
              </div>
            </div>
            {/* Overdue partition */}
            {overdueTasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: gap.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: gap.xs, paddingInline: space.sm }}>
                  <Dot status="warning" size="sm" pulse />
                  <span style={{ fontFamily: font.family.subtitle, fontSize: font.size.subtitle.md, fontWeight: font.weight.semibold, color: color.text.negative }}>Overdue</span>
                </div>
                {overdueTasks.map((task) => {
                  const pri = PRIORITY_MAP[task.priority];
                  const taskDeptColors = getDeptColors(task.dept);
                  return (
                    <BoardCard
                      key={task.id}
                      title={task.title}
                      subtitle={task.due}
                      accentColor={col.deptColors.light}
                      checked={!!checked[task.id]}
                      onCheckedChange={() => toggle(task.id)}
                      onClick={() => setViewingTask({
                        id: task.id,
                        title: task.title,
                        templateName: task.template,
                        taskType: task.type,
                        due: task.due,
                        dept: task.dept,
                        deptColor: deptColorMap.get(task.dept) ?? 'blue',
                        freq: task.freq,
                        priority: task.priority,
                        assignee: col.person.name,
                        assigneeRole: col.person.subtitle,
                        checked: !!checked[task.id],
                        assignmentType: task.assignmentType,
                        assignmentValue: task.assignmentValue,
                        room: task.room,
                        equipment: task.equipment,
                      })}
                      style={{ backgroundColor: color.surface.warning, '--text-primary': 'var(--color-pure-black)', boxShadow: shadow.sm, cursor: 'pointer' } as React.CSSProperties} // token-audit-ignore — CSS custom property override
                      tags={
                        <>
                          <Tag size="sm" style={{ backgroundColor: taskDeptColors.light, color: taskDeptColors.text, flexShrink: 0 }}>{task.dept}</Tag>
                          <Tag size="sm" style={{ backgroundColor: color.surface.secondary, color: color.text.secondary, flexShrink: 0 }}>{task.freq}</Tag>
                          <ChecklistProgress completed={task.checklistCompleted} total={task.checklistTotal} />
                          <Tooltip content="Overdue" placement="top">
                            <Badge
                              status="warning"
                              size="xs"
                              variant="dark"
                              icon={<Icon icon={icon.overdue} />}
                              style={{ flexShrink: 0 }}
                            />
                          </Tooltip>
                        </>
                      }
                      trailingTag={
                        <Tooltip content={pri.label} placement="top">
                          <Badge
                            status={pri.status}
                            size="xs"
                            variant="dark"
                            icon={<Icon icon={pri.icon} />}
                            style={{ flexShrink: 0 }}
                          />
                        </Tooltip>
                      }
                    />
                  );
                })}
              </div>
            )}
            {/* Normal tasks */}
            {normalTasks.map((task) => {
              const pri = PRIORITY_MAP[task.priority];
              const taskDeptColors = getDeptColors(task.dept);
              return (
                <BoardCard
                  key={task.id}
                  title={task.title}
                  subtitle={task.due}
                  accentColor={col.deptColors.light}
                  checked={!!checked[task.id]}
                  onCheckedChange={() => toggle(task.id)}
                  onClick={() => setViewingTask({
                    id: task.id,
                    title: task.title,
                    templateName: task.template,
                    taskType: task.type,
                    due: task.due,
                    dept: task.dept,
                    deptColor: deptColorMap.get(task.dept) ?? 'blue',
                    freq: task.freq,
                    priority: task.priority,
                    assignee: col.person.name,
                    assigneeRole: col.person.subtitle,
                    checked: !!checked[task.id],
                    assignmentType: task.assignmentType,
                    assignmentValue: task.assignmentValue,
                    room: task.room,
                    equipment: task.equipment,
                  })}
                  style={{ backgroundColor: color.surface.overlay, boxShadow: shadow.sm, cursor: 'pointer' }}
                  tags={
                    <>
                      <Tag size="sm" style={{ backgroundColor: taskDeptColors.light, color: taskDeptColors.text, flexShrink: 0 }}>{task.dept}</Tag>
                      <Tag size="sm" style={{ backgroundColor: color.surface.secondary, color: color.text.primary, flexShrink: 0 }}>{task.freq}</Tag>
                      <ChecklistProgress completed={task.checklistCompleted} total={task.checklistTotal} />
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
                      <Tooltip content={pri.label} placement="top">
                        <Badge
                          status={pri.status}
                          size="xs"
                          variant="dark"
                          icon={<Icon icon={pri.icon} />}
                          style={{ flexShrink: 0 }}
                        />
                      </Tooltip>
                    )
                  }
                />
              );
            })}
          </BoardColumn>
        );
      })}
    </Board>
      <ViewTaskSheet
        isOpen={viewingTask !== null}
        onClose={() => setViewingTask(null)}
        task={viewingTask}
      />
      <AddTaskSheet
        isOpen={addSheetOpen}
        onClose={() => setAddSheetOpen(false)}
        onSaved={refetch}
      />
    </div>
  );
}
