"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
         ResponsiveContainer, Cell } from "recharts";
import { useDashboard } from "@/store/dashboard";
import { cviColor } from "@/lib/utils";

export default function RegionBreakdown() {
  const regions = useDashboard(s => s.regions);
  const data = [...regions]
    .sort((a, b) => b.mean_CVI - a.mean_CVI)
    .map(r => ({ name: r.region, value: r.mean_CVI }));

  return (
    <div className="glass p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="text-sm font-semibold">Regional vulnerability ranking</h4>
        <span className="text-[11px] text-slate-500">Mean CVI · 0-100</span>
      </div>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical"
                    margin={{ left: 80, right: 16, top: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1f2a44" strokeDasharray="3 3"/>
            <XAxis type="number" stroke="#93a8c1" fontSize={11} domain={[0, 100]}/>
            <YAxis type="category" dataKey="name" stroke="#93a8c1"
                   fontSize={11} width={80}/>
            <Tooltip contentStyle={{
              background: "#0b2237", border: "1px solid rgba(255,255,255,.1)",
              borderRadius: 8, color: "#e6f1ff", fontSize: 12,
            }}/>
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={cviColor(d.value)}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
