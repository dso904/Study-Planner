// ─── API Route Auth Middleware ────────────────────────────────
// Verifies that the incoming request has a valid session cookie.
// This mirrors the client-side isSessionValid() check from auth.js.

const SESSION_KEY = 'dp-auth-session';
const SESSION_TOKEN = 'dp-authenticated-v1';

/**
 * Parse cookies from a request's Cookie header.
 * @param {Request} request - The incoming Next.js request
 * @returns {Record<string, string>} parsed cookies
 */
function parseCookies(request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = {};
    for (const part of cookieHeader.split(';')) {
        const [key, ...rest] = part.trim().split('=');
        if (key) cookies[key.trim()] = rest.join('=').trim();
    }
    return cookies;
}

/**
 * Verify that the request has a valid auth session.
 * @param {Request} request
 * @returns {{ ok: boolean, response?: Response }}
 */
export function verifyApiAuth(request) {
    const cookies = parseCookies(request);
    const sessionValue = cookies[SESSION_KEY];

    if (sessionValue !== SESSION_TOKEN) {
        return {
            ok: false,
            response: Response.json(
                { error: 'Unauthorized — please log in first' },
                { status: 401 }
            ),
        };
    }

    return { ok: true };
}
