"use client";
import { useMemo } from "react";
import { useDashboard } from "@/store/dashboard";
import { Filter, RotateCcw } from "lucide-react";

const AMENITIES = ["All", "hospital", "clinic", "pharmacy",
                   "health_post", "doctors", "dentist"];
const RISK_TIERS = ["All", "Critical Risk", "High Risk",
                    "Moderate Risk", "Low Risk"];
const URBAN_RURAL = ["All", "Urban", "Rural"] as const;

export default function FilterPanel() {
  const { regions, filters, setFilter, reset } = useDashboard();
  const regionList = useMemo(
    () => ["All", ...regions.map(r => r.region).sort()], [regions]);

  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-300"/>
          <span className="text-sm font-semibold">Filters</span>
        </div>
        <button onClick={reset}
                className="text-xs text-slate-400 hover:text-cyan-300
                           flex items-center gap-1">
          <RotateCcw className="w-3 h-3"/> Reset
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <Select label="Region" value={filters.region}
                onChange={v => setFilter("region", v)} options={regionList}/>
        <Select label="Risk tier" value={filters.riskTier}
                onChange={v => setFilter("riskTier", v)} options={RISK_TIERS}/>
        <Select label="Facility type" value={filters.amenity}
                onChange={v => setFilter("amenity", v)} options={AMENITIES}/>
        <Select label="Urban / rural" value={filters.urbanRural}
                onChange={v => setFilter("urbanRural", v as any)}
                options={[...URBAN_RURAL]}/>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <select value={value} onChange={e => onChange(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg
                         bg-ink-900/80 border border-white/10
                         text-white text-sm hover:border-cyan-500/50
                         focus:outline-none focus:border-cyan-400">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
