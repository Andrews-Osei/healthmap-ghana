"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Sparkles, MapPin, ShieldCheck } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 sm:pt-24 pb-24
                      grid lg:grid-cols-12 gap-10 items-center">

        {/* Left: copy */}
        <div className="lg:col-span-7">
          <motion.span
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pill">
            <Sparkles className="w-3.5 h-3.5"/>
            Ghana AI Innovation Challenge 2026 · Healthcare track
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold
                       tracking-tight leading-[1.05]">
            AI-powered{" "}
            <span className="gradient-text">healthcare intelligence</span>{" "}
            for every district in Ghana
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 text-slate-300 max-w-2xl text-lg">
            HealthMap Ghana scores healthcare-access vulnerability for all
            212 districts using machine learning, geospatial analysis, and
            real-time GIS visualisation — turning raw facility data into
            evidence-based investment priorities.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard" className="btn-primary">
              Open the live dashboard <ArrowRight className="w-4 h-4"/>
            </Link>
            <Link href="/#how-it-works" className="btn-ghost">
              How it works
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-2
                       text-sm text-slate-400">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-med-400"/> 2,484 facilities mapped
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-300"/> 16 regions · 212 districts
            </span>
            <span className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-300"/> 4-tier risk model
            </span>
          </motion.div>
        </div>

        {/* Right: stylised map vignette */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative glass p-3 h-[440px] overflow-hidden">

            {/* SVG abstract map of Ghana — pure decorative */}
            <svg viewBox="0 0 320 420" className="w-full h-full"
                 xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%"  stopColor="#22d3ee" stopOpacity=".7"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity=".6"/>
                </linearGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="3"/></filter>
              </defs>
              {/* Stylised Ghana silhouette (approximation, decorative) */}
              <path
                d="M120 30 L195 35 L210 60 L225 90 L240 130 L235 175 L260 220
                   L255 270 L240 310 L200 360 L150 395 L110 380 L85 330 L75 280
                   L60 230 L70 180 L85 130 L95 80 Z"
                fill="url(#g1)" opacity=".18" stroke="#22d3ee" strokeWidth="1.4"
                strokeOpacity=".6"/>
              <path
                d="M120 30 L195 35 L210 60 L225 90 L240 130 L235 175 L260 220
                   L255 270 L240 310 L200 360 L150 395 L110 380 L85 330 L75 280
                   L60 230 L70 180 L85 130 L95 80 Z"
                fill="none" stroke="#67e8f9" strokeWidth=".6"
                strokeDasharray="3 4" opacity=".8"/>
              {/* District dots */}
              {[
                [140,80,"#10b981"],[180,100,"#10b981"],[170,140,"#10b981"],
                [160,180,"#eab308"],[190,200,"#eab308"],[140,220,"#f59e0b"],
                [200,260,"#ef4444"],[170,290,"#ef4444"],[210,330,"#f59e0b"],
                [150,310,"#ef4444"],[125,260,"#eab308"],[225,160,"#10b981"],
                [195,75,"#10b981"],[120,140,"#10b981"],[100,200,"#eab308"],
                [110,300,"#f59e0b"],[155,360,"#ef4444"],[185,360,"#ef4444"],
              ].map(([x,y,c], i) => (
                <g key={i}>
                  <circle cx={x as number} cy={y as number} r="4"
                          fill={c as string} filter="url(#glow)"/>
                  <circle cx={x as number} cy={y as number} r="6"
                          fill="none" stroke={c as string} strokeOpacity=".6">
                    <animate attributeName="r" from="4" to="12" dur="2.4s"
                             begin={`${i*0.15}s`} repeatCount="indefinite"/>
                    <animate attributeName="opacity" from=".6" to="0" dur="2.4s"
                             begin={`${i*0.15}s`} repeatCount="indefinite"/>
                  </circle>
                </g>
              ))}
              {/* Pulsing scan line */}
              <line x1="60" y1="200" x2="260" y2="200"
                    stroke="#22d3ee" strokeOpacity=".25" strokeWidth="1">
                <animate attributeName="y1" values="60;390;60" dur="6s"
                         repeatCount="indefinite"/>
                <animate attributeName="y2" values="60;390;60" dur="6s"
                         repeatCount="indefinite"/>
              </line>
            </svg>

            <div className="absolute bottom-3 left-3 right-3 flex justify-between
                            items-center gap-2 text-xs">
              <span className="pill">LIVE · Vulnerability layer</span>
              <span className="text-slate-400">CVI 0–100</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
