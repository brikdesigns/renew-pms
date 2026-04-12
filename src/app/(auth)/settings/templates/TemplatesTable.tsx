'use client';

import { useState, useRef, type CSSProperties } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Button, IconButton, Tag, SegmentedControl, useSheetStack } from '@bds/components';
import { EditTemplateSheet, type TemplateFormData, type ChecklistItem } from '@/components/EditTemplateSheet';
import { ViewTemplateSheet } from '@/components/ViewTemplateSheet';
import { color, font, space, gap, border, shadow } from '@/lib/tokens';
import { FREQUENCY_LABELS } from '@/lib/frequency-labels';
import { FrequencyTag } from '@/components/FrequencyTag';
import { StatusBadge } from '@/components/StatusBadge';
import { useTemplates } from '@/hooks/useTemplates';
import { TableSkeleton } from '@/components/TableSkeleton';
import { useRooms } from '@/hooks/useRooms';
import { useEquipment } from '@/hooks/useEquipment';
import { useSupplyCategories } from '@/hooks/useSupplyCategories';
import { useDepartments } from '@/hooks/useDepartments';
import { useRoles } from '@/hooks/useRoles';
import { useTaskCategories } from '@/hooks/useTaskCategories';
import { useComplianceTypes } from '@/hooks/useComplianceTypes';
import type { TaskTemplate } from '@/hooks/useTemplates';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

// ─── Type display mapping ────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; icon: string }> = {
  checklist:      { label: 'Checklist',      icon: icon.typeChecklist },
  procedure:      { label: 'Procedure',      icon: icon.typeProcedure },
  compliance:     { label: 'Compliance',     icon: icon.typeCompliance },
  request:        { label: 'Request',        icon: icon.typeRequest },
  onboarding:     { label: 'Onboarding',     icon: icon.typeOnboarding },
  skill_training: { label: 'Skill Training', icon: icon.typeSkillTraining },
};


// ─── Default form state per type ─────────────────────────────────────────────

const EMPTY_FORM_BASE: TemplateFormData = {
  name: '', type: 'checklist', task_category_id: '', frequency: 'daily',
  assigned_role_id: '', department_id: '', assignment_mode: 'pool', display_mode: 'nested',
  priority: 'medium', status: 'draft',
  description: '', requires_approval: false, estimated_duration: '', room_id: '', compliance_type_id: '',
};

const EMPTY_FORM_BY_TYPE: Record<string, TemplateFormData> = {
  checklist:      { ...EMPTY_FORM_BASE, type: 'checklist', frequency: 'daily', requires_approval: false },
  procedure:      { ...EMPTY_FORM_BASE, type: 'procedure', frequency: 'per_shift', requires_approval: true },
  compliance:     { ...EMPTY_FORM_BASE, type: 'compliance', frequency: 'quarterly', priority: 'high', requires_approval: true },
  request:        { ...EMPTY_FORM_BASE, type: 'request', frequency: '', requires_approval: true },
  onboarding:     { ...EMPTY_FORM_BASE, type: 'onboarding', frequency: '', requires_approval: false },
  skill_training: { ...EMPTY_FORM_BASE, type: 'skill_training', frequency: 'monthly', requires_approval: false },
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const tabContentStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
};

const subHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${space.md} ${space.xl}`,
  borderBottom: `1px solid ${color.border.muted}`,
};

const subHeaderLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: space.sm,
};

const subHeaderTitleStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.md,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
  margin: 0,
};

const subHeaderCountStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.medium,
  color: color.text.secondary,
  backgroundColor: color.surface.secondary,
  padding: `2px ${gap.md}`,
  borderRadius: border.radius.sm,
};

const tableWrapperStyle: CSSProperties = {
  flex: 1,
  overflowX: 'auto',
  paddingInline: space.xl,
};

// typeChipStyle removed — TypeChip now uses BDS Tag

const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

const ADD_MENU_TYPES = [
  { id: 'checklist',     label: 'Checklist',  desc: 'Recurring to-do lists',      icon: icon.typeChecklist },
  { id: 'procedure',     label: 'Procedure',  desc: 'Step-by-step workflows',      icon: icon.typeProcedure },
  { id: 'compliance',    label: 'Compliance', desc: 'Regulatory & safety tasks',   icon: icon.typeCompliance },
  { id: 'onboarding',    label: 'Onboarding', desc: 'New employee orientation',    icon: icon.typeOnboarding },
  { id: 'skill_training',label: 'Training',   desc: 'Continuing education',        icon: icon.typeSkillTraining },
];

const TASK_TYPES = ['checklist', 'procedure', 'compliance', 'request'];
const TRAINING_TYPES = ['onboarding', 'skill_training'];

type TemplateSegment = 'tasks' | 'training';

const TEMPLATE_SEGMENTS = [
  { label: 'Tasks', value: 'tasks' },
  { label: 'Training', value: 'training' },
];

const SEGMENT_TYPES: Record<TemplateSegment, string[]> = {
  tasks: TASK_TYPES,
  training: TRAINING_TYPES,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function TypeChip({ type }: { type: string }) {
  const meta = TYPE_META[type] ?? TYPE_META.checklist;
  return (
    <Tag size="sm" style={{ backgroundColor: color.surface.secondary, color: color.text.secondary }}>
      {meta.label}
    </Tag>
  );
}


// ─── Component ───────────────────────────────────────────────────────────────

export function TemplatesTable() {
  const { pushSheet } = useSheetStack();
  const { templates, setTemplates, loading } = useTemplates();
  const [segment, setSegment] = useState<TemplateSegment>('tasks');
  const typeFilter = SEGMENT_TYPES[segment];

  // Reference data for form selects
  const { rooms } = useRooms();
  const { equipment } = useEquipment();
  const { supplyCategories } = useSupplyCategories();
  const { departments } = useDepartments();
  const { roles } = useRoles();
  const { taskCategories } = useTaskCategories();
  const { complianceTypes } = useComplianceTypes();

  const { showToast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [newTemplateType, setNewTemplateType] = useState('checklist');
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<TaskTemplate | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const addBtnRef = useRef<HTMLDivElement>(null);

  const filteredTemplates = typeFilter
    ? templates.filter((t) => typeFilter.includes(t.type))
    : templates;

  const filteredAddTypes = typeFilter
    ? ADD_MENU_TYPES.filter((t) => typeFilter.includes(t.id))
    : ADD_MENU_TYPES;

  // ─── Resolve UUID to display name ─────────────────────────────────────────

  const resolveCategory = (id: string | null) =>
    taskCategories.find((c) => c.id === id)?.name ?? '—';

  const resolveRole = (id: string | null) =>
    id ? (roles.find((r) => r.id === id)?.name ?? '—') : 'All Staff';

  const resolveFrequency = (f: string | null) =>
    f ? (FREQUENCY_LABELS[f] ?? f) : '—';

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleAddClick = (type: string) => {
    setEditingTemplate(null);
    setAddMenuOpen(false);
    setNewTemplateType(type);
    setSheetOpen(true);
  };

  const handleEditClick = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setSheetOpen(true);
  };

  const handleViewClick = (template: TaskTemplate) => {
    setViewingTemplate(template);
    setViewSheetOpen(true);
  };

  const handleSheetClose = () => { setSheetOpen(false); setEditingTemplate(null); };
  const handleViewClose = () => { setViewSheetOpen(false); setViewingTemplate(null); };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/templates/${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      showToast({ title: 'Deleted', description: `${deleteTarget.name} has been deleted.`, variant: 'success' });
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to delete template' }));
      showToast({ title: 'Error', description: err.error, variant: 'error' });
    }
    setDeleteTarget(null);
  };

  const handleSave = async (data: TemplateFormData, items: ChecklistItem[]) => {
    const body = {
      name: data.name,
      description: data.description,
      type: data.type,
      task_category_id: data.task_category_id || null,
      compliance_type_id: data.compliance_type_id || null,
      room_id: data.room_id || null,
      assigned_role_id: data.assigned_role_id || null,
      department_id: data.department_id || null,
      frequency: data.frequency || null,
      priority: data.priority,
      estimated_duration: data.estimated_duration ? parseInt(data.estimated_duration, 10) : null,
      requires_approval: data.requires_approval,
      status: data.status,
      assignment_mode: data.assignment_mode,
      display_mode: data.display_mode,
    };

    if (editingTemplate) {
      // Update template
      const res = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) return;
      const updated = await res.json() as TaskTemplate;

      // Replace items (full replace)
      const itemsRes = await fetch(`/api/templates/${editingTemplate.id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items.map((i) => ({
          label: i.label,
          room_id: i.room_id || null,
          equipment_id: i.equipment_id || null,
          supply_category_id: i.supply_category_id || null,
        }))),
      });
      const updatedItems = itemsRes.ok ? await itemsRes.json() : editingTemplate.checklist_items;

      setTemplates((prev) =>
        prev.map((t) => t.id === editingTemplate.id ? { ...t, ...updated, checklist_items: updatedItems } : t)
      );
    } else {
      // Create template
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, type: data.type }),
      });
      if (!res.ok) return;
      const created = await res.json() as TaskTemplate;

      if (items.length > 0) {
        const itemsRes = await fetch(`/api/templates/${created.id}/items`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(items.map((i) => ({
            label: i.label,
            room_id: i.room_id || null,
            equipment_id: i.equipment_id || null,
            supply_category_id: i.supply_category_id || null,
          }))),
        });
        if (itemsRes.ok) created.checklist_items = await itemsRes.json();
      }

      setTemplates((prev) => [...prev, created]);
    }
  };

  // ─── Build sheet initial data ─────────────────────────────────────────────

  const sheetInitialData: TemplateFormData | null = editingTemplate
    ? {
        name: editingTemplate.name,
        type: editingTemplate.type,
        task_category_id: editingTemplate.task_category_id ?? '',
        frequency: editingTemplate.frequency ?? '',
        assigned_role_id: editingTemplate.assigned_role_id ?? '',
        department_id: editingTemplate.department_id ?? '',
        priority: editingTemplate.priority,
        status: editingTemplate.status,
        description: editingTemplate.description ?? '',
        requires_approval: editingTemplate.requires_approval,
        estimated_duration: editingTemplate.estimated_duration ? String(editingTemplate.estimated_duration) : '',
        room_id: editingTemplate.room_id ?? '',
        compliance_type_id: editingTemplate.compliance_type_id ?? '',
        assignment_mode: editingTemplate.assignment_mode ?? 'pool',
        display_mode: editingTemplate.display_mode ?? 'nested',
      }
    : { ...EMPTY_FORM_BY_TYPE[newTemplateType] };

  const sheetInitialItems: ChecklistItem[] = (editingTemplate?.checklist_items ?? []).map((i) => ({
    id: i.id,
    label: i.label,
    room_id: i.room_id ?? '',
    equipment_id: i.equipment_id ?? '',
    supply_category_id: i.supply_category_id ?? '',
  }));

  // ─── Resolve view data ────────────────────────────────────────────────────

  const buildViewTemplate = (t: TaskTemplate) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    category: resolveCategory(t.task_category_id),
    frequency: resolveFrequency(t.frequency),
    assigned_role: resolveRole(t.assigned_role_id),
    department: departments.find((d) => d.id === t.department_id)?.name ?? '—',
    assignment_mode: t.assignment_mode ?? 'pool',
    display_mode: t.display_mode ?? 'nested',
    priority: t.priority,
    status: t.status,
    description: t.description ?? '',
    requires_approval: t.requires_approval,
    estimated_duration: t.estimated_duration ? String(t.estimated_duration) : '',
    room: rooms.find((r) => r.id === t.room_id)?.name ?? '',
    compliance_type: complianceTypes.find((c) => c.id === t.compliance_type_id)?.name ?? '',
    is_default: t.is_default,
    tasks: t.checklist_items.map((i) => ({ id: i.id, label: i.label })),
  });

  return (
    <div style={tabContentStyle}>
      {/* Sub-header */}
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <SegmentedControl
            items={TEMPLATE_SEGMENTS}
            value={segment}
            onChange={(v) => setSegment(v as TemplateSegment)}
            size="sm"
          />
          <span style={subHeaderCountStyle}>{filteredTemplates.length}</span>
        </div>
        <div ref={addBtnRef} style={{ position: 'relative' }}>
          <Button
            variant="primary"
            size="sm"
            iconAfter={<Icon icon={icon.chevronDown} />}
            onClick={() => setAddMenuOpen((p) => !p)}
          >
            Add Template
          </Button>
          {addMenuOpen && (
            <div
              style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 100,
                backgroundColor: color.surface.primary, borderRadius: border.radius.md,
                border: `1px solid ${color.border.muted}`,
                boxShadow: shadow.md, minWidth: 240, overflow: 'hidden',
              }}
            >
              {filteredAddTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleAddClick(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: gap.md,
                    width: '100%', padding: `${space.sm} ${space.md}`,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: font.family.label, fontSize: font.size.label.sm,
                    color: color.text.primary, textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = color.surface.accent; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
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
      </div>

      {/* Templates table */}
      <div style={tableWrapperStyle}>
        {loading ? (
          <Table size="default" flush>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>{' '}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton columns={5} />
            </TableBody>
          </Table>
        ) : (
          <Table size="default" flush>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Assigned Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ width: '120px' }}>{' '}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary }}>
                      {template.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <TypeChip type={template.type} />
                  </TableCell>
                  <TableCell>
                    <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary }}>
                      {resolveCategory(template.task_category_id)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <FrequencyTag value={template.frequency} />
                  </TableCell>
                  <TableCell>
                    <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary }}>
                      {resolveRole(template.assigned_role_id)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={template.status} />
                  </TableCell>
                  <TableCell>
                    <div style={actionBtnGroup}>
                      <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.eye} />} label={`View ${template.name}`} onClick={() => handleViewClick(template)} />
                      <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.edit} />} label={`Edit ${template.name}`} onClick={() => handleEditClick(template)} />
                      <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.trash} />} label={`Delete ${template.name}`} onClick={() => setDeleteTarget({ id: template.id, name: template.name })} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTemplates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div style={{ textAlign: 'center', padding: space.xl, color: color.text.muted, fontSize: font.size.body.sm }}>
                      No templates yet. Add your first template above.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <EditTemplateSheet
        isOpen={sheetOpen}
        onClose={handleSheetClose}
        initialData={sheetInitialData}
        initialItems={sheetInitialItems}
        onSave={handleSave}
        rooms={rooms}
        equipment={equipment}
        supplyCategories={supplyCategories}
        departments={departments}
        roles={roles}
        taskCategories={taskCategories}
        complianceTypes={complianceTypes}
      />

      <ViewTemplateSheet
        isOpen={viewSheetOpen}
        onClose={handleViewClose}
        template={viewingTemplate ? buildViewTemplate(viewingTemplate) : null}
        onNavigate={(type, props, opts) => pushSheet(type, props, opts)}
      />
      <ConfirmDeleteDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name ?? ''}
        itemType="template"
      />
    </div>
  );
}
