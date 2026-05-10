'use client';

import { useState, useEffect, useMemo, type FormEvent } from 'react';
import { Sheet, Button, IconButton, Modal, TextInput, TextArea, Select, Switch } from '@brikdesigns/bds';
import type { SheetTab } from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { useToast } from '@/components/ToastProvider';
import { color, font, gap, space } from '@/lib/tokens';
import {
  sheetBodyStyle,
  sheetSectionTitle,
  sheetFormGroup,
} from '@/app/(auth)/settings/_sheetStyles';
import { AssignmentPicker, type AssignmentMode, type AssignmentValue } from '@/components/AssignmentPicker';
import type { Room } from '@/hooks/useRooms';
import type { EquipmentItem } from '@/hooks/useEquipment';
import type { SupplyCategory } from '@/hooks/useSupplyCategories';
import type { Department } from '@/hooks/useDepartments';
import type { Role } from '@/hooks/useRoles';
import type { Member } from '@/hooks/useMembers';
import type { TaskCategory } from '@/hooks/useTaskCategories';
import type { ComplianceType } from '@/hooks/useComplianceTypes';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TemplateFormData {
  name: string;
  type: string;
  task_category_id: string;
  frequency: string;
  assigned_member_id: string;
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
  members?: Member[];
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
  assigned_member_id: '',
  assigned_role_id: '',
  department_id: '',
  assignment_mode: 'pool',
  display_mode: 'nested',
  priority: 'medium',
  status: 'active',
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
  gap: gap.sm,
};

const itemRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto auto',
  gap: gap.sm,
  alignItems: 'center',
};

const itemContextRowStyle: React.CSSProperties = {
  gridColumn: '1 / -1',
  display: 'flex',
  gap: gap.md,
  padding: `${space.xs} 0 ${space.sm}`,
};

const contextSelectWrap: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const itemActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: gap.xs,
  alignItems: 'center',
};

const itemIndexStyle: React.CSSProperties = {
  color: color.text.muted,
  fontSize: font.size.body.sm,
  alignSelf: 'center',
  minWidth: '24px',
};

const itemEmptyStyle: React.CSSProperties = {
  color: color.text.muted,
  fontSize: font.size.body.sm,
  margin: 0,
};

