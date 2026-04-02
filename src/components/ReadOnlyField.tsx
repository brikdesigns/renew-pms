import {
  fieldStyle,
  labelStyle,
  valueStyle,
  emptyFieldStyle,
} from '@/app/(auth)/settings/_shared';

interface ReadOnlyFieldProps {
  label: string;
  value: string | null | undefined;
}

export function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  return (
    <div style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value ?? '—'}</span>
    </div>
  );
}

export function EmptyField() {
  return <div style={emptyFieldStyle} />;
}
