"use client";
import { TrendingUp, AlertOctagon, Building2, BarChart3,
         Target, ChevronRight } from "lucide-react";
import { tierColor } from "@/lib/utils";

const PRIORITY_STYLE: Record<string, string> = {
  P0: "bg-red-500/15 text-red-300 border-red-500/40",
  P1: "bg-orange-500/15 text-orange-300 border-orange-500/40",
  P2: "bg-yellow-500/15 text-yellow-300 border-yellow-500/40",
  P3: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
};

export default function DecisionMakerView({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Scope */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <BarChart3 className="w-3.5 h-3.5 text-cyan-300"/>
        Scope: <b className="text-cyan-300">{data.scope}</b>
      </div>

      {/* Key insights */}
      <Section icon={TrendingUp} title="Key system insights">
        <ul className="space-y-1.5 text-sm text-slate-200">
          {data.key_insights.map((s: string, i: number) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-cyan-300 mt-1">·</span> {s}
            </li>
          ))}
        </ul>
      </Section>

      {/* Top underserved */}
      <Section icon={AlertOctagon} title="High-risk / underserved districts">
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-sm">
            <thead className="text-[11px] text-slate-400 uppercase tracking-wide">
              <tr className="border-b border-white/10">
                <th className="text-left py-2 pr-2">#</th>
                <th className="text-left pr-2">District</th>
                <th className="text-left pr-2">Region</th>
                <th className="text-left pr-2">Tier</th>
                <th className="text-right pr-2">CVI</th>
                <th className="text-right">Per 100k</th>
              </tr>
            </thead>
            <tbody>
              {data.top_underserved.map((d: any) => (
                <tr key={d.district}
                    className="border-b border-white/5 hover:bg-white/[0.04]">
                  <td className="py-2 pr-2 text-slate-500 font-mono">{d.rank}</td>
                  <td className="pr-2 font-semibold">{d.district}</td>
                  <td className="pr-2 text-slate-400">{d.region}</td>
                  <td className="pr-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px]"
                          style={{
                            color: tierColor[d.tier],
                            background: `${tierColor[d.tier]}1f`,
                            border: `1px solid ${tierColor[d.tier]}55`,
                          }}>
                      {d.tier.replace(" Risk", "")}
                    </span>
                  </td>
                  <td className="pr-2 text-right font-semibold">
                    {d.CVI?.toFixed(1)}
                  </td>
                  <td className="text-right text-slate-300">
                    {d.facilities_per_100k.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Resource gaps */}
      <Section icon={Building2} title="Resource & staffing gaps">
        <ul className="space-y-1.5 text-sm text-slate-200">
          {data.resource_gaps.map((s: string, i: number) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-orange-300 mt-1">·</span> {s}
            </li>
          ))}
        </ul>
      </Section>

      {/* Coverage */}
      <Section icon={BarChart3} title="Coverage analysis">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Total districts" value={data.coverage_analysis.total_districts}/>
          <Stat label="Scored"          value={data.coverage_analysis.scored}/>
          <Stat label="Awaiting data"   value={data.coverage_analysis.awaiting_data}/>
        </div>
        <div className="mt-3 text-xs text-slate-400">
          Coverage: <b className="text-cyan-300">
            {data.coverage_analysis.coverage_pct}%
          </b>
        </div>
      </Section>

      {/* Policy recommendations */}
      <Section icon={Target} title="Policy & operational recommendations">
        <ol className="space-y-3">
          {data.policy_recommendations.map((r: any) => (
            <li key={r.priority + r.title}
                className="p-3 rounded-lg bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-md text-[10px]
                                  font-mono font-bold border ${PRIORITY_STYLE[r.priority]}`}>
                  {r.priority}
                </span>
                <span className="font-semibold text-sm">{r.title}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {r.rationale}
              </p>
              {r.targets?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {r.targets.map((t: string) => (
                    <span key={t} className="text-[10px] px-2 py-0.5
                                              rounded bg-cyan-500/10
                                              border border-cyan-500/30
                                              text-cyan-200">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      </Section>

      <p className="text-[11px] text-slate-500 italic px-1">
        {data.disclaimer}
      </p>
    </div>
  );
}

function Section({ icon: Icon, title, children }: any) {
  return (
    <div className="glass p-4">
      <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-3
                     flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-cyan-300"/> {title}
      </h4>
      {children}
    </div>
  );
}
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}
