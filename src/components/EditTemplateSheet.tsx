'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Sheet, Button, TextInput, TextArea, Select, Switch } from '@bds/components';
import type { SheetTab } from '@bds/components';
import { useToast } from '@/components/ToastProvider';
import { color, font, gap, space, border } from '@/lib/tokens';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TemplateFormData {
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
}

export interface TaskItem {
  id: string;
  label: string;
}

interface EditTemplateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** null = Add mode, object = Edit mode */
  initialData: TemplateFormData | null;
  /** Existing tasks to load when editing */
  initialTasks?: TaskItem[];
  onSave: (data: TemplateFormData, tasks: TaskItem[]) => void;
}

// ─── Type metadata (drives titles + field visibility) ────────────────────────

const TYPE_LABELS: Record<string, string> = {
  checklist: 'Checklist',
  procedure: 'Procedure',
  compliance: 'Compliance',
  request: 'Request',
  onboarding: 'Onboarding',
  skill_training: 'Training',
};

/** Which fields are relevant per type (from data point matrix in Notion) */
const TYPE_FIELDS: Record<string, { room: boolean; frequency: boolean; compliance: boolean; approval: 'required' | 'optional' | false }> = {
  checklist:      { room: true,  frequency: true,  compliance: false, approval: 'optional' },
  procedure:      { room: true,  frequency: true,  compliance: false, approval: 'required' },
  compliance:     { room: true,  frequency: true,  compliance: true,  approval: 'required' },
  request:        { room: true,  frequency: true,  compliance: false, approval: 'required' },
  onboarding:     { room: false, frequency: false, compliance: false, approval: 'optional' },
  skill_training: { room: false, frequency: true,  compliance: false, approval: 'optional' },
};

// ─── Options ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { label: 'Checklist', value: 'checklist' },
  { label: 'Procedure', value: 'procedure' },
  { label: 'Compliance', value: 'compliance' },
  { label: 'Request', value: 'request' },
  { label: 'Onboarding', value: 'onboarding' },
  { label: 'Skill Training', value: 'skill_training' },
];

const CATEGORY_OPTIONS = [
  { label: 'Cleaning', value: 'cleaning' },
  { label: 'Equipment', value: 'equipment' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Compliance / Safety', value: 'compliance_safety' },
  { label: 'Patient Care', value: 'patient_care' },
  { label: 'Training', value: 'training' },
  { label: 'Administrative', value: 'administrative' },
];

const FREQUENCY_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Bi-Weekly', value: 'bi_weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Semi-Annually', value: 'semi_annually' },
  { label: 'Annually', value: 'annually' },
  { label: 'Per Shift', value: 'per_shift' },
  { label: 'Custom', value: 'custom' },
];

const ROLE_OPTIONS = [
  { label: 'All Staff', value: 'all_staff' },
  { label: 'Owner / Dentist', value: 'owner' },
  { label: 'Office Manager', value: 'office_manager' },
  { label: 'Dental Hygienist', value: 'dental_hygienist' },
  { label: 'Dental Assistant', value: 'dental_assistant' },
  { label: 'Receptionist', value: 'receptionist' },
  { label: 'Supply Manager', value: 'supply_manager' },
];

const DEPARTMENT_OPTIONS = [
  { label: '—', value: '' },
  { label: 'Clinical', value: 'clinical' },
  { label: 'Front Desk', value: 'front_desk' },
  { label: 'Administration', value: 'administration' },
  { label: 'Sterilization', value: 'sterilization' },
  { label: 'HR', value: 'hr' },
  { label: 'All Departments', value: 'all_departments' },
];

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
];

const COMPLIANCE_TYPE_OPTIONS = [
  { label: '—', value: '' },
  { label: 'OSHA', value: 'osha' },
  { label: 'HIPAA', value: 'hipaa' },
  { label: 'Infection Control', value: 'infection_control' },
  { label: 'Radiation Safety', value: 'radiation_safety' },
  { label: 'Fire Safety', value: 'fire_safety' },
  { label: 'Emergency Preparedness', value: 'emergency_preparedness' },
];

