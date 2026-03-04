// ─── Server-Side Supabase Client ─────────────────────────────
// This file is ONLY imported by API routes (server-side).
// Env vars have NO 'NEXT_PUBLIC_' prefix, so they are NEVER
// bundled into client-side JavaScript.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const appSecret = process.env.SUPABASE_APP_SECRET || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[supabase-server] Missing SUPABASE_URL or SUPABASE_ANON_KEY in env');
}

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                'x-app-secret': appSecret,
            },
        },
    })
    : null;
