"use client";
import Link from "next/link";
import { Activity, Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/#features",    label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#stats",       label: "Insights" },
  { href: "/dashboard",    label: "Dashboard" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-ink-950/60
                       border-b border-white/10">
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex items-center
                      justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="grid place-items-center w-9 h-9 rounded-xl
                           bg-gradient-to-br from-cyan-400 to-med-500
                           shadow-glow transition-transform
                           group-hover:scale-105">
            <Activity className="w-5 h-5 text-ink-950" strokeWidth={2.5}/>
          </span>
          <span className="font-semibold text-lg tracking-tight">
            HealthMap <span className="gradient-text">Ghana</span>
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-7 text-sm text-slate-300">
          {links.map(l => (
            <li key={l.href}>
              <Link href={l.href}
                    className="hover:text-cyan-300 transition-colors">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/dashboard" className="btn-primary text-sm">
            Open dashboard
          </Link>
        </div>

        <button className="md:hidden text-slate-300"
                onClick={() => setOpen(v => !v)} aria-label="Toggle menu">
          {open ? <X/> : <Menu/>}
        </button>
      </nav>

      {open && (
        <ul className="md:hidden border-t border-white/10 px-5 py-4 space-y-3
                       bg-ink-950/90">
          {links.map(l => (
            <li key={l.href}>
              <Link href={l.href} onClick={() => setOpen(false)}
                    className="block py-2 text-slate-200 hover:text-cyan-300">
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/dashboard" className="btn-primary w-full text-sm">
              Open dashboard
            </Link>
          </li>
        </ul>
      )}
    </header>
  );
}
