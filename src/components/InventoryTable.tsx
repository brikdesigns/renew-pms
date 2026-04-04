'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import { Badge, Button, IconButton, FilterButton } from '@bds/components';
import { Tag } from '@bds/components';
import type { FilterButtonOption } from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { color, font, space, gap, border, departmentColor } from '@/lib/tokens';
import { EditInventorySheet, type InventoryFormData } from '@/components/EditInventorySheet';
import { ViewInventorySheet, type InventoryViewData } from '@/components/ViewInventorySheet';
import { getRoomName } from '@/lib/seed-rooms';

// ─── Local type ──────────────────────────────────────────────────────────────

interface InventoryRow {
  id: string;
  name: string;
  status: string;
  department: string;
  /** DB-stored color key from departments.color */
  departmentColor: string;
  description: string;
  type: string;
  company: string;
  team: string;
  room: string;
}

// ─── Clinical seed data (from Notion) ────────────────────────────────────────

const SEED_INVENTORY: InventoryRow[] = [
  { id: '1',  name: 'Planmeca Romexis',                                       status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Planmeca',        team: '', room: '' },
  { id: '2',  name: 'Blue Sky Bio Dental Implant Systems',                    status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Blue Sky Bio',     team: '', room: '' },
  { id: '3',  name: 'CandidPro',                                              status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'CandidPro',       team: '', room: '' },
  { id: '4',  name: 'Planmeca Promax 3D Classic',                             status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Planmeca',        team: '', room: '' },
  { id: '5',  name: 'itero Element Intraoral Scanner',                        status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'iTero',           team: '', room: '' },
  { id: '6',  name: 'MouthWatch Intraoral Photo Camera',                      status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'MouthWatch',      team: '', room: '' },
  { id: '7',  name: 'Curing Lights',                                          status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: '',                 team: '', room: '' },
  { id: '8',  name: 'Cavitrons',                                              status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Dentsply Sirona', team: '', room: '' },
  { id: '9',  name: 'Ultradent 810+980 Diode Laser',                          status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Ultradent',       team: '', room: '' },
  { id: '10', name: 'Hettich EBA 200 Centrifuge',                             status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Hettich',         team: '', room: '' },
  { id: '11', name: 'Kavo Nomad Pro2',                                        status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'KaVo',            team: '', room: '' },
  { id: '12', name: 'Dexis Sensor',                                           status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Dexis',           team: '', room: '' },
  { id: '13', name: 'W&H Implantmed Motor/Handpiece',                         status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'W&H',             team: '', room: '' },
  { id: '14', name: 'Endodontics',                                            status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: '',                 team: '', room: '' },
  { id: '15', name: 'CritiCare nGenuity',                                     status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'CritiCare',       team: '', room: '' },
  { id: '16', name: 'Omron 7 Series Wrist Blood Pressure Monitor',            status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Omron',           team: '', room: '' },
  { id: '17', name: 'QUATTROcare Plus',                                       status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'W&H',             team: '', room: '' },
  { id: '18', name: 'BioSonic UC300 Coltene Ultrasonic Cleaning System',      status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Coltene',         team: '', room: '' },
  { id: '19', name: 'VistaPure Water Purification System',                    status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'VistaPure',       team: '', room: '' },
  { id: '20', name: 'Midmark M11 Ultraclave Steam Sterilizer',                status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Midmark',         team: '', room: '5' },
  { id: '21', name: 'SciCan Statim 5000 Cassette Sterilizer',                 status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'SciCan',          team: '', room: '5' },
  { id: '22', name: 'Henry Schein Master L35 Laboratory Handpiece',           status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Henry Schein',    team: '', room: '7' },
  { id: '23', name: '3M Pentamix 3',                                          status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: '3M',              team: '', room: '7' },
  { id: '24', name: 'MiniSTAR S by Great Lakes',                              status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Great Lakes',     team: '', room: '7' },
  { id: '25', name: '3Shape Trios4 - Scanner and Move',                       status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: '3Shape',          team: '', room: '' },
  { id: '26', name: 'Sprint Ray ProS',                                        status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'SprintRay',      team: '', room: '7' },
  { id: '27', name: 'Sprint Ray Procure2',                                    status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'SprintRay',      team: '', room: '7' },
  { id: '28', name: 'BladeFLASK Scalpel Blade Remover',                       status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'qlicksmart',     team: '', room: '' },
  { id: '29', name: 'Pelton and Crane Dental Chair: Spirit 3300 Model SP30',  status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Pelton & Crane', team: '', room: '4' },
  { id: '30', name: 'Pelton and Crane 12 o\'clock: 2000 Series Model FWS-C 2800 Flex', status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Pelton & Crane', team: '', room: '4' },
  { id: '31', name: 'Pelton and Crane Helios 3000 LED Dental Light',          status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Pelton & Crane', team: '', room: '4' },
  { id: '32', name: 'Kavo ELECTROmatic Handpiece Motor',                      status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'KaVo',           team: '', room: '' },
  { id: '33', name: 'MOJAVE V5 Dry Vacuum System (MT10)',                     status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'MOJAVE',         team: '', room: '' },
  { id: '34', name: 'AirStar 50 Compressor',                                  status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'AirStar',        team: '', room: '' },
  { id: '35', name: 'Solmetex NXT Hg5 Amalgam Separator',                     status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Solmetex',       team: '', room: '' },
  { id: '36', name: 'DCI Parts & Products Catalog',                           status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'DCI',            team: '', room: '' },
  { id: '37', name: 'Accutron Digi-Flo Automatic Manifold System',            status: 'Active', department: 'Clinical', departmentColor: 'blue', description: '', type: 'Clinical Equipment', company: 'Accutron',       team: '', room: '' },
];

// ─── Status display ─────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { status: 'positive' | 'warning' | 'error'; label: string }> = {
  Active: { status: 'positive', label: 'Active' },
  'Renew Review': { status: 'warning', label: 'Renew Review' },
  'Need to Cancel/Replace': { status: 'error', label: 'Needs Replacement' },
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1, paddingInline: space.xl };

const subHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: `${space.md} 0`, borderBottom: `1px solid ${color.border.muted}`,
  gap: gap.md,
};

const subHeaderLeftStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: gap.md, flexShrink: 0 };

const subHeaderTitleStyle: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.semibold, color: color.text.primary, margin: 0,
};

const countBadge: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium,
  color: color.text.secondary, backgroundColor: color.surface.secondary, padding: `${gap.tiny} ${gap.md}`, borderRadius: border.radius.xs,
};

const filterGroupStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: gap.md };

const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto' };

const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

const nameCellStyle: CSSProperties = { fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary };
const secondaryCellStyle: CSSProperties = { fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary };

// ─── Component ───────────────────────────────────────────────────────────────

export function InventoryTable() {
  const [items, setItems] = useState<InventoryRow[]>(SEED_INVENTORY);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryRow | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewing, setViewing] = useState<InventoryRow | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterCompany, setFilterCompany] = useState<string | undefined>();

  const statusOptions: FilterButtonOption[] = Object.keys(STATUS_BADGE).map((k) => ({ id: k, label: STATUS_BADGE[k].label }));

  const typeOptions: FilterButtonOption[] = [...new Set(items.map((i) => i.type).filter(Boolean))]
    .sort()
    .map((t) => ({ id: t, label: t }));

  const companyOptions: FilterButtonOption[] = [...new Set(items.map((i) => i.company).filter(Boolean))]
    .sort()
    .map((c) => ({ id: c, label: c }));

  const filteredItems = items.filter((i) => {
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterType && i.type !== filterType) return false;
    if (filterCompany && i.company !== filterCompany) return false;
    return true;
  });

  const handleAdd = () => { setEditing(null); setEditSheetOpen(true); };
  const handleEdit = (item: InventoryRow) => { setEditing(item); setEditSheetOpen(true); };
  const handleEditClose = () => { setEditSheetOpen(false); setEditing(null); };
  const handleView = (item: InventoryRow) => { setViewing(item); setViewSheetOpen(true); };
  const handleViewClose = () => { setViewSheetOpen(false); setViewing(null); };
  const handleViewEdit = () => { if (viewing) { handleViewClose(); handleEdit(viewing); } };

  const handleSave = (data: InventoryFormData) => {
    if (editing) {
      setItems((prev) => prev.map((i) =>
        i.id === editing.id ? { ...i, ...data } : i
      ));
    } else {
      setItems((prev) => [...prev, { id: crypto.randomUUID(), departmentColor: 'blue', ...data }]);
    }
  };

  const editFormData: InventoryFormData | null = editing
    ? { name: editing.name, status: editing.status, department: editing.department, description: editing.description, type: editing.type, company: editing.company, team: editing.team, room: editing.room }
    : null;

  const viewData: InventoryViewData | null = viewing
    ? { id: viewing.id, name: viewing.name, status: viewing.status, department: viewing.department, departmentColor: viewing.departmentColor, description: viewing.description, type: viewing.type, company: viewing.company, team: viewing.team, room: getRoomName(viewing.room) }
    : null;

  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <h3 style={subHeaderTitleStyle}>Clinical Equipment</h3>
          <span style={countBadge}>{filteredItems.length}{filteredItems.length !== items.length && ` / ${items.length}`}</span>
        </div>
        <div style={filterGroupStyle}>
          <FilterButton
            label="Status"
            size="sm"
            options={statusOptions}
            value={filterStatus}
            onChange={setFilterStatus}
          />
          <FilterButton
            label="Type"
            size="sm"
            options={typeOptions}
            value={filterType}
            onChange={setFilterType}
          />
          <FilterButton
            label="Third-Party Company"
            size="sm"
            options={companyOptions}
            value={filterCompany}
            onChange={setFilterCompany}
          />
          <Button variant="primary" size="sm" onClick={handleAdd}>Add Item</Button>
        </div>
      </div>

      <div style={tableWrap}>
        <Table size="default" flush>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ width: '100px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} style={{ textAlign: 'center', color: color.text.muted, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                  No items match the selected filters.
                </TableCell>
              </TableRow>
            )}
            {filteredItems.map((item) => {
              const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.Active;
              const deptColors = departmentColor(item.departmentColor);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <span style={nameCellStyle}>{item.name}</span>
                  </TableCell>
                  <TableCell>
                    <span style={secondaryCellStyle}>{item.type || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span style={secondaryCellStyle}>{item.company || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <Tag size="sm" style={{ backgroundColor: deptColors.light, color: deptColors.text }}>{item.department}</Tag>
                  </TableCell>
                  <TableCell>
                    <span style={secondaryCellStyle}>{getRoomName(item.room) || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge status={badge.status} size="sm">{badge.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <div style={actionBtnGroup}>
                      <IconButton variant="primary" size="sm" icon={<Icon icon={icon.eye} />} label={`View ${item.name}`} onClick={() => handleView(item)} />
                      <IconButton variant="primary" size="sm" icon={<Icon icon={icon.edit} />} label={`Edit ${item.name}`} onClick={() => handleEdit(item)} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <EditInventorySheet isOpen={editSheetOpen} onClose={handleEditClose} initialData={editFormData} onSave={handleSave} />
      <ViewInventorySheet isOpen={viewSheetOpen} onClose={handleViewClose} item={viewData} onEdit={handleViewEdit} />
    </div>
  );
}
