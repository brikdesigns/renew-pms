'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import { Badge } from '@bds/components/ui/Badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { EditTeamSheet, type TeamFormData } from '@/components/EditTeamSheet';
import { ViewTeamSheet, type TeamViewData } from '@/components/ViewTeamSheet';

// ─── Design tokens ───────────────────────────────────────────────────────────

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_SECONDARY = 'var(--text-secondary)';
const BRAND_PRIMARY = 'var(--background-brand-primary)';

// ─── Local type ──────────────────────────────────────────────────────────────

interface TeamRow {
  id: string;
  name: string;
  department: string;
  shift: string;
  description: string;
  is_active: boolean;
  member_count: number;
}

const SHIFT_LABELS: Record<string, string> = {
  opening: 'Opening',
  closing: 'Closing',
  evening: 'Evening',
  full_day: 'Full Day',
};

// Seed with realistic dental practice teams
const SEED_TEAMS: TeamRow[] = [
  { id: '1', name: 'Morning Crew',       department: '',           shift: 'opening',  description: 'Opening shift team — unlocks, powers on, first patients', is_active: true, member_count: 4 },
  { id: '2', name: 'Closing Crew',       department: '',           shift: 'closing',  description: 'Closing shift team — shutdown, sterilization, lockup', is_active: true, member_count: 3 },
  { id: '3', name: 'Clinical Team A',    department: 'Clinical',   shift: '',          description: 'Primary operatory team for patient procedures', is_active: true, member_count: 3 },
  { id: '4', name: 'Front Desk Team',    department: 'Front Desk', shift: 'full_day',  description: 'Patient-facing scheduling, check-in, billing', is_active: true, member_count: 3 },
  { id: '5', name: 'Sterilization Team', department: 'Sterilization', shift: '',       description: 'Instrument processing and infection control', is_active: true, member_count: 2 },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1, paddingInline: '32px' };
const subHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 0', borderBottom: '1px solid var(--border-muted)',
};
const subHeaderLeftStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px' };
const subHeaderTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-family-body)', fontSize: '16px', fontWeight: 600, color: TEXT_PRIMARY, margin: 0,
};
const countBadge: CSSProperties = {
  fontFamily: 'var(--font-family-body)', fontSize: 'var(--body-sm)', fontWeight: 500,
  color: TEXT_SECONDARY, backgroundColor: 'var(--surface-secondary)', padding: '2px 8px', borderRadius: '4px',
};
const addBtnStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  height: '36px', paddingInline: '14px', borderRadius: '8px',
  backgroundColor: BRAND_PRIMARY, color: 'var(--text-on-color-dark)',
  fontFamily: 'var(--font-family-body)', fontSize: 'var(--body-sm)', fontWeight: 700,
  border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
};
const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto' };
const actionBtn: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '36px', height: '36px', borderRadius: 'var(--border-radius-md)',
  backgroundColor: BRAND_PRIMARY, color: 'var(--text-on-color-dark)',
  border: 'none', cursor: 'pointer', fontSize: 'var(--body-sm)',
};
const actionBtnGroup: CSSProperties = { display: 'flex', gap: '8px', justifyContent: 'flex-end' };
const dotBase: CSSProperties = { width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', flexShrink: 0 };
const statusWrap: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  fontFamily: 'var(--font-family-body)', fontSize: 'var(--body-sm)', fontWeight: 500,
};

// ─── Component ───────────────────────────────────────────────────────────────

export function TeamsTable() {
  const [teams, setTeams] = useState<TeamRow[]>(SEED_TEAMS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<TeamRow | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewing, setViewing] = useState<TeamRow | null>(null);

  const handleAdd = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (t: TeamRow) => { setEditing(t); setSheetOpen(true); };
  const handleClose = () => { setSheetOpen(false); setEditing(null); };

  const handleView = (t: TeamRow) => { setViewing(t); setViewSheetOpen(true); };
  const handleViewClose = () => { setViewSheetOpen(false); setViewing(null); };
  const handleViewEdit = () => { if (viewing) { handleViewClose(); handleEdit(viewing); } };

  const handleSave = (data: TeamFormData) => {
    if (editing) {
      setTeams((prev) => prev.map((t) =>
        t.id === editing.id ? { ...t, ...data } : t
      ));
    } else {
      setTeams((prev) => [...prev, {
        id: crypto.randomUUID(), ...data, member_count: 0,
      }]);
    }
  };

  const sheetData: TeamFormData | null = editing
    ? { name: editing.name, department: editing.department, shift: editing.shift, description: editing.description, is_active: editing.is_active }
    : null;

  const viewData: TeamViewData | null = viewing
    ? { id: viewing.id, name: viewing.name, department: viewing.department, shift: viewing.shift, description: viewing.description, is_active: viewing.is_active, member_count: viewing.member_count }
    : null;

  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <h3 style={subHeaderTitleStyle}>Teams</h3>
          <span style={countBadge}>{teams.length}</span>
        </div>
        <button style={addBtnStyle} onClick={handleAdd}>Add Team</button>
      </div>

      <div style={tableWrap}>
        <Table size="default" flush>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ width: '100px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <span style={{ fontWeight: 500, color: TEXT_PRIMARY }}>{t.name}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: 'var(--body-sm)', color: TEXT_SECONDARY }}>
                    {t.department || 'Cross-department'}
                  </span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: 'var(--body-sm)', color: TEXT_SECONDARY }}>
                    {t.shift ? SHIFT_LABELS[t.shift] ?? t.shift : '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <span style={{ fontSize: 'var(--body-sm)', color: TEXT_SECONDARY }}>{t.member_count}</span>
                </TableCell>
                <TableCell>
                  <Badge status={t.is_active ? 'positive' : 'error'} size="sm">
                    {t.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div style={actionBtnGroup}>
                    <button style={actionBtn} onClick={() => handleView(t)} aria-label={`View ${t.name}`}>
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button style={actionBtn} onClick={() => handleEdit(t)} aria-label={`Edit ${t.name}`}>
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditTeamSheet isOpen={sheetOpen} onClose={handleClose} initialData={sheetData} onSave={handleSave} />
      <ViewTeamSheet isOpen={viewSheetOpen} onClose={handleViewClose} team={viewData} onEdit={handleViewEdit} />
    </div>
  );
}
