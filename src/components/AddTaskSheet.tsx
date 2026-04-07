'use client';

import { useState, useEffect, useMemo, type FormEvent, type CSSProperties } from 'react';
import { Sheet, Button, Select, TextInput } from '@bds/components';
import { useToast } from '@/components/ToastProvider';
import { useMembers } from '@/hooks/useMembers';
import { useDepartments } from '@/hooks/useDepartments';
import { color, font, gap, space, border } from '@/lib/tokens';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  description: string | null;
  type: string;
  frequency: string | null;
  priority: string;
  room_id: string | null;
  assigned_role_id: string | null;
  department_id: string | null;
  task_category_id: string | null;
  status: string;
}

interface AddTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical',
};

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily', weekly: 'Weekly', bi_weekly: 'Bi-Weekly', monthly: 'Monthly',
  quarterly: 'Quarterly', semi_annually: 'Semi-Annually', annually: 'Annually',
  per_shift: 'Per Shift',
};

const TYPE_LABELS: Record<string, string> = {
  checklist: 'Checklist', procedure: 'Procedure', compliance: 'Compliance',
  request: 'Request', onboarding: 'Onboarding', skill_training: 'Skill Training',
};

const formRowStyle: CSSProperties = { display: 'flex', gap: gap.lg, width: '100%' };
const formRowHalf: CSSProperties = { flex: 1, minWidth: 0 };

const previewFieldStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  color: color.text.secondary,
};

const previewLabelStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: 600,
  color: color.text.primary,
  marginBottom: space.tiny,
};

const previewRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.sm,
};

const previewGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: gap.lg,
};

const emptyStateStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: space.xl,
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.muted,
  textAlign: 'center',
  border: `1px dashed ${color.border.muted}`,
  borderRadius: border.radius.sm,
};

// ─── Component ──────────────────────────────────────────────────────────────

export function AddTaskSheet({ isOpen, onClose, onSaved }: AddTaskSheetProps) {
  const { showToast } = useToast();
  const { members } = useMembers();
  const { departments } = useDepartments();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [assignedDepartment, setAssignedDepartment] = useState('');
  const [dueDate, setDueDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);

  // Fetch active templates
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/templates')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTemplates(data.filter((t: Template) => t.status === 'active'));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setSelectedTemplateId('');
      setAssignedTo('');
      setAssignedDepartment('');
      setDueDate(todayStr());
    }
  }, [isOpen]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) ?? null;

  // Auto-fill department from template
  useEffect(() => {
    if (selectedTemplate?.department_id) {
      setAssignedDepartment(selectedTemplate.department_id);
    }
  }, [selectedTemplate]);

  const templateOptions = useMemo(() => [
    { label: '— Select a template', value: '' },
    ...templates.map(t => ({ label: t.name, value: t.id })),
  ], [templates]);

  const staffOptions = useMemo(() => [
    { label: '— Select staff member', value: '' },
    ...members.filter(m => m.is_active).map(m => ({
      label: `${m.first_name} ${m.last_name}`,
      value: m.id,
    })),
  ], [members]);

  const deptOptions = useMemo(() => [
    { label: '— No department', value: '' },
    ...departments.filter(d => d.is_active).map(d => ({
      label: d.name,
      value: d.id,
    })),
  ], [departments]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setSaving(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedTemplate.name,
          description: selectedTemplate.description || null,
          task_type_id: selectedTemplate.task_category_id || null,
          priority: selectedTemplate.priority,
          frequency: selectedTemplate.frequency || null,
          due_date: dueDate || null,
          assigned_to: assignedTo || null,
          assigned_department: assignedDepartment || null,
          room_id: selectedTemplate.room_id || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create task');
      }

      showToast({ title: 'Task created', description: `${selectedTemplate.name} has been assigned.`, variant: 'success' });
      onSaved();
      onClose();
    } catch (err: unknown) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to create task', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!selectedTemplate && !!assignedTo;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Add Task from Template"
      width="600px"
      side="right"
      footer={<>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="add-task-form" disabled={saving || !canSave}>
          {saving ? 'Creating...' : 'Create Task'}
        </Button>
      </>}
    >
      <form id="add-task-form" onSubmit={handleSave}>
        <div style={sheetBodyStyle}>
          {/* Step 1: Pick template */}
          <h3 style={sheetSectionTitle}>Template</h3>
          <div style={sheetFormGroup}>
            <Select
              label="Task Template"
              size="sm"
              options={templateOptions}
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              fullWidth
            />
          </div>

          {/* Template preview */}
          {selectedTemplate ? (
            <>
              <h3 style={sheetSectionTitle}>Template Details</h3>
              <div style={previewGridStyle}>
                <div style={previewRowStyle}>
                  <span style={previewLabelStyle}>Type</span>
                  <span style={previewFieldStyle}>{TYPE_LABELS[selectedTemplate.type] ?? selectedTemplate.type}</span>
                </div>
                <div style={previewRowStyle}>
                  <span style={previewLabelStyle}>Priority</span>
                  <span style={previewFieldStyle}>{PRIORITY_LABELS[selectedTemplate.priority] ?? selectedTemplate.priority}</span>
                </div>
                <div style={previewRowStyle}>
                  <span style={previewLabelStyle}>Frequency</span>
                  <span style={previewFieldStyle}>{selectedTemplate.frequency ? (FREQUENCY_LABELS[selectedTemplate.frequency] ?? selectedTemplate.frequency) : 'One-time'}</span>
                </div>
                {selectedTemplate.description && (
                  <div style={{ ...previewRowStyle, gridColumn: '1 / -1' }}>
                    <span style={previewLabelStyle}>Description</span>
                    <span style={previewFieldStyle}>{selectedTemplate.description}</span>
                  </div>
                )}
              </div>

              {/* Step 2: Assignment + scheduling */}
              <h3 style={sheetSectionTitle}>Assignment</h3>
              <div style={sheetFormGroup}>
                <div style={formRowStyle}>
                  <div style={formRowHalf}>
                    <Select label="Assign To" size="sm" options={staffOptions} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} fullWidth required />
                  </div>
                  <div style={formRowHalf}>
                    <Select label="Department" size="sm" options={deptOptions} value={assignedDepartment} onChange={(e) => setAssignedDepartment(e.target.value)} fullWidth />
                  </div>
                </div>
                <TextInput label="Due Date" size="sm" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} fullWidth required />
              </div>
            </>
          ) : (
            <div style={emptyStateStyle}>
              Select a template above to configure the task
            </div>
          )}
        </div>
      </form>
    </Sheet>
  );
}
