"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DashboardPreview() {
  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
      <div className="glass-strong p-6 sm:p-10 overflow-hidden relative">
        <div className="grid lg:grid-cols-12 gap-10 items-center">

          <div className="lg:col-span-5">
            <span className="pill">Live dashboard</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight">
              See <span className="gradient-text">every district</span>,
              its risk score, and the AI's recommended interventions.
            </h2>
            <p className="mt-4 text-slate-300">
              Click any district to drill into population, facility supply,
              and the prioritised list of policy actions. Filter by region,
              facility type, or risk tier — the map updates instantly.
            </p>
            <div className="mt-6">
              <Link href="/dashboard" className="btn-primary">
                Launch dashboard <ArrowRight className="w-4 h-4"/>
              </Link>
            </div>
          </div>

          {/* Stylised mock screenshot */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass p-3 h-[420px] grid grid-cols-12 gap-3">

              {/* Map panel */}
              <div className="col-span-8 rounded-xl bg-ink-900/80 overflow-hidden
                              relative border border-white/10">
                <div className="absolute inset-0 opacity-90">
                  <svg viewBox="0 0 320 320" className="w-full h-full">
                    <defs>
                      <radialGradient id="m1" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity=".4"/>
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0"/>
                      </radialGradient>
                    </defs>
                    {Array.from({ length: 60 }).map((_, i) => {
                      const x = 30 + (i * 47) % 260;
                      const y = 30 + ((i * 71) % 260);
                      const v = (i * 13) % 100;
                      const c = v >= 75 ? "#ef4444"
                              : v >= 50 ? "#f59e0b"
                              : v >= 25 ? "#eab308"
                              :           "#10b981";
                      return <circle key={i} cx={x} cy={y} r="4" fill={c} opacity=".8"/>;
                    })}
                    <circle cx="160" cy="160" r="120" fill="url(#m1)"/>
                  </svg>
                </div>
                <div className="absolute top-3 left-3 pill">CVI heatmap</div>
                <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                  Greater Accra · 27 districts
                </div>
              </div>

              {/* Sidebar mock */}
              <div className="col-span-4 space-y-3 overflow-hidden">
                <div className="glass p-3">
                  <div className="text-xs text-slate-400">Selected district</div>
                  <div className="font-semibold mt-1">Asikuma-Odoben-Brakwa</div>
                  <div className="text-xs text-slate-500">Central Region</div>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="text-3xl font-bold gradient-text">100</div>
                    <span className="text-xs px-2 py-1 rounded-md
                                     bg-red-500/15 text-red-400 border
                                     border-red-500/30">Critical Risk</span>
                  </div>
                </div>
                <div className="glass p-3">
                  <div className="text-xs text-slate-400 mb-2">AI recommendations</div>
                  {["Build PHC centre", "Mobile clinics", "Personnel +"].map(t => (
                    <div key={t} className="text-xs py-1.5 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-300"/>{t}
                    </div>
                  ))}
                </div>
                <div className="glass p-3">
                  <div className="text-xs text-slate-400">Facilities</div>
                  <div className="mt-1 flex items-end gap-1 h-12">
                    {[6,12,8,4,16,10,7].map((h,i) => (
                      <div key={i}
                           style={{ height: `${h*4}px` }}
                           className="w-3 rounded-sm bg-gradient-to-t
                                      from-cyan-500 to-med-400 opacity-80"/>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
