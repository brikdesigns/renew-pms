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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faListCheck,
  faClipboardList,
  faShieldHalved,
  faHandHoldingHand,
  faUserGraduate,
  faBullseye,
  faEye,
  faPenToSquare,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Badge } from '@bds/components';
import { EditTemplateSheet, type TemplateFormData } from '@/components/EditTemplateSheet';
import { ViewTemplateSheet, type TemplateViewData } from '@/components/ViewTemplateSheet';
import { color, font, space, gap, border, shadow } from '@/lib/tokens';

// ─── Type display mapping ────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; icon: IconDefinition }> = {
  checklist: { label: 'Checklist', icon: faListCheck },
  procedure: { label: 'Procedure', icon: faClipboardList },
  compliance: { label: 'Compliance', icon: faShieldHalved },
  request: { label: 'Request', icon: faHandHoldingHand },
  onboarding: { label: 'Onboarding', icon: faUserGraduate },
  skill_training: { label: 'Skill Training', icon: faBullseye },
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

const STATUS_BADGE: Record<string, 'positive' | 'warning' | 'error'> = {
  active: 'positive',
  draft: 'warning',
  archived: 'error',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  draft: 'Draft',
  archived: 'Archived',
};

// ─── Local template type ─────────────────────────────────────────────────────

interface TaskItem {
  id: string;
  label: string;
}

