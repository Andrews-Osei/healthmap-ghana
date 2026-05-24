"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { askAssistant } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Send, Loader2, MapPin, Stethoscope, AlertCircle, Sparkles, Search,
} from "lucide-react";
import PatientView from "@/components/assistant/PatientView";
import dynamic from "next/dynamic";

const PatientMap = dynamic(
  () => import("@/components/assistant/PatientMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[380px] rounded-xl border border-white/10 bg-ink-900/70
                      grid place-items-center text-xs text-slate-500">
        Loading map…
      </div>
    ),
  },
);

const REGIONS = [
  "Greater Accra","Ashanti","Central","Eastern","Western","Volta","Northern",
  "Upper East","Upper West","Bono","Bono East","Ahafo","Western North",
  "Oti","Savannah","Northern East",
];

const EXAMPLES = [
  "I have a fever and chills, feeling shivery",
  "Severe chest pain and trouble breathing",
  "My child has watery diarrhoea many times",
  "Snake bite on my leg",
  "Running nose and sneezing",
];

type LocMode = "gps" | "town";

export default function AssistantPage() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [locMode, setLocMode] = useState<LocMode>("gps");
  const [town, setTown] = useState("");
  const [coords, setCoords] = useState<{lat: number, lon: number} | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<any>(null);
  const [error, setError]     = useState<string | null>(null);

  function locate() {
    if (!navigator.geolocation) {
      setError("Your browser does not support location. Type a town instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setError("Could not get your location. Type a town/city instead."),
    );
  }

  async function submit() {
    if (!query.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await askAssistant({
        mode: "patient",
        query: query.trim(),
        user_lat: locMode === "gps" ? coords?.lat : undefined,
        user_lon: locMode === "gps" ? coords?.lon : undefined,
        user_region: region || undefined,
        place: locMode === "town" ? (town.trim() || undefined) : undefined,
      });
      setResult(r);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  const tabCls = (active: boolean) =>
    `flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
      active ? "bg-cyan-400/20 text-cyan-200"
             : "text-slate-400 hover:text-slate-200"}`;

  return (
    <>
      <Navbar/>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="grid place-items-center w-12 h-12 rounded-2xl
                          bg-gradient-to-br from-cyan-400 to-med-500
                          shadow-glow shrink-0">
            <Stethoscope className="w-6 h-6 text-ink-950" strokeWidth={2.5}/>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                HealthMap AI <span className="gradient-text">Triage</span>
              </h1>
              <span className="pill"><Sparkles className="w-3 h-3"/> AI-powered</span>
            </div>
            <p className="text-slate-400 mt-1 text-sm max-w-2xl">
              Describe what you&apos;re experiencing. The assistant assesses
              urgency, explains in plain language, and finds the nearest suitable
              hospital, clinic or pharmacy — by your GPS or any town you type.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="glass-strong p-5 sm:p-6 space-y-4">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              Describe your symptoms
            </span>
            <textarea value={query} onChange={e => setQuery(e.target.value)}
                      rows={3} placeholder="e.g. fever, headache, body pain..."
                      className="mt-1 w-full p-3 rounded-lg bg-ink-900/80
                                 border border-white/10 focus:outline-none
                                 focus:border-cyan-400 text-sm
                                 placeholder-slate-600"/>
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            {/* Region */}
            <label className="block">
              <span className="text-[11px] uppercase tracking-wide text-slate-400">
                Region (optional)
              </span>
              <select value={region} onChange={e => setRegion(e.target.value)}
                      className="mt-1 w-full px-3 py-2.5 rounded-lg
                                 bg-ink-900/80 border border-white/10
                                 text-sm focus:outline-none focus:border-cyan-400">
                <option value="">Any region</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>

            {/* Location: GPS or town */}
            <div>
              <span className="text-[11px] uppercase tracking-wide text-slate-400">
                Find facilities near
              </span>
              <div className="mt-1 flex rounded-lg overflow-hidden
                              border border-white/10 bg-ink-900/80">
                <button type="button" onClick={() => setLocMode("gps")}
                        className={tabCls(locMode === "gps")}>
                  My location
                </button>
                <button type="button" onClick={() => setLocMode("town")}
                        className={tabCls(locMode === "town")}>
                  Town / city
                </button>
              </div>

              {locMode === "gps" ? (
                <button type="button" onClick={locate}
                        className="mt-2 w-full px-3 py-2.5 rounded-lg
                                   bg-ink-900/80 border border-white/10
                                   hover:border-cyan-400 text-sm text-left
                                   flex items-center gap-2 transition-colors">
                  <MapPin className="w-4 h-4 text-cyan-300"/>
                  {coords
                    ? `${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}`
                    : "Use my GPS"}
                </button>
              ) : (
                <div className="mt-2 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3
                                     top-1/2 -translate-y-1/2"/>
                  <input value={town} onChange={e => setTown(e.target.value)}
                         onKeyDown={e => e.key === "Enter" && submit()}
                         placeholder="e.g. Tarkwa, Kumasi, Tamale"
                         className="w-full pl-10 pr-3 py-2.5 rounded-lg
                                    bg-ink-900/80 border border-white/10
                                    focus:outline-none focus:border-cyan-400
                                    text-sm placeholder-slate-600"/>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button onClick={submit} disabled={loading || !query.trim()}
                    className="btn-primary disabled:opacity-60
                               disabled:cursor-not-allowed">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin"/> Analysing...</>
              ) : (
                <><Send className="w-4 h-4"/> Get guidance</>
              )}
            </button>
            <span className="text-xs text-slate-500 ml-1">or try:</span>
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setQuery(ex)}
                      className="text-xs px-2 py-1 rounded-md
                                 bg-white/[0.03] border border-white/10
                                 hover:border-cyan-500/40 text-slate-300
                                 transition-colors">
                {ex.length > 38 ? ex.slice(0, 38) + "..." : ex}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="glass p-4 flex items-start gap-2 text-amber-300 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5"/> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {result && (
            <motion.div key={result.urgency + (result.matched_signals?.[0] ?? "")}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}>
              {/* LLM narrative ribbon at the top */}
              {result.narrative && result.narrative_source === "llm" && (
                <div className="glass p-4 mb-4 border-cyan-500/30">
                  <div className="flex items-center gap-2 text-[11px]
                                  uppercase tracking-wide text-cyan-300 mb-2">
                    <Bot className="w-3.5 h-3.5"/>
                    AI explanation
                    <span className="text-slate-500 normal-case font-mono">
                      ({result.llm_model})
                    </span>
                  </div>
                  <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                    {result.narrative}
                  </p>
                </div>
              )}

              {result.search_note && (
                <div className="glass p-3 mb-4 flex items-start gap-2
                                text-amber-300 text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>
                  {result.search_note}
                </div>
              )}

              {result.recommended_facilities?.length > 0 && (
                <div className="mb-4">
                  <PatientMap
                    userLat={result.search_location?.lat ?? coords?.lat}
                    userLon={result.search_location?.lon ?? coords?.lon}
                    locationLabel={result.search_location?.label}
                    facilities={result.recommended_facilities}/>
                </div>
              )}
              <PatientView data={result}/>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
