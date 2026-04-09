'use client';

import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@bds/components';
import { Badge, Tag, Button, IconButton, Chip, Menu } from '@bds/components';
import type { MenuItemData } from '@bds/components';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { color, font, space, gap, border } from '@/lib/tokens';
import { useToast } from '@/components/ToastProvider';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { EditVendorSheet, type VendorFormData } from '@/components/EditVendorSheet';
import { ViewVendorSheet } from '@/components/ViewVendorSheet';
import { AddContactSheet, type ContactEditData } from '@/components/AddContactSheet';

// ─── Types ──────────────────────────────────────────────────────────────────

type RecordType = 'companies' | 'contacts';

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

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1, paddingInline: space.xl };
const subHeaderStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: `${space.md} 0`, borderBottom: `1px solid ${color.border.muted}`,
};
const subHeaderLeftStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: space.sm };
const subHeaderTitleStyle: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.label.md, fontWeight: font.weight.semibold, color: color.text.primary, margin: 0,
};
const countBadge: CSSProperties = {
  fontFamily: font.family.label, fontSize: font.size.body.xs, fontWeight: font.weight.medium,
  color: color.text.secondary, backgroundColor: color.surface.secondary, padding: `2px ${gap.md}`, borderRadius: border.radius.sm,
};
const tableWrap: CSSProperties = { flex: 1, overflowX: 'auto' };
const actionBtnGroup: CSSProperties = { display: 'flex', gap: gap.md, justifyContent: 'flex-end' };
const filterBarStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: gap.md, flexWrap: 'wrap' };
const chipWrapperStyle: CSSProperties = { position: 'relative' };
const menuStyle: CSSProperties = { position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 180, zIndex: 100 };

const recordTypeBarStyle: CSSProperties = {
  display: 'flex', gap: gap.xs, backgroundColor: color.surface.secondary,
  borderRadius: border.radius.sm, padding: '2px',
};

const recordTypeBtnStyle = (active: boolean): CSSProperties => ({
  padding: `${space.xs} ${space.md}`,
  borderRadius: border.radius.xs,
  border: 'none',
  cursor: 'pointer',
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: active ? font.weight.semibold : font.weight.medium,
  color: active ? color.text.primary : color.text.secondary,
  backgroundColor: active ? color.surface.primary : 'transparent',
  boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
  transition: 'all 0.15s ease',
});

// ─── ChipFilter ─────────────────────────────────────────────────────────────

function ChipFilter({ options, selected, onChange }: { options: readonly string[]; selected: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const items: MenuItemData[] = options.map((opt) => ({
    id: opt, label: opt, onClick: () => { onChange(opt); setOpen(false); },
  }));
  const isFiltered = selected !== options[0];
  return (
    <div style={chipWrapperStyle}>
      <Chip label={selected} variant={isFiltered ? 'primary' : 'secondary'} appearance={isFiltered ? 'solid' : 'light'} showDropdown onChipClick={() => setOpen((p) => !p)} />
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
          <TableHead style={{ width: '100px' }}>{' '}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={7} style={{ textAlign: 'center', color: color.text.muted, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
              Loading companies…
            </TableCell>
          </TableRow>
        ) : vendors.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} style={{ textAlign: 'center', color: color.text.muted, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
              No companies found.
            </TableCell>
          </TableRow>
        ) : vendors.map(v => {
          const typeTag = TYPE_TAG_COLORS[v.type] ?? TYPE_TAG_COLORS.service;
          return (
            <TableRow key={v.id}>
              <TableCell>
                <div style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary }}>
                  {v.name}
                </div>
                {v.address && (
                  <div style={{ fontFamily: font.family.body, fontSize: font.size.body.xs, color: color.text.secondary, marginTop: '2px' }}>
                    {v.address}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Tag size="sm" style={{ backgroundColor: typeTag.bg, color: typeTag.color }}>
                  {TYPE_LABELS[v.type] ?? v.type}
                </Tag>
              </TableCell>
              <TableCell>
                <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: v.phone ? color.text.primary : color.text.muted }}>
                  {v.phone ?? '—'}
                </span>
              </TableCell>
              <TableCell>
                <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: v.email ? color.text.primary : color.text.muted }}>
                  {v.email ?? '—'}
                </span>
              </TableCell>
              <TableCell>
                <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.secondary }}>
                  {v.contact_count}
                </span>
              </TableCell>
              <TableCell>
                <Badge status={v.is_active ? 'positive' : 'error'} size="sm">
                  {v.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <div style={actionBtnGroup}>
                  <IconButton variant="secondary" size="tiny" icon={<Icon icon={icon.eye} />} label={`View ${v.name}`} onClick={() => onView(v)} />
                  <IconButton variant="secondary" size="tiny" icon={<Icon icon={icon.edit} />} label={`Edit ${v.name}`} onClick={() => onEdit(v)} />
                  <IconButton variant="secondary" size="tiny" icon={<Icon icon={icon.trash} />} label={`Delete ${v.name}`} onClick={() => onDelete(v)} />
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
          <TableHead style={{ width: '100px' }}>{' '}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={7} style={{ textAlign: 'center', color: color.text.muted, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
              Loading contacts…
            </TableCell>
          </TableRow>
        ) : contacts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} style={{ textAlign: 'center', color: color.text.muted, fontFamily: font.family.label, fontSize: font.size.label.sm }}>
              No contacts found.
            </TableCell>
          </TableRow>
        ) : contacts.map(c => {
          const typeTag = TYPE_TAG_COLORS[c.vendor_type ?? ''] ?? TYPE_TAG_COLORS.service;
          return (
            <TableRow key={c.id}>
              <TableCell>
                <div style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, fontWeight: font.weight.medium, color: color.text.primary }}>
                  {c.name}
                </div>
                {c.is_primary && (
                  <div style={{ fontFamily: font.family.body, fontSize: font.size.body.xs, color: color.text.brand, marginTop: '2px' }}>
                    Primary
                  </div>
                )}
              </TableCell>
              <TableCell>
                <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: c.vendor_name ? color.text.primary : color.text.muted }}>
                  {c.vendor_name ?? '—'}
                </span>
              </TableCell>
              <TableCell>
                {c.vendor_type ? (
                  <Tag size="sm" style={{ backgroundColor: typeTag.bg, color: typeTag.color }}>
                    {TYPE_LABELS[c.vendor_type] ?? c.vendor_type}
                  </Tag>
                ) : (
                  <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: color.text.muted }}>—</span>
                )}
              </TableCell>
              <TableCell>
                <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: c.role ? color.text.primary : color.text.muted }}>
                  {c.role ?? '—'}
                </span>
              </TableCell>
              <TableCell>
                <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: c.phone ? color.text.primary : color.text.muted }}>
                  {c.phone ?? '—'}
                </span>
              </TableCell>
              <TableCell>
                <span style={{ fontFamily: font.family.label, fontSize: font.size.label.sm, color: c.email ? color.text.primary : color.text.muted }}>
                  {c.email ?? '—'}
                </span>
              </TableCell>
              <TableCell>
                <div style={actionBtnGroup}>
                  <IconButton variant="secondary" size="tiny" icon={<Icon icon={icon.eye} />} label={`View ${c.name}`} onClick={() => onView(c)} />
                  <IconButton variant="secondary" size="tiny" icon={<Icon icon={icon.edit} />} label={`Edit ${c.name}`} onClick={() => onEdit(c)} />
                  <IconButton variant="secondary" size="tiny" icon={<Icon icon={icon.trash} />} label={`Delete ${c.name}`} onClick={() => onDelete(c)} />
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

