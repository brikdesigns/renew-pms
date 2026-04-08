'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import { Badge, Button, IconButton, FilterButton } from '@bds/components';
import type { FilterButtonOption } from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { color, font, space, gap, border } from '@/lib/tokens';
import { EditInventorySheet, type InventoryFormData } from '@/components/EditInventorySheet';
import { ViewInventorySheet, type InventoryViewData } from '@/components/ViewInventorySheet';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { useToast } from '@/components/ToastProvider';
import { useEquipment, type EquipmentItem } from '@/hooks/useEquipment';

// ─── Status display ─────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { status: 'positive' | 'warning' | 'error'; label: string }> = {
  active: { status: 'positive', label: 'Active' },
  needs_service: { status: 'warning', label: 'Needs Service' },
  out_of_service: { status: 'error', label: 'Out of Service' },
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
  fontFamily: font.family.label, fontSize: font.size.body.xs, fontWeight: font.weight.medium,
  color: color.text.secondary, backgroundColor: color.surface.secondary, padding: `${gap.tiny} ${gap.md}`, borderRadius: border.radius.xs,
};

const filterGroupStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: gap.md };

const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto' };

const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

const nameCellStyle: CSSProperties = { fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary };
const secondaryCellStyle: CSSProperties = { fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary };

// ─── Component ───────────────────────────────────────────────────────────────

export function InventoryTable() {
  const { equipment, loading } = useEquipment();
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentItem | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [viewing, setViewing] = useState<EquipmentItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterCompany, setFilterCompany] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const { showToast } = useToast();

  const statusOptions: FilterButtonOption[] = Object.keys(STATUS_BADGE).map((k) => ({ id: k, label: STATUS_BADGE[k].label }));

  const categoryOptions: FilterButtonOption[] = [...new Set(equipment.map((i) => i.category).filter(Boolean) as string[])]
    .sort()
    .map((t) => ({ id: t, label: t }));

  const companyOptions: FilterButtonOption[] = [...new Set(equipment.map((i) => i.manufacturer).filter(Boolean) as string[])]
    .sort()
    .map((c) => ({ id: c, label: c }));

  const filteredItems = equipment.filter((i) => {
    if (filterStatus && i.status !== filterStatus) return false;
    if (filterCategory && i.category !== filterCategory) return false;
    if (filterCompany && i.manufacturer !== filterCompany) return false;
    return true;
  });

  const handleAdd = () => { setEditing(null); setEditSheetOpen(true); };
  const handleEdit = (item: EquipmentItem) => { setEditing(item); setEditSheetOpen(true); };
  const handleEditClose = () => { setEditSheetOpen(false); setEditing(null); };
  const handleView = (item: EquipmentItem) => { setViewing(item); setViewSheetOpen(true); };
  const handleViewClose = () => { setViewSheetOpen(false); setViewing(null); };
  const handleViewEdit = () => { if (viewing) { handleViewClose(); handleEdit(viewing); } };

  const handleDelete = () => {
    if (!deleteTarget) return;
    // TODO: Wire to DELETE API
    showToast({ title: 'Deleted', description: `${deleteTarget.name} has been deleted.`, variant: 'success' });
    setDeleteTarget(null);
  };

  const handleSave = (data: InventoryFormData) => {
    // TODO: wire to POST/PUT /api/equipment once CRUD is implemented
    void data;
  };

  const editFormData: InventoryFormData | null = editing
    ? { name: editing.name, status: editing.status, department: '', description: editing.description ?? '', type: editing.category ?? '', company: editing.manufacturer ?? '', team: '', room: editing.room_id ?? '' }
    : null;

  const viewData: InventoryViewData | null = viewing
    ? { id: viewing.id, name: viewing.name, status: viewing.status, department: '', departmentColor: 'blue', description: viewing.description ?? '', type: viewing.category ?? '', company: viewing.manufacturer ?? '', team: '', room: viewing.room_name ?? '' }
    : null;

  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <h3 style={subHeaderTitleStyle}>Equipment</h3>
          <span style={countBadge}>{filteredItems.length}{filteredItems.length !== equipment.length && ` / ${equipment.length}`}</span>
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
            label="Category"
            size="sm"
            options={categoryOptions}
            value={filterCategory}
            onChange={setFilterCategory}
          />
          <FilterButton
            label="Manufacturer"
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
              <TableHead>Category</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Status</TableHead>
              <TableHead style={{ width: '100px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: 'center', color: color.text.secondary, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                  Loading equipment…
                </TableCell>
              </TableRow>
            )}
            {!loading && filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: 'center', color: color.text.muted, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                  No items match the selected filters.
                </TableCell>
              </TableRow>
            )}
            {!loading && filteredItems.map((item) => {
              const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.active;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <span style={nameCellStyle}>{item.name}</span>
                  </TableCell>
                  <TableCell>
                    <span style={secondaryCellStyle}>{item.category || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span style={secondaryCellStyle}>{item.manufacturer || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <span style={secondaryCellStyle}>{item.room_name || '—'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge status={badge.status} size="sm">{badge.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <div style={actionBtnGroup}>
                      <IconButton variant="secondary" size="tiny" icon={<Icon icon={icon.eye} />} label={`View ${item.name}`} onClick={() => handleView(item)} />
                      <IconButton variant="secondary" size="tiny" icon={<Icon icon={icon.edit} />} label={`Edit ${item.name}`} onClick={() => handleEdit(item)} />
                      <IconButton variant="secondary" size="tiny" icon={<Icon icon={icon.trash} />} label={`Delete ${item.name}`} onClick={() => setDeleteTarget({ id: item.id, name: item.name })} />
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
      <ConfirmDeleteDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name ?? ''}
        itemType="equipment"
      />
    </div>
  );
}
