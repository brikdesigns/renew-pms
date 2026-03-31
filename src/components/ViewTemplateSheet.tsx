'use client';

import { useState, type CSSProperties } from 'react';
import {
  Sheet, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import type { SheetTab } from '@bds/components';
import { Badge } from '@bds/components/ui/Badge';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TaskItem {
  id: string;
  label: string;
}

export interface TemplateViewData {
  id: string;
  name: string;
  type: string;
  category: string;
  frequency: string;
  assigned_role: string;
  department: string;
  priority: string;
  status: string;
  description: string;
  requires_approval: boolean;
  estimated_duration: string;
  room: string;
  compliance_type: string;
  is_default: boolean;
  tasks: TaskItem[];
}

interface ViewTemplateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  template: TemplateViewData | null;
}

// ─── Label maps ─────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  checklist: 'Checklist',
  procedure: 'Procedure',
  compliance: 'Compliance',
  request: 'Request',
  onboarding: 'Onboarding',
  skill_training: 'Skill Training',
};

const CATEGORY_LABELS: Record<string, string> = {
  cleaning: 'Cleaning',
  equipment: 'Equipment',
  maintenance: 'Maintenance',
  compliance_safety: 'Compliance / Safety',
  patient_care: 'Patient Care',
  training: 'Training',
  administrative: 'Administrative',
};

const FREQUENCY_LABELS: Record<string, string> = {
  none: '—',
  daily: 'Daily',
  weekly: 'Weekly',
  bi_weekly: 'Bi-Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annually: 'Semi-Annually',
  annually: 'Annually',
  per_shift: 'Per Shift',
  custom: 'Custom',
};

const ROLE_LABELS: Record<string, string> = {
  all_staff: 'All Staff',
  owner: 'Owner / Dentist',
  office_manager: 'Office Manager',
  dental_hygienist: 'Dental Hygienist',
  dental_assistant: 'Dental Assistant',
  receptionist: 'Receptionist',
  supply_manager: 'Supply Manager',
};

const DEPARTMENT_LABELS: Record<string, string> = {
  '': '—',
  clinical: 'Clinical',
  front_desk: 'Front Desk',
  administration: 'Administration',
  sterilization: 'Sterilization',
  hr: 'HR',
  all_departments: 'All Departments',
  global: 'All Departments',
};

const PRIORITY_MAP: Record<string, { status: 'error' | 'warning' | 'info'; label: string }> = {
  critical: { status: 'error', label: 'Critical' },
  high: { status: 'error', label: 'High' },
  medium: { status: 'warning', label: 'Medium' },
  low: { status: 'info', label: 'Low' },
};

const STATUS_MAP: Record<string, { badge: 'positive' | 'warning' | 'error'; label: string }> = {
  active: { badge: 'positive', label: 'Active' },
  draft: { badge: 'warning', label: 'Draft' },
  archived: { badge: 'error', label: 'Archived' },
};

const ROOM_LABELS: Record<string, string> = {
  '': '—',
  operatory: 'Operatory',
  sterilization_room: 'Sterilization Room',
  xray_room: 'X-Ray Room',
  lab: 'Lab',
  front_office: 'Front Office',
  lobby: 'Lobby',
  waiting_area: 'Waiting Area',
  break_room: 'Break Room',
  supply_storage: 'Supply / Storage',
  restroom: 'Restroom',
};

const COMPLIANCE_LABELS: Record<string, string> = {
  '': '—',
  osha: 'OSHA',
  hipaa: 'HIPAA',
  infection_control: 'Infection Control',
  radiation_safety: 'Radiation Safety',
  fire_safety: 'Fire Safety',
  emergency_preparedness: 'Emergency Preparedness',
};

// ─── Tokens ─────────────────────────────────────────────────────────────────

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_SECONDARY = 'var(--text-secondary)';

// ─── Styles ─────────────────────────────────────────────────────────────────

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: 'var(--gap-lg)',
  width: '100%',
};

const halfStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const dotBase: CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  display: 'inline-block',
  flexShrink: 0,
};

const statusWrap: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontFamily: 'var(--font-family-body)',
  fontSize: 'var(--body-sm)',
  fontWeight: 500,
};

const taskItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--gap-md)',
  padding: 'var(--padding-sm) var(--padding-md)',
  borderRadius: 'var(--border-radius-sm)',
  border: 'var(--border-width-sm) solid var(--border-muted)',
  backgroundColor: 'var(--surface-primary)',
};

