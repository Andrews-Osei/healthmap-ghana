"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, useMap, LayersControl } from "react-leaflet";
import L, { type LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useDashboard } from "@/store/dashboard";
import { cviColor } from "@/lib/utils";
import type { District } from "@/lib/types";

const GHANA_CENTER: [number, number] = [7.95, -1.0];
const GHANA_BOUNDS: LatLngBoundsExpression = [[4.6, -3.4], [11.3, 1.3]];
const FACILITY_ZOOM_THRESHOLD = 9;
const FACILITY_RENDER_CAP = 600;

const facilityColor: Record<string, string> = {
  hospital: "#22d3ee", clinic: "#67e8f9", health_post: "#10b981",
  doctors:  "#7ce3c9", pharmacy: "#f59e0b", dentist: "#a78bfa", CHPs: "#34d399",
};

/* ─────────────────────────────────────────────────────────────────
 *  District layer — imperative
 * ───────────────────────────────────────────────────────────────── */
function DistrictLayer() {
  const map       = useMap();
  const districts = useDashboard(s => s.districts);
  const filters   = useDashboard(s => s.filters);
  const select    = useDashboard(s => s.select);

  const layerRef   = useRef<L.GeoJSON | null>(null);
  const fetchedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const districtIndex = useMemo(() => {
    const idx = new Map<string, District>();
    for (const d of districts) {
      idx.set(d.district.toLowerCase(), d);
      idx.set(d.district.replace(/[^a-z0-9]/gi, "").toLowerCase(), d);
    }
    return idx;
  }, [districts]);

  const lookup = useCallback((props: any): District | null => {
    if (!props) return null;
    const candidates = [
      props.shapeName, props.NAME_2, props.name, props.adm2_name, props.ADM2_EN,
    ].filter(Boolean) as string[];
    for (const c of candidates) {
      const v = districtIndex.get(String(c).toLowerCase()) ??
                districtIndex.get(String(c).replace(/[^a-z0-9]/gi, "").toLowerCase());
      if (v) return v;
    }
    return null;
  }, [districtIndex]);

  const stylesFor = useCallback((feature: any) => {
    const d = lookup(feature?.properties);
    if (!d) return { color: "#1f2a44", weight: 0.5,
                     fillColor: "#1a2640", fillOpacity: 0.35 };
    // Pending district — slate grey, dashed border
    if (d.data_status === "no_data_yet") {
      return { color: "#475569", weight: 0.6, dashArray: "3 3",
               fillColor: "#334155", fillOpacity: 0.45 };
    }
    const passes = (filters.region   === "All" || d.region    === filters.region)
                && (filters.riskTier === "All" || d.risk_tier === filters.riskTier)
                && (filters.urbanRural === "All"
                    || (filters.urbanRural === "Urban" ? d.is_urban : !d.is_urban));
    return {
      color: "#0c1525", weight: 0.6,
      fillColor: cviColor(d.CVI_0_100),
      fillOpacity: passes ? 0.78 : 0.16,
    };
  }, [lookup, filters]);

  useEffect(() => {
    if (fetchedRef.current || districts.length === 0) return;
    fetchedRef.current = true;
    let aborted = false;

    fetch("/ghana_adm2.geojson")
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(geo => {
        if (aborted) return;
        try {
          const layer = L.geoJSON(geo, {
            style: (f) => stylesFor(f),
            onEachFeature: (feature, l) => {
              const d = lookup(feature.properties);
              if (!d) {
                l.bindTooltip(
                  `<div style="font-size:12px">
                     <div style="font-weight:600">
                       ${feature.properties?.shapeName ?? "Unknown"}</div>
                     <div style="opacity:.7">No matching district data</div>
                   </div>`,
                  { direction: "top" });
                return;
              }
              l.on({
                click: () => select(d),
                mouseover: (e) => {
                  const t = e.target as L.Path;
                  t.setStyle({ weight: 2, color: "#22d3ee" });
                  if ((t as any).bringToFront) (t as any).bringToFront();
                },
                mouseout: (e) => layerRef.current?.resetStyle(e.target),
              });

              // Null-safe tooltip: works for scored AND no_data_yet districts
              const cviStr  = d.CVI_0_100 != null
                                ? `CVI <b>${d.CVI_0_100.toFixed(1)}</b>`
                                : "Awaiting OSM data";
              const tierStr = d.risk_tier;
              const facStr  = `${d.total_facilities} facilities · ` +
                              `${(d.facilities_per_100k ?? 0).toFixed(1)} / 100k`;

              l.bindTooltip(
                `<div style="min-width:170px">
                   <div style="font-weight:600">${d.district}</div>
                   <div style="opacity:.7;font-size:12px">${d.region}</div>
                   <div style="margin-top:4px">${cviStr} · ${tierStr}</div>
                   <div style="opacity:.7;font-size:12px">${facStr}</div>
                 </div>`,
                { direction: "top" });
            },
          }).addTo(map);
          layerRef.current = layer;
        } catch (err: any) {
          console.error("L.geoJSON failed:", err);
          setError(`Render failed: ${err?.message ?? err}`);
        }
      })
      .catch(e => {
        console.error("GeoJSON fetch failed:", e);
        setError(String(e));
      });

    return () => { aborted = true; };
  }, [districts, map, select, lookup, stylesFor]);

  useEffect(() => {
    layerRef.current?.setStyle(stylesFor as any);
  }, [filters, stylesFor]);

  useEffect(() => () => {
    layerRef.current?.remove();
    layerRef.current = null;
  }, []);

  return error ? (
    <div className="absolute top-3 left-3 right-3 z-[1000] glass p-3
                    text-xs text-amber-300 max-w-md">
      District layer error: <code>{error}</code>
      <div className="text-slate-400 mt-1">
        Open browser DevTools console for details.
      </div>
    </div>
  ) : null;
}

