/**
 * Popote Estate — API client
 * Drop this file into: popote-listings/src/services/api.js
 *
 * Set REACT_APP_API_URL in your .env:
 *   REACT_APP_API_URL=http://localhost:8000/api
 */

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'popote_admin_token';

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function req(path, opts = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const isFormData = opts.body instanceof FormData;

  const res = await fetch(`${BASE}${path}`, {
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.detail || 'Something went wrong';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: async (username, password) => {
    const data = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    return data;
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
  },

  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
};

// ─── Listings ─────────────────────────────────────────────────────────────────
export const listingsAPI = {
  /** Get paginated public listings with optional filters */
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    );
    return req(`/listings?${qs}`);
  },

  /** Get single listing by ID (increments view count) */
  getById: (id) => req(`/listings/${id}`),

  /** Admin: get ALL listings including inactive */
  adminGetAll: (params = {}) => {
    const qs = new URLSearchParams(params);
    return req(`/listings/admin/all?${qs}`);
  },

  /** Admin: create a new listing (no images yet) */
  create: (data) => req('/listings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** Admin: upload images for a listing */
  uploadImages: async (listingId, files) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    return req(`/listings/${listingId}/images`, {
      method: 'POST',
      body: form,
    });
  },

  /** Admin: delete a single image from a listing */
  deleteImage: (listingId, imageId) => req(`/listings/${listingId}/images/${imageId}`, {
    method: 'DELETE',
  }),

  /** Admin: update listing fields (partial) */
  update: (id, data) => req(`/listings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  /** Admin: delete a listing and all its Cloudinary images */
  delete: (id) => req(`/listings/${id}`, { method: 'DELETE' }),
};

// ─── Enquiries ────────────────────────────────────────────────────────────────
export const enquiriesAPI = {
  /** Public: submit an enquiry from a listing page */
  submit: (data) => req('/enquiries', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** Admin: get all enquiries */
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params);
    return req(`/enquiries?${qs}`);
  },

  /** Admin: update enquiry status (New / Read / Replied) */
  updateStatus: (id, status) => req(`/enquiries/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  /** Admin: delete enquiry */
  delete: (id) => req(`/enquiries/${id}`, { method: 'DELETE' }),
};

// ─── Listing Submissions ("List With Us") ─────────────────────────────────────
export const submissionsAPI = {
  /** Public: submit a "List With Us" form */
  submit: (data) => req('/submissions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** Admin: get all submissions */
  getAll: (reviewed) => {
    const qs = reviewed !== undefined ? `?reviewed=${reviewed}` : '';
    return req(`/submissions${qs}`);
  },

  /** Admin: mark a submission as reviewed */
  markReviewed: (id) => req(`/submissions/${id}/reviewed`, { method: 'PATCH' }),

  /** Admin: delete submission */
  delete: (id) => req(`/submissions/${id}`, { method: 'DELETE' }),
};

// ─── Stats ────────────────────────────────────────────────────────────────────
export const statsAPI = {
  /** Admin: get dashboard metrics */
  get: () => req('/stats'),
};
