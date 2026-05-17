"use client";
import { useDashboard } from "@/store/dashboard";
import {
  Building2, MapPin, AlertOctagon, ShieldCheck, Clock, Database,
} from "lucide-react";

export default function KpiStrip() {
  const { districts, regions, facilities } = useDashboard();
  const critical = districts.filter(d => d.risk_tier === "Critical Risk").length;
  const high     = districts.filter(d => d.risk_tier === "High Risk").length;
  const low      = districts.filter(d => d.risk_tier === "Low Risk").length;
  const pending  = districts.filter(d => d.data_status === "no_data_yet").length;
  const scored   = districts.length - pending;
  const coverage = districts.length
    ? Math.round((scored / districts.length) * 1000) / 10
    : 0;

  const kpis = [
    { label: "Districts",  value: districts.length, sub: "Canonical",
      icon: MapPin, tone: "text-cyan-300" },
    { label: "Regions",    value: regions.length, sub: "Coverage",
      icon: ShieldCheck, tone: "text-med-400" },
    { label: "Facilities", value: facilities.length, sub: "OSM-mapped",
      icon: Building2, tone: "text-cyan-300" },
    { label: "Critical-risk", value: critical, sub: "districts",
      icon: AlertOctagon, tone: "text-red-400" },
    { label: "High-risk",  value: high, sub: "districts",
      icon: AlertOctagon, tone: "text-orange-400" },
    { label: pending > 0 ? "Awaiting data" : "Low-risk",
      value: pending > 0 ? pending : low,
      sub:   pending > 0 ? `coverage ${coverage}%` : "districts",
      icon:  pending > 0 ? Clock : ShieldCheck,
      tone:  pending > 0 ? "text-slate-300" : "text-med-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map(k => (
        <div key={k.label} className="glass p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <k.icon className={`w-3.5 h-3.5 ${k.tone}`}/>
            <span>{k.label}</span>
          </div>
          <div className="mt-1 text-2xl font-bold tracking-tight">{k.value}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}
