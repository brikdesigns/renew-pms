'use client';

import { createContext, useContext, useState, useCallback, type ReactNode, type CSSProperties } from 'react';
import { Toast, type ToastVariant } from '@bds/components';
import { gap } from '@/lib/tokens';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (opts: { title: string; description?: string; variant?: ToastVariant }) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const containerStyle: CSSProperties = {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: gap.md,
  zIndex: 2000,
  pointerEvents: 'none',
};

const itemStyle: CSSProperties = {
  pointerEvents: 'auto',
  animation: 'toast-slide-in 0.25s ease-out',
};

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, variant = 'success' }: { title: string; description?: string; variant?: ToastVariant }) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div style={containerStyle}>
          {toasts.map((t) => (
            <div key={t.id} style={itemStyle}>
              <Toast
                title={t.title}
                description={t.description}
                variant={t.variant}
                onDismiss={() => dismiss(t.id)}
              />
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