interface TemplateRow {
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

const SEED_TEMPLATES: TemplateRow[] = [
  {
    id: '1', name: 'Daily Maintenance Checklist', type: 'checklist', category: 'cleaning',
    frequency: 'daily', assigned_role: 'all_staff', department: 'administration',
    priority: 'medium', status: 'active',
    description: 'Daily, weekly, and monthly maintenance tasks. Complete by end of shift.',
    requires_approval: false, estimated_duration: '45', room: '', compliance_type: '', is_default: true,
    tasks: [
      { id: '1-1', label: 'Check and refill hand sanitizer stations' },
      { id: '1-2', label: 'Clean countertops and surfaces' },
      { id: '1-3', label: 'Empty trash bins and replace liners' },
      { id: '1-4', label: 'Inspect and clean waiting area' },
      { id: '1-5', label: 'Check inventory levels for supplies' },
      { id: '1-6', label: 'Wipe down equipment and chairs' },
      { id: '1-7', label: 'Vacuum floors' },
      { id: '1-8', label: 'Weekly: Deep clean restrooms' },
      { id: '1-9', label: 'Weekly: Check HVAC filters' },
      { id: '1-10', label: 'Monthly: Inspect emergency kits' },
      { id: '1-11', label: 'Monthly: Test fire alarms' },
    ],
  },
  {
    id: '2', name: 'Team Growth & Training', type: 'onboarding', category: 'training',
    frequency: 'monthly', assigned_role: 'office_manager', department: 'hr',
    priority: 'medium', status: 'active',
    description: 'Training modules, team events, continuing education tracking. Ensure all team members complete required training.',
    requires_approval: false, estimated_duration: '', room: '', compliance_type: '', is_default: true,
    tasks: [
      { id: '2-1', label: 'Conduct daily team huddle' },
      { id: '2-2', label: 'Verify all staff arrived 15 min early' },
      { id: '2-3', label: 'Complete patient follow-up calls' },
      { id: '2-4', label: 'Schedule and confirm team meeting' },
      { id: '2-5', label: 'Schedule training session (LifeCore)' },
      { id: '2-6', label: 'Complete LifeCore Module 1: Patient communication' },
      { id: '2-7', label: 'Complete LifeCore Module 2: Emergency procedures' },
      { id: '2-8', label: 'Participate in group activities and role-playing' },
      { id: '2-9', label: 'Collect sign-up sheets with names, dates, signatures' },
    ],
  },
  {
    id: '3', name: 'Supply Ordering', type: 'request', category: 'administrative',
    frequency: 'weekly', assigned_role: 'supply_manager', department: 'administration',
    priority: 'medium', status: 'active',
    description: 'Weekly supply review and ordering workflow. Submit to supply manager when complete.',
    requires_approval: true, estimated_duration: '30', room: 'supply_storage', compliance_type: '', is_default: true,
    tasks: [
      { id: '3-1', label: 'Review current supply inventory levels' },
      { id: '3-2', label: 'Check gloves stock (all sizes)' },
      { id: '3-3', label: 'Check masks and PPE stock' },
      { id: '3-4', label: 'Identify items below reorder threshold' },
      { id: '3-5', label: 'Fill out ordering form with item, qty, date' },
      { id: '3-6', label: 'Submit order to supply manager for approval' },
    ],
  },
  {
    id: '4', name: 'Instrument Sterilization', type: 'procedure', category: 'compliance_safety',
    frequency: 'per_shift', assigned_role: 'dental_assistant', department: 'sterilization',
    priority: 'critical', status: 'active',
    description: 'Step-by-step sterilization procedure for dental instruments. Always wear PPE. Report any malfunctions immediately.',
    requires_approval: true, estimated_duration: '60', room: 'sterilization_room', compliance_type: 'infection_control', is_default: true,
    tasks: [
      { id: '4-1', label: 'Don PPE: gloves, masks, eyewear' },
      { id: '4-2', label: 'Pre-clean instruments in ultrasonic cleaner' },
      { id: '4-3', label: 'Rinse with distilled water' },
      { id: '4-4', label: 'Dry and package in autoclave bags' },
      { id: '4-5', label: 'Load into autoclave, run cycle (121°C for 15 min)' },
      { id: '4-6', label: 'Monitor indicators for completion' },
      { id: '4-7', label: 'Store in clean area' },
      { id: '4-8', label: 'Log sterilization batch with date and initials' },
    ],
  },
  {
    id: '5', name: 'Patient Procedure Checklist', type: 'compliance', category: 'patient_care',
    frequency: 'daily', assigned_role: 'dental_hygienist', department: 'clinical',
    priority: 'high', status: 'active',
    description: 'Patient intake and procedure checklist. Highlighted fields are required and gate task completion.',
    requires_approval: true, estimated_duration: '20', room: 'operatory', compliance_type: '', is_default: true,
    tasks: [
      { id: '5-1', label: 'Collect patient info: name, age, date' },
      { id: '5-2', label: 'Record chief complaint' },
      { id: '5-3', label: 'Review medical history: allergies, medications' },
      { id: '5-4', label: 'Review dental history: previous treatments' },
      { id: '5-5', label: 'Complete physical exam: vital signs' },
      { id: '5-6', label: 'Document treatment plan' },
      { id: '5-7', label: 'Obtain patient consent' },
      { id: '5-8', label: 'Schedule follow-up appointment' },
    ],
  },
  {
    id: '6', name: 'A-Z Standard SOP List', type: 'procedure', category: 'compliance_safety',
    frequency: 'annually', assigned_role: 'all_staff', department: 'global',
    priority: 'low', status: 'active',
    description: 'Master A-Z reference of standard operating procedures. Review annually. Focus-SOP Version 2.0.',
    requires_approval: false, estimated_duration: '', room: '', compliance_type: '', is_default: true,
    tasks: [
      { id: '6-1', label: 'A. Arrival Procedure: Greet patients promptly, check-in process' },
      { id: '6-2', label: 'B. Billing: Process payments, insurance claims' },
      { id: '6-3', label: 'C. Cleaning Protocols: Daily surface disinfection' },
      { id: '6-4', label: 'D. Documentation: Update patient records accurately' },
      { id: '6-5', label: 'E. Emergency Procedures: Follow posted emergency action plan' },
      { id: '6-6', label: 'F. Fire Safety: Know evacuation routes and extinguisher locations' },
      { id: '6-7', label: 'G. Glove Protocol: Proper donning and disposal' },
      { id: '6-8', label: 'H. Hygiene Practices: Hand washing between patients' },
      { id: '6-9', label: 'I. Instrument Handling: Proper sterilization flow' },
      { id: '6-10', label: 'J. Job Duties: Review role-specific responsibilities' },
      { id: '6-11', label: 'K. Key Management: Secure office keys and access codes' },
      { id: '6-12', label: 'L. Lab Submissions: Proper labeling and tracking' },
      { id: '6-13', label: 'M. Medication Management: Verify and log all dispensed meds' },
      { id: '6-14', label: 'N. New Patient Intake: Complete registration forms' },
      { id: '6-15', label: 'O. OSHA Compliance: Follow posted safety guidelines' },
      { id: '6-16', label: 'P. Patient Education: Provide post-treatment instructions' },
      { id: '6-17', label: 'Q. Quality Assurance: Report and log errors or near-misses' },
      { id: '6-18', label: 'R. Radiology: Follow radiation safety guidelines' },
      { id: '6-19', label: 'S. Scheduling: Optimize appointment flow and confirmations' },
      { id: '6-20', label: 'T. Treatment Planning: Document and present to patient' },
      { id: '6-21', label: 'U. Universal Precautions: PPE for all patient contact' },
      { id: '6-22', label: 'V. Vendor Relations: Maintain supply chain contacts' },
      { id: '6-23', label: 'W. Waste Disposal: Biohazard and sharps protocols' },
      { id: '6-24', label: 'X. X-Ray Procedures: Follow radiation safety guidelines' },
      { id: '6-25', label: 'Y. Yearly Reviews: Annual equipment calibration' },
      { id: '6-26', label: 'Z. Zoning: Maintain clean zones in office' },
    ],
  },
  {
    id: '7', name: 'Hand Hygiene Procedure', type: 'procedure', category: 'compliance_safety',
    frequency: 'per_shift', assigned_role: 'all_staff', department: 'global',
    priority: 'high', status: 'active',
    description: 'Proper hand washing and sanitizer use between patients and procedures.',
    requires_approval: false, estimated_duration: '5', room: '', compliance_type: 'infection_control', is_default: true,
    tasks: [
      { id: '7-1', label: 'Wet hands with clean running water' },
      { id: '7-2', label: 'Apply soap and lather for at least 20 seconds' },
      { id: '7-3', label: 'Scrub all surfaces: backs of hands, between fingers, under nails' },
      { id: '7-4', label: 'Rinse thoroughly under clean running water' },
      { id: '7-5', label: 'Dry with clean towel or air dry' },
      { id: '7-6', label: 'Apply hand sanitizer when soap is not available' },
    ],
  },
  {
    id: '8', name: 'Compliance Training', type: 'compliance', category: 'compliance_safety',
    frequency: 'quarterly', assigned_role: 'all_staff', department: 'global',
    priority: 'high', status: 'active',
    description: 'Quarterly compliance training — OSHA, HIPAA, infection control certifications and renewals.',
    requires_approval: true, estimated_duration: '120', room: '', compliance_type: 'osha', is_default: true,
    tasks: [
      { id: '8-1', label: 'Complete OSHA safety training module' },
      { id: '8-2', label: 'Complete HIPAA privacy training module' },
      { id: '8-3', label: 'Complete infection control refresher' },
      { id: '8-4', label: 'Review radiation safety guidelines' },
      { id: '8-5', label: 'Review fire safety and evacuation procedures' },
      { id: '8-6', label: 'Review emergency preparedness plan' },
      { id: '8-7', label: 'Sign compliance acknowledgment form' },
    ],
  },
];

// ─── Add menu template type defaults ─────────────────────────────────────────

const ADD_MENU_TYPES = [
  { id: 'checklist', label: 'Checklist', desc: 'Recurring to-do lists', icon: faListCheck },
  { id: 'procedure', label: 'Procedure', desc: 'Step-by-step workflows', icon: faClipboardList },
  { id: 'compliance', label: 'Compliance', desc: 'Regulatory & safety tasks', icon: faShieldHalved },
  { id: 'request', label: 'Request', desc: 'Supply & service requests', icon: faHandHoldingHand },
  { id: 'onboarding', label: 'Onboarding', desc: 'New employee orientation', icon: faUserGraduate },
  { id: 'skill_training', label: 'Training', desc: 'Continuing education', icon: faBullseye },
] as const;

const EMPTY_FORM_BASE: TemplateFormData = {
  name: '', type: 'checklist', category: 'cleaning', frequency: 'daily',
  assigned_role: 'all_staff', department: '', priority: 'medium', status: 'draft',
  description: '', requires_approval: false, estimated_duration: '', room: '', compliance_type: '',
};

const EMPTY_FORM_BY_TYPE: Record<string, TemplateFormData> = {
  checklist:      { ...EMPTY_FORM_BASE, type: 'checklist', category: 'cleaning', frequency: 'daily', requires_approval: false },
  procedure:      { ...EMPTY_FORM_BASE, type: 'procedure', category: 'compliance_safety', frequency: 'per_shift', requires_approval: true },
  compliance:     { ...EMPTY_FORM_BASE, type: 'compliance', category: 'compliance_safety', frequency: 'quarterly', priority: 'high', requires_approval: true, compliance_type: 'osha' },
  request:        { ...EMPTY_FORM_BASE, type: 'request', category: 'administrative', frequency: 'none', requires_approval: true },
  onboarding:     { ...EMPTY_FORM_BASE, type: 'onboarding', category: 'training', frequency: 'none', requires_approval: false },
  skill_training: { ...EMPTY_FORM_BASE, type: 'skill_training', category: 'training', frequency: 'monthly', requires_approval: false },
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const tabContentStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  paddingInline: space.xl,
};

const subHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${space.md} 0`,
  borderBottom: `1px solid ${color.border.muted}`,
};

const subHeaderLeftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: space.sm,
};

const subHeaderTitleStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  fontWeight: 600,
  color: color.text.primary,
  margin: 0,
};

const subHeaderCountStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  fontWeight: 500,
  color: color.text.secondary,
  backgroundColor: color.surface.secondary,
  padding: `2px ${gap.md}`,
  borderRadius: border.radius.sm,
};

const addBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '36px',
  paddingInline: '14px',
  borderRadius: border.radius.sm,
  backgroundColor: color.background.brandPrimary,
  color: color.text.onColorDark,
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const tableWrapperStyle: CSSProperties = {
  flex: 1,
  overflowX: 'auto',
};

const typeChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: gap.sm,
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  fontWeight: 500,
  color: color.text.secondary,
};

const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

const actionBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  borderRadius: border.radius.md,
  backgroundColor: color.background.brandPrimary,
  color: color.text.onColorDark,
  border: 'none',
  cursor: 'pointer',
  fontSize: font.size.body.sm,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function TypeChip({ type }: { type: string }) {
  const meta = TYPE_META[type] ?? TYPE_META.checklist;
  return (
    <span style={typeChipStyle}>
      <FontAwesomeIcon icon={meta.icon} style={{ fontSize: font.size.body.xs }} />
      {meta.label}
    </span>
  );
}

function StatusIndicator({ status }: { status: string }) {
  const badgeStatus = STATUS_BADGE[status] ?? 'warning';
  return (
    <Badge status={badgeStatus} size="sm">
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface TemplatesTableProps {
  /** Which task types to show. If omitted, shows all. */
  typeFilter?: string[];
}

export function TemplatesTable({ typeFilter }: TemplatesTableProps) {
  const [templates, setTemplates] = useState<TemplateRow[]>(SEED_TEMPLATES);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null);

  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<TemplateRow | null>(null);

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [newTemplateType, setNewTemplateType] = useState('checklist');
  const addBtnRef = useRef<HTMLDivElement>(null);

  const filteredTemplates = typeFilter
    ? templates.filter((t) => typeFilter.includes(t.type))
    : templates;

  const filteredAddTypes = typeFilter
    ? ADD_MENU_TYPES.filter((t) => typeFilter.includes(t.id))
    : ADD_MENU_TYPES;

  const handleAddClick = (type: string) => {
    setEditingTemplate(null);
    setAddMenuOpen(false);
    setNewTemplateType(type);
    setSheetOpen(true);
  };

  const handleEditClick = (template: TemplateRow) => {
    setEditingTemplate(template);
    setSheetOpen(true);
  };

  const handleViewClick = (template: TemplateRow) => {
    setViewingTemplate(template);
    setViewSheetOpen(true);
  };

  const handleViewClose = () => {
    setViewSheetOpen(false);
    setViewingTemplate(null);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingTemplate(null);
  };

  const handleSave = (data: TemplateFormData, _tasks?: unknown) => {
    if (editingTemplate) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplate.id
            ? { ...t, ...data }
            : t
        )
      );
    } else {
      const newTemplate: TemplateRow = {
        id: crypto.randomUUID(),
        ...data,
        is_default: false,
        tasks: Array.isArray(_tasks) ? _tasks as TaskItem[] : [],
      };
      setTemplates((prev) => [...prev, newTemplate]);
    }
  };

  const sheetInitialData: TemplateFormData | null = editingTemplate
    ? {
        name: editingTemplate.name,
        type: editingTemplate.type,
        category: editingTemplate.category,
        frequency: editingTemplate.frequency,
        assigned_role: editingTemplate.assigned_role,
        department: editingTemplate.department,
        priority: editingTemplate.priority,
        status: editingTemplate.status,
        description: editingTemplate.description,
        requires_approval: editingTemplate.requires_approval,
        estimated_duration: editingTemplate.estimated_duration,
        room: editingTemplate.room,
        compliance_type: editingTemplate.compliance_type,
      }
    : { ...EMPTY_FORM_BY_TYPE[newTemplateType] };

  return (
    <div style={tabContentStyle}>
      {/* Sub-header */}
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <h3 style={subHeaderTitleStyle}>{typeFilter ? 'Training Templates' : 'Task Templates'}</h3>
          <span style={subHeaderCountStyle}>{filteredTemplates.length}</span>
        </div>
        <div ref={addBtnRef} style={{ position: 'relative' }}>
          <button style={addBtnStyle} onClick={() => setAddMenuOpen((p) => !p)}>
            Add Template
            <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: font.size.body.xs, marginLeft: gap.md }} />
          </button>
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
                    fontFamily: font.family.body, fontSize: font.size.body.sm,
                    color: color.text.primary, textAlign: 'left',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <FontAwesomeIcon icon={t.icon} style={{ width: 16, color: color.text.brand }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.label}</div>
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
        <Table size="default" flush>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Assigned Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ width: '100px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <span style={{ fontWeight: 500, color: color.text.primary }}>
                    {template.name}
                  </span>
                </TableCell>
                <TableCell>
                  <TypeChip type={template.type} />
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: font.size.body.sm, color: color.text.secondary }}>
                    {CATEGORY_LABELS[template.category] ?? template.category}
                  </span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: font.size.body.sm, color: color.text.secondary }}>
                    {FREQUENCY_LABELS[template.frequency] ?? template.frequency}
                  </span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: font.size.body.sm, color: color.text.secondary }}>
                    {ROLE_LABELS[template.assigned_role] ?? template.assigned_role}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusIndicator status={template.status} />
                </TableCell>
                <TableCell>
                  <div style={actionBtnGroup}>
                    <button
                      style={actionBtnStyle}
                      onClick={() => handleViewClick(template)}
                      aria-label={`View ${template.name}`}
                    >
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button
                      style={actionBtnStyle}
                      onClick={() => handleEditClick(template)}
                      aria-label={`Edit ${template.name}`}
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditTemplateSheet
        isOpen={sheetOpen}
        onClose={handleSheetClose}
        initialData={sheetInitialData}
        initialTasks={editingTemplate?.tasks ?? []}
        onSave={handleSave}
      />
      <ViewTemplateSheet
        isOpen={viewSheetOpen}
        onClose={handleViewClose}
        template={viewingTemplate ? {
          id: viewingTemplate.id,
          name: viewingTemplate.name,
          type: viewingTemplate.type,
          category: viewingTemplate.category,
          frequency: viewingTemplate.frequency,
          assigned_role: viewingTemplate.assigned_role,
          department: viewingTemplate.department,
          priority: viewingTemplate.priority,
          status: viewingTemplate.status,
          description: viewingTemplate.description,
          requires_approval: viewingTemplate.requires_approval,
          estimated_duration: viewingTemplate.estimated_duration,
          room: viewingTemplate.room,
          compliance_type: viewingTemplate.compliance_type,
          is_default: viewingTemplate.is_default,
          tasks: viewingTemplate.tasks,
        } : null}
      />
    </div>
  );
}
