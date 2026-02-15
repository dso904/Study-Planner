import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const appSecret = process.env.NEXT_PUBLIC_SUPABASE_APP_SECRET || '';

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: appSecret ? { 'x-app-secret': appSecret } : {},
        },
    })
    : null;

export const isSupabaseConfigured = () => supabase !== null;
