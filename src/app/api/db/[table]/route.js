// ─── Dynamic API Route: /api/db/[table] ──────────────────────
// Handles GET (fetch), POST (upsert), DELETE for all tables.
// All Supabase calls happen server-side — credentials never reach the client.

import { supabase } from '@/lib/supabase-server';
import { verifyApiAuth } from '@/lib/api-auth';
import dayjs from 'dayjs';

const ALLOWED_TABLES = new Set(['tasks', 'chapters', 'notes', 'books']);

function errorResponse(message, status = 400) {
    return Response.json({ error: message }, { status });
}

// ─── GET /api/db/[table] ─────────────────────────────────────
export async function GET(request, { params }) {
    // Auth check
    const auth = verifyApiAuth(request);
    if (!auth.ok) return auth.response;

    const { table } = await params;
    if (!ALLOWED_TABLES.has(table)) return errorResponse('Invalid table', 404);
    if (!supabase) return errorResponse('Supabase not configured', 503);

    try {
        // Tasks get special treatment: 180-day window + backlogs
        if (table === 'tasks') {
            const url = new URL(request.url);
            const daysBack = parseInt(url.searchParams.get('daysBack') || '180', 10);
            const cutoff = dayjs().subtract(daysBack, 'day').format('YYYY-MM-DD');

            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .or(`date.gte.${cutoff},is_backlog.eq.true`)
                .order('created_at', { ascending: true });

            if (error) return errorResponse(error.message, 500);
            return Response.json({ data: data || [] });
        }

        // Generic fetch for other tables
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: true });

        if (error) return errorResponse(error.message, 500);
        return Response.json({ data: data || [] });
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}

// ─── POST /api/db/[table] (upsert) ──────────────────────────
export async function POST(request, { params }) {
    const auth = verifyApiAuth(request);
    if (!auth.ok) return auth.response;

    const { table } = await params;
    if (!ALLOWED_TABLES.has(table)) return errorResponse('Invalid table', 404);
    if (!supabase) return errorResponse('Supabase not configured', 503);

    try {
        const body = await request.json();
        // H3-FIX: Reject arrays, non-objects, and payloads missing required 'id'
        if (!body || typeof body !== 'object' || Array.isArray(body)) return errorResponse('Invalid request body');
        if (!body.id || typeof body.id !== 'string') return errorResponse('Missing or invalid id field');

        const { error } = await supabase.from(table).upsert(body, { onConflict: 'id' });
        if (error) return errorResponse(error.message, 500);

        return Response.json({ ok: true });
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}

// ─── DELETE /api/db/[table] ──────────────────────────────────
export async function DELETE(request, { params }) {
    const auth = verifyApiAuth(request);
    if (!auth.ok) return auth.response;

    const { table } = await params;
    if (!ALLOWED_TABLES.has(table)) return errorResponse('Invalid table', 404);
    if (!supabase) return errorResponse('Supabase not configured', 503);

    try {
        const { id } = await request.json();
        if (!id) return errorResponse('Missing id');

        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) return errorResponse(error.message, 500);

        return Response.json({ ok: true });
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}
