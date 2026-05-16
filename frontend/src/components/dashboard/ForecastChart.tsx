"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
         ResponsiveContainer, Legend } from "recharts";
import type { ForecastRow } from "@/lib/types";
import { TrendingUp } from "lucide-react";

export default function ForecastChart({ rows }: { rows: ForecastRow[] }) {
  if (!rows?.length) return null;
  const data = rows.map(r => ({
    year:        r.year,
    Required:    r.required_facilities,
    Current:     r.current_facilities,
    Shortfall:   r.projected_shortfall,
  }));

  return (
    <div className="glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-med-400"/>
        <h4 className="text-sm font-semibold">Demand forecast (WHO benchmark)</h4>
      </div>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -16, right: 8, top: 6, bottom: 0 }}>
            <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3"/>
            <XAxis dataKey="year" stroke="#93a8c1" fontSize={11}/>
            <YAxis stroke="#93a8c1" fontSize={11}/>
            <Tooltip contentStyle={{
              background: "#0b2237", border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 8, color: "#e6f1ff", fontSize: 12,
            }} cursor={{ stroke: "#22d3ee", strokeOpacity: .3 }}/>
            <Legend iconType="line"
                    wrapperStyle={{ fontSize: 11, color: "#cbd5e1" }}/>
            <Line type="monotone" dataKey="Required" stroke="#22d3ee"
                  strokeWidth={2} dot={{ r: 3 }}/>
            <Line type="monotone" dataKey="Current"  stroke="#10b981"
                  strokeWidth={2} dot={{ r: 3 }}/>
            <Line type="monotone" dataKey="Shortfall" stroke="#ef4444"
                  strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-slate-500 mt-2">
        Projection assumes 1.9% annual population growth. Required facilities
        per WHO primary-care benchmark (9 per 100k people).
      </p>
    </div>
  );
}