const ROOM_OPTIONS = [
  { label: '— (Not room-specific)', value: '' },
  { label: 'Operatory', value: 'operatory' },
  { label: 'Sterilization Room', value: 'sterilization_room' },
  { label: 'X-Ray Room', value: 'xray_room' },
  { label: 'Lab', value: 'lab' },
  { label: 'Front Office', value: 'front_office' },
  { label: 'Lobby', value: 'lobby' },
  { label: 'Waiting Area', value: 'waiting_area' },
  { label: 'Break Room', value: 'break_room' },
  { label: 'Supply / Storage', value: 'supply_storage' },
  { label: 'Restroom', value: 'restroom' },
];

const EMPTY_FORM: TemplateFormData = {
  name: '',
  type: 'checklist',
  category: 'cleaning',
  frequency: 'daily',
  assigned_role: 'all_staff',
  department: '',
  priority: 'medium',
  status: 'draft',
  description: '',
  requires_approval: false,
  estimated_duration: '',
  room: '',
  compliance_type: '',
};

// ─── Inline styles ───────────────────────────────────────────────────────────

const formRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: gap.lg,
  width: '100%',
};

const formRowHalf: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const taskListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.md,
};

const taskItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
  padding: `${space.sm} ${space.md}`,
  borderRadius: border.radius.sm,
  border: `${border.width.sm} solid ${color.border.muted}`,
  backgroundColor: color.surface.primary,
};

const taskRemoveStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: color.text.muted,
  fontSize: font.size.body.sm,
  padding: space.xs,
  marginLeft: 'auto',
};

const addTaskRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: gap.md,
  alignItems: 'flex-end',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function EditTemplateSheet({ isOpen, onClose, initialData, initialTasks, onSave }: EditTemplateSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<TemplateFormData>(EMPTY_FORM);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTask, setNewTask] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const isEdit = initialData !== null;
  const typeLabel = TYPE_LABELS[form.type] ?? form.type;
  const fields = TYPE_FIELDS[form.type] ?? TYPE_FIELDS.checklist;
  const sheetTitle = isEdit ? `Edit ${typeLabel}` : `Add ${typeLabel}`;

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? EMPTY_FORM);
      setTasks(initialTasks ?? []);
      setNewTask('');
      setActiveTab('details');
    }
  }, [isOpen, initialData]);

  const updateText = (field: keyof TemplateFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const updateSelect = (field: keyof TemplateFormData) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [...prev, { id: crypto.randomUUID(), label: newTask.trim() }]);
    setNewTask('');
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);

    // TODO: Wire to Supabase insert/update on task_templates table
    await new Promise((r) => setTimeout(r, 500));

    onSave(form, tasks);
    setSaving(false);
    showToast({
      title: isEdit ? 'Template updated' : 'Template created',
      description: isEdit
        ? `${form.name} has been updated.`
        : `${form.name} has been created.`,
      variant: 'success',
    });
    onClose();
  };

  const detailsContent = (
    <form id="edit-template-form" onSubmit={handleSave}>
      <div style={sheetBodyStyle}>
        <h3 style={sheetSectionTitle}>{typeLabel} Details</h3>
        <div style={sheetFormGroup}>
          <TextInput
            label="Name"
            size="sm"
            value={form.name}
            onChange={updateText('name')}
            placeholder={`e.g. ${typeLabel} name`}
            fullWidth
            required
          />
          <TextArea
            label="Description"
            value={form.description}
            onChange={updateText('description')}
            placeholder="What this template covers and when it should be used"
            rows={3}
            fullWidth
          />

          <div style={formRowStyle}>
            <div style={formRowHalf}>
              <Select
                label="Type"
                size="sm"
                options={TYPE_OPTIONS}
                value={form.type}
                onChange={updateSelect('type')}
                fullWidth
                disabled
              />
            </div>
            <div style={formRowHalf}>
              <Select
                label="Category"
                size="sm"
                options={CATEGORY_OPTIONS}
                value={form.category}
                onChange={updateSelect('category')}
                fullWidth
              />
            </div>
          </div>

          {fields.compliance && (
            <Select
              label="Compliance Type"
              size="sm"
              options={COMPLIANCE_TYPE_OPTIONS}
              value={form.compliance_type}
              onChange={updateSelect('compliance_type')}
              fullWidth
            />
          )}
        </div>

        <h3 style={sheetSectionTitle}>Assignment & Scheduling</h3>
        <div style={sheetFormGroup}>
          <div style={formRowStyle}>
            <div style={formRowHalf}>
              <Select
                label="Assigned Role"
                size="sm"
                options={ROLE_OPTIONS}
                value={form.assigned_role}
                onChange={updateSelect('assigned_role')}
                fullWidth
              />
            </div>
            <div style={formRowHalf}>
              <Select
                label="Department"
                size="sm"
                options={DEPARTMENT_OPTIONS}
                value={form.department}
                onChange={updateSelect('department')}
                fullWidth
              />
            </div>
          </div>

          <div style={formRowStyle}>
            {fields.frequency && (
              <div style={formRowHalf}>
                <Select
                  label="Frequency"
                  size="sm"
                  options={FREQUENCY_OPTIONS}
                  value={form.frequency}
                  onChange={updateSelect('frequency')}
                  fullWidth
                />
              </div>
            )}
            <div style={formRowHalf}>
              <Select
                label="Priority"
                size="sm"
                options={PRIORITY_OPTIONS}
                value={form.priority}
                onChange={updateSelect('priority')}
                fullWidth
              />
            </div>
          </div>

          <div style={formRowStyle}>
            <div style={formRowHalf}>
              <TextInput
                label="Est. Duration (min)"
                size="sm"
                value={form.estimated_duration}
                onChange={updateText('estimated_duration')}
                placeholder="e.g. 30"
                fullWidth
              />
            </div>
            {fields.room && (
              <div style={formRowHalf}>
                <Select
                  label="Room (optional)"
                  size="sm"
                  options={ROOM_OPTIONS}
                  value={form.room}
                  onChange={updateSelect('room')}
                  fullWidth
                />
              </div>
            )}
          </div>
        </div>

        <h3 style={sheetSectionTitle}>Status & Settings</h3>
        <div style={sheetFormGroup}>
          <Select
            label="Status"
            size="sm"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={updateSelect('status')}
            fullWidth
          />
          <Switch
            label={fields.approval === 'required' ? 'Requires Approval (always on for this type)' : 'Requires Approval'}
            checked={fields.approval === 'required' ? true : form.requires_approval}
            onChange={(e) => setForm((prev) => ({ ...prev, requires_approval: e.target.checked }))}
            disabled={fields.approval === 'required'}
          />
        </div>
      </div>
    </form>
  );

  const tasksContent = (
    <div style={sheetBodyStyle}>
      <h3 style={sheetSectionTitle}>{form.type === 'procedure' ? 'Procedure Steps' : `${typeLabel} Items`}</h3>
      <p style={{ color: color.text.secondary, fontSize: font.size.body.sm, margin: `0 0 ${gap.lg} 0` }}>
        {form.type === 'procedure'
          ? 'Add steps in order. Steps will be enforced sequentially.'
          : `Add items that will appear when this ${typeLabel.toLowerCase()} is assigned.`}
      </p>

      <div style={addTaskRowStyle}>
        <div style={{ flex: 1 }}>
          <TextInput
            label="New Task Item"
            size="sm"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="e.g. Check and refill hand sanitizer stations"
            fullWidth
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTask();
              }
            }}
          />
        </div>
        <Button
          variant="primary"
          size="md"
          type="button"
          onClick={addTask}
        >
          Add
        </Button>
      </div>

      {tasks.length > 0 && (
        <div style={{ ...taskListStyle, marginTop: gap.lg }}>
          {tasks.map((task, idx) => (
            <div key={task.id} style={taskItemStyle}>
              <span style={{ color: color.text.muted, fontSize: font.size.body.sm, minWidth: '24px' }}>
                {idx + 1}.
              </span>
              <span style={{ color: color.text.primary, fontSize: font.size.body.sm, flex: 1 }}>
                {task.label}
              </span>
              <button
                type="button"
                style={taskRemoveStyle}
                onClick={() => removeTask(task.id)}
                aria-label={`Remove ${task.label}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: space.xl,
          color: color.text.muted,
          fontSize: font.size.body.sm,
        }}>
          No items added yet. Add items above to build the {typeLabel.toLowerCase()}.
        </div>
      )}
    </div>
  );

  const sheetTabs: SheetTab[] = [
    { id: 'details', label: 'Details', content: detailsContent },
    { id: 'tasks', label: form.type === 'procedure' ? 'Steps' : 'Tasks', content: tasksContent },
  ];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={sheetTitle}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={<>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="edit-template-form" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </>}
    />
  );
}
