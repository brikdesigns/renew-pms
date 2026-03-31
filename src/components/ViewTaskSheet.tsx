'use client';

import { Sheet } from '@bds/components';
import { Badge } from '@bds/components/ui/Badge';
import { Tag } from '@bds/components/ui/Tag';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { getDepartmentColors } from '@/lib/department-colors';
import {
  sheetBodyStyle,
  sheetSectionTitle,
} from '@/app/(auth)/settings/_sheetStyles';
import type { CSSProperties } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TaskViewData {
  id: string;
  title: string;
  templateName: string;
  taskType: string;
  due: string;
  dept: string;
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

const TEXT_PRIMARY = 'var(--text-primary)';

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: '16px',
  width: '100%',
};

const halfStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const tagRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
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
  const deptColors = getDepartmentColors(task.dept);

  const sheetTitle = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span>{task.title}</span>
      <span style={{
        fontFamily: 'var(--font-family-label)',
        fontSize: 'var(--body-sm)',
        fontWeight: 400,
        color: 'var(--text-secondary)',
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
        <button type="button" className="renew-btn renew-btn--ghost" onClick={onClose}>Close</button>
        <button type="button" className="renew-btn renew-btn--primary">Task Complete</button>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-family-label)', fontSize: 'var(--body-sm)', fontWeight: 500, color: TEXT_PRIMARY }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-family-label)', fontSize: 'var(--body-sm)', fontWeight: 500, color: TEXT_PRIMARY }}>
                Priority
              </span>
              <div style={{ display: 'inline-flex' }}>
                <Badge status={pri.status} size="sm">{pri.label}</Badge>
              </div>
            </div>
          </div>
          <div style={halfStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-family-label)', fontSize: 'var(--body-sm)', fontWeight: 500, color: TEXT_PRIMARY }}>
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
