import type { Metadata } from 'next';
import { validateVendorToken } from '@/lib/vendor-tokens';
import { VendorResponseClient } from './VendorResponseClient';
import { color, font, space } from '@/lib/tokens';

export const metadata: Metadata = {
  title: 'Vendor Portal — Renew PMS',
  robots: 'noindex, nofollow',
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function VendorPortalPage({ params }: PageProps) {
  const { token } = await params;
  const result = await validateVendorToken(token);

  if (!result.valid) {
    return <VendorErrorState reason={result.reason} />;
  }

  const { data } = result;

  return (
    <VendorResponseClient
      token={token}
      request={data.request}
      vendor={data.vendor}
      vendorContact={data.vendor_contact}
      roomName={data.room_name}
      equipmentName={data.equipment_name}
      messages={data.messages}
      expiresAt={data.token.expires_at}
    />
  );
}

function VendorErrorState({ reason }: { reason: string }) {
  const messages: Record<string, { title: string; description: string }> = {
    expired: {
      title: 'Link Expired',
      description: 'This vendor portal link has expired. Please contact the practice for a new link.',
    },
    revoked: {
      title: 'Link No Longer Valid',
      description: 'This vendor portal link has been revoked. The request may have been reassigned.',
    },
    closed: {
      title: 'Request Resolved',
      description: 'This request has been resolved or closed. No further action is needed.',
    },
    not_found: {
      title: 'Link Not Found',
      description: 'This vendor portal link is not valid. Please check the URL or contact the practice.',
    },
  };

  const msg = messages[reason] ?? messages.not_found;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: space.xl,
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '440px',
      }}>
        <h1 style={{
          fontSize: font.size.heading.small,
          fontWeight: 600,
          marginBottom: space.sm,
          fontFamily: font.family.heading,
        }}>
          {msg.title}
        </h1>
        <p style={{
          fontSize: font.size.body.md,
          color: color.text.secondary,
          fontFamily: font.family.body,
          lineHeight: 1.5,
        }}>
          {msg.description}
        </p>
      </div>
    </div>
  );
}
