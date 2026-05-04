'use client';

import { forwardRef, useImperativeHandle, useState, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@brikdesigns/bds';
import { IconButton, FilterBar, FilterButton, useSheetStack } from '@brikdesigns/bds';
import { StatusBadge } from '@/components/StatusBadge';
import type { FilterButtonOption } from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { color, font, space, gap } from '@/lib/tokens';
import { EditInventorySheet, type InventoryFormData } from '@/components/EditInventorySheet';
import type { InventoryViewData } from '@/components/ViewInventorySheet';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { TableSkeleton } from '@/components/TableSkeleton';
import { useToast } from '@/components/ToastProvider';
import { useEquipment, type EquipmentItem } from '@/hooks/useEquipment';

// ─── Status display ─────────────────────────────────────────────────────────


// ─── Styles ──────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1, gap: space.lg };

const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto' };

const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };

const nameCellStyle: CSSProperties = { fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary };
const secondaryCellStyle: CSSProperties = { fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary };

// TODO(bds-migration): body-cell bg is a local patch. Promote to BDS Table.css
// (.bds-table-cell { background-color: var(--background-primary) }) once the
// in-flight BDS session is reconciled, then remove this.
const bodyCellStyle: CSSProperties = { backgroundColor: color.background.primary };

export type InventoryView = 'equipment' | 'supplies';

export const INVENTORY_SEGMENTS = [
  { label: 'Equipment', value: 'equipment' as const },
  { label: 'Supplies', value: 'supplies' as const },
];

/**
 * Imperative handle for the parent's PageHeader Add button to trigger the
 * EditInventorySheet (rendered inside InventoryTable). See
 * InventorySettingsClient.
 */
export type InventoryTableHandle = {
  openAddSheet: () => void;
};

interface InventoryTableProps {
  view: InventoryView;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const InventoryTable = forwardRef<InventoryTableHandle, InventoryTableProps>(function InventoryTable({ view }, ref) {
  const { openSheet, closeAll } = useSheetStack();
  const { equipment, setEquipment, loading } = useEquipment();
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentItem | null>(null);
  const [viewing, setViewing] = useState<EquipmentItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | undefined>();
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterCompany, setFilterCompany] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const { showToast } = useToast();

  // Bridge for the Add Item button hosted in PageHeader actions.
  useImperativeHandle(ref, () => ({
    openAddSheet: () => { setEditing(null); setEditSheetOpen(true); },
  }));

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

  // handleAdd lives on the parent (InventorySettingsClient) and triggers
  // the sheet via the imperative ref (openAddSheet).
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



  const handleClearFilters = () => {
    setFilterStatus(undefined);
    setFilterCategory(undefined);
    setFilterCompany(undefined);
  };

  return (
    <div style={wrapStyle}>
      {/* Equipment / Supplies tabs + Add Item live on the parent's PageHeader
          (see InventorySettingsClient). The filter strip is BDS <FilterBar>
          with FilterButton children — only relevant on the Equipment tab. */}
      {view === 'equipment' && (
        <FilterBar
          total={equipment.length}
          filtered={filteredItems.length}
          label="items"
          onClear={handleClearFilters}
        >
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
        </FilterBar>
      )}

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
              <TableHead style={{ width: '120px' }}>{' '}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableSkeleton columns={6} />
            )}
            {!loading && filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} style={{ ...bodyCellStyle, textAlign: 'center', color: color.text.muted, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
                  No items match the selected filters.
                </TableCell>
              </TableRow>
            )}
            {!loading && filteredItems.map((item) => {
              return (
                <TableRow key={item.id}>
                  <TableCell style={bodyCellStyle}>
                    <span style={nameCellStyle}>{item.name}</span>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <span style={secondaryCellStyle}>{item.category || '—'}</span>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <span style={secondaryCellStyle}>{item.manufacturer || '—'}</span>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <span style={secondaryCellStyle}>{item.room_name || '—'}</span>
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell style={bodyCellStyle}>
                    <div style={actionBtnGroup}>
                      <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.eye} />} label={`View ${item.name}`} onClick={() => handleView(item)} />
                      <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.edit} />} label={`Edit ${item.name}`} onClick={() => handleEdit(item)} />
                      <IconButton variant="secondary" size="sm" icon={<Icon icon={icon.trash} />} label={`Delete ${item.name}`} onClick={() => setDeleteTarget({ id: item.id, name: item.name })} />
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
});