const itemSummaryStyle: React.CSSProperties = {
  color: color.text.secondary,
  fontSize: font.size.body.sm,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '320px',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasContext(item: ChecklistItem) {
  return !!(item.room_id || item.equipment_id || item.supply_category_id);
}

function toAssignmentMode(value: string): AssignmentMode {
  return value === 'individual' || value === 'role' || value === 'department'
    ? value
    : 'pool';
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
  members = [],
  taskCategories = [],
  complianceTypes = [],
}: EditTemplateSheetProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<TemplateFormData>(EMPTY_FORM);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const isEdit = initialData !== null;
  const typeLabel = TYPE_LABELS[form.type] ?? form.type;
  const fields = TYPE_FIELDS[form.type] ?? TYPE_FIELDS.checklist;
  const sheetTitle = isEdit ? `Edit ${typeLabel}` : `Add ${typeLabel}`;

  const isDirty = useMemo(
    () => {
      const baselineForm = initialData ?? EMPTY_FORM;
      const baselineItems = initialItems ?? [];
      return (
        JSON.stringify(form) !== JSON.stringify(baselineForm) ||
        JSON.stringify(items) !== JSON.stringify(baselineItems)
      );
    },
    [form, items, initialData, initialItems]
  );

  const requestClose = () => {
    if (saving) return;
    if (isDirty) {
      setConfirmCancelOpen(true);
    } else {
      onClose();
    }
  };

  const confirmDiscard = () => {
    setConfirmCancelOpen(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? EMPTY_FORM);
      setItems(initialItems ?? []);
      setActiveTab('details');
      // Items always reopen in read mode — even those with an inventory link.
      // Edit mode is opt-in via the pencil button. Reverses the prior
      // auto-expand-when-context behavior which dumped users into edit forms
      // they hadn't asked for and surfaced a confusing cluster of action
      // buttons (pencil + trash-link + trash-item) on saved rows.
      setExpandedItems(new Set());
    }
  }, [isOpen, initialData, initialItems]);

  const updateText = (field: keyof TemplateFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const updateSelect = (field: keyof TemplateFormData) =>
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAssignmentChange = (next: AssignmentValue) => {
    setForm((prev) => ({
      ...prev,
      assignment_mode: next.mode,
      assigned_member_id: next.memberId,
      assigned_role_id: next.roleId,
      department_id: next.departmentId,
    }));
  };

  const toggleItemExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const newChecklistItem = (): ChecklistItem => ({
    id: crypto.randomUUID(),
    label: '',
    room_id: '',
    equipment_id: '',
    supply_category_id: '',
  });

  const addItem = () => {
    setItems((prev) => [...prev, newChecklistItem()]);
  };

  const updateItemLabel = (id: string, label: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, label } : i)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setExpandedItems((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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

  /**
   * Submit handler. Reachable from either tab — the footer Save button calls
   * this directly via onClick, and the Details form's onSubmit reuses it for
   * Enter-key submission. Earlier the button used the HTML `form=` attribute
   * to submit the Details form by ID, which silently no-op'd whenever the
   * Details tab was unmounted (i.e. user was on the Tasks tab). Routing
   * through React state instead of the DOM form makes the save reachable
   * from either tab.
   */
  const submit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (saving) return;
    if (!form.name.trim()) {
      // Force back to Details so the validation surfaces against the Name field.
      setActiveTab('details');
      return;
    }

    // Auto-prune empty rows on save — they hold no information and pre-existing
    // empty rows from legacy data shouldn't gate save (#299 follow-up). The
    // duplicate-name check still blocks because that's a structural decision
    // only the user can make (rename or remove).
    const templateNameNorm = form.name.trim().toLowerCase();
    const cleanedItems = items.filter((i) => i.label.trim().length > 0);
    const duplicates = cleanedItems.filter(
      (i) => i.label.trim().toLowerCase() === templateNameNorm,
    );
    if (duplicates.length > 0) {
      setActiveTab('tasks');
      showToast({
        title: 'Item label matches template name',
        description: `An item is named "${duplicates[0].label.trim()}" — same as the template. In expanded mode, that spawns a redundant task that reads as a phantom parent. Rename or remove it.`,
        variant: 'error',
      });
      return;
    }

    if (cleanedItems.length !== items.length) {
      setItems(cleanedItems);
    }

    setSaving(true);
    try {
      await onSave(form, cleanedItems);
    } finally {
      setSaving(false);
    }
    onClose();
  };

  // ─── Reference select options ─────────────────────────────────────────────

  const roomOptions = [
    { label: 'Select room', value: '' },
    ...rooms.map((r) => ({ label: r.name, value: r.id })),
  ];

  /**
   * Equipment options filtered by room.
   * Falls back to the template's default room when an item has none, so a
   * checklist tied to a Default Room offers room-relevant equipment by
   * default while still allowing per-item overrides for multi-room checklists.
   */
  function getEquipmentOptions(itemRoomId: string) {
    const effectiveRoom = itemRoomId || form.room_id;
    const filtered = effectiveRoom
      ? equipment.filter((e) => e.room_id === effectiveRoom || !e.room_id)
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

  /**
   * Read-mode display for an item's inventory link. Returns a "·"-joined
   * summary of the resolved names (room · equipment · supply category). Ids
   * with no matching reference row fall back silently; the edit pencil is
   * always the recovery path.
   */
  function itemInventorySummary(item: ChecklistItem): string {
    const parts: string[] = [];
    if (item.room_id) {
      const r = rooms.find((x) => x.id === item.room_id);
      if (r) parts.push(r.name);
    }
    if (item.equipment_id) {
      const e = equipment.find((x) => x.id === item.equipment_id);
      if (e) parts.push(e.name);
    }
    if (item.supply_category_id) {
      const s = supplyCategories.find((x) => x.id === item.supply_category_id);
      if (s) parts.push(s.name);
    }
    return parts.join(' · ');
  }

  const categoryOptions = [
    { label: 'Select category', value: '' },
    ...taskCategories.map((c) => ({ label: c.name, value: c.id })),
  ];

  const complianceOptions = [
    { label: 'Select compliance type', value: '' },
    ...complianceTypes.map((c) => ({ label: c.name, value: c.id })),
  ];

  const assignmentValue: AssignmentValue = {
    mode: toAssignmentMode(form.assignment_mode),
    memberId: form.assigned_member_id,
    roleId: form.assigned_role_id,
    departmentId: form.department_id,
  };

  // ─── Details tab ─────────────────────────────────────────────────────────

  const detailsContent = (
    <form id="edit-template-form" onSubmit={submit}>
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
              <AssignmentPicker
                value={assignmentValue}
                onChange={handleAssignmentChange}
                members={members}
                roles={roles}
                departments={departments}
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

      <div style={itemListStyle}>
        {items.length === 0 && (
          <p style={itemEmptyStyle}>
            {`No ${form.type === 'procedure' ? 'steps' : 'items'} added yet. Click "Add" to start.`}
          </p>
        )}
        {items.map((row, index) => {
          const isExpanded = expandedItems.has(row.id);
          const itemHasContext = hasContext(row);
          const removeLabel = form.type === 'procedure'
            ? `Remove step ${index + 1}`
            : `Remove item ${index + 1}`;
          return (
            <div key={row.id} style={itemRowStyle}>
              <span style={itemIndexStyle}>{index + 1}.</span>
              <TextInput
                size="sm"
                value={row.label}
                onChange={(e) => updateItemLabel(row.id, e.target.value)}
                placeholder={form.type === 'procedure'
                  ? 'e.g. Verify autoclave temperature'
                  : 'e.g. Check and refill hand sanitizer stations'}
                fullWidth
              />
              <div style={itemActionsStyle}>
                {!isExpanded && !itemHasContext && (
                  <IconButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Icon icon={icon.rooms} />}
                    label="Link to inventory"
                    onClick={() => toggleItemExpand(row.id)}
                  />
                )}
                {!isExpanded && itemHasContext && (
                  <>
                    <span style={itemSummaryStyle} aria-label="Inventory link">
                      {itemInventorySummary(row)}
                    </span>
                    <IconButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<Icon icon={icon.edit} />}
                      label="Edit inventory link"
                      onClick={() => toggleItemExpand(row.id)}
                    />
                  </>
                )}
                {isExpanded && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="tiny"
                    onClick={() => toggleItemExpand(row.id)}
                  >
                    Save
                  </Button>
                )}
              </div>
              <IconButton
                type="button"
                variant="secondary"
                size="sm"
                icon={<Icon icon={icon.trash} />}
                label={removeLabel}
                onClick={() => removeItem(row.id)}
              />
              {isExpanded && (
                <div style={itemContextRowStyle}>
                  <div style={contextSelectWrap}>
                    <Select
                      label="Room"
                      size="sm"
                      options={roomOptions}
                      value={row.room_id}
                      onChange={(e) => updateItemContext(row.id, 'room_id', e.target.value)}
                      fullWidth
                    />
                  </div>
                  <div style={contextSelectWrap}>
                    <Select
                      label="Equipment"
                      size="sm"
                      options={getEquipmentOptions(row.room_id)}
                      value={row.equipment_id}
                      onChange={(e) => updateItemContext(row.id, 'equipment_id', e.target.value)}
                      fullWidth
                    />
                  </div>
                  <div style={contextSelectWrap}>
                    <Select
                      label="Supply Category"
                      size="sm"
                      options={supplyCategoryOptions}
                      value={row.supply_category_id}
                      onChange={(e) => updateItemContext(row.id, 'supply_category_id', e.target.value)}
                      fullWidth
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div>
          <Button type="button" variant="secondary" size="sm" onClick={addItem}>
            {form.type === 'procedure' ? 'Add Step' : `Add ${typeLabel} Item`}
          </Button>
        </div>
      </div>
    </div>
  );

  const sheetTabs: SheetTab[] = [
    { id: 'details', label: 'Details', content: detailsContent },
    { id: 'tasks', label: form.type === 'procedure' ? 'Steps' : 'Tasks', content: itemsContent },
  ];

  return (
    <>
      <Sheet
        isOpen={isOpen}
        onClose={requestClose}
        title={sheetTitle}
        width="600px"
        side="right"
        closeOnBackdrop={false}
        tabs={sheetTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        footer={<>
          <Button variant="ghost" size="md" type="button" onClick={requestClose}>Cancel</Button>
          <Button
            variant="primary"
            size="md"
            type="button"
            onClick={() => { void submit(); }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </>}
      />
      <Modal
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        preset="confirm"
        title="Discard changes?"
        description="You have unsaved changes. Closing now will lose any edits to this template."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        confirmVariant="destructive"
        onConfirm={confirmDiscard}
      />
    </>
  );
}
