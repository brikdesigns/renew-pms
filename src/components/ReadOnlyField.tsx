import type { ReactNode } from 'react';
import {
  fieldStyle,
  labelStyle,
  valueStyle,
  emptyFieldStyle,
} from '@/app/(auth)/settings/_shared';

interface ReadOnlyFieldProps {
  label: string;
  value: ReactNode | string | null | undefined;
}

export function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  const isString = typeof value === 'string' || value === null || value === undefined;
  return (
    <div style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      {isString
        ? <span style={valueStyle}>{value ?? '—'}</span>
        : <div style={{ alignSelf: 'flex-start' }}>{value}</div>
      }
    </div>
  );
}

export function EmptyField() {
  return <div style={emptyFieldStyle} />;
}
