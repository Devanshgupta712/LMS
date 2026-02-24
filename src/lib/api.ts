/**
 * API Helper — Centralized fetch wrapper that injects JWT auth token.
 * All frontend pages should use this instead of raw `fetch`.
 */

const API_BASE = '';  // Same origin — proxied via next.config.ts

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
}

export function setToken(token: string) {
    localStorage.setItem('auth_token', token);
}

export function clearToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
}

export function getStoredUser(): any | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: any) {
    localStorage.setItem('auth_user', JSON.stringify(user));
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export async function apiGet(path: string) {
    const res = await apiFetch(path);
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
}

export async function apiPost(path: string, body: any) {
    const res = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return res;
}

export async function apiPatch(path: string, body: any) {
    const res = await apiFetch(path, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
    return res.json();
}

export async function apiDelete(path: string) {
    const res = await apiFetch(path, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
    return res.json();
}
