"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import {
  Building2, Stethoscope, Pill, ChevronDown, ChevronRight, Loader2,
  MapPin, Search,
} from "lucide-react";
import type { Facility } from "@/lib/types";

const REGIONS = [
  "Greater Accra","Ashanti","Central","Eastern","Western","Volta","Northern",
  "Upper East","Upper West","Bono","Bono East","Ahafo","Western North",
  "Oti","Savannah","Northern East",
];

type Group = { key: string; label: string; icon: any;
               match: (a: string) => boolean };
const GROUPS: Group[] = [
  { key: "hospital", label: "Hospitals", icon: Building2,
    match: (a) => a === "hospital" },
  { key: "clinic", label: "Clinics & health centres", icon: Stethoscope,
    match: (a) => ["clinic", "health_post", "doctors"].includes(a) },
  { key: "pharmacy", label: "Pharmacies", icon: Pill,
    match: (a) => a === "pharmacy" },
];
const MAX_NAMES = 60;

export default function FacilityFinder() {
  const [region, setRegion] = useState("");
  const [city, setCity]     = useState("");
  const [facs, setFacs]     = useState<Facility[] | null>(null);
  const [err, setErr]       = useState<string | null>(null);
  const [open, setOpen]     = useState<string>("hospital");

  useEffect(() => {
    if (!region) { setFacs(null); setErr(null); return; }
    let aborted = false;
    setFacs(null); setErr(null);
    api.facilities({ region })
      .then(d => { if (!aborted) setFacs(d); })
      .catch(e => { if (!aborted) setErr(String(e)); });
    return () => { aborted = true; };
  }, [region]);

  const cityNorm = city.trim().toLowerCase();

  // Exact-city filter: keep only facilities whose district OR name contains
  // the typed city, so you drill into the city, not the whole region.
  const filtered = useMemo(() => {
    let list = facs ?? [];
    if (cityNorm.length >= 2) {
      list = list.filter(f =>
        (f.district || "").toLowerCase().includes(cityNorm) ||
        (f.name || "").toLowerCase().includes(cityNorm));
    }
    return list;
  }, [facs, cityNorm]);

  const grouped = useMemo(() => {
    const out: Record<string, Facility[]> =
      { hospital: [], clinic: [], pharmacy: [] };
    for (const f of filtered) {
      const a = (f.amenity || "").toLowerCase();
      const g = GROUPS.find(gr => gr.match(a));
      if (g) out[g.key].push(f);
    }
    return out;
  }, [filtered]);

  return (
    <div className="glass p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-4 h-4 text-cyan-300"/>
        <h3 className="font-semibold">Find facilities</h3>
        <span className="text-xs text-slate-500">
          hospitals · clinics · pharmacies
        </span>
      </div>

      {/* Controls: region + exact city */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-slate-400">
            Region
          </span>
          <select value={region} onChange={e => { setRegion(e.target.value); }}
                  className="mt-1 w-full px-3 py-2.5 rounded-lg bg-ink-900/80
                             border border-white/10 text-sm
                             focus:outline-none focus:border-cyan-400">
            <option value="">Select a region…</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-slate-400">
            City / town (optional)
          </span>
          <div className="relative mt-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3
                               top-1/2 -translate-y-1/2"/>
            <input value={city} onChange={e => setCity(e.target.value)}
                   disabled={!region}
                   placeholder={region ? "e.g. Kumasi, Obuasi…"
                                       : "select a region first"}
                   className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-ink-900/80
                              border border-white/10 text-sm
                              focus:outline-none focus:border-cyan-400
                              placeholder-slate-600 disabled:opacity-50"/>
          </div>
        </label>
      </div>

      {!region && (
        <div className="text-xs text-slate-500">
          Select a region to browse its hospitals, clinics and pharmacies.
          Add a city to narrow to that town.
        </div>
      )}

      {region && !facs && !err && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin"/> Loading facilities…
        </div>
      )}
      {err && (
        <div className="text-xs text-amber-300">
          Could not load facilities. Is the backend running?
        </div>
      )}

      {region && facs && (
        <>
          <div className="text-xs text-slate-500 mb-2">
            {cityNorm.length >= 2
              ? `${filtered.length} facilities in “${city.trim()}” (${region})`
              : `${filtered.length} facilities in ${region}`}
            {cityNorm.length >= 2 && filtered.length === 0 &&
              " — no match; check the spelling or try the region only."}
          </div>
          <div className="space-y-2">
            {GROUPS.map(g => {
              const list = grouped[g.key] ?? [];
              const Icon = g.icon;
              const isOpen = open === g.key;
              return (
                <div key={g.key} className="rounded-lg border border-white/10
                                            overflow-hidden">
                  <button onClick={() => setOpen(isOpen ? "" : g.key)}
                          className="w-full flex items-center justify-between gap-2
                                     p-3 bg-white/[0.03] hover:bg-white/[0.05]
                                     transition-colors">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Icon className="w-4 h-4 text-cyan-300"/> {g.label}
                      <span className="text-xs text-slate-500">({list.length})</span>
                    </span>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400"/>
                            : <ChevronRight className="w-4 h-4 text-slate-400"/>}
                  </button>
                  {isOpen && (
                    <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                      {list.length === 0 ? (
                        <div className="p-3 text-xs text-slate-500">
                          None found here.
                        </div>
                      ) : (
                        <>
                          {list.slice(0, MAX_NAMES).map((f, i) => (
                            <div key={f.id ?? i}
                                 className="px-3 py-2 flex items-center
                                            justify-between gap-2 text-sm">
                              <span className="truncate">
                                {f.name || "Unnamed facility"}
                              </span>
                              <span className="text-[11px] text-slate-500 shrink-0">
                                {f.district ?? ""}
                              </span>
                            </div>
                          ))}
                          {list.length > MAX_NAMES && (
                            <div className="px-3 py-2 text-[11px] text-slate-500">
                              + {list.length - MAX_NAMES} more
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
