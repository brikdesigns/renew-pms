'use client';

import { useState } from 'react';
import { Board, BoardColumn, BoardHeader, BoardCard } from '@bds/components';
import { Tag, Badge, Dot, AnimatedIcon } from '@bds/components';
import checkCompleteAnimation from '@/animations/check-complete.json';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { TaskFilterBar } from '@/components/TaskFilterBar';
import { getDepartmentColors } from '@/lib/department-colors';
import { ViewTaskSheet, type TaskViewData } from '@/components/ViewTaskSheet';
import { shadow, color, font, space, gap, border } from '@/lib/tokens';

// ─── Mock task type ─────────────────────────────────────────────────────────

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
}

// Mock board data — references seed users from Settings > Users
// Will be replaced with real DB queries joining practice_members + tasks
const MOCK_BOARD: { person: { name: string; subtitle: string; department: string }; tasks: MockTask[] }[] = [
  {
    person: { name: 'Sarah Mitchell', subtitle: 'Owner', department: 'Clinical' },
    tasks: [
      { id: 't1', title: 'Review daily patient schedule', due: 'Due 8:00 AM', dept: 'Clinical', freq: 'Daily', priority: 'critical', type: 'checklist', template: 'Daily Morning Checklist', overdue: true, assignmentType: 'role', assignmentValue: 'Owner', room: 'Front Office', equipment: undefined },
      { id: 't2', title: 'Verify operatory setup and readiness', due: 'Due 8:30 AM', dept: 'Clinical', freq: 'Daily', priority: 'warning', type: 'procedure', template: 'Operatory Setup Procedure', overdue: true, assignmentType: 'role', assignmentValue: 'Owner', room: 'Operatory 1', equipment: 'Dental Chair' },
      { id: 't3', title: 'Complete patient follow-up calls', due: 'Due 4:00 PM', dept: 'Administration', freq: 'Daily', priority: 'info', type: 'checklist', template: 'Daily Closing Checklist', overdue: false, assignmentType: 'department', assignmentValue: 'Administration' },
    ],
  },
  {
    person: { name: 'Jessica Torres', subtitle: 'Office Manager', department: 'Administration' },
    tasks: [
      { id: 't4', title: 'Conduct daily team huddle', due: 'Due 8:00 AM', dept: 'Administration', freq: 'Daily', priority: 'critical', type: 'checklist', template: 'Daily Morning Checklist', overdue: true, assignmentType: 'role', assignmentValue: 'Office Manager' },
      { id: 't5', title: 'Review and approve supply orders', due: 'Due today', dept: 'Administration', freq: 'Weekly', priority: 'warning', type: 'checklist', template: 'Weekly Office Management', overdue: false, assignmentType: 'role', assignmentValue: 'Office Manager' },
      { id: 't6', title: 'Update staff scheduling for next week', due: 'Due Friday', dept: 'Administration', freq: 'Weekly', priority: 'info', type: 'checklist', template: 'Weekly Office Management', overdue: false, assignmentType: 'department', assignmentValue: 'Administration' },
    ],
  },
  {
    person: { name: 'Amanda Chen', subtitle: 'Dental Hygienist', department: 'Clinical' },
    tasks: [
      { id: 't7', title: 'Sterilize instruments — morning batch', due: 'Due 9:00 AM', dept: 'Clinical', freq: 'Daily', priority: 'critical', type: 'procedure', template: 'Sterilization Procedure', overdue: true, assignmentType: 'role', assignmentValue: 'Dental Hygienist', room: 'Sterilization Room', equipment: 'Autoclave' },
      { id: 't8', title: 'Patient room prep — Operatory 1', due: 'Due 9:30 AM', dept: 'Clinical', freq: 'Daily', priority: 'warning', type: 'checklist', template: 'Daily Maintenance Checklist', overdue: false, assignmentType: 'role', assignmentValue: 'Dental Hygienist', room: 'Operatory 1', equipment: 'Dental Chair' },
      { id: 't9', title: 'Update patient records', due: 'Due 2:00 PM', dept: 'Clinical', freq: 'Daily', priority: 'info', type: 'checklist', template: 'Daily Closing Checklist', overdue: false, assignmentType: 'department', assignmentValue: 'Clinical' },
      { id: 't10', title: 'Restock operatory supplies', due: 'Due 4:00 PM', dept: 'Clinical', freq: 'Daily', priority: 'info', type: 'checklist', template: 'Daily Maintenance Checklist', overdue: false, assignmentType: 'role', assignmentValue: 'Dental Hygienist', room: 'Operatory 1' },
    ],
  },
  {
    person: { name: 'Marcus Williams', subtitle: 'Dental Hygienist', department: 'Clinical' },
    tasks: [
      { id: 't11', title: 'Sterilize instruments — afternoon batch', due: 'Due 1:00 PM', dept: 'Clinical', freq: 'Daily', priority: 'critical', type: 'procedure', template: 'Sterilization Procedure', overdue: false, assignmentType: 'role', assignmentValue: 'Dental Hygienist', room: 'Sterilization Room', equipment: 'Autoclave' },
      { id: 't12', title: 'Patient room prep — Operatory 2', due: 'Due 1:30 PM', dept: 'Clinical', freq: 'Daily', priority: 'warning', type: 'checklist', template: 'Daily Maintenance Checklist', overdue: false, assignmentType: 'role', assignmentValue: 'Dental Hygienist', room: 'Operatory 2', equipment: 'Dental Chair' },
      { id: 't13', title: 'Complete periodontal charting', due: 'Due 3:00 PM', dept: 'Clinical', freq: 'Daily', priority: 'warning', type: 'procedure', template: 'Patient Care Procedure', overdue: false, assignmentType: 'role', assignmentValue: 'Dental Hygienist', room: 'Operatory 2' },
    ],
  },
  {
    person: { name: 'Emily Rivera', subtitle: 'Dental Assistant', department: 'Clinical' },
    tasks: [
      { id: 't14', title: 'Chairside setup for morning procedures', due: 'Due 8:30 AM', dept: 'Clinical', freq: 'Daily', priority: 'critical', type: 'procedure', template: 'Operatory Setup Procedure', overdue: true, assignmentType: 'role', assignmentValue: 'Dental Assistant', room: 'Operatory 1', equipment: 'Dental Chair' },
      { id: 't15', title: 'Process and package instruments', due: 'Due 11:00 AM', dept: 'Sterilization', freq: 'Per Shift', priority: 'warning', type: 'procedure', template: 'Sterilization Procedure', overdue: false, assignmentType: 'role', assignmentValue: 'Dental Assistant', room: 'Sterilization Room', equipment: 'Autoclave' },
      { id: 't16', title: 'Patient prep and vitals', due: 'Due 1:00 PM', dept: 'Clinical', freq: 'Daily', priority: 'warning', type: 'checklist', template: 'Patient Care Procedure', overdue: false, assignmentType: 'role', assignmentValue: 'Dental Assistant', room: 'Operatory 1' },
    ],
  },
  {
    person: { name: 'Tyler Nguyen', subtitle: 'Dental Assistant', department: 'Sterilization' },
    tasks: [
      { id: 't17', title: 'Run autoclave cycle — morning', due: 'Due 9:00 AM', dept: 'Sterilization', freq: 'Per Shift', priority: 'critical', type: 'compliance', template: 'OSHA Compliance Checklist', overdue: true, assignmentType: 'role', assignmentValue: 'Dental Assistant', room: 'Sterilization Room', equipment: 'Autoclave' },
      { id: 't18', title: 'Log sterilization batch with date and initials', due: 'Due 10:00 AM', dept: 'Sterilization', freq: 'Per Shift', priority: 'critical', type: 'compliance', template: 'OSHA Compliance Checklist', overdue: false, assignmentType: 'role', assignmentValue: 'Dental Assistant', room: 'Sterilization Room', equipment: 'Autoclave' },
      { id: 't19', title: 'Restock PPE supplies', due: 'Due today', dept: 'Sterilization', freq: 'Daily', priority: 'warning', type: 'checklist', template: 'Daily Maintenance Checklist', overdue: false, assignmentType: 'department', assignmentValue: 'Sterilization', room: 'Sterilization Room' },
      { id: 't20', title: 'Run autoclave cycle — afternoon', due: 'Due 2:00 PM', dept: 'Sterilization', freq: 'Per Shift', priority: 'warning', type: 'compliance', template: 'OSHA Compliance Checklist', overdue: false, assignmentType: 'role', assignmentValue: 'Dental Assistant', room: 'Sterilization Room', equipment: 'Autoclave' },
    ],
  },
  {
    person: { name: 'Rachel Foster', subtitle: 'Receptionist', department: 'Front Desk' },
    tasks: [
      { id: 't21', title: 'Confirm next-day appointments', due: 'Due 9:00 AM', dept: 'Front Desk', freq: 'Daily', priority: 'critical', type: 'checklist', template: 'Daily Morning Checklist', overdue: true, assignmentType: 'role', assignmentValue: 'Receptionist', room: 'Front Office' },
      { id: 't22', title: 'Process patient check-ins', due: 'Due today', dept: 'Front Desk', freq: 'Daily', priority: 'warning', type: 'checklist', template: 'Daily Morning Checklist', overdue: false, assignmentType: 'role', assignmentValue: 'Receptionist', room: 'Front Office' },
      { id: 't23', title: 'Update patient contact information', due: 'Due today', dept: 'Front Desk', freq: 'Daily', priority: 'info', type: 'checklist', template: 'Daily Closing Checklist', overdue: false, assignmentType: 'department', assignmentValue: 'Front Desk' },
    ],
  },
  {
    person: { name: 'David Park', subtitle: 'Treatment Coordinator', department: 'Front Desk' },
    tasks: [
      { id: 't24', title: 'Present treatment plans to patients', due: 'Due 10:00 AM', dept: 'Front Desk', freq: 'Daily', priority: 'critical', type: 'procedure', template: 'Patient Care Procedure', overdue: false, assignmentType: 'role', assignmentValue: 'Treatment Coordinator', room: 'Consultation Room' },
      { id: 't25', title: 'Follow up on pending treatment acceptances', due: 'Due today', dept: 'Front Desk', freq: 'Daily', priority: 'warning', type: 'checklist', template: 'Daily Closing Checklist', overdue: false, assignmentType: 'role', assignmentValue: 'Treatment Coordinator' },
      { id: 't26', title: 'Coordinate with insurance on pre-authorizations', due: 'Due today', dept: 'Front Desk', freq: 'Daily', priority: 'warning', type: 'checklist', template: 'Daily Morning Checklist', overdue: false, assignmentType: 'department', assignmentValue: 'Front Desk' },
    ],
  },
  {
    person: { name: 'Lisa Gomez', subtitle: 'Insurance Coordinator', department: 'Front Desk' },
    tasks: [
      { id: 't27', title: 'Process insurance claims batch', due: 'Due 10:00 AM', dept: 'Front Desk', freq: 'Daily', priority: 'critical', type: 'checklist', template: 'Daily Morning Checklist', overdue: false, assignmentType: 'role', assignmentValue: 'Insurance Coordinator', room: 'Front Office' },
      { id: 't28', title: 'Verify benefits for tomorrow\'s patients', due: 'Due 2:00 PM', dept: 'Front Desk', freq: 'Daily', priority: 'warning', type: 'checklist', template: 'Daily Closing Checklist', overdue: false, assignmentType: 'role', assignmentValue: 'Insurance Coordinator' },
      { id: 't29', title: 'Follow up on denied claims', due: 'Due Friday', dept: 'Front Desk', freq: 'Weekly', priority: 'info', type: 'checklist', template: 'Weekly Office Management', overdue: false, assignmentType: 'department', assignmentValue: 'Front Desk' },
    ],
  },
  {
    person: { name: 'Jordan Hayes', subtitle: 'Inventory Manager', department: 'Engineering' },
    tasks: [
      { id: 't30', title: 'Review current supply inventory levels', due: 'Due today', dept: 'Engineering', freq: 'Weekly', priority: 'warning', type: 'checklist', template: 'Weekly Inventory Checklist', overdue: false, assignmentType: 'role', assignmentValue: 'Inventory Manager', room: 'Supply Storage' },
      { id: 't31', title: 'Check gloves and PPE stock', due: 'Due today', dept: 'Engineering', freq: 'Weekly', priority: 'warning', type: 'checklist', template: 'Weekly Inventory Checklist', overdue: false, assignmentType: 'role', assignmentValue: 'Inventory Manager', room: 'Supply Storage' },
      { id: 't32', title: 'Submit supply order for approval', due: 'Due Friday', dept: 'Engineering', freq: 'Weekly', priority: 'info', type: 'checklist', template: 'Weekly Inventory Checklist', overdue: false, assignmentType: 'department', assignmentValue: 'Engineering' },
    ],
  },
];

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
  'Request': 'request',
};

