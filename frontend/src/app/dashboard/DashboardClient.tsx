"use client";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useDashboard } from "@/store/dashboard";
import { api } from "@/lib/api";

import KpiStrip            from "@/components/dashboard/KpiStrip";
import FilterPanel         from "@/components/dashboard/FilterPanel";
import DistrictSidebar     from "@/components/dashboard/DistrictSidebar";
import TopUnderservedTable from "@/components/dashboard/TopUnderservedTable";
import RegionBreakdown     from "@/components/dashboard/RegionBreakdown";

// Leaflet must be client-only
const ChoroplethMap = dynamic(
  () => import("@/components/dashboard/ChoroplethMap"),
  { ssr: false, loading: () => <MapSkeleton/> },
);

export default function DashboardClient() {
  const { setData, setError, loading, error } = useDashboard();

  useEffect(() => {
    Promise.all([api.districts(), api.regions(), api.facilities()])
      .then(([districts, regions, facilities]) =>
        setData({ districts, regions, facilities }))
      .catch(e => setError(String(e)));
  }, [setData, setError]);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-4">

      {/* Top KPI strip */}
      {loading
        ? <KpiSkeleton/>
        : <KpiStrip/>}

      {/* Filters */}
      <FilterPanel/>

      {/* Map + sidebar */}
      <div className="grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 h-[640px]">
          <ChoroplethMap/>
        </div>
        <div className="lg:col-span-4 h-[640px] overflow-hidden">
          <DistrictSidebar/>
        </div>
      </div>

      {/* Bottom analytics */}
      <div className="grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7"><TopUnderservedTable n={12}/></div>
        <div className="lg:col-span-5"><RegionBreakdown/></div>
      </div>

      {error && (
        <div className="glass p-4 text-amber-300 text-sm">
          API error: {error}.  Make sure the FastAPI backend is running on{" "}
          <code>http://localhost:8000</code>.
        </div>
      )}
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
