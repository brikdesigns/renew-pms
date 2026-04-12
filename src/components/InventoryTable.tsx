'use client';

import { useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import { Button, IconButton, FilterButton, SegmentedControl, useSheetStack } from '@bds/components';
import { StatusBadge } from '@/components/StatusBadge';
import type { FilterButtonOption } from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { color, font, space, gap, border } from '@/lib/tokens';
import { EditInventorySheet, type InventoryFormData } from '@/components/EditInventorySheet';
import type { InventoryViewData } from '@/components/ViewInventorySheet';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { TableSkeleton } from '@/components/TableSkeleton';
import { useToast } from '@/components/ToastProvider';
import { useEquipment, type EquipmentItem } from '@/hooks/useEquipment';

// ─── Status display ─────────────────────────────────────────────────────────


// ─── Styles ──────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1 };

const subHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: `${space.md} ${space.xl}`, borderBottom: `1px solid ${color.border.muted}`,
  gap: gap.md,
};

const subHeaderLeftStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: space.sm, flexShrink: 0 };

const countBadge: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.body.xs, fontWeight: font.weight.medium,
  color: color.text.secondary, backgroundColor: color.surface.secondary, padding: `2px ${gap.md}`, borderRadius: border.radius.sm,
};

const filterGroupStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: gap.md };

const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto', paddingInline: space.xl };

const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

const nameCellStyle: CSSProperties = { fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary };
const secondaryCellStyle: CSSProperties = { fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary };

const INVENTORY_SEGMENTS = [
  { label: 'Equipment', value: 'equipment' },
  { label: 'Supplies', value: 'supplies' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function InventoryTable() {
  const { openSheet, closeAll } = useSheetStack();
  const [view, setView] = useState('equipment');
  const { equipment, setEquipment, loading } = useEquipment();
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentItem | null>(null);
  const [viewing, setViewing] = useState<EquipmentItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterCompany, setFilterCompany] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const { showToast } = useToast();

  const statusOptions: FilterButtonOption[] = [
    { id: 'active', label: 'Active' },
    { id: 'needs_service', label: 'Needs Service' },
    { id: 'out_of_service', label: 'Out of Service' },
  ];

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
  const handleView = (item: EquipmentItem) => {
    setViewing(item);
    const viewData: InventoryViewData = {
      id: item.id, name: item.name, status: item.status,
      department: item.department_name ?? '', departmentColor: item.department_color ?? 'blue',
      description: item.description ?? '', type: item.category ?? '',
      company: item.manufacturer ?? '', team: item.team_name ?? '', room: item.room_name ?? '',
    };
    openSheet('inventory', {
      id: item.id,
      item: viewData,
      onEdit: () => { closeAll(); handleEdit(item); },
    }, { title: item.name, variant: 'floating' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/equipment/${deleteTarget.id}`, { method: 'DELETE' });
    if (res.ok) {
      setEquipment((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      showToast({ title: 'Deleted', description: `${deleteTarget.name} has been removed.`, variant: 'success' });
    } else {
      const err = await res.json().catch(() => ({ error: 'Failed to delete' }));
      showToast({ title: 'Error', description: err.error, variant: 'error' });
    }
    setDeleteTarget(null);
  };

  const handleSave = async (data: InventoryFormData) => {
    const payload = {
      name: data.name,
      manufacturer: data.company || null,
      room_id: data.room || null,
      vendor_id: data.vendor_id || null,
      department_id: data.department_id || null,
      team_id: data.team_id || null,
      status: data.status,
      notes: data.description || null,
    };

    if (editing) {
      const res = await fetch(`/api/equipment/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update' }));
        throw new Error(err.error);
      }
      const updated: EquipmentItem = await res.json();
      setEquipment((prev) => prev.map((e) => e.id === editing.id ? updated : e));
    } else {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to add item' }));
        throw new Error(err.error);
      }
      const created: EquipmentItem = await res.json();
      setEquipment((prev) => [...prev, created]);
    }
  };

  const editFormData: InventoryFormData | null = editing
    ? { name: editing.name, status: editing.status, department: editing.department_name ?? '', department_id: editing.department_id ?? '', description: editing.description ?? '', type: editing.category ?? '', company: editing.manufacturer ?? '', vendor_id: editing.vendor_id ?? '', team: editing.team_name ?? '', team_id: editing.team_id ?? '', room: editing.room_id ?? '' }
    : null;



  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <SegmentedControl items={INVENTORY_SEGMENTS} value={view} onChange={setView} size="sm" />
          <span style={countBadge}>
            {view === 'equipment'
              ? <>{filteredItems.length}{filteredItems.length !== equipment.length && ` / ${equipment.length}`}</>
              : '0'}
          </span>
        </div>
        {view === 'equipment' && (
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
        )}
      </div>

      {view === 'supplies' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          gap: gap.lg,
          padding: space.xl,
          minHeight: '40vh',
        }}>
          <h2 style={{
            fontFamily: font.family.heading,
            fontSize: font.size.heading.medium,
            fontWeight: font.weight.bold,
            color: color.text.primary,
            margin: 0,
          }}>No Supplies Tracked Yet</h2>
          <p style={{
            fontFamily: font.family.body,
            fontSize: font.size.body.md,
            color: color.text.secondary,
            textAlign: 'center',
            maxWidth: '400px',
            lineHeight: font.lineHeight.normal,
          }}>
            Track consumable supplies like PPE, instruments, disposables, and autoclave bags here.
          </p>
        </div>
      )}

      {view === 'equipment' && <div style={tableWrap}>
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
              <TableSkeleton columns={6} />
            )}
            {!loading && filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: 'center', color: color.text.muted, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                  No items match the selected filters.
                </TableCell>
              </TableRow>
            )}
            {!loading && filteredItems.map((item) => {
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
                    <StatusBadge status={item.status} />
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
      </div>}

      <EditInventorySheet isOpen={editSheetOpen} onClose={handleEditClose} initialData={editFormData} onSave={handleSave} />
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
