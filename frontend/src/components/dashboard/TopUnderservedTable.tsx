"use client";
import { useMemo } from "react";
import { useDashboard } from "@/store/dashboard";
import { tierColor, fmt } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export default function TopUnderservedTable({ n = 12 }: { n?: number }) {
  const { districts, select } = useDashboard();
  const rows = useMemo(() => {
    return [...districts]
      .sort((a, b) => b.CVI_0_100 - a.CVI_0_100)
      .slice(0, n);
  }, [districts, n]);

  return (
    <div className="glass p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="text-sm font-semibold">Top {n} most underserved districts</h4>
        <span className="text-[11px] text-slate-500">Click a row to inspect</span>
      </div>
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
                <td className="py-2 pr-2 text-slate-500 font-mono">
                  {d.rank}
                </td>
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
                  {d.CVI_0_100.toFixed(1)}
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
    </div>
  );
}
