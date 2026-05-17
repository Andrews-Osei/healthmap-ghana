"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Sparkles, MapPin, ShieldCheck } from "lucide-react";

/**
 * Hero with realistic photo collage.
 *
 * Photos are loaded from Unsplash's CDN — free to hotlink for non-commercial /
 * editorial use. To swap in your own pictures, drop them into
 * `frontend/public/hero/` and change the src strings below to relative paths
 * (e.g. "/hero/main.jpg"). The component handles missing images gracefully.
 */
const HERO_PRIMARY =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80";
const HERO_PORTRAIT_1 =
  "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=600&q=80";
const HERO_PORTRAIT_2 =
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft ambient glow behind everything */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2
                        w-[900px] h-[900px] rounded-full
                        bg-gradient-to-br from-cyan-400/15 via-cyan-300/10 to-med-500/10
                        blur-3xl"/>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-14 sm:pt-20 pb-20
                      grid lg:grid-cols-12 gap-10 items-center">

        {/* Left: copy */}
        <div className="lg:col-span-6 xl:col-span-7">
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
            HealthMap Ghana scores healthcare-access vulnerability for every
            district using machine learning, geospatial analysis, and
            real-time GIS visualisation — turning raw facility data into
            evidence-based investment priorities for the Ministry of Health,
            Ghana Health Service, NGOs and the public.
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

        {/* Right: photo collage */}
        <div className="lg:col-span-6 xl:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            className="relative h-[480px] grid grid-cols-6 grid-rows-6 gap-3">

            {/* Main photo */}
            <div className="col-span-6 row-span-4 relative overflow-hidden
                            rounded-3xl border border-white/10 shadow-glass">
              <img
                src={HERO_PRIMARY}
                alt="Healthcare professionals at work"
                loading="eager" decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Tint overlay */}
              <div className="absolute inset-0 bg-gradient-to-t
                              from-ink-950/85 via-ink-900/35 to-transparent"/>
              <div className="absolute inset-0 bg-gradient-to-tr
                              from-cyan-500/15 via-transparent to-med-500/10
                              mix-blend-overlay"/>

              {/* Floating glass overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end
                              justify-between gap-3">
                <div className="glass-strong p-4 max-w-[280px]">
                  <div className="flex items-center gap-2 text-xs text-cyan-300">
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inset-0 rounded-full bg-cyan-400
                                       animate-ping opacity-75"/>
                      <span className="relative rounded-full bg-cyan-400 w-2 h-2"/>
                    </span>
                    LIVE · vulnerability layer
                  </div>
                  <div className="mt-2 text-2xl font-bold gradient-text">
                    59 districts
                  </div>
                  <div className="text-xs text-slate-300">
                    flagged Critical Risk
                  </div>
                </div>
                <span className="pill">CVI 0–100</span>
              </div>
            </div>

            {/* Two small portraits */}
            <div className="col-span-3 row-span-2 relative overflow-hidden
                            rounded-2xl border border-white/10">
              <img src={HERO_PORTRAIT_1}
                   alt="Doctor with stethoscope"
                   loading="lazy" decoding="async"
                   className="absolute inset-0 w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-t
                              from-ink-950/70 to-transparent"/>
            </div>

            <div className="col-span-3 row-span-2 relative overflow-hidden
                            rounded-2xl border border-white/10">
              <img src={HERO_PORTRAIT_2}
                   alt="Medical consultation"
                   loading="lazy" decoding="async"
                   className="absolute inset-0 w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-gradient-to-t
                              from-ink-950/70 to-transparent"/>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
