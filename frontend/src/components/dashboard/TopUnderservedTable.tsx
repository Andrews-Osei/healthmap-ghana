"use client";
import { useMemo, useState } from "react";
import { useDashboard } from "@/store/dashboard";
import { tierColor, fmt } from "@/lib/utils";
import { ChevronRight, AlertCircle } from "lucide-react";

export default function TopUnderservedTable({ n = 12 }: { n?: number }) {
  const { districts, select } = useDashboard();
  const [view, setView] = useState<"scored" | "pending">("scored");

  const scored = useMemo(
    () => districts.filter(d => d.data_status !== "no_data_yet"),
    [districts]);
  const pending = useMemo(
    () => districts.filter(d => d.data_status === "no_data_yet"),
    [districts]);

  const rows = view === "scored"
    ? [...scored].sort((a, b) =>
        (b.CVI_0_100 ?? 0) - (a.CVI_0_100 ?? 0)).slice(0, n)
    : [...pending].sort((a, b) =>
        a.district.localeCompare(b.district)).slice(0, n);

  return (
    <div className="glass p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold inline-block mr-3">
            {view === "scored"
              ? `Top ${n} most underserved districts`
              : `Districts awaiting OSM data (${pending.length} total)`}
          </h4>
        </div>
        <div className="flex gap-1 text-[11px]">
          <button onClick={() => setView("scored")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    view === "scored"
                      ? "bg-cyan-400/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-cyan-300"}`}>
            Scored ({scored.length})
          </button>
          <button onClick={() => setView("pending")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    view === "pending"
                      ? "bg-slate-400/20 text-slate-200 border border-slate-500/40"
                      : "text-slate-400 hover:text-slate-200"}`}>
            No data yet ({pending.length})
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-6 text-center">
          No districts in this view.
        </p>
      ) : view === "scored" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] text-slate-400 uppercase tracking-wide">
              <tr className="border-b border-white/10">
                <th className="text-left py-2 pr-2">#</th>
                <th className="text-left pr-2">District</th>
                <th className="text-left pr-2">Region</th>
                <th className="text-left pr-2">Tier</th>
                <th className="text-right pr-2">CVI</th>
                <th className="text-right pr-2">Per 100k</th>
                <th className="text-right">Hosp</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(d => (
                <tr key={d.district_id}
                    onClick={() => select(d)}
                    className="border-b border-white/5 cursor-pointer
                               hover:bg-white/[0.04] transition-colors">
                  <td className="py-2 pr-2 text-slate-500 font-mono">{d.rank}</td>
                  <td className="pr-2 font-semibold">{d.district}</td>
                  <td className="pr-2 text-slate-400">{d.region}</td>
                  <td className="pr-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px]"
                          style={{
                            color: tierColor[d.risk_tier],
                            background: `${tierColor[d.risk_tier]}1f`,
                            border: `1px solid ${tierColor[d.risk_tier]}55`,
                          }}>
                      {d.risk_tier.replace(" Risk", "")}
                    </span>
                  </td>
                  <td className="pr-2 text-right font-semibold">
                    {d.CVI_0_100?.toFixed(1)}
                  </td>
                  <td className="pr-2 text-right text-slate-300">
                    {fmt.float1(d.facilities_per_100k)}
                  </td>
                  <td className="text-right text-slate-300">
                    {d.hospitals_clinics}
                  </td>
                  <td className="pl-1 text-slate-600">
                    <ChevronRight className="w-4 h-4 inline-block"/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400 mb-3 flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-amber-400 shrink-0"/>
            These districts have no OSM-mapped health facilities yet. They
            will be auto-scored on the next pipeline run that picks up new
            OSM data. Likely worse-served than any currently-scored district.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {rows.map(d => (
              <div key={d.district_id}
                   onClick={() => select(d)}
                   className="p-2.5 rounded-lg bg-white/[0.03] border border-white/10
                              cursor-pointer hover:border-cyan-500/40 transition-colors">
                <div className="text-sm font-semibold">{d.district}</div>
                <div className="text-[11px] text-slate-500">{d.region}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
