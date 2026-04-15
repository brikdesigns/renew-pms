'use client';

import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Tooltip } from '@brikdesigns/bds';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { UserAvatar } from '@/components/UserAvatar';
import { useToast } from '@/components/ToastProvider';
import { color, font, gap, border, shadow, space } from '@/lib/tokens';
import type { Member } from '@/hooks/useMembers';

const MENU_WIDTH = 220;
const MENU_MAX_H = 280;

const unassignedStyle: CSSProperties = {
  width: 28, height: 28, borderRadius: border.radius.pill,
  backgroundColor: color.surface.secondary,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};

function MenuItem({ active, onClick, avatar, label }: {
  active: boolean;
  onClick: () => void;
  avatar: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: gap.md,
        width: '100%', padding: `${space.xs} ${space.md}`,
        background: active ? color.surface.secondary : 'transparent',
        border: 'none', cursor: 'pointer', textAlign: 'left',
        fontFamily: font.family.label, fontSize: font.size.label.sm,
        fontWeight: active ? font.weight.semibold : font.weight.regular,
        color: color.text.primary,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = color.surface.secondary; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {avatar}
      {label}
    </button>
  );
}

interface TaskAssigneeAvatarProps {
  taskId: string;
  assigneeName: string | null;
  assigneeDepartmentColor?: string;
  members: Member[];
  onAssigned: () => void;
}

export function TaskAssigneeAvatar({ taskId, assigneeName, assigneeDepartmentColor, members, onAssigned }: TaskAssigneeAvatarProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const openMenu = useCallback(() => {
    if (!avatarRef.current) return;
    const rect = avatarRef.current.getBoundingClientRect();
    let top = rect.bottom + 4;
    let left = rect.left;
    if (top + MENU_MAX_H > window.innerHeight - 8) {
      top = rect.top - MENU_MAX_H - 4;
      if (top < 8) top = 8;
    }
    if (left + MENU_WIDTH > window.innerWidth - 8) left = window.innerWidth - MENU_WIDTH - 8;
    if (left < 8) left = 8;
    setPos({ top, left });
    setOpen(true);
  }, []);

  const close = useCallback(() => { setOpen(false); setPos(null); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (avatarRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      close();
    };
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close]);

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (open) close(); else openMenu();
  };

  const handleAssign = async (memberId: string | null, memberName: string | null) => {
    close();
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: memberId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to assign');
      }
      showToast({
        title: memberName ? 'Task assigned' : 'Task unassigned',
        description: memberName ? `Assigned to ${memberName}.` : 'Assignee removed.',
        variant: 'success',
      });
      onAssigned();
    } catch (err) {
      showToast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to assign', variant: 'error' });
    }
  };

  const activeMembers = members.filter(m => m.is_active);

  return (
    <>
      <Tooltip content={assigneeName ?? 'Assign to'} placement="top">
        <div
          ref={avatarRef}
          style={{ cursor: 'pointer' }}
          onClick={handleToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle(e); }}
        >
          {assigneeName ? (
            <UserAvatar name={assigneeName} departmentColorKey={assigneeDepartmentColor} size="sm" />
          ) : (
            <div style={unassignedStyle}>
              <Icon icon={icon.profile} style={{ fontSize: font.size.label.sm, color: color.text.muted } as CSSProperties & Record<string, string>} />
            </div>
          )}
        </div>
      </Tooltip>
      {open && pos && createPortal(
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999,
            width: MENU_WIDTH, maxHeight: MENU_MAX_H, overflowY: 'auto',
            backgroundColor: color.surface.primary, borderRadius: border.radius.md,
            border: `1px solid ${color.border.muted}`, boxShadow: shadow.lg,
            padding: `${gap.xs} 0`,
          }}
        >
          <MenuItem
            active={!assigneeName}
            onClick={() => handleAssign(null, null)}
            avatar={
              <div style={{ ...unassignedStyle, width: 24, height: 24 }}>
                <Icon icon={icon.profile} style={{ fontSize: font.size.body.xs, color: color.text.muted } as CSSProperties & Record<string, string>} />
              </div>
            }
            label="Unassigned"
          />
          {activeMembers.map(m => {
            const name = `${m.first_name} ${m.last_name}`.trim();
            return (
              <MenuItem
                key={m.id}
                active={assigneeName === name}
                onClick={() => handleAssign(m.id, name)}
                avatar={<UserAvatar name={name} departmentColorKey={m.department_color} size="sm" />}
                label={name}
              />
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
