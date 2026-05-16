"use client";
import { motion } from "framer-motion";
import { Stethoscope, Building2, MapPin, AlertTriangle } from "lucide-react";

const stats = [
  { icon: Stethoscope, label: "Facilities analysed", value: "2,484",
    sub: "Hospitals · Clinics · CHPS · Pharmacies", color: "text-cyan-300" },
  { icon: MapPin, label: "Districts scored",          value: "212",
    sub: "All 16 regions of Ghana",                    color: "text-med-400" },
  { icon: AlertTriangle, label: "Districts at risk",  value: "160",
    sub: "Critical + High Risk tiers",                 color: "text-orange-400" },
  { icon: Building2, label: "Inequality ratio",       value: "5.7×",
    sub: "Best-served vs worst-served region",         color: "text-pink-300" },
];

export default function StatsCards() {
  return (
    <section id="stats" className="max-w-7xl mx-auto px-5 sm:px-8 py-14">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.06 }}
            className="stat-card">
            <s.icon className={`w-7 h-7 mb-3 ${s.color}`}/>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight">
              {s.value}
            </div>
            <div className="mt-1 text-sm text-slate-300">{s.label}</div>
            <div className="mt-2 text-xs text-slate-500">{s.sub}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
