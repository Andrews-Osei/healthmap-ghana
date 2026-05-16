"use client";
import { motion } from "framer-motion";
import { Database, FlaskConical, Brain, Map } from "lucide-react";

const steps = [
  { icon: Database, title: "Ingest",
    body: "OSM Ghana facilities (GeoPackage), Ghana 2021 census populations, " +
          "geoBoundaries district polygons." },
  { icon: FlaskConical, title: "Engineer features",
    body: "Per-district counts, type diversity, inter-facility distance, " +
          "per-capita supply, urban/rural classifier." },
  { icon: Brain, title: "Score with AI",
    body: "Z-scored Composite Vulnerability Index (5-feature weighted sum) " +
          "+ K-Means risk-tier clustering." },
  { icon: Map, title: "Visualise & act",
    body: "Interactive map, district drill-down, AI recommendations, " +
          "demand forecasts to 2035." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works"
             className="max-w-7xl mx-auto px-5 sm:px-8 py-20 relative">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="pill mb-4">Methodology</span>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold">
          From raw data to <span className="gradient-text">policy decisions</span>
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {steps.map((s, i) => (
          <motion.div key={s.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.07 }}
            className="glass p-6 relative">
            <span className="absolute -top-3 left-5 text-xs font-mono text-cyan-300
                             bg-ink-900 px-2 py-0.5 rounded-full border border-cyan-500/30">
              0{i + 1}
            </span>
            <s.icon className="w-6 h-6 text-cyan-300 mb-3"/>
            <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
