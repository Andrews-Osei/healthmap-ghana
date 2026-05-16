import Link from "next/link";
import { Activity, Github, Mail, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-ink-950/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 grid gap-10
                      md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="grid place-items-center w-8 h-8 rounded-lg
                             bg-gradient-to-br from-cyan-400 to-med-500">
              <Activity className="w-4 h-4 text-ink-950" strokeWidth={2.5}/>
            </span>
            <span className="font-semibold">HealthMap <span className="gradient-text">Ghana</span></span>
          </div>
          <p className="text-slate-400 max-w-md text-sm">
            AI-powered geospatial healthcare intelligence. Built for the
            Ghana AI Innovation Challenge 2026 — Healthcare track.
          </p>
        </div>

        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Platform</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/#features">Features</Link></li>
            <li><Link href="/#how-it-works">How it works</Link></li>
            <li><a href="http://localhost:8000/docs" target="_blank">API docs</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Connect</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2"><Github className="w-4 h-4"/>GitHub</li>
            <li className="flex items-center gap-2"><Mail   className="w-4 h-4"/>Contact</li>
            <li className="flex items-center gap-2"><Globe  className="w-4 h-4"/>ghanaaisummit.com</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} HealthMap Ghana · MIT license · Data:
        OSM (ODbL), Ghana Statistical Service, geoBoundaries (CC-BY)
      </div>
    </footer>
  );
}
