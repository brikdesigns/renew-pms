'use client';

import { forwardRef, useImperativeHandle, useState, useEffect, useMemo, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@brikdesigns/bds';
import { Tag, Button, Chip, Menu, useSheetStack } from '@brikdesigns/bds';
import { StatusBadge } from '@/components/StatusBadge';
import type { MenuItemData } from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { color, font, space, gap } from '@/lib/tokens';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { EditVendorSheet, type VendorFormData } from '@/components/EditVendorSheet';
import { AddContactSheet, type ContactEditData } from '@/components/AddContactSheet';
import { TableSkeleton } from '@/components/TableSkeleton';
import '../_settingsTableStyles.css';

// Maps the user-facing filter labels to the canonical vendor type values
// stored on `vendors.type`. Module-level so useMemo deps stay stable.
const TYPE_FILTER_MAP: Record<string, string> = {
  Equipment: 'equipment',
  Software: 'software',
  Service: 'service',
  Lab: 'lab',
  'Referring Practice': 'referring_practice',
};

// ─── Types ──────────────────────────────────────────────────────────────────

export type RecordType = 'companies' | 'contacts';

export interface Vendor {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  contact_count: number;
}

interface Contact {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  vendor_id: string;
  vendor_name: string | null;
  vendor_type: string | null;
}

// ─── Display maps ───────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  equipment: 'Equipment',
  software: 'Software',
  service: 'Service',
  lab: 'Lab',
  referring_practice: 'Referring Practice',
};

const TYPE_TAG_COLORS: Record<string, { bg: string; color: string }> = {
  equipment:          { bg: color.department.purple.light, color: color.department.purple.text },
  software:           { bg: color.department.blue.light,   color: color.department.blue.text },
  service:            { bg: color.department.gold.light,   color: color.department.gold.text },
  lab:                { bg: color.department.red.light,    color: color.department.red.text },
  referring_practice: { bg: color.department.green.light,  color: color.department.green.text },
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1 };
// PageHeader → filter rhythm comes from settings/layout.tsx bodyStyle's
// `gap: space.lg`. A paddingTop here doubled it up; only the filter → table
// rhythm (paddingBottom + bottom border as divider) lives on this row now.
const filterRowStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
  paddingBottom: space.md, borderBottom: `1px solid ${color.border.muted}`,
};
const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto' };
const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };
const filterBarStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: gap.md, flexWrap: 'wrap' };
const chipWrapperStyle: CSSProperties = { position: 'relative' };
const menuStyle: CSSProperties = { position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 180, zIndex: 100 };

// TODO(bds-migration): body-cell bg is a local patch. Promote to BDS Table.css
// (.bds-table-cell { background-color: var(--background-primary) }) once the
// in-flight BDS session is reconciled, then remove this.
const bodyCellStyle: CSSProperties = { backgroundColor: color.background.primary };

export const RECORD_SEGMENTS = [
  { label: 'Companies', value: 'companies' as const },
  { label: 'Contacts', value: 'contacts' as const },
];

/**
 * Imperative handle exposed by ContactsTable. The settings page wrapper
 * (`ContactsSettingsClient`) hosts the Add button in the PageHeader actions
 * slot but the Add sheets remain rendered here — this handle bridges the two.
 */
export type ContactsTableHandle = {
  openAddCompany: () => void;
  openAddContact: () => void;
};

// ─── ChipFilter ─────────────────────────────────────────────────────────────

