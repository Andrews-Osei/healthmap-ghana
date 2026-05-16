"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/store/dashboard";
import { api } from "@/lib/api";
import type { Recommendation, ForecastRow } from "@/lib/types";
import { fmt, tierColor } from "@/lib/utils";
import {
  Building2, Stethoscope, Pill, Route, Users, MapPin, Sparkles,
} from "lucide-react";
import RecommendationsCard from "./RecommendationsCard";
import ForecastChart      from "./ForecastChart";
import VulnerabilityGauge from "./VulnerabilityGauge";

export default function DistrictSidebar() {
  const sel = useDashboard(s => s.selected);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [fcst, setFcst] = useState<ForecastRow[]>([]);

  useEffect(() => {
    if (!sel) return;
    api.recommendations(sel.district_id).then(setRecs).catch(() => setRecs([]));
    api.forecast(sel.district_id).then(setFcst).catch(() => setFcst([]));
  }, [sel]);

  if (!sel) {
    return (
      <div className="glass h-full p-6 flex flex-col items-center
                      justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 grid
                        place-items-center mb-4 border border-cyan-500/30">
          <MapPin className="w-7 h-7 text-cyan-300"/>
        </div>
        <h3 className="text-lg font-semibold">Select a district</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-xs">
          Click any district on the map to see its score, statistics
          and AI-generated recommendations.
        </p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={sel.district_id}
        initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-3 overflow-y-auto pr-1 h-full">

        {/* Header */}
        <div className="glass p-5">
          <div className="text-xs text-slate-400">{sel.region} Region</div>
          <h2 className="text-2xl font-bold mt-1">{sel.district}</h2>

          <div className="mt-4 flex items-center gap-4">
            <VulnerabilityGauge value={sel.CVI_0_100}/>
            <div>
              <span className="px-2 py-1 rounded-md text-xs font-semibold"
                    style={{
                      background: `${tierColor[sel.risk_tier]}25`,
                      color:      tierColor[sel.risk_tier],
                      border: `1px solid ${tierColor[sel.risk_tier]}55`,
                    }}>
                {sel.risk_tier}
              </span>
              <div className="text-xs text-slate-400 mt-2">
                Rank #{sel.rank} of 212 districts
              </div>
            </div>
          </div>
        </div>

        {/* Key statistics */}
        <div className="glass p-4">
          <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-3">
            District statistics
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat icon={Users}       label="Population (proxy)"
                  value={fmt.int(sel.district_pop_proxy)}/>
            <Stat icon={Building2}   label="Facilities"
                  value={fmt.int(sel.total_facilities)}/>
            <Stat icon={Stethoscope} label="Hospitals + clinics"
                  value={fmt.int(sel.hospitals_clinics)}/>
            <Stat icon={Pill}        label="Pharmacies"
                  value={fmt.int(sel.pharmacies)}/>
            <Stat icon={Route}       label="Median nearest hosp"
                  value={sel.median_nn_km_hosp != null
                         ? `${fmt.float1(sel.median_nn_km_hosp)} km` : "—"}/>
            <Stat icon={Sparkles}    label="Type diversity"
                  value={fmt.int(sel.type_diversity)}/>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3
                          gap-2 text-xs">
            <Mini label="Per 100k"
                  value={fmt.float1(sel.facilities_per_100k)}/>
            <Mini label="Hosp/100k"
                  value={fmt.float1(sel.hosp_per_100k)}/>
            <Mini label="Pharm/100k"
                  value={fmt.float1(sel.pharm_per_100k)}/>
          </div>
        </div>

        {/* Recommendations */}
        <RecommendationsCard recs={recs}/>

        {/* Forecast */}
        <ForecastChart rows={fcst}/>
      </motion.div>
    </AnimatePresence>
  );
}

function Stat({ icon: Icon, label, value }: {
  icon: any; label: string; value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-cyan-300 mt-0.5"/>
      <div>
        <div className="text-[11px] text-slate-400 uppercase tracking-wide">
          {label}
        </div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}
function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-slate-400">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}
