"use client";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Lock, ShieldCheck, ArrowRight, BarChart3, Map as MapIcon } from "lucide-react";
import { useDashboard } from "@/store/dashboard";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

import KpiStrip            from "@/components/dashboard/KpiStrip";
import FilterPanel         from "@/components/dashboard/FilterPanel";
import DistrictSidebar     from "@/components/dashboard/DistrictSidebar";
import TopUnderservedTable from "@/components/dashboard/TopUnderservedTable";
import RegionBreakdown     from "@/components/dashboard/RegionBreakdown";
import AdminAssistantFab   from "@/components/dashboard/AdminAssistantFab";
import FacilityFinder      from "@/components/dashboard/FacilityFinder";

// Leaflet must be client-only
const ChoroplethMap = dynamic(
  () => import("@/components/dashboard/ChoroplethMap"),
  { ssr: false, loading: () => <MapSkeleton/> },
);

export default function DashboardClient() {
  const { setData, setError, loading, error } = useDashboard();
  const { user, isAuthenticated } = useAuth();
  const isOfficial = isAuthenticated &&
                     (user?.role === "admin" || user?.role === "analyst");

  useEffect(() => {
    Promise.all([api.districts(), api.regions(), api.facilities()])
      .then(([districts, regions, facilities]) =>
        setData({ districts, regions, facilities }))
      .catch(e => setError(String(e)));
  }, [setData, setError]);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-4">

      {/* Public banner — shown when not signed in as an official */}
      {!isOfficial && <PublicBanner/>}

      {/* KPI strip + filters are part of the analytics surface (officials only) */}
      {isOfficial && (loading ? <KpiSkeleton/> : <KpiStrip/>)}
      {isOfficial && <FilterPanel/>}

      <div className="grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 h-[640px]">
          {/* key forces a clean remount when the auth state flips */}
          <ChoroplethMap key={isOfficial ? "official" : "public"}
                         publicMode={!isOfficial}/>
        </div>
        <div className="lg:col-span-4 h-[640px] overflow-hidden">
          {isOfficial ? <DistrictSidebar/> : <UnlockPanel/>}
        </div>
      </div>

      {/* Facility directory — region + exact-city lookup (everyone) */}
      <FacilityFinder/>

      {/* Sensitive analytics tables — officials only */}
      {isOfficial && (
        <div className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7"><TopUnderservedTable n={12}/></div>
          <div className="lg:col-span-5"><RegionBreakdown/></div>
        </div>
      )}

      {error && (
        <div className="glass p-4 text-amber-300 text-sm">
          API error: {error}. Make sure the FastAPI backend is running on
          <code> http://localhost:8000</code>.
        </div>
      )}

      {/* Floating analyst assistant — only renders for admin/analyst roles */}
      <AdminAssistantFab/>
    </div>
  );
}

/* ── Public-view pieces ──────────────────────────────────────────── */
function PublicBanner() {
  return (
    <div className="glass p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center
                    justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="grid place-items-center w-10 h-10 rounded-xl shrink-0
                        bg-gradient-to-br from-cyan-400/25 to-med-500/25">
          <MapIcon className="w-5 h-5 text-cyan-300"/>
        </div>
        <div>
          <div className="font-semibold">Public facility locator</div>
          <p className="text-sm text-slate-400 mt-0.5 max-w-2xl">
            Browse the location of health facilities across Ghana. Vulnerability
            scores, underserved-district analytics and policy tools are reserved
            for authorised health officials.
          </p>
        </div>
      </div>
      <Link href="/login" className="btn-primary text-sm shrink-0 self-start">
        <ShieldCheck className="w-4 h-4"/> Official sign in
      </Link>
    </div>
  );
}

function UnlockPanel() {
  return (
    <div className="glass-strong h-full p-6 flex flex-col items-center
                    justify-center text-center">
      <div className="grid place-items-center w-14 h-14 rounded-2xl mb-4
                      bg-gradient-to-br from-cyan-400/20 to-med-500/20
                      border border-cyan-500/20">
        <Lock className="w-6 h-6 text-cyan-300"/>
      </div>
      <h3 className="text-lg font-semibold">Decision-maker analytics</h3>
      <p className="text-sm text-slate-400 mt-2 max-w-xs">
        Sign in as a health official to unlock the full intelligence suite:
      </p>
      <ul className="mt-4 space-y-2 text-sm text-slate-300 text-left">
        <li className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-med-400"/>
          District vulnerability (CVI) scores &amp; risk tiers
        </li>
        <li className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-med-400"/>
          Most-underserved districts &amp; coverage gaps
        </li>
        <li className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-med-400"/>
          AI policy recommendations &amp; demand forecasts
        </li>
      </ul>
      <Link href="/login" className="btn-primary text-sm mt-6">
        Official sign in <ArrowRight className="w-4 h-4"/>
      </Link>
    </div>
  );
}

function MapSkeleton() {
  return (
    <div className="h-full rounded-2xl border border-white/10 bg-ink-900/70
                    grid place-items-center">
      <div className="skeleton w-44 h-3 rounded"/>
    </div>
  );
}
function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass p-3 h-[68px]">
          <div className="skeleton h-3 w-24 rounded mb-2"/>
          <div className="skeleton h-6 w-16 rounded"/>
        </div>
      ))}
    </div>
  );
}
