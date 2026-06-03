import { NextResponse } from 'next/server';

/** Sanitize errors before returning — Supabase error.message can leak schema/constraint names (HIPAA #207). */
export function apiError(
  error: unknown,
  options: { status?: number; message?: string } = {},
): NextResponse {
  console.error('[api]', error);
  return NextResponse.json(
    { error: options.message ?? 'Internal server error' },
    { status: options.status ?? 500 },
  );
}
