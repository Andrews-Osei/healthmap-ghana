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
