'use client';

// ─── Client-Side API Helper ─────────────────────────────────
// All data calls go through /api/db/[table] so that Supabase
// credentials stay server-side. The session cookie is sent
// automatically via credentials: 'include'.

import { toast } from 'sonner';

const BASE = '/api/db';

/**
 * Fetch all records from a table.
 * For tasks, an optional daysBack param applies the 180-day cutoff.
 * @param {string} table
 * @param {object} [params] - Query params (e.g. { daysBack: 180 })
 * @returns {Promise<Array|null>}
 */
export async function apiFetch(table, params = {}) {
    try {
        const url = new URL(`${BASE}/${table}`, window.location.origin);
        for (const [key, val] of Object.entries(params)) {
            url.searchParams.set(key, String(val));
        }

        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.warn(`[API] GET ${table}:`, err.error || res.statusText);
            return null;
        }

        const { data } = await res.json();
        return Array.isArray(data) ? data : null;
    } catch (e) {
        console.warn(`[API] GET ${table} failed:`, e.message);
        return null;
    }
}

/**
 * Upsert a record into a table.
 * @param {string} table
 * @param {object} record
 * @returns {Promise<boolean>}
 */
export async function apiUpsert(table, record) {
    try {
        const res = await fetch(`${BASE}/${table}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(record),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.warn(`[API] POST ${table}:`, err.error || res.statusText);
            toast.error(`Failed to save to ${table}`, { description: err.error || res.statusText });
            return false;
        }

        return true;
    } catch (e) {
        console.warn(`[API] POST ${table} failed:`, e.message);
        toast.error(`Network error saving to ${table}`, { description: e.message });
        return false;
    }
}

/**
 * Delete a record from a table by ID.
 * @param {string} table
 * @param {string} id
 * @returns {Promise<boolean>}
 */
export async function apiDelete(table, id) {
    try {
        const res = await fetch(`${BASE}/${table}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.warn(`[API] DELETE ${table}:`, err.error || res.statusText);
            toast.error(`Failed to delete from ${table}`, { description: err.error || res.statusText });
            return false;
        }

        return true;
    } catch (e) {
        console.warn(`[API] DELETE ${table} failed:`, e.message);
        toast.error(`Network error deleting from ${table}`, { description: e.message });
        return false;
    }
}
