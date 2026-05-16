"use client";
import { useDashboard } from "@/store/dashboard";
import { Building2, MapPin, AlertOctagon, ShieldCheck } from "lucide-react";

export default function KpiStrip() {
  const { districts, regions, facilities } = useDashboard();
  const critical = districts.filter(d => d.risk_tier === "Critical Risk").length;
  const high     = districts.filter(d => d.risk_tier === "High Risk").length;
  const low      = districts.filter(d => d.risk_tier === "Low Risk").length;

  const kpis = [
    { label: "Districts",  value: districts.length,  icon: MapPin,
      tone: "text-cyan-300" },
    { label: "Regions",    value: regions.length,    icon: ShieldCheck,
      tone: "text-med-400" },
    { label: "Facilities", value: facilities.length, icon: Building2,
      tone: "text-cyan-300" },
    { label: "Critical-risk districts", value: critical,
      icon: AlertOctagon, tone: "text-red-400" },
    { label: "High-risk",  value: high, icon: AlertOctagon, tone: "text-orange-400" },
    { label: "Low-risk",   value: low,  icon: ShieldCheck,  tone: "text-med-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map(k => (
        <div key={k.label} className="glass p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <k.icon className={`w-3.5 h-3.5 ${k.tone}`}/>
            <span>{k.label}</span>
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight">
            {k.value}
          </div>
        </div>
      ))}
    </div>
  );
}
