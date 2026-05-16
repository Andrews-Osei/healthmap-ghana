"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Github } from "lucide-react";

export default function CTA() {
  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="glass-strong relative overflow-hidden p-10 sm:p-14 text-center">

        <div className="absolute inset-0 -z-10 opacity-60">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px]
                          h-[600px] rounded-full
                          bg-gradient-to-br from-cyan-400/30 to-med-500/20 blur-3xl"/>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Ready to <span className="gradient-text">map Ghana's
          healthcare future</span>?
        </h2>
        <p className="mt-4 text-slate-300 max-w-xl mx-auto">
          Open the live dashboard, drill into any district, and see the
          AI's intervention recommendations in seconds.
        </p>
        <div className="mt-8 flex justify-center flex-wrap gap-3">
          <Link href="/dashboard" className="btn-primary">
            Launch dashboard <ArrowRight className="w-4 h-4"/>
          </Link>
          <a href="https://github.com/" target="_blank"
             className="btn-ghost">
            <Github className="w-4 h-4"/> View source
          </a>
        </div>
      </motion.div>
    </section>
  );
}
