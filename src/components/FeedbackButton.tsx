'use client';

import { useState, type CSSProperties } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Icon } from '@iconify/react';
import { icon } from '@/lib/icons';
import { IconButton, Button, Sheet } from '@bds/components';
import { color, font, space, gap, border, size } from '@/lib/tokens';

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

const inputStyle: CSSProperties = {
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
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
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

// ─── Component ───────────────────────────────────────────────────────────────

export function FeedbackButton({ userEmail, userName }: { userEmail?: string; userName?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(userName ?? '');
  const [email, setEmail] = useState(userEmail ?? '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleClose = () => {
    setOpen(false);
    // Reset after close animation
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
    }, 300);
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      Sentry.captureFeedback({
        name: name.trim() || 'Anonymous',
        email: email.trim() || undefined,
        message: message.trim(),
      });
      setSubmitted(true);
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

            <div style={fieldStyle}>
              <label style={labelStyle}>Name</label>
              <input
                style={inputStyle}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Email</label>
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
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
          </div>
        )}
      </Sheet>
    </>
  );
}