const emptyState: CSSProperties = {
  padding: '24px 0',
  fontFamily: 'var(--font-family-body)',
  fontSize: 'var(--body-sm)',
  color: TEXT_SECONDARY,
  textAlign: 'center',
};


// ─── Component ──────────────────────────────────────────────────────────────

export function ViewTemplateSheet({ isOpen, onClose, template }: ViewTemplateSheetProps) {
  const [activeTab, setActiveTab] = useState('details');

  if (!template) return null;

  const typeLabel = TYPE_LABELS[template.type] ?? template.type;
  const pri = PRIORITY_MAP[template.priority] ?? PRIORITY_MAP.medium;
  const status = STATUS_MAP[template.status] ?? STATUS_MAP.draft;

  const detailsContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>{typeLabel} Details</h3>
      <ReadOnlyField label="Name" value={template.name} />
      {template.description && (
        <ReadOnlyField label="Description" value={template.description} />
      )}

      <div style={rowStyle}>
        <div style={halfStyle}>
          <ReadOnlyField label="Type" value={typeLabel} />
        </div>
        <div style={halfStyle}>
          <ReadOnlyField label="Category" value={CATEGORY_LABELS[template.category] ?? template.category} />
        </div>
      </div>

      {template.compliance_type && (
        <ReadOnlyField label="Compliance Type" value={COMPLIANCE_LABELS[template.compliance_type] ?? template.compliance_type} />
      )}

      <h3 style={sheetSectionTitle}>Assignment & Scheduling</h3>
      <div style={rowStyle}>
        <div style={halfStyle}>
          <ReadOnlyField label="Assigned Role" value={ROLE_LABELS[template.assigned_role] ?? template.assigned_role} />
        </div>
        <div style={halfStyle}>
          <ReadOnlyField label="Department" value={(DEPARTMENT_LABELS[template.department] ?? template.department) || '—'} />
        </div>
      </div>

      <div style={rowStyle}>
        <div style={halfStyle}>
          <ReadOnlyField label="Frequency" value={FREQUENCY_LABELS[template.frequency] ?? template.frequency} />
        </div>
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
      </div>

      <div style={rowStyle}>
        {template.estimated_duration && (
          <div style={halfStyle}>
            <ReadOnlyField label="Est. Duration" value={`${template.estimated_duration} min`} />
          </div>
        )}
        {template.room && (
          <div style={halfStyle}>
            <ReadOnlyField label="Room" value={ROOM_LABELS[template.room] ?? template.room} />
          </div>
        )}
      </div>

      <h3 style={sheetSectionTitle}>Status & Settings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ fontFamily: 'var(--font-family-label)', fontSize: 'var(--body-sm)', fontWeight: 500, color: TEXT_PRIMARY }}>
          Status
        </span>
        <div style={{ display: 'inline-flex' }}>
          <Badge status={status.badge} size="sm">{status.label}</Badge>
        </div>
      </div>
      <ReadOnlyField label="Requires Approval" value={template.requires_approval ? 'Yes' : 'No'} />
      <ReadOnlyField label="Source" value={template.is_default ? 'Default' : 'Custom'} />
    </div>
  );

  const tasksContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>
        {template.type === 'procedure' ? 'Procedure Steps' : `${typeLabel} Items`}
      </h3>
      <p style={{ color: TEXT_SECONDARY, fontSize: 'var(--body-sm)', margin: 0 }}>
        {template.tasks.length} {template.tasks.length === 1 ? 'item' : 'items'}
      </p>

      {template.tasks.length === 0 ? (
        <p style={emptyState}>No items defined for this template.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)' }}>
          {template.tasks.map((task, idx) => (
            <div key={task.id} style={taskItemStyle}>
              <span style={{ color: TEXT_SECONDARY, fontSize: 'var(--body-sm)', minWidth: '24px' }}>
                {idx + 1}.
              </span>
              <span style={{ color: TEXT_PRIMARY, fontSize: 'var(--body-sm)', flex: 1 }}>
                {task.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const sheetTabs: SheetTab[] = [
    { id: 'details', label: 'Details', content: detailsContent },
    { id: 'tasks', label: template.type === 'procedure' ? 'Steps' : 'Tasks', content: tasksContent },
  ];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={template.name}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={
        <button type="button" className="renew-btn renew-btn--ghost" onClick={onClose}>Close</button>
      }
    />
  );
}
