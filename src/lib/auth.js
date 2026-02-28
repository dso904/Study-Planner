'use client';

import { atom } from 'jotai';

// ─── Hashed Credentials ──────────────────────────────────────
// Password is stored as SHA-256 hash — never in plaintext.
// To change credentials, update the username and generate a new hash:
//   node -e "console.log(require('crypto').createHash('sha256').update('YOUR_NEW_PASSWORD').digest('hex'))"
const CREDENTIALS = {
    username: 'admin',
    // SHA-256 hash of the password
    passwordHash: '40c0bb054bf07d5c614c8aa3c827ce5da20eaf4c04a338f344b9bf91505c6cce',
};

const SESSION_KEY = 'dp-auth-session';
const SESSION_TOKEN = 'dp-authenticated-v1';

// ─── Hash Function (Web Crypto API) ──────────────────────────
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ─── Credential Verification ─────────────────────────────────
export async function verifyCredentials(username, password) {
    if (username !== CREDENTIALS.username) return false;
    const hash = await hashPassword(password);
    return hash === CREDENTIALS.passwordHash;
}

// ─── Session Management ──────────────────────────────────────
export function isSessionValid() {
    if (typeof window === 'undefined') return false;
    try {
        return sessionStorage.getItem(SESSION_KEY) === SESSION_TOKEN;
    } catch {
        return false;
    }
}

export function createSession() {
    try {
        sessionStorage.setItem(SESSION_KEY, SESSION_TOKEN);
    } catch {
        // sessionStorage unavailable — session won't persist across refresh
    }
}

export function destroySession() {
    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch {
        // nothing to clear
    }
}

// ─── Auth Atom ───────────────────────────────────────────────
// Initialized to false; StoreHydrator or client-layout checks sessionStorage on mount.
export const isAuthenticatedAtom = atom(false);
