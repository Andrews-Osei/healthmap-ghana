"use client";
import { motion } from "framer-motion";
import { HeartPulse, Globe2, Users, TrendingUp } from "lucide-react";

const points = [
  { icon: HeartPulse, title: "Lives at stake",
    body: "Underserved districts experience higher maternal mortality, " +
          "missed immunizations and preventable disease burden. Closing " +
          "access gaps directly saves lives." },
  { icon: Users, title: "5.7× supply gap",
    body: "Greater Accra has 18.2 facilities per 100k people. Northern " +
          "East has 3.2. The same country, vastly different chances." },
  { icon: TrendingUp, title: "SDG 3.8 — Universal Health Coverage",
    body: "Tracking and reducing inequality in healthcare supply is a " +
          "direct contributor to SDG 3.8 (UHC) and Ghana's national " +
          "health strategy." },
  { icon: Globe2, title: "Beyond Ghana",
    body: "The methodology generalises — same pipeline, different " +
          "country: Nigeria, Kenya, Tanzania, Ethiopia." },
];

export default function WhyItMatters() {
  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="pill mb-4">Why this matters</span>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
          Healthcare access is{" "}
          <span className="gradient-text">measurable, predictable,
          and fixable</span>
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {points.map((p, i) => (
          <motion.div key={p.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="glass p-6 flex gap-4">
            <div className="shrink-0 w-12 h-12 rounded-xl
                            bg-gradient-to-br from-cyan-400/20 to-med-500/20
                            grid place-items-center border border-cyan-500/30">
              <p.icon className="w-6 h-6 text-cyan-300"/>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-slate-400 leading-relaxed">
                {p.body}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