/* ─────────────────────────────────────────────────────────────────
 *  Facility layer — imperative, canvas-backed
 * ───────────────────────────────────────────────────────────────── */
function FacilityLayer({ onZoom }: { onZoom: (z: number) => void }) {
  const map        = useMap();
  const facilities = useDashboard(s => s.facilities);
  const filters    = useDashboard(s => s.filters);
  const groupRef    = useRef<L.LayerGroup | null>(null);
  const rendererRef = useRef<L.Renderer | null>(null);
  const [zoom, setZoom] = useState(7);

  useEffect(() => {
    rendererRef.current = L.canvas({ padding: 0.5 });
    groupRef.current    = L.layerGroup().addTo(map);
    return () => {
      groupRef.current?.remove();
      groupRef.current = null;
      rendererRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const h = () => { const z = map.getZoom(); setZoom(z); onZoom(z); };
    h();
    map.on("zoomend", h);
    return () => { map.off("zoomend", h); };
  }, [map, onZoom]);

  useEffect(() => {
    const group    = groupRef.current;
    const renderer = rendererRef.current;
    if (!group || !renderer || facilities.length === 0) return;
    group.clearLayers();

    const filtered = facilities.filter(f =>
         (filters.region  === "All" || f.region  === filters.region)
      && (filters.amenity === "All" || f.amenity === filters.amenity));

    const hasNarrowing =
      filters.region !== "All" || filters.amenity !== "All";
    if (zoom < FACILITY_ZOOM_THRESHOLD && !hasNarrowing) return;

    const visible = filtered.slice(0, FACILITY_RENDER_CAP);
    for (const f of visible) {
      const m = L.circleMarker([f.lat, f.lon], {
        renderer, radius: 3, color: "#04101e", weight: 0.6,
        fillColor: facilityColor[f.amenity] ?? "#94a3b8",
        fillOpacity: 0.9,
      });
      m.bindTooltip(
        `<div style="font-size:12px">
           <div style="font-weight:600">${f.name ?? "Unnamed facility"}</div>
           <div style="opacity:.7">
             ${f.amenity} · ${f.district ?? ""} · ${f.region ?? ""}
           </div>
         </div>`,
        { direction: "top" });
      m.addTo(group);
    }
  }, [facilities, filters, zoom]);

  return null;
}

/* ─────────────────────────────────────────────────────────────────
 *  Fly to selected district
 * ───────────────────────────────────────────────────────────────── */
function FlyTo() {
  const map = useMap();
  const sel = useDashboard(s => s.selected);
  useEffect(() => {
    if (sel && sel.lat_centroid && sel.lon_centroid) {
      map.flyTo([sel.lat_centroid, sel.lon_centroid], 10, { duration: 0.8 });
    }
  }, [sel, map]);
  return null;
}

/* ─────────────────────────────────────────────────────────────────
 *  Component
 * ───────────────────────────────────────────────────────────────── */
export default function ChoroplethMap() {
  const facilitiesTotal = useDashboard(s => s.facilities.length);
  const [zoom, setZoom] = useState(7);
  const onZoom = useCallback((z: number) => setZoom(z), []);

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden
                    border border-white/10">
      <MapContainer
        center={GHANA_CENTER} zoom={7} minZoom={6}
        maxBounds={GHANA_BOUNDS}
        className="h-full w-full"
        preferCanvas={true}
        scrollWheelZoom={true}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Carto dark">
            <TileLayer
              attribution='&copy; OpenStreetMap &copy; Carto'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"/>
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
          </LayersControl.BaseLayer>
        </LayersControl>

        <DistrictLayer/>
        <FacilityLayer onZoom={onZoom}/>
        <FlyTo/>
      </MapContainer>

      <Legend zoom={zoom} total={facilitiesTotal}/>
    </div>
  );
}

function Legend({ zoom, total }: { zoom: number; total: number }) {
  return (
    <div className="absolute bottom-3 left-3 glass p-3 text-xs space-y-2
                    pointer-events-none z-[400]">
      <div>
        <div className="font-semibold mb-1">Vulnerability Index</div>
        <div className="flex items-center gap-1">
          {[10, 30, 50, 70, 90].map(v => (
            <div key={v} className="w-7 h-3" style={{ background: cviColor(v) }}/>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1
                        w-[150px]">
          <span>0</span><span>50</span><span>100</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
          <div className="w-7 h-3 border border-slate-500"
               style={{ background: "#334155" }}/>
          No data yet
        </div>
      </div>
      <div className="border-t border-white/10 pt-2 text-[11px] text-slate-400">
        {zoom < FACILITY_ZOOM_THRESHOLD
          ? `Zoom in (${zoom}/${FACILITY_ZOOM_THRESHOLD}+) to see ${total} facilities`
          : `Facilities visible · zoom ${zoom}`}
      </div>
    </div>
  );
}
