'use client';

import { Sheet, Button } from '@bds/components';
import { Badge } from '@bds/components';
import { Tag } from '@bds/components';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import {
  sheetBodyStyle,
  sheetSectionTitle,
} from '@/app/(auth)/settings/_sheetStyles';
import type { CSSProperties } from 'react';
import { color, font, gap, departmentColor } from '@/lib/tokens';

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
}

interface ViewTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskViewData | null;
}

// ─── Priority display ────────────────────────────────────────────────────────

const PRIORITY_DISPLAY: Record<string, { status: 'error' | 'warning' | 'info'; label: string }> = {
  critical: { status: 'error', label: 'Critical' },
  error: { status: 'error', label: 'High' },
  warning: { status: 'warning', label: 'Medium' },
  info: { status: 'info', label: 'Low' },
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: gap.lg,
  width: '100%',
};

const halfStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const tagRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
  flexWrap: 'wrap',
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

export function ViewTaskSheet({ isOpen, onClose, task }: ViewTaskSheetProps) {
  if (!task) return null;

  const pri = PRIORITY_DISPLAY[task.priority] ?? PRIORITY_DISPLAY.info;
  const deptColors = departmentColor(task.deptColor);

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

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={sheetTitle}
      width="600px"
      side="right"
      footer={<>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>
        <Button variant="primary" size="md" type="button">Task Complete</Button>
      </>}
    >
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
            <ReadOnlyField label="Frequency" value={task.freq} />
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
                <Tag size="sm" style={{ backgroundColor: deptColors.light, color: deptColors.text }}>{task.dept}</Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Context: Room & Equipment (shown when present) */}
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
                <Badge status={task.checked ? 'positive' : 'warning'} size="sm">
                  {task.checked ? 'Completed' : 'In Progress'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
