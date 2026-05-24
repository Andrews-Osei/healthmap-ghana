"use client";
import { ExternalLink, Phone, AlertTriangle, MapPin, Compass,
         CheckCircle2, ShieldAlert, Clock4 } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  hospital: "Hospital", clinic: "Clinic", health_post: "Health post",
  doctors: "Doctor", pharmacy: "Pharmacy", dentist: "Dental clinic",
  CHPs: "CHPS compound",
};
const typeLabel = (a?: string) =>
  (a && TYPE_LABEL[a]) || (a ? a[0].toUpperCase() + a.slice(1) : "Facility");

const URGENCY_STYLE: Record<string, {bg: string; fg: string; border: string;
                                     icon: any; label: string}> = {
  emergency: { bg: "bg-red-500/15",    fg: "text-red-300",
               border: "border-red-500/40", icon: AlertTriangle,
               label: "EMERGENCY — call 112 or 193" },
  high:      { bg: "bg-orange-500/15", fg: "text-orange-300",
               border: "border-orange-500/40", icon: ShieldAlert,
               label: "HIGH urgency — same-day care" },
  moderate:  { bg: "bg-yellow-500/15", fg: "text-yellow-300",
               border: "border-yellow-500/40", icon: Clock4,
               label: "MODERATE — clinic visit soon" },
  low:       { bg: "bg-emerald-500/15", fg: "text-emerald-300",
               border: "border-emerald-500/40", icon: CheckCircle2,
               label: "LOW urgency — self-care + pharmacy" },
};

export default function PatientView({ data }: { data: any }) {
  if (data?.error) {
    return <p className="text-sm text-amber-300">{data.error}</p>;
  }
  const u = URGENCY_STYLE[data.urgency] ?? URGENCY_STYLE.moderate;
  const Icon = u.icon;
  const nearest = data.map_locator?.nearest ?? data.recommended_facilities?.[0] ?? null;
  const nearestUrl = nearest ? (nearest.directions_url ?? nearest.navigation_url) : null;

  return (
    <div className="space-y-4">
      {/* Urgency banner */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${u.bg} ${u.border}`}>
        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${u.fg}`}/>
        <div className="flex-1">
          <div className={`text-xs uppercase tracking-wide font-semibold ${u.fg}`}>
            {u.label}
          </div>
          <p className="mt-1 text-sm text-slate-200 leading-relaxed">
            {data.summary}
          </p>
        </div>
      </div>

      {/* Emergency numbers if applicable */}
      {data.emergency_numbers && (
        <div className="glass p-4">
          <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-3
                         flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-red-400"/> Call now
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            {Object.entries(data.emergency_numbers as Record<string, string>).map(
              ([label, num]) => (
                <a key={label} href={`tel:${(num as string).split(' ')[0]}`}
                   className="p-3 rounded-lg bg-red-500/10 border border-red-500/30
                              hover:bg-red-500/20 transition-colors">
                  <div className="text-[10px] uppercase text-slate-400">{label}</div>
                  <div className="font-mono font-bold text-red-300">{num}</div>
                </a>
              ))}
          </div>
        </div>
      )}

      {/* What to do now */}
      <div className="glass p-4">
        <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-2">
          What to do now
        </h4>
        <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans
                        leading-relaxed">{data.what_to_do_now}</pre>
      </div>

      {/* Nearest care — most prominent locator */}
      {nearest && (
        <div className="glass-strong p-4 border border-cyan-500/30">
          <div className="text-[11px] uppercase tracking-wide text-cyan-300 mb-2
                          flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5"/> Nearest care
          </div>
          <div className="font-semibold text-lg leading-tight">{nearest.name}</div>
          <div className="text-xs text-slate-400 mt-1">
            {typeLabel(nearest.type ?? nearest.amenity)}
            {nearest.district ? ` · ${nearest.district}` : ""}
            {nearest.region ? ` · ${nearest.region}` : ""}
            {nearest.distance_km != null && (
              <> · <b className="text-slate-200">{nearest.distance_km} km away</b></>
            )}
          </div>
          {nearestUrl && (
            <a href={nearestUrl} target="_blank" rel="noreferrer"
               className="btn-primary text-sm mt-3">
              <Compass className="w-4 h-4"/> Get directions
            </a>
          )}
        </div>
      )}

      {/* Recommended facilities */}
      <div className="glass p-4">
        <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-3
                       flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-cyan-300"/>
          Recommended facilities ({data.recommended_facilities.length})
        </h4>
        <ol className="space-y-2">
          {data.recommended_facilities.map((f: any, i: number) => (
            <li key={f.id} className="p-3 rounded-lg bg-white/[0.03]
                                       border border-white/10
                                       hover:border-cyan-500/40 transition-colors">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-cyan-400/15
                                 grid place-items-center text-xs font-mono
                                 text-cyan-300 border border-cyan-500/30">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold truncate">{f.name}</div>
                    <span className="text-[10px] text-cyan-300 font-mono shrink-0">
                      {(f.suitability * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {typeLabel(f.amenity)} . {f.district ?? "—"} . {f.region ?? "—"}
                    {f.distance_km != null && (
                      <> . <b className="text-slate-200">{f.distance_km} km</b></>
                    )}
                  </div>
                  <a href={f.navigation_url} target="_blank" rel="noreferrer"
                     className="mt-2 inline-flex items-center gap-1 text-xs
                                text-cyan-300 hover:underline">
                    <Compass className="w-3 h-3"/> Get directions
                    <ExternalLink className="w-3 h-3"/>
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Safety notes */}
      {data.safety_notes?.length > 0 && (
        <div className="glass p-4">
          <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-2">
            Safety notes
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {data.safety_notes.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">!</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-slate-500 italic px-1">
        {data.disclaimer}
      </p>
    </div>
  );
}
