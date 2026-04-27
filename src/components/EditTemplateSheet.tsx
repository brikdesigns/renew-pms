'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Sheet, Button, IconButton, TextInput, TextArea, Select, Switch } from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import type { SheetTab } from '@brikdesigns/bds';
import { useToast } from '@/components/ToastProvider';
import { color, font, gap, space, border } from '@/lib/tokens';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';
import type { Room } from '@/hooks/useRooms';
import type { EquipmentItem } from '@/hooks/useEquipment';
import type { SupplyCategory } from '@/hooks/useSupplyCategories';
import type { Department } from '@/hooks/useDepartments';
import type { Role } from '@/hooks/useRoles';
import type { TaskCategory } from '@/hooks/useTaskCategories';
import type { ComplianceType } from '@/hooks/useComplianceTypes';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TemplateFormData {
  name: string;
  type: string;
  task_category_id: string;
  frequency: string;
  assigned_role_id: string;
  department_id: string;
  assignment_mode: string;
  display_mode: string;
  priority: string;
  status: string;
  description: string;
  requires_approval: boolean;
  estimated_duration: string;
  room_id: string;
  compliance_type_id: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  room_id: string;
  equipment_id: string;
  supply_category_id: string;
}

interface EditTemplateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** null = Add mode, object = Edit mode */
  initialData: TemplateFormData | null;
  initialItems?: ChecklistItem[];
  onSave: (data: TemplateFormData, items: ChecklistItem[]) => Promise<void>;
  // Reference data for selects — optional; defaults to empty (loading state)
  rooms?: Room[];
  equipment?: EquipmentItem[];
  supplyCategories?: SupplyCategory[];
  departments?: Department[];
  roles?: Role[];
  taskCategories?: TaskCategory[];
  complianceTypes?: ComplianceType[];
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

const TYPE_FIELDS: Record<string, {
  room: boolean;
  frequency: boolean;
  compliance: boolean;
  approval: 'required' | 'optional' | false;
}> = {
  checklist:      { room: true,  frequency: true,  compliance: false, approval: 'optional' },
  procedure:      { room: true,  frequency: true,  compliance: false, approval: 'required' },
  compliance:     { room: true,  frequency: true,  compliance: true,  approval: 'required' },
  request:        { room: true,  frequency: true,  compliance: false, approval: 'required' },
  onboarding:     { room: false, frequency: false, compliance: false, approval: 'optional' },
  skill_training: { room: false, frequency: true,  compliance: false, approval: 'optional' },
};

// ─── Static options (enum fields — not user-renameable) ──────────────────────

const TYPE_OPTIONS = [
  { label: 'Checklist',     value: 'checklist' },
  { label: 'Procedure',     value: 'procedure' },
  { label: 'Compliance',    value: 'compliance' },
  { label: 'Request',       value: 'request' },
  { label: 'Onboarding',    value: 'onboarding' },
  { label: 'Skill Training',value: 'skill_training' },
];

const FREQUENCY_OPTIONS = [
  { label: 'Select frequency', value: '' },
  { label: 'Daily',        value: 'daily' },
  { label: 'Weekly',       value: 'weekly' },
  { label: 'Bi-Weekly',    value: 'bi_weekly' },
  { label: 'Monthly',      value: 'monthly' },
  { label: 'Quarterly',    value: 'quarterly' },
  { label: 'Semi-Annually',value: 'semi_annually' },
  { label: 'Annually',     value: 'annually' },
  { label: 'Per Shift',    value: 'per_shift' },
  { label: 'Custom',       value: 'custom' },
];

const PRIORITY_OPTIONS = [
  { label: 'Low',      value: 'low' },
  { label: 'Medium',   value: 'medium' },
  { label: 'High',     value: 'high' },
  { label: 'Critical', value: 'critical' },
];

const ASSIGNMENT_MODE_OPTIONS = [
  { label: 'Individual (specific person)', value: 'individual' },
  { label: 'Role (anyone in role)',         value: 'role' },
  { label: 'Department (anyone in dept)',   value: 'department' },
  { label: 'Pool (everyone)',               value: 'pool' },
];

