'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { Sheet, Button } from '@bds/components';
import type { SheetTab } from '@bds/components';
import { Badge } from '@bds/components';
import { sheetBodyStyle, sheetSectionTitle } from '@/app/(auth)/settings/_sheetStyles';
import { ReadOnlyField } from '@/components/ReadOnlyField';
import { color, font, gap, space, border } from '@/lib/tokens';
import { frequencyLabel } from '@/lib/frequency-labels';

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
  assignment_mode: string;
  display_mode: string;
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
  /** Whether the sheet is open (page-level mode). Defaults to true for global mode. */
  isOpen?: boolean;
  onClose: () => void;
  /** Full template data (page-level mode — skips fetch) */
  template?: TemplateViewData | null;
  /** Template ID (global mode — fetches data) */
  id?: string;
  /** Navigate to a related entity (global sheet stack) */
  onNavigate?: (type: string, props: Record<string, unknown>, opts?: { title?: string }) => void;
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

const ASSIGNMENT_MODE_LABELS: Record<string, string> = {
  individual: 'Individual',
  role: 'Role',
  department: 'Department',
  pool: 'Pool (Everyone)',
};

const DISPLAY_MODE_LABELS: Record<string, string> = {
  nested: 'Nested',
  expanded: 'Expanded',
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: gap.lg,
  width: '100%',
};

const halfStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const taskItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: gap.md,
  padding: `${space.sm} ${space.md}`,
  borderRadius: border.radius.sm,
  border: `${border.width.sm} solid ${color.border.muted}`,
  backgroundColor: color.surface.primary,
};

const emptyState: CSSProperties = {
  padding: `${space.lg} 0`,
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.secondary,
  textAlign: 'center',
};


// ─── Component ──────────────────────────────────────────────────────────────

export function ViewTemplateSheet({ isOpen = true, onClose, template: templateProp, id, onNavigate }: ViewTemplateSheetProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [fetched, setFetched] = useState<TemplateViewData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Global mode: fetch by ID when no data prop is given
  const resolvedId = id ?? templateProp?.id;
  useEffect(() => {
    if (templateProp || !resolvedId) return;
    setFetchLoading(true);
    fetch(`/api/templates/${resolvedId}`)
      .then(r => r.json())
      .then(data => { if (data && !data.error) setFetched(data); })
      .catch(err => console.error('[ViewTemplateSheet] fetch failed:', err))
      .finally(() => setFetchLoading(false));
  }, [resolvedId, templateProp]);

  const template = templateProp ?? fetched;

  if (fetchLoading) {
    return (
      <Sheet variant="floating" isOpen={isOpen} onClose={onClose} title="Loading..." width="600px" side="right">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '200px', fontFamily: font.family.body, fontSize: font.size.body.md, color: color.text.muted }}>
          Loading...
        </div>
      </Sheet>
    );
  }

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
          <ReadOnlyField label="Category" value={template.category || '—'} />
        </div>
      </div>

      {template.compliance_type && (
        <ReadOnlyField label="Compliance Type" value={template.compliance_type} />
      )}

      <h3 style={sheetSectionTitle}>Assignment & Scheduling</h3>
      <div style={rowStyle}>
        <div style={halfStyle}>
          <ReadOnlyField label="Assignment Mode" value={ASSIGNMENT_MODE_LABELS[template.assignment_mode] ?? template.assignment_mode} />
        </div>
        <div style={halfStyle}>
          <ReadOnlyField label="Display Mode" value={DISPLAY_MODE_LABELS[template.display_mode] ?? template.display_mode} />
        </div>
      </div>
      <div style={rowStyle}>
        <div style={halfStyle}>
          <ReadOnlyField label="Assigned Role" value={template.assigned_role || 'All Staff'} />
        </div>
        <div style={halfStyle}>
          <ReadOnlyField label="Department" value={template.department || '—'} />
        </div>
      </div>

      <div style={rowStyle}>
        <div style={halfStyle}>
          <ReadOnlyField label="Frequency" value={frequencyLabel(template.frequency)} />
        </div>
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
      </div>

      <div style={rowStyle}>
        {template.estimated_duration && (
          <div style={halfStyle}>
            <ReadOnlyField label="Est. Duration" value={`${template.estimated_duration} min`} />
          </div>
        )}
        {template.room && (
          <div style={halfStyle}>
            <ReadOnlyField label="Room" value={template.room} />
          </div>
        )}
      </div>

      <h3 style={sheetSectionTitle}>Status & Settings</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
        <span style={{ fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.medium, color: color.text.primary }}>
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
      <p style={{ color: color.text.secondary, fontSize: font.size.body.md, margin: 0 }}>
        {template.tasks.length} {template.tasks.length === 1 ? 'item' : 'items'}
      </p>

      {template.tasks.length === 0 ? (
        <p style={emptyState}>No items defined for this template.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
          {template.tasks.map((task, idx) => (
            <div key={task.id} style={taskItemStyle}>
              <span style={{ color: color.text.secondary, fontSize: font.size.body.md, minWidth: '24px' }}>
                {idx + 1}.
              </span>
              <span style={{ color: color.text.primary, fontSize: font.size.body.md, flex: 1 }}>
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
      variant="floating"
      isOpen={isOpen}
      onClose={onClose}
      title={template.name}
      width="600px"
      side="right"
      tabs={sheetTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footer={
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Close</Button>
      }
    />
  );
}
