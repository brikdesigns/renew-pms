'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';
import { Button, IconButton, TextArea } from '@brikdesigns/bds';
import { border, color, font, gap, shadow, space } from '@/lib/tokens';

const SHOW_WIDGET =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === 'true';

const FEEDBACK_TYPES = [
  { label: 'Bug', value: 'bug' },
  { label: 'UI', value: 'ui' },
  { label: 'Suggestion', value: 'suggestion' },
  { label: 'Question', value: 'question' },
] as const;

const ChatIcon = () => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const fabWrapStyle: CSSProperties = {
  position: 'fixed',
  bottom: '16px',
  left: '72px',
  zIndex: 9998,
};

const panelStyle: CSSProperties = {
  position: 'fixed',
  bottom: '64px',
  left: '16px',
  zIndex: 9998,
  width: '320px',
  backgroundColor: color.surface.primary,
  borderRadius: border.radius.lg,
  border: `1px solid ${color.border.primary}`,
  boxShadow: shadow.lg,
  padding: space.md,
  display: 'flex',
  flexDirection: 'column',
  gap: gap.sm,
  fontFamily: font.family.body,
  color: color.text.primary,
};

const headerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: gap.xs,
};

const headerTitleStyle: CSSProperties = {
  fontSize: font.size.label.sm,
  fontFamily: font.family.label,
  fontWeight: font.weight.semibold,
  color: color.text.secondary,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const typeGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: gap.xs,
};

const urlStyle: CSSProperties = {
  fontSize: font.size.body.xs,
  color: color.text.muted,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const successStyle: CSSProperties = {
  textAlign: 'center',
  color: color.text.success,
  fontSize: font.size.body.sm,
  fontWeight: font.weight.semibold,
  padding: `${space.lg} 0`,
};

export function DevFeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>('bug');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pagePath, setPagePath] = useState('');

  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') setPagePath(window.location.pathname);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (fabRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!SHOW_WIDGET) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_url: window.location.pathname,
          feedback_type: type,
          description: description.trim(),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setOpen(false);
          setSubmitted(false);
          setDescription('');
          setType('bug');
        }, 1500);
      } else {
        const data = await res.json();
        console.error('[DevFeedbackWidget] submission failed:', data);
        alert(`Feedback failed: ${JSON.stringify(data.details ?? data.error)}`);
      }
    } catch (err) {
      console.error('[DevFeedbackWidget] submission error:', err);
      alert('Feedback failed — see console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div ref={fabRef} style={fabWrapStyle}>
        <IconButton
          variant="primary"
          size="md"
          icon={open ? <CloseIcon /> : <ChatIcon />}
          label={open ? 'Close feedback' : 'Submit feedback'}
          title={open ? 'Close feedback' : 'Submit feedback'}
          onClick={() => setOpen((v) => !v)}
        />
      </div>

      {open && (
        <div ref={panelRef} style={panelStyle} role="dialog" aria-label="Submit feedback">
          <div style={headerRowStyle}>
            <span style={headerTitleStyle}>Submit Feedback</span>
          </div>

          {submitted ? (
            <div style={successStyle}>Submitted — thank you!</div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: gap.sm }}
            >
              <div style={typeGridStyle} role="radiogroup" aria-label="Feedback type">
                {FEEDBACK_TYPES.map(({ label, value }) => {
                  const isActive = type === value;
                  return (
                    <Button
                      key={value}
                      type="button"
                      variant={isActive ? 'selected' : 'secondary'}
                      size="sm"
                      fullWidth
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setType(value)}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>

              <TextArea
                size="sm"
                fullWidth
                rows={4}
                placeholder="Describe what you found..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoFocus
              />

              <div style={urlStyle}>Page: {pagePath}</div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                fullWidth
                loading={submitting}
                disabled={submitting || !description.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
