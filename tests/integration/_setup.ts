import { config } from 'dotenv';
import { resolve } from 'path';

// Integration tests run against the dev Supabase project — load credentials
// the same way scripts/seed-test-users.ts does.
config({ path: resolve(__dirname, '..', '..', '.env.local') });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Integration tests require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local',
  );
}