const DISPLAY_MODE_OPTIONS = [
  { label: 'Nested (single card with checklist)', value: 'nested' },
  { label: 'Expanded (one card per item)',         value: 'expanded' },
];

const STATUS_OPTIONS = [
  { label: 'Active',   value: 'active' },
  { label: 'Draft',    value: 'draft' },
  { label: 'Archived', value: 'archived' },
];

// ─── Default form state ───────────────────────────────────────────────────────

const EMPTY_FORM: TemplateFormData = {
  name: '',
  type: 'checklist',
  task_category_id: '',
  frequency: 'daily',
  assigned_role_id: '',
  department_id: '',
  assignment_mode: 'pool',
  display_mode: 'nested',
  priority: 'medium',
  status: 'draft',
  description: '',
  requires_approval: false,
  estimated_duration: '',
  room_id: '',
  compliance_type_id: '',
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const formRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: gap.lg,
  width: '100%',
};

const formRowHalf: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const itemListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.md,
};

const itemRowStyle: React.CSSProperties = {
  borderRadius: border.radius.sm,
  border: `${border.width.sm} solid ${color.border.muted}`,
  backgroundColor: color.surface.primary,
  overflow: 'hidden',
};

const itemMainRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
  padding: `${space.sm} ${space.md}`,
};

const itemContextRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: gap.md,
  padding: `${space.xs} ${space.md} ${space.sm}`,
  borderTop: `1px solid ${color.border.muted}`,
  backgroundColor: color.surface.secondary,
};

