import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

// ── Types ──────────────────────────────────────────────────────────────────

export interface GenerateTokenOptions {
  practiceId: string;
  requestId: string;
  vendorId: string;
  vendorContactId?: string | null;
  /** Token lifetime in days (default 30) */
  expiryDays?: number;
}

export interface TokenRecord {
  id: string;
  practice_id: string;
  request_id: string;
  vendor_id: string;
  vendor_contact_id: string | null;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export interface ValidatedToken {
  token: TokenRecord;
  request: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    urgency: string;
    status: string;
    location_description: string | null;
    created_at: string;
    updated_at: string;
  };
  vendor: { id: string; name: string };
  vendor_contact: { id: string; name: string; email: string | null } | null;
  room_name: string | null;
  equipment_name: string | null;
  messages: VendorMessage[];
}

export interface VendorMessage {
  id: string;
  sender_type: 'vendor' | 'staff';
  sender_name: string;
  body: string;
  vendor_status: string | null;
  created_at: string;
}

export type ValidationResult =
  | { valid: true; data: ValidatedToken }
  | { valid: false; reason: 'not_found' | 'expired' | 'revoked' | 'closed' };

// ── Token generation ───────────────────────────────────────────────────────

/**
 * Generate a new vendor portal token for a request assignment.
 * Revokes any existing active tokens for the same request first.
 */
export async function generateVendorToken(options: GenerateTokenOptions): Promise<TokenRecord> {
  const { practiceId, requestId, vendorId, vendorContactId, expiryDays = 30 } = options;
  const admin = createAdminClient();

  // Revoke any existing active tokens for this request
  await revokeTokensForRequest(requestId);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  // Generate cryptographically random token
  const token = crypto.randomBytes(32).toString('base64url');

  const { data, error } = await admin
    .from('vendor_request_tokens')
    .insert({
      practice_id: practiceId,
      request_id: requestId,
      vendor_id: vendorId,
      vendor_contact_id: vendorContactId ?? null,
      token,
      status: 'active',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Unique constraint violation — astronomically unlikely, retry once
    if (error.code === '23505') {
      const retryToken = crypto.randomBytes(32).toString('base64url');
      const { data: retryData, error: retryError } = await admin
        .from('vendor_request_tokens')
        .insert({
          practice_id: practiceId,
          request_id: requestId,
          vendor_id: vendorId,
          vendor_contact_id: vendorContactId ?? null,
          token: retryToken,
          status: 'active',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (retryError) {
        throw new Error(`[vendor-token] Failed to generate token after retry: ${retryError.message}`);
      }
      return retryData as TokenRecord;
    }
    throw new Error(`[vendor-token] Failed to generate token: ${error.message}`);
  }

  return data as TokenRecord;
}

// ── Token validation ───────────────────────────────────────────────────────

/**
 * Validate a vendor portal token from a public request.
 * Returns the full token context (request, vendor, messages) or a failure reason.
 */
export async function validateVendorToken(tokenValue: string): Promise<ValidationResult> {
  const admin = createAdminClient();

  // Look up the token
  const { data: tokenRow, error } = await admin
    .from('vendor_request_tokens')
    .select('*')
    .eq('token', tokenValue)
    .maybeSingle();

  if (error || !tokenRow) {
    return { valid: false, reason: 'not_found' };
  }

  // Check status
  if (tokenRow.status === 'revoked') {
    return { valid: false, reason: 'revoked' };
  }
  if (tokenRow.status === 'closed') {
    return { valid: false, reason: 'closed' };
  }

  // Check expiry — lazily update status if expired
  if (tokenRow.status === 'active' && new Date(tokenRow.expires_at) < new Date()) {
    await admin
      .from('vendor_request_tokens')
      .update({ status: 'expired' })
      .eq('id', tokenRow.id);
    return { valid: false, reason: 'expired' };
  }

  if (tokenRow.status === 'expired') {
    return { valid: false, reason: 'expired' };
  }

  // Token is active — fetch request, vendor, contact, and messages
  const [requestResult, vendorResult, contactResult, roomResult, equipmentResult, messagesResult] = await Promise.all([
    admin
      .from('requests')
      .select('id, title, description, category, urgency, status, location_description, room_id, equipment_id, created_at, updated_at')
      .eq('id', tokenRow.request_id)
      .single(),
    admin
      .from('vendors')
      .select('id, name')
      .eq('id', tokenRow.vendor_id)
      .single(),
    tokenRow.vendor_contact_id
      ? admin
          .from('vendor_contacts')
          .select('id, name, email')
          .eq('id', tokenRow.vendor_contact_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    // Room name (if linked)
    admin
      .from('requests')
      .select('rooms(name)')
      .eq('id', tokenRow.request_id)
      .single(),
    // Equipment name (if linked)
    admin
      .from('requests')
      .select('equipment(name)')
      .eq('id', tokenRow.request_id)
      .single(),
    admin
      .from('vendor_messages')
      .select('id, sender_type, sender_name, body, vendor_status, created_at')
      .eq('token_id', tokenRow.id)
      .order('created_at', { ascending: true }),
  ]);

  if (requestResult.error || !requestResult.data) {
    console.error('[vendor-token] Request not found for token:', tokenRow.id);
    return { valid: false, reason: 'not_found' };
  }

  if (vendorResult.error || !vendorResult.data) {
    console.error('[vendor-token] Vendor not found for token:', tokenRow.id);
    return { valid: false, reason: 'not_found' };
  }

  const roomName = (roomResult.data as Record<string, unknown>)?.rooms
    ? ((roomResult.data as Record<string, unknown>).rooms as { name: string })?.name
    : null;
  const equipmentName = (equipmentResult.data as Record<string, unknown>)?.equipment
    ? ((equipmentResult.data as Record<string, unknown>).equipment as { name: string })?.name
    : null;

  return {
    valid: true,
    data: {
      token: tokenRow as TokenRecord,
      request: requestResult.data,
      vendor: vendorResult.data,
      vendor_contact: contactResult.data as { id: string; name: string; email: string | null } | null,
      room_name: roomName,
      equipment_name: equipmentName,
      messages: (messagesResult.data ?? []) as VendorMessage[],
    },
  };
}

// ── Token lifecycle management ─────────────────────────────────────────────

/**
 * Revoke all active tokens for a request (e.g., vendor reassigned or removed).
 */
export async function revokeTokensForRequest(requestId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('vendor_request_tokens')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('request_id', requestId)
    .eq('status', 'active');

  if (error) {
    console.error('[vendor-token] Failed to revoke tokens:', error.message);
  }
}

/**
 * Close all active tokens for a request (request reached terminal state).
 */
export async function closeTokensForRequest(requestId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('vendor_request_tokens')
    .update({ status: 'closed' })
    .eq('request_id', requestId)
    .eq('status', 'active');

  if (error) {
    console.error('[vendor-token] Failed to close tokens:', error.message);
  }
}

/**
 * Get the active token for a request (if any).
 * Used by staff messaging to include the vendor portal link.
 */
export async function getActiveTokenForRequest(requestId: string): Promise<TokenRecord | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('vendor_request_tokens')
    .select('*')
    .eq('request_id', requestId)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;
  return data as TokenRecord;
}