// Derive unique template names from mock data for the template filter
const ALL_TEMPLATES = Array.from(
  new Set(MOCK_BOARD.flatMap((col) => col.tasks.map((t) => t.template)))
).sort();

export default function TasksPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedFrequency, setSelectedFrequency] = useState('All Frequencies');
  const [selectedPriority, setSelectedPriority] = useState('All Priorities');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedTemplate, setSelectedTemplate] = useState('All Templates');
  const [showResolved, setShowResolved] = useState(false);
  const [showOverdue, setShowOverdue] = useState(false);
  const [viewingTask, setViewingTask] = useState<TaskViewData | null>(null);

  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  // Apply all filters and derive department colors + dynamic progress
  const filteredBoard = MOCK_BOARD
    .map((col) => {
      const colors = getDepartmentColors(col.person.department);
      const totalTasks = col.tasks.length;
      const completedTasks = col.tasks.filter((t) => checked[t.id]).length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const filtered = col.tasks.filter((t) => {
        if (!showResolved && checked[t.id]) return false;
        if (selectedDepartment !== 'All Departments' && t.dept !== selectedDepartment) return false;
        if (selectedFrequency !== 'All Frequencies' && t.freq !== selectedFrequency) return false;
        if (selectedPriority !== 'All Priorities' && t.priority !== PRIORITY_FILTER_MAP[selectedPriority]) return false;
        if (selectedType !== 'All Types' && t.type !== TYPE_FILTER_MAP[selectedType]) return false;
        if (selectedTemplate !== 'All Templates' && t.template !== selectedTemplate) return false;
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
        selectedTemplate={selectedTemplate}
        onTemplateChange={setSelectedTemplate}
        templates={ALL_TEMPLATES}
        showResolved={showResolved}
        onShowResolvedChange={setShowResolved}
        showOverdue={showOverdue}
        onShowOverdueChange={setShowOverdue}
      />
      <Board style={{ flex: 1, minHeight: 0 }}>
      {filteredBoard.map((col) => {
        const overdueTasks = col.tasks.filter((t) => t.overdue && !checked[t.id]);
        const normalTasks = col.tasks.filter((t) => !t.overdue || checked[t.id]);

        return (
          <BoardColumn key={col.person.name} style={{ backgroundColor: color.surface.primary, '--dept-avatar-bg': col.deptColors.light, '--dept-avatar-color': col.deptColors.text } as React.CSSProperties}>
            <BoardHeader
              name={col.person.name}
              subtitle={col.person.subtitle}
              progress={col.progress}
              style={{ backgroundColor: 'transparent' }}
            />
            {/* Overdue partition */}
            {overdueTasks.length > 0 && (
              <div style={{
                backgroundColor: color.surface.warning,
                borderRadius: border.radius.md,
                padding: space.sm,
                display: 'flex',
                flexDirection: 'column',
                gap: gap.sm,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: gap.xs }}>
                  <Dot status="error" size="sm" pulse />
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.body.xs, fontWeight: 600, color: color.text.negative }}>Overdue</span>
                </div>
                {overdueTasks.map((task) => {
                  const pri = PRIORITY_MAP[task.priority];
                  const taskDeptColors = getDepartmentColors(task.dept);
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
                          <Tag size="sm" style={{ backgroundColor: taskDeptColors.light, color: taskDeptColors.text }}>{task.dept}</Tag>
                          <Tag size="sm">{task.freq}</Tag>
                          <Badge
                            status="warning"
                            size="xs"
                            variant="dark"
                            icon={<Icon icon={icon.warning} />}
                            title="Overdue"
                          />
                        </>
                      }
                      trailingTag={
                        <Badge
                          status={pri.status}
                          size="xs"
                          variant="dark"
                          icon={<Icon icon={pri.icon} />}
                          title={pri.label}
                        />
                      }
                    />
                  );
                })}
              </div>
            )}
            {/* Normal tasks */}
            {normalTasks.map((task) => {
              const pri = PRIORITY_MAP[task.priority];
              const taskDeptColors = getDepartmentColors(task.dept);
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
                      <Tag size="sm" style={{ backgroundColor: taskDeptColors.light, color: taskDeptColors.text }}>{task.dept}</Tag>
                      <Tag size="sm">{task.freq}</Tag>
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
                      <Badge
                        status={pri.status}
                        size="xs"
                        variant="dark"
                        icon={<Icon icon={pri.icon} />}
                        title={pri.label}
                      />
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
    </div>
  );
}