export function ContactsTable() {
  const { showToast } = useToast();
  const [recordType, setRecordType] = useState<RecordType>('companies');

  // Companies state
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Vendor | null>(null);
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

  const TYPE_FILTER_MAP: Record<string, string> = {
    Equipment: 'equipment', Software: 'software', Service: 'service', Lab: 'lab', 'Referring Practice': 'referring_practice',
  };

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

  const handleAdd = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (v: Vendor) => { setEditing(v); setSheetOpen(true); };
  const handleView = (v: Vendor) => { setViewing(v); setViewOpen(true); };

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
    // Open the parent vendor's view sheet (which shows contacts in the Contacts tab)
    const v = vendors.find(v => v.id === c.vendor_id);
    if (v) { setViewing(v); setViewOpen(true); }
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
  const count = isCompanies ? filteredVendors.length : filteredContacts.length;
  const loading = isCompanies ? vendorsLoading : contactsLoading;

  return (
    <div style={wrapStyle}>
      <div style={subHeaderStyle}>
        <div style={subHeaderLeftStyle}>
          <div style={recordTypeBarStyle}>
            <button type="button" style={recordTypeBtnStyle(isCompanies)} onClick={() => setRecordType('companies')}>
              Companies
            </button>
            <button type="button" style={recordTypeBtnStyle(!isCompanies)} onClick={() => setRecordType('contacts')}>
              Contacts
            </button>
          </div>
          <span style={countBadge}>{loading ? '–' : count}</span>
        </div>
        <div style={filterBarStyle}>
          {isCompanies ? (
            <>
              <ChipFilter options={typeOptions} selected={filterType} onChange={setFilterType} />
              <ChipFilter options={statusOptions} selected={filterStatus} onChange={setFilterStatus} />
              <Button variant="primary" size="sm" onClick={handleAdd}>Add Company</Button>
            </>
          ) : (
            <>
              <ChipFilter options={companyOptions as unknown as readonly string[]} selected={filterCompany} onChange={setFilterCompany} />
              <ChipFilter options={typeOptions} selected={filterContactType} onChange={setFilterContactType} />
              <Button variant="primary" size="sm" onClick={() => setAddContactOpen(true)}>Add Contact</Button>
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
      <ViewVendorSheet
        isOpen={viewOpen}
        onClose={() => { setViewOpen(false); setViewing(null); }}
        vendor={viewing}
        onEdit={(v) => { setViewOpen(false); setViewing(null); handleEdit(v); }}
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
}
