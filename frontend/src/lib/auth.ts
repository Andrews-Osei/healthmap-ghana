"use client";
/**
 * Auth client — wraps the FastAPI /auth endpoints.
 * Stores the JWT in localStorage with a clean read/write API.
 * Exposes a useAuth() hook for client components.
 */
import { useEffect, useState, useCallback } from "react";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";
const TOKEN_KEY = "healthmap.jwt";
const USER_KEY  = "healthmap.user";

export type User = { username: string; role: string };

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (typeof window === "undefined") return;
  if (t === null) localStorage.removeItem(TOKEN_KEY);
  else            localStorage.setItem(TOKEN_KEY, t);
}
export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) as User : null;
}
export function setUser(u: User | null) {
  if (typeof window === "undefined") return;
  if (u === null) localStorage.removeItem(USER_KEY);
  else            localStorage.setItem(USER_KEY, JSON.stringify(u));
}

export async function login(username: string, password: string) {
  const body = new URLSearchParams();
  body.set("username", username);
  body.set("password", password);
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(err.detail ?? `Login failed (HTTP ${r.status})`);
  }
  const { access_token } = await r.json();
  setToken(access_token);
  // Fetch user info
  const me = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (me.ok) setUser(await me.json());
  // Notify listeners
  window.dispatchEvent(new Event("healthmap-auth-change"));
}

export function logout() {
  setToken(null);
  setUser(null);
  window.dispatchEvent(new Event("healthmap-auth-change"));
}

export function useAuth() {
  const [user, setU] = useState<User | null>(null);
  const refresh = useCallback(() => setU(getUser()), []);
  useEffect(() => {
    refresh();
    window.addEventListener("healthmap-auth-change", refresh);
    return () => window.removeEventListener("healthmap-auth-change", refresh);
  }, [refresh]);
  return {
    user,
    isAuthenticated: !!user,
    logout,
  };
}
