'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { Button, IconButton, Menu, Tag, SegmentedControl, useSheetStack } from '@brikdesigns/bds';
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
import { useMembers } from '@/hooks/useMembers';
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
  assigned_member_id: '', assigned_role_id: '', department_id: '', assignment_mode: 'pool', display_mode: 'nested',
  priority: 'medium', status: 'active',
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

// TODO(bds-migration): body-cell bg is a local patch. Promote to BDS Table.css
// (.bds-table-cell { background-color: var(--background-primary) }) once the
// in-flight BDS session is reconciled, then remove this.
const bodyCellStyle: CSSProperties = { backgroundColor: color.background.primary };

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
  const { templates, setTemplates, loading: templatesLoading } = useTemplates();
  const [segment, setSegment] = useState<TemplateSegment>('tasks');
  const typeFilter = SEGMENT_TYPES[segment];

  // Reference data for form selects
  const { rooms } = useRooms();
  const { equipment } = useEquipment();
  const { supplyCategories } = useSupplyCategories();
  const { departments } = useDepartments();
  const { roles, loading: rolesLoading } = useRoles();
  const { members } = useMembers();
  const { taskCategories, loading: categoriesLoading } = useTaskCategories();
  const { complianceTypes } = useComplianceTypes();

  // Hold the skeleton until templates AND the body lookups (Category, Assigned
  // Role) resolve — otherwise rows render with "—" placeholders that pop into
  // real values after the fact.
  const loading = templatesLoading || rolesLoading || categoriesLoading;

  const { showToast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null);
  const [newTemplateType, setNewTemplateType] = useState('checklist');
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<TaskTemplate | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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
    id ? (roles.find((r) => r.id === id)?.name ?? '—') : '—';

  const resolveMemberName = (id: string | null) => {
    if (!id) return '—';
    const m = members.find((mem) => mem.id === id);
    if (!m) return '—';
    const name = `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim();
    return name || m.email || '—';
  };

  const resolveDepartment = (id: string | null) =>
    id ? (departments.find((d) => d.id === id)?.name ?? '—') : '—';

  // Mode-aware assignee label for the table column. Reads only the FK that
  // matches assignment_mode — never the "wrong" FK left over from a prior edit.
  const resolveAssignee = (template: TaskTemplate) => {
    switch (template.assignment_mode) {
      case 'individual': return resolveMemberName(template.assigned_member_id);
      case 'role':       return resolveRole(template.assigned_role_id);
      case 'department': return resolveDepartment(template.department_id);
      case 'pool':
      default:           return 'All Staff';
    }
  };

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
      assigned_member_id: data.assigned_member_id || null,
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

    const itemsBody = items.map((i) => ({
      label: i.label,
      room_id: i.room_id || null,
      equipment_id: i.equipment_id || null,
      supply_category_id: i.supply_category_id || null,
    }));

    if (editingTemplate) {
      // Update template fields
      const res = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to save template' }));
        showToast({ title: 'Error', description: err.error, variant: 'error' });
        return;
      }
      const updated = await res.json() as TaskTemplate;

      // Replace items (full replace). If this fails, the template fields
      // already saved — surface the partial-save state rather than silently
      // reverting to the old items, which makes the UI lie about persistence.
      const itemsRes = await fetch(`/api/templates/${editingTemplate.id}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemsBody),
      });
      if (!itemsRes.ok) {
        const err = await itemsRes.json().catch(() => ({ error: 'Failed to save checklist items' }));
        showToast({
          title: 'Checklist not saved',
          description: `Template details saved, but checklist items did not: ${err.error}`,
          variant: 'error',
        });
        // Reflect the saved fields; leave items untouched so the user can retry.
        setTemplates((prev) =>
          prev.map((t) => t.id === editingTemplate.id ? { ...t, ...updated } : t)
        );
        return;
      }
      const updatedItems = await itemsRes.json();
      setTemplates((prev) =>
        prev.map((t) => t.id === editingTemplate.id ? { ...t, ...updated, checklist_items: updatedItems } : t)
      );
      showToast({ title: 'Saved', description: `${updated.name} updated.`, variant: 'success' });
    } else {
      // Create template
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, type: data.type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to create template' }));
        showToast({ title: 'Error', description: err.error, variant: 'error' });
        return;
      }
      const created = await res.json() as TaskTemplate;

      if (items.length > 0) {
        const itemsRes = await fetch(`/api/templates/${created.id}/items`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemsBody),
        });
        if (!itemsRes.ok) {
          const err = await itemsRes.json().catch(() => ({ error: 'Failed to save checklist items' }));
          showToast({
            title: 'Checklist not saved',
            description: `Template created, but checklist items did not save: ${err.error}`,
            variant: 'error',
          });
          setTemplates((prev) => [...prev, created]);
          return;
        }
        created.checklist_items = await itemsRes.json();
      }

      setTemplates((prev) => [...prev, created]);
      showToast({ title: 'Created', description: `${created.name} added.`, variant: 'success' });
    }
  };

  // ─── Build sheet initial data ─────────────────────────────────────────────

  const sheetInitialData: TemplateFormData | null = editingTemplate
    ? {
        name: editingTemplate.name,
        type: editingTemplate.type,
        task_category_id: editingTemplate.task_category_id ?? '',
        frequency: editingTemplate.frequency ?? '',
        assigned_member_id: editingTemplate.assigned_member_id ?? '',
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

  // ViewTemplateSheet branches on assignment_mode and applies its own '—' fallback,
  // so we only resolve the FK that matches the template's mode and leave the
  // others empty. Avoids carrying stale lookups from a prior assignment.
  const buildViewTemplate = (t: TaskTemplate) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    category: resolveCategory(t.task_category_id),
    frequency: resolveFrequency(t.frequency),
    assigned_user: t.assignment_mode === 'individual' ? resolveMemberName(t.assigned_member_id) : '',
    assigned_role:  t.assignment_mode === 'role'       ? resolveRole(t.assigned_role_id)        : '',
    department:     t.assignment_mode === 'department' ? resolveDepartment(t.department_id)     : '',
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

  const handleEditFromView = () => {
    if (!viewingTemplate) return;
    setViewSheetOpen(false);
    setEditingTemplate(viewingTemplate);
    setSheetOpen(true);
  };

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
        <div style={{ position: 'relative' }}>
          <Button
            variant="primary"
            size="sm"
            iconAfter={<Icon icon={icon.chevronDown} />}
            onClick={() => setAddMenuOpen((p) => !p)}
          >
            Add Template
          </Button>
          <Menu
            isOpen={addMenuOpen}
            onClose={() => setAddMenuOpen(false)}
            items={filteredAddTypes.map((t) => ({
              id: t.id,
              label: t.label,
              description: t.desc,
              icon: <Icon icon={t.icon} />,
              onClick: () => handleAddClick(t.id),
            }))}
            style={{ top: '100%', right: 0, marginTop: gap.sm, minWidth: 240 }}
          />
        </div>
      </div>

      {/* Templates table */}
      <div style={tableWrapperStyle}>
        <Table size="default" flush>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ width: '120px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableSkeleton columns={7} />
            ) : (
              <>
                {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell style={bodyCellStyle}>
                    <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary }}>
                      {template.name}
                    </span>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <TypeChip type={template.type} />
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary }}>
                      {resolveCategory(template.task_category_id)}
                    </span>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <FrequencyTag value={template.frequency} />
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary }}>
                      {resolveAssignee(template)}
                    </span>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <StatusBadge status={template.status} />
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
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
                    <TableCell colSpan={7} style={bodyCellStyle}>
                      <div style={{ textAlign: 'center', padding: space.xl, color: color.text.muted, fontSize: font.size.body.sm }}>
                        No templates yet. Add your first template above.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
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
        members={members}
        taskCategories={taskCategories}
        complianceTypes={complianceTypes}
      />

      <ViewTemplateSheet
        isOpen={viewSheetOpen}
        onClose={handleViewClose}
        template={viewingTemplate ? buildViewTemplate(viewingTemplate) : null}
        onEdit={handleEditFromView}
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
