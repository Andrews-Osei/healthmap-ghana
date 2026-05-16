"use client";
import { Sparkles, Lightbulb } from "lucide-react";
import type { Recommendation } from "@/lib/types";

export default function RecommendationsCard({ recs }: {
  recs: Recommendation[];
}) {
  return (
    <div className="glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400/30
                        to-med-500/30 grid place-items-center">
          <Sparkles className="w-4 h-4 text-cyan-300"/>
        </div>
        <h4 className="text-sm font-semibold">AI Recommendations</h4>
      </div>

      {recs.length === 0 ? (
        <p className="text-xs text-slate-400 italic">
          No interventions triggered — district is well served on every
          dimension.
        </p>
      ) : (
        <ol className="space-y-2.5">
          {recs.map((r, i) => (
            <li key={r.id} className="flex gap-3">
              <div className="shrink-0 w-7 h-7 rounded-full
                              bg-cyan-400/15 grid place-items-center
                              border border-cyan-500/30 text-xs
                              font-mono text-cyan-300">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-semibold text-sm leading-tight">
                    {r.title}
                  </div>
                  <span className="text-[10px] text-cyan-300 font-mono shrink-0">
                    P {r.priority_score.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 leading-snug">
                  {r.rationale}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-3 pt-3 border-t border-white/10 flex items-start
                      gap-2 text-[11px] text-slate-500">
        <Lightbulb className="w-3 h-3 mt-0.5 text-amber-400"/>
        Suggestions are produced by a rule-based engine; review with local
        domain expertise before action.
      </div>
    </div>
  );
}
