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

const norm = (s: any) => String(s ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();

const facilityColor: Record<string, string> = {
  hospital: "#22d3ee", clinic: "#67e8f9", health_post: "#10b981",
  doctors:  "#7ce3c9", pharmacy: "#f59e0b", dentist: "#a78bfa", CHPs: "#34d399",
};

/* ─────────────────────────────────────────────────────────────────
 *  District layer — imperative
 * ───────────────────────────────────────────────────────────────── */
function DistrictLayer({ publicMode = false }: { publicMode?: boolean }) {
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
    // Public locator view — neutral fill, no vulnerability colouring
    if (publicMode) {
      return { color: "#0c1525", weight: 0.6,
               fillColor: "#1e293b", fillOpacity: 0.5 };
    }
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
  }, [lookup, filters, publicMode]);

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

              if (publicMode) {
                // Public view — locations only, no vulnerability scores
                l.bindTooltip(
                  `<div style="min-width:150px">
                     <div style="font-weight:600">${d.district}</div>
                     <div style="opacity:.7;font-size:12px">${d.region}</div>
                     <div style="opacity:.7;font-size:12px">${d.total_facilities} facilities</div>
                   </div>`,
                  { direction: "top" });
              } else {
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
              }
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
 *  Highlight layer — pulsing pin + glowing outline for the
 *  selected district (so decision-makers see the EXACT place on zoom)
 * ───────────────────────────────────────────────────────────────── */
function HighlightLayer() {
  const map        = useMap();
  const selected   = useDashboard(s => s.selected);
  const idxRef     = useRef<Map<string, any>>(new Map());
  const outlineRef = useRef<L.GeoJSON | null>(null);
  const markerRef  = useRef<L.Marker | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Create a dedicated pane (above the canvas) + load geometry once.
  useEffect(() => {
    if (!map.getPane("hmHighlight")) {
      map.createPane("hmHighlight");
      const p = map.getPane("hmHighlight");
      if (p) { p.style.zIndex = "450"; p.style.pointerEvents = "none"; }
    }
    let aborted = false;
    fetch("/ghana_adm2.geojson")
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then((geo: any) => {
        if (aborted) return;
        const idx = new Map<string, any>();
        for (const f of geo.features ?? []) {
          const pr = f.properties ?? {};
          for (const c of [pr.shapeName, pr.NAME_2, pr.name, pr.adm2_name, pr.ADM2_EN]) {
            if (c) idx.set(norm(c), f);
          }
        }
        idxRef.current = idx;
        setLoaded(true);
      })
      .catch(e => console.error("highlight geojson load failed:", e));
    return () => { aborted = true; };
  }, [map]);

  const clear = useCallback(() => {
    if (outlineRef.current) { outlineRef.current.remove(); outlineRef.current = null; }
    if (markerRef.current)  { markerRef.current.remove();  markerRef.current = null; }
  }, []);

  useEffect(() => {
    clear();
    if (!selected) return;

    const feature = idxRef.current.get(norm(selected.district));
    let center: [number, number] | null =
      (selected.lat_centroid != null && selected.lon_centroid != null)
        ? [selected.lat_centroid, selected.lon_centroid] : null;

    if (feature) {
      try {
        const outline = L.geoJSON(feature, {
          pane: "hmHighlight",
          renderer: L.svg({ pane: "hmHighlight" }),
          interactive: false,
          style: () => ({
            className: "hm-outline",
            color: "#22d3ee", weight: 3, opacity: 1, fill: false,
          }) as any,
        } as any).addTo(map);
        outlineRef.current = outline;
        const b = outline.getBounds();
        if (b.isValid()) {
          if (!center) center = [b.getCenter().lat, b.getCenter().lng];
          map.fitBounds(b, { padding: [40, 40], maxZoom: 11,
                             animate: true, duration: 0.8 });
        }
      } catch (e) { console.error("highlight outline failed:", e); }
    } else if (center) {
      map.flyTo(center, 11, { duration: 0.8 });
    }

    if (center) {
      const icon = L.divIcon({
        className: "hm-pin-wrap",
        html: '<div class="hm-pin"><span class="ring"></span>' +
              '<span class="ring ring2"></span><span class="core"></span></div>',
        iconSize: [20, 20], iconAnchor: [10, 10],
      });
      markerRef.current = L.marker(center, {
        icon, interactive: false, zIndexOffset: 1000,
      }).addTo(map);
    }
  }, [selected, loaded, map, clear]);

  useEffect(() => () => clear(), [clear]);
  return null;
}

/* ─────────────────────────────────────────────────────────────────
 *  Component
 * ───────────────────────────────────────────────────────────────── */
export default function ChoroplethMap({ publicMode = false }: { publicMode?: boolean }) {
  const facilitiesTotal = useDashboard(s => s.facilities.length);
  const [zoom, setZoom] = useState(7);
  const onZoom = useCallback((z: number) => setZoom(z), []);

  return (
    <div className="relative h-full w-full rounded-2xl overflow-hidden
                    border border-white/10">
      {/* Pulsing pin + glowing outline animations */}
      <style>{`
        @keyframes hmPulseRing {
          0%   { transform: scale(0.5); opacity: 0.85; }
          70%  { transform: scale(2.8); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes hmOutline {
          0%, 100% { stroke-opacity: 1;   stroke-width: 2; }
          50%      { stroke-opacity: 0.3; stroke-width: 6; }
        }
        .hm-pin-wrap { background: transparent !important; border: none !important; }
        .hm-pin { position: relative; width: 20px; height: 20px; }
        .hm-pin .ring {
          position: absolute; inset: 0; border-radius: 9999px;
          background: rgba(34, 211, 238, 0.55);
          animation: hmPulseRing 1.5s ease-out infinite;
        }
        .hm-pin .ring2 { animation-delay: 0.75s; }
        .hm-pin .core {
          position: absolute; left: 50%; top: 50%;
          width: 11px; height: 11px; margin: -5.5px 0 0 -5.5px;
          border-radius: 9999px; background: #22d3ee;
          border: 2px solid #04101e;
          box-shadow: 0 0 9px 2px rgba(34, 211, 238, 0.95);
        }
        path.hm-outline {
          filter: drop-shadow(0 0 6px #22d3ee);
          animation: hmOutline 1.3s ease-in-out infinite;
        }
      `}</style>

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

        <DistrictLayer publicMode={publicMode}/>
        <FacilityLayer onZoom={onZoom}/>
        <HighlightLayer/>
      </MapContainer>

      <Legend zoom={zoom} total={facilitiesTotal} publicMode={publicMode}/>
    </div>
  );
}

function Legend({ zoom, total, publicMode = false }: { zoom: number; total: number; publicMode?: boolean }) {
  return (
    <div className="absolute bottom-3 left-3 glass p-3 text-xs space-y-2
                    pointer-events-none z-[400]">
      {publicMode ? (
        <div>
          <div className="font-semibold mb-1">Health facilities</div>
          <div className="text-[10px] text-slate-400">Locations across Ghana</div>
        </div>
      ) : (
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
      )}
      <div className="border-t border-white/10 pt-2 text-[11px] text-slate-400">
        {zoom < FACILITY_ZOOM_THRESHOLD
          ? `Zoom in (${zoom}/${FACILITY_ZOOM_THRESHOLD}+) to see ${total} facilities`
          : `Facilities visible · zoom ${zoom}`}
      </div>
    </div>
  );
}
