"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, X, Send, Loader2, Bot, Briefcase, Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { askAssistant } from "@/lib/api";
import { useDashboard } from "@/store/dashboard";
import DecisionMakerView from "@/components/assistant/DecisionMakerView";

const REGIONS = [
  "Greater Accra","Ashanti","Central","Eastern","Western","Volta","Northern",
  "Upper East","Upper West","Bono","Bono East","Ahafo","Western North",
  "Oti","Savannah","Northern East",
];

/**
 * Floating "Ask the analyst" button — visible on the dashboard only
 * for users with admin or analyst role. Opens a side panel chat that
 * queries the decision-maker AI assistant.
 */
export default function AdminAssistantFab() {
  const { user, isAuthenticated } = useAuth();
  const allowed = isAuthenticated && (user?.role === "admin" || user?.role === "analyst");
  const filters = useDashboard(s => s.filters);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<any>(null);
  const [error, setError]     = useState<string | null>(null);

  // Pre-populate region from active dashboard filter
  useEffect(() => {
    if (filters.region && filters.region !== "All") setRegion(filters.region);
  }, [filters.region]);

  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!allowed) return null;

  async function ask() {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await askAssistant({
        mode: "decision_maker",
        query: query.trim() || undefined,
        filter_region: region || undefined,
      });
      setResult(r);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-[1000]
                   w-14 h-14 rounded-full grid place-items-center
                   bg-gradient-to-br from-cyan-400 to-med-500
                   shadow-glow text-ink-950"
        aria-label="Open analyst assistant">
        {open ? <X className="w-6 h-6" strokeWidth={2.5}/>
              : <MessageSquare className="w-6 h-6" strokeWidth={2.5}/>}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-[999]
                       w-[min(440px,calc(100vw-2rem))]
                       max-h-[78vh] overflow-hidden flex flex-col
                       glass-strong rounded-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center
                            justify-between bg-ink-950/40">
              <div className="flex items-center gap-2">
                <div className="grid place-items-center w-8 h-8 rounded-lg
                                bg-gradient-to-br from-cyan-400/30 to-med-500/30">
                  <Briefcase className="w-4 h-4 text-cyan-300"/>
                </div>
                <div>
                  <div className="text-sm font-semibold">Analyst Assistant</div>
                  <div className="text-[10px] text-slate-500">
                    Policy analytics . {user?.role}
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                      className="text-slate-400 hover:text-cyan-300">
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
              {!result && !loading && (
                <div className="text-slate-400 text-xs">
                  Ask about underserved districts, coverage gaps, or policy
                  priorities. The current map filter ({filters.region === "All"
                    ? "national" : filters.region}) pre-fills below.
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-2 text-cyan-300 text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin"/>
                  Running analysis...
                </div>
              )}

              {error && (
                <div className="text-amber-300 text-xs p-2 rounded-lg
                                bg-amber-500/10 border border-amber-500/30">
                  {error}
                </div>
              )}

              {result && (
                <div className="space-y-3">
                  {result.narrative && result.narrative_source === "llm" && (
                    <div className="p-3 rounded-lg bg-cyan-400/5
                                    border border-cyan-500/20">
                      <div className="flex items-center gap-1.5 text-[10px]
                                      uppercase tracking-wide text-cyan-300 mb-1">
                        <Bot className="w-3 h-3"/> AI summary
                        <span className="text-slate-500 normal-case font-mono">
                          ({result.llm_model})
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed
                                    whitespace-pre-wrap">
                        {result.narrative}
                      </p>
                    </div>
                  )}
                  <DecisionMakerView data={result}/>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-white/10 p-3 space-y-2 bg-ink-950/40">
              <select value={region} onChange={e => setRegion(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-md text-xs
                                 bg-ink-900/80 border border-white/10
                                 focus:outline-none focus:border-cyan-400">
                <option value="">National scope</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="flex gap-2">
                <input value={query} onChange={e => setQuery(e.target.value)}
                       onKeyDown={e => e.key === "Enter" && !loading && ask()}
                       placeholder="Ask a policy question (optional)..."
                       className="flex-1 px-3 py-2 rounded-lg text-sm
                                  bg-ink-900/80 border border-white/10
                                  focus:outline-none focus:border-cyan-400
                                  placeholder-slate-600"/>
                <button onClick={ask} disabled={loading}
                        className="btn-primary px-3 py-2 text-sm
                                   disabled:opacity-60">
                  <Send className="w-4 h-4"/>
                </button>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Sparkles className="w-3 h-3"/> Powered by AI
                (gracefully degrades if offline)
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
