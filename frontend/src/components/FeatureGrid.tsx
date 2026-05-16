"use client";
import { motion } from "framer-motion";
import {
  Map, Brain, BarChart3, Bell, ShieldCheck, Sparkles, Cpu, LineChart,
  Layers,
} from "lucide-react";

const features = [
  { icon: Map, title: "Interactive choropleth map",
    body: "Pan, zoom and hover every district. Layer facility markers, " +
          "vulnerability heatmaps and population density." },
  { icon: Brain, title: "AI vulnerability scoring",
    body: "Composite 0–100 index from facility density, supply, " +
          "inter-facility distance and type diversity — clustered into " +
          "four risk tiers." },
  { icon: Layers, title: "Multi-layer GIS",
    body: "Toggle facility types, regions, risk tiers and urban/rural " +
          "filters in real time." },
  { icon: Sparkles, title: "Recommendation engine",
    body: "AI suggests targeted interventions — new CHPS compounds, " +
          "mobile clinics, road improvements, personnel allocation." },
  { icon: LineChart, title: "Demand forecasting",
    body: "Project 2026 / 2030 / 2035 facility-shortfall scenarios " +
          "under Ghana's population-growth trajectory." },
  { icon: BarChart3, title: "Real-time analytics",
    body: "Region rollups, district leaderboards, score distributions " +
          "and trend dashboards built on Recharts." },
  { icon: Bell, title: "Priority alerts",
    body: "Surface the top-N most underserved districts so policymakers " +
          "know where to invest first." },
  { icon: Cpu, title: "Production-grade backend",
    body: "FastAPI service, pre-computed ML artefacts, Postgres + PostGIS " +
          "upgrade path, JWT-ready auth." },
  { icon: ShieldCheck, title: "Open & auditable",
    body: "Public datasets (OSM, geoBoundaries, Ghana census). Open " +
          "methodology. MIT licence on the codebase." },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="pill mb-4">Platform capabilities</span>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
          A complete <span className="gradient-text">healthcare-access
          intelligence stack</span>
        </h2>
        <p className="mt-3 text-slate-300">
          One platform for policymakers, researchers, NGOs and the public —
          combining GIS mapping, machine learning, analytics and AI
          recommendations.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
            className="glass p-5 group hover:shadow-glow transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-cyan-400/15
                            grid place-items-center mb-3">
              <f.icon className="w-5 h-5 text-cyan-300"/>
            </div>
            <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
