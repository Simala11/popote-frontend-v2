// src/api.js
const BASE_URL = process.env.REACT_APP_API_URL || 'https://popote-backend-7lqq.onrender.com';
const TOKEN_KEY = 'popote_admin_token';

async function request(method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        let message = `Error ${res.status}`;
        try { const err = await res.json(); message = err.detail || err.message || message; } catch (_) { }
        throw new Error(message);
    }
    if (res.status === 204) return null;
    return res.json();
}

/* ── Auth ───────────────────────────────────────────────────────────── */
export const authAPI = {
    login: (password) =>
        request('POST', '/api/auth/login', { password }),

    changePassword: (currentPassword, newPassword, token) =>
        request('POST', '/api/auth/change-password',
            { current_password: currentPassword, new_password: newPassword },
            token
        ),
};

/* ── Listings ───────────────────────────────────────────────────────── */
export const listingsAPI = {
    getAll: (params = {}) => {
        const qs = new URLSearchParams(
            Object.fromEntries(Object.entries(params).filter(([, v]) => v))
        ).toString();
        return request('GET', `/api/listings${qs ? `?${qs}` : ''}`);
    },

    getById: (id) => request('GET', `/api/listings/${id}`),

    create: async ({ title, region, category, price, description, youtube_url,
        beds, baths, sqm, location, files }) => {

        const token = localStorage.getItem(TOKEN_KEY);
        const authHeader = token ? { 'Authorization': `Bearer ${token}` } : {};

        // ── Step 1: Create listing metadata (JSON) ──────────────────
        const metaRes = await fetch(`${BASE_URL}/api/listings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeader },
            body: JSON.stringify({
                title, region, category,
                price: parseFloat(price),
                description: description || '',
                youtube_url: youtube_url || '',
                beds: beds ? parseInt(beds) : null,
                baths: baths ? parseInt(baths) : null,
                sqm: sqm ? parseFloat(sqm) : null,
                location: location || '',
            }),
        });
        if (!metaRes.ok) {
            let message = `Error ${metaRes.status}`;
            try { const err = await metaRes.json(); message = err.detail || message; } catch (_) { }
            throw new Error(message);
        }
        const listing = await metaRes.json();

        // ── Step 2: Upload images to /listings/{id}/images ──────────
        if (!files || files.length === 0) throw new Error('At least one image is required.');

        const fd = new FormData();
        files.forEach(f => fd.append('files', f));

        const imgRes = await fetch(`${BASE_URL}/api/listings/${listing.id}/images`, {
            method: 'POST',
            headers: authHeader,   // no Content-Type — browser sets multipart boundary
            body: fd,
        });
        if (!imgRes.ok) {
            let message = `Image upload failed: ${imgRes.status}`;
            try { const err = await imgRes.json(); message = err.detail || message; } catch (_) { }
            throw new Error(message);
        }
        return imgRes.json(); // returns full listing with images
    },

    update: async (id, fields) => {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch(`${BASE_URL}/api/listings/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(fields),
        });
        if (!res.ok) {
            let message = `Error ${res.status}`;
            try { const err = await res.json(); message = err.detail || message; } catch (_) { }
            throw new Error(message);
        }
        return res.json();
    },

    delete: async (id) => {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch(`${BASE_URL}/api/listings/${id}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
        if (res.status === 204) return null;
        return res.json();
    },
};

/* ── Enquiries ──────────────────────────────────────────────────────── */
export const enquiriesAPI = {
    create: (data) =>
        request('POST', '/api/enquiries', data),

    getAll: (token) =>
        request('GET', '/api/enquiries', null, token),

    updateStatus: (id, status, token) =>
        request('PATCH', `/api/enquiries/${id}`, { status }, token),
};