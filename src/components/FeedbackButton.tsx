'use client';

import { useState, type CSSProperties } from 'react';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { IconButton, Button, Sheet } from '@bds/components';
import { color, font, space, gap, border, size } from '@/lib/tokens';

const IS_DEV = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_PERSONAS === 'true';

const FEEDBACK_TYPES = [
  { value: 'bug', label: 'Bug', emoji: '🐛' },
  { value: 'ui', label: 'UI Issue', emoji: '🎨' },
  { value: 'suggestion', label: 'Suggestion', emoji: '💡' },
  { value: 'question', label: 'Question', emoji: '❓' },
] as const;

// ─── Styles ──────────────────────────────────────────────────────────────────

const bodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.lg,
  flex: 1,
};

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: gap.xs,
};

const labelStyle: CSSProperties = {
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: font.weight.semibold,
  color: color.text.primary,
};

const typeRowStyle: CSSProperties = {
  display: 'flex',
  gap: gap.xs,
};

const typeBtnStyle = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: `${space.xs} ${space.xs}`,
  borderRadius: border.radius.md,
  border: `1px solid ${active ? color.border.focus : color.border.input}`,
  backgroundColor: active ? color.background.secondary : 'transparent',
  color: active ? color.text.primary : color.text.secondary,
  cursor: 'pointer',
  fontFamily: font.family.label,
  fontSize: font.size.label.sm,
  fontWeight: active ? font.weight.semibold : font.weight.regular,
  textAlign: 'center',
  transition: 'all 0.1s ease',
});

const textareaStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.md,
  color: color.text.primary,
  backgroundColor: color.background.input,
  border: `1px solid ${color.border.input}`,
  borderRadius: border.radius.md,
  padding: `${space.xs} ${space.sm}`,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  minHeight: '120px',
  resize: 'vertical',
};

const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: gap.md,
};

const successStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: gap.md,
  flex: 1,
  padding: space.xl,
  textAlign: 'center',
};

const urlStyle: CSSProperties = {
  fontFamily: font.family.body,
  fontSize: font.size.body.sm,
  color: color.text.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function FeedbackButton({ userEmail, userName }: { userEmail?: string; userName?: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>('bug');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!IS_DEV) return null;

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      setType('bug');
    }, 300);
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_url: window.location.pathname,
          feedback_type: type,
          description: message.trim(),
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        console.error('Feedback submission failed:', data);
        alert(`Feedback failed: ${JSON.stringify(data.details ?? data.error)}`);
      }
    } catch (err) {
      console.error('Feedback submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <div style={footerStyle}>
      <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
      <Button
        variant="primary"
        size="sm"
        onClick={handleSubmit}
        disabled={!message.trim() || submitting}
        loading={submitting}
      >
        Send Feedback
      </Button>
    </div>
  );

  return (
    <>
      <IconButton
        variant="secondary"
        size="sm"
        icon={<Icon icon={icon.feedback} />}
        label="Send feedback"
        onClick={() => setOpen(true)}
      />

      <Sheet
        isOpen={open}
        onClose={handleClose}
        title="Send Feedback"
        footer={submitted ? undefined : footer}
      >
        {submitted ? (
          <div style={successStyle}>
            <Icon icon={icon.circleCheck} style={{ fontSize: size['6xl'], color: color.system.green } as CSSProperties & Record<string, string>} />
            <div>
              <div style={{ fontFamily: font.family.label, fontSize: font.size.label.lg, fontWeight: font.weight.bold, color: color.text.primary }}>
                Thanks for the feedback!
              </div>
              <div style={{ fontFamily: font.family.body, fontSize: font.size.body.md, color: color.text.secondary, marginTop: space.xs }}>
                We&apos;ll review it and follow up if needed.
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={handleClose}>Close</Button>
          </div>
        ) : (
          <div style={bodyStyle}>
            <div style={{ fontFamily: font.family.body, fontSize: font.size.body.md, color: color.text.secondary }}>
              Found a bug or have a suggestion? Let us know — your feedback shapes what we build next.
            </div>

            {/* Feedback type selector */}
            <div style={fieldStyle}>
              <label style={labelStyle}>Type</label>
              <div style={typeRowStyle}>
                {FEEDBACK_TYPES.map((ft) => (
                  <button
                    key={ft.value}
                    type="button"
                    style={typeBtnStyle(type === ft.value)}
                    onClick={() => setType(ft.value)}
                  >
                    {ft.emoji} {ft.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Feedback <span style={{ color: color.text.negative }}>*</span></label>
              <textarea
                style={textareaStyle}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what you noticed or what could be better..."
              />
            </div>

            <div style={urlStyle}>
              Page: {typeof window !== 'undefined' ? window.location.pathname : ''}
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
