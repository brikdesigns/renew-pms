'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Sheet, Button, TextInput, SheetSection } from '@brikdesigns/bds';
import { useToast } from '@/components/ToastProvider';
import { color, font, gap } from '@/lib/tokens';

interface ChangePasswordSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const MIN_PASSWORD_LENGTH = 8;

export function ChangePasswordSheet({ isOpen, onClose }: ChangePasswordSheetProps) {
  const { showToast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset fields when sheet closes (or re-opens with stale state)
  useEffect(() => {
    if (!isOpen) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setError(null);
    }
  }, [isOpen]);

  const submit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (saving) return;
    setError(null);

    if (!current || !next || !confirm) {
      setError('All fields are required.');
      return;
    }
    if (next.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (next !== confirm) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (next === current) {
      setError('New password must differ from your current password.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Could not change password.' }));
        setError(body.error ?? 'Could not change password.');
        return;
      }
      showToast({
        title: 'Password updated',
        description: 'Your password has been changed.',
        variant: 'success',
      });
      onClose();
    } catch (e) {
      console.error('[change-password] request failed:', e);
      setError('Could not reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Change password"
      width="500px"
      side="right"
      closeOnBackdrop={false}
      footer={<>
        <Button variant="ghost" size="md" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" type="submit" form="change-password-form" disabled={saving}>
          {saving ? 'Updating...' : 'Update password'}
        </Button>
      </>}
    >
      <form id="change-password-form" onSubmit={submit}>
        <SheetSection heading="Verify your identity">
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <TextInput
              type="password"
              label="Current password"
              size="sm"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Enter your current password"
              autoComplete="current-password"
              fullWidth
              required
            />
          </div>
        </SheetSection>

        <SheetSection heading="Set a new password">
          <div style={{ display: 'flex', flexDirection: 'column', gap: gap.md }}>
            <TextInput
              type="password"
              label="New password"
              size="sm"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              autoComplete="new-password"
              fullWidth
              required
            />
            <TextInput
              type="password"
              label="Confirm new password"
              size="sm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              fullWidth
              required
            />
            {error && (
              <div role="alert" style={{ color: color.text.negative, fontSize: font.size.body.sm }}>
                {error}
              </div>
            )}
          </div>
        </SheetSection>
      </form>
    </Sheet>
  );
}