function ChipFilter({ options, selected, onChange }: { options: readonly string[]; selected: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const items: MenuItemData[] = options.map((opt) => ({
    id: opt, label: opt, onClick: () => { onChange(opt); setOpen(false); },
  }));
  const isFiltered = selected !== options[0];
  return (
    <div style={chipWrapperStyle}>
      <Chip label={selected} variant={isFiltered ? 'primary' : 'secondary'} showDropdown onChipClick={() => setOpen((p) => !p)} />
      <Menu items={items} isOpen={open} onClose={() => setOpen(false)} activeId={selected} style={menuStyle} />
    </div>
  );
}

// ─── Companies Table ────────────────────────────────────────────────────────

function CompaniesView({
  vendors, loading, onView, onEdit, onDelete,
}: {
  vendors: Vendor[];
  loading: boolean;
  onView: (v: Vendor) => void;
  onEdit: (v: Vendor) => void;
  onDelete: (v: Vendor) => void;
}) {
  return (
    <Table size="default" flush>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Contacts</TableHead>
          <TableHead>Status</TableHead>
          <TableHead style={{ width: '120px' }}>{' '}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableSkeleton columns={7} />
        ) : vendors.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="settings-table-empty-row" style={bodyCellStyle}>
              No companies found.
            </TableCell>
          </TableRow>
        ) : vendors.map(v => {
          const typeTag = TYPE_TAG_COLORS[v.type] ?? TYPE_TAG_COLORS.service;
          return (
            <TableRow key={v.id}>
              <TableCell style={bodyCellStyle}>
                <div className="settings-table-cell-text settings-table-cell-text--strong">
                  {v.name}
                </div>
                {v.address && (
                  <div style={{ fontFamily: font.family.body, fontSize: font.size.body.xs, color: color.text.secondary, marginTop: '2px' }}>
                    {v.address}
                  </div>
                )}
              </TableCell>
              <TableCell style={bodyCellStyle}>
                <Tag size="sm" style={{ backgroundColor: typeTag.bg, color: typeTag.color }}>
                  {TYPE_LABELS[v.type] ?? v.type}
                </Tag>
              </TableCell>
              <TableCell style={bodyCellStyle}>
                <span className={v.phone ? 'settings-table-cell-text' : 'settings-table-cell-text settings-table-cell-text--muted'}>
                  {v.phone ?? '—'}
                </span>
              </TableCell>
              <TableCell style={bodyCellStyle}>
                <span
                  className={v.email ? 'settings-table-cell-text' : 'settings-table-cell-text settings-table-cell-text--muted'}
                  style={{ overflowWrap: 'break-word' }}
                >
                  {v.email?.toLowerCase() ?? '—'}
                </span>
              </TableCell>
              <TableCell style={bodyCellStyle}>
                <span className="settings-table-cell-text settings-table-cell-text--secondary">
                  {v.contact_count}
                </span>
              </TableCell>
              <TableCell style={bodyCellStyle}>
                <StatusBadge status={v.is_active} />
              </TableCell>
              <TableCell style={bodyCellStyle}>
                <div style={actionBtnGroup}>
                  <Button variant="secondary" size="sm" icon={<Icon icon={icon.eye} />} label={`View ${v.name}`} onClick={() => onView(v)} />
                  <Button variant="secondary" size="sm" icon={<Icon icon={icon.edit} />} label={`Edit ${v.name}`} onClick={() => onEdit(v)} />
                  <Button variant="secondary" size="sm" icon={<Icon icon={icon.trash} />} label={`Delete ${v.name}`} onClick={() => onDelete(v)} />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ─── Contacts Table ─────────────────────────────────────────────────────────

function ContactsView({
  contacts, loading, onView, onEdit, onDelete,
}: {
  contacts: Contact[];
  loading: boolean;
  onView: (c: Contact) => void;
  onEdit: (c: Contact) => void;
  onDelete: (c: Contact) => void;
}) {
  return (
    <Table size="default" flush>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead style={{ width: '120px' }}>{' '}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableSkeleton columns={7} />
        ) : contacts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="settings-table-empty-row" style={bodyCellStyle}>
              No contacts found.
            </TableCell>
          </TableRow>
        ) : contacts.map(c => {
          const typeTag = TYPE_TAG_COLORS[c.vendor_type ?? ''] ?? TYPE_TAG_COLORS.service;
          return (
            <TableRow key={c.id}>
              <TableCell style={bodyCellStyle}>
                <div className="settings-table-cell-text settings-table-cell-text--strong">
                  {c.name}
                </div>
                {c.is_primary && (
                  <div style={{ fontFamily: font.family.body, fontSize: font.size.body.xs, color: color.text.brand, marginTop: '2px' }}>
                    Primary
                  </div>
                )}
              </TableCell>
              <TableCell style={bodyCellStyle}>
                <span className={c.vendor_name ? 'settings-table-cell-text' : 'settings-table-cell-text settings-table-cell-text--muted'}>
                  {c.vendor_name ?? '—'}
                </span>
              </TableCell>
              <TableCell style={bodyCellStyle}>
                {c.vendor_type ? (
                  <Tag size="sm" style={{ backgroundColor: typeTag.bg, color: typeTag.color }}>
                    {TYPE_LABELS[c.vendor_type] ?? c.vendor_type}
                  </Tag>
                ) : (
                  <span className="settings-table-cell-text settings-table-cell-text--muted">—</span>
                )}
              </TableCell>
              <TableCell style={bodyCellStyle}>
                <span className={c.role ? 'settings-table-cell-text' : 'settings-table-cell-text settings-table-cell-text--muted'}>
                  {c.role ?? '—'}
                </span>
              </TableCell>
              <TableCell style={bodyCellStyle}>
                <span className={c.phone ? 'settings-table-cell-text' : 'settings-table-cell-text settings-table-cell-text--muted'}>
                  {c.phone ?? '—'}
                </span>
              </TableCell>
              <TableCell style={bodyCellStyle}>
                <span
                  className={c.email ? 'settings-table-cell-text' : 'settings-table-cell-text settings-table-cell-text--muted'}
                  style={{ overflowWrap: 'break-word' }}
                >
                  {c.email?.toLowerCase() ?? '—'}
                </span>
              </TableCell>
              <TableCell style={bodyCellStyle}>
                <div style={actionBtnGroup}>
                  <Button variant="secondary" size="sm" icon={<Icon icon={icon.eye} />} label={`View ${c.name}`} onClick={() => onView(c)} />
                  <Button variant="secondary" size="sm" icon={<Icon icon={icon.edit} />} label={`Edit ${c.name}`} onClick={() => onEdit(c)} />
                  <Button variant="secondary" size="sm" icon={<Icon icon={icon.trash} />} label={`Delete ${c.name}`} onClick={() => onDelete(c)} />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface ContactsTableProps {
  recordType: RecordType;
}

export const ContactsTable = forwardRef<ContactsTableHandle, ContactsTableProps>(function ContactsTable({ recordType }, ref) {
  const { openSheet, closeAll } = useSheetStack();
  const { showToast } = useToast();

  // Companies state
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [filterType, setFilterType] = useState('All Types');
  const [filterStatus, setFilterStatus] = useState('All Statuses');

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [filterCompany, setFilterCompany] = useState('All Companies');
  const [filterContactType, setFilterContactType] = useState('All Types');
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactEditData | null>(null);
  const [deleteContactTarget, setDeleteContactTarget] = useState<{ id: string; name: string } | null>(null);

  // Bridge for the Add Company / Add Contact buttons hosted in PageHeader
  // actions (see ContactsSettingsClient). Sheets stay rendered below.
  useImperativeHandle(ref, () => ({
    openAddCompany: () => { setEditing(null); setSheetOpen(true); },
    openAddContact: () => { setAddContactOpen(true); },
  }));

  // Fetch vendors
  useEffect(() => {
    fetch('/api/vendors')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setVendors(data); })
      .catch(err => console.error('[ContactsTable] failed to load vendors:', err))
      .finally(() => setVendorsLoading(false));
  }, []);

  // Fetch contacts
  useEffect(() => {
    fetch('/api/contacts')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setContacts(data); })
      .catch(err => console.error('[ContactsTable] failed to load contacts:', err))
      .finally(() => setContactsLoading(false));
  }, []);

  // ── Company filters ──

  const typeOptions = ['All Types', 'Equipment', 'Software', 'Service', 'Lab', 'Referring Practice'] as const;
  const statusOptions = ['All Statuses', 'Active', 'Inactive'] as const;

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      if (filterType !== 'All Types' && v.type !== TYPE_FILTER_MAP[filterType]) return false;
      if (filterStatus === 'Active' && !v.is_active) return false;
      if (filterStatus === 'Inactive' && v.is_active) return false;
      return true;
    });
  }, [vendors, filterType, filterStatus]);

  // ── Contact filters ──

  const companyOptions = useMemo(() => [
    'All Companies',
    ...Array.from(new Set(contacts.map(c => c.vendor_name).filter(Boolean) as string[])).sort(),
  ], [contacts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      if (filterCompany !== 'All Companies' && c.vendor_name !== filterCompany) return false;
      if (filterContactType !== 'All Types' && c.vendor_type !== TYPE_FILTER_MAP[filterContactType]) return false;
      return true;
    });
  }, [contacts, filterCompany, filterContactType]);

  // ── Company handlers ──
  // handleAdd lives on the parent (ContactsSettingsClient) and triggers the
  // sheet via the imperative ref (openAddCompany).

  const handleEdit = (v: Vendor) => { setEditing(v); setSheetOpen(true); };
  const handleView = (v: Vendor) => {
    openSheet('vendor', {
      id: v.id,
      vendor: v,
      onEdit: (vendor: Vendor) => { closeAll(); handleEdit(vendor); },
    }, { title: v.name, variant: 'floating' });
  };

  const handleSave = async (data: VendorFormData) => {
    if (editing) {
      const res = await fetch(`/api/vendors/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const updated = await res.json();
      setVendors(prev => prev.map(v => v.id === editing.id ? { ...v, ...updated } : v));
      showToast({ title: 'Company updated', description: `${data.name} has been updated.`, variant: 'success' });
    } else {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const created = await res.json();
      setVendors(prev => [...prev, created]);
      showToast({ title: 'Company added', description: `${data.name} has been created.`, variant: 'success' });
    }
    setSheetOpen(false);
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/vendors/${deleteTarget.id}`, { method: 'DELETE' });
    if (!res.ok) {
      showToast({ title: 'Error', description: 'Failed to delete company', variant: 'error' });
      return;
    }
    setVendors(prev => prev.filter(v => v.id !== deleteTarget.id));
    showToast({ title: 'Company deleted', description: `${deleteTarget.name} has been removed.`, variant: 'success' });
    setDeleteTarget(null);
  };

  // ── Contact handlers ──

  const handleViewContact = (c: Contact) => {
    openSheet('contact', { id: c.id }, { title: c.name, variant: 'floating' });
  };

  const handleEditContact = (c: Contact) => {
    setEditingContact({
      id: c.id,
      vendor_id: c.vendor_id,
      name: c.name,
      role: c.role,
      phone: c.phone,
      email: c.email,
      is_primary: c.is_primary,
    });
    setAddContactOpen(true);
  };

  const handleDeleteContact = async () => {
    if (!deleteContactTarget) return;
    const res = await fetch(`/api/contacts/${deleteContactTarget.id}`, { method: 'DELETE' });
    if (!res.ok) {
      showToast({ title: 'Error', description: 'Failed to delete contact', variant: 'error' });
      return;
    }
    setContacts(prev => prev.filter(c => c.id !== deleteContactTarget.id));
    showToast({ title: 'Contact deleted', description: `${deleteContactTarget.name} has been removed.`, variant: 'success' });
    setDeleteContactTarget(null);
  };

  // ── Derived ──

  const isCompanies = recordType === 'companies';

  return (
    <div style={wrapStyle}>
      {/* Filter chips row — segmented control + Add button live on the
          parent's PageHeader (see ContactsSettingsClient). */}
      <div style={filterRowStyle}>
        <div style={filterBarStyle}>
          {isCompanies ? (
            <>
              <ChipFilter options={typeOptions} selected={filterType} onChange={setFilterType} />
              <ChipFilter options={statusOptions} selected={filterStatus} onChange={setFilterStatus} />
            </>
          ) : (
            <>
              <ChipFilter options={companyOptions as unknown as readonly string[]} selected={filterCompany} onChange={setFilterCompany} />
              <ChipFilter options={typeOptions} selected={filterContactType} onChange={setFilterContactType} />
            </>
          )}
        </div>
      </div>

      <div style={tableWrap}>
        {isCompanies ? (
          <CompaniesView
            vendors={filteredVendors}
            loading={vendorsLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={(v) => setDeleteTarget({ id: v.id, name: v.name })}
          />
        ) : (
          <ContactsView
            contacts={filteredContacts}
            loading={contactsLoading}
            onView={handleViewContact}
            onEdit={handleEditContact}
            onDelete={(c) => setDeleteContactTarget({ id: c.id, name: c.name })}
          />
        )}
      </div>

      <EditVendorSheet
        isOpen={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditing(null); }}
        initialData={editing}
        onSave={handleSave}
      />
      <AddContactSheet
        isOpen={addContactOpen}
        onClose={() => { setAddContactOpen(false); setEditingContact(null); }}
        initialData={editingContact}
        onSaved={(contact) => {
          const row: Contact = {
            id: contact.id,
            name: contact.name,
            role: contact.role || null,
            phone: contact.phone || null,
            email: contact.email || null,
            is_primary: contact.is_primary,
            vendor_id: contact.vendor_id,
            vendor_name: contact.vendor_name,
            vendor_type: contact.vendor_type,
          };
          if (editingContact) {
            setContacts(prev => prev.map(c => c.id === contact.id ? row : c));
          } else {
            setContacts(prev => [...prev, row]);
          }
          setEditingContact(null);
        }}
      />
      <ConfirmDeleteDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.name ?? ''}
        itemType="company"
      />
      <ConfirmDeleteDialog
        isOpen={deleteContactTarget !== null}
        onClose={() => setDeleteContactTarget(null)}
        onConfirm={handleDeleteContact}
        itemName={deleteContactTarget?.name ?? ''}
        itemType="contact"
      />
    </div>
  );
});
