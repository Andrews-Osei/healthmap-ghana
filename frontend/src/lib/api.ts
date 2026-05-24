import type {
  District, DistrictDetail, RegionSummary, Facility, ForecastRow,
  Recommendation, Manifest,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

async function get<T>(path: string, params?: Record<string, string | number>) {
  const url = new URL(BASE + path);
  Object.entries(params ?? {}).forEach(([k, v]) =>
    url.searchParams.set(k, String(v)));
  const r = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!r.ok) throw new Error(`API ${path} -> ${r.status}`);
  return (await r.json()) as T;
}

export const api = {
  manifest:        ()                              => get<Manifest>("/manifest"),
  districts:       (q?: { region?: string; risk_tier?: string }) =>
                    get<District[]>("/districts", q),
  district:        (id: string)                    => get<DistrictDetail>(`/districts/${id}`),
  regions:         ()                              => get<RegionSummary[]>("/regions"),
  facilities:      (q?: { region?: string; amenity?: string }) =>
                    get<Facility[]>("/facilities", q),
  topVulnerable:   (n = 20)                        => get<District[]>("/vulnerability/top", { n }),
  distribution:    ()                              => get<{
                                                       score_histogram: Record<string, number>;
                                                       tier_counts: Record<string, number>;
                                                     }>("/vulnerability/distribution"),
  recommendations: (id: string)                    => get<Recommendation[]>(`/recommendations/${id}`),
  forecast:        (id: string)                    => get<ForecastRow[]>(`/forecast/${id}`),
};


// ───────────── Assistant ─────────────
export type AssistantMode = "patient" | "decision_maker";

export interface AssistantRequest {
  mode: AssistantMode;
  query?: string;
  user_lat?: number;
  user_lon?: number;
  user_region?: string;
  filter_region?: string;
  place?: string;
}

export async function askAssistant(req: AssistantRequest) {
  const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";
  const r = await fetch(`${BASE}/assistant/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!r.ok) throw new Error(`Assistant API ${r.status}`);
  return r.json() as Promise<any>;
}


// ───────────── Admin: user management (admin JWT required) ─────────────
const _TOKEN_KEY = "healthmap.jwt";
function _authHeaders(): Record<string, string> {
  const t = typeof window !== "undefined"
    ? localStorage.getItem(_TOKEN_KEY) : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}
async function _errText(r: Response): Promise<string> {
  try { const j = await r.json(); return j.detail ?? `HTTP ${r.status}`; }
  catch { return `HTTP ${r.status}`; }
}

export interface AdminUser {
  username: string; role: string; active: boolean;
  created_at?: string; created_by?: string;
}

const ADMIN_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api/v1";

export const adminApi = {
  listUsers: async (): Promise<AdminUser[]> => {
    const r = await fetch(`${ADMIN_BASE}/auth/users`, { headers: _authHeaders() });
    if (!r.ok) throw new Error(await _errText(r));
    return r.json();
  },
  createUser: async (b: { username: string; password: string; role: string }) => {
    const r = await fetch(`${ADMIN_BASE}/auth/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ..._authHeaders() },
      body: JSON.stringify(b),
    });
    if (!r.ok) throw new Error(await _errText(r));
    return r.json();
  },
  updateUser: async (username: string,
                     b: { role?: string; active?: boolean; password?: string }) => {
    const r = await fetch(`${ADMIN_BASE}/auth/users/${encodeURIComponent(username)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ..._authHeaders() },
      body: JSON.stringify(b),
    });
    if (!r.ok) throw new Error(await _errText(r));
    return r.json();
  },
  deleteUser: async (username: string) => {
    const r = await fetch(`${ADMIN_BASE}/auth/users/${encodeURIComponent(username)}`, {
      method: "DELETE", headers: _authHeaders(),
    });
    if (!r.ok) throw new Error(await _errText(r));
    return r.json();
  },
};