const contextSelectWrap: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const addItemRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: gap.md,
  alignItems: 'flex-end',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasContext(item: ChecklistItem) {
  return !!(item.room_id || item.equipment_id || item.supply_category_id);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EditTemplateSheet({
  isOpen,
  onClose,
  initialData,
  initialItems,
  onSave,
  rooms = [],
  equipment = [],
  supplyCategories = [],
  departments = [],
  roles = [],
  taskCategories = [],
  complianceTypes = [],
}: EditTemplateSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<TemplateFormData>(EMPTY_FORM);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const isEdit = initialData !== null;
  const typeLabel = TYPE_LABELS[form.type] ?? form.type;
  const fields = TYPE_FIELDS[form.type] ?? TYPE_FIELDS.checklist;
  const sheetTitle = isEdit ? `Edit ${typeLabel}` : `Add ${typeLabel}`;

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? EMPTY_FORM);
      setItems(initialItems ?? []);
      setNewItem('');
      setActiveTab('details');
      // Auto-expand items that already have context set
      const withContext = new Set(
        (initialItems ?? []).filter(hasContext).map((i) => i.id)
      );
      setExpandedItems(withContext);
    }
  }, [isOpen, initialData, initialItems]);

  const updateText = (field: keyof TemplateFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const updateSelect = (field: keyof TemplateFormData) =>
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleItemExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: newItem.trim(), room_id: '', equipment_id: '', supply_category_id: '' },
    ]);
    setNewItem('');
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setExpandedItems((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const updateItemContext = (id: string, field: 'room_id' | 'equipment_id' | 'supply_category_id', value: string) => {
    setItems((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const next = { ...i, [field]: value };
      // Clear equipment when room changes
      if (field === 'room_id') next.equipment_id = '';
      return next;
    }));
  };

  const clearItemContext = (id: string) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, room_id: '', equipment_id: '', supply_category_id: '' } : i));
    setExpandedItems((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(form, items);
    setSaving(false);
    showToast({
      title: isEdit ? 'Template updated' : 'Template created',
      description: isEdit ? `${form.name} has been updated.` : `${form.name} has been created.`,
      variant: 'success',
    });
    onClose();
  };

  // ─── Reference select options ─────────────────────────────────────────────

  const roomOptions = [
    { label: 'Select room', value: '' },
    ...rooms.map((r) => ({ label: r.name, value: r.id })),
  ];

  /** Equipment options filtered by room — call per item */
  function getEquipmentOptions(roomId: string) {
    const filtered = roomId
      ? equipment.filter((e) => e.room_id === roomId || !e.room_id)
      : equipment;
    return [
      { label: 'Select equipment', value: '' },
      ...filtered.map((e) => ({ label: e.name, value: e.id })),
    ];
  }

  const supplyCategoryOptions = [
    { label: 'Select supply category', value: '' },
    ...supplyCategories.map((s) => ({ label: s.name, value: s.id })),
  ];

  const departmentOptions = [
    { label: 'Select department', value: '' },
    ...departments.map((d) => ({ label: d.name, value: d.id })),
  ];

  const roleOptions = [
    { label: 'All Staff', value: '' },
    ...roles.map((r) => ({ label: r.name, value: r.id })),
  ];

  const categoryOptions = [
    { label: 'Select category', value: '' },
    ...taskCategories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const complianceOptions = [
    { label: 'Select compliance type', value: '' },
    ...complianceTypes.map((c) => ({ label: c.name, value: c.id })),
  ];

  // ─── Details tab ─────────────────────────────────────────────────────────

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
            size="sm"
            value={form.description}
            onChange={updateText('description')}
            placeholder="What this template covers and when it should be used"
            rows={3}
            fullWidth
          />

          <Select
            label="Category"
            size="sm"
            options={categoryOptions}
            value={form.task_category_id}
            onChange={updateSelect('task_category_id')}
            fullWidth
          />

          {fields.compliance && (
            <Select
              label="Compliance Type"
              size="sm"
              options={complianceOptions}
              value={form.compliance_type_id}
              onChange={updateSelect('compliance_type_id')}
              fullWidth
            />
          )}
        </div>

        <h3 style={sheetSectionTitle}>Assignment & Scheduling</h3>
        <div style={sheetFormGroup}>
          <div style={formRowStyle}>
            <div style={formRowHalf}>
              <Select
                label="Assignment Mode"
                size="sm"
                options={ASSIGNMENT_MODE_OPTIONS}
                value={form.assignment_mode}
                onChange={updateSelect('assignment_mode')}
                fullWidth
              />
            </div>
            <div style={formRowHalf}>
              <Select
                label="Display Mode"
                size="sm"
                options={DISPLAY_MODE_OPTIONS}
                value={form.display_mode}
                onChange={updateSelect('display_mode')}
                fullWidth
              />
            </div>
          </div>

          {(form.assignment_mode === 'role' || form.assignment_mode === 'individual') && (
            <div style={formRowStyle}>
              <div style={formRowHalf}>
                <Select
                  label="Assigned Role"
                  size="sm"
                  options={roleOptions}
                  value={form.assigned_role_id}
                  onChange={updateSelect('assigned_role_id')}
                  fullWidth
                />
              </div>
              <div style={formRowHalf}>
                <Select
                  label="Department"
                  size="sm"
                  options={departmentOptions}
                  value={form.department_id}
                  onChange={updateSelect('department_id')}
                  fullWidth
                />
              </div>
            </div>
          )}

          {form.assignment_mode === 'department' && (
            <Select
              label="Department"
              size="sm"
              options={departmentOptions}
              value={form.department_id}
              onChange={updateSelect('department_id')}
              fullWidth
            />
          )}

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
                  label="Default Room (optional)"
                  size="sm"
                  options={roomOptions}
                  value={form.room_id}
                  onChange={updateSelect('room_id')}
                  fullWidth
                />
              </div>
            )}
          </div>
        </div>

        <h3 style={sheetSectionTitle}>Status & Settings</h3>
        <div style={sheetFormGroup}>
          <div style={formRowStyle}>
            <div style={formRowHalf}>
              <Select
                label="Status"
                size="sm"
                options={STATUS_OPTIONS}
                value={form.status}
                onChange={updateSelect('status')}
                fullWidth
              />
            </div>
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
          </div>
          <Switch
            label="Requires Approval"
            size="sm"
            checked={form.requires_approval}
            onChange={(e) => setForm((prev) => ({ ...prev, requires_approval: e.target.checked }))}
          />
        </div>
      </div>
    </form>
  );

  // ─── Items tab ────────────────────────────────────────────────────────────

  const itemsContent = (
    <div style={sheetBodyStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.xs }}>
        <h3 style={sheetSectionTitle}>
          {form.type === 'procedure' ? 'Procedure Steps' : `${typeLabel} Items`}
        </h3>
        <p style={{ color: color.text.secondary, fontSize: font.size.body.sm, margin: 0 }}>
          {form.type === 'procedure'
            ? 'Add steps in order. Steps will be enforced sequentially.'
            : `Add items that will appear when this ${typeLabel.toLowerCase()} is assigned. Optionally connect each item to a room, equipment, or supply category.`}
        </p>
      </div>

      <div style={addItemRowStyle}>
        <div style={{ flex: 1 }}>
          <TextInput
            label="New Item"
            size="sm"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="e.g. Check and refill hand sanitizer stations"
            fullWidth
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
          />
        </div>
        <Button variant="primary" size="sm" type="button" onClick={addItem}>
          Add
        </Button>
      </div>

      {items.length > 0 && (
        <div style={{ ...itemListStyle, marginTop: gap.lg }}>
          {items.map((item, idx) => {
            const isExpanded = expandedItems.has(item.id);
            const itemHasContext = hasContext(item);
            return (
              <div key={item.id} style={itemRowStyle}>
                {/* Main row */}
                <div style={itemMainRowStyle}>
                  <span style={{ color: color.text.muted, fontSize: font.size.body.sm, minWidth: '24px' }}>
                    {idx + 1}.
                  </span>
                  <span style={{ color: color.text.primary, fontSize: font.size.body.sm, flex: 1 }}>
                    {item.label}
                  </span>
                  {!isExpanded && !itemHasContext && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="tiny"
                      onClick={() => toggleItemExpand(item.id)}
                    >
                      + Link to inventory
                    </Button>
                  )}
                  {!isExpanded && itemHasContext && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="tiny"
                        onClick={() => toggleItemExpand(item.id)}
                      >
                        Edit link
                      </Button>
                      <Button
                        type="button"
                        variant="danger-ghost"
                        size="tiny"
                        onClick={() => clearItemContext(item.id)}
                      >
                        Remove link
                      </Button>
                    </>
                  )}
                  {isExpanded && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="tiny"
                      onClick={() => toggleItemExpand(item.id)}
                    >
                      Done
                    </Button>
                  )}
                  <IconButton
                    variant="danger-ghost"
                    size="tiny"
                    icon={<Icon icon={icon.remove} />}
                    label={`Remove ${item.label}`}
                    onClick={() => removeItem(item.id)}
                  />
                </div>

                {/* Context row — shown when expanded or has existing context */}
                {isExpanded && (
                  <div style={itemContextRowStyle}>
                    <div style={contextSelectWrap}>
                      <Select
                        label="Room"
                        size="sm"
                        options={roomOptions}
                        value={item.room_id}
                        onChange={(e) => updateItemContext(item.id, 'room_id', e.target.value)}
                        fullWidth
                      />
                    </div>
                    <div style={contextSelectWrap}>
                      <Select
                        label="Equipment"
                        size="sm"
                        options={getEquipmentOptions(item.room_id)}
                        value={item.equipment_id}
                        onChange={(e) => updateItemContext(item.id, 'equipment_id', e.target.value)}
                        fullWidth
                      />
                    </div>
                    <div style={contextSelectWrap}>
                      <Select
                        label="Supply Category"
                        size="sm"
                        options={supplyCategoryOptions}
                        value={item.supply_category_id}
                        onChange={(e) => updateItemContext(item.id, 'supply_category_id', e.target.value)}
                        fullWidth
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {items.length === 0 && (
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
    { id: 'tasks', label: form.type === 'procedure' ? 'Steps' : 'Tasks', content: itemsContent },
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
